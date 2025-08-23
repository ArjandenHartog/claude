import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';
import { IncomingMessage } from 'http';

interface TerminalSession {
  pty: pty.IPty;
  worktreePath: string;
}

const sessions = new Map<string, TerminalSession>();

// This should be handled by a custom server in production
export async function GET(request: NextRequest) {
  // In development, we'll create a separate WebSocket server
  // In production, this would be handled by the WebSocket upgrade
  return new Response('WebSocket endpoint - use ws:// protocol', { 
    status: 426,
    headers: {
      'Upgrade': 'websocket'
    }
  });
}

export function createTerminalWebSocketServer() {
  const wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', (ws, req: IncomingMessage) => {
    console.log('New WebSocket connection');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'start':
            handleStartTerminal(ws, message);
            break;
          case 'input':
            handleTerminalInput(message);
            break;
          case 'resize':
            handleTerminalResize(message);
            break;
          case 'close':
            handleCloseTerminal(message);
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Clean up any terminals associated with this connection
    });
  });

  return wss;
}

function handleStartTerminal(ws: any, message: any) {
  const { sessionId, worktreePath, cols = 80, rows = 30 } = message;

  if (sessions.has(sessionId)) {
    ws.send(JSON.stringify({ 
      type: 'started', 
      sessionId, 
      isNew: false 
    }));
    return;
  }

  try {
    const shell = process.platform === 'win32' 
      ? 'powershell.exe' 
      : process.env.SHELL || '/bin/bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: worktreePath,
      env: process.env
    });

    const session: TerminalSession = {
      pty: ptyProcess,
      worktreePath
    };

    sessions.set(sessionId, session);

    // Forward terminal output to WebSocket
    ptyProcess.onData((data) => {
      ws.send(JSON.stringify({
        type: 'output',
        sessionId,
        data
      }));
    });

    ptyProcess.onExit(({ exitCode }) => {
      sessions.delete(sessionId);
      ws.send(JSON.stringify({
        type: 'exit',
        sessionId,
        exitCode
      }));
    });

    ws.send(JSON.stringify({ 
      type: 'started', 
      sessionId, 
      isNew: true 
    }));

  } catch (error) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      sessionId,
      error: error instanceof Error ? error.message : 'Failed to start terminal' 
    }));
  }
}

function handleTerminalInput(message: any) {
  const { sessionId, data } = message;
  const session = sessions.get(sessionId);
  
  if (session) {
    session.pty.write(data);
  }
}

function handleTerminalResize(message: any) {
  const { sessionId, cols, rows } = message;
  const session = sessions.get(sessionId);
  
  if (session) {
    session.pty.resize(cols, rows);
  }
}

function handleCloseTerminal(message: any) {
  const { sessionId } = message;
  const session = sessions.get(sessionId);
  
  if (session) {
    session.pty.kill();
    sessions.delete(sessionId);
  }
}
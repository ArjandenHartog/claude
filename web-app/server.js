#!/usr/bin/env node

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const pty = require('node-pty');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const sessions = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create WebSocket server on the same HTTP server
  const wss = new WebSocketServer({ server, path: '/api/terminal-ws' });

  wss.on('connection', (ws, req) => {
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
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function handleStartTerminal(ws, message) {
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

      const session = {
        pty: ptyProcess,
        worktreePath,
        ws
      };

      sessions.set(sessionId, session);

      ptyProcess.onData((data) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'output',
            sessionId,
            data
          }));
        }
      });

      ptyProcess.onExit(({ exitCode }) => {
        sessions.delete(sessionId);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'exit',
            sessionId,
            exitCode
          }));
        }
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

  function handleTerminalInput(message) {
    const { sessionId, data } = message;
    const session = sessions.get(sessionId);
    
    if (session) {
      session.pty.write(data);
    }
  }

  function handleTerminalResize(message) {
    const { sessionId, cols, rows } = message;
    const session = sessions.get(sessionId);
    
    if (session) {
      session.pty.resize(cols, rows);
    }
  }

  function handleCloseTerminal(message) {
    const { sessionId } = message;
    const session = sessions.get(sessionId);
    
    if (session) {
      session.pty.kill();
      sessions.delete(sessionId);
    }
  }

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/terminal-ws`);
  });
});
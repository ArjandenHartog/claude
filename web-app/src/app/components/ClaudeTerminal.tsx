import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface ClaudeTerminalProps {
  worktreePath: string;
  projectId?: string;
  theme?: 'light' | 'dark';
}

export function ClaudeTerminal({ worktreePath, theme = 'dark' }: ClaudeTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string>('');
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Generate session ID for this terminal
    sessionIdRef.current = `terminal_${worktreePath.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    // Create terminal instance with theme-aware colors
    const getTerminalTheme = (currentTheme: 'light' | 'dark') => {
      if (currentTheme === 'light') {
        return {
          background: '#ffffff',
          foreground: '#000000',
          cursor: '#000000',
          cursorAccent: '#ffffff',
          selectionBackground: '#b5b5b5',
        };
      } else {
        return {
          background: '#000000',
          foreground: '#ffffff',
          cursor: '#ffffff',
          cursorAccent: '#000000',
          selectionBackground: '#4a4a4a',
        };
      }
    };

    const term = new Terminal({
      theme: getTerminalTheme(theme),
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      allowTransparency: false,
      convertEol: true,
      scrollback: 10000,
      tabStopWidth: 4,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const serializeAddon = new SerializeAddon();
    const unicode11Addon = new Unicode11Addon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(serializeAddon);
    term.loadAddon(unicode11Addon);

    term.unicode.activeVersion = '11';
    term.open(terminalRef.current);

    fitAddonRef.current = fitAddon;
    setTerminal(term);

    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:3000/api/terminal-ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Start terminal session
      ws.send(JSON.stringify({
        type: 'start',
        sessionId: sessionIdRef.current,
        worktreePath,
        cols: term.cols,
        rows: term.rows
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'started':
            console.log('Terminal session started:', message.sessionId);
            if (!message.isNew) {
              // Restore terminal state if available
              // This would require implementing state restoration
            }
            break;
          case 'output':
            term.write(message.data);
            break;
          case 'exit':
            console.log('Terminal session ended with code:', message.exitCode);
            setIsConnected(false);
            break;
          case 'error':
            console.error('Terminal error:', message.error);
            toast({
              title: 'Terminal Error',
              description: message.error,
              variant: 'destructive',
            });
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // Handle terminal input
    const disposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'input',
          sessionId: sessionIdRef.current,
          data
        }));
      }
    });

    // Handle terminal resize
    const resizeHandler = () => {
      if (fitAddon && ws.readyState === WebSocket.OPEN) {
        setTimeout(() => {
          fitAddon.fit();
          ws.send(JSON.stringify({
            type: 'resize',
            sessionId: sessionIdRef.current,
            cols: term.cols,
            rows: term.rows
          }));
        }, 100);
      }
    };

    window.addEventListener('resize', resizeHandler);
    
    // Initial fit
    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    return () => {
      disposable.dispose();
      window.removeEventListener('resize', resizeHandler);
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'close',
          sessionId: sessionIdRef.current
        }));
        ws.close();
      }
      
      term.dispose();
    };
  }, [worktreePath, theme]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Terminal</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (fitAddonRef.current) {
              fitAddonRef.current.fit();
            }
          }}
        >
          Fit
        </Button>
      </div>
      <div 
        ref={terminalRef} 
        className="flex-1 overflow-hidden"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
}
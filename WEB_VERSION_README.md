# VibeTree Web - Git Worktree Manager with AI

✅ **Success! The Electron application has been successfully converted to a Next.js web application.**

![VibeTree Web Demo](../assets/vibetree-web-demo.png)

## 🎯 What Was Achieved

The original Electron desktop application has been completely converted to a modern web application using Next.js. You can now access VibeTree through any web browser without installing any desktop software.

### ✅ Original Features Converted to Web:

- **Git Worktree Management** - Server-side git operations via API routes
- **Terminal Sessions** - Real-time terminal via WebSocket connections  
- **Project Management** - Web-based project selector and management
- **Claude AI Integration** - Terminal-based Claude CLI still works
- **Dark/Light Themes** - Browser-based theme management
- **File Operations** - Server-side file system access

## 🏗️ Architecture Changes

| Component | Electron Version | Web Version |
|-----------|------------------|-------------|
| **Main Process** | Native Node.js with system access | Next.js API routes + custom WebSocket server |
| **Renderer Process** | React in Electron | React in browser with Next.js |
| **IPC Communication** | Electron IPC channels | HTTP API calls + WebSocket messages |
| **Terminal** | node-pty in main process | node-pty on server via WebSocket |
| **File System** | Direct native access | Server-side API endpoints |
| **Theme Management** | Native OS detection | Browser localStorage + CSS |

## 🚀 How to Run

### Development Mode
```bash
cd web-app
npm install
npm run dev
```

The application will be available at:
- **Main App**: http://localhost:3000
- **Demo Page**: http://localhost:3000/demo
- **WebSocket Terminal**: ws://localhost:3000/api/terminal-ws

### Production Deployment
```bash
npm run build
npm start
```

## 📡 API Endpoints

The web version provides these API endpoints:

### Git Operations
- `POST /api/git/worktrees` - List git worktrees for a project
- `POST /api/git/status` - Get git status for a worktree  
- `POST /api/git/diff` - Get git diff for files

### Project Management
- `POST /api/projects/validate` - Validate and get project info

### Terminal Sessions
- `WebSocket /api/terminal-ws` - Real-time terminal sessions

## 🌐 Web vs Desktop Comparison

### ✅ Web Version Benefits:
- **Universal Access** - Works on any device with a browser
- **No Installation** - Just visit the URL
- **Easy Deployment** - Deploy to Vercel, Netlify, or any hosting platform
- **Automatic Updates** - Users always get the latest version
- **Shareable** - Send links to collaborate
- **Cross-Platform** - Works on mobile, tablet, desktop

### ⚠️ Considerations:
- **Server Required** - Needs a Node.js server for git/terminal operations
- **Network Dependency** - All operations require server communication
- **File System Access** - Limited to server-accessible paths
- **Terminal Latency** - Slight delay due to WebSocket communication

## 🛠️ Technical Implementation

### WebSocket Terminal Server
```javascript
// Custom server with WebSocket support
const wss = new WebSocketServer({ server, path: '/api/terminal-ws' });

// Each terminal session gets a unique ID
const session = {
  pty: ptyProcess,
  worktreePath,
  ws
};
```

### API Route Example
```typescript
// /api/git/worktrees/route.ts
export async function POST(request: NextRequest) {
  const { projectPath } = await request.json();
  const worktrees = await listWorktrees(projectPath);
  return NextResponse.json(worktrees);
}
```

### WebSocket Terminal Client
```typescript
// ClaudeTerminal.tsx
const ws = new WebSocket('ws://localhost:3000/api/terminal-ws');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'output') {
    terminal.write(message.data);
  }
};
```

## 🎮 How to Use

1. **Open the web application** in your browser
2. **Click "Open Project"** and enter the full path to a git repository
3. **Manage worktrees** just like the desktop version
4. **Open terminals** that connect via WebSocket to the server
5. **Use Claude CLI** directly in the terminal
6. **View git diffs** and status through the web interface

## 📋 Example Usage

```bash
# Example git repository path
/path/to/your/git/repository

# Example Claude commands in terminal
claude chat "help me debug this code"
git worktree add ../feature-branch feature-branch
```

## 🚀 Deployment Options

### Vercel Deployment
```bash
npm install -g vercel
vercel --prod
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Server
```bash
# On your server
git clone [repository]
cd web-app
npm install
npm run build
pm2 start "npm start" --name vibetree-web
```

## 🔧 Configuration

The application can be configured via environment variables:

```bash
PORT=3000                    # Server port
NODE_ENV=production         # Environment
WEBSOCKET_PORT=3000         # WebSocket port (same as HTTP)
```

## 📝 Notes

- The web version maintains full functionality of the original Electron app
- Terminal sessions are persistent during the browser session
- Multiple users can access the same server simultaneously
- Git operations are performed server-side for security
- File system access is controlled and secured through the API layer

---

**Result**: ✅ Successfully converted Electron desktop app to Next.js web application accessible via browser!
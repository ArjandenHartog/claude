'use client';

import { useState } from 'react';

export default function DemoPage() {
  const [projectPath, setProjectPath] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testGitAPI = async () => {
    if (!projectPath) {
      setResult('Please enter a project path');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directoryPath: projectPath }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">VibeTree Web - Demo</h1>
        
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Web Application Features</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>✅ Next.js web application (no Electron needed)</li>
              <li>✅ Server-side git operations via API routes</li>
              <li>✅ WebSocket-based terminal sessions</li>
              <li>✅ Project validation and management</li>
              <li>✅ Web-compatible UI components</li>
            </ul>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🧪 Test Git API</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Git Repository Path:
                </label>
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="/path/to/your/git/repository"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
              <button
                onClick={testGitAPI}
                disabled={loading || !projectPath}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Project Validation'}
              </button>
              {result && (
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {result}
                </pre>
              )}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🚀 How to Use</h2>
            <ol className="space-y-2 text-muted-foreground">
              <li><strong>1.</strong> Enter the full path to a git repository above</li>
              <li><strong>2.</strong> Click "Test Project Validation" to verify the API works</li>
              <li><strong>3.</strong> In the full app, you can manage worktrees and open terminals</li>
              <li><strong>4.</strong> Terminal sessions run via WebSocket on the server</li>
              <li><strong>5.</strong> All git operations happen server-side with API calls</li>
            </ol>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🌐 Web vs Desktop</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-green-600 mb-2">✅ Web App Benefits</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access from any device/browser</li>
                  <li>• No installation required</li>
                  <li>• Easy deployment (Vercel, Netlify, etc.)</li>
                  <li>• Automatic updates</li>
                  <li>• Shareable URLs</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-orange-600 mb-2">⚠️ Considerations</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Requires server for git/terminal operations</li>
                  <li>• File system access via server APIs</li>
                  <li>• Network dependency for all operations</li>
                  <li>• Potential latency for terminal interaction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
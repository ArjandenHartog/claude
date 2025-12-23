// This should be handled by a custom server in production
export async function GET() {
  // In development, we'll create a separate WebSocket server
  // In production, this would be handled by the WebSocket upgrade
  return new Response('WebSocket endpoint - use ws:// protocol', { 
    status: 426,
    headers: {
      'Upgrade': 'websocket'
    }
  });
}
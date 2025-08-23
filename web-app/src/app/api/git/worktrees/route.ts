import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { projectPath } = await request.json();
    
    if (!projectPath) {
      return NextResponse.json({ error: 'Project path is required' }, { status: 400 });
    }

    const worktrees = await listWorktrees(projectPath);
    return NextResponse.json(worktrees);
  } catch (error) {
    console.error('Error listing worktrees:', error);
    return NextResponse.json(
      { error: 'Failed to list worktrees' }, 
      { status: 500 }
    );
  }
}

function listWorktrees(projectPath: string): Promise<Array<{ path: string; branch: string; head: string }>> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['worktree', 'list', '--porcelain'], {
      cwd: projectPath
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        const worktrees = parseWorktrees(stdout);
        resolve(worktrees);
      } else {
        reject(new Error(stderr || 'Failed to list worktrees'));
      }
    });
  });
}

function parseWorktrees(output: string): Array<{ path: string; branch: string; head: string }> {
  const worktrees: Array<{ path: string; branch: string; head: string }> = [];
  const lines = output.trim().split('\n');
  
  let currentWorktree: Partial<{ path: string; branch: string; head: string }> = {};
  
  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      // New worktree entry
      if (currentWorktree.path) {
        worktrees.push(currentWorktree as { path: string; branch: string; head: string });
      }
      currentWorktree = { path: line.substring(9) };
    } else if (line.startsWith('HEAD ')) {
      currentWorktree.head = line.substring(4);
    } else if (line.startsWith('branch ')) {
      currentWorktree.branch = line.substring(7);
    } else if (line === 'detached') {
      currentWorktree.branch = 'detached';
    }
  }
  
  // Add the last worktree
  if (currentWorktree.path) {
    worktrees.push(currentWorktree as { path: string; branch: string; head: string });
  }
  
  return worktrees;
}
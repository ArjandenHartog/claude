import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { worktreePath, filePath, staged = false } = await request.json();
    
    if (!worktreePath) {
      return NextResponse.json({ error: 'Worktree path is required' }, { status: 400 });
    }

    const diff = await getGitDiff(worktreePath, filePath, staged);
    return NextResponse.json({ diff });
  } catch (error) {
    console.error('Error getting git diff:', error);
    return NextResponse.json(
      { error: 'Failed to get git diff' }, 
      { status: 500 }
    );
  }
}

function getGitDiff(worktreePath: string, filePath?: string, staged: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['diff'];
    if (staged) {
      args.push('--staged');
    }
    if (filePath) {
      args.push('--', filePath);
    }

    const child = spawn('git', args, {
      cwd: worktreePath
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
        resolve(stdout);
      } else {
        reject(new Error(stderr || 'Failed to get diff'));
      }
    });
  });
}
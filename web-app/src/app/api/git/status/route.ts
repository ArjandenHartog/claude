import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { worktreePath, filePath } = await request.json();
    
    if (!worktreePath) {
      return NextResponse.json({ error: 'Worktree path is required' }, { status: 400 });
    }

    const gitStatus = await getGitStatus(worktreePath);
    return NextResponse.json(gitStatus);
  } catch (error) {
    console.error('Error getting git status:', error);
    return NextResponse.json(
      { error: 'Failed to get git status' }, 
      { status: 500 }
    );
  }
}

function getGitStatus(worktreePath: string): Promise<Array<{ path: string; status: string; staged: boolean; modified: boolean }>> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['status', '--porcelain=v1'], {
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
        const status = parseGitStatus(stdout);
        resolve(status);
      } else {
        reject(new Error(stderr || 'Failed to get status'));
      }
    });
  });
}

function parseGitStatus(output: string): Array<{ path: string; status: string; staged: boolean; modified: boolean }> {
  const files: Array<{ path: string; status: string; staged: boolean; modified: boolean }> = [];
  const lines = output.trim().split('\n').filter(line => line.length > 0);
  
  for (const line of lines) {
    if (line.length < 3) continue;
    
    const indexStatus = line.charAt(0);
    const workTreeStatus = line.charAt(1);
    const filePath = line.substring(3);
    
    let status = '';
    if (indexStatus === 'A' || workTreeStatus === 'A') status = 'added';
    else if (indexStatus === 'M' || workTreeStatus === 'M') status = 'modified';
    else if (indexStatus === 'D' || workTreeStatus === 'D') status = 'deleted';
    else if (indexStatus === 'R') status = 'renamed';
    else if (indexStatus === 'C') status = 'copied';
    else if (indexStatus === '?' && workTreeStatus === '?') status = 'untracked';
    else status = 'unknown';
    
    files.push({
      path: filePath,
      status,
      staged: indexStatus !== ' ' && indexStatus !== '?',
      modified: workTreeStatus !== ' ' && workTreeStatus !== '?'
    });
  }
  
  return files;
}
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { directoryPath } = await request.json();
    
    if (!directoryPath) {
      return NextResponse.json({ error: 'Directory path is required' }, { status: 400 });
    }

    // Check if directory exists and is a git repository
    const isValidProject = await validateProject(directoryPath);
    
    if (!isValidProject) {
      return NextResponse.json({ error: 'Directory is not a valid git repository' }, { status: 400 });
    }

    const projectInfo = await getProjectInfo(directoryPath);
    return NextResponse.json(projectInfo);
  } catch (error) {
    console.error('Error validating project:', error);
    return NextResponse.json(
      { error: 'Failed to validate project' }, 
      { status: 500 }
    );
  }
}

async function validateProject(directoryPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      return false;
    }

    // Check if .git directory exists
    const gitDir = path.join(directoryPath, '.git');
    const gitStats = await fs.stat(gitDir);
    return gitStats.isDirectory();
  } catch {
    return false;
  }
}

async function getProjectInfo(directoryPath: string) {
  const name = path.basename(directoryPath);
  
  return {
    path: directoryPath,
    name,
    id: generateProjectId(directoryPath)
  };
}

function generateProjectId(projectPath: string): string {
  // Simple hash function for project ID
  let hash = 0;
  for (let i = 0; i < projectPath.length; i++) {
    const char = projectPath.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
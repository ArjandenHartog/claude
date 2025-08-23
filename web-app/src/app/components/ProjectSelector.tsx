import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';

interface ProjectSelectorProps {
  onSelectProject: (path: string) => void;
  onClose: () => void;
}

export function ProjectSelector({ onSelectProject, onClose }: ProjectSelectorProps) {
  const [projectPath, setProjectPath] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!projectPath.trim()) {
      setError('Please enter a project path');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/projects/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ directoryPath: projectPath.trim() }),
      });

      if (response.ok) {
        const projectInfo = await response.json();
        onSelectProject(projectPath.trim());
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid project path');
      }
    } catch (error) {
      setError('Failed to validate project path');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select a Git Repository
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter the full path to a git repository directory:
            </p>
            <Input
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              placeholder="/path/to/your/git/repository"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isValidating || !projectPath.trim()}
            >
              {isValidating ? 'Validating...' : 'Open Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
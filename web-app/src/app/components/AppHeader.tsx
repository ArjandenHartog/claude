import { Button } from './ui/button';
import { Moon, Sun, FolderOpen } from 'lucide-react';

interface AppHeaderProps {
  className?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenProject: () => void;
}

export function AppHeader({ className = '', theme, onToggleTheme, onOpenProject }: AppHeaderProps) {
  return (
    <div 
      className={`border-b px-4 py-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            VibeTree Web
          </h1>
          <p className="text-muted-foreground mt-1">
            Vibe code with AI in parallel git worktrees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProject}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Open Project
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleTheme}
            className="rounded-full"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
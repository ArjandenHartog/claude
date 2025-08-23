'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { ProjectSelector } from './components/ProjectSelector';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/toaster';
import { ProjectProvider, useProjects } from './contexts/ProjectContext';
import { Plus, X } from 'lucide-react';

function AppContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const { projects, activeProjectId, addProject, removeProject, setActiveProject } = useProjects();

  useEffect(() => {
    // Get initial theme from localStorage or system
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to system preference
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSelectProject = (path: string) => {
    addProject(path);
    setShowProjectSelector(false);
  };

  const handleCloseProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    removeProject(projectId);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <AppHeader 
        theme={theme} 
        onToggleTheme={toggleTheme}
        onOpenProject={() => setShowProjectSelector(true)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {projects.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Welcome to VibeTree Web</h2>
              <p className="text-muted-foreground mb-6">
                Start by opening a git repository to manage your worktrees and work with Claude AI.
              </p>
              <Button onClick={() => setShowProjectSelector(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Open Project
              </Button>
            </div>
          </div>
        ) : (
          <Tabs 
            value={activeProjectId || undefined} 
            onValueChange={setActiveProject}
            className="flex-1 flex flex-col"
          >
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              {projects.map((project) => (
                <TabsTrigger
                  key={project.id}
                  value={project.id}
                  className="relative group data-[state=active]:bg-accent"
                >
                  {project.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleCloseProject(e, project.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TabsTrigger>
              ))}
              <Button 
                variant="ghost" 
                size="sm"
                className="ml-2"
                onClick={() => setShowProjectSelector(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TabsList>

            {projects.map((project) => (
              <TabsContent 
                key={project.id} 
                value={project.id}
                className="flex-1 mt-0"
              >
                <ProjectWorkspace 
                  projectId={project.id}
                  theme={theme}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {showProjectSelector && (
        <ProjectSelector
          onSelectProject={handleSelectProject}
          onClose={() => setShowProjectSelector(false)}
        />
      )}
      
      <Toaster />
    </div>
  );
}

export default function VibeTreeApp() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg transition-all duration-300 hover:bg-secondary hover:shadow-glow"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun className={`h-4 w-4 transition-all duration-300 ${
        theme === 'light' 
          ? 'rotate-0 scale-100' 
          : '-rotate-90 scale-0'
      }`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-300 ${
        theme === 'dark' 
          ? 'rotate-0 scale-100' 
          : 'rotate-90 scale-0'
      }`} />
    </Button>
  );
};
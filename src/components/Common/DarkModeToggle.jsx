import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const DarkModeToggle = () => {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2.5 rounded-xl transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-slate-800/60 border border-transparent hover:border-gray-200/50 dark:hover:border-indigo-500/15 text-gray-650 dark:text-gray-300 hover:text-blue-600 dark:hover:text-indigo-450 hover:scale-105 active:scale-95 flex items-center justify-center relative"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-500 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-550 -rotate-12 hover:-rotate-0" />
      )}
    </button>
  );
};

export default DarkModeToggle;
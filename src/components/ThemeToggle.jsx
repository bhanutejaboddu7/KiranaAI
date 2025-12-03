import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

const ThemeToggle = ({ className }) => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Check for saved theme or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        } else {
            setTheme('light');
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            setTheme('light');
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50",
                theme === 'dark'
                    ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                    : "bg-orange-100 text-orange-500 hover:bg-orange-200",
                className
            )}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Moon size={20} className="fill-current" />
            ) : (
                <Sun size={20} className="fill-current" />
            )}
        </button>
    );
};

export default ThemeToggle;

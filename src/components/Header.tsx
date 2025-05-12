
import React from 'react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="w-full bg-background border-b border-border py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;

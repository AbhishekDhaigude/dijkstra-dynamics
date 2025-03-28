
import React from 'react';
import { cn } from "@/lib/utils";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const Header: React.FC<HeaderProps> = ({ className, ...props }) => {
  return (
    <header
      className={cn(
        "w-full py-4 px-6 flex items-center justify-between bg-white/70 backdrop-blur-lg border-b border-gray-100 z-10 sticky top-0",
        className
      )}
      {...props}
    >
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
          <div className="text-white font-semibold text-sm">D</div>
        </div>
        <h1 className="text-xl font-medium tracking-tight text-gray-900">Dijkstra Dynamics</h1>
      </div>
      <div className="hidden sm:flex items-center space-x-6">
        <a 
          href="https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          How It Works
        </a>
        <a 
          href="https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Learn More
        </a>
      </div>
    </header>
  );
};

export default Header;

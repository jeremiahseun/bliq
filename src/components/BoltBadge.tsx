import React from 'react';
import { Zap, ExternalLink } from 'lucide-react';

const BoltBadge: React.FC = () => {
  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 group"
      aria-label="Built with Bolt.new"
    >
      <div className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm font-medium">
        <Zap className="w-4 h-4" />
        <span className="hidden sm:inline">Built with</span>
        <span className="font-semibold">Bolt.new</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </a>
  );
};

export default BoltBadge;
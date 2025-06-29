import React from 'react';

const BoltBadge: React.FC = () => {
  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 group"
      aria-label="Powered by Bolt.new"
    >
      <img
        src="/black_circle_360x360.png"
        alt="Powered by Bolt.new"
        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-all duration-300 hover:scale-110 hover:drop-shadow-lg cursor-pointer"
      />
    </a>
  );
};

export default BoltBadge;
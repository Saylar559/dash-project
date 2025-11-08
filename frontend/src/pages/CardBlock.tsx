// components/CardBlock.jsx
import React from 'react';
import './style_page/CardBlock.css';

interface CardBlockProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function CardBlock({ 
  title, 
  icon, 
  children, 
  onClick, 
  className = '' 
}: CardBlockProps) {
  return (
    <div
      className={`card-block ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="card-icon">{icon}</div>
      <h3 className="card-title">{title}</h3>
      <p className="card-desc">{children}</p>
    </div>
  );
}
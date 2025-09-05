import React, { useState, useCallback } from 'react';

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({ 
  children, 
  className = '', 
  disabled = false 
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback((event: React.MouseEvent) => {
    if (disabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    const newRipple: Ripple = { id, x, y };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  }, [disabled]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseDown={createRipple}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-white/20 animate-ripple"
          style={{
            left: ripple.x - 2,
            top: ripple.y - 2,
            width: '0.29rem', // 4px
            height: '0.29rem', // 4px
          }}
        />
      ))}
    </div>
  );
};
import React, { useRef, useEffect, useState } from 'react';

interface JoystickState {
  active: boolean;
  x: number;
  y: number;
  direction: { x: number; y: number };
}

interface MobileControlsProps {
  onJoystickMove: (direction: { x: number; y: number }) => void;
  onJoystickEnd: () => void;
  visible: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ 
  onJoystickMove, 
  onJoystickEnd,
  visible 
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystick, setJoystick] = useState<JoystickState>({
    active: false,
    x: 0,
    y: 0,
    direction: { x: 0, y: 0 }
  });
  
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!joystickBaseRef.current) return;
      
      const touch = Array.from(e.changedTouches).find(t => {
        const target = t.target as HTMLElement;
        return target === joystickBaseRef.current || joystickBaseRef.current?.contains(target);
      });
      
      if (!touch) return;
      
      e.preventDefault();
      touchIdRef.current = touch.identifier;
      
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      setJoystick({
        active: true,
        x: touch.clientX - centerX,
        y: touch.clientY - centerY,
        direction: { x: 0, y: 0 }
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchIdRef.current === null || !joystickBaseRef.current) return;
      
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (!touch) return;
      
      e.preventDefault();
      
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let deltaX = touch.clientX - centerX;
      let deltaY = touch.clientY - centerY;
      
      const maxRadius = 40;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxRadius) {
        deltaX = (deltaX / distance) * maxRadius;
        deltaY = (deltaY / distance) * maxRadius;
      }
      
      const normalizedX = deltaX / maxRadius;
      const normalizedY = deltaY / maxRadius;
      
      setJoystick({
        active: true,
        x: deltaX,
        y: deltaY,
        direction: { x: normalizedX, y: normalizedY }
      });
      
      onJoystickMove({ x: normalizedX, y: normalizedY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (!touch) return;
      
      e.preventDefault();
      touchIdRef.current = null;
      
      setJoystick({
        active: false,
        x: 0,
        y: 0,
        direction: { x: 0, y: 0 }
      });
      
      onJoystickEnd();
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [visible, onJoystickMove, onJoystickEnd]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '30px',
      zIndex: 1000,
      pointerEvents: 'auto',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'none'
    }}>
      {/* Joystick Base */}
      <div
        ref={joystickBaseRef}
        style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          border: '4px solid rgba(255, 255, 255, 0.4)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Joystick Stick */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: joystick.active 
              ? 'rgba(100, 200, 255, 0.8)' 
              : 'rgba(255, 255, 255, 0.5)',
            border: '3px solid rgba(255, 255, 255, 0.9)',
            position: 'absolute',
            transform: `translate(${joystick.x}px, ${joystick.y}px)`,
            transition: joystick.active ? 'none' : 'all 0.2s ease-out',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.4)'
          }}
        />
      </div>
    </div>
  );
};

export default MobileControls;

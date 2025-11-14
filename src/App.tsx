import React, { useState } from 'react';
import SaintSeiyaGame from './components/SaintSeiyaGame';
import ArenaGame from './components/ArenaGame';

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<'menu' | 'game'>('menu');

  if (gameMode === 'menu') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0a1a',
        backgroundImage: `linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%), url(${import.meta.env.BASE_URL}assets/images/backgrounds/main.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'overlay',
        fontFamily: "'Trebuchet MS', 'Arial Black', sans-serif",
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        padding: '1rem'
      }}>
        {/* Overlay oscuro para mejorar legibilidad */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 0
        }} />

        {/* Contenido del menú */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Título con efecto brillante */}
          <h1 style={{
            color: '#ffd700',
            fontSize: 'clamp(2rem, 10vw, 80px)',
            marginBottom: '10px',
            textShadow: `
              0 0 20px rgba(255, 215, 0, 0.8),
              0 0 40px rgba(255, 215, 0, 0.6),
              0 0 60px rgba(255, 215, 0, 0.4),
              3px 3px 6px rgba(0, 0, 0, 0.8)
            `,
            fontWeight: 'bold',
            letterSpacing: 'clamp(2px, 1vw, 8px)',
            textTransform: 'uppercase',
            animation: 'glow 2s ease-in-out infinite alternate',
            textAlign: 'center',
            padding: '0 1rem'
          }}>
            Saint Seiya
          </h1>

          <p style={{
            color: '#fff',
            fontSize: 'clamp(1rem, 4vw, 28px)',
            marginBottom: 'clamp(2rem, 8vw, 80px)',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
            letterSpacing: 'clamp(1px, 0.5vw, 2px)',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            Las 12 Casas del Santuario
          </p>

          {/* Botones del menú */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(15px, 3vw, 25px)',
            width: '100%',
            maxWidth: '400px',
            minWidth: '280px',
            padding: '0 1rem'
          }}>
            {/* Botón Iniciar */}
            <button
              onClick={() => setGameMode('game')}
              style={{
                padding: 'clamp(15px, 3vw, 20px) clamp(30px, 8vw, 60px)',
                fontSize: 'clamp(1.2rem, 5vw, 32px)',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                color: '#000',
                border: '4px solid #fff',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: 'clamp(1px, 0.5vw, 3px)',
                boxShadow: `
                  0 6px 20px rgba(255, 215, 0, 0.6),
                  inset 0 -2px 8px rgba(0, 0, 0, 0.2)
                `,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                fontFamily: "'Arial Black', sans-serif",
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                e.currentTarget.style.boxShadow = `
                  0 12px 30px rgba(255, 215, 0, 0.8),
                  0 0 40px rgba(255, 215, 0, 0.6),
                  inset 0 -2px 8px rgba(0, 0, 0, 0.2)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = `
                  0 6px 20px rgba(255, 215, 0, 0.6),
                  inset 0 -2px 8px rgba(0, 0, 0, 0.2)
                `;
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px) scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
              }}
            >
              Iniciar
            </button>

            {/* Botón Salir */}
            <button
              onClick={() => window.close()}
              style={{
                padding: 'clamp(12px, 3vw, 18px) clamp(30px, 8vw, 60px)',
                fontSize: 'clamp(1rem, 4vw, 26px)',
                fontWeight: 'bold',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: '3px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: 'clamp(1px, 0.4vw, 2px)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                fontFamily: "'Arial Black', sans-serif",
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.border = '3px solid rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.border = '3px solid rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(1px)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
            >
              Salir
            </button>
          </div>

          {/* Controles info */}
          <div style={{
            marginTop: 'clamp(2rem, 8vw, 60px)',
            padding: 'clamp(15px, 3vw, 20px) clamp(20px, 5vw, 40px)',
            background: 'rgba(0, 0, 0, 0.7)',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '10px',
            color: '#fff',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            backdropFilter: 'blur(5px)'
          }}>
            <h3 style={{
              color: '#ffd700',
              marginBottom: '10px',
              fontSize: 'clamp(1rem, 3vw, 20px)',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
            }}>
              Controles
            </h3>
            <p style={{ margin: '5px 0', fontSize: 'clamp(0.8rem, 2.5vw, 16px)' }}>
              <strong>WASD</strong> o <strong>Flechas</strong>: Movimiento
            </p>
            <p style={{ margin: '5px 0', fontSize: 'clamp(0.8rem, 2.5vw, 16px)' }}>
              <strong>Mouse</strong>: Seleccionar mejoras
            </p>
            <p style={{ margin: '5px 0', fontSize: 'clamp(0.8rem, 2.5vw, 16px)' }}>
              Ataque automático al acercarte a enemigos
            </p>
          </div>
        </div>

        {/* CSS Animation para el efecto glow */}
        <style>{`
          @keyframes glow {
            from {
              text-shadow: 
                0 0 20px rgba(255, 215, 0, 0.8),
                0 0 40px rgba(255, 215, 0, 0.6),
                0 0 60px rgba(255, 215, 0, 0.4),
                3px 3px 6px rgba(0, 0, 0, 0.8);
            }
            to {
              text-shadow: 
                0 0 30px rgba(255, 215, 0, 1),
                0 0 50px rgba(255, 215, 0, 0.8),
                0 0 70px rgba(255, 215, 0, 0.6),
                3px 3px 6px rgba(0, 0, 0, 0.8);
            }
          }
        `}</style>
      </div>
    );
  }

  return <SaintSeiyaGame />;
};

export default App;

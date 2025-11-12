import React, { useState } from 'react';
import SaintSeiyaGame from './components/SaintSeiyaGame';
import ArenaGame from './components/ArenaGame';

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<'menu' | 'classic' | 'arena'>('classic'); // Cambiar a 'classic' para ver el juego con sprites

  // Debug: Verificar que React está funcionando
  console.log('App rendering, gameMode:', gameMode);

  if (gameMode === 'menu') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{
          color: '#ffd700',
          fontSize: '64px',
          marginBottom: '20px',
          textShadow: '0 0 30px rgba(255, 215, 0, 0.8)'
        }}>
          SAINT SEIYA
        </h1>
        <p style={{
          color: '#fff',
          fontSize: '24px',
          marginBottom: '50px'
        }}>
          Elige tu modo de juego
        </p>

        <div style={{
          display: 'flex',
          gap: '40px'
        }}>
          <div
            onClick={() => setGameMode('arena')}
            style={{
              width: '300px',
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '3px solid #ffd700',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 215, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚔️</div>
            <h2 style={{ color: '#ffd700', marginBottom: '15px', fontSize: '28px' }}>
              Arena Battle
            </h2>
            <p style={{ color: '#fff', fontSize: '16px', lineHeight: '1.5' }}>
              Sobrevive oleadas infinitas de enemigos. 
              Sistema de mejoras temporales y permanentes.
              Estilo Vampire Survivors.
            </p>
          </div>

          <div
            onClick={() => setGameMode('classic')}
            style={{
              width: '300px',
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '3px solid #ffd700',
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 215, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏛️</div>
            <h2 style={{ color: '#ffd700', marginBottom: '15px', fontSize: '28px' }}>
              Las 12 Casas
            </h2>
            <p style={{ color: '#fff', fontSize: '16px', lineHeight: '1.5' }}>
              Atraviesa las 12 Casas del Santuario.
              Derrota a los Caballeros de Oro.
              Modo historia clásico.
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '50px',
            padding: '12px 30px',
            fontSize: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Volver al Menú
        </button>
      </div>
    );
  }

  if (gameMode === 'arena') {
    return <ArenaGame />;
  }

  return <SaintSeiyaGame />;
};

export default App;

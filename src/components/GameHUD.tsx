import React from 'react';
import { GameState } from '../types/game';

interface Props {
  gameState: GameState;
  enemiesOnScreen: number; // Nuevo: contador de enemigos en pantalla
  waveProgress: number; // Nuevo: progreso de la oleada (0-25)
}

const GameHUD: React.FC<Props> = ({ gameState, enemiesOnScreen, waveProgress }) => {
  const { player, wave, gameTime } = gameState;
  
  const hpPercent = (player.stats.currentHp / player.stats.maxHp) * 100;
  
  // Calcular requisito de cosmos para siguiente nivel usando fórmula: 100 * (nivel^1.5)
  const cosmosRequired = Math.floor(100 * Math.pow(player.level, 1.5));
  const cosmosPercent = (player.cosmos / cosmosRequired) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Efecto de peligro cuando hay muchos enemigos cerca
  const isDangerous = enemiesOnScreen > 10;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '20px',
      pointerEvents: 'none'
    }}>
      {/* Efecto de peligro - borde rojo pulsante */}
      {isDangerous && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '5px solid rgba(255, 0, 0, 0.6)',
          animation: 'pulse 0.5s infinite',
          pointerEvents: 'none',
          zIndex: 1000
        }} />
      )}
      
      {/* Estilos para animaciones */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes magnetGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 25px rgba(255, 215, 0, 1); }
        }
      `}</style>

      {/* HP Bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '5px 10px',
          borderRadius: '5px',
          display: 'inline-block'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', marginBottom: '3px' }}>
            HP: {Math.floor(player.stats.currentHp)}/{player.stats.maxHp}
          </div>
          <div style={{
            width: '300px',
            height: '20px',
            background: '#333',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${hpPercent}%`,
              height: '100%',
              background: `linear-gradient(90deg, #e74c3c, #c0392b)`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>

      {/* Cosmos/Energía Cósmica Bar (reemplaza XP) */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '5px 10px',
          borderRadius: '5px',
          display: 'inline-block'
        }}>
          <div style={{ color: '#4dd0e1', fontSize: '14px', marginBottom: '3px' }}>
            ⚡ Nivel {player.level} - Cosmos: {Math.floor(player.cosmos)}/{cosmosRequired}
          </div>
          <div style={{
            width: '300px',
            height: '15px',
            background: '#333',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${cosmosPercent}%`,
              height: '100%',
              background: `linear-gradient(90deg, #00bcd4, #0097a7)`,
              transition: 'width 0.3s',
              boxShadow: '0 0 10px rgba(0, 188, 212, 0.5)'
            }} />
          </div>
        </div>
      </div>

      {/* Indicador de Magnet Activo */}
      {player.magnetActive && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.8)',
          padding: '8px 15px',
          borderRadius: '8px',
          display: 'inline-block',
          marginBottom: '10px',
          animation: 'magnetGlow 1s infinite',
          color: '#000',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          🧲 MAGNET ACTIVO ({Math.ceil(player.magnetDuration)}s)
        </div>
      )}

      {/* Stats Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 'bold', color: '#ffd700' }}>
          🌊 Oleada {wave}
        </div>
        <div style={{ marginBottom: '5px', fontSize: '16px', color: '#4dd0e1' }}>
          Progreso: {waveProgress}/25 enemigos
        </div>
        <div style={{ 
          marginBottom: '8px', 
          color: enemiesOnScreen > 10 ? '#ff5252' : '#95e1d3',
          fontWeight: enemiesOnScreen > 10 ? 'bold' : 'normal'
        }}>
          👹 En pantalla: {enemiesOnScreen}
        </div>
        <div style={{ marginBottom: '5px' }}>⏱️ Tiempo: {formatTime(gameTime)}</div>
        <div style={{ marginBottom: '5px', color: '#95e1d3' }}>
          ⚔️ Daño: {Math.floor(player.stats.damage)}
        </div>
        <div style={{ marginBottom: '5px', color: '#95e1d3' }}>
          🎯 Rango: {Math.floor(player.stats.attackRange)}
        </div>
        <div style={{ color: '#95e1d3' }}>
          ⚡ Vel. Ataque: {player.stats.attackSpeed.toFixed(1)}/s
        </div>
      </div>

      {/* Controls Info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '10px 15px',
        borderRadius: '5px',
        color: '#fff',
        fontSize: '12px'
      }}>
        <div>WASD / Flechas - Mover</div>
        <div>Ataque Automático</div>
        <div style={{ color: '#4dd0e1', marginTop: '5px' }}>🔵 Cosmos | 💚 Vida | 🟡 Magnet</div>
      </div>
    </div>
  );
};

export default GameHUD;

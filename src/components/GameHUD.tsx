import React from 'react';
import { GameState } from '../types/game';

interface Props {
  gameState: GameState;
}

const GameHUD: React.FC<Props> = ({ gameState }) => {
  const { player, wave, gameTime } = gameState;
  
  const hpPercent = (player.stats.currentHp / player.stats.maxHp) * 100;
  const expPercent = (player.experience / CombatSystem.calculateExperienceForLevel(player.level)) * 100;
  const cosmosPercent = player.cosmos;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '20px',
      pointerEvents: 'none'
    }}>
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

      {/* XP Bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '5px 10px',
          borderRadius: '5px',
          display: 'inline-block'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', marginBottom: '3px' }}>
            Nivel {player.level} - XP: {Math.floor(player.experience)}
          </div>
          <div style={{
            width: '300px',
            height: '15px',
            background: '#333',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${expPercent}%`,
              height: '100%',
              background: `linear-gradient(90deg, #3498db, #2980b9)`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>

      {/* Cosmos Bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '5px 10px',
          borderRadius: '5px',
          display: 'inline-block'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', marginBottom: '3px' }}>
            Cosmos: {Math.floor(cosmosPercent)}%
          </div>
          <div style={{
            width: '300px',
            height: '12px',
            background: '#333',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${cosmosPercent}%`,
              height: '100%',
              background: `linear-gradient(90deg, #f39c12, #e67e22)`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>

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
        <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 'bold', color: '#ffd700' }}>
          Oleada {wave}
        </div>
        <div style={{ marginBottom: '5px' }}>⏱️ Tiempo: {formatTime(gameTime)}</div>
        <div style={{ marginBottom: '5px' }}>💰 Oro: {player.gold}</div>
        <div style={{ marginBottom: '5px' }}>💎 Gemas: {player.gems}</div>
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
      </div>
    </div>
  );
};

// Import necesario
import { CombatSystem } from '../systems/CombatSystem';

export default GameHUD;

import React from 'react';
import { Upgrade } from '../types/game';

interface Props {
  options: Upgrade[];
  onSelect: (upgradeId: string) => void;
}

const LevelUpMenu: React.FC<Props> = ({ options, onSelect }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <h1 style={{
        color: '#ffd700',
        fontSize: '48px',
        marginBottom: '20px',
        textShadow: '0 0 20px rgba(255, 215, 0, 0.8)'
      }}>
        ¡LEVEL UP!
      </h1>
      
      <p style={{
        color: '#fff',
        fontSize: '20px',
        marginBottom: '40px'
      }}>
        Elige una mejora para tu caballero
      </p>

      <div style={{
        display: 'flex',
        gap: '30px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        maxWidth: '1000px'
      }}>
        {options.map((upgrade) => (
          <div
            key={upgrade.id}
            onClick={() => onSelect(upgrade.id)}
            style={{
              width: '280px',
              background: 'linear-gradient(145deg, #1e3c72, #2a5298)',
              border: '3px solid #ffd700',
              borderRadius: '15px',
              padding: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 215, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
            }}
          >
            <div style={{
              fontSize: '64px',
              textAlign: 'center',
              marginBottom: '15px'
            }}>
              {upgrade.icon}
            </div>
            
            <h3 style={{
              color: '#ffd700',
              fontSize: '22px',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              {upgrade.name}
            </h3>
            
            <p style={{
              color: '#fff',
              fontSize: '16px',
              textAlign: 'center',
              marginBottom: '10px',
              lineHeight: '1.4'
            }}>
              {upgrade.description}
            </p>

            <div style={{
              textAlign: 'center',
              marginTop: '15px'
            }}>
              <span style={{
                background: 'rgba(255, 215, 0, 0.2)',
                color: '#ffd700',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Tier {upgrade.tier}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelUpMenu;

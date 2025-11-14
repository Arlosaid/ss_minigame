import React, { useEffect, useRef, useState } from 'react';
import { GameState, Player, Enemy, Drop } from '../types/game';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { AnimatedSprite, createPlayerSprite, createEnemySprite } from '../systems/SpriteSystem';
import GameHUD from './GameHUD';
import LevelUpMenu from './LevelUpMenu';

const ARENA_WIDTH = 1200;
const ARENA_HEIGHT = 800;

const ArenaGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const gameStateRef = useRef<GameState>(gameState);
  const waveSystemRef = useRef<WaveSystem>(new WaveSystem(ARENA_WIDTH, ARENA_HEIGHT));
  const inputRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const playerSpriteRef = useRef<AnimatedSprite | null>(null);
  const enemySpritesRef = useRef<Map<string, AnimatedSprite>>(new Map());
  const [spritesLoaded, setSpritesLoaded] = useState(false);

  // Cargar sprites al montar el componente
  useEffect(() => {
    const loadSprites = async () => {
      try {
        playerSpriteRef.current = await createPlayerSprite();
        setSpritesLoaded(true);
      } catch (error) {
        setSpritesLoaded(true); // Continuar aunque falle
      }
    };
    loadSprites();
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!gameStateRef.current.isPaused && !gameStateRef.current.isGameOver) {
        updateGame(deltaTime);
      }
      
      // SIEMPRE renderizar, independientemente del estado del juego
      renderGame();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  function createInitialGameState(): GameState {
    const player: Player = {
      id: 'player',
      type: 'player',
      position: { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      size: 25,
      stats: {
        maxHp: 100,
        currentHp: 100,
        damage: 12, // Reducido de 15 a 12
        speed: 200,
        attackRange: 150,
        attackSpeed: 2
      },
      isAttacking: false,
      attackCooldown: 0,
      experience: 0,
      level: 1,
      cosmos: 0, // Sistema unificado de cosmos
      upgrades: [],
      magnetActive: false,
      magnetDuration: 0
    };

    waveSystemRef.current.startNextWave();

    return {
      player,
      enemies: [],
      projectiles: [],
      drops: [],
      wave: 1,
      gameTime: 0,
      isPaused: false,
      isGameOver: false,
      showLevelUp: false,
      levelUpOptions: [],
      permanentUpgrades: UpgradeSystem.permanentUpgrades.map(u => ({ ...u }))
    };
  }

  function updateGame(deltaTime: number) {
    const state = { ...gameStateRef.current };
    state.gameTime += deltaTime;

    updateInput();

    // Actualizar animación del jugador
    if (playerSpriteRef.current) {
      playerSpriteRef.current.update(deltaTime);
      
      // Cambiar animación según estado
      if (state.player.isAttacking) {
        playerSpriteRef.current.setAnimation('attack');
      } else if (inputRef.current.x !== 0 || inputRef.current.y !== 0) {
        playerSpriteRef.current.setAnimation('walk');
        // Voltear sprite según dirección
        if (inputRef.current.x < 0) {
          playerSpriteRef.current.flipX = true;
        } else if (inputRef.current.x > 0) {
          playerSpriteRef.current.flipX = false;
        }
      } else {
        playerSpriteRef.current.setAnimation('idle');
      }
    }

    MovementSystem.updatePlayerMovement(
      state.player,
      inputRef.current,
      deltaTime,
      ARENA_WIDTH,
      ARENA_HEIGHT
    );

    const newEnemies = waveSystemRef.current.update(deltaTime, state.enemies);
    state.enemies.push(...newEnemies);

    state.enemies.forEach(enemy => {
      MovementSystem.updateEnemyMovement(
        enemy,
        state.player,
        deltaTime,
        ARENA_WIDTH,
        ARENA_HEIGHT
      );

      // Cargar sprite para enemigo si no existe
      if (!enemySpritesRef.current.has(enemy.id)) {
        createEnemySprite(enemy.enemyType).then(sprite => {
          enemySpritesRef.current.set(enemy.id, sprite);
        });
      }

      // Actualizar animación del enemigo
      const enemySprite = enemySpritesRef.current.get(enemy.id);
      if (enemySprite) {
        enemySprite.update(deltaTime);
        // Voltear enemigo hacia el jugador
        if (enemy.position.x > state.player.position.x) {
          enemySprite.flipX = true;
        } else {
          enemySprite.flipX = false;
        }
      }
    });

    const nearestEnemy = CombatSystem.findNearestEnemy(state.player, state.enemies);
    if (nearestEnemy && CombatSystem.canAttack(state.player)) {
      CombatSystem.performAttack(state.player, nearestEnemy);
    }

    state.enemies.forEach(enemy => {
      const distToPlayer = PhysicsSystem.distance(enemy.position, state.player.position);
      if (distToPlayer <= enemy.stats.attackRange && CombatSystem.canAttack(enemy)) {
        CombatSystem.performAttack(enemy, state.player);
      }
    });

    CombatSystem.updateCooldowns([state.player, ...state.enemies], deltaTime);

    const deadEnemies = state.enemies.filter(e => e.stats.currentHp <= 0);
    deadEnemies.forEach(enemy => {
      createDrops(state, enemy);
      // Limpiar sprite del enemigo muerto
      enemySpritesRef.current.delete(enemy.id);
      const leveled = CombatSystem.addExperience(state.player, Math.floor(enemy.rewardValue / 2));
      if (leveled) {
        triggerLevelUp(state);
      }
    });

    state.enemies = state.enemies.filter(e => e.stats.currentHp > 0);

    // Actualizar magnet duration
    if (state.player.magnetActive) {
      state.player.magnetDuration = Math.max(0, state.player.magnetDuration - deltaTime);
      if (state.player.magnetDuration <= 0) {
        state.player.magnetActive = false;
      }
    }

    state.drops = state.drops.filter(drop => {
      drop.lifetime -= deltaTime;
      if (drop.lifetime <= 0) return false;

      const distToPlayer = PhysicsSystem.distance(drop.position, state.player.position);
      
      // Atraer drops si magnet está activo o están cerca
      const attractRadius = state.player.magnetActive ? 400 : 40;
      if (distToPlayer < attractRadius) {
        if (distToPlayer < 40) {
          collectDrop(state, drop);
          return false;
        } else if (state.player.magnetActive) {
          // Atraer hacia el jugador
          const angle = Math.atan2(
            state.player.position.y - drop.position.y,
            state.player.position.x - drop.position.x
          );
          const attractSpeed = 300; // píxeles por segundo
          drop.position.x += Math.cos(angle) * attractSpeed * deltaTime;
          drop.position.y += Math.sin(angle) * attractSpeed * deltaTime;
        }
      }
      return true;
    });

    if (state.player.stats.currentHp <= 0) {
      state.isGameOver = true;
    }

    state.wave = waveSystemRef.current.getCurrentWave();
    
    // Actualizar el estado para forzar re-render
    gameStateRef.current = state;
    setGameState(state);
  }

  function updateInput() {
    const keys = keysRef.current;
    let x = 0;
    let y = 0;

    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;

    inputRef.current = { x, y };
  }

  function createDrops(state: GameState, enemy: Enemy) {
    // Siempre dropear cosmos
    const cosmosValue = 2 + Math.floor(Math.random() * 3); // 2-4 cosmos
    const cosmosDrop: Drop = {
      id: `drop_cosmos_${Date.now()}`,
      type: 'cosmos',
      position: {
        x: enemy.position.x,
        y: enemy.position.y
      },
      value: cosmosValue,
      lifetime: 15
    };
    state.drops.push(cosmosDrop);
    
    // 8% probabilidad de health orb
    if (Math.random() < 0.08) {
      const healthDrop: Drop = {
        id: `drop_health_${Date.now()}`,
        type: 'health',
        position: {
          x: enemy.position.x + (Math.random() - 0.5) * 20,
          y: enemy.position.y + (Math.random() - 0.5) * 20
        },
        value: 20,
        lifetime: 8
      };
      state.drops.push(healthDrop);
    }
    
    // 3% probabilidad de magnet orb
    if (Math.random() < 0.03) {
      const magnetDrop: Drop = {
        id: `drop_magnet_${Date.now()}`,
        type: 'magnet',
        position: {
          x: enemy.position.x + (Math.random() - 0.5) * 20,
          y: enemy.position.y + (Math.random() - 0.5) * 20
        },
        value: 1,
        lifetime: 8
      };
      state.drops.push(magnetDrop);
    }
  }

  function collectDrop(state: GameState, drop: Drop) {
    switch (drop.type) {
      case 'cosmos':
        // Ganar cosmos (funciona como experiencia)
        const cosmosRequired = Math.floor(100 * Math.pow(state.player.level, 1.5));
        state.player.cosmos += drop.value;
        
        // Verificar level up
        if (state.player.cosmos >= cosmosRequired) {
          state.player.cosmos -= cosmosRequired;
          state.player.level++;
          triggerLevelUp(state);
        }
        break;
      case 'health':
        // Recuperar vida
        state.player.stats.currentHp = Math.min(
          state.player.stats.maxHp,
          state.player.stats.currentHp + drop.value
        );
        break;
      case 'magnet':
        // Activar efecto magnet
        state.player.magnetActive = true;
        state.player.magnetDuration = 5; // 5 segundos
        break;
    }
  }

  function triggerLevelUp(state: GameState) {
    state.showLevelUp = true;
    state.isPaused = true;
    state.levelUpOptions = UpgradeSystem.getRandomUpgrades(3, state.player.level);
  }

  function handleUpgradeSelection(upgradeId: string) {
    const state = { ...gameStateRef.current };
    const upgrade = state.levelUpOptions.find(u => u.id === upgradeId);
    
    if (upgrade) {
      UpgradeSystem.applyUpgrade(state.player, upgrade);
    }

    state.showLevelUp = false;
    state.isPaused = false;
    state.levelUpOptions = [];
    setGameState(state);
  }

  function renderGame() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, ARENA_WIDTH - 4, ARENA_HEIGHT - 4);

    state.drops.forEach(drop => {
      const colors = {
        cosmos: '#00bcd4', // Azul brillante
        health: '#0F0', // Verde
        magnet: '#FFD700' // Dorado
      };
      
      const sizes = {
        cosmos: 5,
        health: 6,
        magnet: 7
      };
      
      ctx.fillStyle = colors[drop.type] || '#fff';
      ctx.beginPath();
      ctx.arc(drop.position.x, drop.position.y, sizes[drop.type] || 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Efecto extra para magnet
      if (drop.type === 'magnet') {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(drop.position.x, drop.position.y, sizes[drop.type] + 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    state.enemies.forEach(enemy => {
      const enemySprite = enemySpritesRef.current.get(enemy.id);
      
      if (enemySprite && enemySprite.getCurrentFrame()) {
        // Dibujar sprite del enemigo
        const spriteWidth = enemy.size * 3;
        const spriteHeight = enemy.size * 3;
        enemySprite.draw(ctx, enemy.position.x, enemy.position.y, spriteWidth, spriteHeight);
      } else {
        // Fallback: dibujar círculo si no hay sprite
        const colors = {
          melee: '#ff4757',
          fast: '#ff6348',
          tank: '#8b0000',
          ranged: '#ff7f50',
          miniboss: '#dc143c',
          boss: '#8b008b'
        };
        ctx.fillStyle = colors[enemy.enemyType];
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP bar
      const hpPercent = enemy.stats.currentHp / enemy.stats.maxHp;
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(
        enemy.position.x - enemy.size,
        enemy.position.y - enemy.size - 10,
        enemy.size * 2 * hpPercent,
        4
      );
    });

    // Draw player
    if (playerSpriteRef.current && playerSpriteRef.current.getCurrentFrame()) {
      // Efecto de aura dorada si magnet está activo
      if (state.player.magnetActive) {
        const pulseSize = 80 + Math.sin(Date.now() / 200) * 10;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(state.player.position.x, state.player.position.y, pulseSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      const spriteWidth = state.player.size * 3;
      const spriteHeight = state.player.size * 3;
      playerSpriteRef.current.draw(ctx, state.player.position.x, state.player.position.y, spriteWidth, spriteHeight);
    } else {
      // Fallback: dibujar círculo si no hay sprite
      // Efecto de aura dorada si magnet está activo
      if (state.player.magnetActive) {
        const pulseSize = 50 + Math.sin(Date.now() / 200) * 8;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(state.player.position.x, state.player.position.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      ctx.fillStyle = state.player.isAttacking ? '#ffd700' : '#3498db';
      ctx.beginPath();
      ctx.arc(state.player.position.x, state.player.position.y, state.player.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(52, 152, 219, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(state.player.position.x, state.player.position.y, state.player.stats.attackRange, 0, Math.PI * 2);
    ctx.stroke();
  }

  function handleRestart() {
    waveSystemRef.current = new WaveSystem(ARENA_WIDTH, ARENA_HEIGHT);
    enemySpritesRef.current.clear();
    setGameState(createInitialGameState());
  }

  return (
    <div style={{ position: 'relative', width: ARENA_WIDTH, height: ARENA_HEIGHT, margin: '0 auto' }}>
      {!spritesLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '24px',
          zIndex: 1000
        }}>
          Cargando sprites...
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        style={{ border: '2px solid #0f3460', display: 'block' }}
      />
      
      <GameHUD 
        gameState={gameState} 
        enemiesOnScreen={gameState.enemies.length}
        waveProgress={0} // TODO: implementar tracking de progreso
      />
      
      {gameState.showLevelUp && (
        <LevelUpMenu
          options={gameState.levelUpOptions}
          onSelect={handleUpgradeSelection}
        />
      )}
      
      {gameState.isGameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center',
          color: '#fff'
        }}>
          <h1 style={{ color: '#ff4757', marginBottom: '20px' }}>GAME OVER</h1>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>Oleada alcanzada: {gameState.wave}</p>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>Cosmos acumulado: {Math.floor(gameState.player.cosmos)}</p>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>Nivel: {gameState.player.level}</p>
          <button
            onClick={handleRestart}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
};

export default ArenaGame;

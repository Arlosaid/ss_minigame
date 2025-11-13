import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Knight, GoldSaint, Upgrade } from '../data/gameData';
import { BRONZE_KNIGHTS, GOLD_SAINTS, UPGRADES } from '../data/gameData';
import { createPlayerSprite, AnimatedSprite } from '../systems/SpriteSystem';
import { CombatSystem } from '../core/Combat';

const WIDTH = 800; // Tamaño del viewport (lo que se ve en pantalla)
const HEIGHT = 600;
const MAP_WIDTH = 1600; // Mapa más grande para un templo espacioso
const MAP_HEIGHT = 1200;

interface Player {
  x: number;
  y: number;
  knight: Knight;
  health: number;
  maxHealth: number;
  exp: number;
  expToNext: number;
  level: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'normal' | 'fast' | 'tank';
  angle: number;
}

interface Boss {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  gold: GoldSaint;
  lastAttack: number;
  phase: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
  color: string;
  pierce: number;
  isEnemy: boolean;
  angle: number;
}

interface ExpOrb {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface SpawnWarning {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'fast' | 'tank';
  spawnTime: number;
  warningDuration: number;
}

interface PlayerUpgrades {
  damage: number;
  speed: number;
  fireRate: number;
  multiShot: number;
  pierce: number;
  explosion: number;
}

const SaintSeiyaGame: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [expOrbs, setExpOrbs] = useState<ExpOrb[]>([]);
  const [spawnWarnings, setSpawnWarnings] = useState<SpawnWarning[]>([]);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [lastShot, setLastShot] = useState(0);
  const [currentHouse, setCurrentHouse] = useState(0);
  const [waveEnemies, setWaveEnemies] = useState(0);
  const [waveKills, setWaveKills] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'levelup' | 'houseclear' | 'gameover'>('playing');
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({
    damage: 0,
    speed: 0,
    fireRate: 0,
    multiShot: 0,
    pierce: 0,
    explosion: 0
  });
  const [upgradeChoices, setUpgradeChoices] = useState<Upgrade[]>([]);
  const [playerSprite, setPlayerSprite] = useState<AnimatedSprite | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [projectileImage, setProjectileImage] = useState<HTMLImageElement | null>(null);
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextEnemyId = useRef(0);
  const nextProjectileId = useRef(0);
  const nextOrbId = useRef(0);
  const nextWarningId = useRef(0);
  const lastFrameTime = useRef<number>(Date.now());

  const selectKnight = async (knight: Knight) => {
    const initialX = MAP_WIDTH / 2;
    const initialY = MAP_HEIGHT / 2;
    
    setPlayer({
      x: initialX,
      y: initialY,
      knight,
      health: 100,
      maxHealth: 100,
      exp: 0,
      expToNext: 100,
      level: 1
    });
    
    setGameStarted(true);
    setCurrentHouse(0);
    setWaveEnemies(20);
    setWaveKills(0);
    setGameState('playing');
    
    // Cargar sprite del jugador
    try {
      const sprite = await createPlayerSprite();
      setPlayerSprite(sprite);
      console.log('Player sprite loaded');
      
      // Cargar sprite de proyectil
      const projImg = new Image();
      projImg.onload = () => {
        setProjectileImage(projImg);
        console.log('Projectile sprite loaded');
      };
      projImg.onerror = () => {
        console.error('Failed to load projectile sprite');
      };
      projImg.src = '/sprites/attacks/attack_1.png';
      
      // Cargar imagen del floor
      const floorImg = new Image();
      floorImg.onload = () => {
        setFloorImage(floorImg);
        console.log('Floor image loaded');
      };
      floorImg.onerror = () => {
        console.error('Failed to load floor image');
      };
      floorImg.src = '/sprites/stages/floor_1_stage.png';
    } catch (error) {
      console.error('Failed to load player sprite:', error);
    }
  };

  const spawnEnemy = useCallback(() => {
    const types: Array<'normal' | 'fast' | 'tank'> = ['normal', 'fast', 'tank'];
    const type = types[Math.floor(Math.random() * types.length)]!;
    
    // Spawn en posiciones completamente aleatorias dentro del mapa
    const x = Math.random() * MAP_WIDTH;
    const y = Math.random() * MAP_HEIGHT;

    // Crear advertencia de spawn en lugar de enemigo directo
    const warning: SpawnWarning = {
      id: nextWarningId.current++,
      x, y,
      type,
      spawnTime: Date.now() + 1500, // Spawn después de 1.5 segundos
      warningDuration: 1500
    };
    
    setSpawnWarnings(prev => [...prev, warning]);
  }, []);

  const spawnBoss = useCallback(() => {
    if (currentHouse >= GOLD_SAINTS.length) return;
    
    const gold = GOLD_SAINTS[currentHouse]!;
    setBoss({
      id: nextEnemyId.current++,
      x: MAP_WIDTH / 2,
      y: MAP_HEIGHT / 2,
      health: 500 + currentHouse * 200,
      maxHealth: 500 + currentHouse * 200,
      gold,
      lastAttack: 0,
      phase: 1
    });
    setGameState('playing');
  }, [currentHouse]);

  const shoot = useCallback(() => {
    if (!player || gameState !== 'playing') return;
    
    const now = Date.now();
    const fireRate = player.knight.fireRate - upgrades.fireRate * 50;
    if (now - lastShot < fireRate) return;
    
    setLastShot(now);
    
    // Configuración del rango de ataque
    const attackRange = 300; // Rango máximo de ataque en píxeles
    
    // Encontrar el enemigo más cercano usando el CombatSystem
    const nearestEnemy = CombatSystem.findNearestEnemy(
      { x: player.x, y: player.y },
      enemies,
      attackRange
    );
    
    // Determinar el objetivo (enemigo cercano o boss si está cerca)
    let target: { x: number; y: number } | null = nearestEnemy;
    
    // Si hay un boss, verificar si está en rango y priorizarlo
    if (boss) {
      const bossDist = CombatSystem.calculateDistance(
        { x: player.x, y: player.y },
        { x: boss.x, y: boss.y }
      );
      
      if (bossDist <= attackRange) {
        // Si el boss está en rango, priorizarlo
        target = boss;
      }
    }
    
    // Si no hay objetivo en rango, NO disparar
    if (!target) {
      return; // No hay enemigos en rango
    }
    
    // Crear efecto visual de ataque
    CombatSystem.createAttackEffect({ x: player.x, y: player.y }, target);
    
    // Activar animación de ataque
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 200);
    
    const shots = 1 + upgrades.multiShot;
    const newProjectiles: Projectile[] = [];
    
    // Calcular ángulo base hacia el objetivo
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    
    for (let i = 0; i < shots; i++) {
      // Calcular ángulo individual para cada disparo (spread)
      const angle = shots === 1 ? baseAngle : baseAngle + (i - (shots - 1) / 2) * 0.2;
      
      // Calcular posición inicial del proyectil usando el ángulo individual
      // Esto asegura que cada proyectil salga del punto correcto del jugador
      const offsetDistance = 25; // Distancia desde el centro del jugador
      const startX = player.x + Math.cos(angle) * offsetDistance;
      const startY = player.y + Math.sin(angle) * offsetDistance;
      
      newProjectiles.push({
        id: nextProjectileId.current++,
        x: startX,
        y: startY,
        dx: Math.cos(angle) * 5,
        dy: Math.sin(angle) * 5,
        damage: player.knight.damage + upgrades.damage,
        color: player.knight.projectileColor,
        pierce: upgrades.pierce,
        isEnemy: false,
        angle: angle
      });
    }
    
    setProjectiles(prev => [...prev, ...newProjectiles]);
  }, [player, gameState, lastShot, upgrades, enemies, boss]);

  const dropExpOrb = useCallback((x: number, y: number, value: number) => {
    setExpOrbs(prev => [...prev, {
      id: nextOrbId.current++,
      x, y, value
    }]);
  }, []);

  const gainExp = useCallback((amount: number) => {
    if (!player) return;
    
    setPlayer(prev => {
      if (!prev) return prev;
      
      let newExp = prev.exp + amount;
      let newLevel = prev.level;
      let newExpToNext = prev.expToNext;
      
      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = Math.floor(newExpToNext * 1.2);
        
        const choices: Upgrade[] = [];
        while (choices.length < 3) {
          const upgrade = UPGRADES[Math.floor(Math.random() * UPGRADES.length)]!;
          if (!choices.includes(upgrade)) choices.push(upgrade);
        }
        setUpgradeChoices(choices);
        setGameState('levelup');
      }
      
      return { ...prev, exp: newExp, level: newLevel, expToNext: newExpToNext };
    });
  }, [player]);

  const selectUpgrade = (upgradeId: string) => {
    setUpgrades(prev => {
      const current = prev[upgradeId as keyof PlayerUpgrades] || 0;
      const upgrade = UPGRADES.find(u => u.id === upgradeId);
      if (!upgrade || current >= upgrade.levels.length) return prev;
      
      return { ...prev, [upgradeId]: current + 1 };
    });
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevenir comportamiento por defecto de las flechas
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      setKeysPressed(prev => new Set(prev).add(e.key.toLowerCase()));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key.toLowerCase());
        return newSet;
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || !player || gameState !== 'playing') return;
    
    const spawnInterval = Math.max(100, 300 - (waveKills * 5)); // Spawn mucho más rápido
    
    const interval = setInterval(() => {
      if (boss) return;
      // Permitir más enemigos y advertencias combinados
      if ((enemies.length + spawnWarnings.length) < 80 && waveKills < waveEnemies) {
        spawnEnemy();
      }
    }, spawnInterval);
    
    return () => clearInterval(interval);
  }, [gameStarted, player, gameState, boss, enemies.length, spawnWarnings.length, waveKills, waveEnemies, spawnEnemy]);

  useEffect(() => {
    if (!gameStarted || !player || gameState !== 'playing') return;
    
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      if (!player) return;
      
      // Calcular deltaTime en segundos
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Limitar a 100ms máximo
      lastTime = currentTime;
      
      // Velocidad base en píxeles por segundo (aumentada significativamente)
      const baseSpeed = 400; // Velocidad base mucho más rápida
      const speedMultiplier = player.knight.speed + upgrades.speed * 0.5;
      const pixelsPerSecond = baseSpeed * speedMultiplier;
      
      // Leer input y construir vector de dirección
      let dx = 0, dy = 0;
      if (keysPressed.has('w') || keysPressed.has('arrowup')) dy -= 1;
      if (keysPressed.has('s') || keysPressed.has('arrowdown')) dy += 1;
      if (keysPressed.has('a') || keysPressed.has('arrowleft')) dx -= 1;
      if (keysPressed.has('d') || keysPressed.has('arrowright')) dx += 1;
      
      // Actualizar posición si hay movimiento
      if (dx !== 0 || dy !== 0) {
        const magnitude = Math.hypot(dx, dy);
        const normalizedDx = (dx / magnitude) * pixelsPerSecond * deltaTime;
        const normalizedDy = (dy / magnitude) * pixelsPerSecond * deltaTime;
        
        // Calcular nueva posición con límites
        const newX = Math.max(20, Math.min(MAP_WIDTH - 20, player.x + normalizedDx));
        const newY = Math.max(20, Math.min(MAP_HEIGHT - 20, player.y + normalizedDy));
        
        // Actualizar posición del jugador y cámara juntos
        setPlayer(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            x: newX,
            y: newY
          };
        });
      }
      
      // Actualizar cámara para seguir al jugador suavemente
      setCamera({
        x: Math.max(0, Math.min(MAP_WIDTH - WIDTH, player.x - WIDTH / 2)),
        y: Math.max(0, Math.min(MAP_HEIGHT - HEIGHT, player.y - HEIGHT / 2))
      });
      
      shoot();
      
      // Procesar spawn warnings y convertir en enemigos cuando sea tiempo
      const now = Date.now();
      setSpawnWarnings(prev => {
        const remaining: SpawnWarning[] = [];
        
        prev.forEach(warning => {
          if (now >= warning.spawnTime) {
            // Crear el enemigo
            const enemy: Enemy = {
              id: nextEnemyId.current++,
              x: warning.x,
              y: warning.y,
              health: warning.type === 'tank' ? 30 : warning.type === 'fast' ? 15 : 20,
              maxHealth: warning.type === 'tank' ? 30 : warning.type === 'fast' ? 15 : 20,
              speed: warning.type === 'fast' ? 1.1 : warning.type === 'tank' ? 0.4 : 0.65,
              type: warning.type,
              angle: 0
            };
            setEnemies(e => [...e, enemy]);
          } else {
            remaining.push(warning);
          }
        });
        
        return remaining;
      });
      
      setProjectiles(prev => prev
        .map(p => ({ ...p, x: p.x + p.dx, y: p.y + p.dy }))
        .filter(p => p.x >= -50 && p.x <= MAP_WIDTH + 50 && p.y >= -50 && p.y <= MAP_HEIGHT + 50)
      );
      
      setEnemies(prev => prev.map(enemy => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        return {
          ...enemy,
          x: enemy.x + Math.cos(angle) * enemy.speed,
          y: enemy.y + Math.sin(angle) * enemy.speed,
          angle
        };
      }));
      
      setExpOrbs(prev => prev.map(orb => {
        const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
        if (dist < 100) {
          const angle = Math.atan2(player.y - orb.y, player.x - orb.x);
          return {
            ...orb,
            x: orb.x + Math.cos(angle) * 3,
            y: orb.y + Math.sin(angle) * 3
          };
        }
        return orb;
      }));
      
      setExpOrbs(prev => prev.filter(orb => {
        if (Math.hypot(player.x - orb.x, player.y - orb.y) < 20) {
          gainExp(orb.value);
          return false;
        }
        return true;
      }));
      
      setProjectiles(prev => {
        const remaining: Projectile[] = [];
        
        prev.forEach(proj => {
          if (proj.isEnemy) {
            if (Math.hypot(player.x - proj.x, player.y - proj.y) < 25) {
              setPlayer(p => {
                if (!p) return p;
                const newHealth = p.health - 10;
                if (newHealth <= 0) setGameState('gameover');
                return { ...p, health: Math.max(0, newHealth) };
              });
            } else {
              remaining.push(proj);
            }
          } else {
            let hit = false;
            let pierce = proj.pierce;
            
            if (boss) {
              if (Math.hypot(boss.x - proj.x, boss.y - proj.y) < 40) {
                setBoss(b => {
                  if (!b) return b;
                  const newHealth = b.health - proj.damage;
                  if (newHealth <= 0) {
                    dropExpOrb(b.x, b.y, 100);
                    setScore(s => s + 1000);
                    setCurrentHouse(h => h + 1);
                    setWaveEnemies(20);
                    setWaveKills(0);
                    setGameState('houseclear');
                    setTimeout(() => {
                      if (currentHouse + 1 < GOLD_SAINTS.length) {
                        spawnBoss();
                      }
                    }, 3000);
                    return null;
                  }
                  return { ...b, health: newHealth };
                });
                hit = true;
                pierce--;
              }
            }
            
            setEnemies(prevEnemies => {
              return prevEnemies.filter(enemy => {
                if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < 20) {
                  const newHealth = enemy.health - proj.damage;
                  if (newHealth <= 0) {
                    dropExpOrb(enemy.x, enemy.y, 10);
                    setScore(s => s + 100);
                    setWaveKills(k => {
                      const newKills = k + 1;
                      if (newKills >= waveEnemies && !boss) {
                        spawnBoss();
                      }
                      return newKills;
                    });
                    hit = true;
                    pierce--;
                    return false;
                  }
                  return true;
                }
                return true;
              }).map(enemy => {
                if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < 20) {
                  return { ...enemy, health: enemy.health - proj.damage };
                }
                return enemy;
              });
            });
            
            if (!hit || pierce > 0) {
              remaining.push(proj);
            }
          }
        });
        
        return remaining;
      });
      
      setEnemies(prev => prev.filter(enemy => {
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 25) {
          setPlayer(p => {
            if (!p) return p;
            const newHealth = p.health - 5;
            if (newHealth <= 0) setGameState('gameover');
            return { ...p, health: Math.max(0, newHealth) };
          });
          return false;
        }
        return true;
      }));
      
      if (boss) {
        const now = Date.now();
        if (now - boss.lastAttack > 2000) {
          setBoss(b => {
            if (!b) return b;
            
            const pattern = Math.floor(Math.random() * 3);
            const newProjectiles: Projectile[] = [];
            
            if (pattern === 0) {
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                newProjectiles.push({
                  id: nextProjectileId.current++,
                  x: b.x,
                  y: b.y,
                  dx: Math.cos(angle) * 3,
                  dy: Math.sin(angle) * 3,
                  damage: 15,
                  color: b.gold.color,
                  pierce: 0,
                  isEnemy: true,
                  angle: angle
                });
              }
            } else if (pattern === 1) {
              const angle = Math.atan2(player.y - b.y, player.x - b.x);
              for (let i = -2; i <= 2; i++) {
                newProjectiles.push({
                  id: nextProjectileId.current++,
                  x: b.x,
                  y: b.y,
                  dx: Math.cos(angle + i * 0.2) * 4,
                  dy: Math.sin(angle + i * 0.2) * 4,
                  damage: 20,
                  color: b.gold.color,
                  pierce: 0,
                  isEnemy: true,
                  angle: angle + i * 0.2
                });
              }
            } else {
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + now / 1000;
                newProjectiles.push({
                  id: nextProjectileId.current++,
                  x: b.x,
                  y: b.y,
                  dx: Math.cos(angle) * 2,
                  dy: Math.sin(angle) * 2,
                  damage: 10,
                  color: b.gold.color,
                  pierce: 0,
                  isEnemy: true,
                  angle: angle
                });
              }
            }
            
            setProjectiles(prev => [...prev, ...newProjectiles]);
            return { ...b, lastAttack: now };
          });
        }
      }
      
      // Continuar el loop
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // Iniciar el loop
    animationFrameId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, player, gameState, keysPressed, shoot, boss, enemies, waveEnemies, waveKills, upgrades, currentHouse, spawnBoss, dropExpOrb, gainExp]);

  useEffect(() => {
    if (!canvasRef.current || !player) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const render = () => {
      // Calcular deltaTime para animaciones
      const now = Date.now();
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;
      
      // Actualizar animación del sprite
      if (playerSprite) {
        playerSprite.update(deltaTime);
        
        // Determinar animación
        if (isAttacking) {
          playerSprite.setAnimation('attack');
        } else {
          const isMoving = keysPressed.has('w') || keysPressed.has('s') || 
                          keysPressed.has('a') || keysPressed.has('d') ||
                          keysPressed.has('arrowup') || keysPressed.has('arrowdown') ||
                          keysPressed.has('arrowleft') || keysPressed.has('arrowright');
          
          if (isMoving) {
            playerSprite.setAnimation('walk');
          } else {
            playerSprite.setAnimation('idle');
          }
        }
        
        // Flip sprite según dirección
        if (keysPressed.has('a') || keysPressed.has('arrowleft')) {
          playerSprite.flipX = true;
        } else if (keysPressed.has('d') || keysPressed.has('arrowright')) {
          playerSprite.flipX = false;
        }
      }
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      if (gameState === 'playing' || gameState === 'houseclear') {
        // Guardar estado del canvas
        ctx.save();
        
        // Aplicar transformación de cámara
        ctx.translate(-camera.x, -camera.y);
        
        // Dibujar fondo del mapa con imagen repetida en su tamaño original
        if (floorImage && floorImage.complete) {
          ctx.imageSmoothingEnabled = false;
          
          // Calcular cuántas veces necesitamos repetir la imagen
          const imgWidth = floorImage.width;
          const imgHeight = floorImage.height;
          
          // Dibujar la imagen repetida manualmente
          for (let x = 0; x < MAP_WIDTH; x += imgWidth) {
            for (let y = 0; y < MAP_HEIGHT; y += imgHeight) {
              ctx.drawImage(floorImage, x, y);
            }
          }
        } else {
          // Fallback: color sólido oscuro
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        }
        
        // Actualizar efectos de ataque
        CombatSystem.updateAttackEffects();
        
        // Dibujar spawn warnings (advertencias de spawn)
        const currentTime = Date.now();
        spawnWarnings.forEach(warning => {
          const timeLeft = warning.spawnTime - currentTime;
          const progress = 1 - (timeLeft / warning.warningDuration);
          
          // Círculo pulsante que crece
          const pulseSize = 15 + Math.sin(currentTime / 100) * 5;
          const alpha = 0.3 + Math.sin(currentTime / 150) * 0.2;
          
          // Color según tipo de enemigo
          let warningColor = '#FF0000';
          if (warning.type === 'fast') warningColor = '#FF00FF';
          if (warning.type === 'tank') warningColor = '#888888';
          
          // Círculo exterior pulsante
          ctx.globalAlpha = alpha;
          ctx.fillStyle = warningColor;
          ctx.beginPath();
          ctx.arc(warning.x, warning.y, pulseSize * (1 + progress * 0.5), 0, Math.PI * 2);
          ctx.fill();
          
          // Círculo interior más sólido
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = warningColor;
          ctx.beginPath();
          ctx.arc(warning.x, warning.y, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Anillo de advertencia
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = warningColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(warning.x, warning.y, 20 - progress * 5, 0, Math.PI * 2);
          ctx.stroke();
          
          // Símbolo de alerta (!)
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', warning.x, warning.y);
          
          ctx.globalAlpha = 1;
        });
        
        // Dibujar jugador con sprite o fallback
        if (playerSprite) {
          playerSprite.draw(ctx, player.x, player.y, 64, 64);
        } else {
          ctx.fillStyle = player.knight.color;
          ctx.beginPath();
          ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
        
        enemies.forEach(enemy => {
          ctx.fillStyle = enemy.type === 'fast' ? '#FF00FF' : enemy.type === 'tank' ? '#888' : '#F00';
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#0F0';
          ctx.fillRect(enemy.x - 15, enemy.y - 20, 30, 3);
          ctx.fillStyle = '#F00';
          ctx.fillRect(enemy.x - 15, enemy.y - 20, 30 * (enemy.health / enemy.maxHealth), 3);
        });
        
        if (boss) {
          ctx.fillStyle = boss.gold.color;
          ctx.beginPath();
          ctx.arc(boss.x, boss.y, 30, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#FFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(boss.gold.name, boss.x, boss.y - 40);
          
          ctx.fillStyle = '#0F0';
          ctx.fillRect(boss.x - 40, boss.y - 50, 80, 5);
          ctx.fillStyle = '#F00';
          ctx.fillRect(boss.x - 40, boss.y - 50, 80 * (boss.health / boss.maxHealth), 5);
        }
        
        projectiles.forEach(proj => {
          // Si hay sprite de proyectil y es del jugador, usarlo
          if (projectileImage && projectileImage.complete && !proj.isEnemy) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            
            // Trasladar al centro del proyectil
            ctx.translate(proj.x, proj.y);
            
            // Rotar según el ángulo del proyectil
            ctx.rotate(proj.angle);
            
            // Tamaño del proyectil en pantalla
            const displaySize = 24;
            
            // Dibujar la imagen completa sin recortar
            ctx.drawImage(
              projectileImage,
              -displaySize/2, -displaySize/2, // Posición (centrado)
              displaySize, displaySize // Tamaño en canvas
            );
            
            ctx.restore();
          } else {
            // Fallback para proyectiles enemigos o si no carga la imagen
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        // Dibujar efectos de ataque
        CombatSystem.drawAttackEffects(ctx);
        
        expOrbs.forEach(orb => {
          ctx.fillStyle = '#0FF';
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Restaurar estado del canvas (volver a coordenadas de pantalla)
        ctx.restore();
        
        // Dibujar HUD (sin transformación de cámara)
        ctx.fillStyle = '#0F0';
        ctx.fillRect(10, 10, 200, 20);
        ctx.fillStyle = '#F00';
        ctx.fillRect(10, 10, 200 * (player.health / player.maxHealth), 20);
        
        ctx.fillStyle = '#00F';
        ctx.fillRect(10, 35, 200, 10);
        ctx.fillStyle = '#0FF';
        ctx.fillRect(10, 35, 200 * (player.exp / player.expToNext), 10);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Nivel: ${player.level}`, 220, 25);
        ctx.fillText(`Puntos: ${score}`, 220, 45);
        ctx.fillText(`Casa: ${currentHouse + 1}/12`, 10, 60);
        ctx.fillText(`Enemigos: ${waveKills}/${waveEnemies}`, 10, 75);
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [player, enemies, boss, projectiles, expOrbs, spawnWarnings, gameState, score, currentHouse, waveKills, waveEnemies, playerSprite, keysPressed, isAttacking, projectileImage, floorImage, camera]);

  if (!gameStarted) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: '#111',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', color: '#FFD700' }}>
          Saint Seiya: Las 12 Casas
        </h1>
        <h2 style={{ marginBottom: '2rem' }}>Selecciona tu Caballero de Bronce</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {BRONZE_KNIGHTS.map(knight => (
            <div
              key={knight.id}
              onClick={() => selectKnight(knight)}
              style={{
                padding: '1.5rem',
                border: `3px solid ${knight.color}`,
                borderRadius: '10px',
                cursor: 'pointer',
                backgroundColor: '#222',
                transition: 'transform 0.2s',
                width: '200px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h3 style={{ color: knight.color, marginBottom: '1rem' }}>{knight.name}</h3>
              <p><strong>Ataque:</strong> {knight.attack}</p>
              <p><strong>Velocidad:</strong> {knight.speed}</p>
              <p><strong>Daño:</strong> {knight.damage}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '3rem', maxWidth: '600px', textAlign: 'center' }}>
          <h3>Controles:</h3>
          <p>WASD o Flechas - Movimiento</p>
          <p>Disparo automático</p>
          <p>Derrota enemigos para subir de nivel y mejorar</p>
          <p>¡Atraviesa las 12 Casas del Santuario!</p>
        </div>
      </div>
    );
  }

  if (gameState === 'levelup') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#FFD700', marginBottom: '2rem' }}>¡Nivel Superior!</h1>
          <h2 style={{ marginBottom: '2rem' }}>Elige una mejora:</h2>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            {upgradeChoices.map(upgrade => {
              const currentLevel = upgrades[upgrade.id as keyof PlayerUpgrades] || 0;
              const maxLevel = upgrade.levels.length;
              
              return (
                <div
                  key={upgrade.id}
                  onClick={() => selectUpgrade(upgrade.id)}
                  style={{
                    padding: '2rem',
                    border: '3px solid #FFD700',
                    borderRadius: '10px',
                    cursor: currentLevel < maxLevel ? 'pointer' : 'not-allowed',
                    backgroundColor: '#222',
                    width: '200px',
                    opacity: currentLevel < maxLevel ? 1 : 0.5
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{upgrade.icon}</div>
                  <h3 style={{ color: '#FFD700' }}>{upgrade.name}</h3>
                  <p>{upgrade.desc}</p>
                  <p style={{ marginTop: '1rem', color: '#0FF' }}>
                    Nivel: {currentLevel}/{maxLevel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'houseclear') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#FFD700', fontSize: '3rem', marginBottom: '2rem' }}>
            ¡Casa Conquistada!
          </h1>
          {currentHouse < GOLD_SAINTS.length && (
            <h2 style={{ color: '#0FF' }}>
              Has derrotado a {GOLD_SAINTS[currentHouse - 1]?.name}
            </h2>
          )}
          {currentHouse >= GOLD_SAINTS.length && (
            <div>
              <h2 style={{ color: '#0FF', marginBottom: '2rem' }}>
                ¡Has conquistado las 12 Casas del Santuario!
              </h2>
              <p style={{ fontSize: '1.5rem' }}>Puntuación Final: {score}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#F00', fontSize: '3rem', marginBottom: '2rem' }}>
            Game Over
          </h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Puntuación: {score}</p>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            Llegaste a la Casa {currentHouse + 1}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              backgroundColor: '#FFD700',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              color: '#000',
              fontWeight: 'bold'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#111'
    }}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          border: '2px solid #FFD700',
          backgroundColor: '#000'
        }}
      />
    </div>
  );
};

export default SaintSeiyaGame;

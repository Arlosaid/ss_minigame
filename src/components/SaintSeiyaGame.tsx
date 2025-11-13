import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Knight, GoldSaint, Upgrade } from '../data/gameData';
import { BRONZE_KNIGHTS, GOLD_SAINTS, UPGRADES } from '../data/gameData';
import { createPlayerSprite, createEnemySprite, createBossSprite, AnimatedSprite } from '../systems/SpriteSystem';
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
  cosmos: number; // Energía Cósmica (reemplaza exp)
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
  cosmosValue: number; // Cantidad de cosmos que dropea
  sprite?: AnimatedSprite; // Sprite del enemigo
}

interface Boss {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  gold: GoldSaint;
  lastAttack: number;
  lastSuperAttack: number; // Tracker para super ataque cada 10s
  phase: number;
  sprite?: AnimatedSprite; // Sprite del boss
  isAttacking?: boolean; // Estado de ataque
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
  color: string;
  isEnemy: boolean;
  angle: number;
}

interface Drop {
  id: number;
  x: number;
  y: number;
  value: number;
  type: 'cosmos' | 'health'; // Tipos de drops
  lifetime: number; // Tiempo de vida en segundos
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
  maxHealth: number;
  explosion: number;
}

interface BossAttackEffect {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  createdAt: number;
  duration: number;
  angle: number;
  scale: number;
}

interface BossSuperAttackWarning {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  createdAt: number;
  warningDuration: number;
  executionTime: number;
}

interface BossSuperAttack {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  damage: number;
  createdAt: number;
  duration: number;
}

const SaintSeiyaGame: React.FC = () => {
  const [gameStarted] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
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
    maxHealth: 0,
    explosion: 0
  });
  const [upgradeChoices, setUpgradeChoices] = useState<Upgrade[]>([]);
  const [playerSprite, setPlayerSprite] = useState<AnimatedSprite | null>(null);
  const [bossSprite, setBossSprite] = useState<AnimatedSprite | null>(null);
  const [bossAttackImage, setBossAttackImage] = useState<HTMLImageElement | null>(null);
  const [bossSuperAttackSprites, setBossSuperAttackSprites] = useState<HTMLImageElement[]>([]);
  const [bossAttackEffects, setBossAttackEffects] = useState<BossAttackEffect[]>([]);
  const [bossSuperAttackWarnings, setBossSuperAttackWarnings] = useState<BossSuperAttackWarning[]>([]);
  const [bossSuperAttacks, setBossSuperAttacks] = useState<BossSuperAttack[]>([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [projectileImage, setProjectileImage] = useState<HTMLImageElement | null>(null);
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [stageTime, setStageTime] = useState(0);
  const [waveNumber, setWaveNumber] = useState(1);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const stageStartTime = useRef<number>(0);
  const backgroundMusic = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const bossRef = useRef<Boss | null>(null);
  const stageTimeRef = useRef<number>(0);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const dropsRef = useRef<Drop[]>([]);
  const spawnWarningsRef = useRef<SpawnWarning[]>([]);
  const lastCleanupTime = useRef<number>(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextEnemyId = useRef(0);
  const nextProjectileId = useRef(0);
  const nextOrbId = useRef(0);
  const nextWarningId = useRef(0);
  const nextBossEffectId = useRef(0);
  const nextSuperAttackId = useRef(0);
  const lastFrameTime = useRef<number>(Date.now());
  const enemySpritePool = useRef<AnimatedSprite[]>([]);
  const nextSpriteIndex = useRef(0);
  
  // Mantener refs actualizados para acceso rápido
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  
  useEffect(() => {
    bossRef.current = boss;
  }, [boss]);
  
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);
  
  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);
  
  useEffect(() => {
    dropsRef.current = drops;
  }, [drops]);
  
  useEffect(() => {
    spawnWarningsRef.current = spawnWarnings;
  }, [spawnWarnings]);

  const initializeGame = async () => {
    // Usar el primer caballero por defecto (Seiya)
    const knight = BRONZE_KNIGHTS[0]!;
    const initialX = MAP_WIDTH / 2;
    const initialY = MAP_HEIGHT / 2;
    
    setPlayer({
      x: initialX,
      y: initialY,
      knight,
      health: 100,
      maxHealth: 100,
      cosmos: 0,
      level: 1
    });
    
    // Inicializar cámara centrada en el jugador
    const camX = Math.max(0, Math.min(MAP_WIDTH - WIDTH, initialX - WIDTH / 2));
    const camY = Math.max(0, Math.min(MAP_HEIGHT - HEIGHT, initialY - HEIGHT / 2));
    setCamera({ x: camX, y: camY });
    
    setCurrentHouse(0);
    setWaveEnemies(100); // Número alto para modo survival continuo
    setWaveKills(0);
    setGameState('playing');
    setStageTime(0);
    setWaveNumber(1);
    stageStartTime.current = Date.now();
    
    // Inicializar música de fondo
    if (!backgroundMusic.current) {
      const audio = new Audio('/music.mp3');
      audio.loop = true;
      audio.volume = 0.3;
      audio.play().catch(err => console.log('Audio playback failed:', err));
      backgroundMusic.current = audio;
    }
    
    // Cargar sprite del jugador
    try {
      const sprite = await createPlayerSprite();
      setPlayerSprite(sprite);
      console.log('Player sprite loaded');
      
      // Precargar pool de sprites de enemigos (30 sprites reutilizables)
      console.log('Preloading enemy sprite pool...');
      const enemyPool: AnimatedSprite[] = [];
      for (let i = 0; i < 30; i++) {
        const enemySprite = await createEnemySprite();
        enemyPool.push(enemySprite);
      }
      enemySpritePool.current = enemyPool;
      console.log('Enemy sprite pool loaded:', enemyPool.length);
      
      // Cargar sprite del boss
      const bSprite = await createBossSprite();
      setBossSprite(bSprite);
      console.log('Boss sprite loaded');
      
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
      
      // Cargar sprite de ataque del boss
      const bossAttackImg = new Image();
      bossAttackImg.onload = () => {
        setBossAttackImage(bossAttackImg);
        console.log('Boss attack sprite loaded');
      };
      bossAttackImg.onerror = () => {
        console.error('Failed to load boss attack sprite');
      };
      bossAttackImg.src = '/sprites/attacks/boss_attack.png';
      
      // Cargar sprites de super ataque del boss (animación de 3 frames)
      const superAttackSprites: HTMLImageElement[] = [];
      for (let i = 1; i <= 3; i++) {
        const img = new Image();
        img.src = `/sprites/attacks/boss_super_attack${i}.png`;
        img.onload = () => {
          console.log(`Boss super attack sprite ${i} loaded`);
          if (i === 3) {
            setBossSuperAttackSprites([...superAttackSprites]);
          }
        };
        img.onerror = () => {
          console.error(`Failed to load boss super attack sprite ${i}`);
        };
        superAttackSprites.push(img);
      }
      
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
      console.error('Failed to load sprites:', error);
    }
  };

  // Inicializar el juego automáticamente al montar el componente
  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      lastSuperAttack: 0,
      phase: 1,
      sprite: bossSprite || undefined,
      isAttacking: false
    });
    setGameState('playing');
    setWaveNumber(1);
    setStageTime(0);
    stageStartTime.current = Date.now();
  }, [currentHouse, bossSprite]);

  const dropItem = useCallback((x: number, y: number, type: 'cosmos' | 'health', value: number) => {
    setDrops(prev => [...prev, {
      id: nextOrbId.current++,
      x, y, 
      type,
      value,
      lifetime: type === 'health' ? 8 : 15 // Health dura 8s, cosmos 15s
    }]);
  }, []);

  const shoot = useCallback(() => {
    // Log SIEMPRE al inicio (con throttle para no saturar)
    if (Math.random() < 0.02) { // 2% de las veces
      console.log('[SHOOT] 🔫 Función shoot() ejecutada');
    }
    
    const currentPlayer = playerRef.current;
    if (!currentPlayer) {
      if (Math.random() < 0.02) console.log('[SHOOT] ❌ No hay currentPlayer');
      return;
    }
    if (gameState !== 'playing') {
      if (Math.random() < 0.02) console.log('[SHOOT] ❌ GameState no es playing:', gameState);
      return;
    }
    
    const now = Date.now();
    const fireRate = currentPlayer.knight.fireRate - upgrades.fireRate * 50;
    const cooldownTime = Math.max(200, fireRate);
    const timeSinceLastShot = now - lastShot;
    
    if (timeSinceLastShot < cooldownTime) {
      // No loguear esto cada frame, solo ocasionalmente
      return;
    }
    
    console.log('[SHOOT] ✅ Cooldown pasado, intentando disparar...');
    setLastShot(now);
    
    // Configuración del rango de ataque (más amplio tipo Vampire Survivors)
    const attackRange = 450; // Rango máximo de ataque en píxeles
    
    // Encontrar el enemigo más cercano usando el CombatSystem
    const nearestEnemy = CombatSystem.findNearestEnemy(
      { x: currentPlayer.x, y: currentPlayer.y },
      enemiesRef.current,
      attackRange
    );
    
    console.log(`[SHOOT] Enemigos en array: ${enemiesRef.current.length}, Enemigo más cercano: ${nearestEnemy ? 'SÍ' : 'NO'}`);
    
    // Determinar el objetivo (enemigo cercano o boss si está cerca)
    let target: { x: number; y: number; id: number } | null = nearestEnemy;
    
    // Si hay un boss, verificar si está en rango y priorizarlo
    const currentBoss = bossRef.current;
    if (currentBoss) {
      const bossDist = CombatSystem.calculateDistance(
        { x: currentPlayer.x, y: currentPlayer.y },
        { x: currentBoss.x, y: currentBoss.y }
      );
      
      console.log(`[SHOOT] Boss encontrado, distancia: ${bossDist.toFixed(1)}px (rango: ${attackRange}px)`);
      
      if (bossDist <= attackRange) {
        // Si el boss está en rango, priorizarlo
        target = currentBoss;
        console.log('[SHOOT] ✅ Boss seleccionado como objetivo');
      }
    }
    
    // Si no hay objetivo en rango, NO disparar
    if (!target) {
      console.log('[SHOOT] ❌ NO HAY OBJETIVO EN RANGO - No se dispara');
      return; // No hay enemigos en rango
    }
    
    console.log('[SHOOT] 🎯 OBJETIVO ENCONTRADO - Creando proyectiles...');
    
    // Crear efecto visual de ataque
    CombatSystem.createAttackEffect({ x: currentPlayer.x, y: currentPlayer.y }, target);
    
    // Activar animación de ataque
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 200);
    
    const shots = 1 + upgrades.multiShot;
    const newProjectiles: Projectile[] = [];
    
    // Calcular ángulo base hacia el objetivo
    const baseAngle = Math.atan2(target.y - currentPlayer.y, target.x - currentPlayer.x);
    
    for (let i = 0; i < shots; i++) {
      // Calcular ángulo individual para cada disparo (spread)
      const angle = shots === 1 ? baseAngle : baseAngle + (i - (shots - 1) / 2) * 0.2;
      
      // Calcular posición inicial del proyectil usando el ángulo individual
      const offsetDistance = 25; // Distancia desde el centro del jugador
      const startX = currentPlayer.x + Math.cos(angle) * offsetDistance;
      const startY = currentPlayer.y + Math.sin(angle) * offsetDistance;
      
      const projId = nextProjectileId.current++;
      newProjectiles.push({
        id: projId,
        x: startX,
        y: startY,
        dx: Math.cos(angle) * 2.0, // Velocidad reducida para mejor visualización
        dy: Math.sin(angle) * 2.0, // Velocidad reducida para mejor visualización
        damage: currentPlayer.knight.damage + upgrades.damage,
        color: currentPlayer.knight.projectileColor,
        isEnemy: false,
        angle: angle
      });
      console.log(`[SHOOT] Proyectil ${projId} creado en (${startX.toFixed(1)}, ${startY.toFixed(1)}) hacia ángulo ${(angle * 180 / Math.PI).toFixed(1)}° con daño ${currentPlayer.knight.damage + upgrades.damage}`);
    }
    
    setProjectiles(prev => [...prev, ...newProjectiles]);
  }, [gameState, lastShot, upgrades]);

  const gainCosmos = useCallback((amount: number) => {
    if (!player) return;
    
    setPlayer(prev => {
      if (!prev) return prev;
      
      let newCosmos = prev.cosmos + amount;
      let newLevel = prev.level;
      
      // Fórmula de cosmos requerido: comienza en 10, incrementa de 5 en 5
      let cosmosRequired = 10 + ((newLevel - 1) * 5);
      
      while (newCosmos >= cosmosRequired) {
        newCosmos -= cosmosRequired;
        newLevel++;
        cosmosRequired = 10 + ((newLevel - 1) * 5);
        
        const choices: Upgrade[] = [];
        while (choices.length < 3) {
          const upgrade = UPGRADES[Math.floor(Math.random() * UPGRADES.length)]!;
          if (!choices.includes(upgrade)) choices.push(upgrade);
        }
        setUpgradeChoices(choices);
        setGameState('levelup');
      }
      
      return { 
        ...prev, 
        cosmos: newCosmos, 
        level: newLevel
      };
    });
  }, [player]);

  const selectUpgrade = (upgradeId: string) => {
    setUpgrades(prev => {
      const current = prev[upgradeId as keyof PlayerUpgrades] || 0;
      const upgrade = UPGRADES.find(u => u.id === upgradeId);
      if (!upgrade || current >= upgrade.levels.length) return prev;
      
      return { ...prev, [upgradeId]: current + 1 };
    });
    
    // Aplicar mejora de maxHealth inmediatamente si es el caso
    if (upgradeId === 'maxHealth') {
      setPlayer(p => {
        if (!p) return p;
        const healthBonus = 75; // +75 HP por nivel
        return { 
          ...p, 
          maxHealth: p.maxHealth + healthBonus,
          health: p.health + healthBonus // También aumentar la vida actual
        };
      });
    }
    
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

  // Limpiar audio al desmontar componente
  useEffect(() => {
    return () => {
      if (backgroundMusic.current) {
        backgroundMusic.current.pause();
        backgroundMusic.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || gameState !== 'playing' || boss) {
      return;
    }
    
    // Sistema progresivo con spawn interval balanceado estilo Vampire Survivors
    const baseInterval = 2500; // 2.5 segundos base (más rápido)
    const reduction = (waveNumber - 1) * 80; // Reducir 80ms por oleada
    const spawnInterval = Math.max(1000, baseInterval - reduction); // Mínimo 1 segundo
    
    const interval = setInterval(() => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;
      
      // Límite de enemigos activos progresivo
      const maxActiveEnemies = Math.min(8 + Math.floor(waveNumber * 1.5), 25); // Empezar con 8, máximo 25
      
      setEnemies(currentEnemies => {
        if (currentEnemies.length >= maxActiveEnemies) {
          return currentEnemies;
        }
        // Limpieza periódica: remover enemigos muy lejanos
        const now = Date.now();
        if (now - lastCleanupTime.current > 5000) { // Cada 5 segundos
          lastCleanupTime.current = now;
          const currentPlayer = playerRef.current;
          if (currentPlayer) {
            return currentEnemies.filter(e => {
              const dist = Math.hypot(currentPlayer.x - e.x, currentPlayer.y - e.y);
              return dist <= 1200; // Mantener solo enemigos dentro de 1200px
            });
          }
        }
        return currentEnemies;
      });
      
      // Sistema de oleadas progresivo con más enemigos
      let availableTypes: Array<'normal' | 'fast' | 'tank'> = ['normal'];
      if (waveNumber >= 2) availableTypes.push('fast');
      if (waveNumber >= 3) availableTypes.push('tank');
      
      // A partir de oleada 5, mezclar tipos
      let type: 'normal' | 'fast' | 'tank';
      if (waveNumber >= 5 && Math.random() < 0.3) {
        // 30% de probabilidad de enemigo especial en oleadas altas
        type = availableTypes[1 + Math.floor(Math.random() * (availableTypes.length - 1))]!;
      } else {
        type = availableTypes[Math.floor(Math.random() * availableTypes.length)]!;
      }
      
      // Spawn en un ANILLO alrededor del jugador (350-500 píxeles de distancia)
      const spawnDistance = 350 + Math.random() * 150;
      const angle = Math.random() * Math.PI * 2;
      
      let x = currentPlayer.x + Math.cos(angle) * spawnDistance;
      let y = currentPlayer.y + Math.sin(angle) * spawnDistance;
      
      // Mantener dentro de los límites del mapa
      x = Math.max(50, Math.min(MAP_WIDTH - 50, x));
      y = Math.max(50, Math.min(MAP_HEIGHT - 50, y));
      
      // Crear advertencia de spawn (0.8 segundos)
      const warning: SpawnWarning = {
        id: nextWarningId.current++,
        x, y,
        type,
        spawnTime: Date.now() + 800,
        warningDuration: 800
      };
      
      setSpawnWarnings(prev => {
        // Límite muy conservador para evitar lag
        const maxWarnings = Math.min(2 + Math.floor(waveNumber / 2), 10);
        if (prev.length >= maxWarnings) {
          return prev;
        }
        return [...prev, warning];
      });
    }, spawnInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [gameStarted, gameState, waveNumber, boss]);

  useEffect(() => {
    if (!gameStarted || !player || gameState !== 'playing') return;
    
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;
      
      // Capturar estados actuales al inicio del frame
      const currentProjectiles = projectilesRef.current;
      const currentEnemies = enemiesRef.current;
      const currentBoss = bossRef.current;
      
      // Calcular deltaTime en segundos
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Limitar a 100ms máximo
      lastTime = currentTime;
      
      // Actualizar timer del stage
      const currentStageTime = Math.floor((Date.now() - stageStartTime.current) / 1000);
      setStageTime(currentStageTime);
      stageTimeRef.current = currentStageTime;
      
      // Verificar si debe aparecer el jefe al minuto 2 (120 segundos)
      if (currentStageTime >= 120 && !bossRef.current) {
        spawnBoss();
      }
      
      // Velocidad base en píxeles por segundo (reducida para mejor control)
      const baseSpeed = 180; // Velocidad base más balanceada
      const speedMultiplier = currentPlayer.knight.speed + upgrades.speed * 0.5;
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
        const newX = Math.max(20, Math.min(MAP_WIDTH - 20, currentPlayer.x + normalizedDx));
        const newY = Math.max(20, Math.min(MAP_HEIGHT - 20, currentPlayer.y + normalizedDy));
        
        // Actualizar posición del jugador
        setPlayer(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            x: newX,
            y: newY
          };
        });
        
        // Actualizar cámara para seguir al jugador suavemente
        const newCamX = Math.max(0, Math.min(MAP_WIDTH - WIDTH, newX - WIDTH / 2));
        const newCamY = Math.max(0, Math.min(MAP_HEIGHT - HEIGHT, newY - HEIGHT / 2));
        setCamera({ x: newCamX, y: newCamY });
      }
      
      // ===== SISTEMA DE DISPARO AUTOMÁTICO (INLINE) =====
      const nowShoot = Date.now();
      const fireRate = currentPlayer.knight.fireRate - upgrades.fireRate * 50;
      const cooldownTime = Math.max(200, fireRate);
      
      let projectilesToAdd: Projectile[] = [];
      
      if (nowShoot - lastShot >= cooldownTime) {
        // Cooldown pasado, intentar disparar
        const attackRange = 450;
        
        // Encontrar el enemigo más cercano
        const nearestEnemy = CombatSystem.findNearestEnemy(
          { x: currentPlayer.x, y: currentPlayer.y },
          currentEnemies,
          attackRange
        );
        
        // Determinar el objetivo
        let target: { x: number; y: number; id: number } | null = nearestEnemy;
        
        // Priorizar boss si está en rango
        if (currentBoss) {
          const bossDist = CombatSystem.calculateDistance(
            { x: currentPlayer.x, y: currentPlayer.y },
            { x: currentBoss.x, y: currentBoss.y }
          );
          
          if (bossDist <= attackRange) {
            target = currentBoss;
          }
        }
        
        // Si hay objetivo, disparar
        if (target) {
          setLastShot(nowShoot);
          
          // Crear efecto visual de ataque
          CombatSystem.createAttackEffect({ x: currentPlayer.x, y: currentPlayer.y }, target);
          
          // Activar animación de ataque
          setIsAttacking(true);
          setTimeout(() => setIsAttacking(false), 200);
          
          const shots = 1 + upgrades.multiShot;
          
          // Calcular ángulo base hacia el objetivo
          const baseAngle = Math.atan2(target.y - currentPlayer.y, target.x - currentPlayer.x);
          
          for (let i = 0; i < shots; i++) {
            const angle = shots === 1 ? baseAngle : baseAngle + (i - (shots - 1) / 2) * 0.2;
            const offsetDistance = 25;
            const startX = currentPlayer.x + Math.cos(angle) * offsetDistance;
            const startY = currentPlayer.y + Math.sin(angle) * offsetDistance;
            
            const projId = nextProjectileId.current++;
            projectilesToAdd.push({
              id: projId,
              x: startX,
              y: startY,
              dx: Math.cos(angle) * 2.0,
              dy: Math.sin(angle) * 2.0,
              damage: currentPlayer.knight.damage + upgrades.damage,
              color: currentPlayer.knight.projectileColor,
              isEnemy: false,
              angle: angle
            });
            console.log(`[SHOOT] Proyectil ${projId} creado hacia (${target.x.toFixed(1)}, ${target.y.toFixed(1)}) - Daño: ${currentPlayer.knight.damage + upgrades.damage}`);
          }
        }
      }
      // ===== FIN SISTEMA DE DISPARO =====
      
      // Procesar spawn warnings y convertir en enemigos cuando sea tiempo
      const now = Date.now();
      setSpawnWarnings(prev => {
        if (prev.length === 0) return prev;
        
        const remaining: SpawnWarning[] = [];
        let spawned = 0;
        
        prev.forEach(warning => {
          if (now >= warning.spawnTime) {
            // Crear el enemigo con estadísticas balanceadas y escalado por oleada
            let health: number, maxHealth: number, speed: number, cosmosValue: number;
            
            // Escalado progresivo de dificultad optimizado para Vampire Survivors
            // Oleada 1: Enemigos débiles (mueren de 1 golpe con daño 18)
            // Oleada 5+: Enemigos más resistentes
            const baseHpMultiplier = 1 + (waveNumber - 1) * 0.12; // +12% HP por oleada
            const speedMultiplier = 1 + (waveNumber - 1) * 0.05; // +5% velocidad por oleada
            
            switch (warning.type) {
              case 'tank':
                // Oleada 1: ~30 HP (2 golpes con daño 18)
                health = Math.floor((30 + (waveNumber * 5)) * baseHpMultiplier);
                maxHealth = health;
                speed = 0.45 * speedMultiplier; // Lento pero escala
                cosmosValue = 5 + Math.floor(Math.random() * 4); // 5-8 cosmos
                break;
              case 'fast':
                // Oleada 1: ~10 HP (1 golpe con daño 18)
                health = Math.floor((10 + (waveNumber * 2)) * baseHpMultiplier);
                maxHealth = health;
                speed = 1.6 * speedMultiplier; // Muy rápido
                cosmosValue = 3 + Math.floor(Math.random() * 3); // 3-5 cosmos
                break;
              default: // 'normal'
                // Oleada 1: ~15 HP (1 golpe con daño 18)
                health = Math.floor((15 + (waveNumber * 3)) * baseHpMultiplier);
                maxHealth = health;
                speed = 0.85 * speedMultiplier; // Velocidad media
                cosmosValue = 2 + Math.floor(Math.random() * 3); // 2-4 cosmos
            }
            
            // Obtener sprite del pool (reutilizar sprites precargados)
            let sprite: AnimatedSprite | undefined;
            if (enemySpritePool.current.length > 0) {
              // Usar el siguiente sprite del pool de forma circular
              sprite = enemySpritePool.current[nextSpriteIndex.current % enemySpritePool.current.length];
              nextSpriteIndex.current++;
            }
            
            const enemy: Enemy = {
              id: nextEnemyId.current++,
              x: warning.x,
              y: warning.y,
              health,
              maxHealth,
              speed,
              type: warning.type,
              angle: 0,
              cosmosValue,
              sprite
            };
            
            setEnemies(e => [...e, enemy]);
            spawned++;
          } else {
            remaining.push(warning);
          }
        });
        
        return remaining;
      });
      
      // ===== NUEVO SISTEMA INTEGRADO: MOVIMIENTO + COLISIONES =====
      
      // Combinar proyectiles existentes con los nuevos del disparo
      const allProjectiles = [...currentProjectiles, ...projectilesToAdd];
      console.log(`[FRAME] Total proyectiles a procesar: ${allProjectiles.length} (${currentProjectiles.length} existentes + ${projectilesToAdd.length} nuevos)`);
      
      // PASO 1: Mover proyectiles
      const movedProjectiles: Projectile[] = [];
      const cameraMargin = 200;
      
      for (const p of allProjectiles) {
        const newX = p.x + p.dx * 2.5;
        const newY = p.y + p.dy * 2.5;
        
        // Verificar si está en rango de la cámara
        const inCameraRange = 
          newX >= camera.x - cameraMargin && 
          newX <= camera.x + WIDTH + cameraMargin &&
          newY >= camera.y - cameraMargin && 
          newY <= camera.y + HEIGHT + cameraMargin;
        
        if (inCameraRange) {
          movedProjectiles.push({ ...p, x: newX, y: newY });
        }
      }
      
      console.log(`[MOVED] Proyectiles movidos y en cámara: ${movedProjectiles.length}`);
      
      // PASO 2: Mover enemigos y verificar colisión con jugador
      const movedEnemies: Enemy[] = [];
      let playerDamaged = false;
      let screenShakeNeeded = false;
      
      for (const enemy of currentEnemies) {
        // Actualizar sprite
        if (enemy.sprite) {
          enemy.sprite.update(deltaTime);
        }
        
        // Verificar colisión con jugador (contacto físico)
        if (Math.hypot(currentPlayer.x - enemy.x, currentPlayer.y - enemy.y) < 30) {
          if (!playerDamaged) {
            playerDamaged = true;
            screenShakeNeeded = true;
          }
          continue; // Eliminar enemigo que tocó al jugador
        }
        
        // Mover enemigo hacia el jugador
        const angle = Math.atan2(currentPlayer.y - enemy.y, currentPlayer.x - enemy.x);
        const baseEnemySpeed = 120;
        const actualSpeed = baseEnemySpeed * enemy.speed * deltaTime;
        
        const newX = enemy.x + Math.cos(angle) * actualSpeed;
        const newY = enemy.y + Math.sin(angle) * actualSpeed;
        
        // Flip sprite según dirección
        if (enemy.sprite) {
          enemy.sprite.flipX = angle > Math.PI / 2 || angle < -Math.PI / 2;
        }
        
        movedEnemies.push({
          ...enemy,
          x: newX,
          y: newY,
          angle: angle
        });
      }
      
      // Aplicar daño del jugador si fue golpeado
      if (playerDamaged) {
        setPlayer(p => {
          if (!p) return p;
          const newHealth = p.health - 5;
          if (newHealth <= 0) setGameState('gameover');
          return { ...p, health: Math.max(0, newHealth) };
        });
        if (screenShakeNeeded) {
          setScreenShake({ x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 });
          setTimeout(() => setScreenShake({ x: 0, y: 0 }), 100);
        }
      }
      
      // PASO 3: Procesar colisiones de proyectiles
      const projectilesToKeep: Projectile[] = [];
      const enemiesToKeep: Enemy[] = [];
      const newDrops: Drop[] = [];
      let addScore = 0;
      let addKills = 0;
      
      const enemiesAlive = new Set(movedEnemies.map(e => e.id));
      
      console.log(`[COLLISION] Proyectiles: ${movedProjectiles.length}, Enemigos: ${movedEnemies.length}`);
      
      for (const proj of movedProjectiles) {
        let projectileHit = false;
        
        if (proj.isEnemy) {
          // Proyectil enemigo vs jugador
          const distToPlayer = Math.hypot(currentPlayer.x - proj.x, currentPlayer.y - proj.y);
          if (distToPlayer < 25) {
            projectileHit = true;
            setPlayer(p => {
              if (!p) return p;
              const newHealth = p.health - 10;
              if (newHealth <= 0) setGameState('gameover');
              return { ...p, health: Math.max(0, newHealth) };
            });
            setScreenShake({ x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 });
            setTimeout(() => setScreenShake({ x: 0, y: 0 }), 100);
          }
        } else {
          // Proyectil del jugador vs enemigos
          for (const enemy of movedEnemies) {
            if (!enemiesAlive.has(enemy.id)) continue;
            
            const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
            if (dist < 30) {
              projectileHit = true;
              enemy.health -= proj.damage;
              
              console.log(`[HIT] Proyectil ${proj.id} → Enemigo ${enemy.id} | HP: ${enemy.health + proj.damage} → ${enemy.health}`);
              
              if (enemy.health <= 0) {
                console.log(`[KILL] Enemigo ${enemy.id} eliminado`);
                enemiesAlive.delete(enemy.id);
                
                const rand = Math.random();
                newDrops.push({
                  id: nextOrbId.current++,
                  x: enemy.x,
                  y: enemy.y,
                  type: rand < 0.08 ? 'health' : 'cosmos',
                  value: rand < 0.08 ? 20 : enemy.cosmosValue,
                  lifetime: rand < 0.08 ? 8 : 15
                });
                
                addScore += 100;
                addKills += 1;
              }
              break;
            }
          }
          
          // Proyectil del jugador vs boss
          if (!projectileHit && currentBoss) {
            const distBoss = Math.hypot(currentBoss.x - proj.x, currentBoss.y - proj.y);
            if (distBoss < 50) {
              projectileHit = true;
              setBoss(b => {
                if (!b) return b;
                const newHealth = b.health - proj.damage;
                console.log(`[BOSS HIT] HP: ${b.health} → ${newHealth}`);
                
                if (newHealth <= 0) {
                  console.log(`[BOSS DEFEATED]`);
                  newDrops.push({
                    id: nextOrbId.current++,
                    x: b.x, y: b.y,
                    type: 'cosmos',
                    value: 40 + Math.floor(Math.random() * 11),
                    lifetime: 15
                  });
                  addScore += 1000;
                  setCurrentHouse(h => h + 1);
                  setWaveNumber(1);
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
            }
          }
        }
        
        if (!projectileHit) {
          projectilesToKeep.push(proj);
        }
      }
      
      // Filtrar enemigos vivos
      for (const enemy of movedEnemies) {
        if (enemiesAlive.has(enemy.id)) {
          enemiesToKeep.push(enemy);
        }
      }
      
      console.log(`[RESULT] Proyectiles finales: ${projectilesToKeep.length}, Enemigos: ${enemiesToKeep.length}, Kills: ${addKills}`);
      
      // Actualizar estados AL FINAL DEL FRAME
      setProjectiles(projectilesToKeep);
      projectilesRef.current = projectilesToKeep;
      setEnemies(enemiesToKeep);
      enemiesRef.current = enemiesToKeep;
      
      if (newDrops.length > 0) {
        setDrops(prev => {
          const combined = [...prev, ...newDrops];
          return combined.length > 30 ? combined.slice(-30) : combined;
        });
      }
      
      if (addScore > 0) setScore(s => s + addScore);
      if (addKills > 0) {
        setWaveKills(k => {
          const newKills = k + addKills;
          if (newKills >= 25) {
            setWaveNumber(w => w + 1);
            return 0;
          }
          return newKills;
        });
      }
      
      // Actualizar drops: simplemente actualizar lifetime
      setDrops(prev => {
        const updatedDrops = prev
          .map(drop => {
            const newLifetime = drop.lifetime - deltaTime;
            if (newLifetime <= 0) return null;
            return { ...drop, lifetime: newLifetime };
          })
          .filter(drop => drop !== null) as Drop[];
        
        const maxDrops = 20;
        if (updatedDrops.length > maxDrops) {
          return updatedDrops.sort((a, b) => b.lifetime - a.lifetime).slice(0, maxDrops);
        }
        return updatedDrops;
      });
      
      // Recolectar drops - radio más grande para compensar falta de atracción
      setDrops(prev => prev.filter(drop => {
        if (Math.hypot(currentPlayer.x - drop.x, currentPlayer.y - drop.y) < 40) {
          // Procesar el drop según tipo
          if (drop.type === 'cosmos') {
            gainCosmos(drop.value);
          } else if (drop.type === 'health') {
            // Recuperar vida
            setPlayer(p => {
              if (!p) return p;
              const newHealth = Math.min(p.maxHealth, p.health + drop.value);
              return { ...p, health: newHealth };
            });
          }
          return false; // Remover el drop
        }
        return true;
      }));
      
      // Actualizar lógica del boss
      if (currentBoss) {
        const now = Date.now();
        
        // Super ataque cada 10 segundos (10000ms)
        if (now - currentBoss.lastSuperAttack > 10000) {
          setBoss(b => {
            if (!b) return b;
            
            // Calcular dirección hacia el jugador
            const angle = Math.atan2(currentPlayer.y - b.y, currentPlayer.x - b.x);
            
            // Crear advertencia de área de ataque
            // El ataque será un rectángulo largo (200x400) en la dirección del jugador
            const warningWidth = 200;
            const warningHeight = 400;
            
            // Calcular posición del centro del área de ataque (frente al boss)
            const attackDistance = warningHeight / 2 + 60; // Distancia desde el boss al centro del ataque
            const attackX = b.x + Math.cos(angle) * attackDistance;
            const attackY = b.y + Math.sin(angle) * attackDistance;
            
            const warning: BossSuperAttackWarning = {
              id: nextSuperAttackId.current++,
              x: attackX,
              y: attackY,
              width: warningWidth,
              height: warningHeight,
              angle: angle,
              createdAt: now,
              warningDuration: 1500, // 1.5 segundos de advertencia
              executionTime: now + 1500
            };
            
            setBossSuperAttackWarnings(prev => [...prev, warning]);
            
            return { ...b, lastSuperAttack: now };
          });
        }
        
        // Ataque regular cada 2 segundos
        if (now - currentBoss.lastAttack > 2000) {
          setBoss(b => {
            if (!b) return b;
            
            // Activar animación de ataque
            if (b.sprite) {
              b.sprite.setAnimation('attack');
            }
            
            const pattern = Math.floor(Math.random() * 3);
            const newProjectiles: Projectile[] = [];
            const newEffects: BossAttackEffect[] = [];
            
            if (pattern === 0) {
              // Patrón circular: 8 bolas de poder en todas direcciones
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
                  isEnemy: true,
                  angle: angle
                });
                
                // Crear efecto visual para cada dirección
                newEffects.push({
                  id: nextBossEffectId.current++,
                  x: b.x,
                  y: b.y,
                  targetX: b.x + Math.cos(angle) * 150,
                  targetY: b.y + Math.sin(angle) * 150,
                  createdAt: Date.now(),
                  duration: 600,
                  angle: angle,
                  scale: 1
                });
              }
            } else if (pattern === 1) {
              // Patrón direccional: 5 bolas hacia el jugador
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
                  isEnemy: true,
                  angle: angle + i * 0.2
                });
                
                // Crear efecto visual para cada proyectil
                newEffects.push({
                  id: nextBossEffectId.current++,
                  x: b.x,
                  y: b.y,
                  targetX: player.x + Math.cos(angle + i * 0.2) * 100,
                  targetY: player.y + Math.sin(angle + i * 0.2) * 100,
                  createdAt: Date.now() + i * 50, // Delay escalonado
                  duration: 700,
                  angle: angle + i * 0.2,
                  scale: 1.2
                });
              }
            } else {
              // Patrón espiral: 12 bolas rotando
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
                  isEnemy: true,
                  angle: angle
                });
                
                // Crear efecto visual para espiral
                newEffects.push({
                  id: nextBossEffectId.current++,
                  x: b.x,
                  y: b.y,
                  targetX: b.x + Math.cos(angle) * 120,
                  targetY: b.y + Math.sin(angle) * 120,
                  createdAt: Date.now() + i * 30, // Delay para efecto espiral
                  duration: 800,
                  angle: angle,
                  scale: 0.8
                });
              }
            }
            
            setProjectiles(prev => [...prev, ...newProjectiles]);
            setBossAttackEffects(prev => [...prev, ...newEffects]);
            
            // Marcar como atacando y volver a idle después
            const updatedBoss = { ...b, lastAttack: now, isAttacking: true };
            setTimeout(() => {
              setBoss(current => {
                if (!current) return current;
                if (current.sprite) {
                  current.sprite.setAnimation('idle');
                }
                return { ...current, isAttacking: false };
              });
            }, 300);
            
            return updatedBoss;
          });
        }
        
        // Actualizar sprite del boss
        if (currentBoss.sprite) {
          currentBoss.sprite.update(deltaTime);
        }
      }
      
      // Actualizar efectos de ataque del boss (limpiar los expirados más agresivamente)
      setBossAttackEffects(prev => {
        const now = Date.now();
        const filtered = prev.filter(effect => now - effect.createdAt < effect.duration);
        // Límite más agresivo: solo 15 efectos
        if (filtered.length > 15) {
          return filtered.slice(-15);
        }
        return filtered;
      });
      
      // Procesar advertencias de super ataque y ejecutarlos cuando sea tiempo
      setBossSuperAttackWarnings(prev => {
        const now = Date.now();
        const remaining: BossSuperAttackWarning[] = [];
        
        prev.forEach(warning => {
          if (now >= warning.executionTime) {
            // Crear el super ataque activo
            const superAttack: BossSuperAttack = {
              id: warning.id,
              x: warning.x,
              y: warning.y,
              width: warning.width,
              height: warning.height,
              angle: warning.angle,
              damage: 30, // Daño del super ataque
              createdAt: now,
              duration: 500 // Duración del ataque visible (0.5s)
            };
            
            setBossSuperAttacks(attacks => [...attacks, superAttack]);
            
            // Screen shake al ejecutar super ataque
            setScreenShake({ x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 15 });
            setTimeout(() => setScreenShake({ x: 0, y: 0 }), 200);
          } else {
            remaining.push(warning);
          }
        });
        
        return remaining;
      });
      
      // Actualizar super ataques activos y verificar colisión con jugador
      setBossSuperAttacks(prev => {
        const now = Date.now();
        return prev.filter(attack => {
          const age = now - attack.createdAt;
          
          // Verificar si el jugador está dentro del área de ataque
          if (age < attack.duration) {
            // Calcular si el jugador colisiona con el rectángulo rotado
            const dx = player.x - attack.x;
            const dy = player.y - attack.y;
            
            // Rotar el punto del jugador al sistema de coordenadas del ataque
            const cos = Math.cos(-attack.angle);
            const sin = Math.sin(-attack.angle);
            const localX = dx * cos - dy * sin;
            const localY = dx * sin + dy * cos;
            
            // Verificar si está dentro del rectángulo
            if (Math.abs(localX) < attack.width / 2 && Math.abs(localY) < attack.height / 2) {
              // Aplicar daño al jugador
              setPlayer(p => {
                if (!p) return p;
                const newHealth = p.health - attack.damage;
                if (newHealth <= 0) setGameState('gameover');
                return { ...p, health: Math.max(0, newHealth) };
              });
              
              return false; // Eliminar el ataque después de golpear
            }
          }
          
          return age < attack.duration;
        });
      });
      
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
  }, [gameStarted, player, gameState, keysPressed, boss, enemies, waveEnemies, waveKills, upgrades, currentHouse, spawnBoss, dropItem, gainCosmos, waveNumber]);

  useEffect(() => {
    if (!canvasRef.current || !player || !gameStarted) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const render = () => {
      // Calcular deltaTime para animaciones
      const now = Date.now();
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;
      
      // Actualizar sprite del jugador cada frame (no throttled)
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
        
        // Aplicar transformación de cámara con screen shake
        ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);
        
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
        
        // Dibujar spawn warnings (advertencias de spawn) - OPTIMIZADO
        const currentTime = Date.now();
        if (spawnWarnings.length > 0) {
          spawnWarnings.forEach(warning => {
            // Círculo pulsante simplificado
            const pulsePhase = (currentTime % 500) / 500; // Simplificar cálculo
            const pulseSize = 15 + pulsePhase * 5;
            const alpha = 0.3 + pulsePhase * 0.2;
            
            // Color según tipo de enemigo
            let warningColor = '#FF0000';
            if (warning.type === 'fast') warningColor = '#FF00FF';
            if (warning.type === 'tank') warningColor = '#888888';
            
            // Círculo exterior pulsante
            ctx.globalAlpha = alpha;
            ctx.fillStyle = warningColor;
            ctx.beginPath();
            ctx.arc(warning.x, warning.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Círculo interior más sólido
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = warningColor;
            ctx.beginPath();
            ctx.arc(warning.x, warning.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
          });
        }
        
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
          // Dibujar sprite si existe, o fallback a círculo
          if (enemy.sprite) {
            // Todos los enemigos mismo tamaño que el jugador
            const size = 64;
            
            enemy.sprite.draw(ctx, enemy.x, enemy.y, size, size);
          } else {
            // Fallback: círculos con colores según tipo
            ctx.fillStyle = enemy.type === 'fast' ? '#FF00FF' : enemy.type === 'tank' ? '#888' : '#F00';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Barra de vida del enemigo
          ctx.fillStyle = '#0F0';
          ctx.fillRect(enemy.x - 15, enemy.y - 30, 30, 3);
          ctx.fillStyle = '#F00';
          ctx.fillRect(enemy.x - 15, enemy.y - 30, 30 * (enemy.health / enemy.maxHealth), 3);
        });
        
        if (boss) {
          // Dibujar sprite del boss si existe
          if (boss.sprite) {
            const bossSize = 96; // Boss más grande que jugador y enemigos
            boss.sprite.draw(ctx, boss.x, boss.y, bossSize, bossSize);
          } else {
            // Fallback: círculo con color del gold saint
            ctx.fillStyle = boss.gold.color;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, 30, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Nombre del boss
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(boss.gold.name, boss.x, boss.y - 55);
          ctx.fillText(boss.gold.name, boss.x, boss.y - 55);
          
          // Barra de vida del boss
          ctx.fillStyle = '#0F0';
          ctx.fillRect(boss.x - 40, boss.y - 60, 80, 5);
          ctx.fillStyle = '#F00';
          ctx.fillRect(boss.x - 40, boss.y - 60, 80 * (boss.health / boss.maxHealth), 5);
        }
        
        projectiles.forEach(proj => {
          // Si hay sprite de proyectil y es del jugador, usarlo (sin rotación para mejor performance)
          if (projectileImage && projectileImage.complete && !proj.isEnemy) {
            ctx.imageSmoothingEnabled = false;
            
            const displaySize = 24;
            
            // Dibujar sin rotación para mejor rendimiento
            ctx.drawImage(
              projectileImage,
              proj.x - displaySize/2, proj.y - displaySize/2,
              displaySize, displaySize
            );
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
        
        // Dibujar efectos de ataque del boss (bolas de poder) - limitar a 10 más recientes
        if (bossAttackImage && bossAttackImage.complete) {
          const now = Date.now();
          const recentEffects = bossAttackEffects.slice(-10);
          recentEffects.forEach(effect => {
            const age = now - effect.createdAt;
            if (age < 0) return; // No dibujar si aún no ha comenzado (delay)
            
            const progress = age / effect.duration;
            
            // Animación de la bola: crece, se mueve y hace fade out
            const pulse = Math.sin(progress * Math.PI * 6) * 0.2; // Pulsación rápida
            const scale = effect.scale * (0.8 + pulse);
            const size = 50 * scale;
            
            // Movimiento hacia el objetivo con aceleración
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            const currentX = effect.x + (effect.targetX - effect.x) * easeProgress * 0.5;
            const currentY = effect.y + (effect.targetY - effect.y) * easeProgress * 0.5;
            
            // Opacidad: fade in rápido, luego fade out suave
            const opacity = progress < 0.1 ? progress / 0.1 : 
                           progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.imageSmoothingEnabled = false;
            
            // Trail de partículas simplificado (solo 2 en lugar de 3)
            for (let i = 1; i <= 2; i++) {
              const trailProgress = Math.max(0, progress - i * 0.15);
              const trailX = effect.x + (effect.targetX - effect.x) * trailProgress * 0.5;
              const trailY = effect.y + (effect.targetY - effect.y) * trailProgress * 0.5;
              const trailOpacity = opacity * (1 - i * 0.3);
              const trailSize = size * (1 - i * 0.25);
              
              ctx.globalAlpha = trailOpacity * 0.3;
              ctx.fillStyle = 'rgba(200, 100, 255, ' + (trailOpacity * 0.4) + ')';
              ctx.beginPath();
              ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Glow exterior principal (resplandor intenso)
            ctx.globalAlpha = opacity;
            const glowSize = size * 1.8;
            const gradient = ctx.createRadialGradient(
              currentX, currentY, 0,
              currentX, currentY, glowSize
            );
            gradient.addColorStop(0, 'rgba(255, 120, 255, ' + (opacity * 0.9) + ')');
            gradient.addColorStop(0.4, 'rgba(220, 80, 255, ' + (opacity * 0.6) + ')');
            gradient.addColorStop(0.7, 'rgba(180, 40, 255, ' + (opacity * 0.3) + ')');
            gradient.addColorStop(1, 'rgba(150, 0, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(currentX, currentY, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Anillo de energía giratorio
            ctx.globalAlpha = opacity * 0.6;
            ctx.strokeStyle = 'rgba(255, 200, 255, ' + opacity + ')';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(currentX, currentY, size * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Dibujar el sprite de ataque con rotación continua
            ctx.globalAlpha = opacity;
            ctx.translate(currentX, currentY);
            ctx.rotate(age / 80); // Rotación más rápida
            ctx.drawImage(
              bossAttackImage,
              -size/2, -size/2,
              size, size
            );
            
            ctx.restore();
            
            // Partículas orbitando (reducidas a 3)
            for (let i = 0; i < 3; i++) {
              const particleAngle = (age / 200) + (i * Math.PI / 2);
              const particleRadius = size * 0.7;
              const particleX = currentX + Math.cos(particleAngle) * particleRadius;
              const particleY = currentY + Math.sin(particleAngle) * particleRadius;
              
              ctx.save();
              ctx.globalAlpha = opacity * 0.7;
              ctx.fillStyle = 'rgba(255, 180, 255, ' + (opacity * 0.8) + ')';
              ctx.beginPath();
              ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          });
        }
        
        // Dibujar drops (cosmos, health)
        drops.forEach(drop => {
          if (drop.type === 'health') {
            // Efecto de cruz para health
            ctx.fillStyle = '#0F0'; // Verde para vida
            ctx.fillRect(drop.x - 6, drop.y - 2, 12, 4);
            ctx.fillRect(drop.x - 2, drop.y - 6, 4, 12);
          } else {
            // Cosmos (orbe azul circular)
            ctx.fillStyle = '#0FF'; // Azul brillante para cosmos
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        // Dibujar advertencias de super ataque del boss (SIMPLIFICADO para mejor rendimiento)
        if (bossSuperAttackWarnings.length > 0) {
          const now = Date.now();
          bossSuperAttackWarnings.forEach(warning => {
            const age = now - warning.createdAt;
            
            // Efecto de parpadeo simple
            const pulse = Math.sin(age / 80) * 0.5 + 0.5;
            const alpha = 0.3 + pulse * 0.3;
            
            ctx.save();
            ctx.translate(warning.x, warning.y);
            ctx.rotate(warning.angle);
            
            // Rectángulo rojo simple (sin gradientes)
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FF3333';
            ctx.fillRect(-warning.width / 2, -warning.height / 2, warning.width, warning.height);
            
            // Borde
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-warning.width / 2, -warning.height / 2, warning.width, warning.height);
            
            ctx.restore();
          });
        }
        
        // Dibujar super ataques activos del boss (ULTRA-SIMPLIFICADO)
        if (bossSuperAttacks.length > 0 && bossSuperAttackSprites.length === 3) {
          const now = Date.now();
          bossSuperAttacks.forEach(attack => {
            const age = now - attack.createdAt;
            const progress = age / attack.duration;
            
            ctx.save();
            ctx.translate(attack.x, attack.y);
            ctx.rotate(attack.angle);
            
            const scale = 0.8 + progress * 0.4;
            const alpha = 1 - progress;
            
            // Seleccionar frame
            const frameIndex = Math.min(2, Math.floor(progress * 3));
            const sprite = bossSuperAttackSprites[frameIndex];
            
            if (sprite && sprite.complete) {
              ctx.globalAlpha = alpha;
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(
                sprite,
                -attack.width / 2 * scale,
                -attack.height / 2 * scale,
                attack.width * scale,
                attack.height * scale
              );
            } else {
              // Fallback simple
              ctx.globalAlpha = alpha * 0.7;
              ctx.fillStyle = '#FF6600';
              ctx.fillRect(
                -attack.width / 2 * scale, 
                -attack.height / 2 * scale, 
                attack.width * scale, 
                attack.height * scale
              );
            }
            
            // Borde simple
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 3;
            ctx.strokeRect(
              -attack.width / 2 * scale, 
              -attack.height / 2 * scale, 
              attack.width * scale, 
              attack.height * scale
            );
            
            ctx.restore();
          });
        }
        
        // Restaurar estado del canvas (volver a coordenadas de pantalla)
        ctx.restore();
        
        // Dibujar HUD (sin transformación de cámara)
        ctx.fillStyle = '#0F0';
        ctx.fillRect(10, 10, 200, 20);
        ctx.fillStyle = '#F00';
        ctx.fillRect(10, 10, 200 * (player.health / player.maxHealth), 20);
        
        // Barra de Cosmos (reemplaza exp)
        const cosmosRequired = 10 + ((player.level - 1) * 5);
        ctx.fillStyle = '#00F';
        ctx.fillRect(10, 35, 200, 10);
        ctx.fillStyle = '#0FF';
        ctx.fillRect(10, 35, 200 * (player.cosmos / cosmosRequired), 10);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Nivel: ${player.level}`, 220, 25);
        ctx.fillText(`Puntos: ${score}`, 220, 45);
        ctx.fillText(`Casa: ${currentHouse + 1}/12`, 10, 60);
        ctx.fillText(`Enemigos eliminados: ${waveKills}`, 10, 75);
        ctx.fillText(`Enemigos activos: ${enemies.length}`, 10, 90);
        
        // Timer del stage
        const minutes = Math.floor(stageTime / 60);
        const seconds = stageTime % 60;
        const timeColor = stageTime >= 180 ? '#0F0' : '#FFF';
        ctx.fillStyle = timeColor;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⏱ ${minutes}:${seconds.toString().padStart(2, '0')}`, WIDTH / 2, 30);
        
        // Oleada actual
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px Arial';
        ctx.fillText(`Oleada ${waveNumber}`, WIDTH / 2, 50);
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, player, enemies, boss, projectiles, drops, spawnWarnings, gameState, score, currentHouse, waveKills, waveEnemies, playerSprite, keysPressed, isAttacking, projectileImage, floorImage, camera, stageTime, waveNumber, screenShake, bossAttackImage, bossAttackEffects, bossSuperAttackWarnings, bossSuperAttacks, bossSuperAttackSprites]);

  // Sin menú de selección - el juego comienza automáticamente

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

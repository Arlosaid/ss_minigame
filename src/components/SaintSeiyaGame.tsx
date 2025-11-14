import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Knight, GoldSaint, Upgrade } from '../data/gameData';
import { BRONZE_KNIGHTS, GOLD_SAINTS, UPGRADES } from '../data/gameData';
import MobileControls from './MobileControls';
import { createPlayerSprite, createEnemySprite, createBossSprite, AnimatedSprite } from '../systems/SpriteSystem';
import { CombatSystem } from '../core/Combat';
import { PowerSystem } from '../systems/PowerSystem';
import {
  PLAYER_CONFIG,
  ENEMY_CONFIG,
  BOSS_CONFIG,
  DROPS_CONFIG,
  MAP_CONFIG,
  PROJECTILE_CONFIG,
  WAVE_CONFIG,
  VISUAL_CONFIG,
  PERFORMANCE_CONFIG,
  AUDIO_CONFIG,
  calculateEnemyHP,
  calculateEnemySpeed,
  calculateCosmosRequired,
  calculateFireRate
} from '../config/gameConfig';

const WIDTH = MAP_CONFIG.VIEWPORT_WIDTH;
const HEIGHT = MAP_CONFIG.VIEWPORT_HEIGHT;
const MAP_WIDTH = MAP_CONFIG.MAP_WIDTH;
const MAP_HEIGHT = MAP_CONFIG.MAP_HEIGHT;

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
  lightning: number;
  goldenArrow: number;
  athenaShield: number;
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
  const [gameStarted, setGameStarted] = useState(true); // Iniciar automáticamente ya que el menú está en App.tsx
  const [player, setPlayer] = useState<Player | null>(null);
  const [isInitializing, setIsInitializing] = useState(true); // Nuevo estado para tracking
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [spawnWarnings, setSpawnWarnings] = useState<SpawnWarning[]>([]);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [mobileDirection, setMobileDirection] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [score, setScore] = useState(0);
  const [currentHouse, setCurrentHouse] = useState(0);
  const [waveEnemies, setWaveEnemies] = useState(0);
  const [waveKills, setWaveKills] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'levelup' | 'houseclear' | 'gameover'>('playing');
  
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({
    damage: 0,
    speed: 0,
    fireRate: 0,
    multiShot: 0, // 0 = 1 proyectil base, 1 = 2 proyectiles, 2 = 3 proyectiles, etc.
    maxHealth: 0,
    explosion: 0,
    lightning: 0,
    goldenArrow: 0,
    athenaShield: 0
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
  const [goldenArrowImage, setGoldenArrowImage] = useState<HTMLImageElement | null>(null);
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [stageTime, setStageTime] = useState(0);
  const [waveNumber, setWaveNumber] = useState(1);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [canvasWidth, setCanvasWidth] = useState(WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(HEIGHT);
  const [isPortrait, setIsPortrait] = useState(false); // Detectar orientación portrait
  const stageStartTime = useRef<number>(Date.now());
  const backgroundMusic = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const bossRef = useRef<Boss | null>(null);
  const stageTimeRef = useRef<number>(0);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const dropsRef = useRef<Drop[]>([]);
  const spawnWarningsRef = useRef<SpawnWarning[]>([]);
  const lastCleanupTime = useRef<number>(0);
  const lastLightningTrigger = useRef<number>(0);
  const lastGoldenArrowTrigger = useRef<number>(0);
  const lastShotRef = useRef<number>(0); // Usar ref para evitar race condition
  
  // Refs adicionales para acceso en gameLoop
  const keysRef = useRef<Set<string>>(new Set());
  const mobileDirectionRef = useRef({ x: 0, y: 0 });
  const upgradesRef = useRef<PlayerUpgrades>(upgrades);
  const playerSpriteRef = useRef<AnimatedSprite | null>(null);
  const isAttackingRef = useRef(false);
  const projectileImageRef = useRef<HTMLImageElement | null>(null);
  const goldenArrowImageRef = useRef<HTMLImageElement | null>(null);
  const floorImageRef = useRef<HTMLImageElement | null>(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const screenShakeRef = useRef({ x: 0, y: 0 });
  const bossAttackImageRef = useRef<HTMLImageElement | null>(null);
  const bossAttackEffectsRef = useRef<BossAttackEffect[]>([]);
  const bossSuperAttackWarningsRef = useRef<BossSuperAttackWarning[]>([]);
  const bossSuperAttacksRef = useRef<BossSuperAttack[]>([]);
  const bossSuperAttackSpritesRef = useRef<HTMLImageElement[]>([]);
  
  // Refs para estados que se usan en el gameLoop
  const gameStartedRef = useRef<boolean>(true);
  const isMobileRef = useRef<boolean>(false);
  const gameStateRef = useRef<'playing' | 'levelup' | 'houseclear' | 'gameover'>('playing');
  
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
    projectilesRef.current = projectiles;
  }, [projectiles]);
  
  useEffect(() => {
    dropsRef.current = drops;
  }, [drops]);
  
  useEffect(() => {
    spawnWarningsRef.current = spawnWarnings;
  }, [spawnWarnings]);
  
  // Sincronizar nuevas refs
  useEffect(() => {
    keysRef.current = keysPressed;
  }, [keysPressed]);
  
  useEffect(() => {
    mobileDirectionRef.current = mobileDirection;
  }, [mobileDirection]);
  
  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);
  
  useEffect(() => {
    playerSpriteRef.current = playerSprite;
  }, [playerSprite]);
  
  useEffect(() => {
    isAttackingRef.current = isAttacking;
  }, [isAttacking]);
  
  useEffect(() => {
    projectileImageRef.current = projectileImage;
  }, [projectileImage]);
  
  useEffect(() => {
    goldenArrowImageRef.current = goldenArrowImage;
  }, [goldenArrowImage]);
  
  useEffect(() => {
    floorImageRef.current = floorImage;
  }, [floorImage]);
  
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);
  
  useEffect(() => {
    screenShakeRef.current = screenShake;
  }, [screenShake]);
  
  useEffect(() => {
    bossAttackImageRef.current = bossAttackImage;
  }, [bossAttackImage]);
  
  useEffect(() => {
    bossAttackEffectsRef.current = bossAttackEffects;
  }, [bossAttackEffects]);
  
  useEffect(() => {
    bossSuperAttackWarningsRef.current = bossSuperAttackWarnings;
  }, [bossSuperAttackWarnings]);
  
  useEffect(() => {
    bossSuperAttacksRef.current = bossSuperAttacks;
  }, [bossSuperAttacks]);
  
  useEffect(() => {
    bossSuperAttackSpritesRef.current = bossSuperAttackSprites;
  }, [bossSuperAttackSprites]);
  
  // Sincronizar refs de estados
  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);
  
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const initializeGame = useCallback(async () => {
    setIsInitializing(true); // Marcar que estamos inicializando
    
    // Usar el primer caballero por defecto (Seiya)
    const knight = BRONZE_KNIGHTS[0]!;
    const initialX = MAP_WIDTH / 2;
    const initialY = MAP_HEIGHT / 2;
    
    const newPlayer = {
      x: initialX,
      y: initialY,
      knight,
      health: PLAYER_CONFIG.STARTING_HEALTH,
      maxHealth: PLAYER_CONFIG.STARTING_MAX_HEALTH,
      cosmos: 0,
      level: PLAYER_CONFIG.STARTING_LEVEL
    };
    
    setPlayer(newPlayer);
    
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
      const audio = new Audio(`${import.meta.env.BASE_URL}assets/audio/bgm/menu.mp3`);
      audio.loop = true;
      audio.volume = AUDIO_CONFIG.BACKGROUND_MUSIC_VOLUME;
      audio.play().catch(() => {});
      backgroundMusic.current = audio;
    }
    
    // Cargar sprite del jugador
    try {
      const sprite = await createPlayerSprite();
      setPlayerSprite(sprite);
      
      // Precargar pool de sprites de enemigos
      const enemyPool: AnimatedSprite[] = [];
      for (let i = 0; i < PERFORMANCE_CONFIG.ENEMY_SPRITE_POOL_SIZE; i++) {
        const enemySprite = await createEnemySprite();
        enemyPool.push(enemySprite);
      }
      enemySpritePool.current = enemyPool;
      
      // Cargar sprite del boss
      const bSprite = await createBossSprite();
      setBossSprite(bSprite);
      
      // Cargar sprite de proyectil
      const projImg = new Image();
      projImg.onload = () => {
        setProjectileImage(projImg);
      };
      projImg.onerror = () => {};
      projImg.src = `${import.meta.env.BASE_URL}assets/sprites/attacks/attack_1.png`;
      
      // Cargar sprite de ataque del boss
      const bossAttackImg = new Image();
      bossAttackImg.onload = () => {
        setBossAttackImage(bossAttackImg);
      };
      bossAttackImg.onerror = () => {};
      bossAttackImg.src = `${import.meta.env.BASE_URL}assets/sprites/attacks/boss_attack.png`;
      
      // Cargar sprites de super ataque del boss (animación de 3 frames)
      const superAttackSprites: HTMLImageElement[] = [];
      for (let i = 1; i <= 3; i++) {
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}assets/sprites/attacks/boss_super_attack${i}.png`;
        img.onload = () => {
          if (i === 3) {
            setBossSuperAttackSprites([...superAttackSprites]);
          }
        };
        img.onerror = () => {};
        superAttackSprites.push(img);
      }
      
      // Cargar imagen de la flecha de Sagitario
      const arrowImg = new Image();
      arrowImg.onload = () => {
        setGoldenArrowImage(arrowImg);
      };
      arrowImg.onerror = () => {};
      arrowImg.src = `${import.meta.env.BASE_URL}assets/skills/flecha_sagitario.png`;
      
      // Cargar imagen del floor
      const floorImg = new Image();
      floorImg.onload = () => {
        setFloorImage(floorImg);
      };
      floorImg.onerror = () => {};
      floorImg.src = `${import.meta.env.BASE_URL}assets/sprites/stages/floor_1_stage.png`;
      
      // ✅ Marcar inicialización completa DESPUÉS de cargar sprites críticos
      setIsInitializing(false);
    } catch (error) {
      // Error silencioso al cargar sprites, pero igual iniciar el juego
      setIsInitializing(false);
    }
  }, []);

  // Detectar dispositivo móvil - Adaptarse a la orientación del dispositivo
  useEffect(() => {
    const updateDimensions = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768);
      
      // Detectar orientación
      const portrait = window.innerHeight > window.innerWidth;
      
      setIsMobile(mobile);
      setIsPortrait(portrait);
      
      // Adaptar dimensiones del canvas a la orientación
      if (mobile && portrait) {
        // En vertical, usar el ancho de la ventana y calcular alto proporcional
        const ratio = HEIGHT / WIDTH; // Mantener proporción del juego
        setCanvasWidth(Math.min(window.innerWidth, WIDTH));
        setCanvasHeight(Math.min(window.innerWidth * ratio, HEIGHT));
      } else {
        // En horizontal o desktop, usar dimensiones base del juego
        setCanvasWidth(WIDTH);
        setCanvasHeight(HEIGHT);
      }
    };
    
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  const spawnBoss = useCallback(() => {
    if (currentHouse >= GOLD_SAINTS.length) return;
    
    const gold = GOLD_SAINTS[currentHouse]!;
    setBoss({
      id: nextEnemyId.current++,
      x: MAP_WIDTH / 2,
      y: MAP_HEIGHT / 2,
      health: BOSS_CONFIG.BASE_HP + currentHouse * BOSS_CONFIG.HP_INCREMENT_PER_HOUSE,
      maxHealth: BOSS_CONFIG.BASE_HP + currentHouse * BOSS_CONFIG.HP_INCREMENT_PER_HOUSE,
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
      lifetime: type === 'health' ? DROPS_CONFIG.HEALTH_LIFETIME : DROPS_CONFIG.COSMOS_LIFETIME
    }]);
  }, []);

  const shoot = useCallback(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;
    if (gameState !== 'playing') return;
    
    const now = Date.now();
    const cooldownTime = calculateFireRate(upgrades.fireRate);
    const timeSinceLastShot = now - lastShotRef.current;
    if (timeSinceLastShot < cooldownTime) return;
    
    lastShotRef.current = now;
    
    // Encontrar el enemigo más cercano usando el CombatSystem
    const nearestEnemy = CombatSystem.findNearestEnemy(
      { x: currentPlayer.x, y: currentPlayer.y },
      enemiesRef.current,
      PLAYER_CONFIG.ATTACK_RANGE
    );
    
    // Determinar el objetivo (enemigo cercano o boss si está cerca)
    let target: { x: number; y: number; id: number } | null = nearestEnemy;
    
    // Si hay un boss, verificar si está en rango y priorizarlo
    const currentBoss = bossRef.current;
    if (currentBoss) {
      const bossDist = CombatSystem.calculateDistance(
        { x: currentPlayer.x, y: currentPlayer.y },
        { x: currentBoss.x, y: currentBoss.y }
      );
      
      if (bossDist <= PLAYER_CONFIG.ATTACK_RANGE) {
        target = currentBoss;
      }
    }
    
    if (!target) return;
    
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
        dx: Math.cos(angle) * PLAYER_CONFIG.PROJECTILE_SPEED,
        dy: Math.sin(angle) * PLAYER_CONFIG.PROJECTILE_SPEED,
        damage: PLAYER_CONFIG.BASE_DAMAGE + upgrades.damage * PLAYER_CONFIG.DAMAGE_UPGRADE_BONUS,
        color: currentPlayer.knight.projectileColor,
        isEnemy: false,
        angle: angle
      });
    }
    
    setProjectiles(prev => [...prev, ...newProjectiles]);
  }, [gameState, upgrades]);

  const gainCosmos = useCallback((amount: number) => {
    if (!playerRef.current) return;
    
    setPlayer(prev => {
      if (!prev) return prev;
      
      let newCosmos = prev.cosmos + amount;
      let newLevel = prev.level;
      
      let cosmosRequired = calculateCosmosRequired(newLevel);
      
      while (newCosmos >= cosmosRequired) {
        newCosmos -= cosmosRequired;
        newLevel++;
        cosmosRequired = calculateCosmosRequired(newLevel);
        
        const choices: Upgrade[] = [];
        const currentUpgrades = upgradesRef.current;
        
        // Priorizar habilidades nuevas (lightning, goldenArrow, athenaShield)
        const powerUpgrades = UPGRADES.filter(u => 
          u.id === 'lightning' || u.id === 'goldenArrow' || u.id === 'athenaShield'
        );
        const statUpgrades = UPGRADES.filter(u => 
          u.id !== 'lightning' && u.id !== 'goldenArrow' && u.id !== 'athenaShield'
        );
        
        // Agregar habilidades nuevas primero (que no se han desbloqueado)
        const unlockedPowers = powerUpgrades.filter(u => 
          currentUpgrades[u.id as keyof PlayerUpgrades] === 0
        );
        
        // Si hay habilidades sin desbloquear, agregar una
        if (unlockedPowers.length > 0 && choices.length < 3) {
          const randomPower = unlockedPowers[Math.floor(Math.random() * unlockedPowers.length)]!;
          choices.push(randomPower);
        }
        
        // Llenar el resto con mejoras aleatorias
        const allAvailable = [...powerUpgrades, ...statUpgrades];
        while (choices.length < 3) {
          const upgrade = allAvailable[Math.floor(Math.random() * allAvailable.length)]!;
          if (!choices.includes(upgrade)) {
            const currentLevel = currentUpgrades[upgrade.id as keyof PlayerUpgrades] || 0;
            if (currentLevel < upgrade.levels.length) {
              choices.push(upgrade);
            }
          }
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
  }, []);

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
        return { 
          ...p, 
          maxHealth: p.maxHealth + PLAYER_CONFIG.MAX_HEALTH_UPGRADE_BONUS,
          health: p.health + PLAYER_CONFIG.MAX_HEALTH_UPGRADE_BONUS
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
      setKeysPressed(prev => {
        const newSet = new Set(prev).add(e.key.toLowerCase());
        keysRef.current = newSet; // Actualizar ref inmediatamente
        return newSet;
      });
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key.toLowerCase());
        keysRef.current = newSet; // Actualizar ref inmediatamente
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
    const reduction = (waveNumber - 1) * ENEMY_CONFIG.SPAWN_INTERVAL_REDUCTION_PER_WAVE;
    const spawnInterval = Math.max(
      ENEMY_CONFIG.MIN_SPAWN_INTERVAL,
      ENEMY_CONFIG.BASE_SPAWN_INTERVAL - reduction
    );
    
    const interval = setInterval(() => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer) return;
      
      // Límite de enemigos activos progresivo
      const maxActiveEnemies = Math.min(
        ENEMY_CONFIG.BASE_MAX_ACTIVE_ENEMIES + Math.floor(waveNumber * ENEMY_CONFIG.MAX_ACTIVE_ENEMIES_INCREMENT),
        ENEMY_CONFIG.MAX_ACTIVE_ENEMIES_CAP
      );
      
      setEnemies(currentEnemies => {
        if (currentEnemies.length >= maxActiveEnemies) {
          return currentEnemies;
        }
        // Limpieza periódica: remover enemigos muy lejanos
        const now = Date.now();
        if (now - lastCleanupTime.current > PERFORMANCE_CONFIG.CLEANUP_INTERVAL) {
          lastCleanupTime.current = now;
          const currentPlayer = playerRef.current;
          if (currentPlayer) {
            const filtered = currentEnemies.filter(e => {
              const dist = Math.hypot(currentPlayer.x - e.x, currentPlayer.y - e.y);
              return dist <= ENEMY_CONFIG.CLEANUP_DISTANCE;
            });
            enemiesRef.current = filtered;
            return filtered;
          }
        }
        return currentEnemies;
      });
      
      // Sistema de oleadas progresivo con más enemigos
      let availableTypes: Array<'normal' | 'fast' | 'tank'> = ['normal'];
      if (waveNumber >= ENEMY_CONFIG.FAST.UNLOCK_WAVE) availableTypes.push('fast');
      if (waveNumber >= ENEMY_CONFIG.TANK.UNLOCK_WAVE) availableTypes.push('tank');
      
      // A partir de oleada 5, mezclar tipos
      let type: 'normal' | 'fast' | 'tank';
      if (waveNumber >= 5 && Math.random() < WAVE_CONFIG.SPECIAL_ENEMY_CHANCE_AFTER_WAVE_5) {
        type = availableTypes[1 + Math.floor(Math.random() * (availableTypes.length - 1))]!;
      } else {
        type = availableTypes[Math.floor(Math.random() * availableTypes.length)]!;
      }
      
      // SISTEMA DE SPAWN MULTI-DIRECCIONAL: Enemigos vienen de 8 direcciones diferentes
      // para evitar que todos sigan la misma ruta y crear patrones de ataque variados
      const spawnDirections = [
        { name: 'arriba', angle: -Math.PI / 2 },
        { name: 'abajo', angle: Math.PI / 2 },
        { name: 'izquierda', angle: Math.PI },
        { name: 'derecha', angle: 0 },
        { name: 'arriba-izquierda', angle: -3 * Math.PI / 4 },
        { name: 'arriba-derecha', angle: -Math.PI / 4 },
        { name: 'abajo-izquierda', angle: 3 * Math.PI / 4 },
        { name: 'abajo-derecha', angle: Math.PI / 4 }
      ];
      
      // Seleccionar dirección aleatoria con variación
      const direction = spawnDirections[Math.floor(Math.random() * spawnDirections.length)]!;
      const angleVariation = (Math.random() - 0.5) * 0.4; // ±20° de variación
      const angle = direction.angle + angleVariation;
      
      const spawnDistance = ENEMY_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (ENEMY_CONFIG.SPAWN_DISTANCE_MAX - ENEMY_CONFIG.SPAWN_DISTANCE_MIN);
      
      let x = currentPlayer.x + Math.cos(angle) * spawnDistance;
      let y = currentPlayer.y + Math.sin(angle) * spawnDistance;
      
      // Mantener dentro de los límites del mapa
      x = Math.max(50, Math.min(MAP_WIDTH - 50, x));
      y = Math.max(50, Math.min(MAP_HEIGHT - 50, y));
      
      // Crear advertencia de spawn
      const warning: SpawnWarning = {
        id: nextWarningId.current++,
        x, y,
        type,
        spawnTime: Date.now() + ENEMY_CONFIG.WARNING_DURATION,
        warningDuration: ENEMY_CONFIG.WARNING_DURATION
      };
      
      setSpawnWarnings(prev => {
        const maxWarnings = Math.min(
          2 + Math.floor(waveNumber / 2),
          ENEMY_CONFIG.MAX_WARNINGS
        );
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
    // ✅ SIEMPRE correr el gameLoop para renderizar continuamente
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const currentPlayer = playerRef.current;
      
      // ⚡ SIEMPRE llamar a requestAnimationFrame para mantener el loop activo
      animationFrameId = requestAnimationFrame(gameLoop);
      
      // Calcular deltaTime en segundos (necesario para animaciones)
      const deltaTime = Math.min((currentTime - lastTime) / 1000, PERFORMANCE_CONFIG.MAX_DELTA_TIME);
      lastTime = currentTime;
      
      // Variables para lógica de movimiento (necesarias para animaciones)
      let dx = 0, dy = 0;
      let isMovingFromInput = false;
      
      // ===== LEER INPUT (SIEMPRE, para animaciones) =====
      // Input de teclado
      const currentKeys = keysRef.current;
      if (currentKeys.has('w') || currentKeys.has('arrowup')) { dy -= 1; isMovingFromInput = true; }
      if (currentKeys.has('s') || currentKeys.has('arrowdown')) { dy += 1; isMovingFromInput = true; }
      if (currentKeys.has('a') || currentKeys.has('arrowleft')) { dx -= 1; isMovingFromInput = true; }
      if (currentKeys.has('d') || currentKeys.has('arrowright')) { dx += 1; isMovingFromInput = true; }
      
      // Input de joystick móvil (override si está activo)
      const currentMobileDir = mobileDirectionRef.current;
      if (isMobileRef.current && (currentMobileDir.x !== 0 || currentMobileDir.y !== 0)) {
        dx = currentMobileDir.x;
        dy = currentMobileDir.y;
        isMovingFromInput = true;
      }
      
      // Solo actualizar lógica del juego si hay jugador y está en estado 'playing'
      if (currentPlayer) {
        const shouldUpdateLogic = gameStartedRef.current && gameStateRef.current === 'playing';
        
        // ===== INICIO DE LA LÓGICA DEL JUEGO =====
        
        // Capturar estados actuales al inicio del frame
        const currentProjectiles = projectilesRef.current;
        const currentEnemies = enemiesRef.current;
        const currentBoss = bossRef.current;
      
        // ===== ACTUALIZAR TIMER DEL STAGE (SIEMPRE, INCLUSO EN LEVEL UP) =====
        const currentStageTime = Math.floor((Date.now() - stageStartTime.current) / 1000);
        setStageTime(currentStageTime);
        stageTimeRef.current = currentStageTime;
      
        if (shouldUpdateLogic) {
      // Verificar si debe aparecer el jefe
      if (currentStageTime >= BOSS_CONFIG.SPAWN_TIME && !bossRef.current) {
        spawnBoss();
      }
      
      // Velocidad base balanceada (progresa de forma satisfactoria)
      const currentUpgrades = upgradesRef.current;
      const speedMultiplier = currentPlayer.knight.speed + currentUpgrades.speed * PLAYER_CONFIG.SPEED_UPGRADE_MULTIPLIER;
      const pixelsPerSecond = PLAYER_CONFIG.BASE_SPEED * speedMultiplier;
      
      // Actualizar posición si hay movimiento
      if (dx !== 0 || dy !== 0) {
        const magnitude = Math.hypot(dx, dy);
        const normalizedDx = (dx / magnitude) * pixelsPerSecond * deltaTime;
        const normalizedDy = (dy / magnitude) * pixelsPerSecond * deltaTime;
        
        // Calcular nueva posición con límites
        const margin = MAP_CONFIG.PLAYER_BOUNDARY_MARGIN;
        const newX = Math.max(margin, Math.min(MAP_WIDTH - margin, currentPlayer.x + normalizedDx));
        const newY = Math.max(margin, Math.min(MAP_HEIGHT - margin, currentPlayer.y + normalizedDy));
        
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
      const cooldownTime = calculateFireRate(currentUpgrades.fireRate);
      
      let projectilesToAdd: Projectile[] = [];
      
      if (nowShoot - lastShotRef.current >= cooldownTime && currentProjectiles.length < PLAYER_CONFIG.MAX_PROJECTILES) {
        // Encontrar el enemigo más cercano
        const nearestEnemy = CombatSystem.findNearestEnemy(
          { x: currentPlayer.x, y: currentPlayer.y },
          currentEnemies,
          PLAYER_CONFIG.ATTACK_RANGE
        );
        
        // Determinar el objetivo
        let target: { x: number; y: number; id: number } | null = nearestEnemy;
        
        // Priorizar boss si está en rango
        if (currentBoss) {
          const bossDist = CombatSystem.calculateDistance(
            { x: currentPlayer.x, y: currentPlayer.y },
            { x: currentBoss.x, y: currentBoss.y }
          );
          
          if (bossDist <= PLAYER_CONFIG.ATTACK_RANGE) {
            target = currentBoss;
          }
        }
        
        // Si hay objetivo, disparar
        if (target) {
          lastShotRef.current = nowShoot; // Actualizar ref inmediatamente
          
          // Crear efecto visual de ataque
          CombatSystem.createAttackEffect({ x: currentPlayer.x, y: currentPlayer.y }, target);
          
          // Activar animación de ataque
          setIsAttacking(true);
          setTimeout(() => setIsAttacking(false), 200);
          
          // Solo disparar UN proyectil base, más proyectiles adicionales según multiShot
          const shots = 1 + currentUpgrades.multiShot;
          
          // Calcular ángulo base hacia el objetivo
          const baseAngle = Math.atan2(target.y - currentPlayer.y, target.x - currentPlayer.x);
          
          // Disparar proyectiles con spread solo si multiShot > 0
          for (let i = 0; i < shots; i++) {
            // Sin spread si solo hay 1 disparo, con spread si hay múltiples
            const angle = shots === 1 ? baseAngle : baseAngle + (i - (shots - 1) / 2) * 0.2;
            const offsetDistance = 25;
            const startX = currentPlayer.x + Math.cos(angle) * offsetDistance;
            const startY = currentPlayer.y + Math.sin(angle) * offsetDistance;
            
            const projId = nextProjectileId.current++;
            projectilesToAdd.push({
              id: projId,
              x: startX,
              y: startY,
              dx: Math.cos(angle) * PLAYER_CONFIG.PROJECTILE_SPEED,
              dy: Math.sin(angle) * PLAYER_CONFIG.PROJECTILE_SPEED,
              damage: PLAYER_CONFIG.BASE_DAMAGE + currentUpgrades.damage * PLAYER_CONFIG.DAMAGE_UPGRADE_BONUS,
              color: currentPlayer.knight.projectileColor,
              isEnemy: false,
              angle: angle
            });
          }
        }
      }
      // ===== FIN SISTEMA DE DISPARO =====
      
      // ===== SISTEMA DE RAYO DE ZEUS =====
      const nowLightning = Date.now();
      if (currentUpgrades.lightning > 0) {
        const lightningLevel = currentUpgrades.lightning;
        const lightningCooldown = PowerSystem.getLightningCooldown(lightningLevel);
        
        if (nowLightning - lastLightningTrigger.current >= lightningCooldown) {
          lastLightningTrigger.current = nowLightning;
          
          // Calcular dirección del jugador basado en movimiento
          let dirX = 0, dirY = 0;
          if (keysPressed.has('w') || keysPressed.has('arrowup')) dirY -= 1;
          if (keysPressed.has('s') || keysPressed.has('arrowdown')) dirY += 1;
          if (keysPressed.has('a') || keysPressed.has('arrowleft')) dirX -= 1;
          if (keysPressed.has('d') || keysPressed.has('arrowright')) dirX += 1;
          
          // Si no hay movimiento, usar dirección hacia el enemigo más cercano
          if (dirX === 0 && dirY === 0) {
            const nearestEnemy = CombatSystem.findNearestEnemy(
              { x: currentPlayer.x, y: currentPlayer.y },
              currentEnemies,
              PLAYER_CONFIG.ATTACK_RANGE
            );
            if (nearestEnemy) {
              dirX = nearestEnemy.x - currentPlayer.x;
              dirY = nearestEnemy.y - currentPlayer.y;
            } else {
              dirX = 1; // Default derecha
            }
          }
          
          // Activar rayo
          PowerSystem.triggerLightningStrike(
            currentPlayer.x,
            currentPlayer.y,
            dirX,
            dirY,
            lightningLevel,
            currentEnemies,
            (enemyId, damage) => {
              // Actualizar enemigos inmediatamente en el ref
              const enemyIndex = enemiesRef.current.findIndex(e => e.id === enemyId);
              if (enemyIndex !== -1) {
                const enemy = enemiesRef.current[enemyIndex];
                const newHealth = enemy.health - damage;
                
                if (newHealth <= 0) {
                  // Eliminar enemigo
                  enemiesRef.current = enemiesRef.current.filter(e => e.id !== enemyId);
                  
                  // Crear drop
                  const rand = Math.random();
                  setDrops(prevDrops => [...prevDrops, {
                    id: nextOrbId.current++,
                    x: enemy.x,
                    y: enemy.y,
                    type: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? 'health' : 'cosmos',
                    value: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? DROPS_CONFIG.HEALTH_VALUE : enemy.cosmosValue,
                    lifetime: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? DROPS_CONFIG.HEALTH_LIFETIME : DROPS_CONFIG.COSMOS_LIFETIME
                  }]);
                  setScore(s => s + 100);
                  setWaveKills(k => {
                    const newKills = k + 1;
                    if (newKills >= WAVE_CONFIG.ENEMIES_TO_KILL_PER_WAVE) {
                      setWaveNumber(w => w + 1);
                      return 0;
                    }
                    return newKills;
                  });
                } else {
                  // Actualizar salud del enemigo
                  enemiesRef.current[enemyIndex] = { ...enemy, health: newHealth };
                }
              }
              
              // Actualizar el estado de React
              setEnemies([...enemiesRef.current]);
            }
          );
        }
      }
      // Actualizar efectos del PowerSystem
      PowerSystem.updateEffects();
      // ===== FIN SISTEMA DE RAYO =====
      
      // ===== SISTEMA DE FLECHA DE ORO =====
      if (currentUpgrades.goldenArrow > 0) {
        const arrowLevel = currentUpgrades.goldenArrow;
        const arrowCooldown = PowerSystem.getGoldenArrowCooldown(arrowLevel);
        
        if (nowLightning - lastGoldenArrowTrigger.current >= arrowCooldown) {
          lastGoldenArrowTrigger.current = nowLightning;
          
          // Activar flecha de oro (el daño se aplica en updateGoldenArrows cuando impacta)
          PowerSystem.triggerGoldenArrow(
            currentPlayer.x,
            currentPlayer.y,
            arrowLevel,
            currentEnemies,
            () => {} // Callback vacío, el daño se maneja en updateGoldenArrows
          );
        }
      }
      
      // Actualizar flechas doradas (movimiento y colisiones)
      // Se usa currentEnemies (capturado al inicio del frame) para evitar race conditions
      const arrowKilledEnemies = new Set<number>();
      PowerSystem.updateGoldenArrows(
        deltaTime,
        currentEnemies,
        (enemyId, damage) => {
          const enemyIndex = currentEnemies.findIndex(e => e.id === enemyId);
          if (enemyIndex === -1) return;
          
          const enemy = currentEnemies[enemyIndex];
          const newHealth = enemy.health - damage;
          
          if (newHealth <= 0) {
            // Marcar para eliminar al final del frame
            arrowKilledEnemies.add(enemyId);
            
            // Crear drop
            const rand = Math.random();
            setDrops(prevDrops => [...prevDrops, {
              id: nextOrbId.current++,
              x: enemy.x,
              y: enemy.y,
              type: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? 'health' : 'cosmos',
              value: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? DROPS_CONFIG.HEALTH_VALUE : enemy.cosmosValue,
              lifetime: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? DROPS_CONFIG.HEALTH_LIFETIME : DROPS_CONFIG.COSMOS_LIFETIME
            }]);
            setScore(s => s + 100);
            setWaveKills(k => {
              const newKills = k + 1;
              if (newKills >= WAVE_CONFIG.ENEMIES_TO_KILL_PER_WAVE) {
                setWaveNumber(w => w + 1);
                return 0;
              }
              return newKills;
            });
          } else {
            // Actualizar salud del enemigo en el array
            currentEnemies[enemyIndex] = { ...enemy, health: newHealth };
          }
        }
      );
      
      // Aplicar las eliminaciones de flechas
      if (arrowKilledEnemies.size > 0) {
        enemiesRef.current = currentEnemies.filter(e => !arrowKilledEnemies.has(e.id));
      } else {
        enemiesRef.current = currentEnemies;
      }
      // ===== FIN SISTEMA DE FLECHA DE ORO =====
      
      // ===== SISTEMA DE ESCUDO DE ATENA =====
      if (currentUpgrades.athenaShield > 0) {
        const shieldLevel = currentUpgrades.athenaShield;
        
        // Inicializar escudos si no existen
        PowerSystem.triggerAthenaShield(
          currentPlayer.x,
          currentPlayer.y,
          'player',
          shieldLevel
        );
        
        // Actualizar escudos (rotación y regeneración)
        PowerSystem.updateShields(deltaTime, shieldLevel);
      }
      // ===== FIN SISTEMA DE ESCUDO DE ATENA =====
      
      // Procesar spawn warnings y convertir en enemigos cuando sea tiempo
      const now = Date.now();
      setSpawnWarnings(prev => {
        if (prev.length === 0) return prev;
        
        const remaining: SpawnWarning[] = [];
        let spawned = 0;
        
        prev.forEach(warning => {
          if (now >= warning.spawnTime) {
            // Crear el enemigo con estadísticas balanceadas y escalado por oleada
            const health = calculateEnemyHP(warning.type, waveNumber);
            const maxHealth = health;
            const speed = calculateEnemySpeed(warning.type, waveNumber);
            
            // Calcular cosmos según tipo
            const enemyTypeConfig = ENEMY_CONFIG[warning.type.toUpperCase() as 'NORMAL' | 'FAST' | 'TANK'];
            const cosmosValue = enemyTypeConfig.COSMOS_MIN + Math.floor(Math.random() * (enemyTypeConfig.COSMOS_MAX - enemyTypeConfig.COSMOS_MIN + 1));
            
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
            
            setEnemies(e => {
              const newEnemies = [...e, enemy];
              enemiesRef.current = newEnemies;
              return newEnemies;
            });
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
      
      // PASO 1: Mover proyectiles
      const movedProjectiles: Projectile[] = [];
      const cameraMargin = PROJECTILE_CONFIG.CAMERA_MARGIN;
      
      for (const p of allProjectiles) {
        const newX = p.x + p.dx * PLAYER_CONFIG.PROJECTILE_SPEED_MULTIPLIER;
        const newY = p.y + p.dy * PLAYER_CONFIG.PROJECTILE_SPEED_MULTIPLIER;
        
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
      
      // PASO 2: Mover enemigos y verificar colisión con jugador
      const movedEnemies: Enemy[] = [];
      let playerDamaged = false;
      let screenShakeNeeded = false;
      
      // Usar enemiesRef.current que tiene las eliminaciones de las flechas
      for (const enemy of enemiesRef.current) {
        // Actualizar sprite
        if (enemy.sprite) {
          enemy.sprite.update(deltaTime);
        }
        
        // Verificar colisión con jugador (contacto físico)
        if (Math.hypot(currentPlayer.x - enemy.x, currentPlayer.y - enemy.y) < ENEMY_CONFIG.COLLISION_RADIUS) {
          if (!playerDamaged) {
            playerDamaged = true;
            screenShakeNeeded = true;
          }
          continue; // Eliminar enemigo que tocó al jugador
        }
        
        // Mover enemigo hacia el jugador
        const angle = Math.atan2(currentPlayer.y - enemy.y, currentPlayer.x - enemy.x);
        const actualSpeed = ENEMY_CONFIG.BASE_MOVEMENT_SPEED * enemy.speed * deltaTime;
        
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
          const newHealth = p.health - ENEMY_CONFIG.DAMAGE_TO_PLAYER;
          if (newHealth <= 0) setGameState('gameover');
          return { ...p, health: Math.max(0, newHealth) };
        });
        if (screenShakeNeeded) {
          setScreenShake({ 
            x: (Math.random() - 0.5) * VISUAL_CONFIG.SCREEN_SHAKE_INTENSITY, 
            y: (Math.random() - 0.5) * VISUAL_CONFIG.SCREEN_SHAKE_INTENSITY 
          });
          setTimeout(() => setScreenShake({ x: 0, y: 0 }), VISUAL_CONFIG.SCREEN_SHAKE_DURATION);
        }
      }
      
      // PASO 3: Procesar colisiones de proyectiles
      const projectilesToKeep: Projectile[] = [];
      const enemiesToKeep: Enemy[] = [];
      const newDrops: Drop[] = [];
      let addScore = 0;
      let addKills = 0;
      
      const enemiesAlive = new Set(movedEnemies.map(e => e.id));
      
      // ⚡ Early exit: No procesar colisiones si no hay enemigos ni boss
      if (movedEnemies.length === 0 && !currentBoss) {
        projectilesToKeep.push(...movedProjectiles);
        enemiesToKeep.push(...movedEnemies);
      } else {
      for (const proj of movedProjectiles) {
        let projectileHit = false;
        
        if (proj.isEnemy) {
          // Proyectil enemigo vs jugador
          const distToPlayer = Math.hypot(currentPlayer.x - proj.x, currentPlayer.y - proj.y);
          if (distToPlayer < PROJECTILE_CONFIG.ENEMY_PROJECTILE_HIT_RADIUS) {
            projectileHit = true;
            
            // Intentar aplicar daño al escudo primero
            let remainingDamage: number = PROJECTILE_CONFIG.ENEMY_PROJECTILE_DAMAGE;
            if (PowerSystem.hasActiveShield('player')) {
              remainingDamage = PowerSystem.applyDamageToShield('player', PROJECTILE_CONFIG.ENEMY_PROJECTILE_DAMAGE);
            }
            
            // Aplicar daño restante al jugador
            if (remainingDamage > 0) {
              setPlayer(p => {
                if (!p) return p;
                const newHealth = p.health - remainingDamage;
                if (newHealth <= 0) setGameState('gameover');
                return { ...p, health: Math.max(0, newHealth) };
              });
            }
            
            setScreenShake({ 
              x: (Math.random() - 0.5) * VISUAL_CONFIG.SCREEN_SHAKE_INTENSITY, 
              y: (Math.random() - 0.5) * VISUAL_CONFIG.SCREEN_SHAKE_INTENSITY 
            });
            setTimeout(() => setScreenShake({ x: 0, y: 0 }), VISUAL_CONFIG.SCREEN_SHAKE_DURATION);
          }
        } else {
          // Proyectil del jugador vs enemigos
          for (const enemy of movedEnemies) {
            if (!enemiesAlive.has(enemy.id)) continue; // Saltar enemigos ya muertos
            
            const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
            if (dist < PROJECTILE_CONFIG.PLAYER_PROJECTILE_HIT_RADIUS) {
              projectileHit = true; // Proyectil se destruye al impactar a UN SOLO enemigo
              const newHealth = enemy.health - proj.damage;
              enemy.health = newHealth;
              
              if (newHealth <= 0) {
                // Marcar enemigo como muerto INMEDIATAMENTE
                enemiesAlive.delete(enemy.id);
                
                // Crear drop solo cuando muere
                const rand = Math.random();
                const newDrop: Drop = {
                  id: nextOrbId.current++,
                  x: enemy.x,
                  y: enemy.y,
                  type: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? 'health' : 'cosmos',
                  value: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? DROPS_CONFIG.HEALTH_VALUE : enemy.cosmosValue,
                  lifetime: rand < DROPS_CONFIG.HEALTH_DROP_CHANCE ? DROPS_CONFIG.HEALTH_LIFETIME : DROPS_CONFIG.COSMOS_LIFETIME
                };
                newDrops.push(newDrop);
                
                addScore += 100;
                addKills += 1;
              }
              // IMPORTANTE: Salir del loop inmediatamente después del primer impacto
              // para que este proyectil no impacte múltiples enemigos
              break;
            }
            
            // Salir del loop si el proyectil ya impactó
            if (projectileHit) break;
          }
          
          // Solo verificar colisión con boss si NO impactó un enemigo
          
          // Proyectil del jugador vs boss
          if (!projectileHit && currentBoss) {
            const distBoss = Math.hypot(currentBoss.x - proj.x, currentBoss.y - proj.y);
            if (distBoss < PROJECTILE_CONFIG.BOSS_PROJECTILE_HIT_RADIUS) {
              projectileHit = true;
              setBoss(b => {
                if (!b) return b;
                const newHealth = b.health - proj.damage;
                
                if (newHealth <= 0) {
                  // ⭐ DROP GENEROSO DE COSMOS AL DERROTAR AL BOSS
                  newDrops.push({
                    id: nextOrbId.current++,
                    x: b.x, y: b.y,
                    type: 'cosmos',
                    value: BOSS_CONFIG.COSMOS_REWARD_MIN + Math.floor(Math.random() * (BOSS_CONFIG.COSMOS_REWARD_MAX - BOSS_CONFIG.COSMOS_REWARD_MIN + 1)),
                    lifetime: DROPS_CONFIG.COSMOS_LIFETIME
                  });
                  addScore += BOSS_CONFIG.SCORE_REWARD;
                  
                  // 🔄 SISTEMA POST-BOSS: Continuar con oleadas más difíciles
                  setCurrentHouse(h => h + 1);
                  // Incrementar oleada significativamente para mayor dificultad
                  setWaveNumber(w => w + WAVE_CONFIG.BOSS_DEFEATED_WAVE_INCREMENT);
                  setWaveKills(0);
                  setGameState('houseclear');
                  
                  // Reiniciar tiempo de stage para próximo boss en 3 minutos
                  stageStartTime.current = Date.now();
                  stageTimeRef.current = 0;
                  
                  setTimeout(() => {
                    setGameState('playing');
                    if (currentHouse + 1 < GOLD_SAINTS.length) {
                      // El siguiente boss spawneará automáticamente a los 3 minutos
                      // Mientras tanto, continúan las oleadas progresivamente más difíciles
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
      } // ⚡ Fin del bloque de colisiones con enemigos
      
      // Actualizar estados AL FINAL DEL FRAME
      setProjectiles(projectilesToKeep);
      projectilesRef.current = projectilesToKeep;
      
      setEnemies(enemiesToKeep);
      enemiesRef.current = enemiesToKeep;
      
      if (newDrops.length > 0) {
        setDrops(prev => {
          const combined = [...prev, ...newDrops];
          return combined.length > DROPS_CONFIG.MAX_DROPS ? combined.slice(-DROPS_CONFIG.MAX_DROPS) : combined;
        });
      }
      
      if (addScore > 0) setScore(s => s + addScore);
      if (addKills > 0) {
        setWaveKills(k => {
          const newKills = k + addKills;
          if (newKills >= WAVE_CONFIG.ENEMIES_TO_KILL_PER_WAVE) {
            setWaveNumber(w => w + 1);
            return 0;
          }
          return newKills;
        });
      }
      
      // ⚡ SISTEMA DE RECOLECCIÓN (tipo Vampire Survivors pero más balanceado)
      // El jugador debe acercarse para recoger, con un pequeño rango de atracción
      const PICKUP_RADIUS = DROPS_CONFIG.PICKUP_RADIUS;
      const MAGNET_RADIUS = DROPS_CONFIG.MAGNET_RADIUS;
      const MAGNET_SPEED = DROPS_CONFIG.MAGNET_SPEED;
      
      setDrops(prev => {
        const updatedDrops: Drop[] = [];
        let collected = 0;
        
        for (const drop of prev) {
          // Actualizar lifetime
          const newLifetime = drop.lifetime - deltaTime;
          if (newLifetime <= 0) continue;
          
          // Calcular distancia al jugador (cacheado para optimización)
          const distX = currentPlayer.x - drop.x;
          const distY = currentPlayer.y - drop.y;
          const distance = Math.hypot(distX, distY);
          
          // Recolección inmediata si está dentro del radio
          if (distance < PICKUP_RADIUS) {
            collected++;
            if (drop.type === 'cosmos') {
              gainCosmos(drop.value);
            } else if (drop.type === 'health') {
              setPlayer(p => {
                if (!p) return p;
                const newHealth = Math.min(p.maxHealth, p.health + drop.value);
                return { ...p, health: newHealth };
              });
            }
            continue;
          }
          
          // Atracción magnética suave si está en rango
          let newX = drop.x;
          let newY = drop.y;
          if (distance < MAGNET_RADIUS && distance > PICKUP_RADIUS) {
            const moveAmount = MAGNET_SPEED * deltaTime;
            const moveRatio = Math.min(moveAmount / distance, 1); // Normalizado
            newX += distX * moveRatio;
            newY += distY * moveRatio;
          }
          
          updatedDrops.push({ ...drop, x: newX, y: newY, lifetime: newLifetime });
        }
        
        // Limitar drops máximos
        if (updatedDrops.length > DROPS_CONFIG.MAX_DROPS_DISPLAY) {
          return updatedDrops.sort((a, b) => b.lifetime - a.lifetime).slice(0, DROPS_CONFIG.MAX_DROPS_DISPLAY);
        }
        return updatedDrops;
      });
      
      // Actualizar lógica del boss
      if (currentBoss) {
        const now = Date.now();
        
        // Super ataque cada 10 segundos
        if (now - currentBoss.lastSuperAttack > BOSS_CONFIG.SUPER_ATTACK_INTERVAL) {
          setBoss(b => {
            if (!b) return b;
            
            // Calcular dirección hacia el jugador
            const angle = Math.atan2(currentPlayer.y - b.y, currentPlayer.x - b.x);
            
            // Crear advertencia de área de ataque
            const warningWidth = BOSS_CONFIG.SUPER_ATTACK_WIDTH;
            const warningHeight = BOSS_CONFIG.SUPER_ATTACK_HEIGHT;
            
            // Calcular posición del centro del área de ataque (frente al boss)
            const attackDistance = warningHeight / 2 + 60;
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
              warningDuration: BOSS_CONFIG.SUPER_ATTACK_WARNING_DURATION,
              executionTime: now + BOSS_CONFIG.SUPER_ATTACK_WARNING_DURATION
            };
            
            setBossSuperAttackWarnings(prev => [...prev, warning]);
            
            return { ...b, lastSuperAttack: now };
          });
        }
        
        // Ataque regular cada 2 segundos
        if (now - currentBoss.lastAttack > BOSS_CONFIG.REGULAR_ATTACK_INTERVAL) {
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
                  dx: Math.cos(angle) * BOSS_CONFIG.PROJECTILE_SPEED_MEDIUM,
                  dy: Math.sin(angle) * BOSS_CONFIG.PROJECTILE_SPEED_MEDIUM,
                  damage: BOSS_CONFIG.REGULAR_PROJECTILE_DAMAGE_MEDIUM,
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
                  dx: Math.cos(angle + i * 0.2) * BOSS_CONFIG.PROJECTILE_SPEED_FAST,
                  dy: Math.sin(angle + i * 0.2) * BOSS_CONFIG.PROJECTILE_SPEED_FAST,
                  damage: BOSS_CONFIG.REGULAR_PROJECTILE_DAMAGE_HIGH,
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
                  dx: Math.cos(angle) * BOSS_CONFIG.PROJECTILE_SPEED_SLOW,
                  dy: Math.sin(angle) * BOSS_CONFIG.PROJECTILE_SPEED_SLOW,
                  damage: BOSS_CONFIG.REGULAR_PROJECTILE_DAMAGE_LOW,
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
            }, BOSS_CONFIG.REGULAR_ATTACK_ANIMATION_DURATION);
            
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
        // Límite más agresivo
        if (filtered.length > VISUAL_CONFIG.MAX_ATTACK_EFFECTS) {
          return filtered.slice(-VISUAL_CONFIG.MAX_ATTACK_EFFECTS);
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
              damage: BOSS_CONFIG.SUPER_ATTACK_DAMAGE,
              createdAt: now,
              duration: BOSS_CONFIG.SUPER_ATTACK_EXECUTION_DURATION
            };
            
            setBossSuperAttacks(attacks => [...attacks, superAttack]);
            
            // Screen shake al ejecutar super ataque
            setScreenShake({ 
              x: (Math.random() - 0.5) * VISUAL_CONFIG.SCREEN_SHAKE_SUPER_ATTACK_INTENSITY, 
              y: (Math.random() - 0.5) * VISUAL_CONFIG.SCREEN_SHAKE_SUPER_ATTACK_INTENSITY 
            });
            setTimeout(() => setScreenShake({ x: 0, y: 0 }), VISUAL_CONFIG.SCREEN_SHAKE_SUPER_ATTACK_DURATION);
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
      
      } // ===== FIN DEL BLOQUE if (shouldUpdateLogic) =====
      
      } // ===== FIN DEL BLOQUE if (currentPlayer) =====
      
      // ===== RENDERIZADO INMEDIATO EN EL MISMO LOOP (SIEMPRE SE EJECUTA) =====
      if (!canvasRef.current) {
        return; // No llamar requestAnimationFrame aquí, ya está al inicio
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return; // No llamar requestAnimationFrame aquí, ya está al inicio
      }
      
      // Verificar dimensiones del canvas
      if (canvas.width === 0 || canvas.height === 0) {
        return; // No llamar requestAnimationFrame aquí, ya está al inicio
      }
      
      // Actualizar sprite del jugador cada frame
      const currentPlayerSprite = playerSpriteRef.current;
      if (currentPlayerSprite) {
        currentPlayerSprite.update(deltaTime);
        
        // Determinar animación
        const currentIsAttacking = isAttackingRef.current;
        if (currentIsAttacking) {
          currentPlayerSprite.setAnimation('attack');
        } else if (isMovingFromInput) {
          currentPlayerSprite.setAnimation('walk');
        } else {
          currentPlayerSprite.setAnimation('idle');
        }
        
        // Flip sprite según dirección (considerar tanto teclado como joystick)
        if (dx < -0.1) {
          currentPlayerSprite.flipX = true;
        } else if (dx > 0.1) {
          currentPlayerSprite.flipX = false;
        }
      }
      
      // Limpiar canvas con fondo negro
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Si no hay jugador, mostrar mensaje de carga
      // Redefinir currentPlayer en este scope para renderizado
      const currentPlayerForRender = playerRef.current;
      if (!currentPlayerForRender) {
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Cargando...', WIDTH / 2, HEIGHT / 2);
        return; // No llamar requestAnimationFrame aquí, ya está al inicio
      }
      
      if (gameStateRef.current === 'playing' || gameStateRef.current === 'houseclear') {
        // Guardar estado del canvas
        ctx.save();
        
        // Aplicar transformación de cámara con screen shake
        const currentCamera = cameraRef.current;
        const currentScreenShake = screenShakeRef.current;
        ctx.translate(-currentCamera.x + currentScreenShake.x, -currentCamera.y + currentScreenShake.y);
        
        // Dibujar fondo del mapa con imagen repetida en su tamaño original
        const currentFloorImage = floorImageRef.current;
        if (currentFloorImage && currentFloorImage.complete) {
          ctx.imageSmoothingEnabled = false;
          
          // Calcular cuántas veces necesitamos repetir la imagen
          const imgWidth = currentFloorImage.width;
          const imgHeight = currentFloorImage.height;
          
          // Dibujar la imagen repetida manualmente
          for (let x = 0; x < MAP_WIDTH; x += imgWidth) {
            for (let y = 0; y < MAP_HEIGHT; y += imgHeight) {
              ctx.drawImage(currentFloorImage, x, y);
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
        const currentSpawnWarnings = spawnWarningsRef.current;
        if (currentSpawnWarnings.length > 0) {
          currentSpawnWarnings.forEach(warning => {
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
        if (currentPlayerSprite) {
          currentPlayerSprite.draw(ctx, currentPlayerForRender.x, currentPlayerForRender.y, 64, 64);
        } else {
          ctx.fillStyle = currentPlayerForRender.knight.color;
          ctx.beginPath();
          ctx.arc(currentPlayerForRender.x, currentPlayerForRender.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
        
        const currentEnemies = enemiesRef.current;
        currentEnemies.forEach(enemy => {
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
          
          // Barra de vida del enemigo (mejorada)
          const barWidth = 40;
          const barHeight = 5;
          const barX = enemy.x - barWidth / 2;
          const barY = enemy.y - 35;
          
          // Borde negro
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(barX, barY, barWidth, barHeight);
          
          // Fondo rojo (vida perdida)
          ctx.fillStyle = '#F00';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          
          // Vida actual (gradiente de rojo a verde según salud)
          const healthPercent = enemy.health / enemy.maxHealth;
          if (healthPercent > 0) {
            // Color gradiente: rojo cuando baja, verde cuando alta
            const red = Math.floor(255 * (1 - healthPercent));
            const green = Math.floor(255 * healthPercent);
            ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
          }
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
          
          // Barra de vida del boss (mejorada)
          const bossBarWidth = 80;
          const bossBarHeight = 6;
          const bossBarX = boss.x - bossBarWidth / 2;
          const bossBarY = boss.y - 65;
          
          // Borde negro
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
          
          // Fondo rojo (vida perdida)
          ctx.fillStyle = '#F00';
          ctx.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
          
          // Vida actual del boss (gradiente de rojo a verde)
          const bossHealthPercent = boss.health / boss.maxHealth;
          if (bossHealthPercent > 0) {
            const red = Math.floor(255 * (1 - bossHealthPercent));
            const green = Math.floor(255 * bossHealthPercent);
            ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
            ctx.fillRect(bossBarX, bossBarY, bossBarWidth * bossHealthPercent, bossBarHeight);
          }
        }
        
        const currentProjectiles = projectilesRef.current;
        currentProjectiles.forEach(proj => {
          // ⚡ Trail visual REDUCIDO para proyectiles del jugador (menos confuso)
          const currentProjectileImage = projectileImageRef.current;
          if (!proj.isEnemy && currentProjectileImage && currentProjectileImage.complete) {
            ctx.imageSmoothingEnabled = false;
            const displaySize = 24;
            
            // Trail de solo 1 círculo (reducido para evitar confusión visual)
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = proj.color;
            const trailX = proj.x - proj.dx * 2;
            const trailY = proj.y - proj.dy * 2;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Proyectil principal
            ctx.drawImage(
              currentProjectileImage,
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
        
        // Dibujar efectos de Rayo de Zeus
        PowerSystem.drawLightning(ctx);
        PowerSystem.drawPowerEffects(ctx);
        const currentGoldenArrowImage = goldenArrowImageRef.current;
        PowerSystem.drawGoldenArrows(ctx, currentGoldenArrowImage);
        PowerSystem.drawShields(ctx, currentPlayerForRender.x, currentPlayerForRender.y);
        
        // Dibujar efectos de ataque del boss (bolas de poder) - limitar a 10 más recientes
        const currentBossAttackImage = bossAttackImageRef.current;
        const currentBossAttackEffects = bossAttackEffectsRef.current;
        if (currentBossAttackImage && currentBossAttackImage.complete) {
          const now = Date.now();
          const recentEffects = currentBossAttackEffects.slice(-10);
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
        
        // Dibujar drops (cosmos, health) - Mejorados visualmente pero sin animaciones
        const currentDrops = dropsRef.current;
        currentDrops.forEach(drop => {
          if (drop.type === 'health') {
            // Cruz de vida con glow suave
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0F0';
            ctx.fillStyle = '#0F0'; // Verde brillante para vida
            ctx.fillRect(drop.x - 7, drop.y - 2, 14, 4);
            ctx.fillRect(drop.x - 2, drop.y - 7, 4, 14);
            
            // Borde blanco para mejor visibilidad
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(drop.x - 7, drop.y - 2, 14, 4);
            ctx.strokeRect(drop.x - 2, drop.y - 7, 4, 14);
            ctx.shadowBlur = 0;
          } else {
            // Cosmos (orbe azul con efecto brillante)
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0FF';
            ctx.fillStyle = '#0FF'; // Azul brillante para cosmos
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Borde más oscuro para contraste
            ctx.strokeStyle = '#07A';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
        
        // Dibujar advertencias de super ataque del boss (SIMPLIFICADO para mejor rendimiento)
        const currentBossSuperAttackWarnings = bossSuperAttackWarningsRef.current;
        const currentBossSuperAttacks = bossSuperAttacksRef.current;
        const currentBossSuperAttackSprites = bossSuperAttackSpritesRef.current;
        if (currentBossSuperAttackWarnings.length > 0) {
          const now = Date.now();
          currentBossSuperAttackWarnings.forEach(warning => {
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
        if (currentBossSuperAttacks.length > 0 && currentBossSuperAttackSprites.length === 3) {
          const now = Date.now();
          currentBossSuperAttacks.forEach(attack => {
            const age = now - attack.createdAt;
            const progress = age / attack.duration;
            
            ctx.save();
            ctx.translate(attack.x, attack.y);
            ctx.rotate(attack.angle);
            
            const scale = 0.8 + progress * 0.4;
            const alpha = 1 - progress;
            
            // Seleccionar frame
            const frameIndex = Math.min(2, Math.floor(progress * 3));
            const sprite = currentBossSuperAttackSprites[frameIndex];
            
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
        // Barra de vida del jugador (mejorada)
        const playerBarWidth = 200;
        const playerBarHeight = 20;
        
        // Borde negro
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, playerBarWidth, playerBarHeight);
        
        // Fondo rojo (vida perdida)
        ctx.fillStyle = '#F00';
        ctx.fillRect(10, 10, playerBarWidth, playerBarHeight);
        
        // Vida actual del jugador (gradiente de rojo a verde)
        const playerHealthPercent = currentPlayerForRender.health / currentPlayerForRender.maxHealth;
        if (playerHealthPercent > 0) {
          const red = Math.floor(255 * (1 - playerHealthPercent));
          const green = Math.floor(255 * playerHealthPercent);
          ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
          ctx.fillRect(10, 10, playerBarWidth * playerHealthPercent, playerBarHeight);
        }
        
        // Barra de Cosmos (reemplaza exp)
        const cosmosRequired = calculateCosmosRequired(currentPlayerForRender.level);
        ctx.fillStyle = '#00F';
        ctx.fillRect(10, 35, 200, 10);
        ctx.fillStyle = '#0FF';
        ctx.fillRect(10, 35, 200 * (currentPlayerForRender.cosmos / cosmosRequired), 10);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Nivel: ${currentPlayerForRender.level}`, 220, 25);
        ctx.fillText(`Puntos: ${score}`, 220, 45);
        ctx.fillText(`Casa: ${currentHouse + 1}/12`, 10, 60);
        ctx.fillText(`Enemigos eliminados: ${waveKills}`, 10, 75);
        ctx.fillText(`Enemigos activos: ${enemiesRef.current.length}`, 10, 90);
        
        // Timer del stage con indicador de boss (usar ref para valor actualizado)
        const currentStageTimeForRender = stageTimeRef.current;
        const minutes = Math.floor(currentStageTimeForRender / 60);
        const seconds = currentStageTimeForRender % 60;
        const timeUntilBoss = Math.max(0, BOSS_CONFIG.SPAWN_TIME - currentStageTimeForRender);
        const minutesUntilBoss = Math.floor(timeUntilBoss / 60);
        const secondsUntilBoss = Math.floor(timeUntilBoss % 60);
        
        // Color basado en proximidad del boss
        let timeColor = '#FFF';
        if (boss) {
          timeColor = '#FF0000'; // Rojo si el boss está activo
        } else if (timeUntilBoss <= 30) {
          timeColor = '#FF4444'; // Rojo si falta menos de 30s
        } else if (timeUntilBoss <= 60) {
          timeColor = '#FFAA00'; // Naranja si falta menos de 1 minuto
        }
        
        ctx.fillStyle = timeColor;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⏱ ${minutes}:${seconds.toString().padStart(2, '0')}`, WIDTH / 2, 30);
        
        // Mostrar countdown hasta el boss si no ha aparecido
        if (!boss && timeUntilBoss > 0) {
          ctx.fillStyle = timeColor;
          ctx.font = '14px Arial';
          ctx.fillText(`⚔️ Boss en ${minutesUntilBoss}:${secondsUntilBoss.toString().padStart(2, '0')}`, WIDTH / 2, 70);
        } else if (boss) {
          ctx.fillStyle = '#FF0000';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`⚔️ ¡${boss.gold.name}!`, WIDTH / 2, 70);
        }
        
        // Oleada actual
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px Arial';
        ctx.fillText(`Oleada ${waveNumber}`, WIDTH / 2, 50);
      } // Cerrar bloque de ctx
      // ===== FIN RENDERIZADO =====
      
      // El loop continúa automáticamente con el requestAnimationFrame al inicio
    };
    
    // Iniciar el loop unificado
    animationFrameId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []); // ✅ Array vacío: el gameLoop se ejecuta UNA VEZ y permanece activo

  // Inicializar el juego automáticamente cuando se monta el componente
  useEffect(() => {
    if (gameStarted && !player) {
      // Usar setTimeout para asegurar que el canvas esté montado en el DOM
      const timeoutId = setTimeout(() => {
        if (canvasRef.current) {
          initializeGame();
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gameStarted, player, initializeGame]);

  // ===== RENDERIZADO PRINCIPAL CON OVERLAYS =====
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      touchAction: 'none'
    }}>
      {/* Indicador de carga mientras el jugador no está inicializado */}
      {isInitializing && (
        <>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}</style>
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#FFD700',
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 'clamp(1rem, 3vw, 2rem)',
            borderRadius: '10px',
            border: '2px solid #FFD700',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            🎮 Cargando juego...<br />
            <span style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)', color: '#FFF' }}>
              {isMobile ? 'Modo móvil detectado' : 'Modo escritorio'}
            </span>
          </div>
        </>
      )}
      
      {/* Canvas siempre presente - Adaptable a cualquier orientación */}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          backgroundColor: '#000',
          width: isPortrait ? '100vw' : 'auto',
          height: isPortrait ? 'auto' : '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'block',
          imageRendering: 'pixelated',
          touchAction: 'none',
          border: isMobile ? 'none' : '2px solid #FFD700',
          objectFit: 'contain'
        }}
      />
      
      {/* Controles móviles */}
      <MobileControls
        visible={isMobile && gameState === 'playing'}
        onJoystickMove={(direction) => {
          setMobileDirection(direction);
          mobileDirectionRef.current = direction; // Actualizar ref inmediatamente
        }}
        onJoystickEnd={() => {
          setMobileDirection({ x: 0, y: 0 });
          mobileDirectionRef.current = { x: 0, y: 0 }; // Actualizar ref inmediatamente
        }}
      />
      
      {/* Overlay de Level Up */}
      {gameState === 'levelup' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 10, 26, 0.95)',
          backgroundImage: 'linear-gradient(135deg, rgba(26, 10, 46, 0.95) 0%, rgba(10, 10, 26, 0.95) 50%, rgba(26, 10, 46, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          padding: 'clamp(0.5rem, 2vw, 1rem)',
          overflowY: 'auto',
          zIndex: 9999
        }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '1200px', 
          width: '100%',
          padding: 'clamp(0.5rem, 2vw, 1rem)'
        }}>
          <h1 style={{ 
            color: '#FFD700', 
            marginBottom: 'clamp(0.5rem, 2vw, 1.5rem)',
            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8)'
          }}>¡Nivel Superior!</h1>
          <h2 style={{ 
            marginBottom: 'clamp(0.5rem, 2vw, 1.5rem)',
            fontSize: 'clamp(0.9rem, 3vw, 1.5rem)'
          }}>Elige una mejora:</h2>
          <div style={{ 
            display: 'flex', 
            gap: 'clamp(0.5rem, 2vw, 1rem)', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: 'clamp(0.25rem, 1vw, 0.5rem)',
            alignItems: 'stretch'
          }}>
            {upgradeChoices.map(upgrade => {
              const currentLevel = upgrades[upgrade.id as keyof PlayerUpgrades] || 0;
              const maxLevel = upgrade.levels.length;
              
              return (
                <div
                  key={upgrade.id}
                  onClick={() => {
                    if (currentLevel < maxLevel) {
                      selectUpgrade(upgrade.id);
                    }
                  }}
                  style={{
                    padding: 'clamp(0.75rem, 2vw, 1.5rem)',
                    border: '3px solid #FFD700',
                    borderRadius: '10px',
                    cursor: currentLevel < maxLevel ? 'pointer' : 'not-allowed',
                    backgroundColor: currentLevel < maxLevel ? '#1a1a3e' : '#333',
                    width: 'clamp(140px, 28vw, 220px)',
                    minWidth: '140px',
                    opacity: currentLevel < maxLevel ? 1 : 0.6,
                    flex: '1 1 auto',
                    maxWidth: '250px',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                    touchAction: 'manipulation'
                  }}
                  onMouseEnter={(e) => {
                    if (currentLevel < maxLevel) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 215, 0, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <div style={{ 
                    fontSize: 'clamp(2rem, 6vw, 3rem)', 
                    marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)',
                    lineHeight: 1
                  }}>{upgrade.icon}</div>
                  <h3 style={{ 
                    color: '#FFD700',
                    fontSize: 'clamp(0.85rem, 2.5vw, 1.2rem)',
                    marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)',
                    fontWeight: 'bold'
                  }}>{upgrade.name}</h3>
                  <p style={{
                    fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                    marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)',
                    lineHeight: 1.3,
                    color: '#ddd'
                  }}>{upgrade.desc}</p>
                  <p style={{ 
                    marginTop: 'clamp(0.25rem, 1vw, 0.5rem)', 
                    color: '#0FF',
                    fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                    fontWeight: 'bold'
                  }}>
                    Nivel: {currentLevel}/{maxLevel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}
      
      {/* Overlay de House Clear */}
      {gameState === 'houseclear' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 10, 26, 0.95)',
          backgroundImage: 'linear-gradient(135deg, rgba(26, 10, 46, 0.95) 0%, rgba(10, 10, 26, 0.95) 50%, rgba(26, 10, 46, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          padding: 'clamp(0.5rem, 2vw, 1rem)',
          zIndex: 9999
        }}>
        <div style={{ textAlign: 'center', maxWidth: '90%' }}>
          <h1 style={{ 
            color: '#FFD700', 
            fontSize: 'clamp(1.5rem, 6vw, 3rem)', 
            marginBottom: 'clamp(1rem, 3vw, 2rem)' 
          }}>
            ¡Casa Conquistada!
          </h1>
          {currentHouse < GOLD_SAINTS.length && (
            <h2 style={{ 
              color: '#0FF',
              fontSize: 'clamp(1rem, 4vw, 1.5rem)'
            }}>
              Has derrotado a {GOLD_SAINTS[currentHouse - 1]?.name}
            </h2>
          )}
          {currentHouse >= GOLD_SAINTS.length && (
            <div>
              <h2 style={{ 
                color: '#0FF', 
                marginBottom: 'clamp(1rem, 3vw, 2rem)',
                fontSize: 'clamp(1rem, 4vw, 1.5rem)'
              }}>
                ¡Has conquistado las 12 Casas del Santuario!
              </h2>
              <p style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>Puntuación Final: {score}</p>
            </div>
          )}
        </div>
        </div>
      )}
      
      {/* Overlay de Game Over */}
      {gameState === 'gameover' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 10, 26, 0.95)',
          backgroundImage: 'linear-gradient(135deg, rgba(26, 10, 46, 0.95) 0%, rgba(10, 10, 26, 0.95) 50%, rgba(26, 10, 46, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          padding: 'clamp(0.5rem, 2vw, 1rem)',
          zIndex: 9999
        }}>
          <div style={{ textAlign: 'center', maxWidth: '90%' }}>
          <h1 style={{ 
            color: '#F00', 
            fontSize: 'clamp(1.5rem, 6vw, 3rem)', 
            marginBottom: 'clamp(1rem, 3vw, 2rem)' 
          }}>
            Game Over
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 3vw, 1.5rem)', 
            marginBottom: 'clamp(0.5rem, 2vw, 1rem)' 
          }}>Puntuación: {score}</p>
          <p style={{ 
            fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', 
            marginBottom: 'clamp(1rem, 3vw, 2rem)' 
          }}>
            Llegaste a la Casa {currentHouse + 1}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              backgroundColor: '#FFD700',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              color: '#000',
              fontWeight: 'bold',
              touchAction: 'manipulation',
              minHeight: '44px'
            }}
          >
            Reintentar
          </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default SaintSeiyaGame;

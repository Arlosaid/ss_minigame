// ==================== TYPES & INTERFACES ====================

export interface Vector2D {
  x: number;
  y: number;
}

export interface EntityStats {
  maxHp: number;
  currentHp: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackSpeed: number; // ataques por segundo
}

export interface Entity {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  stats: EntityStats;
  size: number;
  type: 'player' | 'enemy';
  isAttacking: boolean;
  attackCooldown: number;
  targetId?: string;
}

export interface Enemy extends Entity {
  type: 'enemy';
  enemyType: EnemyType;
  movePattern: MovePattern;
  rewardValue: number;
}

export interface Player extends Entity {
  type: 'player';
  experience: number;
  level: number;
  cosmos: number; // barra especial
  gold: number;
  gems: number;
  upgrades: Upgrade[];
}

export type EnemyType = 'melee' | 'ranged' | 'tank' | 'fast' | 'miniboss' | 'boss';

export type MovePattern = 'chase' | 'strafe' | 'circle' | 'zigzag' | 'stationary';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: number;
  apply: (player: Player) => void;
}

export interface Drop {
  id: string;
  type: 'gold' | 'cosmos' | 'gem' | 'experience';
  position: Vector2D;
  value: number;
  lifetime: number;
}

export interface Projectile {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  damage: number;
  ownerId: string;
  lifetime: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  drops: Drop[];
  wave: number;
  gameTime: number;
  isPaused: boolean;
  isGameOver: boolean;
  showLevelUp: boolean;
  levelUpOptions: Upgrade[];
  permanentUpgrades: PermanentUpgrade[];
}

export interface PermanentUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  currency: 'gold' | 'gems';
  maxLevel: number;
  currentLevel: number;
  effect: (level: number) => number;
}

export interface ArenaConfig {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface WaveConfig {
  wave: number;
  enemyCount: number;
  enemyTypes: { type: EnemyType; weight: number }[];
  spawnDelay: number;
  difficultyMultiplier: number;
}

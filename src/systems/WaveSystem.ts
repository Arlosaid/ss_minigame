import { Enemy, EnemyType, WaveConfig } from '../types/game';
import { PhysicsSystem } from './PhysicsSystem';
import { EnemyFactory } from './CombatSystem';

export class WaveSystem {
  private currentWave: number = 0;
  private enemiesSpawned: number = 0;
  private spawnTimer: number = 0;
  private arenaWidth: number;
  private arenaHeight: number;

  constructor(arenaWidth: number, arenaHeight: number) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
  }

  startNextWave(): void {
    this.currentWave++;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getEnemiesSpawned(): number {
    return this.enemiesSpawned;
  }

  update(deltaTime: number, currentEnemies: Enemy[]): Enemy[] {
    const waveConfig = this.getWaveConfig(this.currentWave);
    const newEnemies: Enemy[] = [];

    this.spawnTimer += deltaTime;

    // Spawn enemies si es necesario
    if (
      this.enemiesSpawned < waveConfig.enemyCount &&
      this.spawnTimer >= waveConfig.spawnDelay
    ) {
      this.spawnTimer = 0;
      const enemy = this.spawnEnemy(waveConfig);
      if (enemy) {
        newEnemies.push(enemy);
        this.enemiesSpawned++;
      }
    }

    // Auto-avanzar wave si no quedan enemigos y ya spawneamos todos
    if (
      currentEnemies.length === 0 &&
      this.enemiesSpawned >= waveConfig.enemyCount
    ) {
      this.startNextWave();
    }

    return newEnemies;
  }

  private spawnEnemy(waveConfig: WaveConfig): Enemy | null {
    const enemyType = this.selectEnemyType(waveConfig.enemyTypes);
    const spawnPos = this.getSpawnPosition();

    return EnemyFactory.createEnemy(
      enemyType,
      spawnPos,
      waveConfig.difficultyMultiplier
    );
  }

  private selectEnemyType(
    types: { type: EnemyType; weight: number }[]
  ): EnemyType {
    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const t of types) {
      random -= t.weight;
      if (random <= 0) {
        return t.type;
      }
    }

    return types[0].type;
  }

  private getSpawnPosition(): { x: number; y: number } {
    const center = {
      x: this.arenaWidth / 2,
      y: this.arenaHeight / 2
    };

    // Spawn en posiciones aleatorias alrededor del centro
    const minRadius = Math.max(this.arenaWidth, this.arenaHeight) * 0.3;
    const maxRadius = Math.max(this.arenaWidth, this.arenaHeight) * 0.7;
    const randomRadius = minRadius + Math.random() * (maxRadius - minRadius);
    return PhysicsSystem.randomPointOnCircle(center, randomRadius);
  }

  private getWaveConfig(wave: number): WaveConfig {
    const baseCount = 5;
    const countIncrement = 3;
    const enemyCount = baseCount + Math.floor(wave * countIncrement);

    const difficultyMultiplier = 1 + (wave - 1) * 0.15;
    const spawnDelay = Math.max(0.2, 0.8 - wave * 0.03);

    // Configurar tipos de enemigos según la wave
    let enemyTypes: { type: EnemyType; weight: number }[] = [
      { type: 'melee', weight: 50 },
      { type: 'fast', weight: 30 }
    ];

    if (wave >= 3) {
      enemyTypes.push({ type: 'ranged', weight: 20 });
    }

    if (wave >= 5) {
      enemyTypes.push({ type: 'tank', weight: 15 });
    }

    if (wave % 5 === 0) {
      enemyTypes.push({ type: 'miniboss', weight: 10 });
    }

    if (wave % 10 === 0) {
      enemyTypes = [{ type: 'boss', weight: 100 }];
    }

    return {
      wave,
      enemyCount,
      enemyTypes,
      spawnDelay,
      difficultyMultiplier
    };
  }
}

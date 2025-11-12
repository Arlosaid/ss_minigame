import { Player, Enemy, EnemyType, MovePattern } from '../types/game';
import { PhysicsSystem } from './PhysicsSystem';

export class CombatSystem {
  static findNearestEnemy(player: Player, enemies: Enemy[]): Enemy | null {
    if (enemies.length === 0) return null;

    let nearest = enemies[0];
    let minDist = PhysicsSystem.distance(player.position, nearest.position);

    for (let i = 1; i < enemies.length; i++) {
      const dist = PhysicsSystem.distance(player.position, enemies[i].position);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemies[i];
      }
    }

    return minDist <= player.stats.attackRange ? nearest : null;
  }

  static canAttack(entity: Player | Enemy): boolean {
    return entity.attackCooldown <= 0;
  }

  static performAttack(
    attacker: Player | Enemy,
    target: Player | Enemy
  ): boolean {
    if (!this.canAttack(attacker)) return false;

    const distance = PhysicsSystem.distance(attacker.position, target.position);
    if (distance > attacker.stats.attackRange) return false;

    // Aplicar daño
    target.stats.currentHp -= attacker.stats.damage;
    
    // Reset cooldown
    attacker.attackCooldown = 1 / attacker.stats.attackSpeed;
    attacker.isAttacking = true;

    return true;
  }

  static updateCooldowns(entities: (Player | Enemy)[], deltaTime: number): void {
    entities.forEach(entity => {
      if (entity.attackCooldown > 0) {
        entity.attackCooldown -= deltaTime;
      }
      if (entity.attackCooldown <= 0) {
        entity.isAttacking = false;
      }
    });
  }

  static calculateExperienceForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  static addExperience(player: Player, amount: number): boolean {
    player.experience += amount;
    const requiredExp = this.calculateExperienceForLevel(player.level);
    
    if (player.experience >= requiredExp) {
      player.experience -= requiredExp;
      player.level++;
      return true; // Level up!
    }
    
    return false;
  }
}

export class EnemyFactory {
  private static idCounter = 0;

  static createEnemy(
    type: EnemyType,
    position: { x: number; y: number },
    difficultyMultiplier: number = 1
  ): Enemy {
    const configs = this.getEnemyConfig(type);
    
    return {
      id: `enemy_${this.idCounter++}`,
      type: 'enemy',
      position,
      velocity: { x: 0, y: 0 },
      size: configs.size,
      stats: {
        maxHp: configs.hp * difficultyMultiplier,
        currentHp: configs.hp * difficultyMultiplier,
        damage: configs.damage * difficultyMultiplier,
        speed: configs.speed,
        attackRange: configs.attackRange,
        attackSpeed: configs.attackSpeed
      },
      isAttacking: false,
      attackCooldown: 0,
      enemyType: type,
      movePattern: configs.movePattern,
      rewardValue: configs.rewardValue * difficultyMultiplier
    };
  }

  private static getEnemyConfig(type: EnemyType) {
    const configs = {
      melee: {
        hp: 50,
        damage: 10,
        speed: 150,
        attackRange: 30,
        attackSpeed: 1.5,
        size: 20,
        movePattern: 'chase' as MovePattern,
        rewardValue: 10
      },
      fast: {
        hp: 30,
        damage: 8,
        speed: 250,
        attackRange: 25,
        attackSpeed: 2.0,
        size: 15,
        movePattern: 'zigzag' as MovePattern,
        rewardValue: 15
      },
      tank: {
        hp: 200,
        damage: 20,
        speed: 80,
        attackRange: 35,
        attackSpeed: 0.8,
        size: 30,
        movePattern: 'chase' as MovePattern,
        rewardValue: 30
      },
      ranged: {
        hp: 40,
        damage: 12,
        speed: 100,
        attackRange: 200,
        attackSpeed: 1.0,
        size: 18,
        movePattern: 'strafe' as MovePattern,
        rewardValue: 20
      },
      miniboss: {
        hp: 500,
        damage: 30,
        speed: 120,
        attackRange: 50,
        attackSpeed: 1.2,
        size: 40,
        movePattern: 'circle' as MovePattern,
        rewardValue: 100
      },
      boss: {
        hp: 2000,
        damage: 50,
        speed: 100,
        attackRange: 60,
        attackSpeed: 1.5,
        size: 60,
        movePattern: 'circle' as MovePattern,
        rewardValue: 500
      }
    };

    return configs[type];
  }
}

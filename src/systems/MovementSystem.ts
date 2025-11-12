import { Enemy, Player } from '../types/game';
import { PhysicsSystem } from './PhysicsSystem';

export class MovementSystem {
  static updatePlayerMovement(
    player: Player,
    input: { x: number; y: number },
    deltaTime: number,
    arenaWidth: number,
    arenaHeight: number
  ): void {
    // Normalizar input
    const dir = PhysicsSystem.normalize(input);

    // Aplicar velocidad
    player.velocity = {
      x: dir.x * player.stats.speed,
      y: dir.y * player.stats.speed
    };

    // Actualizar posición
    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;

    // Mantener en arena
    player.position = PhysicsSystem.clampToArena(
      player.position,
      player.size,
      arenaWidth,
      arenaHeight
    );
  }

  static updateEnemyMovement(
    enemy: Enemy,
    player: Player,
    deltaTime: number,
    arenaWidth: number,
    arenaHeight: number
  ): void {
    switch (enemy.movePattern) {
      case 'chase':
        this.chasePlayer(enemy, player);
        break;
      case 'strafe':
        this.strafeAroundPlayer(enemy, player);
        break;
      case 'circle':
        this.circlePlayer(enemy, player);
        break;
      case 'zigzag':
        this.zigzagToPlayer(enemy, player);
        break;
      case 'stationary':
        // No se mueve
        break;
    }

    // Aplicar velocidad
    enemy.position.x += enemy.velocity.x * deltaTime;
    enemy.position.y += enemy.velocity.y * deltaTime;

    // Mantener en arena
    enemy.position = PhysicsSystem.clampToArena(
      enemy.position,
      enemy.size,
      arenaWidth,
      arenaHeight
    );
  }

  private static chasePlayer(enemy: Enemy, player: Player): void {
    const distance = PhysicsSystem.distance(enemy.position, player.position);
    const stopDistance = enemy.stats.attackRange * 0.8;

    if (distance > stopDistance) {
      const dir = PhysicsSystem.direction(enemy.position, player.position);
      enemy.velocity = {
        x: dir.x * enemy.stats.speed,
        y: dir.y * enemy.stats.speed
      };
    } else {
      enemy.velocity = { x: 0, y: 0 };
    }
  }

  private static strafeAroundPlayer(
    enemy: Enemy,
    player: Player
  ): void {
    const distance = PhysicsSystem.distance(enemy.position, player.position);
    const optimalDistance = enemy.stats.attackRange * 0.7;

    if (Math.abs(distance - optimalDistance) > 20) {
      // Acercarse o alejarse
      const dir = PhysicsSystem.direction(enemy.position, player.position);
      const sign = distance < optimalDistance ? -1 : 1;
      enemy.velocity = {
        x: dir.x * enemy.stats.speed * sign * 0.5,
        y: dir.y * enemy.stats.speed * sign * 0.5
      };
    } else {
      // Moverse lateralmente
      const dir = PhysicsSystem.direction(enemy.position, player.position);
      enemy.velocity = {
        x: -dir.y * enemy.stats.speed,
        y: dir.x * enemy.stats.speed
      };
    }
  }

  private static circlePlayer(
    enemy: Enemy,
    player: Player
  ): void {
    const distance = PhysicsSystem.distance(enemy.position, player.position);
    const optimalDistance = enemy.stats.attackRange * 0.8;

    // Componente radial (acercarse/alejarse)
    const dir = PhysicsSystem.direction(enemy.position, player.position);
    const radialSpeed =
      distance < optimalDistance
        ? -enemy.stats.speed * 0.3
        : enemy.stats.speed * 0.3;

    // Componente tangencial (circular)
    const tangentialSpeed = enemy.stats.speed * 0.7;

    enemy.velocity = {
      x: dir.x * radialSpeed - dir.y * tangentialSpeed,
      y: dir.y * radialSpeed + dir.x * tangentialSpeed
    };
  }

  private static zigzagToPlayer(
    enemy: Enemy,
    player: Player
  ): void {
    const dir = PhysicsSystem.direction(enemy.position, player.position);
    const time = Date.now() / 1000;
    const zigzagOffset = Math.sin(time * 5) * 0.5;

    enemy.velocity = {
      x: (dir.x + zigzagOffset * -dir.y) * enemy.stats.speed,
      y: (dir.y + zigzagOffset * dir.x) * enemy.stats.speed
    };
  }
}

import { Vector2D } from '../types/game';

export class PhysicsSystem {
  static distance(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalize(v: Vector2D): Vector2D {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  }

  static direction(from: Vector2D, to: Vector2D): Vector2D {
    return this.normalize({
      x: to.x - from.x,
      y: to.y - from.y
    });
  }

  static circleCollision(
    pos1: Vector2D,
    size1: number,
    pos2: Vector2D,
    size2: number
  ): boolean {
    const dist = this.distance(pos1, pos2);
    return dist < (size1 + size2);
  }

  static clampToArena(
    position: Vector2D,
    size: number,
    arenaWidth: number,
    arenaHeight: number
  ): Vector2D {
    return {
      x: Math.max(size, Math.min(arenaWidth - size, position.x)),
      y: Math.max(size, Math.min(arenaHeight - size, position.y))
    };
  }

  static moveTowards(
    current: Vector2D,
    target: Vector2D,
    speed: number,
    deltaTime: number
  ): Vector2D {
    const dir = this.direction(current, target);
    return {
      x: current.x + dir.x * speed * deltaTime,
      y: current.y + dir.y * speed * deltaTime
    };
  }

  static randomPointInCircle(center: Vector2D, radius: number): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    return {
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r
    };
  }

  static randomPointOnCircle(center: Vector2D, radius: number): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
  }
}

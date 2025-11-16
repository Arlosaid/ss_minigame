import { Vector2D } from '../types/game';

export const Vector2DUtils = {
  distance(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  distanceSquared(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  },

  normalize(v: Vector2D): Vector2D {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  add(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  subtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  multiply(v: Vector2D, scalar: number): Vector2D {
    return { x: v.x * scalar, y: v.y * scalar };
  },

  divide(v: Vector2D, scalar: number): Vector2D {
    if (scalar === 0) return { x: 0, y: 0 };
    return { x: v.x / scalar, y: v.y / scalar };
  },

  limit(v: Vector2D, max: number): Vector2D {
    const lenSq = v.x * v.x + v.y * v.y;
    if (lenSq > max * max) {
      const len = Math.sqrt(lenSq);
      return { x: (v.x / len) * max, y: (v.y / len) * max };
    }
    return v;
  },

  lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }
};

import { Knight } from '../data/gameData';
import { AnimatedSprite } from './SpriteSystem';

export interface PlayerState {
  x: number;
  y: number;
  knight: Knight;
  health: number;
  maxHealth: number;
  exp: number;
  expToNext: number;
  level: number;
}

export class Player {
  // Posición
  x: number;
  y: number;
  
  // Movimiento
  speed: number; // píxeles por segundo
  direction: { x: number; y: number };
  isMoving: boolean;
  
  // Estado del juego
  knight: Knight;
  health: number;
  maxHealth: number;
  exp: number;
  expToNext: number;
  level: number;
  
  // Sprite
  sprite: AnimatedSprite | null;
  
  // Límites del mundo
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;

  constructor(state: PlayerState, worldWidth: number, worldHeight: number) {
    this.x = state.x;
    this.y = state.y;
    this.knight = state.knight;
    this.health = state.health;
    this.maxHealth = state.maxHealth;
    this.exp = state.exp;
    this.expToNext = state.expToNext;
    this.level = state.level;
    
    // Velocidad base en píxeles por segundo - MUY LENTO, obliga a moverse
    this.speed = 120;
    this.direction = { x: 0, y: 0 };
    this.isMoving = false;
    this.sprite = null;
    
    // Límites del mundo (con margen)
    this.minX = 20;
    this.maxX = worldWidth - 20;
    this.minY = 20;
    this.maxY = worldHeight - 20;
  }

  setSprite(sprite: AnimatedSprite): void {
    this.sprite = sprite;
  }

  handleInput(keys: Set<string>): void {
    // Resetear dirección
    this.direction.x = 0;
    this.direction.y = 0;

    // Leer input
    if (keys.has('w') || keys.has('arrowup')) this.direction.y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) this.direction.y += 1;
    if (keys.has('a') || keys.has('arrowleft')) this.direction.x -= 1;
    if (keys.has('d') || keys.has('arrowright')) this.direction.x += 1;

    // Actualizar estado de movimiento
    this.isMoving = this.direction.x !== 0 || this.direction.y !== 0;
  }

  update(deltaTime: number, speedBonus: number = 0): void {
    // Normalizar dirección para mantener velocidad constante en diagonales
    const magnitude = Math.hypot(this.direction.x, this.direction.y);
    
    if (magnitude > 0) {
      // Normalizar vector de dirección
      const normX = this.direction.x / magnitude;
      const normY = this.direction.y / magnitude;
      
      // Aplicar velocidad con bonus de upgrades - más impactante
      const totalSpeed = this.speed + speedBonus * 35;
      
      // Calcular nuevo movimiento usando deltaTime
      const moveX = normX * totalSpeed * deltaTime;
      const moveY = normY * totalSpeed * deltaTime;
      
      // Actualizar posición con límites
      this.x = Math.max(this.minX, Math.min(this.maxX, this.x + moveX));
      this.y = Math.max(this.minY, Math.min(this.maxY, this.y + moveY));
    }

    // Actualizar animación del sprite
    if (this.sprite) {
      if (this.isMoving) {
        this.sprite.setAnimation('walk');
        
        // Flip sprite según dirección horizontal
        if (this.direction.x < 0) {
          this.sprite.flipX = true;
        } else if (this.direction.x > 0) {
          this.sprite.flipX = false;
        }
      } else {
        this.sprite.setAnimation('idle');
      }
    }
  }

  updateSprite(deltaTime: number): void {
    if (this.sprite) {
      this.sprite.update(deltaTime);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.sprite) {
      this.sprite.draw(ctx, this.x, this.y, 64, 64);
    } else {
      // Fallback: círculo
      ctx.fillStyle = this.knight.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  gainExp(amount: number): boolean {
    this.exp += amount;
    
    if (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      // Fórmula exponencial: progresión más lenta (nivel^1.45)
      // Nivel 1->2: 15, 2->3: 19, 3->4: 24, 5->6: 38, 10->11: 103, etc.
      this.expToNext = 10 + Math.floor(3 * Math.pow(this.level, 1.45));
      return true; // Indica que subió de nivel
    }
    
    return false;
  }

  takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0; // Retorna true si murió
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  toState(): PlayerState {
    return {
      x: this.x,
      y: this.y,
      knight: this.knight,
      health: this.health,
      maxHealth: this.maxHealth,
      exp: this.exp,
      expToNext: this.expToNext,
      level: this.level
    };
  }
}

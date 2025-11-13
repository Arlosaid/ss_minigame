/**
 * Sistema de combate con detección de enemigos por rango
 */

interface Position {
  x: number;
  y: number;
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

interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  level: number;
}

interface AttackEffect {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  createdAt: number;
  duration: number; // en milisegundos
}

export class CombatSystem {
  private static attackEffects: AttackEffect[] = [];
  private static nextEffectId = 0;

  /**
   * Calcula la distancia euclidiana entre dos puntos
   * Formula: √((x2-x1)² + (y2-y1)²)
   * OPTIMIZADO: Usar distanciaSq cuando sea posible
   */
  static calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calcula la distancia al cuadrado (más rápido, sin sqrt)
   * Usar para comparaciones de distancia
   */
  static calculateDistanceSq(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return dx * dx + dy * dy;
  }

  /**
   * Encuentra el enemigo más cercano dentro del rango de ataque
   * OPTIMIZADO: Usar distancia al cuadrado para evitar sqrt
   * @param player - Posición del jugador
   * @param enemies - Array de todos los enemigos
   * @param attackRange - Rango máximo de ataque en píxeles
   * @returns El enemigo más cercano o null si no hay ninguno en rango
   */
  static findNearestEnemy(
    player: Position,
    enemies: Enemy[],
    attackRange: number = 300
  ): Enemy | null {
    if (enemies.length === 0) {
      return null;
    }

    let nearestEnemy: Enemy | null = null;
    let minDistanceSq = attackRange * attackRange; // Comparar con distancia al cuadrado

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const distSq = this.calculateDistanceSq(player, enemy);
      
      // Solo consideramos enemigos dentro del rango de ataque
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearestEnemy = enemy;
      }
    }

    return nearestEnemy;
  }

  /**
   * Realiza un ataque al enemigo más cercano
   * @param player - Jugador que ataca
   * @param enemies - Array de enemigos
   * @param damage - Daño a infligir
   * @param attackRange - Rango de ataque
   * @returns El enemigo atacado o null si no había objetivo
   */
  static attack(
    player: Position,
    enemies: Enemy[],
    damage: number,
    attackRange: number = 300
  ): Enemy | null {
    const target = this.findNearestEnemy(player, enemies, attackRange);
    
    if (!target) {
      return null; // No hay enemigo en rango
    }

    // Aplicar daño al enemigo
    target.health -= damage;

    // Crear efecto visual de ataque
    this.createAttackEffect(player, target);

    return target;
  }

  /**
   * Crea un efecto visual de ataque (línea desde jugador a enemigo)
   */
  static createAttackEffect(from: Position, to: Position): void {
    this.attackEffects.push({
      id: this.nextEffectId++,
      startX: from.x,
      startY: from.y,
      endX: to.x,
      endY: to.y,
      createdAt: Date.now(),
      duration: 150 // Duración del efecto en ms
    });
  }

  /**
   * Actualiza y limpia efectos de ataque expirados
   */
  static updateAttackEffects(): void {
    const now = Date.now();
    this.attackEffects = this.attackEffects.filter(
      effect => now - effect.createdAt < effect.duration
    );
  }

  /**
   * Dibuja todos los efectos de ataque activos
   */
  static drawAttackEffects(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();
    
    this.attackEffects.forEach(effect => {
      const age = now - effect.createdAt;
      const progress = age / effect.duration;
      
      // Fade out: opacidad disminuye con el tiempo
      const opacity = 1 - progress;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Destello en el punto de impacto (sin línea)
      const glowRadius = 10 * (1 - progress);
      const gradient = ctx.createRadialGradient(
        effect.endX, effect.endY, 0,
        effect.endX, effect.endY, glowRadius
      );
      gradient.addColorStop(0, 'rgba(255, 215, 0, ' + opacity + ')');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.endX, effect.endY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  /**
   * Dibuja el indicador de rango de ataque (opcional, para debug/UI)
   */
  static drawAttackRange(
    ctx: CanvasRenderingContext2D,
    player: Position,
    attackRange: number,
    opacity: number = 0.15
  ): void {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, attackRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Ataque automático con cooldown
   * @returns true si se realizó un ataque
   */
  static autoAttack(
    player: Position,
    enemies: Enemy[],
    damage: number,
    attackRange: number,
    lastAttackTime: number,
    attackCooldown: number
  ): { attacked: boolean; newLastAttackTime: number; target: Enemy | null } {
    const now = Date.now();
    
    // Verificar cooldown
    if (now - lastAttackTime < attackCooldown) {
      return { attacked: false, newLastAttackTime: lastAttackTime, target: null };
    }

    // Intentar atacar
    const target = this.attack(player, enemies, damage, attackRange);
    
    if (target) {
      return { attacked: true, newLastAttackTime: now, target };
    }

    return { attacked: false, newLastAttackTime: lastAttackTime, target: null };
  }

  /**
   * Limpia todos los efectos
   */
  static clearEffects(): void {
    this.attackEffects = [];
  }
}

export default CombatSystem;

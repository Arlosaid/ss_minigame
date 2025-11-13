import { ActivePower } from '../types/game';
import { POWER_CONFIG } from '../config/gameConfig';

export interface PowerEffect {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  createdAt: number;
  duration: number;
  damage: number;
  type: 'lightning' | 'explosion' | 'beam';
}

interface LightningBolt {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  createdAt: number;
  duration: number;
  damage: number;
}

export class PowerSystem {
  private static powerEffects: PowerEffect[] = [];
  private static lightningBolts: LightningBolt[] = [];
  private static nextEffectId = 0;
  private static nextBoltId = 0;

  /**
   * ⚡ RAYO DE ZEUS ⚡ (Zeus's Lightning)
   * Invoca truenos divinos que caen en la dirección hacia donde mira el jugador
   * 
   * Nivel 1: 1 rayo en dirección (120px), 3s cooldown, 30 daño
   * Nivel 2: 2 rayos en dirección (160px), 2.5s, 35 daño  
   * Nivel 3: 3 rayos en línea (200px), 2s, 40 daño
   * Nivel 4: 4 rayos en abanico (240px), 1.5s, 45 daño
   * Nivel 5: 5 rayos en área amplia (280px), 1s, 50 daño ⚡✨
   */
  static triggerLightningStrike(
    playerX: number,
    playerY: number,
    directionX: number,
    directionY: number,
    level: number,
    enemies: Array<{ id: number; x: number; y: number; health: number }>,
    onDamage: (enemyId: number, damage: number) => void
  ): void {
    const config = this.getLightningConfig(level);
    const baseDistance = POWER_CONFIG.LIGHTNING_DISTANCE_BASE;
    const distanceIncrement = POWER_CONFIG.LIGHTNING_DISTANCE_INCREMENT;
    const distance = baseDistance + (level - 1) * distanceIncrement;
    
    // Normalizar dirección del jugador
    const dirMagnitude = Math.hypot(directionX, directionY);
    const normalizedDirX = dirMagnitude > 0 ? directionX / dirMagnitude : 1; // Default derecha
    const normalizedDirY = dirMagnitude > 0 ? directionY / dirMagnitude : 0;
    
    // Vectores perpendiculares para spread (aumentado para mayor separación)
    const perpX = -normalizedDirY;
    const perpY = normalizedDirX;
    
    // Crear patrón de rayos en la DIRECCIÓN hacia donde mira el jugador
    const strikePositions: Array<{ x: number; y: number }> = [];
    
    if (level === 1) {
      // Nivel 1: 1 rayo en dirección
      strikePositions.push({
        x: playerX + normalizedDirX * distance,
        y: playerY + normalizedDirY * distance
      });
    } else if (level === 2) {
      // Nivel 2: 2 rayos en dirección (línea perpendicular - MÁS SEPARADOS)
      const spread = 50; // Aumentado de 30 a 50
      strikePositions.push(
        { 
          x: playerX + normalizedDirX * distance + perpX * spread, 
          y: playerY + normalizedDirY * distance + perpY * spread 
        },
        { 
          x: playerX + normalizedDirX * distance - perpX * spread, 
          y: playerY + normalizedDirY * distance - perpY * spread 
        }
      );
    } else if (level === 3) {
      // Nivel 3: 3 rayos en línea en dirección (MÁS SEPARADOS)
      const spread = 70; // Aumentado de 50 a 70
      strikePositions.push(
        { 
          x: playerX + normalizedDirX * distance + perpX * spread, 
          y: playerY + normalizedDirY * distance + perpY * spread 
        },
        { 
          x: playerX + normalizedDirX * distance, 
          y: playerY + normalizedDirY * distance 
        },
        { 
          x: playerX + normalizedDirX * distance - perpX * spread, 
          y: playerY + normalizedDirY * distance - perpY * spread 
        }
      );
    } else if (level === 4) {
      // Nivel 4: 4 rayos en abanico en dirección (MÁS SEPARADOS)
      const spread1 = 90; // Aumentado de 60 a 90
      const spread2 = 45; // Aumentado de 30 a 45
      strikePositions.push(
        { 
          x: playerX + normalizedDirX * distance * 0.9 + perpX * spread1, 
          y: playerY + normalizedDirY * distance * 0.9 + perpY * spread1 
        },
        { 
          x: playerX + normalizedDirX * distance + perpX * spread2, 
          y: playerY + normalizedDirY * distance + perpY * spread2 
        },
        { 
          x: playerX + normalizedDirX * distance - perpX * spread2, 
          y: playerY + normalizedDirY * distance - perpY * spread2 
        },
        { 
          x: playerX + normalizedDirX * distance * 0.9 - perpX * spread1, 
          y: playerY + normalizedDirY * distance * 0.9 - perpY * spread1 
        }
      );
    } else {
      // Nivel 5: 5 rayos en área amplia en dirección (MÁS SEPARADOS)
      const spread1 = 100; // Aumentado de 70 a 100
      const spread2 = 60; // Aumentado de 40 a 60
      strikePositions.push(
        { 
          x: playerX + normalizedDirX * distance * 0.85 + perpX * spread1, 
          y: playerY + normalizedDirY * distance * 0.85 + perpY * spread1 
        },
        { 
          x: playerX + normalizedDirX * distance + perpX * spread2, 
          y: playerY + normalizedDirY * distance + perpY * spread2 
        },
        { 
          x: playerX + normalizedDirX * distance * 1.1, 
          y: playerY + normalizedDirY * distance * 1.1 
        },
        { 
          x: playerX + normalizedDirX * distance - perpX * spread2, 
          y: playerY + normalizedDirY * distance - perpY * spread2 
        },
        { 
          x: playerX + normalizedDirX * distance * 0.85 - perpX * spread1, 
          y: playerY + normalizedDirY * distance * 0.85 - perpY * spread1 
        }
      );
    }

    // Crear rayos con delay escalonado (OPTIMIZADO: solo 1 setInterval total)
    const numStrikes = strikePositions.length;
    const delay = POWER_CONFIG.LIGHTNING_DELAY;
    
    // Función para crear un rayo individual
    const createStrike = (pos: { x: number; y: number }) => {
      const currentTime = Date.now();
      
      // Crear rayo visual
      this.lightningBolts.push({
        id: this.nextBoltId++,
        startX: pos.x,
        startY: pos.y - POWER_CONFIG.LIGHTNING_SPAWN_HEIGHT,
        endX: pos.x,
        endY: pos.y,
        createdAt: currentTime,
        duration: POWER_CONFIG.LIGHTNING_DURATION,
        damage: config.damage
      });

      // Efecto de impacto
      this.powerEffects.push({
        id: `lightning_impact_${this.nextEffectId++}`,
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        createdAt: currentTime,
        duration: POWER_CONFIG.LIGHTNING_IMPACT_DURATION,
        damage: config.damage,
        type: 'lightning'
      });

      // Daño en área (optimizado con distancia al cuadrado)
      const radiusSq = POWER_CONFIG.LIGHTNING_DAMAGE_RADIUS * POWER_CONFIG.LIGHTNING_DAMAGE_RADIUS;
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const dx = enemy.x - pos.x;
        const dy = enemy.y - pos.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= radiusSq) {
          onDamage(enemy.id, config.damage);
        }
      }
    };
    
    // Crear primer rayo inmediatamente
    createStrike(strikePositions[0]);
    
    // Si hay más rayos, usar UN SOLO setInterval que se autolimpia
    if (numStrikes > 1) {
      let currentIndex = 1;
      const intervalId = setInterval(() => {
        if (currentIndex >= numStrikes) {
          clearInterval(intervalId);
          return;
        }
        createStrike(strikePositions[currentIndex]);
        currentIndex++;
      }, delay);
    }
  }

  /**
   * Obtener configuración del rayo según nivel
   */
  private static getLightningConfig(level: number): { count: number; damage: number; cooldown: number } {
    const configs = [
      { count: 1, damage: 30, cooldown: 3000 }, // Nivel 1
      { count: 2, damage: 35, cooldown: 2500 }, // Nivel 2
      { count: 3, damage: 40, cooldown: 2000 }, // Nivel 3
      { count: 4, damage: 45, cooldown: 1500 }, // Nivel 4
      { count: 5, damage: 50, cooldown: 1000 }  // Nivel 5
    ];
    
    return configs[Math.min(level, 5) - 1] || configs[0]!;
  }

  /**
   * Obtener cooldown del rayo según nivel
   */
  static getLightningCooldown(level: number): number {
    return this.getLightningConfig(level).cooldown;
  }

  /**
   * Actualizar poderes activos del jugador
   */
  static updateActivePowers(
    powers: ActivePower[],
    playerX: number,
    playerY: number,
    directionX: number,
    directionY: number,
    enemies: Array<{ id: number; x: number; y: number; health: number }>,
    onDamage: (enemyId: number, damage: number) => void
  ): ActivePower[] {
    const now = Date.now();
    const updatedPowers: ActivePower[] = [];
    
    for (let i = 0; i < powers.length; i++) {
      const power = powers[i];
      
      // Verificar si el poder debe activarse
      if (now - power.lastTrigger >= power.cooldown) {
        // Activar poder según tipo
        if (power.id === 'lightning_strike') {
          this.triggerLightningStrike(playerX, playerY, directionX, directionY, power.level, enemies, onDamage);
          updatedPowers.push({ ...power, lastTrigger: now, cooldown: this.getLightningCooldown(power.level) });
        } else {
          updatedPowers.push(power);
        }
      } else {
        updatedPowers.push(power);
      }
    }
    
    return updatedPowers;
  }

  /**
   * Limpiar efectos expirados
   */
  static updateEffects(): void {
    const now = Date.now();
    
    // Limpiar efectos de poder
    this.powerEffects = this.powerEffects.filter(effect => 
      now - effect.createdAt < effect.duration
    );

    // Limpiar rayos
    this.lightningBolts = this.lightningBolts.filter(bolt => 
      now - bolt.createdAt < bolt.duration
    );
  }

  /**
   * ⚡✨ Dibujar rayos ÉPICOS en el canvas ✨⚡
   * Efectos visuales mejorados: múltiples capas, brillos, colores dorados
   */
  static drawLightning(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();
    
    this.lightningBolts.forEach(bolt => {
      const age = now - bolt.createdAt;
      const progress = age / bolt.duration;
      const opacity = 1 - progress;

      ctx.save();
      ctx.globalAlpha = opacity;
      
      // === CAPA 1: Aura dorada exterior (Athena's divine glow) ===
      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.6})`;
      ctx.lineWidth = 18; // Reducido de 20 a 18
      ctx.shadowBlur = 15; // Reducido de 30 para mejor rendimiento
      ctx.shadowColor = '#FFD700';
      
      const segments = 5; // Reducido de 6 a 5 para mejor rendimiento
      ctx.beginPath();
      ctx.moveTo(bolt.startX, bolt.startY);
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = bolt.startX + (bolt.endX - bolt.startX) * t;
        const y = bolt.startY + (bolt.endY - bolt.startY) * t;
        const offsetX = (Math.random() - 0.5) * 30 * (1 - progress);
        const offsetY = (Math.random() - 0.5) * 15 * (1 - progress);
        ctx.lineTo(x + offsetX, y + offsetY);
      }
      ctx.stroke();
      
      // === CAPA 2: Rayo azul eléctrico (Electric blue) ===
      ctx.strokeStyle = `rgba(100, 180, 255, ${opacity * 0.8})`;
      ctx.lineWidth = 12;
      ctx.shadowBlur = 15; // Reducido de 30 para mejor rendimiento
      ctx.shadowColor = '#64B4FF';
      
      ctx.beginPath();
      ctx.moveTo(bolt.startX, bolt.startY);
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = bolt.startX + (bolt.endX - bolt.startX) * t;
        const y = bolt.startY + (bolt.endY - bolt.startY) * t;
        const offsetX = (Math.random() - 0.5) * 20 * (1 - progress);
        const offsetY = (Math.random() - 0.5) * 10 * (1 - progress);
        ctx.lineTo(x + offsetX, y + offsetY);
      }
      ctx.stroke();
      
      // === CAPA 3: Núcleo blanco brillante ===
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.lineWidth = 5;
      ctx.shadowBlur = 10; // Reducido de 20 para mejor rendimiento
      ctx.shadowColor = '#FFFFFF';
      
      ctx.beginPath();
      ctx.moveTo(bolt.startX, bolt.startY);
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = bolt.startX + (bolt.endX - bolt.startX) * t;
        const y = bolt.startY + (bolt.endY - bolt.startY) * t;
        const offsetX = (Math.random() - 0.5) * 12 * (1 - progress);
        const offsetY = (Math.random() - 0.5) * 6 * (1 - progress);
        ctx.lineTo(x + offsetX, y + offsetY);
      }
      ctx.stroke();
      
      // === RAMIFICACIONES ELÉCTRICAS (Lightning branches) ===
      if (progress < 0.5) {
        const numBranches = 2; // Reducido de 3 a 2 para mejor rendimiento
        for (let b = 0; b < numBranches; b++) {
          const branchT = 0.2 + (b / numBranches) * 0.6;
          const branchX = bolt.startX + (bolt.endX - bolt.startX) * branchT;
          const branchY = bolt.startY + (bolt.endY - bolt.startY) * branchT;
          
          const branchLength = 40;
          const branchAngle = (Math.random() - 0.5) * Math.PI;
          const branchEndX = branchX + Math.cos(branchAngle) * branchLength;
          const branchEndY = branchY + Math.sin(branchAngle) * branchLength;
          
          ctx.globalAlpha = opacity * (1 - progress * 2) * 0.6;
          ctx.strokeStyle = `rgba(150, 200, 255, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          
          ctx.beginPath();
          ctx.moveTo(branchX, branchY);
          ctx.lineTo(branchEndX, branchEndY);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    });
  }

  /**
   * ✨ Dibujar efectos de impacto ÉPICOS ✨
   * Explosiones doradas divinas al tocar el suelo
   */
  static drawPowerEffects(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();
    
    this.powerEffects.forEach(effect => {
      const age = now - effect.createdAt;
      const progress = age / effect.duration;

      if (effect.type === 'lightning') {
        ctx.save();
        
        const opacity = 1 - progress;
        const scale = 0.3 + progress * 2;
        const size = 60 * scale;
        
        // === ONDA DE CHOQUE DORADA ===
        ctx.globalAlpha = opacity * 0.5;
        ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 10; // Reducido de 20 para mejor rendimiento
        ctx.shadowColor = '#FFD700';
        
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        // === EXPLOSIÓN AZUL ELÉCTRICA (SIMPLIFICADA SIN GRADIENTE) ===
        ctx.globalAlpha = opacity * 0.7;
        
        // Anillo exterior azul claro
        ctx.fillStyle = `rgba(150, 220, 255, ${opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Anillo medio azul
        ctx.fillStyle = `rgba(100, 180, 255, ${opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // === NÚCLEO BLANCO BRILLANTE ===
        ctx.globalAlpha = opacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowBlur = 12; // Reducido de 25 para mejor rendimiento
        ctx.shadowColor = '#FFFFFF';
        
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // === CHISPAS ELÉCTRICAS GIRATORIAS ===
        if (progress < 0.6) {
          for (let i = 0; i < 3; i++) { // Reducido de 4 a 3 para mejor rendimiento
            const angle = (i / 8) * Math.PI * 2 + age / 30;
            const sparkDist = size * 1.2;
            const sparkX = effect.x + Math.cos(angle) * sparkDist;
            const sparkY = effect.y + Math.sin(angle) * sparkDist;
            
            ctx.globalAlpha = opacity * (1 - progress * 1.5);
            
            // Chispa dorada
            ctx.fillStyle = `rgba(255, 230, 100, ${opacity})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#FFD700';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Chispa azul
            ctx.fillStyle = `rgba(150, 220, 255, ${opacity})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#64B4FF';
            ctx.beginPath();
            ctx.arc(sparkX + 5, sparkY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // === RAYOS SECUNDARIOS DEL IMPACTO ===
        if (progress < 0.4) {
          const numRays = 4; // Reducido de 6 a 4 para mejor rendimiento
          for (let i = 0; i < numRays; i++) {
            const rayAngle = (i / numRays) * Math.PI * 2;
            const rayLength = size * 0.8 * (1 - progress * 2.5);
            const rayEndX = effect.x + Math.cos(rayAngle) * rayLength;
            const rayEndY = effect.y + Math.sin(rayAngle) * rayLength;
            
            ctx.globalAlpha = opacity * (1 - progress * 2.5);
            ctx.strokeStyle = `rgba(255, 240, 150, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
            
            ctx.beginPath();
            ctx.moveTo(effect.x, effect.y);
            ctx.lineTo(rayEndX, rayEndY);
            ctx.stroke();
          }
        }
        
        ctx.restore();
      }
    });
  }

  /**
   * Obtener efectos actuales (para debugging)
   */
  static getActiveEffects(): { effects: PowerEffect[]; bolts: LightningBolt[] } {
    return {
      effects: [...this.powerEffects],
      bolts: [...this.lightningBolts]
    };
  }

  /**
   * Limpiar todos los efectos (útil para reset)
   */
  static clearAll(): void {
    this.powerEffects = [];
    this.lightningBolts = [];
  }
}

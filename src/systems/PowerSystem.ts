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
  type: 'lightning' | 'explosion' | 'beam' | 'shield' | 'golden_arrow';
}

export interface GoldenArrow {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  createdAt: number;
  lifetime: number;
  targetId?: number;
}

export interface ActiveShield {
  id: number;
  playerId: string;
  absorption: number;
  maxAbsorption: number;
  createdAt: number;
  duration: number;
  rotation: number;
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
  private static goldenArrows: GoldenArrow[] = [];
  private static activeShields: ActiveShield[] = [];
  private static nextEffectId = 0;
  private static nextBoltId = 0;
  private static nextArrowId = 0;
  private static nextShieldId = 0;

  /**
   * ⚡ RAYO DE ZEUS ⚡ (Zeus's Lightning)
   * Invoca truenos divinos que caen en círculo alrededor del jugador,
   * priorizando inteligentemente las zonas donde hay más enemigos
   * 
   * Nivel 1: 1 rayo cerca del jugador, 3s cooldown, 25 daño
   * Nivel 2: 2 rayos alrededor, 2.5s, 30 daño  
   * Nivel 3: 3 rayos en círculo, 2s, 35 daño
   * Nivel 4: 4 rayos en círculo amplio, 1.5s, 40 daño
   * Nivel 5: 5 rayos cubriendo área, 1s, 45 daño ⚡✨
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
    
    // 🎯 ANÁLISIS INTELIGENTE DE SECTORES (sin perseguir enemigos)
    const numStrikes = config.count;
    const numSectors = 8; // Dividir el círculo en 8 sectores
    const searchRadius = distance * 1.5;
    const searchRadiusSq = searchRadius * searchRadius;
    
    // Contar enemigos por sector alrededor del jugador
    const sectorCounts = new Array(numSectors).fill(0);
    
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const distSq = dx * dx + dy * dy;
      
      // Solo considerar enemigos dentro del rango
      if (distSq <= searchRadiusSq) {
        // Calcular en qué sector está el enemigo (0-7)
        const angle = Math.atan2(dy, dx);
        const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
        const sector = Math.floor((normalizedAngle / (Math.PI * 2)) * numSectors) % numSectors;
        sectorCounts[sector]++;
      }
    }
    
    // Crear lista de sectores ordenados por densidad de enemigos
    const sectorPriorities = sectorCounts
      .map((count, index) => ({ sector: index, count }))
      .sort((a, b) => b.count - a.count); // Mayor densidad primero
    
    // Generar posiciones de rayos en círculo, priorizando sectores con enemigos
    const strikePositions: Array<{ x: number; y: number }> = [];
    
    if (numStrikes === 1) {
      // Nivel 1: Un rayo en el sector con más enemigos (o frente al jugador)
      const targetSector = sectorPriorities[0].count > 0 
        ? sectorPriorities[0].sector 
        : Math.floor(Math.random() * numSectors);
      
      const angle = (targetSector / numSectors) * Math.PI * 2;
      strikePositions.push({
        x: playerX + Math.cos(angle) * distance,
        y: playerY + Math.sin(angle) * distance
      });
    } else if (numStrikes === 2) {
      // Nivel 2: Dos rayos en los sectores con más enemigos
      for (let i = 0; i < 2; i++) {
        const targetSector = sectorPriorities[i].count > 0
          ? sectorPriorities[i].sector
          : (i * 4) % numSectors; // Fallback: opuestos
        
        const angle = (targetSector / numSectors) * Math.PI * 2;
        const variation = (Math.random() - 0.5) * 0.3; // Pequeña variación
        strikePositions.push({
          x: playerX + Math.cos(angle + variation) * distance,
          y: playerY + Math.sin(angle + variation) * distance
        });
      }
    } else if (numStrikes === 3) {
      // Nivel 3: Tres rayos en los sectores con más enemigos
      for (let i = 0; i < 3; i++) {
        const targetSector = sectorPriorities[i].count > 0
          ? sectorPriorities[i].sector
          : (i * Math.floor(numSectors / 3)) % numSectors; // Fallback: distribuidos
        
        const angle = (targetSector / numSectors) * Math.PI * 2;
        const variation = (Math.random() - 0.5) * 0.3;
        strikePositions.push({
          x: playerX + Math.cos(angle + variation) * distance,
          y: playerY + Math.sin(angle + variation) * distance
        });
      }
    } else if (numStrikes === 4) {
      // Nivel 4: Cuatro rayos en los sectores con más densidad
      for (let i = 0; i < 4; i++) {
        const targetSector = sectorPriorities[i].count > 0
          ? sectorPriorities[i].sector
          : (i * 2) % numSectors; // Fallback: cada 90 grados
        
        const angle = (targetSector / numSectors) * Math.PI * 2;
        const variation = (Math.random() - 0.5) * 0.4;
        strikePositions.push({
          x: playerX + Math.cos(angle + variation) * distance,
          y: playerY + Math.sin(angle + variation) * distance
        });
      }
    } else {
      // Nivel 5: Cinco rayos cubriendo bien el área
      for (let i = 0; i < 5; i++) {
        const targetSector = sectorPriorities[i].count > 0
          ? sectorPriorities[i].sector
          : (i * Math.floor(numSectors / 5)) % numSectors; // Fallback: distribuidos
        
        const angle = (targetSector / numSectors) * Math.PI * 2;
        const variation = (Math.random() - 0.5) * 0.4;
        const distVariation = distance + (Math.random() - 0.5) * 40; // Variación de distancia
        strikePositions.push({
          x: playerX + Math.cos(angle + variation) * distVariation,
          y: playerY + Math.sin(angle + variation) * distVariation
        });
      }
    }

    // Crear rayos con delay escalonado (OPTIMIZADO: solo 1 setInterval total)
    const totalStrikes = strikePositions.length;
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
    if (totalStrikes > 1) {
      let currentIndex = 1;
      const intervalId = setInterval(() => {
        if (currentIndex >= totalStrikes) {
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
      { count: 1, damage: 25, cooldown: 3000 }, // Nivel 1 - reducido de 30
      { count: 2, damage: 30, cooldown: 2500 }, // Nivel 2 - reducido de 35
      { count: 3, damage: 35, cooldown: 2000 }, // Nivel 3 - reducido de 40
      { count: 4, damage: 40, cooldown: 1500 }, // Nivel 4 - reducido de 45
      { count: 5, damage: 45, cooldown: 1000 }  // Nivel 5 - reducido de 50
    ];
    
    return configs[Math.min(level, 5) - 1] || configs[0]!;
  }

  /**
   * 🏹 FLECHA DE ORO 🏹 (Golden Arrow)
   * Dispara flechas doradas que buscan automáticamente al enemigo más cercano
   * 
   * Nivel 1: 1 flecha, 40 daño, 4s cooldown
   * Nivel 2: 2 flechas, 55 daño, 3.5s cooldown
   * Nivel 3: 3 flechas, 70 daño, 3s cooldown
   * Nivel 4: 4 flechas, 85 daño, 2.5s cooldown
   * Nivel 5: 5 flechas, 100 daño, 2s cooldown 🏹✨
   */
  static triggerGoldenArrow(
    playerX: number,
    playerY: number,
    level: number,
    enemies: Array<{ id: number; x: number; y: number; health: number }>,
    onDamage: (enemyId: number, damage: number) => void
  ): void {
    const config = this.getGoldenArrowConfig(level);
    const arrowCount = config.count;
    const damage = config.damage;
    
    // Encontrar enemigos cercanos
    const nearbyEnemies = enemies
      .map(enemy => ({
        ...enemy,
        distance: Math.hypot(enemy.x - playerX, enemy.y - playerY)
      }))
      .filter(enemy => enemy.distance <= POWER_CONFIG.GOLDEN_ARROW_RANGE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, arrowCount);
    
    // Si no hay enemigos, disparar en direcciones cardinales
    if (nearbyEnemies.length === 0) {
      const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];
      
      for (let i = 0; i < arrowCount; i++) {
        const angle = angles[i % angles.length]!;
        const speed = POWER_CONFIG.GOLDEN_ARROW_SPEED;
        
        this.goldenArrows.push({
          id: this.nextArrowId++,
          x: playerX,
          y: playerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage,
          createdAt: Date.now(),
          lifetime: POWER_CONFIG.GOLDEN_ARROW_LIFETIME
        });
      }
      return;
    }
    
    // Disparar flechas hacia enemigos cercanos
    nearbyEnemies.forEach(enemy => {
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const distance = Math.hypot(dx, dy);
      const speed = POWER_CONFIG.GOLDEN_ARROW_SPEED;
      
      this.goldenArrows.push({
        id: this.nextArrowId++,
        x: playerX,
        y: playerY,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        damage,
        createdAt: Date.now(),
        lifetime: POWER_CONFIG.GOLDEN_ARROW_LIFETIME,
        targetId: enemy.id
      });
    });
  }

  /**
   * Obtener configuración de la Flecha de Oro según nivel
   */
  private static getGoldenArrowConfig(level: number): { count: number; damage: number; cooldown: number } {
    const baseDamage = POWER_CONFIG.GOLDEN_ARROW_BASE_DAMAGE;
    const damageIncrement = POWER_CONFIG.GOLDEN_ARROW_DAMAGE_INCREMENT;
    
    const configs = [
      { count: 1, damage: baseDamage, cooldown: 4000 },                          // Nivel 1
      { count: 2, damage: baseDamage + damageIncrement, cooldown: 3500 },        // Nivel 2
      { count: 3, damage: baseDamage + damageIncrement * 2, cooldown: 3000 },    // Nivel 3
      { count: 4, damage: baseDamage + damageIncrement * 3, cooldown: 2500 },    // Nivel 4
      { count: 5, damage: baseDamage + damageIncrement * 4, cooldown: 2000 }     // Nivel 5
    ];
    
    return configs[Math.min(level, 5) - 1] || configs[0]!;
  }

  /**
   * 🛡️ ESCUDO DE ATENA 🛡️ (Athena's Shield)
   * Crea un escudo protector que absorbe daño y lo refleja a los enemigos cercanos
   * 
   * Nivel 1: 30 absorción, 2s duración, 5s cooldown
   * Nivel 2: 45 absorción, 2.5s duración, 4.5s cooldown
   * Nivel 3: 60 absorción, 3s duración, 4s cooldown
   * Nivel 4: 75 absorción, 3.5s duración, 3.5s cooldown
   * Nivel 5: 90 absorción, 4s duración, 3s cooldown 🛡️✨
   */
  static triggerAthenaShield(
    playerX: number,
    playerY: number,
    playerId: string,
    level: number
  ): void {
    const config = this.getShieldConfig(level);
    
    // Remover escudo anterior si existe
    this.activeShields = this.activeShields.filter(shield => shield.playerId !== playerId);
    
    // Crear nuevo escudo
    this.activeShields.push({
      id: this.nextShieldId++,
      playerId,
      absorption: config.absorption,
      maxAbsorption: config.absorption,
      createdAt: Date.now(),
      duration: config.duration,
      rotation: 0
    });
  }

  /**
   * Obtener configuración del Escudo de Atena según nivel
   */
  private static getShieldConfig(level: number): { absorption: number; duration: number; cooldown: number } {
    const baseAbsorption = POWER_CONFIG.SHIELD_BASE_ABSORPTION;
    const absorptionIncrement = POWER_CONFIG.SHIELD_ABSORPTION_INCREMENT;
    const baseDuration = POWER_CONFIG.SHIELD_BASE_DURATION;
    const durationIncrement = POWER_CONFIG.SHIELD_DURATION_INCREMENT;
    
    const configs = [
      { absorption: baseAbsorption, duration: baseDuration, cooldown: 5000 },                                          // Nivel 1
      { absorption: baseAbsorption + absorptionIncrement, duration: baseDuration + durationIncrement, cooldown: 4500 },        // Nivel 2
      { absorption: baseAbsorption + absorptionIncrement * 2, duration: baseDuration + durationIncrement * 2, cooldown: 4000 },    // Nivel 3
      { absorption: baseAbsorption + absorptionIncrement * 3, duration: baseDuration + durationIncrement * 3, cooldown: 3500 },    // Nivel 4
      { absorption: baseAbsorption + absorptionIncrement * 4, duration: baseDuration + durationIncrement * 4, cooldown: 3000 }     // Nivel 5
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
   * Obtener cooldown de la Flecha de Oro según nivel
   */
  static getGoldenArrowCooldown(level: number): number {
    return this.getGoldenArrowConfig(level).cooldown;
  }

  /**
   * Obtener cooldown del Escudo de Atena según nivel
   */
  static getAthenaShieldCooldown(level: number): number {
    return this.getShieldConfig(level).cooldown;
  }

  /**
   * Verificar si el jugador tiene escudo activo
   */
  static hasActiveShield(playerId: string): boolean {
    return this.activeShields.some(shield => shield.playerId === playerId);
  }

  /**
   * Aplicar daño al escudo y devolver el daño restante
   */
  static applyDamageToShield(playerId: string, damage: number): number {
    const shield = this.activeShields.find(s => s.playerId === playerId);
    if (!shield) return damage;
    
    const absorbedDamage = Math.min(damage, shield.absorption);
    shield.absorption -= absorbedDamage;
    
    // Si el escudo se agotó, eliminarlo
    if (shield.absorption <= 0) {
      this.activeShields = this.activeShields.filter(s => s.id !== shield.id);
    }
    
    return damage - absorbedDamage;
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
    onDamage: (enemyId: number, damage: number) => void,
    playerId: string = 'player'
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
        } else if (power.id === 'golden_arrow') {
          this.triggerGoldenArrow(playerX, playerY, power.level, enemies, onDamage);
          updatedPowers.push({ ...power, lastTrigger: now, cooldown: this.getGoldenArrowCooldown(power.level) });
        } else if (power.id === 'athena_shield') {
          this.triggerAthenaShield(playerX, playerY, playerId, power.level);
          updatedPowers.push({ ...power, lastTrigger: now, cooldown: this.getAthenaShieldCooldown(power.level) });
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
   * Actualizar flechas doradas (movimiento y colisiones)
   */
  static updateGoldenArrows(
    deltaTime: number,
    enemies: Array<{ id: number; x: number; y: number; health: number }>,
    onDamage: (enemyId: number, damage: number) => void
  ): void {
    const now = Date.now();
    const arrowsToRemove: number[] = [];
    
    for (let i = 0; i < this.goldenArrows.length; i++) {
      const arrow = this.goldenArrows[i];
      
      // Verificar si la flecha expiró
      if (now - arrow.createdAt >= arrow.lifetime) {
        arrowsToRemove.push(arrow.id);
        continue;
      }
      
      // Actualizar posición
      arrow.x += arrow.vx * deltaTime;
      arrow.y += arrow.vy * deltaTime;
      
      // Verificar colisiones con enemigos
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const dx = enemy.x - arrow.x;
        const dy = enemy.y - arrow.y;
        const distSq = dx * dx + dy * dy;
        const hitRadiusSq = 30 * 30; // Radio de colisión
        
        if (distSq <= hitRadiusSq) {
          onDamage(enemy.id, arrow.damage);
          arrowsToRemove.push(arrow.id);
          
          // Crear efecto de impacto
          this.powerEffects.push({
            id: `arrow_impact_${this.nextEffectId++}`,
            x: arrow.x,
            y: arrow.y,
            targetX: arrow.x,
            targetY: arrow.y,
            createdAt: now,
            duration: 300,
            damage: arrow.damage,
            type: 'golden_arrow'
          });
          break;
        }
      }
    }
    
    // Remover flechas marcadas
    if (arrowsToRemove.length > 0) {
      this.goldenArrows = this.goldenArrows.filter(arrow => !arrowsToRemove.includes(arrow.id));
    }
  }

  /**
   * Actualizar escudos activos
   */
  static updateShields(deltaTime: number): void {
    const now = Date.now();
    
    // Actualizar rotación y verificar duración
    this.activeShields = this.activeShields.filter(shield => {
      const age = now - shield.createdAt;
      if (age >= shield.duration) return false;
      
      // Actualizar rotación
      shield.rotation += POWER_CONFIG.SHIELD_ROTATION_SPEED * deltaTime;
      return true;
    });
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
      } else if (effect.type === 'golden_arrow') {
        // Efecto de impacto de la flecha dorada
        ctx.save();
        
        const opacity = 1 - progress;
        const scale = 0.5 + progress * 1.5;
        const size = 40 * scale;
        
        ctx.globalAlpha = opacity * 0.7;
        
        // Resplandor dorado
        ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.6})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo brillante
        ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Rayos dorados
        if (progress < 0.5) {
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const rayLength = size * 1.2;
            const rayEndX = effect.x + Math.cos(angle) * rayLength;
            const rayEndY = effect.y + Math.sin(angle) * rayLength;
            
            ctx.globalAlpha = opacity * (1 - progress * 2);
            ctx.strokeStyle = `rgba(255, 220, 100, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            
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
   * 🏹✨ Dibujar Flechas Doradas ÉPICAS ✨🏹
   * Flechas brillantes que buscan enemigos
   */
  static drawGoldenArrows(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();
    
    this.goldenArrows.forEach(arrow => {
      const age = now - arrow.createdAt;
      const progress = age / arrow.lifetime;
      const opacity = 1 - progress * 0.3; // Mantener alta opacidad
      
      ctx.save();
      
      // Calcular ángulo de la flecha
      const angle = Math.atan2(arrow.vy, arrow.vx);
      
      // Trail dorado (estela)
      const trailLength = POWER_CONFIG.GOLDEN_ARROW_TRAIL_LENGTH;
      for (let i = 0; i < trailLength; i++) {
        const trailProgress = i / trailLength;
        const trailX = arrow.x - arrow.vx * trailProgress * 0.05;
        const trailY = arrow.y - arrow.vy * trailProgress * 0.05;
        const trailOpacity = opacity * (1 - trailProgress) * 0.5;
        const trailSize = POWER_CONFIG.GOLDEN_ARROW_SIZE * (1 - trailProgress * 0.5);
        
        ctx.globalAlpha = trailOpacity;
        ctx.fillStyle = `rgba(255, 215, 0, ${trailOpacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        
        ctx.beginPath();
        ctx.arc(trailX, trailY, trailSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Flecha principal
      ctx.globalAlpha = opacity;
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(angle);
      
      // Aura dorada
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#FFD700';
      ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.8, POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Cuerpo de la flecha (dorado brillante)
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(255, 230, 100, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.5, 0);
      ctx.lineTo(-POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.3, -POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.2);
      ctx.lineTo(-POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.5, 0);
      ctx.lineTo(-POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.3, POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.2);
      ctx.closePath();
      ctx.fill();
      
      // Punta brillante
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.5, 0, POWER_CONFIG.GOLDEN_ARROW_SIZE * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  /**
   * 🛡️✨ Dibujar Escudos de Atena ÉPICOS ✨🛡️
   * Escudos protectores brillantes con símbolos divinos
   */
  static drawShields(ctx: CanvasRenderingContext2D, playerX: number, playerY: number): void {
    const now = Date.now();
    
    this.activeShields.forEach(shield => {
      const age = now - shield.createdAt;
      const progress = age / shield.duration;
      const opacity = (1 - progress * 0.3) * (shield.absorption / shield.maxAbsorption); // Opacidad basada en absorción restante
      
      ctx.save();
      ctx.translate(playerX, playerY);
      
      // Rotación del escudo
      const rotation = shield.rotation;
      
      // Aura exterior dorada pulsante
      const pulseScale = 1 + Math.sin(age / 100) * 0.1;
      ctx.globalAlpha = opacity * 0.3;
      ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.3})`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, POWER_CONFIG.SHIELD_RADIUS * pulseScale * 1.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Escudo principal (azul divino)
      ctx.globalAlpha = opacity * 0.6;
      ctx.fillStyle = `rgba(100, 180, 255, ${opacity * 0.4})`;
      ctx.strokeStyle = `rgba(150, 220, 255, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#64B4FF';
      ctx.beginPath();
      ctx.arc(0, 0, POWER_CONFIG.SHIELD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Bordes dorados del escudo
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, POWER_CONFIG.SHIELD_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      
      // Símbolos divinos giratorios (8 puntos)
      for (let i = 0; i < 8; i++) {
        const symbolAngle = rotation + (i / 8) * Math.PI * 2;
        const symbolX = Math.cos(symbolAngle) * POWER_CONFIG.SHIELD_RADIUS * 0.7;
        const symbolY = Math.sin(symbolAngle) * POWER_CONFIG.SHIELD_RADIUS * 0.7;
        
        ctx.globalAlpha = opacity * 0.8;
        ctx.fillStyle = `rgba(255, 230, 100, ${opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFD700';
        
        ctx.beginPath();
        ctx.arc(symbolX, symbolY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Símbolo central de Atena (cruz dorada)
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFD700';
      
      const crossSize = 15;
      ctx.beginPath();
      ctx.moveTo(-crossSize, 0);
      ctx.lineTo(crossSize, 0);
      ctx.moveTo(0, -crossSize);
      ctx.lineTo(0, crossSize);
      ctx.stroke();
      
      // Núcleo brillante central
      ctx.globalAlpha = opacity;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  /**
   * Obtener efectos actuales (para debugging)
   */
  static getActiveEffects(): { effects: PowerEffect[]; bolts: LightningBolt[]; arrows: GoldenArrow[]; shields: ActiveShield[] } {
    return {
      effects: [...this.powerEffects],
      bolts: [...this.lightningBolts],
      arrows: [...this.goldenArrows],
      shields: [...this.activeShields]
    };
  }

  /**
   * Limpiar todos los efectos (útil para reset)
   */
  static clearAll(): void {
    this.powerEffects = [];
    this.lightningBolts = [];
    this.goldenArrows = [];
    this.activeShields = [];
  }
}

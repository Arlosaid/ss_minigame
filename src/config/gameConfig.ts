/**
 * ⚙️ CONFIGURACIÓN CENTRALIZADA DEL JUEGO
 * 
 * Todos los valores importantes del juego están aquí para facilitar
 * el balanceo y testing de diferentes configuraciones.
 */

// ============================================
// 🎮 CONFIGURACIÓN DEL JUGADOR
// ============================================
export const PLAYER_CONFIG = {
  // Movimiento
  BASE_SPEED: 140, // Píxeles por segundo (velocidad base)
  SPEED_UPGRADE_MULTIPLIER: 0.5, // Multiplicador por nivel de upgrade de velocidad
  
  // Combate
  BASE_DAMAGE: 18, // Daño base del jugador
  DAMAGE_UPGRADE_BONUS: 5, // Daño adicional por nivel de upgrade
  
  // Disparo
  BASE_FIRE_RATE: 500, // Milisegundos entre disparos
  FIRE_RATE_REDUCTION_PER_LEVEL: 50, // Reducción de cooldown por nivel de upgrade
  MIN_FIRE_RATE: 100, // Cooldown mínimo (ms)
  ATTACK_RANGE: 200, // Rango de detección de enemigos para disparo automático
  
  // Proyectiles
  PROJECTILE_SPEED: 2.0, // Velocidad de los proyectiles del jugador
  PROJECTILE_SPEED_MULTIPLIER: 5, // Multiplicador para visualización (2.0 * 5 = 10 px/frame)
  MAX_PROJECTILES: 30, // Límite de proyectiles simultáneos
  
  // Vida
  STARTING_HEALTH: 100,
  STARTING_MAX_HEALTH: 100,
  MAX_HEALTH_UPGRADE_BONUS: 75, // HP adicional por nivel de upgrade de vida
  
  // Progresión
  STARTING_LEVEL: 1,
  BASE_COSMOS_REQUIRED: 10, // Cosmos requerido para nivel 1
  COSMOS_INCREMENT_PER_LEVEL: 5, // Incremento de cosmos requerido por nivel
} as const;

// ============================================
// 👾 CONFIGURACIÓN DE ENEMIGOS
// ============================================
export const ENEMY_CONFIG = {
  // Spawn
  BASE_SPAWN_INTERVAL: 2500, // Milisegundos entre spawns (oleada 1)
  SPAWN_INTERVAL_REDUCTION_PER_WAVE: 80, // Reducción del intervalo por oleada
  MIN_SPAWN_INTERVAL: 1000, // Intervalo mínimo (ms)
  SPAWN_DISTANCE_MIN: 350, // Distancia mínima de spawn desde el jugador
  SPAWN_DISTANCE_MAX: 500, // Distancia máxima de spawn desde el jugador
  WARNING_DURATION: 800, // Duración de la advertencia de spawn (ms)
  
  // Límites
  BASE_MAX_ACTIVE_ENEMIES: 8, // Máximo de enemigos activos en oleada 1
  MAX_ACTIVE_ENEMIES_INCREMENT: 1.5, // Incremento por oleada
  MAX_ACTIVE_ENEMIES_CAP: 12, // Máximo absoluto de enemigos (reducido de 15)
  MAX_WARNINGS: 8, // Máximo de advertencias de spawn simultáneas (reducido de 10)
  CLEANUP_DISTANCE: 1200, // Distancia para limpiar enemigos lejanos
  
  // Escalado de dificultad
  HP_MULTIPLIER_PER_WAVE: 0.12, // +12% HP por oleada
  SPEED_MULTIPLIER_PER_WAVE: 0.05, // +5% velocidad por oleada
  
  // Tipos de enemigos
  NORMAL: {
    BASE_HP: 15,
    HP_PER_WAVE: 3,
    SPEED: 0.85,
    COSMOS_MIN: 2,
    COSMOS_MAX: 4,
  },
  FAST: {
    BASE_HP: 10,
    HP_PER_WAVE: 2,
    SPEED: 1.6,
    COSMOS_MIN: 3,
    COSMOS_MAX: 5,
    UNLOCK_WAVE: 2, // Se desbloquea en oleada 2
  },
  TANK: {
    BASE_HP: 30,
    HP_PER_WAVE: 5,
    SPEED: 0.45,
    COSMOS_MIN: 5,
    COSMOS_MAX: 8,
    UNLOCK_WAVE: 3, // Se desbloquea en oleada 3
  },
  
  // Comportamiento
  BASE_MOVEMENT_SPEED: 120, // Píxeles por segundo
  COLLISION_RADIUS: 30, // Radio de colisión con jugador
  PROJECTILE_HIT_RADIUS: 30, // Radio de colisión con proyectiles
  DAMAGE_TO_PLAYER: 5, // Daño al tocar al jugador
} as const;

// ============================================
// 👑 CONFIGURACIÓN DE BOSS
// ============================================
export const BOSS_CONFIG = {
  // Aparición
  SPAWN_TIME: 120, // Segundos después de iniciar el stage (2 minutos)
  
  // Estadísticas
  BASE_HP: 500,
  HP_INCREMENT_PER_HOUSE: 200, // HP adicional por cada casa
  COLLISION_RADIUS: 50,
  
  // Ataques
  REGULAR_ATTACK_INTERVAL: 2000, // Milisegundos entre ataques regulares
  SUPER_ATTACK_INTERVAL: 10000, // Milisegundos entre super ataques (10s)
  REGULAR_ATTACK_ANIMATION_DURATION: 300, // Duración de animación de ataque (ms)
  
  // Proyectiles del boss
  PROJECTILE_SPEED_SLOW: 2, // Velocidad lenta (patrón espiral)
  PROJECTILE_SPEED_MEDIUM: 3, // Velocidad media (patrón circular)
  PROJECTILE_SPEED_FAST: 4, // Velocidad rápida (patrón direccional)
  
  // Daño
  REGULAR_PROJECTILE_DAMAGE_LOW: 10, // Patrón espiral
  REGULAR_PROJECTILE_DAMAGE_MEDIUM: 15, // Patrón circular
  REGULAR_PROJECTILE_DAMAGE_HIGH: 20, // Patrón direccional
  SUPER_ATTACK_DAMAGE: 30, // Daño del super ataque
  
  // Super Ataque
  SUPER_ATTACK_WARNING_DURATION: 1500, // Duración de advertencia (ms)
  SUPER_ATTACK_EXECUTION_DURATION: 500, // Duración del ataque activo (ms)
  SUPER_ATTACK_WIDTH: 200,
  SUPER_ATTACK_HEIGHT: 400,
  
  // Recompensas
  COSMOS_REWARD_MIN: 40,
  COSMOS_REWARD_MAX: 50,
  SCORE_REWARD: 1000,
} as const;

// ============================================
// 💎 CONFIGURACIÓN DE RECOMPENSAS (DROPS)
// ============================================
export const DROPS_CONFIG = {
  // Probabilidades
  HEALTH_DROP_CHANCE: 0.08, // 8% de probabilidad de dropear vida
  
  // Valores
  HEALTH_VALUE: 20, // Cantidad de vida que restaura
  
  // Tiempos de vida
  HEALTH_LIFETIME: 8, // Segundos antes de desaparecer
  COSMOS_LIFETIME: 15, // Segundos antes de desaparecer
  
  // Recolección
  PICKUP_RADIUS: 35, // Radio de recolección inmediata (píxeles)
  MAGNET_RADIUS: 80, // Radio de atracción magnética (píxeles)
  MAGNET_SPEED: 300, // Velocidad de atracción (píxeles/segundo)
  
  // Límites
  MAX_DROPS: 30, // Máximo de drops en el mapa simultáneamente
  MAX_DROPS_DISPLAY: 20, // Máximo que se mantienen antes de limpiar los más viejos
} as const;

// ============================================
// 🎯 CONFIGURACIÓN DE PROYECTILES
// ============================================
export const PROJECTILE_CONFIG = {
  // Colisiones
  PLAYER_PROJECTILE_HIT_RADIUS: 30, // Radio de colisión con enemigos
  BOSS_PROJECTILE_HIT_RADIUS: 50, // Radio de colisión con boss
  ENEMY_PROJECTILE_HIT_RADIUS: 25, // Radio de colisión con jugador
  
  // Comportamiento
  CAMERA_MARGIN: 200, // Margen de la cámara antes de destruir proyectil
  ENEMY_PROJECTILE_DAMAGE: 10, // Daño de proyectiles enemigos
} as const;

// ============================================
// 🌊 CONFIGURACIÓN DE OLEADAS
// ============================================
export const WAVE_CONFIG = {
  ENEMIES_TO_KILL_PER_WAVE: 25, // Enemigos a matar para avanzar de oleada
  SPECIAL_ENEMY_CHANCE_AFTER_WAVE_5: 0.3, // 30% de enemigos especiales en oleadas altas
} as const;

// ============================================
// 🗺️ CONFIGURACIÓN DEL MAPA
// ============================================
export const MAP_CONFIG = {
  // Tamaño
  VIEWPORT_WIDTH: 800, // Ancho visible de la pantalla
  VIEWPORT_HEIGHT: 600, // Alto visible de la pantalla
  MAP_WIDTH: 1600, // Ancho total del mapa
  MAP_HEIGHT: 1200, // Alto total del mapa
  
  // Límites del jugador
  PLAYER_BOUNDARY_MARGIN: 20, // Margen desde los bordes del mapa
} as const;

// ============================================
// 🎨 CONFIGURACIÓN VISUAL
// ============================================
export const VISUAL_CONFIG = {
  // Screen Shake
  SCREEN_SHAKE_INTENSITY: 10, // Intensidad del screen shake
  SCREEN_SHAKE_DURATION: 100, // Duración del screen shake (ms)
  SCREEN_SHAKE_SUPER_ATTACK_INTENSITY: 15, // Intensidad para super ataques
  SCREEN_SHAKE_SUPER_ATTACK_DURATION: 200, // Duración para super ataques (ms)
  
  // Sprites
  PLAYER_SPRITE_SIZE: 64,
  ENEMY_SPRITE_SIZE: 64,
  BOSS_SPRITE_SIZE: 96,
  PROJECTILE_SPRITE_SIZE: 24,
  
  // Efectos
  MAX_ATTACK_EFFECTS: 10, // Máximo de efectos de ataque del boss simultáneos (reducido de 15)
  PROJECTILE_TRAIL_LENGTH: 2, // Número de círculos en el trail de proyectiles
} as const;

// ============================================
// ⚡ CONFIGURACIÓN DE PODERES ESPECIALES
// ============================================
export const POWER_CONFIG = {
  // Rayo de Zeus
  LIGHTNING_DISTANCE_BASE: 120, // Distancia base de los rayos (nivel 1)
  LIGHTNING_DISTANCE_INCREMENT: 40, // Incremento por nivel
  LIGHTNING_SPAWN_HEIGHT: 400, // Altura desde donde cae el rayo (reducido de 500)
  LIGHTNING_DELAY: 100, // Delay entre rayos (reducido de 120ms)
  LIGHTNING_DAMAGE_RADIUS: 50, // Radio de daño - ajustado para ser más preciso (antes 70-80)
  LIGHTNING_DURATION: 400, // Duración del efecto visual (reducido de 500ms)
  LIGHTNING_IMPACT_DURATION: 500, // Duración de la explosión (reducido de 700ms)
} as const;

// ============================================
// ⚡ CONFIGURACIÓN DE RENDIMIENTO
// ============================================
export const PERFORMANCE_CONFIG = {
  MAX_DELTA_TIME: 0.1, // Delta time máximo (100ms) para evitar saltos grandes
  CLEANUP_INTERVAL: 5000, // Intervalo de limpieza de enemigos lejanos (ms)
  LOG_THROTTLE_CHANCE: 0.02, // Probabilidad de log (2% para no saturar consola)
  
  // Pool de sprites
  ENEMY_SPRITE_POOL_SIZE: 30, // Número de sprites de enemigos precargados
} as const;

// ============================================
// 🔊 CONFIGURACIÓN DE AUDIO
// ============================================
export const AUDIO_CONFIG = {
  BACKGROUND_MUSIC_VOLUME: 0.3, // Volumen de la música de fondo (0-1)
} as const;

// ============================================
// 🎮 PRESETS DE DIFICULTAD (OPCIONAL)
// ============================================
export const DIFFICULTY_PRESETS = {
  EASY: {
    playerSpeedMultiplier: 1.3,
    enemySpeedMultiplier: 0.7,
    enemyHPMultiplier: 0.7,
    dropsMultiplier: 1.5,
  },
  NORMAL: {
    playerSpeedMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    enemyHPMultiplier: 1.0,
    dropsMultiplier: 1.0,
  },
  HARD: {
    playerSpeedMultiplier: 0.9,
    enemySpeedMultiplier: 1.3,
    enemyHPMultiplier: 1.5,
    dropsMultiplier: 0.7,
  },
  INSANE: {
    playerSpeedMultiplier: 0.8,
    enemySpeedMultiplier: 1.6,
    enemyHPMultiplier: 2.0,
    dropsMultiplier: 0.5,
  },
} as const;

// ============================================
// 📊 UTILIDAD: Calcular valores dinámicos
// ============================================

/**
 * Calcula el HP de un enemigo según su tipo y la oleada actual
 */
export function calculateEnemyHP(
  type: 'normal' | 'fast' | 'tank',
  waveNumber: number
): number {
  const config = ENEMY_CONFIG[type.toUpperCase() as 'NORMAL' | 'FAST' | 'TANK'];
  const baseHpMultiplier = 1 + (waveNumber - 1) * ENEMY_CONFIG.HP_MULTIPLIER_PER_WAVE;
  return Math.floor((config.BASE_HP + (waveNumber * config.HP_PER_WAVE)) * baseHpMultiplier);
}

/**
 * Calcula la velocidad de un enemigo según su tipo y la oleada actual
 */
export function calculateEnemySpeed(
  type: 'normal' | 'fast' | 'tank',
  waveNumber: number
): number {
  const config = ENEMY_CONFIG[type.toUpperCase() as 'NORMAL' | 'FAST' | 'TANK'];
  const speedMultiplier = 1 + (waveNumber - 1) * ENEMY_CONFIG.SPEED_MULTIPLIER_PER_WAVE;
  return config.SPEED * speedMultiplier;
}

/**
 * Calcula el cosmos requerido para subir de nivel
 */
export function calculateCosmosRequired(level: number): number {
  return PLAYER_CONFIG.BASE_COSMOS_REQUIRED + ((level - 1) * PLAYER_CONFIG.COSMOS_INCREMENT_PER_LEVEL);
}

/**
 * Calcula el cooldown de disparo según los upgrades
 */
export function calculateFireRate(fireRateLevel: number): number {
  const reduction = fireRateLevel * PLAYER_CONFIG.FIRE_RATE_REDUCTION_PER_LEVEL;
  return Math.max(
    PLAYER_CONFIG.MIN_FIRE_RATE,
    PLAYER_CONFIG.BASE_FIRE_RATE - reduction
  );
}

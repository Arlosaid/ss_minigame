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
  BASE_DAMAGE: 30, // Daño base del jugador - ajustado para one-shot inicial
  DAMAGE_UPGRADE_BONUS: 8, // Daño adicional por nivel de upgrade
  
  // Disparo
  BASE_FIRE_RATE: 500, // Milisegundos entre disparos
  FIRE_RATE_REDUCTION_PER_LEVEL: 50, // Reducción de cooldown por nivel de upgrade
  MIN_FIRE_RATE: 100, // Cooldown mínimo (ms)
  ATTACK_RANGE: 120, // Rango de detección de enemigos para disparo automático - Reducido para forzar movimiento
  
  // Proyectiles
  PROJECTILE_SPEED: 2.0, // Velocidad de los proyectiles del jugador
  PROJECTILE_SPEED_MULTIPLIER: 5, // Multiplicador para visualización (2.0 * 5 = 10 px/frame)
  MAX_PROJECTILES: 30, // Límite de proyectiles simultáneos
  
  // Vida
  STARTING_HEALTH: 100, // Vida inicial balanceada para progresión
  STARTING_MAX_HEALTH: 100,
  MAX_HEALTH_UPGRADE_BONUS: 50, // HP adicional por nivel de upgrade
  
  // Progresión
  STARTING_LEVEL: 1,
  BASE_COSMOS_REQUIRED: 8, // Cosmos requerido para nivel 1 - más rápido
  COSMOS_INCREMENT_PER_LEVEL: 4, // Incremento de cosmos requerido por nivel - progresión más rápida
} as const;

// ============================================
// 👾 CONFIGURACIÓN DE ENEMIGOS
// ============================================
export const ENEMY_CONFIG = {
  // Spawn
  BASE_SPAWN_INTERVAL: 1200, // Milisegundos entre spawns (oleada 1) - frecuente
  SPAWN_INTERVAL_REDUCTION_PER_WAVE: 100, // Reducción del intervalo por oleada - progresión moderada
  MIN_SPAWN_INTERVAL: 400, // Intervalo mínimo (ms) - spawn constante
  SPAWN_DISTANCE_MIN: 350, // Distancia mínima de spawn desde el jugador
  SPAWN_DISTANCE_MAX: 500, // Distancia máxima de spawn desde el jugador
  WARNING_DURATION: 500, // Duración de la advertencia de spawn (ms) - reducido para spawns rápidos
  
  // Límites
  BASE_MAX_ACTIVE_ENEMIES: 12, // Máximo de enemigos activos en oleada 1 - oleadas manejables
  MAX_ACTIVE_ENEMIES_INCREMENT: 2, // Incremento por oleada - progresión gradual
  MAX_ACTIVE_ENEMIES_CAP: 25, // Máximo absoluto de enemigos - hordas grandes pero no abrumadoras
  MAX_WARNINGS: 10, // Máximo de advertencias de spawn simultáneas
  CLEANUP_DISTANCE: 1200, // Distancia para limpiar enemigos lejanos
  
  // Escalado de dificultad - PROGRESIÓN SUAVE Y DIVERTIDA
  HP_MULTIPLIER_PER_WAVE: 0.15, // +15% HP por oleada - escalado más suave
  SPEED_MULTIPLIER_PER_WAVE: 0.05, // +5% velocidad por oleada - enemigos más predecibles
  
  // Tipos de enemigos - ONE-SHOT INICIAL Y ESCALADO PROGRESIVO
  NORMAL: {
    BASE_HP: 30, // Muere con 1 golpe inicial (BASE_DAMAGE=30)
    HP_PER_WAVE: 8, // Escalado moderado
    SPEED: 0.85, // Velocidad base normal
    COSMOS_MIN: 3, // Aumentado para progresión más rápida
    COSMOS_MAX: 5, // Aumentado para progresión más rápida
  },
  FAST: {
    BASE_HP: 25, // Rápido y frágil
    HP_PER_WAVE: 6, // Escalado menor
    SPEED: 1.5, // Rápido pero no imposible de esquivar
    COSMOS_MIN: 4, // Aumentado
    COSMOS_MAX: 7, // Aumentado
    UNLOCK_WAVE: 2, // Se desbloquea en oleada 2
  },
  TANK: {
    BASE_HP: 60, // Tank inicial requiere 2 golpes
    HP_PER_WAVE: 12, // Escalado mayor
    SPEED: 0.5, // Lento pero resistente
    COSMOS_MIN: 7, // Aumentado
    COSMOS_MAX: 10, // Aumentado
    UNLOCK_WAVE: 3, // Se desbloquea en oleada 3
  },
  
  // Comportamiento
  BASE_MOVEMENT_SPEED: 130, // Píxeles por segundo - balanceado
  COLLISION_RADIUS: 30, // Radio de colisión con jugador
  PROJECTILE_HIT_RADIUS: 30, // Radio de colisión con proyectiles
  DAMAGE_TO_PLAYER: 10, // Daño al tocar al jugador - balanceado para sobrevivir
} as const;

// ============================================
// 👑 CONFIGURACIÓN DE BOSS
// ============================================
export const BOSS_CONFIG = {
  // Aparición
  SPAWN_TIME: 180, // Segundos después de iniciar el stage (3 minutos)
  
  // Estadísticas
  BASE_HP: 1200, // HP balanceado para ser desafiante pero vencible
  HP_INCREMENT_PER_HOUSE: 400, // HP adicional por cada casa subsecuente
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
  REGULAR_PROJECTILE_DAMAGE_LOW: 15, // Patrón espiral - esquivable
  REGULAR_PROJECTILE_DAMAGE_MEDIUM: 20, // Patrón circular - moderado
  REGULAR_PROJECTILE_DAMAGE_HIGH: 25, // Patrón direccional - alto pero justo
  SUPER_ATTACK_DAMAGE: 35, // Daño del super ataque - peligroso pero no one-shot
  
  // Super Ataque
  SUPER_ATTACK_WARNING_DURATION: 1500, // Duración de advertencia (ms)
  SUPER_ATTACK_EXECUTION_DURATION: 500, // Duración del ataque activo (ms)
  SUPER_ATTACK_WIDTH: 200,
  SUPER_ATTACK_HEIGHT: 400,
  
  // Recompensas
  COSMOS_REWARD_MIN: 100, // Gran recompensa por derrotar al boss
  COSMOS_REWARD_MAX: 150, // Suficiente para varias mejoras
  SCORE_REWARD: 5000, // Score satisfactorio
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
  MAX_DROPS: 50, // Máximo de drops en el mapa simultáneamente - Aumentado para más enemigos
  MAX_DROPS_DISPLAY: 35, // Máximo que se mantienen antes de limpiar los más viejos
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
  ENEMIES_TO_KILL_PER_WAVE: 30, // Enemigos a matar para avanzar de oleada - balanceado
  SPECIAL_ENEMY_CHANCE_AFTER_WAVE_5: 0.3, // 30% de enemigos especiales en oleadas altas
  POST_BOSS_DIFFICULTY_MULTIPLIER: 1.5, // Multiplicador de dificultad después del primer boss
  BOSS_DEFEATED_WAVE_INCREMENT: 5, // Incremento de oleada al derrotar al boss
} as const;

// ============================================
// 🗺️ CONFIGURACIÓN DEL MAPA
// ============================================
export const MAP_CONFIG = {
  // Tamaño
  VIEWPORT_WIDTH: 800, // Ancho visible de la pantalla
  VIEWPORT_HEIGHT: 600, // Alto visible de la pantalla
  MAP_WIDTH: 1200, // Ancho total del mapa - Reducido para gameplay más intenso
  MAP_HEIGHT: 900, // Alto total del mapa - Reducido para gameplay más intenso
  
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
  // ⚡ Rayo de Zeus (Zeus's Lightning)
  LIGHTNING_DISTANCE_BASE: 120, // Distancia base de los rayos (nivel 1)
  LIGHTNING_DISTANCE_INCREMENT: 40, // Incremento por nivel
  LIGHTNING_SPAWN_HEIGHT: 400, // Altura desde donde cae el rayo (reducido de 500)
  LIGHTNING_DELAY: 100, // Delay entre rayos (reducido de 120ms)
  LIGHTNING_DAMAGE_RADIUS: 60, // Radio de daño - balanceado para utilidad sin ser OP (antes 75)
  LIGHTNING_DURATION: 400, // Duración del efecto visual (reducido de 500ms)
  LIGHTNING_IMPACT_DURATION: 500, // Duración de la explosión (reducido de 700ms)
  
  // 🏹 Flecha de Oro (Golden Arrow)
  GOLDEN_ARROW_BASE_DAMAGE: 40, // Daño base de la flecha (nivel 1)
  GOLDEN_ARROW_DAMAGE_INCREMENT: 15, // Incremento de daño por nivel
  GOLDEN_ARROW_BASE_SPEED: 400, // Velocidad base de la flecha (px/segundo) - nivel 1
  GOLDEN_ARROW_SPEED_INCREMENT: 100, // Incremento de velocidad por nivel
  GOLDEN_ARROW_RANGE: 500, // Rango máximo de búsqueda de enemigos
  GOLDEN_ARROW_LIFETIME: 3000, // Duración máxima de la flecha (ms)
  GOLDEN_ARROW_SIZE: 32, // Tamaño visual de la flecha
  GOLDEN_ARROW_TRAIL_LENGTH: 5, // Longitud del trail dorado
  GOLDEN_ARROW_FIRE_RATE: 1200, // Intervalo de disparo automático (ms) - ritmo normal
  
  // 🛡️ Escudo de Atena (Athena's Shield)
  SHIELD_BASE_ABSORPTION: 50, // Daño absorbido por escudo individual
  SHIELD_RADIUS: 70, // Radio de órbita de los escudos
  SHIELD_ROTATION_SPEED: 3, // Velocidad de rotación de los escudos (rad/segundo)
  SHIELD_REGENERATION_TIME: 15000, // Tiempo de regeneración de escudos (15 segundos)
  SHIELD_SIZE: 40, // Tamaño visual de cada escudo
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

import { Enemy, Player, Vector2D } from '../types/game';
import { Vector2DUtils } from '../utils/vector2D';

export interface SteeringConfig {
  pursuitWeight: number;
  separationWeight: number;
  wanderWeight: number;
  separationRadius: number;
  wanderJitter: number;
  orbitWeight: number;
  orbitSpeedMin: number;
  orbitSpeedMax: number;
  minOrbitRadius: number;
  maxOrbitRadius: number;
  engageDistanceMultiplier: number;
  maxSteeringForce: number; // As fraction of enemy speed
}

// Ajusta estos parámetros para equilibrar el flujo de la horda
// - pursuitWeight: qué tan fuerte prioriza perseguir al jugador
// - separationWeight: qué tanto empuja para no apilarse
// - separationRadius: rango (px) para detectar compañeros y dispersarse
// - wanderWeight / wanderJitter: ruido suave para entradas desde múltiples ángulos
// - orbitWeight / orbitSpeed*: cuánto rodean al jugador y con qué rapidez
// - min/maxOrbitRadius + engageDistanceMultiplier: dónde forman el anillo antes de atacar
// - maxSteeringForce: qué tan rápido puede cambiar de dirección (0-1 relativo a su velocidad)
const DEFAULT_CONFIG: SteeringConfig = {
  pursuitWeight: 1.2,              // ↓ Menos directo = más dispersión
  separationWeight: 2.5,           // ↑↑↑ Separación muy fuerte
  wanderWeight: 0.6,               // ↑↑ Mucha variación angular
  separationRadius: 120,           // ↑↑ Detectan muy lejos
  wanderJitter: 0.55,              // ↑ Cambios impredecibles
  orbitWeight: 1.6,                // ↑↑ Priorizar rodear sobre perseguir
  orbitSpeedMin: 1.0,              // ↑ Órbitas más dinámicas
  orbitSpeedMax: 2.8,              // ↑↑ Gran variación
  minOrbitRadius: 45,              // ↑↑ Radio mínimo mucho más amplio
  maxOrbitRadius: 160,             // ↑↑ Horda muy dispersa
  engageDistanceMultiplier: 5.5,   // ↑↑ Forman círculo grande antes de atacar
  maxSteeringForce: 0.5            // ↓ Movimiento muy fluido
};

type OrbitState = {
  angle: number;
  direction: number;
  radius: number;
  speed: number;
};

type PersonalOffset = {
  x: number;
  y: number;
};

export class EnemySteeringSystem {
  private config: SteeringConfig;
  private wanderAngles: Map<string, number> = new Map();
  private orbitStates: Map<string, OrbitState> = new Map();
  private personalOffsets: Map<string, PersonalOffset> = new Map();

  constructor(config: Partial<SteeringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(config: Partial<SteeringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  updateEnemyPosition(
    enemy: Enemy,
    player: Player,
    allEnemies: Enemy[],
    deltaTime: number
  ): void {
    const pursuitForce = this.swarmPursuit(enemy, player, deltaTime);
    const separationForce = this.separation(enemy, allEnemies);
    const wanderForce = this.wander(enemy);

    let steering = { x: 0, y: 0 };
    steering = Vector2DUtils.add(
      steering,
      Vector2DUtils.multiply(pursuitForce, this.config.pursuitWeight)
    );
    steering = Vector2DUtils.add(
      steering,
      Vector2DUtils.multiply(separationForce, this.config.separationWeight)
    );
    steering = Vector2DUtils.add(
      steering,
      Vector2DUtils.multiply(wanderForce, this.config.wanderWeight)
    );

    const maxSpeed = Math.max(enemy.stats.speed, 5);
    const desiredVelocity = Vector2DUtils.limit(steering, maxSpeed);

    const steeringForce = Vector2DUtils.subtract(desiredVelocity, enemy.velocity);
    const maxForce = maxSpeed * this.config.maxSteeringForce;
    const limitedForce = Vector2DUtils.limit(steeringForce, maxForce);

    enemy.velocity = Vector2DUtils.limit(
      {
        x: enemy.velocity.x + limitedForce.x,
        y: enemy.velocity.y + limitedForce.y
      },
      maxSpeed
    );

    // Aplicar desplazamiento con amortiguación mínima para suavizar
    enemy.position.x += enemy.velocity.x * deltaTime;
    enemy.position.y += enemy.velocity.y * deltaTime;
  }

  private swarmPursuit(
    enemy: Enemy,
    player: Player,
    deltaTime: number
  ): Vector2D {
    // Cada enemigo tiene un offset personal del jugador para evitar convergencia exacta
    const personalOffset = this.getPersonalOffset(enemy);
    const targetPosition = {
      x: player.position.x + personalOffset.x,
      y: player.position.y + personalOffset.y
    };
    
    const toPlayer = Vector2DUtils.subtract(targetPosition, enemy.position);
    const direct = Vector2DUtils.normalize(toPlayer);
    const orbitVector = this.computeOrbitVector(enemy, player, deltaTime);
    const orbitDirection = Vector2DUtils.normalize(orbitVector);

    const distanceToPlayer = Vector2DUtils.distance(enemy.position, player.position);
    const engageDistance = enemy.stats.attackRange * this.config.engageDistanceMultiplier;

    // Lejos: más persecución. Cerca: mucha órbita para dispersarse
    const pursuitStrength = distanceToPlayer > engageDistance ? 1 : 0.3;
    const orbitStrength = distanceToPlayer > engageDistance
      ? this.config.orbitWeight * 0.25
      : this.config.orbitWeight * 1.5; // ↑ Mucha órbita cuando están cerca

    const combined = Vector2DUtils.add(
      Vector2DUtils.multiply(direct, pursuitStrength),
      Vector2DUtils.multiply(orbitDirection, orbitStrength)
    );

    return Vector2DUtils.normalize(combined);
  }

  private computeOrbitVector(
    enemy: Enemy,
    player: Player,
    deltaTime: number
  ): Vector2D {
    const state = this.getOrbitState(enemy);
    state.angle += state.speed * deltaTime * state.direction;

    const target = {
      x: player.position.x + Math.cos(state.angle) * state.radius,
      y: player.position.y + Math.sin(state.angle) * state.radius
    };

    return Vector2DUtils.subtract(target, enemy.position);
  }

  private getOrbitState(enemy: Enemy): OrbitState {
    let state = this.orbitStates.get(enemy.id);
    if (state) return state;

    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.random() * Math.PI * 2;
    const radius = this.computeOrbitRadius(enemy);
    const speed = this.config.orbitSpeedMin + Math.random() * (this.config.orbitSpeedMax - this.config.orbitSpeedMin);

    state = { angle, direction, radius, speed };
    this.orbitStates.set(enemy.id, state);
    return state;
  }

  private computeOrbitRadius(enemy: Enemy): number {
    const base = enemy.stats.attackRange * 0.8;
    const min = Math.max(this.config.minOrbitRadius, base * 0.7);
    const max = Math.min(this.config.maxOrbitRadius, Math.max(min + 5, base * 1.2 + 15));
    return min + Math.random() * (max - min);
  }

  private separation(enemy: Enemy, allEnemies: Enemy[]): Vector2D {
    const steer = { x: 0, y: 0 };
    let neighborCount = 0;
    const radiusSq = this.config.separationRadius * this.config.separationRadius;

    for (let i = 0; i < allEnemies.length; i++) {
      const other = allEnemies[i];
      if (other.id === enemy.id) continue;

      const distSq = Vector2DUtils.distanceSquared(enemy.position, other.position);
      if (distSq === 0 || distSq > radiusSq) continue;

      const dist = Math.sqrt(distSq);
      const diff = {
        x: (enemy.position.x - other.position.x) / dist,
        y: (enemy.position.y - other.position.y) / dist
      };
      
      // Peso exponencial: MUY fuerte cuando están cerca, débil cuando están lejos
      const normalizedDist = dist / this.config.separationRadius;
      const weight = Math.pow(1 - normalizedDist, 2); // Cuadrático para más repulsión
      
      steer.x += diff.x * weight;
      steer.y += diff.y * weight;
      neighborCount++;
    }

    if (neighborCount === 0) {
      return steer;
    }

    return Vector2DUtils.normalize(Vector2DUtils.divide(steer, neighborCount));
  }

  private wander(enemy: Enemy): Vector2D {
    const currentAngle = this.wanderAngles.get(enemy.id) ?? Math.random() * Math.PI * 2;
    const jitterChange = (Math.random() - 0.5) * this.config.wanderJitter;
    const nextAngle = currentAngle + jitterChange;
    this.wanderAngles.set(enemy.id, nextAngle);

    return {
      x: Math.cos(nextAngle),
      y: Math.sin(nextAngle)
    };
  }

  private getPersonalOffset(enemy: Enemy): PersonalOffset {
    let offset = this.personalOffsets.get(enemy.id);
    if (offset) return offset;

    // Cada enemigo tiene un offset aleatorio permanente (su "espacio personal" alrededor del jugador)
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 40; // 15-55px de offset
    offset = {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
    this.personalOffsets.set(enemy.id, offset);
    return offset;
  }
}

export const enemySteeringSystem = new EnemySteeringSystem();

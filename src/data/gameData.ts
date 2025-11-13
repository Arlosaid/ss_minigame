// Tipos
export type Knight = {
  id: string;
  name: string;
  color: string;
  projectileColor: string;
  attack: string;
  speed: number;
  fireRate: number;
  damage: number;
};

export type GoldSaint = {
  name: string;
  house: string;
  color: string;
  attack: string;
};

export type Upgrade = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  levels: number[];
};

// Datos de caballeros de bronce
export const BRONZE_KNIGHTS: Knight[] = [
  {
    id: 'pegasus',
    name: 'Seiya de Pegaso',
    color: '#FF4444',
    projectileColor: '#FFD700',
    attack: 'Meteoros de Pegaso',
    speed: 2.5, // ⚡ Velocidad balanceada (300px/s real - jugable pero mejorable)
    fireRate: 900, // ⚡ Cooldown 0.9s (equilibrado)
    damage: 15 // ⚡ Daño inicial razonable
  },
  {
    id: 'dragon',
    name: 'Shiryu de Dragón',
    color: '#44FF44',
    projectileColor: '#00FF00',
    attack: 'Cólera del Dragón',
    speed: 2.5,
    fireRate: 1800,
    damage: 15
  },
  {
    id: 'cisne',
    name: 'Hyoga de Cisne',
    color: '#4444FF',
    projectileColor: '#00FFFF',
    attack: 'Polvo de Diamante',
    speed: 2.8,
    fireRate: 1600,
    damage: 12
  }
];

// Datos de caballeros dorados
export const GOLD_SAINTS: GoldSaint[] = [
  { name: 'Mu de Aries', house: 'Aries', color: '#FFD700', attack: 'Extinción Estelar' },
  { name: 'Aldebarán de Tauro', house: 'Tauro', color: '#8B4513', attack: 'Gran Cuerno' },
  { name: 'Saga de Géminis', house: 'Géminis', color: '#4169E1', attack: 'Explosión Galáctica' },
  { name: 'Máscara de Muerte de Cáncer', house: 'Cáncer', color: '#32CD32', attack: 'Ondas del Infierno' },
  { name: 'Aiolia de Leo', house: 'Leo', color: '#FF8C00', attack: 'Relámpago de Plasma' },
  { name: 'Shaka de Virgo', house: 'Virgo', color: '#DDA0DD', attack: 'Tesoro del Cielo' },
  { name: 'Dohko de Libra', house: 'Libra', color: '#87CEEB', attack: 'Cólera de los Dragones' },
  { name: 'Milo de Escorpio', house: 'Escorpio', color: '#DC143C', attack: 'Aguja Escarlata' },
  { name: 'Aioros de Sagitario', house: 'Sagitario', color: '#FFD700', attack: 'Flecha de Oro' },
  { name: 'Shura de Capricornio', house: 'Capricornio', color: '#696969', attack: 'Excalibur' },
  { name: 'Camus de Acuario', house: 'Acuario', color: '#00CED1', attack: 'Ejecución Aurora' },
  { name: 'Afrodita de Piscis', house: 'Piscis', color: '#FF69B4', attack: 'Rosas Diabólicas' }
];

// ⚡ Mejoras balanceadas para progresión tipo Vampire Survivors
export const UPGRADES: Upgrade[] = [
  { id: 'damage', name: 'Cosmos Aumentado', desc: '+3 Daño (+30% potencia)', icon: '⚡', levels: [3, 6, 10, 15, 20] },
  { id: 'speed', name: 'Velocidad Divina', desc: '+15% Velocidad', icon: '💨', levels: [0.15, 0.30, 0.50, 0.75, 1.0] },
  { id: 'fireRate', name: 'Ráfaga Cósmica', desc: 'Ataque más rápido (-200ms)', icon: '🔥', levels: [200, 400, 600, 800, 1000] },
  { id: 'multiShot', name: 'Meteoros Múltiples', desc: '+1 Proyectil adicional', icon: '✨', levels: [1, 2, 3, 4, 5] },
  { id: 'pierce', name: 'Alcance Cósmico', desc: '+25% Rango de ataque', icon: '🎯', levels: [1, 2, 3, 4, 5] },
  { id: 'maxHealth', name: 'Armadura Divina', desc: '+75 HP Máximo', icon: '💚', levels: [75, 150, 225, 300, 375] },
  { id: 'explosion', name: 'Explosión de Cosmos', desc: 'Área de daño al impactar', icon: '💥', levels: [30, 50, 80, 120, 150] }
];

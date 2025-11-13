import { Upgrade, Player, PermanentUpgrade, ActivePower } from '../types/game';
import { PowerSystem } from './PowerSystem';

export class UpgradeSystem {
  // ============================================
  // 🌟 PODERES ACTIVOS (con niveles escalables)
  // ============================================
  static activePowers: Upgrade[] = [
    {
      id: 'lightning_strike',
      name: 'Rayo de Zeus',
      description: 'Invoca truenos para atacar a los enemigos en una area pequeña al frente',
      icon: '⚡',
      tier: 1,
      type: 'power',
      maxLevel: 5,
      apply: (player: Player) => {
        // Buscar si ya tiene este poder
        const existingPower = player.activePowers.find(p => p.id === 'lightning_strike');
        
        if (existingPower) {
          // Subir nivel del poder
          existingPower.level = Math.min(existingPower.level + 1, 5);
          existingPower.cooldown = PowerSystem.getLightningCooldown(existingPower.level);
        } else {
          // Agregar poder nuevo
          const newPower: ActivePower = {
            id: 'lightning_strike',
            level: 1,
            lastTrigger: 0,
            cooldown: PowerSystem.getLightningCooldown(1)
          };
          player.activePowers.push(newPower);
        }
      }
    },
    {
      id: 'golden_arrow',
      name: 'Flecha de Oro',
      description: 'Dispara flechas divinas que buscan automáticamente a los enemigos cercanos',
      icon: '🏹',
      tier: 1,
      type: 'power',
      maxLevel: 5,
      apply: (player: Player) => {
        const existingPower = player.activePowers.find(p => p.id === 'golden_arrow');
        
        if (existingPower) {
          existingPower.level = Math.min(existingPower.level + 1, 5);
          existingPower.cooldown = PowerSystem.getGoldenArrowCooldown(existingPower.level);
        } else {
          const newPower: ActivePower = {
            id: 'golden_arrow',
            level: 1,
            lastTrigger: 0,
            cooldown: PowerSystem.getGoldenArrowCooldown(1)
          };
          player.activePowers.push(newPower);
        }
      }
    },
    {
      id: 'athena_shield',
      name: 'Escudo de Atena',
      description: 'Crea un escudo protector que absorbe daño y lo refleja a los enemigos',
      icon: '🛡️',
      tier: 1,
      type: 'power',
      maxLevel: 5,
      apply: (player: Player) => {
        const existingPower = player.activePowers.find(p => p.id === 'athena_shield');
        
        if (existingPower) {
          existingPower.level = Math.min(existingPower.level + 1, 5);
          existingPower.cooldown = PowerSystem.getAthenaShieldCooldown(existingPower.level);
        } else {
          const newPower: ActivePower = {
            id: 'athena_shield',
            level: 1,
            lastTrigger: 0,
            cooldown: PowerSystem.getAthenaShieldCooldown(1)
          };
          player.activePowers.push(newPower);
        }
      }
    }
  ];

  // ============================================
  // 📊 MEJORAS DE ESTADÍSTICAS
  // ============================================
  static statUpgrades: Upgrade[] = [
    {
      id: 'damage_boost',
      name: 'Puño de Pegaso',
      description: '+15% Daño',
      icon: '👊',
      tier: 1,
      type: 'stat',
      maxLevel: 10,
      apply: (player: Player) => {
        player.stats.damage *= 1.15;
      }
    },
    {
      id: 'speed_boost',
      name: 'Velocidad de Meteoro',
      description: '+20% Velocidad de Movimiento',
      icon: '🏃',
      tier: 1,
      type: 'stat',
      maxLevel: 8,
      apply: (player: Player) => {
        player.stats.speed *= 1.2;
      }
    },
    {
      id: 'range_boost',
      name: 'Alcance Extendido',
      description: '+25% Rango de Ataque',
      icon: '🎯',
      tier: 1,
      type: 'stat',
      maxLevel: 6,
      apply: (player: Player) => {
        player.stats.attackRange *= 1.25;
      }
    },
    {
      id: 'attack_speed',
      name: 'Combo Rápido',
      description: '+30% Velocidad de Ataque',
      icon: '⚔️',
      tier: 1,
      type: 'stat',
      maxLevel: 8,
      apply: (player: Player) => {
        player.stats.attackSpeed *= 1.3;
      }
    },
    {
      id: 'health_boost',
      name: 'Armadura Dorada',
      description: '+50 HP Máximos',
      icon: '🛡️',
      tier: 1,
      type: 'stat',
      maxLevel: 10,
      apply: (player: Player) => {
        player.stats.maxHp += 50;
        player.stats.currentHp += 50;
      }
    },
    {
      id: 'critical_rate',
      name: 'Golpe Crítico',
      description: '+10% Probabilidad de Crítico',
      icon: '💫',
      tier: 2,
      type: 'stat',
      maxLevel: 5,
      apply: (player: Player) => {
        // Esta mejora necesita lógica especial en el combat system
        player.upgrades.push({
          id: 'critical_effect',
          name: 'Critical Strike Active',
          description: '',
          icon: '',
          tier: 2,
          type: 'stat',
          maxLevel: 1,
          apply: () => {}
        });
      }
    },
    {
      id: 'life_regeneration',
      name: 'Regeneración',
      description: '+2 HP por segundo',
      icon: '💚',
      tier: 2,
      type: 'stat',
      maxLevel: 5,
      apply: (player: Player) => {
        player.upgrades.push({
          id: 'regen_effect',
          name: 'Regeneration Active',
          description: '',
          icon: '',
          tier: 2,
          type: 'stat',
          maxLevel: 1,
          apply: () => {}
        });
      }
    }
  ];

  // Combinar todos los upgrades temporales
  static temporaryUpgrades: Upgrade[] = [
    ...UpgradeSystem.activePowers,
    ...UpgradeSystem.statUpgrades
  ];

  static permanentUpgrades: PermanentUpgrade[] = [
    {
      id: 'perm_damage',
      name: 'Entrenamiento de Combate',
      description: '+5% daño base permanente',
      cost: 100,
      currency: 'gold',
      maxLevel: 10,
      currentLevel: 0,
      effect: (level: number) => 1 + (level * 0.05)
    },
    {
      id: 'perm_health',
      name: 'Resistencia del Santuario',
      description: '+20 HP máximos permanentes',
      cost: 150,
      currency: 'gold',
      maxLevel: 10,
      currentLevel: 0,
      effect: (level: number) => level * 20
    },
    {
      id: 'perm_speed',
      name: 'Agilidad de Caballero',
      description: '+3% velocidad permanente',
      cost: 120,
      currency: 'gold',
      maxLevel: 8,
      currentLevel: 0,
      effect: (level: number) => 1 + (level * 0.03)
    },
    {
      id: 'perm_cosmos_gen',
      name: 'Meditación Cósmica',
      description: 'Genera cosmos más rápido',
      cost: 200,
      currency: 'gold',
      maxLevel: 5,
      currentLevel: 0,
      effect: (level: number) => 1 + (level * 0.2)
    },
    {
      id: 'perm_starting_gold',
      name: 'Tesoro del Santuario',
      description: 'Empieza con más oro',
      cost: 50,
      currency: 'gems',
      maxLevel: 3,
      currentLevel: 0,
      effect: (level: number) => level * 100
    }
  ];

  static getRandomUpgrades(count: number = 3, playerLevel: number, isFirstChoice: boolean = false): Upgrade[] {
    // En la primera elección, SIEMPRE incluir Rayo Divino
    if (isFirstChoice) {
      const lightningPower = this.activePowers.find(u => u.id === 'lightning_strike');
      if (!lightningPower) return this.getRandomUpgrades(count, playerLevel, false);
      
      // Seleccionar 2 upgrades adicionales aleatorios
      const otherUpgrades = this.statUpgrades
        .filter(u => u.tier <= Math.floor(playerLevel / 3) + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, count - 1);
      
      return [lightningPower, ...otherUpgrades];
    }

    // Filtrar upgrades disponibles según el tier y nivel del jugador
    const availableUpgrades = this.temporaryUpgrades.filter(
      upgrade => upgrade.tier <= Math.floor(playerLevel / 3) + 1
    );

    if (availableUpgrades.length <= count) {
      return [...availableUpgrades];
    }

    const selected: Upgrade[] = [];
    const used = new Set<number>();

    while (selected.length < count) {
      const index = Math.floor(Math.random() * availableUpgrades.length);
      if (!used.has(index)) {
        used.add(index);
        selected.push(availableUpgrades[index]!);
      }
    }

    return selected;
  }

  static applyUpgrade(player: Player, upgrade: Upgrade): void {
    // Aplicar el upgrade
    upgrade.apply(player);
    
    // Actualizar o agregar el upgrade al array del jugador
    const existingIndex = player.upgrades.findIndex(u => u.id === upgrade.id);
    if (existingIndex >= 0) {
      // Actualizar nivel existente
      const existing = player.upgrades[existingIndex]!;
      player.upgrades[existingIndex] = {
        ...existing,
        currentLevel: Math.min((existing.currentLevel || 0) + 1, upgrade.maxLevel)
      };
    } else {
      // Agregar nuevo upgrade
      player.upgrades.push({ ...upgrade, currentLevel: 1 });
    }
  }

  static hasUpgradeEffect(player: Player, effectId: string): boolean {
    return player.upgrades.some(u => u.id === effectId);
  }

  static getUpgradeLevel(player: Player, upgradeId: string): number {
    const upgrade = player.upgrades.find(u => u.id === upgradeId);
    return upgrade?.currentLevel || 0;
  }
}

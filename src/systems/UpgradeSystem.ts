import { Upgrade, Player, PermanentUpgrade } from '../types/game';

export class UpgradeSystem {
  static temporaryUpgrades: Upgrade[] = [
    {
      id: 'damage_boost',
      name: 'Puño de Pegaso',
      description: '+15% Daño',
      icon: '👊',
      tier: 1,
      apply: (player: Player) => {
        player.stats.damage *= 1.15;
      }
    },
    {
      id: 'speed_boost',
      name: 'Velocidad de Meteoro',
      description: '+20% Velocidad de Movimiento',
      icon: '⚡',
      tier: 1,
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
      apply: (player: Player) => {
        player.stats.maxHp += 50;
        player.stats.currentHp += 50;
      }
    },
    {
      id: 'life_steal',
      name: 'Cosmos Vampírico',
      description: 'Recupera 10% del daño como vida',
      icon: '💉',
      tier: 2,
      apply: (player: Player) => {
        // Esta mejora necesita lógica especial en el combat system
        player.upgrades.push({
          id: 'life_steal_effect',
          name: 'Life Steal Active',
          description: '',
          icon: '',
          tier: 2,
          apply: () => {}
        });
      }
    },
    {
      id: 'area_damage',
      name: 'Explosión de Cosmos',
      description: 'Ataques golpean múltiples enemigos',
      icon: '💥',
      tier: 3,
      apply: (player: Player) => {
        player.upgrades.push({
          id: 'area_damage_effect',
          name: 'Area Damage Active',
          description: '',
          icon: '',
          tier: 3,
          apply: () => {}
        });
      }
    },
    {
      id: 'critical_strike',
      name: 'Golpe Crítico',
      description: '20% probabilidad de x2 daño',
      icon: '💫',
      tier: 2,
      apply: (player: Player) => {
        player.upgrades.push({
          id: 'critical_effect',
          name: 'Critical Strike Active',
          description: '',
          icon: '',
          tier: 2,
          apply: () => {}
        });
      }
    }
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

  static getRandomUpgrades(count: number = 3, playerLevel: number): Upgrade[] {
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
        selected.push(availableUpgrades[index]);
      }
    }

    return selected;
  }

  static applyUpgrade(player: Player, upgrade: Upgrade): void {
    upgrade.apply(player);
    player.upgrades.push(upgrade);
  }

  static hasUpgradeEffect(player: Player, effectId: string): boolean {
    return player.upgrades.some(u => u.id === effectId);
  }
}

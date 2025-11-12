# 🎮 Saint Seiya - Arena Battle Game

Mini juego 2D tipo "arena battle" con ambientación de Saint Seiya, inspirado en Vampire Survivors.

## 🎯 Características Principales

### ✨ Mecánicas de Juego

- **Arena Battle**: Campo de batalla cerrado donde sobrevives oleadas infinitas de enemigos
- **Ataque Automático**: El jugador ataca automáticamente al enemigo más cercano dentro del rango
- **Sistema de Oleadas**: Enemigos aparecen progresivamente con más dificultad
- **Mejoras Temporales**: Al subir de nivel, elige entre 3 mejoras aleatorias
- **Sistema de Drops**: Los enemigos sueltan oro, gemas y experiencia al morir
- **Progresión Permanente**: (Próximamente) Mejoras que se mantienen entre partidas

### ⚔️ Tipos de Enemigos

1. **Melee** (Rojo): Enemigo cuerpo a cuerpo básico
2. **Fast** (Naranja): Rápido pero con poca vida
3. **Tank** (Rojo oscuro): Lento pero con mucha resistencia
4. **Ranged** (Coral): Ataca desde lejos
5. **Mini-Boss** (Carmesí): Aparece cada 5 oleadas, más fuerte
6. **Boss** (Púrpura): Aparece cada 10 oleadas, muy poderoso

### 💪 Mejoras Disponibles

#### Tier 1
- **Puño de Pegaso** 👊: +15% Daño
- **Velocidad de Meteoro** ⚡: +20% Velocidad de movimiento
- **Alcance Extendido** 🎯: +25% Rango de ataque
- **Combo Rápido** ⚔️: +30% Velocidad de ataque
- **Armadura Dorada** 🛡️: +50 HP máximos

#### Tier 2+
- **Cosmos Vampírico** 💉: Recupera 10% del daño como vida
- **Explosión de Cosmos** 💥: Ataques golpean múltiples enemigos
- **Golpe Crítico** 💫: 20% probabilidad de x2 daño

## 🎮 Controles

- **WASD** o **Flechas**: Mover al personaje
- **Ataque**: Automático cuando hay enemigos en rango
- **Mouse**: Click para seleccionar mejoras al subir de nivel

## 🚀 Ejecutar el Juego

### Requisitos Previos
- Node.js 16+ instalado
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build
```

## 📁 Estructura del Proyecto

```
src/
├── types/
│   └── game.ts              # Tipos e interfaces del juego
├── systems/
│   ├── PhysicsSystem.ts     # Sistema de física y colisiones
│   ├── CombatSystem.ts      # Sistema de combate y experiencia
│   ├── MovementSystem.ts    # Patrones de movimiento de enemigos
│   ├── WaveSystem.ts        # Generación de oleadas
│   └── UpgradeSystem.ts     # Sistema de mejoras
├── components/
│   ├── ArenaGame.tsx        # Componente principal del juego
│   ├── GameHUD.tsx          # HUD con stats del jugador
│   └── LevelUpMenu.tsx      # Menú de selección de mejoras
└── App.tsx                  # Selector de modo de juego
```

## 🎨 Características Técnicas

- **Framework**: React + TypeScript
- **Renderizado**: Canvas 2D nativo
- **Game Loop**: RequestAnimationFrame a 60 FPS
- **Sistema de Entidades**: ECS (Entity Component System)
- **Detección de Colisiones**: Circle-to-circle collision
- **Patrones de Movimiento**: Chase, Strafe, Circle, Zigzag

## 🔮 Próximas Características

- [ ] Sistema de mejoras permanentes (meta-progresión)
- [ ] Integración de sprites de MUGEN extraídos
- [ ] Efectos de partículas y animaciones
- [ ] Habilidades especiales con barra de Cosmos
- [ ] Múltiples personajes jugables (Seiya, Shiryu, Hyoga, etc.)
- [ ] Boss fights con mecánicas especiales
- [ ] Sistema de logros
- [ ] Leaderboards locales

## 🎯 Modos de Juego

### Arena Battle (Nuevo)
Sobrevive oleadas infinitas de enemigos, mejora tu personaje y alcanza el nivel máximo.

### Las 12 Casas (Clásico)
Atraviesa las 12 Casas del Santuario derrotando a los Caballeros de Oro.

## 👾 Créditos

- Sprites originales: MUGEN Community
- Concepto de juego: Inspirado en Vampire Survivors
- Temática: Saint Seiya (Caballeros del Zodíaco)

## 📝 Licencia

MIT License - Proyecto educativo y de práctica

---

**¡Que tu Cosmos arda con intensidad!** 🔥
# ss_minigame

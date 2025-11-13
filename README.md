# 🎮 Saint Seiya - Arena Battle Game

Mini juego 2D tipo "arena battle" con ambientación de Saint Seiya, inspirado en Vampire Survivors.

## 🎯 Características Principales

### ✨ Mecánicas de Juego

- **Arena Battle**: Mapa expandido (1600x1200) donde sobrevives oleadas infinitas de enemigos
- **Ataque Automático con Rango**: El jugador ataca automáticamente al enemigo más cercano dentro de 300 píxeles
- **Sistema de Oleadas Progresivo**: Enemigos aparecen cada vez más rápido (de 1.5s a 0.3s entre spawns)
- **Mejoras al Subir de Nivel**: Elige entre 3 mejoras aleatorias usando sistema de Cosmos
- **Sistema de Drops Variado**: Cosmos (azul), Health orbs (verde) y Magnet orbs (estrella dorada)
- **Efecto Magnet**: Atrae drops desde 400 píxeles durante 5 segundos
- **Sistema de Combo**: Multiplicador de experiencia que se pierde si no atacas por 3 segundos

### ⚔️ Tipos de Enemigos

1. **Normal** (Rojo): Enemigo básico, vida y velocidad moderadas
2. **Fast** (Morado): Muy rápido (1.5x) pero con poca vida
3. **Tank** (Gris): Lento (0.4x) pero con mucha resistencia
4. **Boss de Caballeros de Oro**: Aparece cada 5 oleadas completadas (25 enemigos), con patrones de ataque especiales

### 💪 Mejoras Disponibles

- **Daño** 👊: +10 daño base por nivel
- **Velocidad** ⚡: +0.5 velocidad de movimiento por nivel
- **Velocidad de Ataque** ⚔️: -50ms entre disparos por nivel
- **Multi-Shot** 🎯: +1 proyectil adicional por nivel
- **Pierce** 🔫: Los proyectiles atraviesan enemigos
- **Vida Máxima** 🛡️: +75 HP máximos por nivel
- **Explosión** 💥: Ataques golpean múltiples enemigos

## 🎮 Controles

- **WASD** o **Flechas**: Mover al personaje
- **Ataque**: Automático cuando hay enemigos dentro de 300 píxeles de rango
- **Mouse**: Click para seleccionar mejoras al subir de nivel

## 🎨 Sistema de Drops

- **Cosmos** (Orbe azul): Experiencia para subir de nivel (2-8 según tipo de enemigo)
- **Health Orb** (Cruz verde): Recupera 20 HP (4% de probabilidad)
- **Magnet Orb** (Estrella dorada): Atrae drops desde 400px durante 5s (1.5% de probabilidad)
- Los drops desaparecen después de 8-15 segundos si no se recogen

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
│   ├── CombatSystem.ts      # Sistema de combate con detección de rango
│   ├── SpriteSystem.ts      # Sistema de sprites y animaciones
│   ├── MovementSystem.ts    # Patrones de movimiento de enemigos
│   ├── WaveSystem.ts        # Generación de oleadas
│   ├── UpgradeSystem.ts     # Sistema de mejoras
│   ├── PhysicsSystem.ts     # Sistema de física y colisiones
│   └── Player.ts            # Sistema del jugador
├── components/
│   ├── SaintSeiyaGame.tsx   # Juego principal (modo Las 12 Casas)
│   ├── ArenaGame.tsx        # Modo Arena Battle
│   ├── GameHUD.tsx          # HUD con stats del jugador
│   └── LevelUpMenu.tsx      # Menú de selección de mejoras
├── data/
│   └── gameData.ts          # Datos de caballeros, santos de oro y mejoras
├── core/
│   └── Combat.ts            # Core del sistema de combate
└── App.tsx                  # Selector de modo de juego
```

## 🎨 Características Técnicas

- **Framework**: React + TypeScript + Vite
- **Renderizado**: Canvas 2D nativo con doble buffer
- **Game Loop**: RequestAnimationFrame con deltaTime para movimiento suave
- **Sistema de Cámara**: Sigue al jugador suavemente en mapa 1600x1200
- **Sistema de Sprites**: Animaciones con frames múltiples (idle, walk, attack)
- **Sistema de Combate**: Detección de rango (300px) con efectos visuales
- **Sistema de Advertencias**: Pre-spawn warnings (800ms) con indicadores visuales
- **Detección de Colisiones**: Distancia euclidiana para proyectiles y enemigos
- **Screen Shake**: Efecto visual al recibir daño
- **Sistema de Oleadas**: Progresión dinámica con escalado de dificultad

## 🔮 Características Implementadas

- ✅ Sistema de sprites animados con frames múltiples
- ✅ Mapa expandido con sistema de cámara
- ✅ Sistema de combate con rango limitado
- ✅ Oleadas progresivas con escalado dinámico
- ✅ Sistema de drops variado (Cosmos, Health, Magnet)
- ✅ Efecto Magnet temporal
- ✅ Sistema de combo con multiplicador
- ✅ Boss fights con patrones de ataque (cada 5 oleadas)
- ✅ Screen shake al recibir daño
- ✅ Advertencias de spawn pre-visualizadas

## 🔮 Mejoras Futuras

- [ ] Sistema de mejoras permanentes (meta-progresión)
- [ ] Más sprites de MUGEN para enemigos y bosses
- [ ] Efectos de partículas mejorados
- [ ] Habilidades especiales con barra de Cosmos
- [ ] Múltiples personajes jugables con diferentes habilidades
- [ ] Sistema de logros
- [ ] Música y efectos de sonido
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

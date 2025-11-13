# Estructura de Assets

Esta carpeta contiene todos los recursos del juego organizados según las mejores prácticas.

## Estructura

```
assets/
├── audio/                    # Archivos de audio
│   └── bgm/                 # Background Music (música de fondo)
│       └── menu.mp3         # Música del menú principal
│
├── images/                   # Imágenes generales
│   └── backgrounds/         # Fondos de pantalla
│       └── main.jpg         # Fondo del menú principal
│
└── sprites/                  # Sprites del juego
    ├── characters/          # Personajes
    │   ├── seiya/          # Sprites del jugador (Seiya)
    │   │   ├── player_idle.png
    │   │   ├── player_walk_1.png
    │   │   ├── player_walk_2.png
    │   │   ├── player_attack_1.png
    │   │   ├── player_attack_2.png
    │   │   ├── player_attack_3.png
    │   │   └── player_attack_4.png
    │   │
    │   ├── enemy_1/        # Sprites del enemigo básico
    │   │   ├── enemy_walk_2.png
    │   │   ├── enemy_walk_3.png
    │   │   └── enemy_walk_4.png
    │   │
    │   └── boss/           # Sprites del boss
    │       ├── boss_walk_1.png
    │       ├── boss_walk_2.png
    │       ├── boss_walk_3.png
    │       └── boss_walk_4.png
    │
    ├── attacks/             # Efectos de ataque
    │   ├── attack_1.png
    │   ├── boss_attack.png
    │   ├── boss_super_attack1.png
    │   ├── boss_super_attack2.png
    │   └── boss_super_attack3.png
    │
    └── stages/              # Elementos de escenarios
        └── floor_1_stage.png
```

## Convenciones de Nomenclatura

### Audio
- **BGM (Background Music)**: `[ubicacion].mp3` (ej: `menu.mp3`, `battle.mp3`)
- **SFX (Sound Effects)**: `[accion]_[variante].mp3` (ej: `hit_1.mp3`, `jump.mp3`)

### Sprites
- **Personajes**: `[nombre]_[accion]_[frame].png`
  - Ejemplo: `player_walk_1.png`, `boss_attack_2.png`
  
- **Ataques**: `[origen]_[tipo]_[frame].png`
  - Ejemplo: `boss_super_attack1.png`, `attack_1.png`

- **Escenarios**: `[elemento]_[numero]_[variante].png`
  - Ejemplo: `floor_1_stage.png`, `wall_2_castle.png`

### Imágenes
- **Backgrounds**: `[ubicacion].jpg/png`
  - Ejemplo: `main.jpg`, `credits.png`

## Mejores Prácticas

1. **Organización por Tipo**: Separar audio, imágenes y sprites
2. **Subcategorías Claras**: Cada tipo tiene su propia subcarpeta lógica
3. **Nombres Descriptivos**: Usar snake_case para claridad
4. **Formatos Apropiados**:
   - JPG para backgrounds (mejor compresión)
   - PNG para sprites (transparencia)
   - MP3 para audio (buen balance calidad/tamaño)

## Agregar Nuevos Assets

### Nuevo Personaje
```
assets/sprites/characters/[nombre]/
├── [nombre]_idle.png
├── [nombre]_walk_1.png
└── [nombre]_attack_1.png
```

### Nueva Música
```
assets/audio/bgm/[nombre].mp3
```

### Nuevo Background
```
assets/images/backgrounds/[nombre].jpg
```

## Notas Importantes

- Todos los paths en el código usan `import.meta.env.BASE_URL` para compatibilidad con GitHub Pages
- La carpeta `public/` se copia tal cual al build de Vite
- No uses rutas absolutas tipo `/assets/...`, siempre usa la variable de entorno

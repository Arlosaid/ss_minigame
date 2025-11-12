# Sistema de Sprites - Saint Seiya Game

## 📁 Estructura de Sprites

Los sprites se almacenan en `public/sprites/` y se cargan automáticamente en el juego.

### Sprites del Jugador

Los sprites del jugador deben estar nombrados de la siguiente manera:

```
public/sprites/
├── player_idle.png          # Pose de reposo
├── player_walk_1.png         # Frame 1 de caminar
├── player_walk_2.png         # Frame 2 de caminar
├── player_attack_1.png       # Frame 1 de ataque
├── player_attack_2.png       # Frame 2 de ataque
└── ...
```

### Animaciones Disponibles

- **idle**: Cuando el personaje está quieto
- **walk**: Cuando se mueve con WASD/Flechas
- **attack**: Cuando está atacando

## 🎨 Cómo Agregar Más Sprites

### Método 1: Script PowerShell (Recomendado)

```powershell
# Copiar sprites de un personaje específico
.\copy-sprites.ps1 -Character "Milo"

# Copiar sprites de otro personaje
.\copy-sprites.ps1 -Character "Seiya"
```

### Método 2: Manual

1. Ve a `c:\Users\Alonso\Desktop\sprites\[Personaje]\`
2. Busca los sprites que necesitas (ej: `group_0_index_0.png`)
3. Cópialos a `public/sprites/`
4. Renómbralos según la convención (ej: `player_idle.png`)

### Método 3: Extractor de SFF

Si tienes archivos `.sff` de MUGEN:

```powershell
python "c:\Users\Alonso\Desktop\extract_sff.py" -i "ruta\personaje" -o "ruta\salida"
```

## 🔧 Configuración de Animaciones

Para agregar más frames a una animación, edita `src/systems/SpriteSystem.ts`:

```typescript
// Ejemplo: Agregar más frames de caminar
const walkFrames = await SpriteManager.loadMultiple([
  '/sprites/player_walk_1.png',
  '/sprites/player_walk_2.png',
  '/sprites/player_walk_3.png',  // Nuevo frame
  '/sprites/player_walk_4.png'   // Nuevo frame
]);
```

## 📐 Tamaño de Sprites

- Los sprites se escalan automáticamente según el tamaño del personaje
- Tamaño actual: `player.size * 3` (75px si size = 25)
- Para cambiar el tamaño, modifica el factor multiplicador en `ArenaGame.tsx`:

```typescript
const spriteWidth = state.player.size * 3;  // Cambiar el 3 por otro valor
const spriteHeight = state.player.size * 3;
```

## 🎭 Agregar Enemigos con Sprites Diferentes

Para usar sprites diferentes para cada tipo de enemigo:

1. Copia los sprites del enemigo a `public/sprites/enemy_[tipo]_idle.png`
2. Modifica `createEnemySprite()` en `SpriteSystem.ts`:

```typescript
export async function createEnemySprite(type: string): Promise<AnimatedSprite> {
  const sprite = new AnimatedSprite();
  
  const frames = await SpriteManager.loadMultiple([
    `/sprites/enemy_${type}_idle.png`  // Carga según tipo
  ]);
  
  // ... resto del código
}
```

## 🐛 Troubleshooting

### Los sprites no aparecen
1. Verifica que los archivos estén en `public/sprites/`
2. Abre la consola del navegador (F12) y busca errores
3. Asegúrate de que los nombres coincidan exactamente

### Los sprites se ven cortados
- Ajusta los valores de `spriteWidth` y `spriteHeight` en el renderizado

### Los sprites están volteados
- El sistema automáticamente voltea el sprite según la dirección
- Para desactivar: elimina las líneas con `sprite.flipX`

## 📝 Personajes Disponibles

Actualmente en la carpeta de sprites:
- Milo (implementado)
- [Agrega más personajes copiando sus sprites]

## 🎮 Velocidad de Animación

Para cambiar la velocidad de las animaciones, modifica el `frameRate`:

```typescript
sprite.addAnimation('walk', {
  frames: walkFrames,
  frameRate: 8,  // Más alto = más rápido
  loop: true
});
```

## 💡 Tips

- Los sprites de MUGEN suelen tener transparencia, ideal para el juego
- Usa sprites de la misma resolución para mantener consistencia visual
- Los frames de ataque pueden ser más largos (más frames) para mejores animaciones
- Considera agregar efectos de sombra debajo de los personajes para mejor visualización

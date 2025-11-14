# Fix: Boss Sprite Not Visible

## Fecha
14 de Noviembre, 2025

## Problema
El sprite del boss no era visible en el juego, aunque los logs mostraban que:
- El sprite se cargaba correctamente
- El boss se spawneaba correctamente
- Las animaciones existían y los frames estaban completos

## Causa Raíz
**React Closure Problem con useEffect y deps vacías**

El `gameLoop` está definido dentro de un `useEffect` con dependencias vacías `[]`:

```typescript
useEffect(() => {
  const gameLoop = (currentTime: number) => {
    // ... código del game loop
    
    // ❌ PROBLEMA: Usaba 'boss' directamente
    if (boss) {
      boss.sprite.draw(...);
    }
  };
  
  gameLoop();
}, []); // ← Dependencias vacías capturan valores iniciales
```

Cuando un `useEffect` tiene dependencias vacías, el closure captura los valores **iniciales** de las variables de estado. Como `boss` comienza en `null`, el closure siempre ve `boss` como `null`, incluso después de que el estado se actualiza con `setBoss()`.

## Síntomas
1. Logs mostraban: "Boss sprite created" con sprite válido
2. Logs mostraban: "Spawning boss with sprite" con AnimatedSprite correcto
3. Pero el código de renderizado nunca ejecutaba `if (boss)` porque `boss` era `null` en el closure
4. No se dibujaba el sprite ni el fallback visual del boss

## Solución
Usar `bossRef.current` en lugar de la variable de estado `boss` dentro del `gameLoop`:

```typescript
// ✅ SOLUCIÓN: Usar ref en lugar de state
const boss = bossRef.current; // Siempre obtiene el valor actual
if (boss) {
  boss.sprite.draw(...);
}
```

Los refs no tienen este problema porque `bossRef.current` siempre apunta al valor más reciente, no al valor capturado en el closure.

## Cambios Realizados

### 1. Renderizado del Boss (línea ~2061)
```typescript
// Antes
if (boss) {
  // boss era null capturado del closure
}

// Después
const boss = bossRef.current; // Obtener valor actual
if (boss) {
  // Ahora boss tiene el valor correcto
}
```

### 2. HUD del Boss (línea ~2465)
```typescript
// Antes
let timeColor = '#FFF';
if (boss) { // boss era null
  timeColor = '#FF0000';
}

// Después
// Reutiliza la variable boss declarada arriba
let timeColor = '#FFF';
if (boss) { // Ahora funciona correctamente
  timeColor = '#FF0000';
}
```

### 3. Prevención de Spawn Prematuro
También se añadió validación para no spawnear el boss si el sprite no está listo:

```typescript
const spawnBoss = useCallback(() => {
  const currentBossSprite = bossSpritesRef.current;
  
  // No spawner el boss si el sprite aún no está cargado
  if (!currentBossSprite) {
    console.log('Boss sprite not ready yet, waiting...');
    return;
  }
  
  // Spawnear con sprite garantizado
  setBoss({
    // ...
    sprite: currentBossSprite, // Ya no necesita || undefined
  });
}, [currentHouse]);
```

## Lecciones Aprendidas

### Patrón de useEffect con Game Loop
Cuando se usa un game loop en `useEffect` con `[]`:
- ✅ **USAR**: Refs para valores que cambian (`xxxRef.current`)
- ❌ **EVITAR**: Variables de estado directamente (quedan capturadas)

### Patrón Correcto
```typescript
// Estado y Ref sincronizados
const [boss, setBoss] = useState<Boss | null>(null);
const bossRef = useRef<Boss | null>(null);

useEffect(() => {
  bossRef.current = boss;
}, [boss]);

// En el game loop: usar REF
useEffect(() => {
  const gameLoop = () => {
    const currentBoss = bossRef.current; // ✅ Siempre actualizado
    if (currentBoss) {
      // ...
    }
  };
}, []); // Deps vacías OK porque usamos refs
```

## Testing
Después del fix:
- ✅ El boss aparece visualmente en pantalla
- ✅ El sprite se renderiza correctamente
- ✅ Las animaciones funcionan (idle, walk, attack)
- ✅ El HUD muestra el nombre del boss
- ✅ La barra de vida del boss es visible

## Archivos Modificados
- `src/components/SaintSeiyaGame.tsx`
  - Línea ~2061: Declaración de `const boss = bossRef.current`
  - Línea ~2465: Eliminada redeclaración duplicada
  - Línea ~500: Validación de sprite antes de spawn

## Referencias
- Similar a: `RACE_CONDITION_FIX.md` (problema de closures con refs)
- Relacionado con: `BOSS_SPRITE_FIX.md` (carga de sprites del boss)

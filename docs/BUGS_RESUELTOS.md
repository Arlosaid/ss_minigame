# 🐛 Bugs Resueltos - Documentación de Errores Complejos

Este documento registra bugs difíciles de encontrar y sus soluciones para referencia futura.

---

## 🏹 Bug: Flecha de Oro no hace daño a los enemigos (Noviembre 2025)

### Síntomas
- Las flechas se disparan correctamente ✅
- Las flechas impactan visualmente en los enemigos ✅
- El callback `onDamage` se ejecuta ✅
- Los enemigos NO mueren ni pierden salud real ❌
- Los logs muestran salud negativa pero los enemigos persisten
- El contador de enemigos sigue creciendo (8, 9, 10, 11...)

### Causa Raíz
**Race condition en la sincronización entre estado React y refs**

1. **Callback duplicado**: Había dos callbacks de daño compitiendo:
   - Uno en `triggerGoldenArrow` (al disparar) - NO DEBÍA EXISTIR
   - Otro en `updateGoldenArrows` (al impactar) - EL CORRECTO

2. **useEffect problemático**: 
   ```typescript
   useEffect(() => {
     enemiesRef.current = enemies;
   }, [enemies]);
   ```
   Este efecto sobrescribía las eliminaciones manuales del ref.

3. **Desincronización del gameLoop**:
   - Se capturaba `currentEnemies` al inicio del frame
   - Las flechas eliminaban enemigos de `enemiesRef.current`
   - Pero `movedEnemies` se construía desde `currentEnemies` (aún con enemigos muertos)
   - Las eliminaciones nunca se reflejaban en el próximo frame

4. **Actualizaciones async de estado**: `setEnemies()` no actualiza inmediatamente, causando que el próximo frame vea datos desactualizados.

### Solución Implementada

#### 1. Eliminar callback duplicado (PowerSystem.ts)
```typescript
// ANTES: Callback que hacía daño (INCORRECTO)
PowerSystem.triggerGoldenArrow(x, y, level, enemies, (enemyId, damage) => {
  // Código de daño aquí - NO DEBERÍA EXISTIR
});

// DESPUÉS: Callback vacío (CORRECTO)
PowerSystem.triggerGoldenArrow(x, y, level, enemies, () => {});
```

#### 2. Desactivar useEffect de sincronización (SaintSeiyaGame.tsx)
```typescript
// Comentar este useEffect para evitar sobrescrituras
// useEffect(() => {
//   enemiesRef.current = enemies;
// }, [enemies]);
```

#### 3. Actualización por lotes (SaintSeiyaGame.tsx)
```typescript
// Recopilar enemigos eliminados durante el frame
const arrowKilledEnemies = new Set<number>();
PowerSystem.updateGoldenArrows(deltaTime, currentEnemies, (enemyId, damage) => {
  const enemy = currentEnemies[enemyIndex];
  const newHealth = enemy.health - damage;
  
  if (newHealth <= 0) {
    arrowKilledEnemies.add(enemyId); // Marcar para eliminar
    // Crear drops, actualizar score, etc.
  } else {
    currentEnemies[enemyIndex] = { ...enemy, health: newHealth };
  }
});

// Aplicar eliminaciones AL FINALIZAR updateGoldenArrows
if (arrowKilledEnemies.size > 0) {
  enemiesRef.current = currentEnemies.filter(e => !arrowKilledEnemies.has(e.id));
} else {
  enemiesRef.current = currentEnemies;
}
```

#### 4. Usar ref actualizado en movimiento (SaintSeiyaGame.tsx)
```typescript
// ANTES: Usaba currentEnemies capturado al inicio
for (const enemy of currentEnemies) { ... }

// DESPUÉS: Usa enemiesRef.current con eliminaciones aplicadas
for (const enemy of enemiesRef.current) { ... }
```

#### 5. Sincronización manual en spawns (SaintSeiyaGame.tsx)
```typescript
// Actualizar AMBOS ref y estado al spawnear
setEnemies(e => {
  const newEnemies = [...e, enemy];
  enemiesRef.current = newEnemies; // Sincronizar manualmente
  return newEnemies;
});
```

### Lecciones Aprendidas

1. **Race conditions con React state + refs**: Cuando se mezclan estados y refs, siempre actualizar ambos manualmente en el mismo lugar.

2. **useEffect puede causar loops**: Un useEffect que sincroniza ref ↔ state puede crear ciclos infinitos o sobrescribir datos.

3. **Captura de variables en gameLoop**: Variables capturadas al inicio del frame pueden quedar desactualizadas durante el frame.

4. **Actualizaciones por lotes**: En game loops, mejor recopilar cambios en estructuras temporales y aplicarlos todos al final del frame.

5. **Timing de actualizaciones**: `setState` es asíncrono - si necesitas acceso inmediato, usa refs.

### Archivos Modificados
- `src/systems/PowerSystem.ts`: Eliminación de logs, sin cambios funcionales
- `src/components/SaintSeiyaGame.tsx`: Reestructuración completa del manejo de enemigos

### Tiempo de Debugging
~1 hora (múltiples intentos con diferentes enfoques)

---

## 📝 Template para Futuros Bugs

### Síntomas
- Descripción del comportamiento visible

### Causa Raíz
- Explicación técnica del problema

### Solución Implementada
- Código antes/después
- Pasos de la solución

### Lecciones Aprendidas
- Principios para evitar el problema en el futuro

### Archivos Modificados
- Lista de archivos cambiados

### Tiempo de Debugging
- Tiempo estimado

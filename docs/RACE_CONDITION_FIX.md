# Fix: Race Condition en Sistema de Disparo

## Problema Identificado

El personaje estaba disparando **múltiples proyectiles** cuando debería disparar solo uno. Esto ocurría incluso con `multiShot = 0`.

### Causa Raíz: Race Condition con useState

El problema era que `lastShot` se manejaba con `useState`, que actualiza de forma **asíncrona**:

```typescript
// ❌ CÓDIGO ANTERIOR (CON BUG)
const [lastShot, setLastShot] = useState(0);

// En el gameLoop:
if (nowShoot - lastShot >= cooldownTime) {
  // Dispara proyectil
  setLastShot(nowShoot); // ⚠️ Actualización ASÍNCRONA
}
```

### Secuencia del Bug

1. **Frame 1**: El gameLoop verifica `if (now - lastShot >= cooldown)` → `true`
2. **Frame 1**: Crea proyectiles y llama `setLastShot(now)`
3. **Frame 2**: El estado **aún no se ha actualizado**, entonces `lastShot` todavía tiene el valor viejo
4. **Frame 2**: Verifica `if (now - lastShot >= cooldown)` → ¡`true` otra vez! 
5. **Frame 2**: Crea **MÁS proyectiles duplicados**
6. **Frame 3+**: El estado finalmente se actualiza, pero ya se crearon proyectiles duplicados

Este bug era más visible en:
- Computadoras rápidas (más frames por segundo)
- Cuando el juego tenía alta carga (más tiempo de procesamiento entre frames)

## Solución Implementada

Cambiar `lastShot` de `useState` a `useRef`, que se actualiza **instantáneamente y sincrónicamente**:

```typescript
// ✅ CÓDIGO CORREGIDO
const lastShotRef = useRef<number>(0);

// En el gameLoop:
if (nowShoot - lastShotRef.current >= cooldownTime) {
  // Dispara proyectil
  lastShotRef.current = nowShoot; // ✅ Actualización INMEDIATA
}
```

### Cambios Aplicados

1. **Eliminado**: `const [lastShot, setLastShot] = useState(0);`
2. **Agregado**: `const lastShotRef = useRef<number>(0);`
3. **Actualizado**: Todas las referencias a `lastShot` → `lastShotRef.current`
4. **Actualizado**: Todas las llamadas a `setLastShot(value)` → `lastShotRef.current = value`

### Archivos Modificados

- `src/components/SaintSeiyaGame.tsx`
  - Línea ~158: Eliminado useState
  - Línea ~207: Agregado useRef
  - Línea ~524: Actualizado en función `shoot()`
  - Línea ~934: Actualizado en gameLoop inline
  - Línea ~959: Actualizado asignación directa
  - Línea ~591: Eliminado de dependencias de useCallback

## Mejoras Adicionales

### 1. Claridad en el Sistema de MultiShot

```typescript
// 0 = 1 proyectil base, 1 = 2 proyectiles, 2 = 3 proyectiles, etc.
const shots = 1 + currentUpgrades.multiShot;
```

### 2. Proyectil se Destruye al Primer Impacto

```typescript
for (const enemy of movedEnemies) {
  const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
  if (dist < PROJECTILE_CONFIG.PLAYER_PROJECTILE_HIT_RADIUS) {
    projectileHit = true; // Marcar impacto
    // ... aplicar daño ...
    break; // ✅ IMPORTANTE: Salir inmediatamente
  }
  
  // Salir si ya impactó
  if (projectileHit) break;
}
```

### 3. Trail Visual Reducido

Se redujo el trail visual de 2 círculos a 1 círculo más pequeño y menos opaco para evitar confusión visual:

```typescript
// Trail de solo 1 círculo (reducido para mayor claridad visual)
ctx.globalAlpha = 0.2;
ctx.fillStyle = proj.color;
const trailX = proj.x - proj.dx * 2;
const trailY = proj.y - proj.dy * 2;
ctx.beginPath();
ctx.arc(trailX, trailY, 3, 0, Math.PI * 2);
ctx.fill();
ctx.globalAlpha = 1;
```

## Garantías Post-Fix

1. ✅ Solo se crea **1 proyectil** cuando `multiShot = 0`
2. ✅ Cada proyectil se destruye al impactar **1 enemigo**
3. ✅ No hay duplicación por race conditions
4. ✅ El sistema funciona correctamente incluso en hardware rápido

## Lecciones Aprendidas

### Cuándo Usar useRef vs useState

**Usa `useRef` cuando:**
- Necesitas valores que se actualizan inmediatamente
- El valor se usa en loops/callbacks de alta frecuencia (como gameLoop)
- El valor no debe causar re-renders
- Necesitas evitar race conditions

**Usa `useState` cuando:**
- El valor debe causar re-render del componente
- El valor se muestra en la UI
- La actualización asíncrona es aceptable

### Valores Críticos para useRef en Game Loops

En el juego, estos valores usan `useRef` para evitar race conditions:
- `lastShotRef` - Cooldown de disparo
- `lastLightningTrigger` - Cooldown de rayos
- `lastGoldenArrowTrigger` - Cooldown de flechas doradas
- `enemiesRef` - Array de enemigos (actualización inmediata)
- `projectilesRef` - Array de proyectiles (actualización inmediata)
- `keysRef` - Teclas presionadas
- `upgradesRef` - Upgrades del jugador

## Testing

Para verificar que el fix funciona correctamente:

1. Iniciar el juego sin upgrades de `multiShot`
2. Observar que solo sale **1 proyectil** por disparo
3. Verificar en consola del navegador que no hay logs de múltiples disparos
4. Confirmar que cada proyectil impacta a un solo enemigo y desaparece

## Referencias

- Commit: fix-jugabilidad branch
- Fecha: 14 de noviembre, 2025
- Issue: Múltiples proyectiles disparándose simultáneamente
- Tipo: Race Condition / Estado Asíncrono

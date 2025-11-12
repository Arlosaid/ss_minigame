# Sistema de Combate con Rango Limitado

## 📋 Resumen

Se implementó un sistema de combate mejorado que solo ataca enemigos dentro de un rango específico, con efectos visuales y detección inteligente del enemigo más cercano.

## 🎯 Características Implementadas

### 1. **Detección de Enemigos por Rango**
- Rango de ataque: **300 píxeles** (configurable)
- Solo ataca al enemigo más cercano dentro del rango
- Si no hay enemigos en rango, no se dispara

### 2. **Sistema de Combate (`/src/core/Combat.ts`)**

#### Funciones Principales:

```typescript
// Calcula la distancia entre dos puntos
CombatSystem.calculateDistance(pos1, pos2): number

// Encuentra el enemigo más cercano en rango
CombatSystem.findNearestEnemy(player, enemies, attackRange): Enemy | null

// Realiza un ataque al enemigo más cercano
CombatSystem.attack(player, enemies, damage, attackRange): Enemy | null

// Dibuja efectos visuales de ataque
CombatSystem.drawAttackEffects(ctx): void

// Actualiza y limpia efectos expirados
CombatSystem.updateAttackEffects(): void
```

### 3. **Efectos Visuales**

El sistema incluye efectos visuales impresionantes:

- **Línea dorada** desde el jugador hasta el enemigo atacado
- **Destello en el punto de impacto** con gradiente radial
- **Fade out automático** (150ms de duración)
- **Múltiples efectos simultáneos** si hay multishot

### 4. **Integración en el Game Loop**

#### En `SaintSeiyaGame.tsx`:

```typescript
// En la función shoot():
const attackRange = 300; // Rango de ataque

// Encontrar enemigo más cercano
const nearestEnemy = CombatSystem.findNearestEnemy(
  { x: player.x, y: player.y },
  enemies,
  attackRange
);

// Si no hay enemigo en rango, no disparar
if (!target) {
  return;
}

// Crear efecto visual
CombatSystem.createAttackEffect(
  { x: player.x, y: player.y }, 
  target
);
```

#### En el render loop:

```typescript
// Actualizar efectos (limpiar expirados)
CombatSystem.updateAttackEffects();

// Dibujar efectos visuales
CombatSystem.drawAttackEffects(ctx);
```

## 🔧 Cómo Funciona

### Cálculo de Distancia
```typescript
// Fórmula: √((x2-x1)² + (y2-y1)²)
const dx = pos2.x - pos1.x;
const dy = pos2.y - pos1.y;
return Math.sqrt(dx * dx + dy * dy);
```

### Detección de Enemigo Más Cercano
1. Itera sobre todos los enemigos
2. Calcula la distancia de cada uno al jugador
3. Solo considera enemigos dentro del `attackRange`
4. Retorna el más cercano o `null` si no hay ninguno en rango

### Priorización de Boss
- Si hay un boss en rango, se prioriza sobre enemigos normales
- El boss se considera si está dentro del `attackRange`

## 🎨 Efectos Visuales

### Componentes del Efecto:
1. **Línea de Ataque**: Color dorado (#FFD700), grosor 3px
2. **Destello**: Gradiente radial que se expande y desvanece
3. **Opacidad**: Disminuye gradualmente según el tiempo transcurrido
4. **Duración**: 150 milisegundos por defecto

## 📊 Ventajas del Nuevo Sistema

✅ **Más estratégico**: El jugador debe acercarse a los enemigos
✅ **Más justo**: No ataca enemigos al otro lado de la pantalla
✅ **Mejor feedback visual**: Efectos muestran claramente qué enemigo fue atacado
✅ **Código organizado**: Lógica de combate en módulo separado
✅ **Fácil de ajustar**: Rango configurable con una variable

## 🔄 Diferencias con el Sistema Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Rango** | Ilimitado | 300 píxeles |
| **Objetivo** | Cualquier enemigo | Solo los más cercanos |
| **Sin enemigos** | Dispara hacia arriba | No dispara |
| **Efectos visuales** | Ninguno | Línea y destello |
| **Organización** | En componente | Módulo separado |

## 🎮 Cómo Ajustar el Comportamiento

### Cambiar el rango de ataque:
```typescript
// En SaintSeiyaGame.tsx, función shoot()
const attackRange = 300; // Cambia este valor
```

### Cambiar duración del efecto visual:
```typescript
// En Combat.ts, método createAttackEffect()
duration: 150 // Cambia a los milisegundos deseados
```

### Cambiar color del efecto:
```typescript
// En Combat.ts, método drawAttackEffects()
ctx.strokeStyle = '#FFD700'; // Cambia el color aquí
```

## 🐛 Debugging

Para ver el rango de ataque visualmente (útil para desarrollo):
```typescript
// En el render loop:
CombatSystem.drawAttackRange(ctx, player, 300, 0.15);
```

Esto dibuja un círculo punteado alrededor del jugador mostrando el rango efectivo de ataque.

## 📝 Notas Técnicas

- El sistema usa `requestAnimationFrame` para animaciones fluidas
- Los efectos se limpian automáticamente para evitar acumulación de memoria
- El sistema es compatible con multishot (múltiples proyectiles)
- Los proyectiles mantienen su lógica de colisión independiente

## 🚀 Mejoras Futuras Sugeridas

1. **Diferentes rangos por caballero**: Cada knight podría tener su propio attackRange
2. **Mejora de rango**: Upgrade que aumenta el attackRange
3. **Efectos según tipo de ataque**: Diferentes colores/estilos por knight
4. **Sonidos**: Agregar efectos de sonido cuando se ataca
5. **Daño variable por distancia**: Más daño a menor distancia

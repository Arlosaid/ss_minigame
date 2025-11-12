/**
 * EJEMPLO DE USO DEL SISTEMA DE COMBATE
 * 
 * Este archivo muestra cómo integrar el CombatSystem en un game loop
 */

import { CombatSystem } from './core/Combat';

// ============================================
// 1. CONFIGURACIÓN INICIAL
// ============================================

interface Player {
  x: number;
  y: number;
  health: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  // ... otros campos
}

// ============================================
// 2. DETECCIÓN DE ENEMIGO MÁS CERCANO
// ============================================

function findTargetExample(player: Player, enemies: Enemy[]): void {
  const attackRange = 300; // píxeles
  
  // Buscar enemigo más cercano en rango
  const target = CombatSystem.findNearestEnemy(
    { x: player.x, y: player.y },
    enemies,
    attackRange
  );
  
  if (target) {
    console.log(`Enemigo encontrado a ${
      CombatSystem.calculateDistance(player, target)
    } píxeles`);
  } else {
    console.log('No hay enemigos en rango');
  }
}

// ============================================
// 3. ATAQUE SIMPLE
// ============================================

function simpleAttackExample(player: Player, enemies: Enemy[]): void {
  const damage = 10;
  const attackRange = 300;
  
  // Atacar al enemigo más cercano
  const hitEnemy = CombatSystem.attack(
    { x: player.x, y: player.y },
    enemies,
    damage,
    attackRange
  );
  
  if (hitEnemy) {
    console.log(`¡Golpeaste al enemigo ${hitEnemy.id}!`);
    
    // Eliminar enemigo si murió
    if (hitEnemy.health <= 0) {
      const index = enemies.findIndex(e => e.id === hitEnemy.id);
      if (index !== -1) {
        enemies.splice(index, 1);
      }
    }
  }
}

// ============================================
// 4. ATAQUE CON COOLDOWN (Recomendado)
// ============================================

function attackWithCooldown(player: Player, enemies: Enemy[]): void {
  const result = CombatSystem.autoAttack(
    { x: player.x, y: player.y },
    enemies,
    player.damage,
    player.attackRange,
    player.lastAttackTime,
    player.attackCooldown
  );
  
  // Actualizar tiempo de último ataque
  player.lastAttackTime = result.newLastAttackTime;
  
  if (result.attacked && result.target) {
    console.log(`¡Ataque exitoso! HP restante: ${result.target.health}`);
    
    // Eliminar enemigo si murió
    if (result.target.health <= 0) {
      const index = enemies.findIndex(e => e.id === result.target!.id);
      if (index !== -1) {
        enemies.splice(index, 1);
        console.log(`¡Enemigo ${result.target.id} eliminado!`);
      }
    }
  }
}

// ============================================
// 5. INTEGRACIÓN EN GAME LOOP
// ============================================

function gameLoop(
  player: Player,
  enemies: Enemy[],
  ctx: CanvasRenderingContext2D
): void {
  // 1. Actualizar efectos (limpiar los expirados)
  CombatSystem.updateAttackEffects();
  
  // 2. Lógica de ataque
  attackWithCooldown(player, enemies);
  
  // 3. Renderizar
  render(ctx, player, enemies);
}

function render(
  ctx: CanvasRenderingContext2D,
  player: Player,
  enemies: Enemy[]
): void {
  // Limpiar canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 800, 600);
  
  // Dibujar jugador
  ctx.fillStyle = '#0F0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Dibujar enemigos
  enemies.forEach(enemy => {
    ctx.fillStyle = '#F00';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Dibujar efectos de ataque
  CombatSystem.drawAttackEffects(ctx);
  
  // (Opcional) Dibujar rango de ataque para debug
  // CombatSystem.drawAttackRange(ctx, player, player.attackRange, 0.1);
}

// ============================================
// 6. EJEMPLO COMPLETO CON REACT
// ============================================

function useGameLoop(
  player: Player | null,
  enemies: Enemy[],
  canvasRef: React.RefObject<HTMLCanvasElement>
): void {
  React.useEffect(() => {
    if (!player || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const loop = () => {
      // Actualizar efectos
      CombatSystem.updateAttackEffects();
      
      // Ataque automático
      const result = CombatSystem.autoAttack(
        { x: player.x, y: player.y },
        enemies,
        player.damage,
        player.attackRange,
        player.lastAttackTime,
        player.attackCooldown
      );
      
      if (result.attacked) {
        player.lastAttackTime = result.newLastAttackTime;
      }
      
      // Renderizar
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 800, 600);
      
      // Dibujar jugador
      ctx.fillStyle = '#0F0';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Dibujar enemigos
      enemies.forEach(enemy => {
        ctx.fillStyle = '#F00';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Dibujar efectos
      CombatSystem.drawAttackEffects(ctx);
      
      animationId = requestAnimationFrame(loop);
    };
    
    loop();
    
    return () => {
      cancelAnimationFrame(animationId);
      CombatSystem.clearEffects();
    };
  }, [player, enemies]);
}

// ============================================
// 7. VERIFICAR SI HAY ENEMIGOS EN RANGO
// ============================================

function checkEnemiesInRange(player: Player, enemies: Enemy[]): boolean {
  const target = CombatSystem.findNearestEnemy(
    { x: player.x, y: player.y },
    enemies,
    player.attackRange
  );
  
  return target !== null;
}

// ============================================
// 8. OBTENER DISTANCIA AL ENEMIGO MÁS CERCANO
// ============================================

function getDistanceToNearestEnemy(
  player: Player,
  enemies: Enemy[]
): number | null {
  const target = CombatSystem.findNearestEnemy(
    { x: player.x, y: player.y },
    enemies,
    Infinity // Sin límite de rango para encontrar el más cercano
  );
  
  if (!target) return null;
  
  return CombatSystem.calculateDistance(
    { x: player.x, y: player.y },
    { x: target.x, y: target.y }
  );
}

// ============================================
// 9. PERSONALIZACIÓN DE EFECTOS
// ============================================

function customAttackEffect(
  player: Player,
  enemy: Enemy,
  color: string = '#FFD700'
): void {
  // Crear efecto personalizado
  CombatSystem.createAttackEffect(
    { x: player.x, y: player.y },
    { x: enemy.x, y: enemy.y }
  );
  
  // Nota: Para cambiar el color, modifica Combat.ts directamente
}

// ============================================
// EXPORTAR EJEMPLOS
// ============================================

export {
  findTargetExample,
  simpleAttackExample,
  attackWithCooldown,
  gameLoop,
  render,
  useGameLoop,
  checkEnemiesInRange,
  getDistanceToNearestEnemy,
  customAttackEffect
};

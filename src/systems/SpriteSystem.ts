export interface SpriteAnimation {
  frames: HTMLImageElement[];
  frameRate: number;
  loop: boolean;
}

export class SpriteManager {
  private static loadedImages: Map<string, HTMLImageElement> = new Map();
  private static loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  static async loadImage(path: string): Promise<HTMLImageElement> {
    // Si ya está cargada, retornarla
    if (this.loadedImages.has(path)) {
      return this.loadedImages.get(path)!;
    }

    // Si está en proceso de carga, esperar
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    // Cargar nueva imagen
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages.set(path, img);
        this.loadingPromises.delete(path);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingPromises.delete(path);
        reject(new Error(`Failed to load image: ${path}`));
      };
      img.src = path;
    });

    this.loadingPromises.set(path, promise);
    return promise;
  }

  static async loadMultiple(paths: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(paths.map(path => this.loadImage(path)));
  }

  static getImage(path: string): HTMLImageElement | null {
    return this.loadedImages.get(path) || null;
  }
}

export class AnimatedSprite {
  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private currentAnimation: string = 'idle';
  private animations: Map<string, SpriteAnimation> = new Map();
  public flipX: boolean = false;

  addAnimation(name: string, animation: SpriteAnimation): void {
    this.animations.set(name, animation);
  }

  setAnimation(name: string): void {
    if (this.currentAnimation !== name && this.animations.has(name)) {
      this.currentAnimation = name;
      this.currentFrame = 0;
      this.frameTimer = 0;
    }
  }

  update(deltaTime: number): void {
    const animation = this.animations.get(this.currentAnimation);
    if (!animation || animation.frames.length === 0) return;

    this.frameTimer += deltaTime;
    const frameDuration = 1 / animation.frameRate;

    // OPTIMIZACIÓN: Prevenir acumulación infinita del timer
    // Si el timer es mucho mayor que el frame duration, resetear directamente
    if (this.frameTimer >= frameDuration * 2) {
      // Calcular cuántos frames saltamos
      const framesSkipped = Math.floor(this.frameTimer / frameDuration);
      this.frameTimer = this.frameTimer % frameDuration; // Mantener el resto
      this.currentFrame += framesSkipped;
    } else if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration; // Restar en lugar de resetear a 0
      this.currentFrame++;
    }

    // Manejar loop/fin de animación
    if (this.currentFrame >= animation.frames.length) {
      if (animation.loop) {
        this.currentFrame = this.currentFrame % animation.frames.length;
      } else {
        this.currentFrame = animation.frames.length - 1;
      }
    }
  }

  getCurrentFrame(): HTMLImageElement | null {
    const animation = this.animations.get(this.currentAnimation);
    if (!animation || animation.frames.length === 0) return null;
    return animation.frames[this.currentFrame];
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const frame = this.getCurrentFrame();
    if (!frame) return;

    ctx.save();
    
    // Desactivar suavizado para sprites pixel art
    ctx.imageSmoothingEnabled = false;
    
    // Aplicar flip horizontal si es necesario
    if (this.flipX) {
      ctx.translate(x + width / 2, y);
      ctx.scale(-1, 1);
      ctx.translate(-(x + width / 2), -y);
    }

    ctx.drawImage(frame, x - width / 2, y - height / 2, width, height);
    
    ctx.restore();
  }
}

export async function createPlayerSprite(): Promise<AnimatedSprite> {
  const sprite = new AnimatedSprite();

  try {
    // Cargar frames de idle
    const idleFrames = await SpriteManager.loadMultiple([
      `${import.meta.env.BASE_URL}assets/sprites/characters/seiya/player_idle.png`
    ]);

    // Cargar frames de caminar (solo 2 frames)
    const walkPaths = [
      `${import.meta.env.BASE_URL}assets/sprites/characters/seiya/player_walk_1.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/seiya/player_walk_2.png`
    ];
    
    // Cargar walk frames con fallback
    const walkFrames: HTMLImageElement[] = [];
    for (const path of walkPaths) {
      try {
        const frame = await SpriteManager.loadImage(path);
        walkFrames.push(frame);
      } catch (error) {
        // Silent fallback
      }
    }

    // Cargar frames de ataque
    const attackFrames = await SpriteManager.loadMultiple([
      `${import.meta.env.BASE_URL}assets/sprites/characters/seiya/player_attack_1.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/seiya/player_attack_2.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/seiya/player_attack_3.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/seiya/player_attack_4.png`
    ]);

    // Agregar animaciones
    sprite.addAnimation('idle', {
      frames: idleFrames,
      frameRate: 2,
      loop: true
    });

    sprite.addAnimation('walk', {
      frames: walkFrames.length > 0 ? walkFrames : idleFrames,
      frameRate: 6,
      loop: true
    });

    sprite.addAnimation('attack', {
      frames: attackFrames.length > 0 ? attackFrames : idleFrames,
      frameRate: 20,
      loop: false
    });

    sprite.setAnimation('idle');
  } catch (error) {
    // Silent error handling
    // Si falla, usar fallback vacío
  }

  return sprite;
}

export async function createEnemySprite(_type?: string): Promise<AnimatedSprite> {
  const sprite = new AnimatedSprite();

  try {
    // Cargar frames de caminar del enemigo (animación loop)
    const walkFrames = await SpriteManager.loadMultiple([
      `${import.meta.env.BASE_URL}assets/sprites/characters/enemy_1/enemy_walk_2.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/enemy_1/enemy_walk_3.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/enemy_1/enemy_walk_4.png`
    ]);

    sprite.addAnimation('walk', {
      frames: walkFrames,
      frameRate: 8,
      loop: true
    });

    sprite.setAnimation('walk');
  } catch (error) {
    // Silent error handling
  }

  return sprite;
}

export async function createBossSprite(): Promise<AnimatedSprite> {
  const sprite = new AnimatedSprite();

  try {
    // Cargar frames de idle/walk del boss
    const idleFrames = await SpriteManager.loadMultiple([
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_1.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_2.png`
    ]);

    // Cargar frames de caminar (animación completa)
    const walkFrames = await SpriteManager.loadMultiple([
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_1.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_2.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_3.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_4.png`
    ]);

    // Cargar frames de ataque (usar walk frames como animación de ataque)
    const attackFrames = await SpriteManager.loadMultiple([
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_3.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_4.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_1.png`,
      `${import.meta.env.BASE_URL}assets/sprites/characters/boss/boss_walk_2.png`
    ]);

    // Agregar animaciones
    sprite.addAnimation('idle', {
      frames: idleFrames,
      frameRate: 4,
      loop: true
    });

    sprite.addAnimation('walk', {
      frames: walkFrames,
      frameRate: 8,
      loop: true
    });

    sprite.addAnimation('attack', {
      frames: attackFrames,
      frameRate: 15,
      loop: false
    });

    sprite.setAnimation('idle');
  } catch (error) {
    // Silent error handling
  }

  return sprite;
}

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
      console.log(`Image already loaded: ${path}`);
      return this.loadedImages.get(path)!;
    }

    // Si está en proceso de carga, esperar
    if (this.loadingPromises.has(path)) {
      console.log(`Image loading in progress: ${path}`);
      return this.loadingPromises.get(path)!;
    }

    console.log(`Loading image: ${path}`);
    // Cargar nueva imagen
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log(`Image loaded successfully: ${path}`);
        this.loadedImages.set(path, img);
        this.loadingPromises.delete(path);
        resolve(img);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${path}`);
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

    if (this.frameTimer >= frameDuration) {
      this.frameTimer = 0;
      this.currentFrame++;

      if (this.currentFrame >= animation.frames.length) {
        if (animation.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animation.frames.length - 1;
        }
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
    console.log('Creating player sprite...');
    
    // Cargar frames de idle
    console.log('Loading idle frames...');
    const idleFrames = await SpriteManager.loadMultiple([
      '/sprites/player_idle.png'
    ]);
    console.log('Idle frames loaded:', idleFrames.length);

    // Cargar frames de caminar (solo 2 frames)
    console.log('Loading walk frames...');
    const walkPaths = [
      '/sprites/player_walk_1.png',
      '/sprites/player_walk_2.png'
    ];
    
    // Cargar walk frames con fallback
    const walkFrames: HTMLImageElement[] = [];
    for (const path of walkPaths) {
      try {
        const frame = await SpriteManager.loadImage(path);
        walkFrames.push(frame);
      } catch (error) {
        console.warn(`Failed to load ${path}, skipping`);
      }
    }
    console.log('Walk frames loaded:', walkFrames.length);

    // Cargar frames de ataque
    console.log('Loading attack frames...');
    const attackFrames = await SpriteManager.loadMultiple([
      '/sprites/player_attack_1.png',
      '/sprites/player_attack_2.png',
      '/sprites/player_attack_3.png',
      '/sprites/player_attack_4.png'
    ]);
    console.log('Attack frames loaded:', attackFrames.length);

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
    console.log('Player sprite created successfully');
  } catch (error) {
    console.error('Error loading player sprites:', error);
    // Si falla, usar fallback vacío
  }

  return sprite;
}

export async function createEnemySprite(_type?: string): Promise<AnimatedSprite> {
  const sprite = new AnimatedSprite();

  try {
    // Por ahora usar los mismos sprites, pero podrías cargar diferentes según el tipo
    const frames = await SpriteManager.loadMultiple([
      '/sprites/player_idle.png'
    ]);

    sprite.addAnimation('idle', {
      frames: frames,
      frameRate: 2,
      loop: true
    });

    sprite.setAnimation('idle');
  } catch (error) {
    console.error('Error loading enemy sprites:', error);
  }

  return sprite;
}

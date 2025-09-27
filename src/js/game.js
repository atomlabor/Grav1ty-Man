class GravityManGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('Canvas element not found');
      return;
    }
    this.ctx = this.canvas.getContext('2d');

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.currentLevel = 1;
    this.gameMode = 'normal'; // 'normal' oder 'hard'
    this.showSplash = true; // Show splash at start

    // Input state
    this.gyroActive = false;
    this.lastTiltDir = null;

    // Frame control
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / 60; // 60fps

    // Splash screen image setup (canvas-based splash)
    this.splashImage = new Image();
    this.splashLoaded = false;
    this.splashImage.onload = () => {
      this.splashLoaded = true;
      // Start game loop to show splash
      this.gameLoop();
    };
    this.splashImage.src = './grav1tyman.png';

    // Initialize game components
    this.initializeComponents();
    this.setupEventHandlers();

    // Start game loop
    this.gameLoop();
  }

  initializeComponents() {
    try {
      if (typeof LevelManager !== 'undefined') {
        this.levels = new LevelManager();
        this.levels.load(this.currentLevel);
      } else {
        console.warn('LevelManager not available');
      }

      if (typeof Player !== 'undefined') {
        this.player = new Player(50, 50);
      } else {
        console.warn('Player not available');
      }

      if (typeof GravitySystem !== 'undefined') {
        this.gravity = new GravitySystem();
      } else {
        console.warn('GravitySystem not available');
      }

      if (typeof EnemySystem !== 'undefined') {
        this.enemies = new EnemySystem();
      } else {
        console.warn('EnemySystem not available');
      }
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }

  setupEventHandlers() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Canvas tap/click to start and control
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleCanvasTouch(e);
    }, { passive: false });

    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Rabbit R1 PTT button (mapped to KeyboardEvent with code 'MediaPlayPause' on many builds) and generic 'Enter'
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning && this.showSplash && (e.code === 'MediaPlayPause' || e.code === 'Enter')) {
        e.preventDefault();
        this.start();
      }
    });

    // DeviceOrientation/Gyroscope listeners (Rabbit R1 and standard phones)
    this.setupGyroListeners();
  }

  async setupGyroListeners() {
    const activate = () => {
      if (this.gyroActive) return;
      const handler = (evt) => this.handleOrientation(evt);
      window.addEventListener('deviceorientation', handler);
      // Some browsers use absolute orientation
      window.addEventListener('deviceorientationabsolute', handler);
      this.gyroActive = true;
      console.log('Gyro active');
    };

    // iOS-style permission
    try {
      const needPerm = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
      if (needPerm) {
        const ask = async () => {
          try {
            const res = await DeviceOrientationEvent.requestPermission();
            if (res === 'granted') activate();
          } catch (e) { console.warn('Gyro permission denied', e); }
        };
        // Request on first user gesture
        const once = () => { document.removeEventListener('click', once); document.removeEventListener('touchstart', once); ask(); };
        document.addEventListener('click', once, { once: true });
        document.addEventListener('touchstart', once, { once: true });
      } else if (typeof DeviceOrientationEvent !== 'undefined') {
        activate();
      } else if ('AbsoluteOrientationSensor' in window || 'Gyroscope' in window) {
        // Generic Sensors API fallback (DiceSim-style)
        try {
          // Simple tilt from alpha/beta/gamma via orientation if available later
          window.addEventListener('deviceorientation', (e) => this.handleOrientation(e));
          this.gyroActive = true;
        } catch (e) {
          console.warn('Generic sensor API not available', e);
        }
      }
    } catch (e) {
      console.warn('Gyro setup error', e);
    }
  }

  handleOrientation(event) {
    if (!this.isRunning || this.isPaused || !event) return;

    // Normalize tilt: beta (front-back), gamma (left-right)
    const beta = typeof event.beta === 'number' ? event.beta : 0;   // -180..180
    const gamma = typeof event.gamma === 'number' ? event.gamma : 0; // -90..90

    // Decide dominant axis with small deadzone
    const dead = 5;
    let dir = null;
    if (Math.abs(gamma) > Math.abs(beta)) {
      if (gamma > dead) dir = 'right';
      else if (gamma < -dead) dir = 'left';
    } else {
      if (beta > dead) dir = 'down';
      else if (beta < -dead) dir = 'up';
    }

    if (dir && dir !== this.lastTiltDir) {
      this.lastTiltDir = dir;
      this.gravity?.changeDirection(dir);
    }
  }

  handleKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!this.isRunning && this.showSplash) {
        this.start();
      } else if (this.isRunning) {
        this.togglePause();
      }
    } else if (e.code === 'KeyR') {
      this.restart();
    } else if (e.code === 'KeyM') {
      this.toggleGameMode();
    } else if (this.isRunning && !this.isPaused) {
      switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.gravity?.changeDirection('up');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.gravity?.changeDirection('down');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.gravity?.changeDirection('left');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.gravity?.changeDirection('right');
          break;
      }
    }
  }

  handleCanvasClick(e) {
    if (!this.isRunning && this.showSplash) {
      this.start();
      return;
    }
    if (this.isRunning) {
      this.handleCanvasInput(e);
    }
  }

  handleCanvasTouch(e) {
    if (!this.isRunning && this.showSplash) {
      this.start();
      return;
    }
    if (this.isRunning && e.touches.length > 0) {
      this.handleCanvasInput(e.touches[0]);
    }
  }

  handleCanvasInput(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
      this.gravity?.changeDirection(x > centerX ? 'right' : 'left');
    } else {
      this.gravity?.changeDirection(y > centerY ? 'down' : 'up');
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.showSplash = false; // Hide splash completely when game starts
    console.log('Game started - splash hidden');
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
  }

  restart() {
    this.isRunning = false;
    this.isPaused = false;
    this.showSplash = true; // Show splash again on restart
    this.levels?.load(this.currentLevel);
    console.log('Game restarted - splash visible');
  }

  toggleGameMode() {
    this.gameMode = this.gameMode === 'normal' ? 'hard' : 'normal';
    this.updateModeDisplay();
  }

  gameLoop(currentTime = 0) {
    // Always render - either splash or game
    if (!this.isRunning && this.showSplash) {
      this.renderSplash();
    } else if (this.isRunning) {
      const deltaTime = currentTime - this.lastFrameTime;
      if (deltaTime >= this.frameInterval) {
        this.update(deltaTime);
        this.render();
        this.lastFrameTime = currentTime;
      }
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(deltaTime) {
    if (this.isPaused) return;

    this.player?.update(deltaTime, this.gravity, this.levels?.current);
    this.gravity?.update(deltaTime);
    this.enemies?.update(deltaTime);

    this.checkCollisions();
    this.checkLevelComplete();
  }

  render() {
    // Clear to pure black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.isPaused) {
      this.renderPauseScreen();
      return;
    }

    // Only render game content when actually running (splash is hidden)
    if (this.isRunning && !this.showSplash) {
      // Minimalist monochrome background pattern for retro feel
      this.renderBackground();

      this.levels?.render(this.ctx);
      this.enemies?.render(this.ctx);
      this.player?.render(this.ctx);

      this.renderUI();
    }
  }

  renderSplash() {
    if (!this.showSplash) return;

    // Clear canvas with black background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw centered splash image if loaded
    if (this.splashLoaded && this.splashImage.complete) {
      const imgW = this.splashImage.width;
      const imgH = this.splashImage.height;

      const scale = Math.min(this.canvas.width / imgW, (this.canvas.height - 80) / imgH, 1);
      const w = Math.floor(imgW * scale);
      const h = Math.floor(imgH * scale);
      const x = Math.floor((this.canvas.width - w) / 2);
      const y = Math.floor((this.canvas.height - h - 80) / 2);

      this.ctx.drawImage(this.splashImage, x, y, w, h);
    }

    // Overlay instructions fully inside canvas
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TAP/SPACE/PTT TO START', this.canvas.width / 2, this.canvas.height - 40);
    this.ctx.font = '12px monospace';
    this.ctx.fillText('(Device tilt controls gravity)', this.canvas.width / 2, this.canvas.height - 20);
    this.ctx.textAlign = 'left';
  }

  renderBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#111111';
    for (let y = 0; y < this.canvas.height; y += 2) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
  }

  renderUI() {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Level: ${this.currentLevel}`, 10, 20);
    this.ctx.fillText(`Mode: ${this.gameMode}`, 10, 35);
  }

  renderPauseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.textAlign = 'left';
  }

  checkCollisions() { }

  checkLevelComplete() {
    if (this.player?.hasReachedGoal) {
      this.currentLevel += 1;
      this.updateLevelDisplay();

      if (!this.levels.levels.find(l => l.id === this.currentLevel)) {
        this.currentLevel = 1;
      }

      this.levels.load(this.currentLevel);
    }
  }

  updateLevelDisplay() {
    const el = document.getElementById('currentLevel');
    if (el) el.textContent = this.currentLevel;
  }

  updateModeDisplay() {
    const el = document.getElementById('gameMode');
    if (el) el.textContent = this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1);
  }
}

// Game Initialisierung wenn DOM geladen
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }

  window.gravityManGame = new GravityManGame();
});

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

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
    this.splashHidden = false; // Track if splash has been hidden after tap
    
    // Frame control
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / 60; // 60fps
    
    // Splash screen image setup
    this.splashImage = new Image();
    this.splashLoaded = false;
    this.splashImage.onload = () => {
      this.splashLoaded = true;
      // Render splash screen immediately when image is loaded
      this.renderSplash();
      // Continue game loop to show splash
      this.gameLoop();
    };
    this.splashImage.src = './grav1tyman.png';
    
    // Initialize game components
    this.initializeComponents();
    this.setupEventHandlers();
    
    // Start with splash screen
    this.gameLoop();
  }
  
  initializeComponents() {
    try {
      // Try to load LevelManager
      if (typeof LevelManager !== 'undefined') {
        this.levels = new LevelManager();
        this.levels.load(this.currentLevel);
      } else {
        console.warn('LevelManager not available');
      }
      
      // Try to load Player
      if (typeof Player !== 'undefined') {
        this.player = new Player(50, 50);
      } else {
        console.warn('Player not available');
      }
      
      // Try to load GravitySystem
      if (typeof GravitySystem !== 'undefined') {
        this.gravity = new GravitySystem();
      } else {
        console.warn('GravitySystem not available');
      }
      
      // Try to load EnemySystem
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
    
    // Touch/Mouse controls for canvas
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleCanvasTouch(e);
    }, { passive: false });
    
    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  handleKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!this.isRunning) {
        this.start();
      } else {
        this.togglePause();
      }
    } else if (e.code === 'KeyR') {
      this.restart();
    } else if (e.code === 'KeyM') {
      this.toggleGameMode();
    } else if (this.isRunning && !this.isPaused) {
      // Game-specific controls
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
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.handleCanvasInput(e);
  }
  
  handleCanvasTouch(e) {
    if (!this.isRunning) {
      this.start();
      return;
    }
    if (e.touches.length > 0) {
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
    this.splashHidden = true; // Hide splash when game starts
    this.gameLoop();
  }
  
  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
  }
  
  restart() {
    this.isRunning = false;
    this.isPaused = false;
    this.splashHidden = false; // Show splash again on restart
    this.levels.load(this.currentLevel);
    this.start();
  }
  
  toggleGameMode() {
    this.gameMode = this.gameMode === 'normal' ? 'hard' : 'normal';
    this.updateModeDisplay();
  }
  
  gameLoop(currentTime = 0) {
    // Only show splash if game is not running AND splash hasn't been hidden
    if (!this.isRunning && !this.splashHidden) {
      this.renderSplash();
      requestAnimationFrame((t) => this.gameLoop(t));
      return;
    }
    
    const deltaTime = currentTime - this.lastFrameTime;
    if (deltaTime >= this.frameInterval) {
      this.update(deltaTime);
      this.render();
      this.lastFrameTime = currentTime;
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
    
    // Don't render splash if it has been hidden
    if (!this.isRunning && !this.splashHidden) {
      this.renderSplash();
      return;
    }
    
    if (this.isPaused) {
      this.renderPauseScreen();
      return;
    }
    
    // Minimalist monochrome background pattern for retro feel
    this.renderBackground();
    
    this.levels?.render(this.ctx);
    this.enemies?.render(this.ctx);
    this.player?.render(this.ctx);
    
    this.renderUI();
  }
  
  renderSplash() {
    // Don't render splash if it has been hidden
    if (this.splashHidden) return;
    
    // Clear canvas with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw image centered, if loaded
    if (this.splashLoaded && this.splashImage.complete) {
      const imgW = this.splashImage.width;
      const imgH = this.splashImage.height;
      
      // Scale image if it's larger than canvas
      const scale = Math.min(this.canvas.width / imgW, (this.canvas.height - 60) / imgH, 1);
      const w = Math.floor(imgW * scale);
      const h = Math.floor(imgH * scale);
      const x = Math.floor((this.canvas.width - w) / 2);
      const y = Math.floor((this.canvas.height - h) / 2) - 20;
      
      this.ctx.drawImage(this.splashImage, x, y, w, h);
    }
    
    // Draw white overlay text "tap to start"
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('tap to start', this.canvas.width / 2, this.canvas.height - 20);
    this.ctx.textAlign = 'left';
  }
  
  renderBackground() {
    // Draw subtle scanline pattern in dark gray
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
    
    if (!this.isRunning && !this.splashHidden) {
      this.ctx.fillText('Press SPACE or tap to start', 10, 50);
    }
  }
  
  renderPauseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.textAlign = 'left';
  }
  
  checkCollisions() {
    // Player-level handled in player.update via checkLevelCollisions
  }
  
  checkLevelComplete() {
    if (this.player?.hasReachedGoal) {
      this.currentLevel += 1;
      this.updateLevelDisplay();
      
      if (!this.levels.levels.find(l => l.id === this.currentLevel)) {
        // restart loop for demo
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
  // Expose Player globally if required for LevelManager
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }
  
  window.gravityManGame = new GravityManGame();
});
// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

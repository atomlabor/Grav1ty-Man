// LevelManager class to handle level creation and rendering
class LevelManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.current = this.createTestLevel();
  }
  createTestLevel() {
    return {
      walls: [
        // Border walls
        { x: 0, y: 0, width: this.canvasWidth, height: 12 }, // top
        { x: 0, y: this.canvasHeight - 12, width: this.canvasWidth, height: 12 }, // bottom
        { x: 0, y: 0, width: 12, height: this.canvasHeight }, // left
        { x: this.canvasWidth - 12, y: 0, width: 12, height: this.canvasHeight }, // right
        
        // Platforms
        { x: 24, y: 64, width: 96, height: 10 },
        { x: 140, y: 54, width: 64, height: 10 },
        { x: 180, y: 120, width: 72, height: 10 },
        { x: 48, y: 180, width: 120, height: 10 },
      ],
      
      hazards: [
        { x: 60, y: 74, width: 30, height: 8 },
        { x: 160, y: 64, width: 30, height: 8 },
        { x: 120, y: 190, width: 60, height: 8 },
      ],
      
      goal: { x: 200, y: 140, width: 18, height: 18 },
      start: { x: 20, y: 40 }
    };
  }
  render(ctx) {
    if (!this.current) return;
    
    // Render walls (platforms)
    ctx.fillStyle = '#4A90E2';
    this.current.walls.forEach(wall => {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
    
    // Render hazards
    ctx.fillStyle = '#E74C3C';
    this.current.hazards.forEach(hazard => {
      ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    });
    
    // Render goal
    ctx.fillStyle = '#2ECC71';
    const goal = this.current.goal;
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  }
}
// GravityManGame class with integrated LevelManager
class GravityManGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas') || this.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    // Force exact Rabbit R1 viewport and top alignment
    this.canvas.width = 240;
    this.canvas.height = 282;
    this.canvas.style.width = '240px';
    this.canvas.style.height = '282px';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto 0 auto';
    this.canvas.style.objectFit = 'none';
    // Splash image state
    this.splashImage = new Image();
    this.splashLoaded = false;
    this.splashImage.onload = () => { this.splashLoaded = true; };
    this.splashImage.src = typeof GRAVITY_SPLASH_SRC !== 'undefined' ? GRAVITY_SPLASH_SRC : 'src/assets/grav1tyman.png';
    this.gameMode = 'splash';
    this.isPaused = false;
    this.hazardFlashUntil = 0;
    
    // Initialize level manager with fixed viewport size
    this.levels = new LevelManager(this.canvas.width, this.canvas.height);
    
    // Initialize player at start position if available
    if (typeof Player !== 'undefined') {
      const startPos = this.levels.current.start;
      this.player = new Player(startPos.x, startPos.y);
    }
    
    // Creations SDK mock
    this.creations = {
      panelVisible: false,
      setGravity: (direction) => {
        if (this.player) {
          this.player.setGravity(direction);
        }
      }
    };
    
    this.setupEventListeners();
    this.gameLoop();
  }
  
  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = 240;
    canvas.height = 282;
    canvas.style.border = '1px solid #222';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto 0 auto';
    document.body.appendChild(canvas);
    return canvas;
  }
  
  setupEventListeners() {
    // Touch/click only to start from splash per requirement
    const startOnPointer = () => {
      if (this.gameMode === 'splash') {
        this.start();
      }
    };
    this.canvas.addEventListener('click', startOnPointer, { passive: true });
    this.canvas.addEventListener('pointerdown', startOnPointer, { passive: true });
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // ensure no double events and reliable start
      startOnPointer();
    }, { passive: false });

    // Keep keyboard for gameplay, but do NOT start from splash with SPACE
    document.addEventListener('keydown', (e) => {
      switch(e.code) {
        case 'KeyB':
          this.restart();
          break;
        case 'KeyA':
          if (this.player && this.gameMode === 'playing') {
            this.player.boost();
          }
          break;
        case 'ArrowUp':
          this.creations.setGravity('up');
          break;
        case 'ArrowDown':
          this.creations.setGravity('down');
          break;
        case 'ArrowLeft':
          this.creations.setGravity('left');
          break;
        case 'ArrowRight':
          this.creations.setGravity('right');
          break;
        case 'Space':
          if (this.gameMode === 'playing') {
            e.preventDefault();
            this.togglePause();
          }
          break;
      }
    }, { passive: false });
  }
  
  start() {
    this.gameMode = 'playing';
    this.isPaused = false;
    if (this.player && this.levels.current) {
      const startPos = this.levels.current.start;
      this.player.x = startPos.x;
      this.player.y = startPos.y;
      this.player.vx = 0;
      this.player.vy = 0;
      if (this.player.setGravity) this.player.setGravity('down');
    }
  }
  
  restart() {
    this.gameMode = 'splash';
    this.isPaused = false;
    this.hazardFlashUntil = 0;
  }
  
  togglePause() {
    if (this.gameMode === 'playing') {
      this.isPaused = !this.isPaused;
    }
  }
  
  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
  
  update() {
    if (this.gameMode === 'playing' && !this.isPaused && this.player) {
      this.player.update(this.levels.current);
      this.checkCollisions();
      this.checkLevelComplete();
    }
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.gameMode === 'splash') {
      this.renderImageSplashScreen();
    } else {
      this.renderBackground();
      
      // Render level
      if (this.levels) {
        this.levels.render(this.ctx);
      }
      
      // Render player
      if (this.player) {
        this.player.render(this.ctx);
      }
      
      if (this.isPaused) {
        this.renderPauseScreen();
      }
      
      this.renderOverlayAndPanel();
    }
  }
  // Image-based splash screen using grav1tyman.png with minimal overlay
  renderImageSplashScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    // Solid dark background
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, w, h);
    // Draw image centered and scaled
    if (this.splashLoaded) {
      const iw = this.splashImage.naturalWidth || this.splashImage.width;
      const ih = this.splashImage.naturalHeight || this.splashImage.height;
      const scale = Math.min(w / iw, (h - 40) / ih);
      const dw = Math.round(iw * scale);
      const dh = Math.round(ih * scale);
      const dx = Math.round((w - dw) / 2);
      const dy = Math.round((h - dh) / 2) - 6;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.splashImage, dx, dy, dw, dh);
    }
    // Overlay text: Touch to start (only)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Touch to start', w/2, h - 18);
    ctx.textAlign = 'left';
  }
  
  renderBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#111111';
    for (let y = 0; y < this.canvas.height; y += 2) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
  }
  
  renderPauseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Press SPACE/PTT to continue', this.canvas.width / 2, this.canvas.height / 2 + 16);
    this.ctx.textAlign = 'left';
  }
  
  // Simple AABB collision helpers already in Player, here we add hazard flash
  checkCollisions() {
    const lvl = this.levels?.current;
    if (!lvl || !this.player) return;
    
    if (lvl.hazards.some(h => this.player.checkCollision(h))) {
      this.hazardFlashUntil = performance.now() + 60;
    }
  }
  
  checkLevelComplete() {
    const g = this.levels?.current?.goal;
    if (g && this.player?.checkCollision(g)) {
      if (this.player.reachGoal) this.player.reachGoal();
      setTimeout(() => this.restart(), 600);
    }
  }
  
  // Overlay and panel during gameplay
  renderOverlayAndPanel() {
    const ctx = this.ctx;
    const now = performance.now();
    if (this.hazardFlashUntil && now < this.hazardFlashUntil) {
      ctx.fillStyle = 'rgba(255,0,0,0.25)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, this.canvas.width, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '9px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Mode:${this.gameMode.toUpperCase()}`, 4, 6);
    ctx.textAlign = 'right';
    ctx.fillText('A Boost  B Restart  PTT Pause', this.canvas.width - 4, 6);
    ctx.textAlign = 'left';

    const showPanel = this.isPaused || this.creations.panelVisible;
    if (showPanel) {
      const h = 48;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, this.canvas.height - h, this.canvas.width, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.strokeRect(0.5, this.canvas.height - h + 0.5, this.canvas.width - 1, h - 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px monospace';
      ctx.fillText('Panel:', 6, this.canvas.height - h + 12);
      ctx.fillText('- Tilt: change gravity', 12, this.canvas.height - h + 22);
      ctx.fillText('- Arrows/Swipe: gravity', 12, this.canvas.height - h + 32);
      ctx.fillText('- A: Boost  B: Restart', 12, this.canvas.height - h + 42);
    }
  }
}
// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  const c = document.getElementById('gameCanvas');
  if (c) {
    c.width = 240; c.height = 282;
    c.style.width = '240px';
    c.style.height = '282px';
  }
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }
  window.gravityManGame = new GravityManGame();
});
// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

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
        { x: 0, y: 0, width: this.canvasWidth, height: 20 }, // top
        { x: 0, y: this.canvasHeight - 20, width: this.canvasWidth, height: 20 }, // bottom
        { x: 0, y: 0, width: 20, height: this.canvasHeight }, // left
        { x: this.canvasWidth - 20, y: 0, width: 20, height: this.canvasHeight }, // right
        
        // Platforms
        { x: 100, y: 200, width: 150, height: 20 },
        { x: 300, y: 150, width: 100, height: 20 },
        { x: 450, y: 250, width: 120, height: 20 },
        { x: 200, y: 350, width: 200, height: 20 },
      ],
      
      hazards: [
        { x: 150, y: 180, width: 50, height: 20 },
        { x: 350, y: 130, width: 50, height: 20 },
        { x: 250, y: 330, width: 100, height: 20 },
      ],
      
      goal: { x: 500, y: 200, width: 30, height: 30 },
      start: { x: 50, y: 150 }
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
    this.gameMode = 'splash';
    this.isPaused = false;
    this.hazardFlashUntil = 0;
    
    // Initialize level manager
    this.levels = new LevelManager(this.canvas.width, this.canvas.height);
    
    // Initialize player at start position
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
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.border = '1px solid #ccc';
    canvas.style.display = 'block';
    canvas.style.margin = '20px auto';
    document.body.appendChild(canvas);
    return canvas;
  }
  
  setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          if (this.gameMode === 'splash') {
            this.start();
          } else if (this.gameMode === 'playing') {
            this.togglePause();
          }
          break;
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
      }
    });
    
    // Mouse/Touch controls
    this.canvas.addEventListener('click', () => {
      if (this.gameMode === 'splash') {
        this.start();
      }
    });
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
      this.renderSplashScreen();
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
  
  renderSplashScreen() {
    // Background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GRAVITY MAN', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    // Instructions
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText('TAP/SPACE/PTT TO START', this.canvas.width / 2, this.canvas.height - 40);
    this.ctx.font = '12px monospace';
    this.ctx.fillText('Tilt to change gravity • Swipe/Arrows OK', this.canvas.width / 2, this.canvas.height - 20);
    this.ctx.textAlign = 'left';
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
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Press SPACE/PTT to continue', this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.textAlign = 'left';
  }
  
  // Simple AABB collision helpers already in Player, here we add hazard flash
  checkCollisions() {
    const lvl = this.levels?.current;
    if (!lvl || !this.player) return;
    
    // Visual hazard feedback flash
    if (lvl.hazards.some(h => this.player.checkCollision(h))) {
      // brief overlay flash
      this.hazardFlashUntil = performance.now() + 60;
    }
  }
  
  checkLevelComplete() {
    const g = this.levels?.current?.goal;
    if (g && this.player?.checkCollision(g)) {
      this.player.reachGoal();
      // restart to splash after short delay
      setTimeout(() => this.restart(), 600);
    }
  }
  
  // Draw SDK-like overlay and a panel in-canvas (emulator style)
  renderOverlayAndPanel() {
    const ctx = this.ctx;
    const now = performance.now();
    
    // hazard flash
    if (this.hazardFlashUntil && now < this.hazardFlashUntil) {
      ctx.fillStyle = 'rgba(255,0,0,0.25)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Top overlay bar
    if (true) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, 0, this.canvas.width, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Mode:${this.gameMode.toUpperCase()}`, 4, 7);
      ctx.textAlign = 'right';
      ctx.fillText('A Boost  B Restart  PTT Pause', this.canvas.width - 4, 7);
      ctx.textAlign = 'left';
    }
    
    // Bottom panel toggle state similar to emulator
    const showPanel = this.isPaused || this.creations.panelVisible;
    if (showPanel) {
      const h = 56;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, this.canvas.height - h, this.canvas.width, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.strokeRect(0.5, this.canvas.height - h + 0.5, this.canvas.width - 1, h - 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText('Panel:', 6, this.canvas.height - h + 14);
      ctx.fillText('- Tilt: change gravity', 12, this.canvas.height - h + 26);
      ctx.fillText('- Arrows/Swipe: gravity', 12, this.canvas.height - h + 38);
      ctx.fillText('- A: Boost  B: Restart', 12, this.canvas.height - h + 50);
    }
  }
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }
  window.gravityManGame = new GravityManGame();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

// Gravity-Man Game - Rabbit R1 Edition
// Game mechanics: Orange HUD (#FA6400), gravity physics, collision reset, 5 levels, endscreen
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = 240;
    this.height = 282;
    
    this.currentLevel = 1;
    this.maxLevels = 5;
    this.gameState = 'playing'; // playing, gameOver, levelComplete, allComplete
    
    // Player setup
    this.player = {
      x: 20,
      y: 20,
      width: 16,
      height: 16,
      vx: 0,
      vy: 0,
      gravity: 0.3,
      gravityDirection: 'down' // up, down, left, right
    };
    
    // Enemies setup
    this.enemies = this.generateEnemies();
    
    // Level boundaries
    this.walls = this.generateWalls();
    
    // Exit door
    this.exit = {
      x: this.width - 30,
      y: this.height - 30,
      width: 20,
      height: 20,
      isOpen: false
    };
    
    this.setupControls();
    this.gameLoop();
  }
  
  generateEnemies() {
    const enemies = [];
    const enemyCount = 2 + this.currentLevel;
    
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        x: Math.random() * (this.width - 50) + 25,
        y: Math.random() * (this.height - 50) + 25,
        width: 14,
        height: 14,
        vx: 0,
        vy: 0,
        gravity: 0.3,
        gravityDirection: 'down'
      });
    }
    
    return enemies;
  }
  
  generateWalls() {
    const walls = [
      // Border walls
      {x: 0, y: 0, width: this.width, height: 10}, // top
      {x: 0, y: this.height - 10, width: this.width, height: 10}, // bottom
      {x: 0, y: 0, width: 10, height: this.height}, // left
      {x: this.width - 10, y: 0, width: 10, height: this.height} // right
    ];
    
    // Add some platforms based on level
    const platformCount = 2 + this.currentLevel;
    for (let i = 0; i < platformCount; i++) {
      walls.push({
        x: Math.random() * (this.width - 80) + 20,
        y: Math.random() * (this.height - 80) + 20,
        width: 60 + Math.random() * 40,
        height: 10
      });
    }
    
    return walls;
  }
  
  setupControls() {
    // Touch controls for Rabbit R1
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Determine gravity direction based on touch position
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
        this.player.gravityDirection = x < centerX ? 'left' : 'right';
      } else {
        this.player.gravityDirection = y < centerY ? 'up' : 'down';
      }
      
      // Apply same gravity to enemies
      this.enemies.forEach(enemy => {
        enemy.gravityDirection = this.player.gravityDirection;
      });
    });
    
    // Keyboard controls (for testing)
    document.addEventListener('keydown', (e) => {
      switch(e.code) {
        case 'ArrowUp':
          this.player.gravityDirection = 'up';
          break;
        case 'ArrowDown':
          this.player.gravityDirection = 'down';
          break;
        case 'ArrowLeft':
          this.player.gravityDirection = 'left';
          break;
        case 'ArrowRight':
          this.player.gravityDirection = 'right';
          break;
      }
      
      // Apply same gravity to enemies
      this.enemies.forEach(enemy => {
        enemy.gravityDirection = this.player.gravityDirection;
      });
    });
  }
  
  applyGravity(entity) {
    switch(entity.gravityDirection) {
      case 'up':
        entity.vy -= entity.gravity;
        break;
      case 'down':
        entity.vy += entity.gravity;
        break;
      case 'left':
        entity.vx -= entity.gravity;
        break;
      case 'right':
        entity.vx += entity.gravity;
        break;
    }
    
    // Apply friction
    entity.vx *= 0.98;
    entity.vy *= 0.98;
    
    // Update position
    entity.x += entity.vx;
    entity.y += entity.vy;
  }
  
  checkWallCollision(entity) {
    let collided = false;
    
    this.walls.forEach(wall => {
      if (entity.x < wall.x + wall.width &&
          entity.x + entity.width > wall.x &&
          entity.y < wall.y + wall.height &&
          entity.y + entity.height > wall.y) {
        
        // Simple collision response - stop and reverse
        if (entity.vx > 0 && entity.x < wall.x) {
          entity.x = wall.x - entity.width;
          entity.vx = 0;
        } else if (entity.vx < 0 && entity.x > wall.x) {
          entity.x = wall.x + wall.width;
          entity.vx = 0;
        }
        
        if (entity.vy > 0 && entity.y < wall.y) {
          entity.y = wall.y - entity.height;
          entity.vy = 0;
        } else if (entity.vy < 0 && entity.y > wall.y) {
          entity.y = wall.y + wall.height;
          entity.vy = 0;
        }
        
        collided = true;
      }
    });
    
    return collided;
  }
  
  checkCollisions() {
    // Check player vs enemies - reset level on collision
    this.enemies.forEach(enemy => {
      if (this.player.x < enemy.x + enemy.width &&
          this.player.x + this.player.width > enemy.x &&
          this.player.y < enemy.y + enemy.height &&
          this.player.y + this.player.height > enemy.y) {
        
        // Collision detected - reset level
        this.resetLevel();
      }
    });
    
    // Check if player collected all items (using simplified logic)
    if (this.currentLevel <= this.maxLevels) {
      this.exit.isOpen = true; // Simplified - door opens immediately
    }
    
    // Check player vs exit
    if (this.exit.isOpen &&
        this.player.x < this.exit.x + this.exit.width &&
        this.player.x + this.player.width > this.exit.x &&
        this.player.y < this.exit.y + this.exit.height &&
        this.player.y + this.player.height > this.exit.y) {
      
      if (this.currentLevel < this.maxLevels) {
        this.nextLevel();
      } else {
        this.gameState = 'allComplete';
      }
    }
  }
  
  resetLevel() {
    // Reset player position
    this.player.x = 20;
    this.player.y = 20;
    this.player.vx = 0;
    this.player.vy = 0;
    
    // Reset enemies
    this.enemies = this.generateEnemies();
  }
  
  nextLevel() {
    this.currentLevel++;
    this.resetLevel();
    this.walls = this.generateWalls();
    this.enemies = this.generateEnemies();
    this.exit.isOpen = false;
  }
  
  update() {
    if (this.gameState !== 'playing') return;
    
    // Update player
    this.applyGravity(this.player);
    this.checkWallCollision(this.player);
    
    // Update enemies
    this.enemies.forEach(enemy => {
      this.applyGravity(enemy);
      this.checkWallCollision(enemy);
    });
    
    // Check collisions
    this.checkCollisions();
  }
  
  render() {
    // Clear canvas with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    if (this.gameState === 'allComplete') {
      // Show endscreen
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME COMPLETE!', this.width / 2, this.height / 2 - 20);
      this.ctx.fillText('All 5 levels cleared!', this.width / 2, this.height / 2 + 10);
      return;
    }
    
    // Render walls (white/gray)
    this.ctx.fillStyle = '#CCCCCC';
    this.walls.forEach(wall => {
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
    
    // Render exit door
    if (this.exit.isOpen) {
      this.ctx.fillStyle = '#7FFF7F'; // Green when open
    } else {
      this.ctx.fillStyle = '#888888'; // Gray when closed
    }
    this.ctx.fillRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height);
    
    // Render player (white)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Render enemies (white)
    this.ctx.fillStyle = '#FFFFFF';
    this.enemies.forEach(enemy => {
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
    
    // Render HUD with orange color (#FA6400)
    this.ctx.fillStyle = '#FA6400';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Level: ${this.currentLevel}/${this.maxLevels}`, 10, 20);
    this.ctx.fillText(`Gravity: ${this.player.gravityDirection}`, 10, 35);
    
    // Exit status
    if (this.exit.isOpen) {
      this.ctx.fillText('Exit: OPEN', 10, 50);
    } else {
      this.ctx.fillText('Exit: CLOSED', 10, 50);
    }
  }
  
  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Export the Game class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Game;
} else if (typeof window !== 'undefined') {
  window.Game = Game;
}

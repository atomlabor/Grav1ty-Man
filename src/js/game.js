// Gravity-Man Game - Rabbit R1 Edition
// Game mechanics: Orange HUD (#FA6400), gravity physics, collision reset, 5 levels, endscreen
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = 240;
    this.height = 282;

    // Image assets
    this.images = {
      splash: this.loadImage('grav1tyman-splash.png'),
      player: this.loadImage('grav1tyman-player.png'),
      background: this.loadImage('spaceship-bg.png'),
      enemy: this.loadImage('dalek.png'),
      item: this.loadImage('keycard.png'),
      exit: this.loadImage('exit.png'),
      endscreen: this.loadImage('endscreen.png')
    };
    this.assetsLoaded = false;
    this.waitForAssets(() => {
      this.assetsLoaded = true;
    });

    this.currentLevel = 1;
    this.maxLevels = 5;
    this.gameState = 'splash'; // splash, playing, gameOver, levelComplete, allComplete

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

    // Items (one keycard per level for now)
    this.items = this.generateItems();

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

    this.collectedItems = 0;
    this.requiredItems = 1; // open exit after collecting 1 keycard

    this.setupControls();
    this.gameLoop();
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  waitForAssets(cb) {
    const imgs = Object.values(this.images);
    let loaded = 0;
    imgs.forEach(img => {
      if (img.complete) {
        loaded++;
        if (loaded === imgs.length) cb();
      } else {
        img.onload = () => {
          loaded++;
          if (loaded === imgs.length) cb();
        };
        img.onerror = () => {
          loaded++;
          if (loaded === imgs.length) cb();
        };
      }
    });
  }

  startGame() {
    this.gameState = 'playing';
  }

  generateItems() {
    return [
      {
        x: Math.random() * (this.width - 40) + 20,
        y: Math.random() * (this.height - 60) + 30,
        width: 12,
        height: 12,
        collected: false
      }
    ];
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

      if (this.gameState === 'splash' && this.assetsLoaded) {
        this.startGame();
        return;
      }

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
      if (this.gameState === 'splash' && this.assetsLoaded) {
        this.startGame();
        return;
      }
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

    // Items collection
    this.items.forEach(item => {
      if (!item.collected &&
          this.player.x < item.x + item.width &&
          this.player.x + this.player.width > item.x &&
          this.player.y < item.y + item.height &&
          this.player.y + this.player.height > item.y) {
        item.collected = true;
        this.collectedItems++;
      }
    });

    // Open exit when enough items collected
    this.exit.isOpen = this.collectedItems >= this.requiredItems;

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

    // Reset items and exit
    this.items = this.generateItems();
    this.collectedItems = 0;
    this.exit.isOpen = false;
  }

  nextLevel() {
    this.currentLevel++;
    this.walls = this.generateWalls();
    this.enemies = this.generateEnemies();
    this.items = this.generateItems();
    this.collectedItems = 0;
    this.exit.isOpen = false;
    // Keep player spawn consistent
    this.player.x = 20;
    this.player.y = 20;
    this.player.vx = 0;
    this.player.vy = 0;
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
    // Draw background (image if loaded, else black)
    if (this.images.background && this.images.background.complete) {
      this.ctx.drawImage(this.images.background, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.gameState === 'splash') {
      // Splashscreen centered
      if (this.images.splash && this.images.splash.complete) {
        this.ctx.drawImage(this.images.splash, 0, 0, this.width, this.height);
      }
      // Hint text
      this.ctx.fillStyle = '#FA6400';
      this.ctx.font = '14px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Tap or press any key to start', this.width / 2, this.height - 16);
      return;
    }

    if (this.gameState === 'allComplete') {
      // Show endscreen image if available
      if (this.images.endscreen && this.images.endscreen.complete) {
        this.ctx.drawImage(this.images.endscreen, 0, 0, this.width, this.height);
      } else {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME COMPLETE!', this.width / 2, this.height / 2 - 20);
        this.ctx.fillText('All 5 levels cleared!', this.width / 2, this.height / 2 + 10);
      }
      return;
    }

    // Render walls (overlay simple lines to indicate platforms)
    this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
    this.walls.forEach(wall => {
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Render exit door with image
    if (this.images.exit && this.images.exit.complete) {
      this.ctx.globalAlpha = this.exit.isOpen ? 1 : 0.6;
      this.ctx.drawImage(this.images.exit, this.exit.x, this.exit.y, this.exit.width, this.exit.height);
      this.ctx.globalAlpha = 1;
    } else {
      this.ctx.fillStyle = this.exit.isOpen ? '#7FFF7F' : '#888888';
      this.ctx.fillRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height);
    }

    // Render items (keycards)
    this.items.forEach(item => {
      if (!item.collected) {
        if (this.images.item && this.images.item.complete) {
          this.ctx.drawImage(this.images.item, item.x, item.y, item.width, item.height);
        } else {
          this.ctx.fillStyle = '#FFD700';
          this.ctx.fillRect(item.x, item.y, item.width, item.height);
        }
      }
    });

    // Render player with image
    if (this.images.player && this.images.player.complete) {
      this.ctx.drawImage(this.images.player, this.player.x, this.player.y, this.player.width, this.player.height);
    } else {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    // Render enemies with image
    this.enemies.forEach(enemy => {
      if (this.images.enemy && this.images.enemy.complete) {
        this.ctx.drawImage(this.images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
      } else {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }
    });

    // Render HUD with orange color (#FA6400)
    this.ctx.fillStyle = '#FA6400';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Level: ${this.currentLevel}/${this.maxLevels}`, 10, 20);
    this.ctx.fillText(`Gravity: ${this.player.gravityDirection}`, 10, 35);
    this.ctx.fillText(`Keys: ${this.collectedItems}/${this.requiredItems}`, 10, 50);

    // Exit status
    if (this.exit.isOpen) {
      this.ctx.fillText('Exit: OPEN', 10, 65);
    } else {
      this.ctx.fillText('Exit: CLOSED', 10, 65);
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

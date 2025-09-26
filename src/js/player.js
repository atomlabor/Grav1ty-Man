/**
 * Gravity-Man Player Class
 * Spieler-Logik und Animation mit erweiterten Bewegungsmethoden
 * COMMODORE C16/PLUS4 BLACK & WHITE COLOR SCHEME
 */
class Player {
  constructor(x = 50, y = 50) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 16;
    this.height = 16;
    
    // Movement
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 2;
    this.maxSpeed = 8;
    this.isGrounded = false;
    this.friction = 0.9;
    this.bounceEnabled = false;
    
    // Animation
    this.currentFrame = 0;
    this.frameTime = 0;
    this.animationSpeed = 200; // ms
    this.direction = 'right'; // up, down, left, right
    
    // State
    this.isAlive = true;
    this.hasReachedGoal = false;
    this.invulnerable = false;
    this.invulnerabilityTime = 0;
    
    // Trail effect for debugging
    this.trail = [];
    this.maxTrailLength = 10;
    
    // C16/Plus4 Color Palette (Black & White)
    this.colors = {
      white: '#FFFFFF',
      black: '#000000',
      darkGray: '#444444',
      lightGray: '#CCCCCC'
    };
  }
  
  update(deltaTime, gravity, level) {
    if (!this.isAlive) return;
    
    // Handle invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTime -= deltaTime;
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Apply gravity
    this.applyGravity(gravity);
    
    // Update position
    this.move();
    
    // Check level collisions
    if (level) {
      this.checkLevelCollisions(level);
    }
    
    // Update animation
    this.updateAnimation(deltaTime);
    
    // Keep player in bounds
    this.constrainToBounds();
    
    // Update trail
    this.updateTrail();
  }
  
  applyGravity(gravity) {
    const gravityForce = gravity.strength || 0.5;
    
    switch(gravity.direction) {
      case 'down':
        this.velocityY += gravityForce;
        this.direction = 'down';
        break;
      case 'up':
        this.velocityY -= gravityForce;
        this.direction = 'up';
        break;
      case 'left':
        this.velocityX -= gravityForce;
        this.direction = 'left';
        break;
      case 'right':
        this.velocityX += gravityForce;
        this.direction = 'right';
        break;
    }
    
    // Limit max speed
    this.velocityX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocityX));
    this.velocityY = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocityY));
  }
  
  move() {
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Apply friction
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
  }
  
  checkLevelCollisions(level) {
    if (!level.platforms) return;
    
    this.isGrounded = false;
    
    for (const platform of level.platforms) {
      if (this.checkCollision(platform)) {
        this.handlePlatformCollision(platform);
      }
    }
    
    // Check goal
    if (level.goal && this.checkCollision(level.goal)) {
      this.reachGoal();
    }
    
    // Check hazards
    if (level.hazards) {
      for (const hazard of level.hazards) {
        if (this.checkCollision(hazard) && !this.invulnerable) {
          this.takeDamage();
        }
      }
    }
  }
  
  handlePlatformCollision(platform) {
    const overlapX = Math.min(this.x + this.width - platform.x, platform.x + platform.width - this.x);
    const overlapY = Math.min(this.y + this.height - platform.y, platform.y + platform.height - this.y);
    
    if (overlapX < overlapY) {
      // Horizontal collision
      if (this.x < platform.x) {
        this.x = platform.x - this.width;
        if (this.velocityX > 0) this.velocityX = this.bounceEnabled ? -this.velocityX * 0.5 : 0;
      } else {
        this.x = platform.x + platform.width;
        if (this.velocityX < 0) this.velocityX = this.bounceEnabled ? -this.velocityX * 0.5 : 0;
      }
    } else {
      // Vertical collision
      if (this.y < platform.y) {
        this.y = platform.y - this.height;
        if (this.velocityY > 0) {
          this.velocityY = this.bounceEnabled ? -this.velocityY * 0.5 : 0;
          this.isGrounded = true;
        }
      } else {
        this.y = platform.y + platform.height;
        if (this.velocityY < 0) this.velocityY = this.bounceEnabled ? -this.velocityY * 0.5 : 0;
      }
    }
  }
  
  updateAnimation(deltaTime) {
    this.frameTime += deltaTime;
    
    if (this.frameTime >= this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % 4;
      this.frameTime = 0;
    }
  }
  
  updateTrail() {
    this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }
  
  constrainToBounds() {
    // Keep player within canvas bounds
    if (this.x < 0) {
      this.x = 0;
      this.velocityX = 0;
    }
    if (this.x + this.width > 240) {
      this.x = 240 - this.width;
      this.velocityX = 0;
    }
    if (this.y < 0) {
      this.y = 0;
      this.velocityY = 0;
    }
    if (this.y + this.height > 282) {
      this.y = 282 - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
    }
  }
  
  render(ctx) {
    if (!this.isAlive) return;
    
    // Render trail in black & white
    this.renderTrail(ctx);
    
    // Player body with pixel-perfect black & white design
    ctx.fillStyle = this.invulnerable ? 
      (Math.floor(Date.now() / 100) % 2 ? this.colors.white : this.colors.black) : 
      this.colors.white;
    
    // Draw pixel-perfect sprite
    this.drawPixelSprite(ctx);
  }
  
  drawPixelSprite(ctx) {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    
    // C16/Plus4 style pixelated character (16x16)
    ctx.fillStyle = this.invulnerable ? 
      (Math.floor(Date.now() / 100) % 2 ? this.colors.black : this.colors.white) : 
      this.colors.white;
    
    // Main body - sharp pixel blocks
    ctx.fillRect(x + 2, y + 2, 12, 12);
    
    // Black outline/border for definition
    ctx.fillStyle = this.colors.black;
    // Top border
    ctx.fillRect(x + 1, y + 1, 14, 1);
    // Bottom border
    ctx.fillRect(x + 1, y + 14, 14, 1);
    // Left border
    ctx.fillRect(x + 1, y + 2, 1, 12);
    // Right border
    ctx.fillRect(x + 14, y + 2, 1, 12);
    
    // Direction indicator - white pixels
    ctx.fillStyle = this.colors.white;
    const centerX = x + 8;
    const centerY = y + 8;
    
    switch(this.direction) {
      case 'up':
        ctx.fillRect(centerX - 1, y + 3, 2, 2);
        break;
      case 'down':
        ctx.fillRect(centerX - 1, y + 11, 2, 2);
        break;
      case 'left':
        ctx.fillRect(x + 3, centerY - 1, 2, 2);
        break;
      case 'right':
        ctx.fillRect(x + 11, centerY - 1, 2, 2);
        break;
    }
    
    // Eyes - black pixels for contrast
    ctx.fillStyle = this.colors.black;
    ctx.fillRect(x + 4, y + 5, 2, 2);
    ctx.fillRect(x + 10, y + 5, 2, 2);
  }
  
  renderTrail(ctx) {
    if (this.trail.length < 2) return;
    
    // Black & white trail effect
    ctx.strokeStyle = this.colors.darkGray;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.floor(this.trail[0].x), Math.floor(this.trail[0].y));
    
    for (let i = 1; i < this.trail.length; i++) {
      ctx.lineTo(Math.floor(this.trail[i].x), Math.floor(this.trail[i].y));
    }
    
    ctx.stroke();
  }
  
  // Movement methods
  jump(force = 5) {
    if (this.isGrounded) {
      this.velocityY = -force;
      this.isGrounded = false;
    }
  }
  
  moveLeft(force = 1) {
    this.velocityX -= force;
  }
  
  moveRight(force = 1) {
    this.velocityX += force;
  }
  
  boost(multiplier = 1.5) {
    this.velocityX *= multiplier;
    this.velocityY *= multiplier;
  }
  
  stop() {
    this.velocityX *= 0.5;
    this.velocityY *= 0.5;
  }
  
  reset(x, y) {
    this.x = x || this.startX;
    this.y = y || this.startY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isAlive = true;
    this.hasReachedGoal = false;
    this.invulnerable = false;
    this.invulnerabilityTime = 0;
    this.currentFrame = 0;
    this.trail = [];
  }
  
  checkCollision(rect) {
    return this.x < rect.x + rect.width &&
           this.x + this.width > rect.x &&
           this.y < rect.y + rect.height &&
           this.y + this.height > rect.y;
  }
  
  takeDamage() {
    if (this.invulnerable) return;
    
    this.invulnerable = true;
    this.invulnerabilityTime = 1000; // 1 second invulnerability
    
    // Small knockback
    this.velocityX += (Math.random() - 0.5) * 4;
    this.velocityY += (Math.random() - 0.5) * 4;
    
    console.log('💥 Player took damage');
  }
  
  die() {
    this.isAlive = false;
    console.log('💀 Player died');
  }
  
  reachGoal() {
    this.hasReachedGoal = true;
    console.log('🎯 Player reached goal!');
  }
  
  // Getter methods
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }
  
  getRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}

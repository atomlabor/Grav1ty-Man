/**
 * Gravity-Man Player Class
 * Spieler-Logik und Animation mit erweiterten Bewegungsmethoden
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
    
    // Render trail
    this.renderTrail(ctx);
    
    // Player body with invulnerability effect
    ctx.fillStyle = this.invulnerable ? 
      (Math.floor(Date.now() / 100) % 2 ? '#ff6b35' : '#ffffff') : 
      '#ff6b35';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Direction indicator
    ctx.fillStyle = '#ffffff';
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    switch(this.direction) {
      case 'up':
        ctx.fillRect(centerX - 2, this.y, 4, 4);
        break;
      case 'down':
        ctx.fillRect(centerX - 2, this.y + this.height - 4, 4, 4);
        break;
      case 'left':
        ctx.fillRect(this.x, centerY - 2, 4, 4);
        break;
      case 'right':
        ctx.fillRect(this.x + this.width - 4, centerY - 2, 4, 4);
        break;
    }
    
    // Eyes for character
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.x + 3, this.y + 3, 2, 2);
    ctx.fillRect(this.x + 11, this.y + 3, 2, 2);
  }
  
  renderTrail(ctx) {
    if (this.trail.length < 2) return;
    
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.trail[0].x, this.trail[0].y);
    
    for (let i = 1; i < this.trail.length; i++) {
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
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

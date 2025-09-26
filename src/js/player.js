/**
 * Gravity-Man Player Class
 * Spieler-Logik und Animation
 */

class Player {
  constructor(x = 50, y = 50) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    
    // Movement
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 2;
    this.isGrounded = false;
    
    // Animation
    this.currentFrame = 0;
    this.frameTime = 0;
    this.animationSpeed = 200; // ms
    this.direction = 'right'; // up, down, left, right
    
    // State
    this.isAlive = true;
    this.hasReachedGoal = false;
  }
  
  update(deltaTime, gravity) {
    if (!this.isAlive) return;
    
    // Apply gravity
    this.applyGravity(gravity);
    
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Update animation
    this.updateAnimation(deltaTime);
    
    // Keep player in bounds
    this.constrainToBounds();
  }
  
  applyGravity(gravity) {
    const gravityForce = 0.5;
    
    switch(gravity.direction) {
      case 'down':
        this.velocityY += gravityForce;
        break;
      case 'up':
        this.velocityY -= gravityForce;
        break;
      case 'left':
        this.velocityX -= gravityForce;
        break;
      case 'right':
        this.velocityX += gravityForce;
        break;
    }
    
    // Apply friction
    this.velocityX *= 0.9;
    this.velocityY *= 0.9;
  }
  
  updateAnimation(deltaTime) {
    this.frameTime += deltaTime;
    
    if (this.frameTime >= this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % 4;
      this.frameTime = 0;
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
    }
  }
  
  render(ctx) {
    if (!this.isAlive) return;
    
    // Simple colored rectangle for now
    ctx.fillStyle = '#ff6b35';
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
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isAlive = true;
    this.hasReachedGoal = false;
    this.currentFrame = 0;
  }
  
  checkCollision(rect) {
    return this.x < rect.x + rect.width &&
           this.x + this.width > rect.x &&
           this.y < rect.y + rect.height &&
           this.y + this.height > rect.y;
  }
  
  die() {
    this.isAlive = false;
    console.log('💀 Player died');
  }
  
  reachGoal() {
    this.hasReachedGoal = true;
    console.log('🎯 Player reached goal!');
  }
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}

/**
 * Gravity-Man Player Class
 * Sprite-based rendering using grav1tyman-player.png in BW
 */
class Player {
  constructor(x = 50, y = 50) {
    this.x = x; this.y = y; this.startX = x; this.startY = y;
    this.width = 16; this.height = 16;
    // Movement
    this.velocityX = 0; this.velocityY = 0; this.speed = 2; this.maxSpeed = 8; this.isGrounded = false; this.friction = 0.9; this.bounceEnabled = false;
    // Animation/state
    this.currentFrame = 0; this.frameTime = 0; this.animationSpeed = 200; this.direction = 'right';
    this.isAlive = true; this.hasReachedGoal = false; this.invulnerable = false; this.invulnerabilityTime = 0;
    // Trail (kept)
    this.trail = []; this.maxTrailLength = 10;
    // Colors (BW)
    this.colors = { white: '#FFFFFF', black: '#000000', darkGray: '#444444', lightGray: '#CCCCCC' };
    // Sprite image
    this.sprite = new Image();
    this.sprite.src = 'grav1tyman-player.png';
    this.spriteLoaded = false;
    this.sprite.onload = () => { this.spriteLoaded = true; };
    this.sprite.onerror = () => { console.warn('Failed to load player sprite'); };
  }

  update(deltaTime, gravity, level) {
    if (!this.isAlive) return;
    if (this.invulnerable) { this.invulnerabilityTime -= deltaTime; if (this.invulnerabilityTime <= 0) this.invulnerable = false; }
    this.applyGravity(gravity);
    this.move();
    if (level) this.checkLevelCollisions(level);
    this.updateAnimation(deltaTime);
    this.constrainToBounds();
    this.updateTrail();
  }

  applyGravity(gravity) {
    const g = gravity.strength || 0.5;
    switch (gravity.direction) {
      case 'down': this.velocityY += g; this.direction = 'down'; break;
      case 'up': this.velocityY -= g; this.direction = 'up'; break;
      case 'left': this.velocityX -= g; this.direction = 'left'; break;
      case 'right': this.velocityX += g; this.direction = 'right'; break;
    }
    this.velocityX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocityX));
    this.velocityY = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocityY));
  }

  move() { this.x += this.velocityX; this.y += this.velocityY; this.velocityX *= this.friction; this.velocityY *= this.friction; }

  checkLevelCollisions(level) {
    if (!level.platforms) return; this.isGrounded = false;
    for (const platform of level.platforms) if (this.checkCollision(platform)) this.handlePlatformCollision(platform);
    if (level.goal && this.checkCollision(level.goal)) this.reachGoal();
    if (level.hazards) for (const h of level.hazards) if (this.checkCollision(h) && !this.invulnerable) this.takeDamage();
  }

  handlePlatformCollision(platform) {
    const overlapX = Math.min(this.x + this.width - platform.x, platform.x + platform.width - this.x);
    const overlapY = Math.min(this.y + this.height - platform.y, platform.y + platform.height - this.y);
    if (overlapX < overlapY) {
      if (this.x < platform.x) { this.x = platform.x - this.width; if (this.velocityX > 0) this.velocityX = this.bounceEnabled ? -this.velocityX * 0.5 : 0; }
      else { this.x = platform.x + platform.width; if (this.velocityX < 0) this.velocityX = this.bounceEnabled ? -this.velocityX * 0.5 : 0; }
    } else {
      if (this.y < platform.y) { this.y = platform.y - this.height; if (this.velocityY > 0) { this.velocityY = this.bounceEnabled ? -this.velocityY * 0.5 : 0; this.isGrounded = true; } }
      else { this.y = platform.y + platform.height; if (this.velocityY < 0) this.velocityY = this.bounceEnabled ? -this.velocityY * 0.5 : 0; }
    }
  }

  updateAnimation(deltaTime) { this.frameTime += deltaTime; if (this.frameTime >= this.animationSpeed) { this.currentFrame = (this.currentFrame + 1) % 4; this.frameTime = 0; } }

  updateTrail() { this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 }); if (this.trail.length > this.maxTrailLength) this.trail.shift(); }

  constrainToBounds() {
    if (this.x < 0) { this.x = 0; this.velocityX = 0; }
    if (this.x + this.width > 240) { this.x = 240 - this.width; this.velocityX = 0; }
    if (this.y < 0) { this.y = 0; this.velocityY = 0; }
    if (this.y + this.height > 282) { this.y = 282 - this.height; this.velocityY = 0; this.isGrounded = true; }
  }

  render(ctx) {
    if (!this.isAlive) return;
    this.renderTrail(ctx);
    const x = Math.floor(this.x), y = Math.floor(this.y), w = this.width, h = this.height;
    if (this.spriteLoaded) {
      // Draw sprite in grayscale (ensure s/w)
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      // Draw sprite to offscreen to convert to BW
      const off = document.createElement('canvas'); off.width = w; off.height = h; const octx = off.getContext('2d', { willReadFrequently: true });
      // Maintain aspect ratio: fit contain into w x h
      const iw = this.sprite.naturalWidth || this.sprite.width; const ih = this.sprite.naturalHeight || this.sprite.height;
      const scale = Math.min(w / iw, h / ih); const dw = Math.floor(iw * scale); const dh = Math.floor(ih * scale);
      const dx = Math.floor((w - dw) / 2); const dy = Math.floor((h - dh) / 2);
      octx.imageSmoothingEnabled = false; octx.drawImage(this.sprite, 0, 0, iw, ih, dx, dy, dw, dh);
      // Grayscale conversion
      try {
        const imgData = octx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
          if (a === 0) continue;
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b; // linear RGB approx
          d[i] = d[i + 1] = d[i + 2] = lum;
        }
        octx.putImageData(imgData, 0, 0);
      } catch (e) {
        // Fallback: overlay with white using source-atop to enforce BW
        octx.globalCompositeOperation = 'saturation';
        octx.fillStyle = '#000';
        octx.fillRect(0, 0, w, h);
        octx.globalCompositeOperation = 'source-over';
      }
      // Blink when invulnerable by alternating composite
      if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
        ctx.globalAlpha = 0.5;
      }
      ctx.drawImage(off, x, y);
      ctx.restore();
    } else {
      // Fallback: simple BW pixel block
      ctx.fillStyle = this.invulnerable ? (Math.floor(Date.now()/100)%2 ? this.colors.white : this.colors.black) : this.colors.white;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = this.colors.black;
      ctx.strokeStyle = this.colors.black;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
  }

  renderTrail(ctx) {
    if (this.trail.length < 2) return;
    ctx.strokeStyle = this.colors.darkGray; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(Math.floor(this.trail[0].x), Math.floor(this.trail[0].y));
    for (let i = 1; i < this.trail.length; i++) ctx.lineTo(Math.floor(this.trail[i].x), Math.floor(this.trail[i].y));
    ctx.stroke();
  }

  // Movement helpers
  jump(force = 5) { if (this.isGrounded) { this.velocityY = -force; this.isGrounded = false; } }
  moveLeft(force = 1) { this.velocityX -= force; }
  moveRight(force = 1) { this.velocityX += force; }
  boost(multiplier = 1.5) { this.velocityX *= multiplier; this.velocityY *= multiplier; }
  stop() { this.velocityX *= 0.5; this.velocityY *= 0.5; }

  reset(x, y) {
    this.x = x || this.startX; this.y = y || this.startY; this.velocityX = 0; this.velocityY = 0; this.isAlive = true; this.hasReachedGoal = false; this.invulnerable = false; this.invulnerabilityTime = 0; this.currentFrame = 0; this.trail = [];
  }

  checkCollision(rect) { return this.x < rect.x + rect.width && this.x + this.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y; }

  takeDamage() { if (this.invulnerable) return; this.invulnerable = true; this.invulnerabilityTime = 1000; this.velocityX += (Math.random()-0.5)*4; this.velocityY += (Math.random()-0.5)*4; }
  die() { this.isAlive = false; }
  reachGoal() { this.hasReachedGoal = true; }

  getCenter() { return { x: this.x + this.width / 2, y: this.y + this.height / 2 }; }
  getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
}
if (typeof module !== 'undefined' && module.exports) { module.exports = Player; }

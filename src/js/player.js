// player.js – Gravity-Man Player Klasse (komplett, mit BW-Rendering, Animation, Physik, Kollision, Boost, Trail)

class Player {
  constructor(x = 50, y = 50, sprites = {}) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 14;
    this.height = 18;
    // Bewegungsphysik
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 8;
    this.friction = 0.97;
    this.gravityDir = 'down'; // 'up', 'down', 'left', 'right'
    this.sprites = sprites;
    this.isGrounded = false;
    this.isAlive = true;
    this.invulnerable = false;
    this.invulTime = 0;

    // Anim
    this.currentFrame = 0;
    this.frameTime = 0;
    this.animSpeed = 180;
    this.trail = [];
    this.trailLen = 8;

    // Sprite (SW Style)
    this.sprite = sprites.player ? sprites.player.img : null;
  }

  setGravity(dir) {
    this.gravityDir = dir;
  }

  boost() {
    const b = 1.6;
    if (this.gravityDir === 'up') this.vy -= b;
    else if (this.gravityDir === 'down') this.vy += b;
    else if (this.gravityDir === 'left') this.vx -= b;
    else this.vx += b;
  }

  update(level) {
    if (!this.isAlive) return;
    if (this.invulnerable) {
      this.invulTime -= 16;
      if (this.invulTime <= 0) this.invulnerable = false;
    }
    // Physik und Gravitation
    const g = 0.18;
    if (this.gravityDir === 'down') this.vy += g;
    else if (this.gravityDir === 'up') this.vy -= g;
    else if (this.gravityDir === 'left') this.vx -= g;
    else if (this.gravityDir === 'right') this.vx += g;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));
    this.vy = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vy));
    this.x += this.vx;
    this.y += this.vy;
    this.handleCollisions(level);
    this.updateTrail();
    this.constrainToBounds();
  }

  handleCollisions(level) {
    if (!level?.walls) return;
    this.isGrounded = false;
    const r = this.getRect();
    for (const w of level.walls) {
      if (Player.hit(r, { x: w.x, y: w.y, w: w.width, h: w.height })) {
        const dx1 = (w.x + w.width) - r.x,
              dx2 = (r.x + r.w) - w.x,
              dy1 = (w.y + w.height) - r.y,
              dy2 = (r.y + r.h) - w.y;
        const minx = Math.min(dx1, dx2), miny = Math.min(dy1, dy2);
        if (minx < miny) {
          if (dx1 < dx2) this.x = w.x + w.width;
          else this.x = w.x - this.width;
          this.vx = 0;
        } else {
          if (dy1 < dy2) this.y = w.y + w.height;
          else this.y = w.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        }
      }
    }
  }

  getRect() {
    return {x: this.x, y: this.y, w: this.width, h: this.height};
  }

  coll(obj) {
    return Player.hit(this.getRect(), obj);
  }

  static hit(a, b) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  updateTrail() {
    this.trail.push({x: this.x + this.width/2, y: this.y + this.height/2});
    if (this.trail.length > this.trailLen) this.trail.shift();
  }

  constrainToBounds() {
    this.x = Math.max(0, Math.min(240 - this.width, this.x));
    this.y = Math.max(0, Math.min(282 - this.height, this.y));
  }

  render(ctx) {
    // Trail
    if (this.trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++)
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
      ctx.restore();
    }
    // Player Sprite (SW)
    if (this.sprite && this.sprites.player.loaded) {
      ctx.filter = 'grayscale(100%) contrast(120%)';
      ctx.drawImage(this.sprite, this.x | 0, this.y | 0, this.width, this.height);
      ctx.filter = 'none';
      if (this.invulnerable && Math.floor(Date.now()/100)%2) ctx.globalAlpha = 0.5;
    } else {
      ctx.fillStyle = this.invulnerable ? '#444' : '#FFF';
      ctx.fillRect(this.x | 0, this.y | 0, this.width, this.height);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(this.x | 0, this.y | 0, this.width, this.height);
    }
    ctx.globalAlpha = 1.0;
  }

  jump(force = 5) {
    if (this.isGrounded) {
      this.vy = -force;
      this.isGrounded = false;
    }
  }
  reset(x, y) {
    this.x = x ?? this.startX;
    this.y = y ?? this.startY;
    this.vx = 0;
    this.vy = 0;
    this.isAlive = true;
    this.invulnerable = false;
    this.invulTime = 0;
    this.currentFrame = 0;
    this.trail = [];
  }
  takeDamage() {
    if (this.invulnerable) return;
    this.invulnerable = true;
    this.invulTime = 800;
    this.vx += (Math.random()-0.5)*4;
    this.vy += (Math.random()-0.5)*4;
  }
  die() { this.isAlive = false; }

}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}

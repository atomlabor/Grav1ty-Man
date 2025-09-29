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
    this.waitForAssets(() => { this.assetsLoaded = true; });
    this.currentLevel = 1;
    this.maxLevels = 5;
    this.gameState = 'splash'; // splash, playing, gameOver, levelComplete, allComplete
    // Player setup
    this.player = { x: 20, y: 20, width: 16, height: 16, vx: 0, vy: 0, gravity: 0.3, gravityDirection: 'down' };
    // Items (one keycard per level for now)
    this.items = this.generateItems();
    // Enemies setup
    this.enemies = this.generateEnemies();
    // Level boundaries
    this.walls = this.generateWalls();
    // Exit door
    this.exit = { x: this.width - 30, y: this.height - 30, width: 20, height: 20, isOpen: false };
    this.collectedItems = 0;
    this.requiredItems = 1; // open exit after collecting 1 keycard
    // Track if deviceorientation has ever fired
    this.orientationReceived = false;
    // Gyro controls for Rabbit R1 and browsers
    this.setupGyroControls();
    // Fallback start listeners (touch/click/key) while on splash
    this.setupStartFallback();
    // Start loop
    this.gameLoop();
  }
  loadImage(src) { const img = new Image(); img.src = src; return img; }
  waitForAssets(cb) {
    const imgs = Object.values(this.images);
    let loaded = 0;
    imgs.forEach(img => {
      const done = () => { if (++loaded === imgs.length) cb(); };
      if (img.complete) done(); else { img.onload = done; img.onerror = done; }
    });
  }
  startGame() { this.gameState = 'playing'; }
  generateItems() { return [{ x: Math.random() * (this.width - 40) + 20, y: Math.random() * (this.height - 60) + 30, width: 12, height: 12, collected: false }]; }
  generateEnemies() {
    const enemies = []; const enemyCount = 2 + this.currentLevel;
    for (let i = 0; i < enemyCount; i++) enemies.push({ x: Math.random() * (this.width - 50) + 25, y: Math.random() * (this.height - 50) + 25, width: 14, height: 14, vx: 0, vy: 0, gravity: 0.3, gravityDirection: 'down' });
    return enemies;
  }
  generateWalls() {
    const walls = [
      {x: 0, y: 0, width: this.width, height: 10},
      {x: 0, y: this.height - 10, width: this.width, height: 10},
      {x: 0, y: 0, width: 10, height: this.height},
      {x: this.width - 10, y: 0, width: 10, height: this.height}
    ];
    const platformCount = 2 + this.currentLevel;
    for (let i = 0; i < platformCount; i++) walls.push({ x: Math.random() * (this.width - 80) + 20, y: Math.random() * (this.height - 80) + 20, width: 60 + Math.random() * 40, height: 10 });
    return walls;
  }
  setupGyroControls() {
    const tryStart = () => { if (this.gameState === 'splash' && this.assetsLoaded) this.startGame(); };
    const requestPermissionIfNeeded = () => {
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') {
        D.requestPermission().catch(() => {}).finally(() => {
          window.removeEventListener('click', requestPermissionIfNeeded);
          window.removeEventListener('touchstart', requestPermissionIfNeeded);
          tryStart();
        });
      } else {
        window.removeEventListener('click', requestPermissionIfNeeded);
        window.removeEventListener('touchstart', requestPermissionIfNeeded);
        tryStart();
      }
    };
    window.addEventListener('click', requestPermissionIfNeeded, { once: true });
    window.addEventListener('touchstart', requestPermissionIfNeeded, { once: true });
    const handleOrientation = (e) => {
      this.orientationReceived = true;
      if (this.gameState === 'splash' && this.assetsLoaded) this.startGame();
      const { beta, gamma } = e; if (beta == null || gamma == null) return;
      const absGamma = Math.abs(gamma), absBeta = Math.abs(beta);
      let dir = this.player.gravityDirection;
      if (absGamma > absBeta) { if (gamma < -10) dir = 'left'; else if (gamma > 10) dir = 'right'; }
      else { if (beta < -10) dir = 'up'; else if (beta > 10) dir = 'down'; }
      if (dir !== this.player.gravityDirection) { this.player.gravityDirection = dir; this.enemies.forEach(en => en.gravityDirection = dir); }
    };
    window.addEventListener('deviceorientation', handleOrientation);
  }
  setupStartFallback() {
    const canUseOrientation = !!window.DeviceOrientationEvent;
    const maybeStart = () => { if (this.gameState === 'splash' && this.assetsLoaded && (!canUseOrientation || !this.orientationReceived)) this.startGame(); };
    const startOnUserInput = () => { maybeStart(); };
    window.addEventListener('click', startOnUserInput, { passive: true });
    window.addEventListener('touchstart', startOnUserInput, { passive: true });
    window.addEventListener('keydown', startOnUserInput, { passive: true });
    const loopCleanup = () => { if (this.gameState !== 'splash') { window.removeEventListener('click', startOnUserInput); window.removeEventListener('touchstart', startOnUserInput); window.removeEventListener('keydown', startOnUserInput); } else { requestAnimationFrame(loopCleanup); } };
    requestAnimationFrame(loopCleanup);
  }
  setupControls() { /* disabled */ }
  applyGravity(entity) {
    switch(entity.gravityDirection) {
      case 'up': entity.vy -= entity.gravity; break;
      case 'down': entity.vy += entity.gravity; break;
      case 'left': entity.vx -= entity.gravity; break;
      case 'right': entity.vx += entity.gravity; break;
    }
    entity.vx *= 0.98; entity.vy *= 0.98; entity.x += entity.vx; entity.y += entity.vy;
  }
  checkWallCollision(entity) {
    let collided = false;
    this.walls.forEach(wall => {
      if (entity.x < wall.x + wall.width && entity.x + entity.width > wall.x && entity.y < wall.y + wall.height && entity.y + entity.height > wall.y) {
        if (entity.vx > 0 && entity.x < wall.x) { entity.x = wall.x - entity.width; entity.vx = 0; }
        else if (entity.vx < 0 && entity.x > wall.x) { entity.x = wall.x + wall.width; entity.vx = 0; }
        if (entity.vy > 0 && entity.y < wall.y) { entity.y = wall.y - entity.height; entity.vy = 0; }
        else if (entity.vy < 0 && entity.y > wall.y) { entity.y = wall.y + wall.height; entity.vy = 0; }
        collided = true;
      }
    });
    return collided;
  }
  checkCollisions() {
    this.enemies.forEach(enemy => {
      if (this.player.x < enemy.x + enemy.width && this.player.x + this.player.width > enemy.x && this.player.y < enemy.y + enemy.height && this.player.y + this.player.height > enemy.y) this.resetLevel();
    });
    this.items.forEach(item => {
      if (!item.collected && this.player.x < item.x + item.width && this.player.x + this.player.width > item.x && this.player.y < item.y + item.height && this.player.y + this.player.height > item.y) { item.collected = true; this.collectedItems++; }
    });
    this.exit.isOpen = this.collectedItems >= this.requiredItems;
    if (this.exit.isOpen && this.player.x < this.exit.x + this.exit.width && this.player.x + this.player.width > this.exit.x && this.player.y < this.exit.y + this.exit.height && this.player.y + this.player.height > this.exit.y) {
      if (this.currentLevel < this.maxLevels) this.nextLevel(); else this.gameState = 'allComplete';
    }
  }
  resetLevel() {
    this.player.x = 20; this.player.y = 20; this.player.vx = 0; this.player.vy = 0;
    this.enemies = this.generateEnemies(); this.items = this.generateItems(); this.collectedItems = 0; this.exit.isOpen = false;
  }
  nextLevel() {
    this.currentLevel++; this.walls = this.generateWalls(); this.enemies = this.generateEnemies(); this.items = this.generateItems();
    this.collectedItems = 0; this.exit.isOpen = false; this.player.x = 20; this.player.y = 20; this.player.vx = 0; this.player.vy = 0;
  }
  update() {
    if (this.gameState !== 'playing') return;
    this.applyGravity(this.player); this.checkWallCollision(this.player);
    this.enemies.forEach(enemy => { this.applyGravity(enemy); this.checkWallCollision(enemy); });
    this.checkCollisions();
  }
  render() {
    if (this.images.background && this.images.background.complete) this.ctx.drawImage(this.images.background, 0, 0, this.width, this.height);
    else { this.ctx.fillStyle = '#000000'; this.ctx.fillRect(0, 0, this.width, this.height); }
    if (this.gameState === 'splash') {
      if (this.images.splash && this.images.splash.complete) this.ctx.drawImage(this.images.splash, 0, 0, this.width, this.height);
      this.ctx.fillStyle = '#FA6400'; this.ctx.font = '14px monospace'; this.ctx.textAlign = 'center';
      this.ctx.fillText('Tilt device to start', this.width / 2, this.height - 16);
      return;
    }
    if (this.gameState === 'allComplete') {
      if (this.images.endscreen && this.images.endscreen.complete) this.ctx.drawImage(this.images.endscreen, 0, 0, this.width, this.height);
      else {
        this.ctx.fillStyle = '#000000'; this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#FFFFFF'; this.ctx.font = '16px monospace'; this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME COMPLETE!', this.width / 2, this.height / 2 - 20);
        this.ctx.fillText('All 5 levels cleared!', this.width / 2, this.height / 2 + 10);
      }
      return;
    }
    this.ctx.fillStyle = 'rgba(255,255,255,0.25)'; this.walls.forEach(w => this.ctx.fillRect(w.x, w.y, w.width, w.height));
    if (this.images.exit && this.images.exit.complete) { this.ctx.globalAlpha = this.exit.isOpen ? 1 : 0.6; this.ctx.drawImage(this.images.exit, this.exit.x, this.exit.y, this.exit.width, this.exit.height); this.ctx.globalAlpha = 1; }
    else { this.ctx.fillStyle = this.exit.isOpen ? '#7FFF7F' : '#888888'; this.ctx.fillRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height); }
    this.items.forEach(item => {
      if (!item.collected) {
        if (this.images.item && this.images.item.complete) this.ctx.drawImage(this.images.item, item.x, item.y, item.width, item.height);
        else { this.ctx.fillStyle = '#FFD700'; this.ctx.fillRect(item.x, item.y, item.width, item.height); }
      }
    });
    if (this.images.player && this.images.player.complete) this.ctx.drawImage(this.images.player, this.player.x, this.player.y, this.player.width, this.player.height);
    else { this.ctx.fillStyle = '#FFFFFF'; this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height); }
    this.enemies.forEach(enemy => {
      if (this.images.enemy && this.images.enemy.complete) this.ctx.drawImage(this.images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
      else { this.ctx.fillStyle = '#FFFFFF'; this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); }
    });
    this.ctx.fillStyle = '#FA6400'; this.ctx.font = '12px monospace'; this.ctx.textAlign = 'left';
    this.ctx.fillText(`Level: ${this.currentLevel}/${this.maxLevels}`, 10, 20);
    this.ctx.fillText(`Gravity: ${this.player.gravityDirection}`, 10, 35);
    this.ctx.fillText(`Items: ${this.collectedItems}/${this.requiredItems}`, 10, 50);
  }
  gameLoop() { this.update(); this.render(); requestAnimationFrame(() => this.gameLoop()); }
}
// Export / global expose
if (typeof window !== 'undefined') { window.Game = Game; }

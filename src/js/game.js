/**
 * Gravity-Man Game Engine
 * Hauptspiel-Loop, Level-Struktur und Steuerung für Rabbit R1
 *
 * RABBIT R1 SDK HINWEIS: Platzhalter-Integration für Button-API vorhanden.
 * COMMODORE C16/PLUS4 BLACK & WHITE THEME APPLIED
 */
// Simple Gravity system helper
class GravitySystem {
  constructor(direction = 'down', strength = 0.5) {
    this.direction = direction; // 'up','down','left','right'
    this.strength = strength;
  }
  changeDirection(dir) {
    const valid = ['up','down','left','right'];
    if (valid.includes(dir)) this.direction = dir;
  }
  update() {}
}
// Simple Level system
class LevelManager {
  constructor(game) {
    this.game = game;
    this.levels = [];
    this.current = null;
    this.createDummyLevels();
  }
  createDummyLevels() {
    // Level Koordinaten basieren auf Canvas 240x282
    // Level 1: Start links oben, Ziel rechts unten, einfache Plattformen + Hazard
    const level1 = {
      id: 1,
      start: { x: 16, y: 16 },
      goal: { x: 240 - 24, y: 282 - 24, width: 16, height: 16, color: '#FFFFFF' },
      platforms: [
        { x: 0, y: 0, width: 240, height: 8, color: '#888888' }, // top wall
        { x: 0, y: 282 - 8, width: 240, height: 8, color: '#888888' }, // bottom wall
        { x: 0, y: 0, width: 8, height: 282, color: '#888888' }, // left wall
        { x: 240 - 8, y: 0, width: 8, height: 282, color: '#888888' }, // right wall
        { x: 30, y: 80, width: 60, height: 8, color: '#BBBBBB' },
        { x: 110, y: 140, width: 80, height: 8, color: '#BBBBBB' },
        { x: 50, y: 210, width: 140, height: 8, color: '#BBBBBB' }
      ],
      hazards: [
        { x: 90, y: 90, width: 16, height: 16, color: '#000000' },
      ]
    };
    this.levels = [level1];
  }
  load(id) {
    const level = this.levels.find(l => l.id === id) || this.levels[0];
    this.current = JSON.parse(JSON.stringify(level)); // clone
    const Player = window.Player || (typeof require !== 'undefined' ? require('./player.js') : null);
    this.game.player = new Player(this.current.start.x, this.current.start.y);
    this.game.gravity = new GravitySystem('down', this.game.gameMode === 'hard' ? 0.7 : 0.5);
  }
  render(ctx) {
    if (!this.current) return;
    // Enforce monochrome rendering regardless of stored colors
    const platformColor = '#BBBBBB';
    const wallColor = '#888888';
    const hazardColor = '#000000';
    const goalColor = '#FFFFFF';

    // platforms
    for (const p of this.current.platforms) {
      const c = (p.height <= 8 || p.width <= 8) ? wallColor : platformColor;
      ctx.fillStyle = c;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.width), Math.floor(p.height));
    }
    // goal
    const g = this.current.goal;
    ctx.fillStyle = goalColor;
    ctx.fillRect(Math.floor(g.x), Math.floor(g.y), Math.floor(g.width), Math.floor(g.height));
    // hazards
    for (const h of (this.current.hazards || [])) {
      ctx.fillStyle = hazardColor;
      ctx.fillRect(Math.floor(h.x), Math.floor(h.y), Math.floor(h.width), Math.floor(h.height));
    }
    // Optional: draw goal outline for visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(g.x) + 0.5, Math.floor(g.y) + 0.5, Math.floor(g.width), Math.floor(g.height));
  }
}
class GravityManGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    // Game State
    this.isRunning = false;
    this.isPaused = false;
    this.currentLevel = 1;
    this.gameMode = 'normal'; // 'normal' | 'hard'
    // Game Objects
    this.player = null;
    this.levels = null; // LevelManager instance
    this.gravity = null; // GravitySystem instance
    this.enemies = { update() {}, render() {} }; // placeholder
    this.audio = null;
    // Frame Rate Control
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    // Rabbit R1 spezifisch
    this.isR1Device = this.detectR1Device();
    this.init();
  }
  detectR1Device() {
    return window.screen.width === 240 && window.screen.height === 282;
  }
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupGameObjects();
    this.setupUI();
    console.log('🎮 Gravity-Man initialized for Rabbit R1');
  }
  setupCanvas() {
    this.canvas.width = 240;
    this.canvas.height = 282;
    this.ctx.imageSmoothingEnabled = false;
  }
  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
    this.setupR1Controls();
  }
  setupR1Controls() {
    // Placeholder for Rabbit R1 SDK
    /* if (typeof rabbit !== 'undefined') {
      rabbit.buttons.onScrollUp(() => this.gravity?.changeDirection('up'));
      rabbit.buttons.onScrollDown(() => this.gravity?.changeDirection('down'));
      rabbit.buttons.onScrollLeft(() => this.gravity?.changeDirection('left'));
      rabbit.buttons.onScrollRight(() => this.gravity?.changeDirection('right'));
      rabbit.buttons.onPushToTalk(() => this.togglePause());
    } */
  }
  setupGameObjects() {
    this.levels = new LevelManager(this);
    this.levels.load(this.currentLevel);
  }
  setupUI() {
    this.updateLevelDisplay();
    this.updateModeDisplay();
  }
  handleKeyDown(event) {
    switch(event.code) {
      case 'ArrowUp':
        this.gravity?.changeDirection('up');
        break;
      case 'ArrowDown':
        this.gravity?.changeDirection('down');
        break;
      case 'ArrowLeft':
        this.gravity?.changeDirection('left');
        break;
      case 'ArrowRight':
        this.gravity?.changeDirection('right');
        break;
      case 'Space':
        event.preventDefault();
        this.start();
        break;
      case 'KeyH':
        this.toggleGameMode();
        break;
      case 'KeyR':
        this.restart();
        break;
      case 'Escape':
        this.togglePause();
        break;
    }
  }
  handleTouch(event) {
    event.preventDefault();
    if (!this.isRunning) { this.start(); return; }
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
      this.gravity?.changeDirection(x > centerX ? 'right' : 'left');
    } else {
      this.gravity?.changeDirection(y > centerY ? 'down' : 'up');
    }
  }
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.gameLoop();
  }
  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
  }
  restart() {
    this.isRunning = false;
    this.isPaused = false;
    this.levels.load(this.currentLevel);
    this.start();
  }
  toggleGameMode() {
    this.gameMode = this.gameMode === 'normal' ? 'hard' : 'normal';
    this.updateModeDisplay();
  }
  gameLoop(currentTime = 0) {
    if (!this.isRunning) return;
    const deltaTime = currentTime - this.lastFrameTime;
    if (deltaTime >= this.frameInterval) {
      this.update(deltaTime);
      this.render();
      this.lastFrameTime = currentTime;
    }
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  update(deltaTime) {
    if (this.isPaused) return;
    this.player?.update(deltaTime, this.gravity, this.levels?.current);
    this.gravity?.update(deltaTime);
    this.enemies?.update(deltaTime);
    this.checkCollisions();
    this.checkLevelComplete();
  }
  render() {
    // Clear to pure black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.isPaused) {
      this.renderPauseScreen();
      return;
    }
    // Minimalist monochrome background pattern for retro feel
    this.renderBackground();
    this.levels?.render(this.ctx);
    this.enemies?.render(this.ctx);
    this.player?.render(this.ctx);
    this.renderUI();
  }
  renderBackground() {
    // Draw subtle scanline pattern in dark gray
    const ctx = this.ctx;
    ctx.fillStyle = '#111111';
    for (let y = 0; y < this.canvas.height; y += 2) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
  }
  renderUI() {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Level: ${this.currentLevel}`, 10, 20);
    this.ctx.fillText(`Mode: ${this.gameMode}`, 10, 35);
    if (!this.isRunning) {
      this.ctx.fillText('Press SPACE or tap to start', 10, 50);
    }
  }
  renderPauseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.textAlign = 'left';
  }
  checkCollisions() {
    // Player-level handled in player.update via checkLevelCollisions
  }
  checkLevelComplete() {
    if (this.player?.hasReachedGoal) {
      this.currentLevel += 1;
      this.updateLevelDisplay();
      if (!this.levels.levels.find(l => l.id === this.currentLevel)) {
        // restart loop for demo
        this.currentLevel = 1;
      }
      this.levels.load(this.currentLevel);
    }
  }
  updateLevelDisplay() {
    const el = document.getElementById('currentLevel');
    if (el) el.textContent = this.currentLevel;
  }
  updateModeDisplay() {
    const el = document.getElementById('gameMode');
    if (el) el.textContent = this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1);
  }
}
// Game Initialisierung wenn DOM geladen
document.addEventListener('DOMContentLoaded', () => {
  // Expose Player globally if required for LevelManager
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }
  window.gravityManGame = new GravityManGame();
});
// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

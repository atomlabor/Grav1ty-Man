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
    this.createLevels();
  }
  /**
   * Level-Dokumentation (Canvas 240x282, C16/Plus4 Schwarz/Weiss Stil)
   * - Jedes Level definiert:
   *   id: Nummer
   *   start: Startkoordinaten des Spielers
   *   goal: Ausgang (klar erkennbar: weisses Portal mit schwarzem Rand, meist an der Wand)
   *   platforms: Wände/Plattformen (8px dicke Wände, hellere Plattformen)
   *   hazards: Gefahren (schwarz)
   * - Beim Erreichen des goal setzt der Game-Loop automatisch auf nächstes Level um (checkLevelComplete)
   */
  createLevels() {
    // WAND-KONSTANTEN
    const W = 240, H = 282, WALL = 8;
    const walls = [
      { x: 0, y: 0, width: W, height: WALL, color: '#888888' }, // top
      { x: 0, y: H - WALL, width: W, height: WALL, color: '#888888' }, // bottom
      { x: 0, y: 0, width: WALL, height: H, color: '#888888' }, // left
      { x: W - WALL, y: 0, width: WALL, height: H, color: '#888888' }, // right
    ];

    // Level 1: Einstieg – diagonale Treppe, Ziel unten rechts an der Wand
    const level1 = {
      id: 1,
      start: { x: WALL + 8, y: WALL + 8 },
      goal: { x: W - WALL - 16, y: H - WALL - 16, width: 16, height: 16, color: '#FFFFFF', style: 'portal-corner' },
      platforms: [
        ...walls,
        { x: 30, y: 80, width: 60, height: 8, color: '#BBBBBB' },
        { x: 110, y: 140, width: 80, height: 8, color: '#BBBBBB' },
        { x: 50, y: 210, width: 140, height: 8, color: '#BBBBBB' },
      ],
      hazards: [ { x: 95, y: 90, width: 16, height: 16, color: '#000000' } ],
      note: 'Einfacher Einstieg mit klar sichtbarem Ausgang unten rechts.'
    };

    // Level 2: Mittleres Labyrinth, Ausgang links Mitte als Portal in Wand
    const level2 = {
      id: 2,
      start: { x: W - WALL - 24, y: WALL + 12 },
      goal: { x: WALL, y: H / 2 - 8, width: 8, height: 16, color: '#FFFFFF', style: 'portal-wall-left' },
      platforms: [
        ...walls,
        { x: 30, y: 60, width: 180, height: 8, color: '#BBBBBB' },
        { x: 30, y: 120, width: 140, height: 8, color: '#BBBBBB' },
        { x: 70, y: 180, width: 100, height: 8, color: '#BBBBBB' },
        { x: 30, y: 240, width: 160, height: 8, color: '#BBBBBB' },
        // vertikale Barrieren
        { x: 100, y: 60, width: 8, height: 60, color: '#BBBBBB' },
        { x: 160, y: 120, width: 8, height: 60, color: '#BBBBBB' },
      ],
      hazards: [
        { x: 176, y: 44, width: 16, height: 16, color: '#000000' },
        { x: 120, y: 210, width: 16, height: 16, color: '#000000' },
      ],
      note: 'Portal-Ausgang in der linken Wand mittig.'
    };

    // Level 3: Schacht – vertikale Korridore, Ausgang oben mittig als Deckenausgang
    const level3 = {
      id: 3,
      start: { x: W / 2 - 8, y: H - WALL - 24 },
      goal: { x: W / 2 - 8, y: 0, width: 16, height: 8, color: '#FFFFFF', style: 'portal-ceiling' },
      platforms: [
        ...walls,
        // Schachtwände
        { x: 60, y: 40, width: 8, height: H - 80, color: '#BBBBBB' },
        { x: W - 68, y: 40, width: 8, height: H - 80, color: '#BBBBBB' },
        // Zwischengesimse
        { x: 80, y: 90, width: 80, height: 8, color: '#BBBBBB' },
        { x: 140, y: 150, width: 60, height: 8, color: '#BBBBBB' },
        { x: 100, y: 210, width: 80, height: 8, color: '#BBBBBB' },
      ],
      hazards: [
        { x: 120, y: 120, width: 16, height: 16, color: '#000000' },
        { x: 90, y: 180, width: 16, height: 16, color: '#000000' },
      ],
      note: 'Ausgang als Decken-Portal mittig, erfordert Schwerkraftwechsel.'
    };

    // Level 4: Zickzack – enge Passagen, Ausgang rechts oben als Wandportal
    const level4 = {
      id: 4,
      start: { x: WALL + 10, y: H - WALL - 24 },
      goal: { x: W - WALL - 8, y: WALL + 24, width: 8, height: 16, color: '#FFFFFF', style: 'portal-wall-right' },
      platforms: [
        ...walls,
        { x: 20, y: 60, width: 200, height: 8, color: '#BBBBBB' },
        { x: 20, y: 100, width: 160, height: 8, color: '#BBBBBB' },
        { x: 60, y: 140, width: 160, height: 8, color: '#BBBBBB' },
        { x: 20, y: 180, width: 160, height: 8, color: '#BBBBBB' },
        { x: 20, y: 220, width: 200, height: 8, color: '#BBBBBB' },
        // vertikale Engen
        { x: 60, y: 60, width: 8, height: 60, color: '#BBBBBB' },
        { x: 140, y: 100, width: 8, height: 60, color: '#BBBBBB' },
        { x: 100, y: 160, width: 8, height: 60, color: '#BBBBBB' },
      ],
      hazards: [
        { x: 180, y: 130, width: 16, height: 16, color: '#000000' },
        { x: 40, y: 200, width: 16, height: 16, color: '#000000' },
      ],
      note: 'Zickzackplattformen, Ausgang als rechtes Wandportal oben.'
    };

    // Optionale Platzhalter für spätere Levels (5..14)
    const placeholders = Array.from({ length: 10 }, (_, i) => ({
      id: 5 + i,
      start: { x: WALL + 8, y: WALL + 8 },
      goal: { x: W - WALL - 16, y: H - WALL - 16, width: 16, height: 16, color: '#FFFFFF', style: 'portal-corner' },
      platforms: [...walls],
      hazards: [],
      note: 'Platzhalter – zur späteren Ausarbeitung.'
    }));

    this.levels = [level1, level2, level3, level4, ...placeholders];
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
    // goal (portal mit schwarzem Rahmen zur besseren Sichtbarkeit)
    const g = this.current.goal;
    ctx.fillStyle = goalColor;
    ctx.fillRect(Math.floor(g.x), Math.floor(g.y), Math.floor(g.width), Math.floor(g.height));
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(g.x) + 0.5, Math.floor(g.y) + 0.5, Math.floor(g.width), Math.floor(g.height));
    // hazards
    for (const h of (this.current.hazards || [])) {
      ctx.fillStyle = hazardColor;
      ctx.fillRect(Math.floor(h.x), Math.floor(h.y), Math.floor(h.width), Math.floor(h.height));
    }
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
    if (this.isPaused)

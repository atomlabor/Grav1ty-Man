/**
 * Gravity-Man Game Engine
 * Hauptspiel-Loop und Rendering für Rabbit R1
 * 
 * RABBIT R1 SDK INTEGRATION HINWEISE:
 * Da aktuell kein offizielles SDK verfügbar ist, verwenden wir Standard-Web-APIs.
 * Geplante Integration sobald verfügbar:
 * 
 * BUTTON CONTROLS:
 * - rabbit.buttons.onScrollUp() => gravity.changeDirection('up')
 * - rabbit.buttons.onScrollDown() => gravity.changeDirection('down') 
 * - rabbit.buttons.onScrollLeft() => gravity.changeDirection('left')
 * - rabbit.buttons.onScrollRight() => gravity.changeDirection('right')
 * - rabbit.buttons.onPushToTalk() => game.togglePause() oder game.restart()
 * 
 * DISPLAY OPTIMIZATION:
 * - rabbit.display.setResolution(240, 282) // Exakte R1 Auflösung
 * - rabbit.display.setFrameRate(60) // Smooth Gaming
 * - rabbit.touch.enableGestures(['swipe', 'pinch']) für Touch-Steuerung
 * 
 * Bis SDK verfügbar: Fallback auf Standard Web APIs
 */

class GravityManGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Game State
    this.isRunning = false;
    this.isPaused = false;
    this.currentLevel = 1;
    this.gameMode = 'normal'; // 'normal' oder 'hard'
    
    // Game Objects
    this.player = null;
    this.levels = null;
    this.gravity = null;
    this.enemies = null;
    this.audio = null;
    
    // Frame Rate Control
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Rabbit R1 spezifische Eigenschaften
    this.isR1Device = this.detectR1Device();
    
    this.init();
  }
  
  /**
   * Erkennung ob auf Rabbit R1 ausgeführt
   * Placeholder bis offizielle Detection verfügbar
   */
  detectR1Device() {
    // Placeholder für R1 Device Detection
    // return typeof rabbit !== 'undefined' && rabbit.device.isR1;
    
    // Fallback: Prüfung auf R1-typische Bildschirmauflösung
    return window.screen.width === 240 && window.screen.height === 282;
  }
  
  /**
   * Spiel Initialisierung
   */
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupGameObjects();
    this.setupUI();
    
    console.log('🎮 Gravity-Man initialized for Rabbit R1');
    console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);
    console.log('R1 Device detected:', this.isR1Device);
  }
  
  /**
   * Canvas Setup für optimale R1 Performance
   */
  setupCanvas() {
    // Canvas-Auflösung für Rabbit R1 optimiert
    this.canvas.width = 240;
    this.canvas.height = 282;
    
    // Pixel-Perfect Rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
  }
  
  /**
   * Event Listeners für Steuerung
   */
  setupEventListeners() {
    // Standard Keyboard Events (Fallback)
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Touch Events für R1 Touch-Interface
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
    
    // Rabbit R1 Button Events (wenn SDK verfügbar)
    this.setupR1Controls();
  }
  
  /**
   * Rabbit R1 Hardware-Steuerung Setup
   */
  setupR1Controls() {
    // Placeholder für zukünftige R1 SDK Integration
    /*
    if (typeof rabbit !== 'undefined') {
      rabbit.buttons.onScrollUp(() => {
        this.gravity.changeDirection('up');
      });
      
      rabbit.buttons.onScrollDown(() => {
        this.gravity.changeDirection('down');
      });
      
      rabbit.buttons.onScrollLeft(() => {
        this.gravity.changeDirection('left');
      });
      
      rabbit.buttons.onScrollRight(() => {
        this.gravity.changeDirection('right');
      });
      
      rabbit.buttons.onPushToTalk(() => {
        this.togglePause();
      });
    }
    */
  }
  
  /**
   * Game Objects Setup
   */
  setupGameObjects() {
    // Initialisierung erfolgt über externe Module
    console.log('📦 Setting up game objects...');
  }
  
  /**
   * UI Setup
   */
  setupUI() {
    this.updateLevelDisplay();
    this.updateModeDisplay();
  }
  
  /**
   * Keyboard Input Handler
   */
  handleKeyDown(event) {
    if (!this.isRunning) return;
    
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
  
  /**
   * Touch Input Handler für R1
   */
  handleTouch(event) {
    event.preventDefault();
    
    if (!this.isRunning) {
      this.start();
      return;
    }
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Touch-Bereiche für Richtungsänderung
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
      // Horizontal swipe
      if (x > centerX) {
        this.gravity?.changeDirection('right');
      } else {
        this.gravity?.changeDirection('left');
      }
    } else {
      // Vertical swipe
      if (y > centerY) {
        this.gravity?.changeDirection('down');
      } else {
        this.gravity?.changeDirection('up');
      }
    }
  }
  
  /**
   * Spiel starten
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    
    console.log('🚀 Starting Gravity-Man...');
    this.gameLoop();
  }
  
  /**
   * Spiel pausieren/fortsetzen
   */
  togglePause() {
    if (!this.isRunning) return;
    
    this.isPaused = !this.isPaused;
    console.log(this.isPaused ? '⏸️ Game paused' : '▶️ Game resumed');
  }
  
  /**
   * Spiel neu starten
   */
  restart() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentLevel = 1;
    
    console.log('🔄 Restarting game...');
    this.setupGameObjects();
    this.start();
  }
  
  /**
   * Game Mode umschalten
   */
  toggleGameMode() {
    this.gameMode = this.gameMode === 'normal' ? 'hard' : 'normal';
    this.updateModeDisplay();
    console.log(`🎯 Game mode: ${this.gameMode}`);
  }
  
  /**
   * Hauptspiel-Loop
   */
  gameLoop(currentTime = 0) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime >= this.frameInterval) {
      this.update(deltaTime);
      this.render();
      this.lastFrameTime = currentTime;
    }
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  /**
   * Game State Update
   */
  update(deltaTime) {
    if (this.isPaused) return;
    
    // Update game objects
    this.player?.update(deltaTime);
    this.gravity?.update(deltaTime);
    this.enemies?.update(deltaTime);
    
    // Collision detection
    this.checkCollisions();
    
    // Level completion check
    this.checkLevelComplete();
  }
  
  /**
   * Rendering
   */
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.isPaused) {
      this.renderPauseScreen();
      return;
    }
    
    // Render game objects
    this.renderBackground();
    this.levels?.render(this.ctx);
    this.enemies?.render(this.ctx);
    this.player?.render(this.ctx);
    this.renderUI();
  }
  
  /**
   * Background Rendering
   */
  renderBackground() {
    // Rabbit R1 Orange Gradient Background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#ff6b35');
    gradient.addColorStop(1, '#1a1a1a');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * UI Rendering
   */
  renderUI() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Level: ${this.currentLevel}`, 10, 20);
    this.ctx.fillText(`Mode: ${this.gameMode}`, 10, 35);
  }
  
  /**
   * Pause Screen
   */
  renderPauseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ff6b35';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.textAlign = 'left';
  }
  
  /**
   * Kollisionserkennung
   */
  checkCollisions() {
    // Implementierung folgt
  }
  
  /**
   * Level Complete Check
   */
  checkLevelComplete() {
    // Implementierung folgt
  }
  
  /**
   * UI Updates
   */
  updateLevelDisplay() {
    const levelElement = document.getElementById('currentLevel');
    if (levelElement) {
      levelElement.textContent = this.currentLevel;
    }
  }
  
  updateModeDisplay() {
    const modeElement = document.getElementById('gameMode');
    if (modeElement) {
      modeElement.textContent = this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1);
    }
  }
}

// Game Initialisierung wenn DOM geladen
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Initializing Gravity-Man Game...');
  window.gravityManGame = new GravityManGame();
});

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

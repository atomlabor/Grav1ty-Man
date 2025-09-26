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
    if (!this.isRunning) {
      this.renderSplash();
      return;
    }
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
    if (!this.isRunning) {
      this.renderSplash();
      return;
    }
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
  renderSplash() {
    // Schwarz füllen
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Bild mittig zeichnen, wenn geladen
    if (this.splashLoaded) {
      const imgW = this.splashImage.width;
      const imgH = this.splashImage.height;
      // Skaliere, falls größer als Canvas
      const scale = Math.min(this.canvas.width / imgW, (this.canvas.height - 40) / imgH, 1);
      const w = Math.floor(imgW * scale);
      const h = Math.floor(imgH * scale);
      const x = Math.floor((this.canvas.width - w) / 2);
      const y = Math.floor((this.canvas.height - h) / 2) - 10;
      this.ctx.drawImage(this.splashImage, x, y, w, h);
    }
    // Overlay-Text "tap to start"
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('tap to start', this.canvas.width / 2, this.canvas.height - 16);
    this.ctx.textAlign = 'left';
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

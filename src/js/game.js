    this.gravity?.update(deltaTime);
    this.enemies?.update(deltaTime);
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
    this.ctx.fillText(`Mode: ${this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1)}`, 10, 35);
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
if (typeof window !== 'undefined') {
  // Expose Player globally if required for LevelManager
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }
  window.gravityManGame = new GravityManGame();
}
// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

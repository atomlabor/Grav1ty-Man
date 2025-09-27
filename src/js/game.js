    );
    this.ctx.fillText('Press SPACE/PTT to continue', this.canvas.width / 2, this.canvas.height / 2 + 16);
    this.ctx.textAlign = 'left';
  }

  // Hazards, guide collection, and death/restart
  checkHazardsAndGuides() {
    const lvl = this.levels?.current;
    if (!lvl || !this.player) return;

    // Enemy/hazard collision -> restart to start point immediately
    const hitHazard = lvl.hazards.some(h => this.player.checkCollision(h));
    if (hitHazard) {
      this.hazardFlashUntil = performance.now() + 120;
      const s = lvl.start;
      this.player.x = s.x; this.player.y = s.y;
      this.player.vx = 0; this.player.vy = 0;
      if (this.player.setGravity) this.player.setGravity('down');
      return;
    }

    // Guide collection
    lvl.guides.forEach(g => {
      if (!g.collected && this.player.checkCollision(g)) {
        g.collected = true;
        this.collectedGuides = Math.min(this.totalGuides, this.collectedGuides + 1);
      }
    });
  }

  checkLevelComplete() {
    const g = this.levels?.current?.goal;
    if (g && this.player?.checkCollision(g)) {
      if (this.player.reachGoal) this.player.reachGoal();
      // Simple success flash then restart to splash
      setTimeout(() => this.restart(), 800);
    }
  }

  // Overlay and panel during gameplay
  renderOverlayAndPanel() {
    const ctx = this.ctx;
    const now = performance.now();
    if (this.hazardFlashUntil && now < this.hazardFlashUntil) {
      ctx.fillStyle = 'rgba(255,0,0,0.25)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Top HUD bar
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, this.canvas.width, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '9px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Mode:${this.gameMode.toUpperCase()}`, 4, 6);
    ctx.textAlign = 'center';
    ctx.fillText(`Guides ${this.collectedGuides}/${this.totalGuides}`, this.canvas.width/2, 6);
    ctx.textAlign = 'right';
    ctx.fillText('A Boost  B Restart  PTT Pause', this.canvas.width - 4, 6);
    ctx.textAlign = 'left';

    const showPanel = this.isPaused || this.creations.panelVisible;
    if (showPanel) {
      const h = 48;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, this.canvas.height - h, this.canvas.width, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.strokeRect(0.5, this.canvas.height - h + 0.5, this.canvas.width - 1, h - 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px monospace';
      ctx.fillText('Panel:', 6, this.canvas.height - h + 12);
      ctx.fillText('- Tilt/PTT: pause, resume', 12, this.canvas.height - h + 22);
      ctx.fillText('- Arrows/Swipe: change gravity', 12, this.canvas.height - h + 32);
      ctx.fillText('- A: Boost  B: Restart', 12, this.canvas.height - h + 42);
    }
  }
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  const c = document.getElementById('gameCanvas');
  if (c) {
    c.width = 240; c.height = 282;
    c.style.width = '240px';
    c.style.height = '282px';
  }
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }
  window.gravityManGame = new GravityManGame();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

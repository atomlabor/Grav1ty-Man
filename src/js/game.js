( ) );
      const x = Math.floor((this.canvas.width - w) / 2);
      const y = Math.floor((this.canvas.height - h - 80) / 2);
      this.ctx.drawImage(this.splashImage, x, y, w, h);
    }
    // Overlay instructions fully inside canvas
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TAP/SPACE/PTT TO START', this.canvas.width / 2, this.canvas.height - 40);
    this.ctx.font = '12px monospace';
    this.ctx.fillText('Tilt to change gravity • Swipe/Arrows OK', this.canvas.width / 2, this.canvas.height - 20);
    this.ctx.textAlign = 'left';
  }

  renderBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#111111';
    for (let y = 0; y < this.canvas.height; y += 2) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }
  }

  renderPauseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Press SPACE/PTT to continue', this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.textAlign = 'left';
  }

  // Simple AABB collision helpers already in Player, here we add hazard flash
  checkCollisions() {
    const lvl = this.levels?.current;
    if (!lvl || !this.player) return;
    // Visual hazard feedback flash
    if (lvl.hazards.some(h => this.player.checkCollision(h))) {
      // brief overlay flash
      this.hazardFlashUntil = performance.now() + 60;
    }
  }

  checkLevelComplete() {
    const g = this.levels?.current?.goal;
    if (g && this.player?.checkCollision(g)) {
      this.player.reachGoal();
      // restart to splash after short delay
      setTimeout(() => this.restart(), 600);
    }
  }

  // Draw SDK-like overlay and a panel in-canvas (emulator style)
  renderOverlayAndPanel() {
    const ctx = this.ctx;
    const now = performance.now();

    // hazard flash
    if (this.hazardFlashUntil && now < this.hazardFlashUntil) {
      ctx.fillStyle = 'rgba(255,0,0,0.25)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Top overlay bar
    if (true) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, 0, this.canvas.width, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Mode:${this.gameMode.toUpperCase()}`, 4, 7);
      ctx.textAlign = 'right';
      ctx.fillText('A Boost  B Restart  PTT Pause', this.canvas.width - 4, 7);
      ctx.textAlign = 'left';
    }

    // Bottom panel toggle state similar to emulator
    const showPanel = this.isPaused || this.creations.panelVisible;
    if (showPanel) {
      const h = 56;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, this.canvas.height - h, this.canvas.width, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.strokeRect(0.5, this.canvas.height - h + 0.5, this.canvas.width - 1, h - 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText('Panel:', 6, this.canvas.height - h + 14);
      ctx.fillText('- Tilt: change gravity', 12, this.canvas.height - h + 26);
      ctx.fillText('- Arrows/Swipe: gravity', 12, this.canvas.height - h + 38);
      ctx.fillText('- A: Boost  B: Restart', 12, this.canvas.height - h + 50);
    }
  }
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.Player === 'undefined' && typeof Player !== 'undefined') {
    window.Player = Player;
  }
  window.gravityManGame = new GravityManGame();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GravityManGame;
}

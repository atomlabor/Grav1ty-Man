/* Gravity-Man main game engine */
class GravityManGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas?.getContext('2d');
    if (!this.canvas || !this.ctx) {
      console.error('Canvas/Context missing');
      return;
    }
    // Rendering settings for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;

    // Assets
    this.images = {
      splash: this.loadImage('grav1tyman-splash.png'),
      end: this.loadImage('endscreen.png'),
      player: null
    };

    this.music = document.getElementById('bgMusic');
    if (this.music) {
      this.music.volume = 0.35;
    }

    // Game state
    this.state = 'splash'; // splash, playing, end
    this.isPaused = false;
    this.gameMode = 'tilt'; // tilt | keys | touch

    // Level state
    this.levels = this.createLevels();
    this.totalGuides = this.levels.totalGuides;
    this.collectedGuides = 0;
    this.hazardFlashUntil = 0;

    // Player
    this.player = new Player(this.levels.current.start.x, this.levels.current.start.y);
    this.gravity = { direction: 'down', strength: 0.5 };

    // Input
    this.setupInput();

    // Start
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));

    // Autoplay music only on splash (user gesture often required)
    this.tryPlayMusic();
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {/* noop */};
    img.onerror = (e) => console.warn('Image failed', src, e);
    return img;
  }

  tryPlayMusic() {
    if (!this.music) return;
    const play = () => this.music.play().catch(() => {/* blocked until gesture */});
    // Try immediately and on first user input
    play();
    const resume = () => { play(); window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
  }

  setupInput() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (this.state === 'splash' && (e.code === 'Space' || e.key === ' ')) {
        this.startGame();
      }
      if (this.state !== 'playing') return;
      switch (e.code) {
        case 'ArrowUp': this.setGravity('up'); break;
        case 'ArrowDown': this.setGravity('down'); break;
        case 'ArrowLeft': this.setGravity('left'); break;
        case 'ArrowRight': this.setGravity('right'); break;
        case 'KeyA': this.player?.boost?.(1.5); break;
        case 'KeyB': this.restartLevel(); break;
        case 'Space': this.togglePause(); break;
      }
    });

    // Touch swipe basic
    let sx = 0, sy = 0;
    window.addEventListener('touchstart', (e) => {
      if (this.state === 'splash') { this.startGame(); return; }
      const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    });
    window.addEventListener('touchend', (e) => {
      if (this.state !== 'playing') return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx; const dy = t.clientY - sy;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.setGravity(dx > 0 ? 'right' : 'left');
      } else {
        this.setGravity(dy > 0 ? 'down' : 'up');
      }
    });

    // DeviceOrientation for tilt
    if (window.DeviceOrientationEvent) {
      const handler = (ev) => {
        if (this.state !== 'playing') return;
        // gamma: left/right, beta: front/back
        const g = ev.gamma || 0;
        const b = ev.beta || 0;
        if (Math.abs(g) > Math.abs(b)) {
          if (g > 8) this.setGravity('right');
          else if (g < -8) this.setGravity('left');
        } else {
          if (b > 12) this.setGravity('down');
          else if (b < -12) this.setGravity('up');
        }
      };
      // Some browsers require permission
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        window.addEventListener('pointerdown', async () => {
          try { const p = await DeviceOrientationEvent.requestPermission(); if (p === 'granted') window.addEventListener('deviceorientation', handler); } catch {}
        }, { once: true });
      } else {
        window.addEventListener('deviceorientation', handler);
      }
    }
  }

  setGravity(dir) {
    this.gravity.direction = dir;
  }

  startGame() {
    this.state = 'playing';
    this.collectedGuides = 0;
    // Ensure music keeps playing only as background, already looping
  }

  restartLevel() {
    const s = this.levels.current.start;
    this.player?.reset?.(s.x, s.y);
    this.gravity.direction = 'down';
  }

  restart() {
    this.state = 'splash';
    this.restartLevel();
  }

  createLevels() {
    // Simple level placeholder with platforms/guides/hazards/goal
    const level1 = {
      start: { x: 16, y: 16 },
      platforms: [
        { x: 0, y: 270, width: 240, height: 12 },
        { x: 40, y: 200, width: 60, height: 6 },
        { x: 120, y: 140, width: 80, height: 6 }
      ],
      guides: [
        { x: 50, y: 190, width: 6, height: 6 },
        { x: 150, y: 130, width: 6, height: 6 }
      ],
      hazards: [
        { x: 90, y: 264, width: 12, height: 6 },
        { x: 200, y: 264, width: 12, height: 6 }
      ],
      goal: { x: 210, y: 120, width: 12, height: 12 }
    };
    return { list: [level1], current: level1, totalGuides: level1.guides.length };
  }

  update(dt) {
    if (this.state === 'playing') {
      this.player?.update?.(dt, this.gravity, this.levels.current);
      this.checkHazardsAndGuides();
      this.checkLevelComplete();
    }
  }

  drawSplash() {
    // Clear
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    if (this.images.splash?.complete) {
      this.ctx.drawImage(this.images.splash, 0, 0, 240, 282);
    } else {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Grav1ty Man', this.canvas.width/2, this.canvas.height/2 - 8);
    }
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Press SPACE/PTT to continue', this.canvas.width/2, this.canvas.height/2 + 16);
    this.ctx.textAlign = 'left';
  }

  drawPlaying() {
    // Clear
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    // Platforms
    this.ctx.fillStyle = '#888';
    for (const p of this.levels.current.platforms) this.ctx.fillRect(p.x, p.y, p.width, p.height);

    // Guides
    this.ctx.fillStyle = '#4af';
    for (const g of this.levels.current.guides) if (!g.collected) this.ctx.fillRect(g.x, g.y, g.width, g.height);

    // Hazards
    this.ctx.fillStyle = '#f44';
    for (const h of this.levels.current.hazards) this.ctx.fillRect(h.x, h.y, h.width, h.height);

    // Goal
    this.ctx.fillStyle = '#0f0';
    const goal = this.levels.current.goal; this.ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

    // Player
    this.player?.render?.(this.ctx);

    // HUD
    this.renderOverlayAndPanel();
  }

  drawEnd() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    if (this.images.end?.complete) {
      this.ctx.drawImage(this.images.end, 0, 0, 240, 282);
    } else {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('THE END', this.canvas.width/2, this.canvas.height/2);
    }
  }

  loop(ts) {
    const dt = Math.min(32, ts - this.lastTime);
    this.lastTime = ts;
    this.update(dt);

    switch (this.state) {
      case 'splash': this.drawSplash(); break;
      case 'playing': this.drawPlaying(); break;
      case 'end': this.drawEnd(); break;
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  // Existing methods kept from tail of file
  renderOverlayAndPanel() {}
  checkHazardsAndGuides() {}
  checkLevelComplete() {}
}

// Keep the rest of the original tail (GitHub editor shows it below)

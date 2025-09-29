// Gravity-Man game with splash graphic grav1tyman.png and Rabbit R1 controls
// NOTE: This file replaces previous content to implement requested features.
class LevelManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.current = this.createTestLevel();
  }
  createTestLevel() {
    return {
      walls: [
        { x: 0, y: 0, width: this.canvasWidth, height: 12 },
        { x: 0, y: this.canvasHeight - 12, width: this.canvasWidth, height: 12 },
        { x: 0, y: 0, width: 12, height: this.canvasHeight },
        { x: this.canvasWidth - 12, y: 0, width: 12, height: this.canvasHeight },
        { x: 24, y: 64, width: 96, height: 10 },
        { x: 140, y: 54, width: 64, height: 10 },
        { x: 180, y: 120, width: 72, height: 10 },
        { x: 48, y: 180, width: 120, height: 10 },
      ],
      hazards: [
        { x: 60, y: 74, width: 30, height: 8 },
        { x: 160, y: 64, width: 30, height: 8 },
        { x: 120, y: 190, width: 60, height: 8 },
      ],
      goal: { x: 200, y: 140, width: 18, height: 18 },
      start: { x: 20, y: 40 }
    };
  }
  render(ctx) {
    if (!this.current) return;
    ctx.fillStyle = '#4A90E2';
    this.current.walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));
    ctx.fillStyle = '#E74C3C';
    this.current.hazards.forEach(h => ctx.fillRect(h.x, h.y, h.width, h.height));
    ctx.fillStyle = '#2ECC71';
    const g = this.current.goal;
    ctx.fillRect(g.x, g.y, g.width, g.height);
  }
}
class GravityManGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas') || this.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 240; this.canvas.height = 282;
    Object.assign(this.canvas.style, { width: '240px', height: '282px', display: 'block', margin: '0 auto', objectFit: 'none' });
    this.gameMode = 'splash';
    this.isPaused = false;
    this.hazardFlashUntil = 0;
    // Splash image
    this.splash = { img: new Image(), loaded: false };
    this.splash.img.src = './grav1tyman.png';
    this.splash.img.onload = () => { this.splash.loaded = true; };
    // Level and player
    this.levels = new LevelManager(this.canvas.width, this.canvas.height);
    if (typeof Player !== 'undefined') {
      const s = this.levels.current.start;
      this.player = new Player(s.x, s.y);
    }
    // Rabbit R1 SDK facade
    this.creations = {
      panelVisible: false,
      setGravity: (dir) => { if (this.player?.setGravity) this.player.setGravity(dir); },
      onPTT: (pressed) => { if (!pressed) return; if (this.gameMode === 'splash') this.start(); else this.togglePause(); },
      onOrientation: (a,b,g) => {
        if (!this.player) return;
        const ax = Math.abs(g||0), ay = Math.abs(b||0);
        if (ax > ay) this.creations.setGravity((g||0) > 8 ? 'right' : (g||0) < -8 ? 'left' : this.player.gravityDir||'down');
        else this.creations.setGravity((b||0) > 8 ? 'down' : (b||0) < -8 ? 'up' : this.player.gravityDir||'down');
      }
    };
    this.setupEventListeners();
    this.gameLoop();
  }
  createCanvas() {
    const c = document.createElement('canvas');
    c.id = 'gameCanvas'; c.width = 240; c.height = 282;
    Object.assign(c.style, { border: '1px solid #222', display: 'block', margin: '0 auto' });
    document.body.appendChild(c); return c;
  }
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Space': e.preventDefault(); if (this.gameMode==='splash') this.start(); else this.togglePause(); break;
        case 'KeyB': this.restart(); break;
        case 'KeyA': if (this.gameMode==='playing') this.player?.boost?.(); break;
        case 'ArrowUp': this.creations.setGravity('up'); break;
        case 'ArrowDown': this.creations.setGravity('down'); break;
        case 'ArrowLeft': this.creations.setGravity('left'); break;
        case 'ArrowRight': this.creations.setGravity('right'); break;
      }
    }, { passive: false });
    const startOnPointer = () => { if (this.gameMode === 'splash') this.start(); };
    this.canvas.addEventListener('click', startOnPointer, { passive: true });
    this.canvas.addEventListener('pointerdown', startOnPointer, { passive: true });
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startOnPointer(); }, { passive: false });
    // Swipe to set gravity
    let t0 = null;
    this.canvas.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; t0 = { x:t.clientX, y:t.clientY }; }, { passive: true });
    this.canvas.addEventListener('touchend', (e) => {
      if (!t0) return; const t = e.changedTouches[0]; const dx=t.clientX-t0.x, dy=t.clientY-t0.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 12) {
        if (Math.abs(dx) > Math.abs(dy)) this.creations.setGravity(dx>0?'right':'left');
        else this.creations.setGravity(dy>0?'down':'up');
      }
      t0 = null;
    }, { passive: true });
    // Gyro
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (ev) => this.creations.onOrientation(ev.alpha, ev.beta, ev.gamma));
    }
    // Rabbit R1 SDK if present
    const sdk = window.creations || window.r1 || window.rabbit || null;
    if (sdk?.on) {
      try {
        sdk.on('ptt', (pressed) => this.creations.onPTT(pressed));
        sdk.on('panel', (visible) => { this.creations.panelVisible = !!visible; });
        sdk.on('orientation', ({alpha,beta,gamma}) => this.creations.onOrientation(alpha,beta,gamma));
      } catch(_){}
    } else {
      document.addEventListener('keydown', (e) => { if (e.code==='KeyP') this.creations.onPTT(true); });
    }
  }
  start() {
    this.gameMode = 'playing'; this.isPaused = false;
    if (this.player && this.levels.current) {
      const s = this.levels.current.start; this.player.x=s.x; this.player.y=s.y; this.player.vx=0; this.player.vy=0;
      this.player.setGravity?.('down');
    }
  }
  restart() { this.gameMode='splash'; this.isPaused=false; this.hazardFlashUntil=0; }
  togglePause() { if (this.gameMode==='playing') this.isPaused=!this.isPaused; }
  gameLoop() { this.update(); this.render(); requestAnimationFrame(()=>this.gameLoop()); }
  update() {
    if (this.gameMode==='playing' && !this.isPaused && this.player) {
      this.player.update(this.levels.current);
      this.checkCollisions(); this.checkLevelComplete();
    }
  }
  render() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    if (this.gameMode==='splash') this.renderSplashScreen();
    else {
      this.renderBackground();
      this.levels?.render(this.ctx);
      this.player?.render(this.ctx);
      if (this.isPaused) this.renderPauseScreen();
      this.renderOverlayAndPanel();
    }
  }
  renderSplashScreen() {
    const ctx=this.ctx, w=this.canvas.width, h=this.canvas.height;
    ctx.fillStyle='#000'; ctx.fillRect(0,0,w,h);
    if (this.splash.loaded) {
      const img=this.splash.img, iw=img.width, ih=img.height;
      const scale=Math.min(w/iw,(h-40)/ih);
      const dw=Math.floor(iw*scale), dh=Math.floor(ih*scale);
      const dx=Math.floor((w-dw)/2), dy=Math.floor((h-dh)/2)-4;
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,dx,dy,dw,dh);
    } else {
      ctx.fillStyle='#222'; ctx.fillRect(20,20,w-40,h-60);
      ctx.fillStyle='#888'; ctx.font='12px monospace'; ctx.textAlign='center';
      ctx.fillText('Loading splash...', w/2, h/2); ctx.textAlign='left';
    }
    ctx.fillStyle='#FFF'; ctx.font='bold 14px monospace'; ctx.textAlign='center';
    ctx.fillText('GRAVITY MAN', w/2, h-28);
    ctx.font='10px monospace';
    ctx.fillText('Tap/Space/PTT to Start • Tilt/Arrows/Swipe control', w/2, h-14);
    ctx.textAlign='left';
  }
  renderBackground() {
    const ctx=this.ctx; ctx.fillStyle='#111';
    for (let y=0;y<this.canvas.height;y+=8) {
      ctx.fillRect(0,y,this.canvas.width,1);
    }
    for (let x=0;x<this.canvas.width;x+=8) {
      ctx.fillRect(x,0,1,this.canvas.height);
    }
  }
  renderPauseScreen() {
    const c=this.canvas, ctx=this.ctx; ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#FFF'; ctx.font='bold 14px monospace'; ctx.textAlign='center';
    ctx.fillText('PAUSED', c.width/2, c.height/2);
    ctx.fillText('Press SPACE/PTT to continue', c.width/2, c.height/2+16);
    ctx.textAlign='left';
  }
  checkCollisions() {
    const lvl=this.levels?.current; if (!lvl||!this.player) return;
    if (lvl.hazards.some(h=>this.player.checkCollision?.(h))) this.hazardFlashUntil=performance.now()+60;
  }
  checkLevelComplete() {
    const g=this.levels?.current?.goal; if (g && this.player?.checkCollision?.(g)) { this.player.reachGoal?.(); setTimeout(()=>this.restart(),600); }
  }
  renderOverlayAndPanel() {
    const ctx=this.ctx, now=performance.now();
    if (this.hazardFlashUntil && now<this.hazardFlashUntil) { ctx.fillStyle='rgba(255,0,0,0.25)'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); }
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(0,0,this.canvas.width,12);
    ctx.fillStyle='#FFF'; ctx.font='9px monospace'; ctx.textBaseline='middle';
    ctx.fillText(`Mode:${this.gameMode.toUpperCase()}`, 4, 6);
    ctx.textAlign='right'; ctx.fillText('A Boost  B Restart  PTT Pause', this.canvas.width-4, 6); ctx.textAlign='left';
    const showPanel=this.isPaused || this.creations.panelVisible;
    if (showPanel) {
      const h=48; ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(0,this.canvas.height-h,this.canvas.width,h);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.strokeRect(0.5,this.canvas.height-h+0.5,this.canvas.width-1,h-1);
      ctx.fillStyle='#FFF'; ctx.font='9px monospace';
      ctx.fillText('Panel:', 6, this.canvas.height-h+12);
      ctx.fillText('- Tilt: change gravity', 12, this.canvas.height-h+22);
      ctx.fillText('- Arrows/Swipe: gravity', 12, this.canvas.height-h+32);
      ctx.fillText('- A: Boost  B: Restart', 12, this.canvas.height-h+42);
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const c=document.getElementById('gameCanvas'); if (c) { c.width=240; c.height=282; c.style.width='240px'; c.style.height='282px'; }
  if (typeof window.Player==='undefined' && typeof Player!=='undefined') window.Player=Player;
  window.gravityManGame = new GravityManGame();
});
if (typeof module!=='undefined' && module.exports) module.exports = GravityManGame;

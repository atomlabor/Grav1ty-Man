/* Gravity-Man main game engine - 5-Level BW Edition (8 parts per level)
   Changes:
   - Music autostart removed from constructor; now only start via index.html user event
   - drawPlaying renders spaceship background, platforms, hazards, Daleks, Keycards, player, and EXIT portal when all parts collected
   - Five levels defined and switchable
*/
class GravityManGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas?.getContext('2d');
    if (!this.canvas || !this.ctx) { console.error('Canvas/Context missing'); return; }
    this.ctx.imageSmoothingEnabled = false;

    // Sprites and assets (paths relative to index.html in repo root)
    this.images = {
      splash: this.loadImage('grav1tyman-splash.png'),
      end: this.loadImage('endscreen.png'),
      bg: this.loadImage('spaceship-bg.png'),
      player: null, // player drawn by player.js
      enemy: this.loadImage('dalek.png'),
      part: this.loadImage('keycard.png'),
      exit: this.loadImage('exit.png')
    };

    // Music element is present in index.html. Start will be triggered from there only.
    this.music = document.getElementById('bgMusic');
    if (this.music) this.music.volume = 0.35;

    // Simple BW palette
    this.colors = { bg:'#000', fg:'#fff', platform:'#fff', hazard:'#fff', enemy:'#fff', part:'#fff', goalClosed:'#000', goalOpen:'#fff' };

    // Game state
    this.state = 'splash';
    this.isPaused = false;

    // Levels
    this.levels = this.createLevels();
    this.levelIndex = 0;
    this.currentLevel = this.levels[this.levelIndex];

    // Collection / goal
    this.totalParts = this.currentLevel.parts.length;
    this.collectedParts = 0;
    this.goalOpen = false;

    // Player & physics
    this.player = new Player(this.currentLevel.start.x, this.currentLevel.start.y);
    this.gravity = { direction:'down', strength:0.5 };

    // Input and loop
    this.setupInput();
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));

    // IMPORTANT: Music autostart disabled; only start via user event in index.html
    // this.tryPlayMusic(); // commented out by requirement
  }

  // Load image helper
  loadImage(src){
    const img = new Image();
    img.src = src;
    img.onerror = (e)=>console.warn('Image failed',src,e);
    return img;
  }

  // Retained helper for index.html to call on first user interaction if desired
  tryPlayMusic(){
    if(!this.music) return;
    const tryPlay = ()=> this.music.play().catch(()=>{});
    // Do not call here automatically; index.html should call this on user gesture
    // Keeping the logic so index.html can wire it.
    // Example from index.html: window.addEventListener('pointerdown', ()=>game.tryPlayMusic(), { once:true });
    tryPlay();
  }

  setupInput(){
    // Keyboard
    window.addEventListener('keydown',(e)=>{
      if(this.state==='splash' && (e.code==='Space'||e.key===' ')){
        this.startGame();
        return;
      }
      if(this.state!=='playing') return;
      switch(e.code){
        case 'ArrowUp': this.setGravity('up'); break;
        case 'ArrowDown': this.setGravity('down'); break;
        case 'ArrowLeft': this.setGravity('left'); break;
        case 'ArrowRight': this.setGravity('right'); break;
        case 'KeyR': this.restartLevel(); break;
        case 'Space': this.togglePause(); break;
      }
    });

    // Touch swipe
    let sx=0, sy=0;
    window.addEventListener('touchstart',(e)=>{
      if(this.state==='splash'){ this.startGame(); return; }
      const t=e.touches[0]; sx=t.clientX; sy=t.clientY;
    });
    window.addEventListener('touchend',(e)=>{
      if(this.state!=='playing') return;
      const t=e.changedTouches[0];
      const dx=t.clientX-sx, dy=t.clientY-sy;
      if(Math.abs(dx)>Math.abs(dy)) this.setGravity(dx>0?'right':'left');
      else this.setGravity(dy>0?'down':'up');
    });

    // Optional device orientation
    if(window.DeviceOrientationEvent){
      const handler=(ev)=>{
        if(this.state!=='playing') return;
        const g=ev.gamma||0, b=ev.beta||0;
        if(Math.abs(g)>Math.abs(b)){
          if(g>10) this.setGravity('right'); else if(g<-10) this.setGravity('left');
        } else {
          if(b>14) this.setGravity('down'); else if(b<-14) this.setGravity('up');
        }
      };
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        window.addEventListener('pointerdown', async ()=>{
          try{ const p=await DeviceOrientationEvent.requestPermission(); if(p==='granted') window.addEventListener('deviceorientation',handler); }catch{}
        }, {once:true});
      } else {
        window.addEventListener('deviceorientation',handler);
      }
    }
  }

  setGravity(dir){ this.gravity.direction=dir; }
  startGame(){ this.levelIndex=0; this.loadLevel(this.levelIndex); this.state='playing'; }
  togglePause(){ this.isPaused=!this.isPaused; }

  loadLevel(idx){
    this.levelIndex=Math.max(0,Math.min(idx,this.levels.length-1));
    this.currentLevel=this.levels[this.levelIndex];
    for(const p of this.currentLevel.parts) p.collected=false;
    this.totalParts=this.currentLevel.parts.length;
    this.collectedParts=0;
    this.goalOpen=false;
    const s=this.currentLevel.start;
    if(!this.player) this.player=new Player(s.x,s.y); else this.player.reset(s.x,s.y);
    this.gravity.direction='down';
  }
  nextLevel(){ if(this.levelIndex<this.levels.length-1) this.loadLevel(this.levelIndex+1); else this.state='end'; }
  restartLevel(){ const s=this.currentLevel.start; this.player?.reset?.(s.x,s.y); for(const p of this.currentLevel.parts) p.collected=false; this.collectedParts=0; this.goalOpen=false; this.gravity.direction='down'; }

  // -------- Levels (BW) --------
  createLevels(){
    const W=240, H=282;
    const enemy=(x,y,w=10,h=14,speed=0.07)=>({x,y,w,h,vx:0,vy:0,speed}); // slightly bigger for better sprite fit

    // Five handcrafted levels, each with 8 keycard parts
    const L1={ start:{x:12,y:12},
      platforms:[ {x:0,y:H-12,width:W,height:12}, {x:36,y:220,width:60,height:6}, {x:120,y:160,width:80,height:6}, {x:24,y:100,width:60,height:6} ],
      hazards:[ {x:100,y:H-18,width:20,height:6} ],
      enemies:[ enemy(200,20) ],
      parts:[ {x:10,y:H-24,width:10,height:10}, {x:42,y:208,width:10,height:10}, {x:170,y:148,width:10,height:10}, {x:28,y:88,width:10,height:10}, {x:220,y:20,width:10,height:10}, {x:120,y:20,width:10,height:10}, {x:70,y:H-24,width:10,height:10}, {x:210,y:120,width:10,height:10} ],
      goal:{x:210,y:120,width:16,height:16}
    };

    const L2={ start:{x:12,y:H-24},
      platforms:[ {x:0,y:0,width:6,height:H}, {x:W-6,y:0,width:6,height:H}, {x:60,y:220,width:120,height:6}, {x:60,y:160,width:120,height:6}, {x:60,y:100,width:120,height:6} ],
      hazards:[ {x:120,y:214,width:12,height:6}, {x:120,y:154,width:12,height:6} ],
      enemies:[ enemy(120,40) ],
      parts:[ {x:66,y:210,width:10,height:10}, {x:174,y:150,width:10,height:10}, {x:66,y:90,width:10,height:10}, {x:10,y:10,width:10,height:10}, {x:220,y:10,width:10,height:10}, {x:10,y:H-24,width:10,height:10}, {x:220,y:H-24,width:10,height:10}, {x:120,y:60,width:10,height:10} ],
      goal:{x:W-24,y:12,width:16,height:16}
    };

    const L3={ start:{x:20,y:20},
      platforms:[ {x:0,y:H-12,width:W,height:12}, {x:0,y:0,width:W,height:6}, {x:0,y:0,width:6,height:H}, {x:W-6,y:0,width:6,height:H}, {x:40,y:210,width:60,height:6}, {x:140,y:120,width:60,height:6} ],
      hazards:[ {x:100,y:H-18,width:20,height:6} ],
      enemies:[ enemy(120,30), enemy(200,200) ],
      parts:[ {x:46,y:198,width:10,height:10}, {x:146,y:108,width:10,height:10}, {x:206,y:20,width:10,height:10}, {x:20,y:20,width:10,height:10}, {x:220,y:H-24,width:10,height:10}, {x:120,y:60,width:10,height:10}, {x:70,y:150,width:10,height:10}, {x:200,y:120,width:10,height:10} ],
      goal:{x:W-24,y:H-24,width:16,height:16}
    };

    const L4={ start:{x:12,y:24},
      platforms:[ {x:0,y:0,width:W,height:6}, {x:0,y:H-12,width:W,height:12}, {x:0,y:0,width:6,height:H}, {x:W-6,y:0,width:6,height:H}, {x:30,y:60,width:180,height:6}, {x:30,y:120,width:180,height:6}, {x:30,y:180,width:180,height:6}, {x:90,y:240,width:60,height:6} ],
      hazards:[ {x:120,y:114,width:12,height:6}, {x:120,y:174,width:12,height:6} ],
      enemies:[ enemy(60,70), enemy(180,130) ],
      parts:[ {x:36,y:48,width:10,height:10}, {x:204,y:168,width:10,height:10}, {x:96,y:228,width:10,height:10}, {x:36,y:168,width:10,height:10}, {x:204,y:48,width:10,height:10}, {x:120,y:228,width:10,height:10}, {x:90,y:84,width:10,height:10}, {x:150,y:84,width:10,height:10} ],
      goal:{x:W-30,y:18,width:16,height:16}
    };

    const L5={ start:{x:12,y:H-24},
      platforms:[ {x:0,y:0,width:W,height:6}, {x:0,y:H-12,width:W,height:12}, {x:0,y:0,width:6,height:H}, {x:W-6,y:0,width:6,height:H}, {x:40,y:220,width:160,height:6}, {x:40,y:160,width:160,height:6}, {x:40,y:100,width:160,height:6} ],
      hazards:[ {x:110,y:214,width:20,height:6}, {x:110,y:154,width:20,height:6}, {x:110,y:94,width:20,height:6} ],
      enemies:[ enemy(80,30), enemy(160,30), enemy(120,200) ],
      parts:[ {x:46,y:210,width:10,height:10}, {x:194,y:150,width:10,height:10}, {x:46,y:90,width:10,height:10}, {x:20,y:20,width:10,height:10}, {x:220,y:20,width:10,height:10}, {x:20,y:H-24,width:10,height:10}, {x:220,y:H-24,width:10,height:10}, {x:120,y:120,width:10,height:10} ],
      goal:{x:W-24,y:12,width:16,height:16}
    };
    return [L1,L2,L3,L4,L5];
  }

  // --- Physics and game loop ---
  update(dt){ if(this.state!=='playing' || this.isPaused) return; this.player?.update?.(dt,this.gravity,this.currentLevel); this.updateEnemies(dt); this.checkCollisionsAndCollect(); this.checkLevelProgress(); }

  updateEnemies(dt){ const lvl=this.currentLevel; for(const e of (lvl.enemies||[])){ const g=this.gravity.direction, s=e.speed; let vx=0, vy=0; if(g==='down') vy=s; else if(g==='up') vy=-s; else if(g==='right') vx=s; else vx=-s; e.x+=vx*dt; e.y+=vy*dt; // bounds
      if(e.x<0) e.x=0; if(e.x+e.w>this.canvas.width) e.x=this.canvas.width-e.w; if(e.y<0) e.y=0; if(e.y+e.h>this.canvas.height) e.y=this.canvas.height-e.h; // collide with platforms roughly by backing out movement
      for(const p of lvl.platforms){ const rect={x:e.x,y:e.y,width:e.w,height:e.h}; const pr={x:p.x,y:p.y,width:p.width,height:p.height}; if(this.aabb(rect,pr)){ if(g==='down') e.y=p.y-e.h; else if(g==='up') e.y=p.y+p.height; else if(g==='right') e.x=p.x-e.w; else e.x=p.x+p.width; } }
    } }

  aabb(a,b){ return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }

  checkCollisionsAndCollect(){ const lvl=this.currentLevel; const pl={ x:this.player.x, y:this.player.y, width:this.player.w||10, height:this.player.h||14 };
    // hazards reset
    for(const h of lvl.hazards){ if(this.aabb(pl,h)){ this.restartLevel(); return; } }
    // enemies reset
    for(const e of (lvl.enemies||[])){ const er={x:e.x,y:e.y,width:e.w,height:e.h}; if(this.aabb(pl,er)){ this.restartLevel(); return; } }
    // collect parts
    for(const part of lvl.parts){ if(!part.collected && this.aabb(pl,part)){ part.collected=true; this.collectedParts++; } }
    // open goal if all collected
    if(this.collectedParts>=this.totalParts) this.goalOpen=true;
  }

  checkLevelProgress(){ if(!this.goalOpen) return; const g=this.currentLevel.goal; const pl={ x:this.player.x, y:this.player.y, width:this.player.w||10, height:this.player.h||14 }; if(this.aabb(pl,g)){ this.nextLevel(); } }

  // Draw splash screen
  drawSplash(){ this.ctx.fillStyle=this.colors.bg; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height); if(this.images.splash?.complete) this.ctx.drawImage(this.images.splash,0,0,240,282); this.ctx.fillStyle=this.colors.fg; this.ctx.font='10px monospace'; this.ctx.textAlign='center'; this.ctx.fillText('Press SPACE to start', this.canvas

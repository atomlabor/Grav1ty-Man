/* Gravity-Man Final – Rabbit r1 compatible, BW style, 5 levels, splash+music
Assets in repo root:
- grav1tyman-splash.png, spaceship-bg.png, grav1tyman-player.png, dalek.png, keycard.png, exit.png, endscreen.png
- Music: Pixel_Dreamers.mp3 (loop)
*/
(function() {
  'use strict';
  const A = {
    splash: 'grav1tyman-splash.png',
    bg: 'spaceship-bg.png',
    player: 'grav1tyman-player.png',
    enemy: 'dalek.png',
    item: 'keycard.png',
    exit: 'exit.png',
    end: 'endscreen.png',
    music: 'Pixel_Dreamers.mp3'
  };
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const rnd = (a,b) => a + Math.random()*(b-a);
  class Img {
    constructor(src){
      this.img = new Image();
      this.loaded = false;
      this.error = false;
      this.img.onload = () => { this.loaded = true; };
      this.img.onerror = (e) => { this.error = true; console.error('Image failed to load:', src, e); };
      this.img.src = src;
    }
  }
  class Music {
    constructor(src){
      this.a = document.getElementById('bgMusic') || document.createElement('audio');
      if(!this.a.src) this.a.src = src;
      this.a.loop = true;
      this.a.volume = 0.45;
      this.ready = false;
      this.a.addEventListener('canplay', () => { this.ready = true; }, {once:true});
    }
    play(){ try { this.a.play(); } catch(_) {} }
    stop(){ try { this.a.pause(); this.a.currentTime = 0; } catch(_) {} }
  }
  // Axis-aligned rect collision helper
  const hit = (a,b) => !(a.x+a.w<=b.x || b.x+b.w<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y);

  // Connectivity helpers
  function buildGrid(w,h,cell){
    const cols = Math.floor(w/cell), rows = Math.floor(h/cell);
    const grid = Array.from({length:rows},()=>Array(cols).fill(0));
    return {grid, cols, rows, cell};
  }
  function paintWallOnGrid(g, wall){
    const {cell, cols, rows, grid} = g;
    const x0 = clamp(Math.floor(wall.x/cell),0,cols-1);
    const x1 = clamp(Math.floor((wall.x+wall.width-1)/cell),0,cols-1);
    const y0 = clamp(Math.floor(wall.y/cell),0,rows-1);
    const y1 = clamp(Math.floor((wall.y+wall.height-1)/cell),0,rows-1);
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) grid[y][x]=1;
  }
  function flood(g, sx, sy){
    const {cols, rows, grid} = g; const q=[[sx,sy]]; const seen=new Set([sx+','+sy]);
    while(q.length){
      const [x,y]=q.shift();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy; const key=nx+','+ny;
        if(nx>=0&&nx<cols&&ny>=0&&ny<rows&&grid[ny][nx]===0&&!seen.has(key)){
          seen.add(key); q.push([nx,ny]);
        }
      }
    }
    return seen;
  }

  class LevelManager {
    constructor(w,h){ this.w = w; this.h = h; this.i = 0; this.levels = this.make(); }
    cur(){ return this.levels[this.i]; }
    next(){ if(this.i < 4){ this.i++; return true;} return false; }
    reset(){ this.i = 0; this.levels = this.make(); }
    make(){
      const border = 12;
      const mk = () => ({
        walls:[{x:0,y:0,width:this.w,height:border},
               {x:0,y:this.h-border,width:this.w,height:border},
               {x:0,y:0,width:border,height:this.h},
               {x:this.w-border,y:0,width:border,height:this.h}],
        items:[], enemies:[], exit: {x:this.w-34,y:this.h-34,w:16,h:16,open:false}, start:{x:20,y:20}
      });
      const L = [];
      for(let i=0; i<5; i++){
        const l=mk();
        // Connected corridor layout: alternating platforms with gaps
        const tiers = 4+i;
        const gapW = 22;
        for(let r=0; r<tiers; r++){
          const y = 24 + Math.floor((r+1)*(this.h-60)/(tiers+1));
          const full = {x:26, y, width:this.w-52, height:8};
          const leftGap = (r%2===0);
          const gx = leftGap ? full.x + 36 : full.x + full.width - 36 - gapW;
          // left segment
          const leftW = Math.max(0, gx - full.x);
          if(leftW>0) l.walls.push({x:full.x, y:full.y, width:leftW, height:full.height});
          // right segment
          const rightX = gx + gapW;
          const rightW = Math.max(0, (full.x+full.width) - rightX);
          if(rightW>0) l.walls.push({x:rightX, y:full.y, width:rightW, height:full.height});
        }
        // A few short pillars that don't block gaps (place near borders)
        const pillars = Math.min(1+i, 3);
        for(let p=0; p<pillars; p++){
          const nearLeft = p%2===0;
          const vx = nearLeft ? rnd(28, 60)|0 : rnd(this.w-80, this.w-42)|0;
          const vh = rnd(24, this.h*0.35)|0;
          l.walls.push({x:vx, y:28, width:8, height:vh});
        }
        // Items near open space (not inside walls)
        for(let k=0;k<8;k++){
          l.items.push({x:clamp((rnd(28,this.w-42)|0),28,this.w-42), y:clamp((rnd(40,this.h-56)|0),40,this.h-56), w:14,h:14,collected:false});
        }
        // Enemies
        const ec = 2+i;
        for(let e=0; e<ec; e++){
          let home = {x:clamp(rnd(34,this.w-60)|0,34,this.w-60), y:clamp(rnd(36,this.h-72)|0,36,this.h-72)};
          l.enemies.push({x:home.x, y:home.y, w:14, h:18, home:home, v:rnd(1.2,2.1), dir: 1, range: rnd(26,48), hor: !!(e%2)});
        }
        l.start = {x:18+(i*8), y:20+(i*6)};
        l.exit = {x: this.w-30-(i*2), y: this.h-30-(i*1), w:16, h:16, open:false};

        // Connectivity check
        const g = buildGrid(this.w,this.h,12);
        for(const w of l.walls) paintWallOnGrid(g,w);
        const sx = Math.floor((l.start.x+7)/g.cell), sy = Math.floor((l.start.y+9)/g.cell);
        const seen = flood(g,sx,sy);
        const ex = Math.floor((l.exit.x+8)/g.cell), ey = Math.floor((l.exit.y+8)/g.cell);
        if(!seen.has(ex+","+ey)){
          // Carve vertical openings at 1/3 and 2/3 width to guarantee connectivity
          const ladders = [Math.floor(this.w*0.33), Math.floor(this.w*0.66)];
          for(const lx of ladders){
            for(const w of l.walls){
              if(w.height<=10 && w.y>16 && lx>=w.x+8 && lx<=w.x+w.width-8){
                const leftWidth = Math.max(0, (lx-10) - w.x);
                const rightStart = lx+10;
                const rightWidth = Math.max(0, (w.x+w.width) - rightStart);
                Object.assign(w,{width:leftWidth});
                if(rightWidth>0) l.walls.push({x:rightStart, y:w.y, width:rightWidth, height:w.height});
              }
            }
          }
        }
        // Reposition items stuck in walls
        const isWallAt = (x,y)=>{
          const cx = clamp(Math.floor(x/g.cell),0,g.cols-1); const cy = clamp(Math.floor(y/g.cell),0,g.rows-1);
          return g.grid[cy][cx]===1;
        };
        for(const it of l.items){
          if(isWallAt(it.x+it.w/2, it.y+it.h/2)){
            it.x = clamp((this.w/2 + rnd(-40,40))|0, 28, this.w-42);
            it.y = clamp((this.h/2 + rnd(-70,70))|0, 40, this.h-56);
          }
        }
        L.push(l);
      }
      return L;
    }
    render(ctx, sprites){
      const l = this.cur(); if(!l) return;
      // Exit gate (colored glow when open; texture itself BW)
      if(l.exit){
        const e = l.exit;
        if(sprites.exit.loaded){
          ctx.save();
          if(e.open){
            for(let g=0; g<3; g++){
              ctx.fillStyle = `rgba(220,255,220,${0.22-g*0.06})`;
              ctx.fillRect(e.x-2-g,e.y-2-g,e.w+4+2*g,e.h+4+2*g);
            }
          }
          ctx.filter = 'grayscale(100%)';
          ctx.drawImage(sprites.exit.img,e.x|0,e.y|0,e.w,e.h);
          ctx.filter = 'none';
          if(e.open){ ctx.fillStyle='rgba(220,255,220,0.35)'; ctx.fillRect(e.x,e.y,e.w,e.h); }
          ctx.restore();
        } else {
          ctx.fillStyle='#BDBDBD';
          ctx.fillRect(this.w-34,this.h-34,16,16);
        }
        // BW walls
        ctx.fillStyle='#E0E0E0';
        for(const w of l.walls) ctx.fillRect(w.x,w.y,w.width,w.height);
      }
    }
  }
  class Player {
    constructor(x,y,s){
      this.x = x; this.y = y; this.w = 14; this.h = 18;
      this.vx = 0; this.vy = 0; this.g = 'down'; this.s = s;
    }
    setGravity(d){ this.g = d; }
    boost(){
      const b = 1.6;
      if(this.g === 'up') this.vy -= b;
      else if(this.g === 'down') this.vy += b;
      else if(this.g === 'left') this.vx -= b;
      else this.vx += b;
    }
    update(l){
      this.vx *= 0.97; this.vy *= 0.97;
      const g = 0.18;
      if(this.g==='down') this.vy += g;
      else if(this.g==='up') this.vy -= g;
      else if(this.g==='left') this.vx -= g;
      else this.vx += g;
      this.x += this.vx; this.y += this.vy;
      const r = {x:this.x, y:this.y, w:this.w, h:this.h};
      // Collide with walls
      for(const w of l.walls){
        if(hit(r,{x:w.x,y:w.y,w:w.width,h:w.height})){
          const dx1=(w.x+w.width)-r.x, dx2=(r.x+r.w)-w.x, dy1=(w.y+w.height)-r.y, dy2=(r.y+r.h)-w.y;
          const minx=Math.min(dx1,dx2), miny=Math.min(dy1,dy2);
          if(minx < miny){
            if(dx1 < dx2) this.x=w.x+w.width; else this.x=w.x-this.w;
            this.vx=0;
          } else {
            if(dy1 < dy2) this.y=w.y+w.height; else this.y=w.y-this.h;
            this.vy=0;
          }
          r.x = this.x; r.y = this.y;
        }
      }
    }
    rect(){ return {x:this.x, y:this.y, w:this.w, h:this.h}; }
    coll(b){ const r = this.rect(); return hit(r,b); }
    render(ctx){
      if(this.s.player.loaded){
        ctx.filter='grayscale(100%) contrast(120%)';
        ctx.drawImage(this.s.player.img,this.x|0,this.y|0,this.w,this.h);
        ctx.filter='none';
      } else {
        ctx.fillStyle='#FFF';
        ctx.fillRect(this.x|0, this.y|0, this.w, this.h);
      }
    }
  }
  class Game {
    constructor(){
      this.c = document.getElementById('gameCanvas') || this.mkCanvas();
      this.x = this.c.getContext('2d');
      this.w = 240; this.h = 282;
      this.c.width = this.w; this.c.height = this.h;
      Object.assign(this.c.style,{width:'100%',height:'auto',aspectRatio:`${this.w}/${this.h}`,display:'block',margin:'0 auto',background:'#000',visibility:'visible'});
      this.sprites = {
        splash: new Img(A.splash),
        bg: new Img(A.bg),
        player: new Img(A.player),
        enemy: new Img(A.enemy),
        item: new Img(A.item),
        exit: new Img(A.exit),
        end: new Img(A.end)
      };
      this.music = new Music(A.music);
      this.mode = 'splash';
      this.paused = false;
      this.flashUntil = 0;
      this.levels = new LevelManager(this.w,this.h);
      const st = this.levels.cur().start;
      this.p = new Player(st.x,st.y,this.sprites);
      this.collected = 0; this.levelClears = 0;
      this.bind(); this.resize(); this.loop();
    }
    mkCanvas() {
      const c = document.createElement('canvas');
      c.id = 'gameCanvas';
      document.body.appendChild(c);
      return c;
    }
    bind() {
      const setG = d => this.p.setGravity(d);
      const start = () => { if(this.mode==='splash') this.start(); };
      this.c.addEventListener('click',start,{passive:true});
      this.c.addEventListener('pointerdown',start,{passive:true});
      this.c.addEventListener('touchstart',(e)=>{e.preventDefault();start();},{passive:false});
      // Swipe gravity
      let t0 = null;
      this.c.addEventListener('touchstart',e => {
        const t = e.changedTouches[0]; t0={x:t.clientX,y:t.clientY};
      },{passive:true});
      this.c.addEventListener('touchend',e => {
        if(!t0) return;
        const t = e.changedTouches[0], dx = t.clientX-t0.x, dy = t.clientY-t0.y;
        if(Math.max

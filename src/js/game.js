/* Gravity-Man Final – Rabbit r1 compatible, BW style, 5 levels, splash+music
Assets in repo root:
- grav1tyman-splash.png, spaceship-bg.png, grav1tyman-player.png, dalek.png, keycard.png, exit.png, endscreen.png
- Optional: music.mp3 (if missing, music will be skipped gracefully)
*/
(function(){'use strict';
const A = {
  splash: 'grav1tyman-splash.png',
  bg: 'spaceship-bg.png',
  player: 'grav1tyman-player.png',
  enemy: 'dalek.png',
  item: 'keycard.png',
  exit: 'exit.png',
  end: 'endscreen.png',
  music: 'music.mp3'
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
class Img { constructor(src){ this.img=new Image(); this.loaded=false; this.img.onload=()=>this.loaded=true; this.img.src=src; } }
class Music { constructor(src){ this.a=document.createElement('audio'); this.a.src=src; this.a.loop=true; this.a.volume=0.45; this.ready=false; this.a.addEventListener('canplay',()=>this.ready=true,{once:true}); }
  play(){ try{ this.a.play(); }catch(_){}} stop(){ try{ this.a.pause(); this.a.currentTime=0; }catch(_){}}
}
class LevelManager{
  constructor(w,h){ this.w=w; this.h=h; this.i=0; this.levels=this.make(); }
  cur(){ return this.levels[this.i]; }
  next(){ if(this.i<4){ this.i++; return true;} return false; }
  reset(){ this.i=0; this.levels=this.make(); }
  make(){
    const border=12;
    const mk=()=>({
      walls:[{x:0,y:0,width:this.w,height:border},{x:0,y:this.h-border,width:this.w,height:border},{x:0,y:0,width:border,height:this.h},{x:this.w-border,y:0,width:border,height:this.h}],
      items:[], enemies:[], exit:{x:this.w-34,y:this.h-34,w:16,h:16,open:false}, start:{x:20,y:20}
    });
    const L=[]; for(let i=0;i<5;i++){ const l=mk();
      // platforms
      const rows=4+i; for(let r=0;r<rows;r++){ const px=24+(r%2?60:18)+r*10; const py=56+r*30; l.walls.push({x:clamp(px,16,this.w-120),y:clamp(py,28,this.h-64),width:(rnd(64,140)|0),height:8}); }
      // items 8
      for(let k=0;k<8;k++){ l.items.push({x:clamp((rnd(28,this.w-42)|0),28,this.w-42), y:clamp((rnd(40,this.h-56)|0),40,this.h-56), w:14,h:14,collected:false}); }
      // enemies 2+i
      const ec=2+i; for(let e=0;e<ec;e++){ const ex=clamp((rnd(40,this.w-60)|0),40,this.w-60); const ey=clamp((rnd(60,this.h-80)|0),60,this.h-80); const hor=e%2===0; l.enemies.push({x:ex,y:ey,w:14,h:18, hor, v:0.6+0.06*i, dir:1, range:26+8*i, home:{x:ex,y:ey}}); }
      L.push(l);
    } return L;
  }
  render(ctx, sprites){
    const l=this.cur(); if(!l) return;
    // draw exit (only colored element when open)
    if(l.exit){ const e=l.exit; if(sprites.exit.loaded){ ctx.save(); if(e.open){ for(let g=0;g<3;g++){ ctx.fillStyle=`rgba(46,204,113,${0.22-g*0.06})`; ctx.fillRect(e.x-2-g,e.y-2-g,e.w+4+2*g,e.h+4+2*g);} }
      ctx.filter='grayscale(100%)'; ctx.drawImage(sprites.exit.img,e.x|0,e.y|0,e.w,e.h); ctx.filter='none';
      if(e.open){ ctx.fillStyle='rgba(46,204,113,0.55)'; ctx.fillRect(e.x,e.y,e.w,e.h); }
      ctx.restore();
    } else {
      ctx.fillStyle='#BDBDBD'; ctx.fillRect(this.w-34,this.h-34,16,16);
    }
    // walls BW
    ctx.fillStyle='#E0E0E0'; for(const w of l.walls) ctx.fillRect(w.x,w.y,w.width,w.height);
  }
}
class Player{
  constructor(x,y,s){ this.x=x; this.y=y; this.w=14; this.h=18; this.vx=0; this.vy=0; this.g='down'; this.s=s; }
  setGravity(d){ this.g=d; }
  boost(){ const b=1.6; if(this.g==='up') this.vy-=b; else if(this.g==='down') this.vy+=b; else if(this.g==='left') this.vx-=b; else this.vx+=b; }
  update(l){ this.vx*=0.97; this.vy*=0.97; const g=0.18; if(this.g==='down') this.vy+=g; else if(this.g==='up') this.vy-=g; else if(this.g==='left') this.vx-=g; else this.vx+=g;
    this.x+=this.vx; this.y+=this.vy; const r={x:this.x,y:this.y,w:this.w,h:this.h};
    const hit=(a,b)=>!(a.x+a.w<b.x||a.x>b.x+b.width||a.y+a.h<b.y||a.y>b.y+b.height);
    for(const w of l.walls){ if(hit(r,w)){ const dx1=(w.x+w.width)-r.x, dx2=(r.x+r.w)-w.x, dy1=(w.y+w.height)-r.y, dy2=(r.y+r.h)-w.y; const minx=Math.min(dx1,dx2), miny=Math.min(dy1,dy2);
      if(minx<miny){ if(dx1<dx2){ this.x=w.x+w.width; this.vx=Math.max(this.vx,0);} else { this.x=w.x-this.w; this.vx=Math.min(this.vx,0);} }
      else { if(dy1<dy2){ this.y=w.y+w.height; this.vy=Math.max(this.vy,0);} else { this.y=w.y-this.h; this.vy=Math.min(this.vy,0);} }
      r.x=this.x; r.y=this.y; }
    }
  }
  rect(){ return {x:this.x,y:this.y,w:this.w,h:this.h}; }
  coll(b){ const r=this.rect(); return !(r.x+r.w<b.x||r.x>b.x+b.w||r.y+r.h<b.y||r.y>b.y+b.h); }
  render(ctx){ if(this.s.player.loaded){ ctx.filter='grayscale(100%) contrast(120%)'; ctx.drawImage(this.s.player.img,this.x|0,this.y|0,this.w,this.h); ctx.filter='none'; } else { ctx.fillStyle='#FFF'; ctx.fillRect(this.x|0,this.y|0,this.w,this.h);} }
}
class Game{
  constructor(){
    this.c=document.getElementById('gameCanvas')||this.mkCanvas();
    this.x=this.c.getContext('2d'); this.w=240; this.h=282;
    this.c.width=this.w; this.c.height=this.h; Object.assign(this.c.style,{width:'100%',height:'auto',aspectRatio:`${this.w}/${this.h}`,display:'block',margin:'0 auto',background:'#000'});
    this.sprites={ splash:new Img(A.splash), bg:new Img(A.bg), player:new Img(A.player), enemy:new Img(A.enemy), item:new Img(A.item), exit:new Img(A.exit), end:new Img(A.end) };
    this.music=new Music(A.music);
    this.mode='splash'; this.paused=false; this.flashUntil=0; this.levels=new LevelManager(this.w,this.h);
    const st=this.levels.cur().start; this.p=new Player(st.x,st.y,this.sprites); this.collected=0; this.levelClears=0;
    this.sdk={ panelVisible:false, setGravity:(d)=>this.p.setGravity(d), onPTT:(pr)=>{ if(!pr) return; if(this.mode==='splash') this.start(); else this.paused=!this.paused; }, onOrientation:(a,b,g)=>{ const ax=Math.abs(g||0), ay=Math.abs(b||0); if(ax>ay) this.sdk.setGravity((g||0)>8?'right':(g||0)<-8?'left':this.p.g||'down'); else this.sdk.setGravity((b||0)>8?'down':(b||0)<-8?'up':this.p.g||'down'); }};
    this.bind(); this.resize(); this.loop();
  }
  mkCanvas(){ const c=document.createElement('canvas'); c.id='gameCanvas'; document.body.appendChild(c); return c; }
  bind(){
    const start=()=>{ if(this.mode==='splash') this.start(); };
    this.c.addEventListener('click',start,{passive:true}); this.c.addEventListener('pointerdown',start,{passive:true}); this.c.addEventListener('touchstart',(e)=>{e.preventDefault();start();},{passive:false});
    let t0=null; this.c.addEventListener('touchstart',e=>{const t=e.changedTouches[0]; t0={x:t.clientX,y:t.clientY};},{passive:true}); this.c.addEventListener('touchend',e=>{ if(!t0) return; const t=e.changedTouches[0], dx=t.clientX-t0.x, dy=t.clientY-t0.y; if(Math.max(Math.abs(dx),Math.abs(dy))>12){ if(Math.abs(dx)>Math.abs(dy)) this.sdk.setGravity(dx>0?'right':'left'); else this.sdk.setGravity(dy>0?'down':'up'); } t0=null;},{passive:true});
    document.addEventListener('keydown',(e)=>{ switch(e.code){ case 'Space': e.preventDefault(); if(this.mode==='splash') this.start(); else this.paused=!this.paused; break; case 'KeyA': if(this.mode==='playing') this.p.boost(); break; case 'ArrowUp': this.sdk.setGravity('up'); break; case 'ArrowDown': this.sdk.setGravity('down'); break; case 'ArrowLeft': this.sdk.setGravity('left'); break; case 'ArrowRight': this.sdk.setGravity('right'); break; } },{passive:false});
    if('DeviceOrientationEvent' in window){ window.addEventListener('deviceorientation',ev=>this.sdk.onOrientation(ev.alpha,ev.beta,ev.gamma)); }
    const sdk=window.creations||window.r1||window.rabbit||null; if(sdk?.on){ try{ sdk.on('ptt',p=>this.sdk.onPTT(p)); sdk.on('panel',v=>this.sdk.panelVisible=!!v); sdk.on('orientation',({alpha,beta,gamma})=>this.sdk.onOrientation(alpha,beta,gamma)); }catch(_){}}
    window.addEventListener('resize',()=>this.resize());
  }
  resize(){ const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1)); this.c.width=this.w*dpr; this.c.height=this.h*dpr; this.x.setTransform(dpr,0,0,dpr,0,0); }
  start(){ this.mode='playing'; this.paused=false; this.music.play(); const l=this.levels.cur(); const s=l.start; this.p.x=s.x; this.p.y=s.y; this.p.vx=0; this.p.vy=0; this.p.setGravity('down'); this.collected=0; l.items.forEach(i=>i.collected=false); l.exit.open=false; }
  restartLevel(){ const l=this.levels.cur(); const s=l.start; this.p.x=s.x; this.p.y=s.y; this.p.vx=0; this.p.vy=0; this.p.setGravity('down'); this.flashUntil=performance.now()+140; l.items.forEach(i=>i.collected=false); l.exit.open=false; this.collected=0; }
  loop(){ this.update(); this.render(); requestAnimationFrame(()=>this.loop()); }
  update(){ if(this.mode!=='playing'||this.paused) return; const l=this.levels.cur(); this.p.update(l);
    // items
    for(const it of l.items){ if(!it.collected && this.p.coll(it)){ it.collected=true; this.collected++; } }
    if(this.collected>=8) l.exit.open=true;
    // enemies
    for(const e of l.enemies){ if(e.hor){ e.x+=e.v*e.dir; if(Math.abs(e.x-e.home.x)>e.range) e.dir*=-1; } else { e.y+=e.v*e.dir; if(Math.abs(e.y-e.home.y)>e.range) e.dir*=-1; } if(this.p.coll({x:e.x,y:e.y,w:e.w,h:e.h})) { this.restartLevel(); return; } }
    // exit
    if(l.exit.open && this.p.coll({x:l.exit.x,y:l.exit.y,w:l.exit.w,h:l.exit.h})){
      this.levelClears++; if(this.levels.next()){ // next level
        const nl=this.levels.cur(); const s=nl.start; this.p.x=s.x; this.p.y=s.y; this.p.vx=this.p.vy=0; this.p.setGravity('down'); this.collected=0; nl.items.forEach(i=>i.collected=false); nl.exit.open=false;
      } else { this.mode='end'; this.music.stop(); }
    }
  }
  drawBG(){ const s=this.sprites.bg; const ctx=this.x; if(s.loaded){ ctx.filter='grayscale(100%)'; ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.drawImage(s.img,0,0,this.w,this.h); ctx.filter='none'; } else { ctx.fillStyle='#000'; ctx.fillRect(0,0,this.w,this.h); }}
  drawSplash(){ const s=this.sprites.splash, ctx=this.x; ctx.fillStyle='#000'; ctx.fillRect(0,0,this.w,this.h); if(s.loaded){ const iw=s.img.width, ih=s.img.height; const sc=Math.min(this.w/iw,(this.h-24)/ih); const dw=(iw*sc)|0, dh=(ih*sc)|0; const dx=((this.w-dw)/2)|0, dy=((this.h-dh)/2)|0; ctx.filter='grayscale(100%)'; ctx.drawImage(s.img,dx,dy,dw,dh); ctx.filter='none'; } ctx.fillStyle='#FFF'; ctx.font='10px monospace'; ctx.textAlign='center'; ctx.fillText('Tap/Space/PTT to Start', this.w/2, this.h-10); ctx.textAlign='left'; }
  drawHUD(){ const ctx=this.x; ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(0,0,this.w,12); ctx.fillStyle='#FFF'; ctx.font='9px monospace'; ctx.textBaseline='middle'; ctx.fillText(`L${this.levels.i+1}/5  Items:${this.collected}/8`,4,6); ctx.textAlign='right'; ctx.fillText('A Boost  PTT Pause', this.w-4,6); ctx.textAlign='left'; if(this.flashUntil && performance.now()<this.flashUntil){ ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(0,0,this.w,this.h);} }
  render(){ const ctx=this.x; ctx.clearRect(0,0,this.w,this.h); if(this.mode==='splash'){ this.drawSplash(); return; } if(this.mode==='end'){ // endscreen
      const s=this.sprites.end; ctx.fillStyle='#000'; ctx.fillRect(0,0,this.w,this.h); if(s.loaded){ const iw=s.img.width, ih=s.img.height; const sc=Math.min(this.w/iw,(this.h-8)/ih); const dw=(iw*sc)|0, dh=(ih*sc)|0; const dx=((this.w-dw)/2)|0, dy=((this.h-dh)/2)|0; ctx.filter='grayscale(100%)'; ctx.drawImage(s.img,dx,dy,dw,dh); ctx.filter='none'; } ctx.fillStyle='#FFF'; ctx.font='10px monospace'; ctx.textAlign='center'; ctx.fillText('Congrats – All 5 Levels!', this.w/2, this.h-8); ctx.textAlign='left'; return; }
    // playing
    this.drawBG();
    this.levels.render(ctx,this.sprites);
    // items
    const l=this.levels.cur();
    for(const it of l.items){ if(it.collected) continue; if(this.sprites.item.loaded){ ctx.filter='grayscale(100%)

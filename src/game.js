const VERSION = 19;
const $ = (id)=>document.getElementById(id);
const screens=["home","gameScreen","result","panel"];
const show=(id)=>{screens.forEach(s=>$(s).classList.toggle("active",s===id));};

const DEFAULT={coins:0,best:0,seasonXp:0,selectedSkin:0,ownedSkins:[0],dailyLast:"",dailyStreak:0,chestMeter:0,missions:{runs:0,coins:0,near:0},claimed:{},games:0,chestsOpened:0,topRuns:[]};
let profile=loadProfile();
function loadProfile(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem("laneRushProfile")||"{}")};}catch{return {...DEFAULT};}}
function save(){localStorage.setItem("laneRushProfile",JSON.stringify(profile));refreshHome();}
function today(){return new Date().toISOString().slice(0,10)}

const skins=[
 {name:"Neón",price:0,color:"#7cffb2",icon:"◆"},{name:"Plasma",price:250,color:"#58e6ff",icon:"▲"},{name:"Furia",price:500,color:"#ff5d8f",icon:"⬢"},
 {name:"Solar",price:900,color:"#ffd45c",icon:"✦"},{name:"Void",price:1400,color:"#b384ff",icon:"●"},{name:"Elite",price:2200,color:"#ffffff",icon:"⬟"}
];
const missions=[
 {id:"runs",title:"Completa 3 carreras",target:3,reward:80},{id:"coins",title:"Recoge 40 monedas",target:40,reward:120},{id:"near",title:"Haz 8 esquivas ajustadas",target:8,reward:150}
];

function refreshHome(){
 $("homeCoins").textContent=profile.coins;
 $("homeBest").textContent=profile.best;
 $("homeSeason").textContent=Math.floor(profile.seasonXp/100)+1;
 const canDaily=profile.dailyLast!==today();
 $("dailyCard").innerHTML=canDaily?`<b>🎁 Recompensa diaria disponible</b><p>Vuelve cada día para aumentar la racha.</p><button id="dailyBtn">Reclamar</button>`:`<b>✅ Recompensa diaria reclamada</b><p>Racha: ${profile.dailyStreak} día(s)</p>`;
 if(canDaily) $("dailyBtn").onclick=()=>{profile.dailyLast=today();profile.dailyStreak+=1;profile.coins+=50+Math.min(100,profile.dailyStreak*10);save();};
}
refreshHome();

const canvas=$("game"),ctx=canvas.getContext("2d");
let raf=null,last=0,state=null,paused=false;
const lanes=[.22,.5,.78];
const worlds=[
 {name:"Neo City",bg:["#111936","#17265a"],road:"#171a28"},
 {name:"Sunset Grid",bg:["#35162b","#51283b"],road:"#241b28"},
 {name:"Ice Circuit",bg:["#102c3d","#17445b"],road:"#122a34"},
 {name:"Void Run",bg:["#140f26","#2b1742"],road:"#15121f"},
 {name:"Aurora Skyway",bg:["#062b2d","#214c62"],road:"#102b35"}
];

function newState(){return {score:0,runCoins:0,combo:1,bestCombo:1,lane:1,x:lanes[1],targetX:lanes[1],speed:310,spawn:0,coinSpawn:.5,powerSpawn:6,entities:[],alive:true,revived:false,shield:0,magnet:0,slow:0,boost:0,world:0,near:0,lastNear:new Set(),time:0,shake:0};}
function start(){state=newState();paused=false;show("gameScreen");last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function finish(){
 state.alive=false;cancelAnimationFrame(raf);profile.games++;profile.topRuns=[...(profile.topRuns||[]),Math.floor(state.score)].sort((a,b)=>b-a).slice(0,5);profile.missions.runs++;profile.missions.coins+=state.runCoins;profile.missions.near+=state.near;profile.coins+=state.runCoins;profile.best=Math.max(profile.best,Math.floor(state.score));profile.seasonXp+=Math.min(80,10+Math.floor(state.score/250));profile.chestMeter+=state.runCoins;save();
 $("resultScore").textContent=Math.floor(state.score);const rank=(profile.topRuns||[]).indexOf(Math.floor(state.score))+1;$("resultTitle").textContent=rank>0&&rank<=3?`🏆 Top ${rank} personal`:"Carrera terminada";$("resultCoins").textContent=state.runCoins;$("resultCombo").textContent=`x${state.bestCombo}`;$("reviveBtn").disabled=state.revived;$("doubleBtn").disabled=false;show("result");
}
function rewardAd(kind){return new Promise(resolve=>{const btn=kind==="revive"?$("reviveBtn"):$("doubleBtn");const old=btn.textContent;btn.disabled=true;btn.textContent="Anuncio simulado…";setTimeout(()=>{btn.textContent=old;resolve(true)},900);});}

function spawnObstacle(){
 const lane=Math.floor(Math.random()*3),roll=Math.random();
 if(roll<.08 && state.score>700){const gap=Math.floor(Math.random()*3);[0,1,2].forEach((row)=>{const safe=(gap+row)%3;[0,1,2].forEach((l)=>{if(l!==safe)state.entities.push({type:"block",lane:l,y:-.12-row*.22,w:.18,h:.1,v:1})})})}
 else if(roll<.12 && state.score>400){state.entities.push({type:"barrier",lane,y:-.12,w:.2,h:.07,v:1.0});state.entities.push({type:"barrier",lane:(lane+1)%3,y:-.34,w:.2,h:.07,v:1.0});}
 else if(roll<.28 && state.score>200){const gap=Math.floor(Math.random()*3);for(let l=0;l<3;l++)if(l!==gap)state.entities.push({type:"block",lane:l,y:-.12,w:.18,h:.1,v:1.0});}
 else state.entities.push({type:Math.random()<.35?"drone":"block",lane,y:-.12,w:.18,h:.1,v:1+Math.random()*.18,drift:Math.random()<.5?-1:1});
}
function spawnCoin(){const lane=Math.floor(Math.random()*3);for(let i=0;i<3;i++)state.entities.push({type:"coin",lane,y:-.08-i*.09,w:.06,h:.06,v:.92});}
function spawnPower(){const types=["shield","magnet","slow","boost"];state.entities.push({type:types[Math.floor(Math.random()*types.length)],lane:Math.floor(Math.random()*3),y:-.1,w:.08,h:.08,v:.9});}

function loop(t){if(!state?.alive)return;const dt=Math.min(.035,(t-last)/1000);last=t;if(!paused){update(dt);draw();}raf=requestAnimationFrame(loop);}
function update(dt){
 state.time+=dt;state.score+=dt*state.speed*.11*(state.boost>0?1.6:1);state.speed=Math.min(620,305+state.score*.041);state.world=Math.min(worlds.length-1,Math.floor(state.score/800));
 state.shield=Math.max(0,state.shield-dt);state.magnet=Math.max(0,state.magnet-dt);state.slow=Math.max(0,state.slow-dt);state.boost=Math.max(0,state.boost-dt);state.shake=Math.max(0,state.shake-dt*4);
 state.x += (state.targetX-state.x)*Math.min(1,dt*16);
 state.spawn-=dt;state.coinSpawn-=dt;state.powerSpawn-=dt;
 const tier=state.score<500?0:state.score<1400?1:state.score<2800?2:3;const difficulty=Math.max(.46,1.0-state.score/5200);
 if(state.spawn<=0){spawnObstacle();state.spawn=difficulty*(.72+Math.random()*.38)}
 if(state.coinSpawn<=0){spawnCoin();state.coinSpawn=1.15+Math.random()*1.2}
 if(state.powerSpawn<=0){spawnPower();state.powerSpawn=9+Math.random()*6}
 const worldPulse=state.world===4?1.08:1;const speedMul=(state.slow>0?.72:1)*state.speed/430*worldPulse;
 let nearNow=false;
 for(const e of state.entities){
   if(e.type==="drone" && e.y>.12 && e.y<.38 && Math.random()<dt*.4){e.lane=Math.max(0,Math.min(2,e.lane+e.drift));}
   e.y+=dt*.72*e.v*speedMul;
   const ex=lanes[e.lane];
   const dx=Math.abs(ex-state.x),dy=Math.abs(e.y-.82);
   if(e.type==="coin" && state.magnet>0 && dy<.28){e.lane=nearestLane(state.x)}
   if(!e.hit && dy<.07 && dx<.105){
     if(e.type==="coin"){e.hit=true;state.runCoins+=1+tier;state.combo=Math.min(8,state.combo+1);state.bestCombo=Math.max(state.bestCombo,state.combo);state.score+=8*state.combo;}
     else if(["shield","magnet","slow","boost"].includes(e.type)){e.hit=true;state[e.type]=6;}
     else if(state.shield>0){e.hit=true;state.shield=0;state.shake=1;state.combo=1;}
     else {finish();return;}
   } else if(!e.hit && ["block","barrier","drone"].includes(e.type) && dy<.09 && dx<.17 && dx>.105){nearNow=true;}
 }
 if(nearNow){const key=Math.floor(state.time*4);if(!state.lastNear.has(key)){state.lastNear.add(key);state.near++;state.combo=Math.min(8,state.combo+1);state.bestCombo=Math.max(state.bestCombo,state.combo);state.score+=4*state.combo;pulse(8)}if(state.lastNear.size>12)state.lastNear.delete(Math.min(...state.lastNear));}
 state.entities=state.entities.filter(e=>e.y<1.15&&!e.hit).slice(-55);
 $("score").textContent=Math.floor(state.score);$("runCoins").textContent=state.runCoins;$("combo").textContent=`x${state.combo}`;renderPowerHud();
}
function nearestLane(x){let bi=0,bd=9;lanes.forEach((v,i)=>{const d=Math.abs(v-x);if(d<bd){bd=d;bi=i}});return bi;}

function draw(){
 const dpr=Math.min(2,devicePixelRatio||1),w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr}ctx.setTransform(dpr,0,0,dpr,0,0);
 const world=worlds[state.world];const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,world.bg[0]);grad.addColorStop(1,world.bg[1]);ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 const sx=state.shake?Math.sin(state.time*80)*5*state.shake:0;ctx.save();ctx.translate(sx,0);
 ctx.fillStyle=world.road;ctx.fillRect(w*.08,0,w*.84,h);ctx.strokeStyle="#ffffff22";ctx.lineWidth=2;ctx.setLineDash([22,26]);for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(w*(.08+.84*i/3),0);ctx.lineTo(w*(.08+.84*i/3),h);ctx.stroke()}ctx.setLineDash([]);
 const py=h*.82,px=w*state.x;ctx.shadowBlur=state.shield>0?24:10;ctx.shadowColor=skins[profile.selectedSkin].color;ctx.fillStyle=skins[profile.selectedSkin].color;rounded(ctx,px-w*.045,py-h*.035,w*.09,h*.07,10);ctx.fill();ctx.shadowBlur=0;
 for(const e of state.entities){const x=w*lanes[e.lane],y=h*e.y;if(e.type==="coin"){ctx.fillStyle="#ffd45c";ctx.beginPath();ctx.arc(x,y,w*.024,0,Math.PI*2);ctx.fill();ctx.fillStyle="#6c4a00";ctx.font=`bold ${w*.027}px sans-serif`;ctx.fillText("C",x-w*.009,y+w*.01)}else if(["shield","magnet","slow"].includes(e.type)){ctx.fillStyle=e.type==="shield"?"#58e6ff":e.type==="magnet"?"#ff5d8f":"#b384ff";ctx.beginPath();ctx.arc(x,y,w*.034,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font=`bold ${w*.03}px sans-serif`;ctx.textAlign="center";ctx.fillText(e.type[0].toUpperCase(),x,y+w*.011);ctx.textAlign="left";}else{ctx.fillStyle=e.type==="drone"?"#ff8a5c":"#f04468";rounded(ctx,x-w*e.w/2,y-h*e.h/2,w*e.w,h*e.h,9);ctx.fill();}}
 ctx.restore();ctx.fillStyle="#ffffff88";ctx.font="700 12px sans-serif";ctx.fillText(`${world.name} · V${VERSION}`,14,h-14);
}
function rounded(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
function renderPowerHud(){const p=[];if(state.shield>0)p.push(`🛡️ ${state.shield.toFixed(1)}`);if(state.magnet>0)p.push(`🧲 ${state.magnet.toFixed(1)}`);if(state.slow>0)p.push(`⏱️ ${state.slow.toFixed(1)}`);if(state.boost>0)p.push(`⚡ ${state.boost.toFixed(1)}`);$("powerHud").innerHTML=p.map(x=>`<span class="power-pill">${x}</span>`).join("")}

function pulse(ms=18){if(navigator.vibrate)navigator.vibrate(ms)}
function move(dir){if(!state?.alive||paused)return;const lane=nearestLane(state.targetX);const next=Math.max(0,Math.min(2,lane+dir));if(next!==lane){state.targetX=lanes[next];pulse(12)}}
let touchX=0;canvas.addEventListener("pointerdown",e=>touchX=e.clientX);canvas.addEventListener("pointerup",e=>{const d=e.clientX-touchX;if(Math.abs(d)>22)move(d>0?1:-1);});canvas.addEventListener("pointercancel",()=>{touchX=0});window.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")move(-1);if(e.key==="ArrowRight")move(1)});

$("playBtn").onclick=start;$("retryBtn").onclick=start;$("homeBtn").onclick=()=>show("home");$("pauseBtn").onclick=()=>{paused=!paused;$("pauseBtn").textContent=paused?"▶":"Ⅱ"};
$("reviveBtn").onclick=async()=>{if(state.revived)return;if(await rewardAd("revive")){state.revived=true;state.alive=true;state.shield=3;state.entities=state.entities.filter(e=>Math.abs(e.y-.82)>.2);show("gameScreen");last=performance.now();raf=requestAnimationFrame(loop)}};
$("doubleBtn").onclick=async()=>{if(await rewardAd("double")){profile.coins+=state.runCoins;save();$("resultCoins").textContent=state.runCoins*2;$("doubleBtn").disabled=true}};

document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));$("closePanel").onclick=()=>show("home");
function openPanel(kind){show("panel");const c=$("panelContent");if(kind==="missions")renderMissions(c);if(kind==="skins")renderSkins(c);if(kind==="chest")renderChest(c);if(kind==="season")renderSeason(c);}
function renderMissions(c){c.innerHTML=`<h2>Misiones</h2><div class="list">${missions.map(m=>{const v=Math.min(m.target,profile.missions[m.id]||0),done=v>=m.target,claimed=profile.claimed[m.id];return `<div class="list-item"><b>${m.title}</b><p>${v}/${m.target} · 🪙 ${m.reward}</p><div class="progress"><i style="width:${v/m.target*100}%"></i></div>${done&&!claimed?`<button data-claim="${m.id}">Cobrar</button>`:claimed?`<small>✅ Reclamada</small>`:""}</div>`}).join("")}</div>`;c.querySelectorAll("[data-claim]").forEach(b=>b.onclick=()=>{const m=missions.find(x=>x.id===b.dataset.claim);profile.coins+=m.reward;profile.claimed[m.id]=true;save();renderMissions(c)});}
function renderSkins(c){c.innerHTML=`<h2>Skins</h2><div class="skin-grid">${skins.map((s,i)=>{const own=profile.ownedSkins.includes(i);return `<button class="skin ${own?"":"locked"} ${profile.selectedSkin===i?"selected":""}" data-skin="${i}" style="background:${s.color}22"><span style="color:${s.color}">${s.icon}</span><small>${s.name}<br>${own?"Disponible":`🪙 ${s.price}`}</small></button>`}).join("")}</div>`;c.querySelectorAll("[data-skin]").forEach(b=>b.onclick=()=>{const i=+b.dataset.skin,s=skins[i];if(profile.ownedSkins.includes(i)){profile.selectedSkin=i}else if(profile.coins>=s.price){profile.coins-=s.price;profile.ownedSkins.push(i);profile.selectedSkin=i}save();renderSkins(c)});}
function renderChest(c){const need=50,ready=profile.chestMeter>=need;c.innerHTML=`<h2>Cofre de carrera</h2><p>Llénalo recogiendo monedas durante las partidas.</p><div class="progress"><i style="width:${Math.min(100,profile.chestMeter/need*100)}%"></i></div><p>${Math.min(need,profile.chestMeter)}/${need}</p><button id="openChest" ${ready?"":"disabled"}>${ready?"Abrir cofre":"Sigue jugando"}</button>`;if(ready)$("openChest").onclick=()=>{profile.chestMeter-=need;profile.chestsOpened++;profile.coins+=profile.chestsOpened%5===0?250:125;save();renderChest(c)}}
function renderSeason(c){const level=Math.floor(profile.seasonXp/100)+1,xp=profile.seasonXp%100;c.innerHTML=`<h2>Temporada 1</h2><p>Nivel <b>${level}</b> · ${xp}/100 XP</p><div class="progress"><i style="width:${xp}%"></i></div><div class="list"><div class="list-item">Nivel ${level+1}: 100 monedas</div><div class="list-item">Nivel ${level+2}: skin temporal</div><div class="list-item">Nivel ${level+3}: cofre premium</div></div><small>El pase de temporada evolucionará en las próximas versiones.</small>`;};

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});

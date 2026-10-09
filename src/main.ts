import Phaser from 'phaser';
import { MODULES, RESOURCE_INFO, SECTORS, emptyBag, type ResourceId } from './data';
import { FactorySystems, Inventory, spawnInterval, saveState, loadState, type FragmentData } from './systems';
import './styles.css';

const inventory=new Inventory(); const factory=new FactorySystems();
let sectorIndex=0, travelProgress=0, gameStarted=false, paused=true, buildMode=false, selectedModule='cargo';
let soundVolume=0.25; let lastToast=0;
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
function toast(message:string){const el=$('toast');el.textContent=message;el.classList.add('show');lastToast=performance.now();}
class SpaceScene extends Phaser.Scene {
  ship!:Phaser.GameObjects.Container; shipBody!:Phaser.GameObjects.Graphics; fragments: {data:FragmentData;shape:Phaser.GameObjects.Graphics}[]=[];
  keys!:Record<string,Phaser.Input.Keyboard.Key>; spawnClock=0; nextId=1; speed=0; angle=-Math.PI/2; distance=0; elapsed=0; boost=0; stars:Phaser.GameObjects.Arc[]=[];
  constructor(){super('space');}
  create(){
    this.cameras.main.setBackgroundColor('#070b16');
    for(let i=0;i<145;i++){const x=Math.random()*this.scale.width,y=Math.random()*this.scale.height;const star=this.add.circle(x,y,Math.random()*1.4+0.3,0xaac8ff,Math.random()*0.6+0.12);star.setData('vx',(Math.random()-.5)*10);this.stars.push(star);}
    this.shipBody=this.add.graphics();this.ship=this.add.container(this.scale.width/2,this.scale.height/2,[this.shipBody]);this.drawShip();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,B,ESC') as Record<string,Phaser.Input.Keyboard.Key>;
    this.scale.on('resize',()=>this.ship.setPosition(this.scale.width/2,this.scale.height/2));
    this.input.keyboard!.on('keydown-E',()=>this.collectNearest());
    this.input.keyboard!.on('keydown-B',()=>toggleBuild());
    this.input.keyboard!.on('keydown-SPACE',()=>{if(!paused&&gameStarted)this.boost=1.1;});
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(buildMode)this.tryPlaceAt(p.x,p.y);});
    this.events.on('wake',()=>{});
  }
  drawShip(){this.shipBody.clear();this.shipBody.fillStyle(0x55e6d0,0.16);this.shipBody.fillCircle(0,0,25);this.shipBody.fillStyle(0x152a43,1);this.shipBody.lineStyle(2,0x71f5e0,1);this.shipBody.beginPath();this.shipBody.moveTo(0,-21);this.shipBody.lineTo(14,14);this.shipBody.lineTo(0,8);this.shipBody.lineTo(-14,14);this.shipBody.closePath();this.shipBody.fillPath();this.shipBody.strokePath();this.shipBody.fillStyle(0x74caff,1);this.shipBody.fillCircle(0,-2,4);}
  update(_time:number,deltaMs:number){
    const dt=Math.min(deltaMs/1000,0.05);if(paused||!gameStarted)return;this.elapsed+=dt;
    const accelerating=this.keys.W.isDown||this.keys.UP.isDown, braking=this.keys.S.isDown||this.keys.DOWN.isDown;
    if(this.keys.A.isDown||this.keys.LEFT.isDown)this.angle-=2.45*dt;if(this.keys.D.isDown||this.keys.RIGHT.isDown)this.angle+=2.45*dt;
    const accel=factory.modules.some(m=>m.type==='engine')?95:65;
    this.speed=Phaser.Math.Clamp(this.speed+(accelerating?accel:0)*dt-(braking?120:0)*dt-(accelerating?0:12*dt),0,320);
    if(this.boost>0){this.speed=Math.min(390,this.speed+190*dt);this.boost=Math.max(0,this.boost-dt);}
    const sector=SECTORS[sectorIndex];this.distance+=this.speed*dt/22;
    if(sector.distance>0)travelProgress=Math.min(100,this.distance/sector.distance*100);
    const interval=spawnInterval(this.speed,0.22,0.006,sector.spawn);
    this.spawnClock+=dt;if(this.spawnClock>=interval&&this.fragments.length<115){this.spawnClock=0;this.spawnFragment();}
    const fx=Math.cos(this.angle),fy=Math.sin(this.angle);
    for(let i=this.fragments.length-1;i>=0;i--){const f=this.fragments[i];f.data.x+=(-fx*this.speed*0.9+f.data.vx)*dt;f.data.y+=(-fy*this.speed*0.9+f.data.vy)*dt;f.data.rotation+=f.data.spin*dt;f.shape.setPosition(f.data.x,f.data.y).setRotation(f.data.rotation);
      if(Math.hypot(f.data.x-this.ship.x,f.data.y-this.ship.y)<f.data.size+15){if(factory.modules.some(m=>m.type==='collector')&&factory.energy>0){this.pickup(f.data);this.fragments.splice(i,1);f.shape.destroy();continue;}}
      if(f.data.x < -100||f.data.x>this.scale.width+100||f.data.y < -100||f.data.y>this.scale.height+100){f.shape.destroy();this.fragments.splice(i,1);}
    }
    for(const star of this.stars){star.x-=fx*this.speed*0.07*dt;star.y-=fy*this.speed*0.07*dt;if(star.x<0)star.x=this.scale.width;if(star.x>this.scale.width)star.x=0;if(star.y<0)star.y=this.scale.height;if(star.y>this.scale.height)star.y=0;}
    if(factory.modules.some(m=>m.type==='collector'))factory.energy=Math.max(0,factory.energy-0.7*dt);
    factory.tick(dt,inventory,toast);
    this.ship.setRotation(this.angle+Math.PI/2);
    updateHud(this);
  }
  spawnFragment(){
    const sector=SECTORS[sectorIndex], rare=Math.random()<sector.rare;
    const roll=Math.random();let material:ResourceId=rare?'crystal':roll<.34?'rock':roll<.58?'iron':roll<.75?'ice':'copper';
    const fx=Math.cos(this.angle),fy=Math.sin(this.angle),side=Phaser.Math.FloatBetween(-this.scale.width*.47,this.scale.width*.47);
    const x=this.ship.x+fx*Phaser.Math.Between(370,620)-fy*side,y=this.ship.y+fy*Phaser.Math.Between(370,620)+fx*side;
    const size=Phaser.Math.Between(rare?8:5,rare?13:17),info=RESOURCE_INFO[material];
    const data:FragmentData={id:this.nextId++,x,y,size,material,amount:rare?2:Phaser.Math.Between(1,3),vx:Phaser.Math.Between(-18,18),vy:Phaser.Math.Between(-18,18),rotation:Math.random()*6,spin:Phaser.Math.FloatBetween(-1,1)};
    const shape=this.add.graphics();shape.fillStyle(info.color,0.9);shape.lineStyle(1,0xffffff,0.45);shape.beginPath();
    const sides=Phaser.Math.Between(5,8);for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,r=size*Phaser.Math.FloatBetween(.72,1.18);if(i===0)shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);else shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();shape.fillPath();shape.strokePath();
    if(rare){shape.lineStyle(2,0xc5a2ff,.8);shape.strokeCircle(0,0,size+4);}
    shape.setPosition(x,y);this.fragments.push({data,shape});
  }
  collectNearest(){let best=-1,dist=145;for(let i=0;i<this.fragments.length;i++){const f=this.fragments[i],d=Phaser.Math.Distance.Between(this.ship.x,this.ship.y,f.data.x,f.data.y);if(d<dist){dist=d;best=i;}}if(best<0){toast('Keine Fragmente in Reichweite.');return;}const f=this.fragments[best];this.pickup(f.data);f.shape.destroy();this.fragments.splice(best,1);}
  pickup(f:FragmentData){const accepted=inventory.add(f.material,f.amount);if(accepted){toast('+'+accepted+' '+RESOURCE_INFO[f.material].label+' eingesammelt');if(soundVolume>0){/* Audio can be added without external assets. */}}else toast('Frachtraum voll! Baue ein Lager.');}
  tryPlaceAt(px:number,py:number){const gx=Math.round((px-this.ship.x)/42),gy=Math.round((py-this.ship.y)/42);if(Math.abs(gx)>3||Math.abs(gy)>3)return;const error=factory.place(selectedModule,gx,gy,inventory);if(error)toast(error);else{toast(MODULES.find(m=>m.id===selectedModule)?.name+' installiert');drawModuleGrid(this);updateHud(this);}}
  renderBuildGrid(){drawModuleGrid(this);}
}
let scene:SpaceScene;
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:960,height:640,backgroundColor:'#070b16',scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[SpaceScene],fps:{target:60,forceSetTimeOut:false}});
game.events.once('ready',()=>{});scene=game.scene.getScene('space') as SpaceScene;
function updateHud(s:SpaceScene){
  $('speed').textContent=Math.round(s.speed).toString();$('direction').textContent=((Math.round(Phaser.Math.RadToDeg(s.angle)+360)%360).toString().padStart(3,'0'))+'°';
  $('speed-meter').style.width=(s.speed/390*100)+'%';$('cargo-label').textContent=inventory.used()+' / '+inventory.capacity;$('cargo-meter').style.width=(inventory.used()/inventory.capacity*100)+'%';
  $('energy').textContent=Math.floor(factory.energy).toString();$('generation').textContent='+'+factory.generation()+' /s';$('consumption').textContent='−'+factory.consumption()+' /s';
  $('inventory').innerHTML=(Object.keys(RESOURCE_INFO) as ResourceId[]).map(k=>'<div class="resource"><span style="color:#'+RESOURCE_INFO[k].color.toString(16)+'">'+RESOURCE_INFO[k].icon+'</span><div><small>'+RESOURCE_INFO[k].label+'</small><strong>'+inventory.items[k]+'</strong></div></div>').join('');
  $('module-count').textContent=factory.modules.length+' Module';$('modules-list').innerHTML=factory.modules.map(m=>{const d=MODULES.find(x=>x.id===m.type)!;return '<div class="module-item"><span class="module-icon">'+d.icon+'</span><div><strong>'+d.name+'</strong><small>'+(d.recipe?m.status:'Online')+'</small></div></div>';}).join('');
  const sec=SECTORS[sectorIndex];$('sector-label').textContent='SEKTOR '+String(sectorIndex+1).padStart(2,'0');$('destination').textContent=sec.destination;$('travel-meter').style.width=travelProgress+'%';$('distance').textContent=Math.floor(s.distance)+' / '+sec.distance;$('travel-btn').toggleAttribute('disabled',travelProgress<100||sectorIndex>=SECTORS.length-1);
  if(performance.now()-lastToast>2600)$('toast').classList.remove('show');
}
function drawModuleGrid(s:SpaceScene){const old=s.children.getByName('build-grid');if(old)old.destroy();if(!buildMode)return;const g=s.add.graphics().setName('build-grid');const cx=s.ship.x,cy=s.ship.y;for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++){const px=cx+x*42,py=cy+y*42;g.lineStyle(1,0x68e6d6,.25);g.strokeRoundedRect(px-19,py-19,38,38,5);if(factory.modules.some(m=>m.x===x&&m.y===y)){g.fillStyle(0x58d9c8,.25);g.fillRoundedRect(px-18,py-18,36,36,5);}}}
function togglePause(force?:boolean){if(!gameStarted)return;paused=force??!paused;$('pause-overlay').classList.toggle('hidden',!paused);if(paused){game.loop.sleep();}else{game.loop.wake();}}
function toggleBuild(){if(!gameStarted)return;buildMode=!buildMode;$('build-panel').classList.toggle('hidden',!buildMode);scene.renderBuildGrid();}
function buildOptions(){ $('build-options').innerHTML=MODULES.filter(m=>m.id!=='core').map(m=>'<button class="build-option" data-module="'+m.id+'"><span>'+m.icon+'</span><div><strong>'+m.name+'</strong><small>'+m.description+'</small><small>Kosten: '+Object.entries(m.cost).map(([k,v])=>v+' '+RESOURCE_INFO[k as ResourceId].label).join(', ')+'</small></div></button>').join('');document.querySelectorAll<HTMLButtonElement>('[data-module]').forEach(b=>b.onclick=()=>{selectedModule=b.dataset.module??'cargo';toast('Modul ausgewählt: '+MODULES.find(m=>m.id===selectedModule)?.name+' · Klicke auf ein angrenzendes Rasterfeld');});}
function startGame(load=false){if(load){const saved=loadState(inventory,factory);if(saved){sectorIndex=saved.sector;travelProgress=saved.progress;scene.distance=SECTORS[sectorIndex].distance*travelProgress/100;toast('Spielstand geladen.');}else toast('Kein gültiger Spielstand gefunden.');}gameStarted=true;paused=false;$('start-overlay').classList.add('hidden');$('pause-overlay').classList.add('hidden');game.loop.wake();scene.scene.resume();updateHud(scene);}
$('start-btn').onclick=()=>startGame(false);$('continue-btn').onclick=()=>startGame(true);$('resume-btn').onclick=()=>togglePause(false);$('restart-btn').onclick=()=>{inventory.items=emptyBag();inventory.capacity=40;factory.modules=[{id:'core-1',type:'core',x:0,y:0,progress:0,status:'online'}];factory.energy=100;sectorIndex=0;travelProgress=0;scene.distance=0;scene.speed=0;gameStarted=false;paused=true;$('pause-overlay').classList.add('hidden');$('start-overlay').classList.remove('hidden');};
$('help-btn').onclick=()=>$('help-modal').classList.remove('hidden');$('close-help').onclick=()=>$('help-modal').classList.add('hidden');$('collect-btn').onclick=()=>scene.collectNearest();$('build-btn').onclick=()=>toggleBuild();$('cancel-build').onclick=()=>{buildMode=false;$('build-panel').classList.add('hidden');scene.renderBuildGrid();};
$('save-btn').onclick=()=>toast(saveState(inventory,factory,sectorIndex,travelProgress)?'Spielstand gespeichert.':'Speichern nicht möglich.');
$('travel-btn').onclick=()=>{if(travelProgress<100||sectorIndex>=SECTORS.length-1)return;const cost={ice:5,parts:2};if(!inventory.spend(cost)){toast('Sprung benötigt: 5 Eis und 2 Komponenten.');return;}sectorIndex++;travelProgress=0;scene.distance=0;scene.fragments.forEach(f=>f.shape.destroy());scene.fragments=[];toast('Sektor erreicht: '+SECTORS[sectorIndex].name);};
buildOptions();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('help-modal').classList.contains('hidden')){$('help-modal').classList.add('hidden');return;}if(e.key==='Escape'&&gameStarted)togglePause();});
window.addEventListener('beforeunload',()=>saveState(inventory,factory,sectorIndex,travelProgress));

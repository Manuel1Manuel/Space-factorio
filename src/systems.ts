import { emptyBag, type ResourceBag, type ResourceId, MODULES } from './data';
export interface FragmentData { id:number; x:number; y:number; size:number; material:ResourceId; amount:number; vx:number; vy:number; rotation:number; spin:number; }
export class Inventory {
  items: ResourceBag = emptyBag(); capacity=40;
  used(): number { return Object.values(this.items).reduce((a,b)=>a+b,0); }
  add(type:ResourceId, amount:number): number { const accepted=Math.max(0,Math.min(Math.floor(amount),this.capacity-this.used())); this.items[type]+=accepted; return accepted; }
  canSpend(cost:Partial<ResourceBag>): boolean { return Object.entries(cost).every(([k,v])=>this.items[k as ResourceId]>=(v??0)); }
  spend(cost:Partial<ResourceBag>): boolean { if(!this.canSpend(cost)) return false; for(const [k,v] of Object.entries(cost)) this.items[k as ResourceId]-=v??0; return true; }
  serialize(){ return {items:{...this.items},capacity:this.capacity}; }
  restore(data:unknown){ try { const d=data as {items:Record<string,unknown>;capacity:number}; if(!d?.items) return; for(const k of Object.keys(this.items) as ResourceId[]) {const v=d.items[k];this.items[k]=typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.floor(v)):0;} if(Number.isFinite(d.capacity))this.capacity=Math.max(40,Math.floor(d.capacity)); } catch { /* invalid save: keep defaults */ } }
}
export interface PlacedModule { id:string; type:string; x:number; y:number; progress:number; status:string; }
export class FactorySystems {
  modules:PlacedModule[]=[{id:'core-1',type:'core',x:0,y:0,progress:0,status:'online'}];
  energy=100; maxEnergy=100; productionTime=0;
  generation(){return this.modules.reduce((s,m)=>s+(MODULES.find(d=>d.id===m.type)?.generation??0),0);}
  consumption(){return this.modules.reduce((s,m)=>s+(MODULES.find(d=>d.id===m.type)?.power??0),0);}
  tick(dt:number, inventory:Inventory, notify:(s:string)=>void){this.energy=Math.min(this.maxEnergy,this.energy+this.generation()*dt);let available=this.energy;for(const m of this.modules){const def=MODULES.find(d=>d.id===m.type);if(!def?.recipe)continue;if(available<def.power){m.status='Wartet auf Energie';continue;}available-=def.power*dt;if(!inventory.canSpend(def.recipe.input)){m.status='Wartet auf Rohstoffe';m.progress=0;continue;}m.status='Produziert';m.progress+=dt;if(m.progress>=def.recipe.seconds){if(inventory.used()+Object.values(def.recipe.output).reduce((a,b)=>a+(b??0),0)>inventory.capacity){m.status='Ausgabe kann nicht gelagert werden';m.progress=def.recipe.seconds;}else{inventory.spend(def.recipe.input);for(const [k,v] of Object.entries(def.recipe.output))inventory.add(k as ResourceId,v??0);m.progress-=def.recipe.seconds;notify('Produktion: Schiffskomponente gefertigt');}}}this.energy=Math.max(0,this.energy-this.consumption()*dt);this.energy=Math.min(this.maxEnergy,Math.max(0,this.energy));}
  place(type:string,x:number,y:number,inventory:Inventory):string|null {const def=MODULES.find(d=>d.id===type);if(!def||type==='core')return 'Dieses Modul kann nicht platziert werden.';if(this.modules.some(m=>m.x===x&&m.y===y))return 'Feld bereits belegt.';if(!this.modules.some(m=>Math.abs(m.x-x)+Math.abs(m.y-y)===1))return 'Module müssen an dein Schiff angrenzen.';if(!inventory.spend(def.cost))return 'Nicht genügend Ressourcen.';this.modules.push({id:type+'-'+Date.now()+'-'+this.modules.length,type,x,y,progress:0,status:'Bereit'});if(type==='cargo')inventory.capacity+=25;if(type==='storage')inventory.capacity+=15;return null;}
  serialize(){return {modules:this.modules.map(m=>({...m})),energy:this.energy};}
  restore(data:unknown){try{const d=data as {modules:PlacedModule[];energy:number};if(Array.isArray(d?.modules)&&d.modules.some(m=>m.type==='core'))this.modules=d.modules.filter(m=>MODULES.some(def=>def.id===m.type)&&Number.isFinite(m.x)&&Number.isFinite(m.y)).map(m=>({...m}));if(Number.isFinite(d?.energy))this.energy=Math.max(0,Math.min(this.maxEnergy,d.energy));}catch{/* ignore invalid save */}}
}
export function spawnInterval(speed:number, base:number, factor:number, multiplier=1):number {return 1/Math.max(0.05,Math.min(2.8,base+factor*Math.max(0,speed)*multiplier));}
export function saveState(inventory:Inventory,factory:FactorySystems,sector:number,progress:number){try{localStorage.setItem('space-factory-save',JSON.stringify({version:1,inventory:inventory.serialize(),factory:factory.serialize(),sector,progress}));return true;}catch{return false;}}
export function loadState(inventory:Inventory,factory:FactorySystems):{sector:number;progress:number}|null {try{const raw=localStorage.getItem('space-factory-save');if(!raw)return null;const d=JSON.parse(raw);if(d.version!==1)return null;inventory.restore(d.inventory);factory.restore(d.factory);return {sector:Number.isInteger(d.sector)?Math.max(0,Math.min(4,d.sector)):0,progress:Number.isFinite(d.progress)?Math.max(0,d.progress):0};}catch{return null;}}

import { describe, expect, it } from 'vitest';
import { FactorySystems, Inventory, spawnInterval } from './systems';
describe('Space Factory core systems',()=>{
 it('higher speed produces more frequent encounters',()=>{expect(spawnInterval(200,.22,.006)).toBeLessThan(spawnInterval(10,.22,.006));});
 it('inventory adds resources and respects cargo capacity',()=>{const i=new Inventory();expect(i.add('iron',10)).toBe(10);i.capacity=12;expect(i.add('rock',9)).toBe(2);expect(i.add('ice',1)).toBe(0);expect(i.used()).toBe(12);});
 it('never spends resources into negative amounts',()=>{const i=new Inventory();i.items.iron=2;expect(i.spend({iron:3})).toBe(false);expect(i.items.iron).toBe(2);expect(i.spend({iron:2})).toBe(true);expect(i.items.iron).toBe(0);});
 it('requires materials to place modules and deducts exact cost',()=>{const i=new Inventory(),f=new FactorySystems();expect(f.place('cargo',1,0,i)).toContain('Nicht genügend');i.items.iron=5;i.items.rock=4;expect(f.place('cargo',1,0,i)).toBeNull();expect(i.items.iron).toBe(0);expect(i.items.rock).toBe(0);expect(i.capacity).toBe(65);});
 it('production waits for inputs and produces components over time',()=>{const i=new Inventory(),f=new FactorySystems();i.items.iron=8;i.items.copper=4;expect(f.place('factory',1,0,i)).toBeNull();i.items.iron=3;for(let n=0;n<6;n++)f.tick(1,i,()=>{});expect(i.items.parts).toBe(1);expect(i.items.iron).toBe(0);});
 it('restores valid save-shaped state and ignores malformed data',()=>{const i=new Inventory(),f=new FactorySystems();i.items.ice=7;i.restore({items:{ice:3,iron:-99},capacity:80});expect(i.items.ice).toBe(3);expect(i.items.iron).toBe(0);expect(i.capacity).toBe(80);f.restore(null);expect(f.modules[0].type).toBe('core');});
});
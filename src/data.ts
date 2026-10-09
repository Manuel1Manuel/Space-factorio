export type ResourceId = 'rock' | 'iron' | 'ice' | 'copper' | 'crystal' | 'parts';
export type ResourceBag = Record<ResourceId, number>;
export const RESOURCE_INFO: Record<ResourceId, { label: string; icon: string; color: number }> = {
  rock: { label: 'Gestein', icon: '◆', color: 0x8995a8 },
  iron: { label: 'Eisen', icon: '⬡', color: 0xd4a77b },
  ice: { label: 'Eis', icon: '❄', color: 0x7edcff },
  copper: { label: 'Kupfer', icon: '⬢', color: 0xe78c62 },
  crystal: { label: 'Kristall', icon: '✧', color: 0xc5a2ff },
  parts: { label: 'Komponenten', icon: '▦', color: 0x69e7c2 }
};
export interface ModuleDef { id: string; name: string; icon: string; description: string; cost: Partial<ResourceBag>; mass: number; power: number; generation: number; range?: number; recipe?: { input: Partial<ResourceBag>; output: Partial<ResourceBag>; seconds: number }; }
export const MODULES: ModuleDef[] = [
 { id:'core', name:'Schiffskern', icon:'⬡', description:'Zentrale Steuereinheit', cost:{}, mass:10, power:0, generation:4 },
 { id:'cargo', name:'Frachtraum', icon:'▤', description:'+25 Ladekapazität', cost:{iron:5, rock:4}, mass:5, power:0, generation:0 },
 { id:'engine', name:'Antrieb', icon:'➤', description:'Verbesserte Beschleunigung', cost:{iron:6, copper:2}, mass:4, power:1, generation:0 },
 { id:'generator', name:'Generator', icon:'⚡', description:'+6 Energie pro Sekunde', cost:{iron:5, copper:3}, mass:6, power:0, generation:6 },
 { id:'collector', name:'Automatischer Sammler', icon:'◎', description:'Sammelt nahe Fragmente (Energie)', cost:{iron:8, copper:2}, mass:4, power:2, generation:0, range:125 },
 { id:'factory', name:'Produktionsmaschine', icon:'⚙', description:'3 Eisen → 1 Komponente', cost:{iron:8, copper:4}, mass:8, power:3, generation:0, recipe:{input:{iron:3},output:{parts:1},seconds:5} },
 { id:'storage', name:'Lagermodul', icon:'▣', description:'+15 Ladekapazität', cost:{iron:4, rock:8}, mass:5, power:0, generation:0 }
];
export const emptyBag = (): ResourceBag => ({rock:0,iron:0,ice:0,copper:0,crystal:0,parts:0});
export const SECTORS = [
 {name:'Startsektor', destination:'Asteroidenfeld', distance:100, spawn:1, rare:0.025},
 {name:'Asteroidenfeld', destination:'Verlassenes Wrack', distance:160, spawn:1.3, rare:0.04},
 {name:'Verlassenes Wrack', destination:'Kristallnebel', distance:220, spawn:1.1, rare:0.08},
 {name:'Kristallnebel', destination:'Zielplanet', distance:300, spawn:1.5, rare:0.13},
 {name:'Zielplanet', destination:'Mission erfüllt', distance:0, spawn:0.5, rare:0.1}
];
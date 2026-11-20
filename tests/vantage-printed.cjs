'use strict';
const assert=require('node:assert/strict'),{createGame}=require('../engine/runtime.cjs');
const {cards}=require('../engine/vantage-catalog.js'),{documents,decks}=require('../engine/vantage.cjs');
const factions={'neutral-corp':'Neutral','neutral-runner':'Neutral',anarch:'Anarch',criminal:'Criminal',shaper:'Shaper','haas-bioroid':'Haas-Bioroid',jinteki:'Jinteki',nbn:'NBN','weyland-consortium':'Weyland'};
const g=createGame({vantage:true});try{for(const [id,c]of Object.entries(cards)){
 const expected={title:c.title,cardType:c.type_code,faction:factions[c.faction_code],influence:c.faction_cost,memoryCost:c.memory_cost,strength:c.strength,agendaPoints:c.agenda_points,advancementRequirement:c.advancement_cost,trashCost:c.trash_cost,...(['operation','event'].includes(c.type_code)?{playCost:c.cost}:['program','hardware','resource'].includes(c.type_code)?{installCost:c.cost}:['asset','upgrade','ice'].includes(c.type_code)?{rezCost:c.cost}:{deckSize:c.minimum_deck_size,influenceLimit:c.influence_limit})};
 const actual=g.context.cardSet[id];assert(actual,id);assert.equal(actual.player,c.side_code==='runner'?g.context.runner:g.context.corp,id+' side');for(const [key,value]of Object.entries(expected))if(value!==undefined)assert.equal(actual[key],value,id+' '+key);assert.deepEqual(Array.from(actual.subTypes),c.keywords?.split(' - ')||[],id+' subtypes');
}
const full=decks.filter(d=>d.id.includes('full-vp')),used=new Set(full.flatMap(d=>[d.document.identity,...d.document.cards.map(c=>c.id)]));for(const id of Object.keys(cards))assert(used.has(id),id+' is absent from the benchmark decks');for(const d of full)assert.equal(documents.validate(d.document).valid,true,d.id);
console.log('PASS all 66 Vantage printed values and all-card coverage by seven legal full-set benchmark decks.');
}finally{g.close();}

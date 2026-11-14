'use strict';
const assert=require('node:assert/strict'),data=require('../assets/card-data.json'),{createGame}=require('../engine/runtime.cjs');
const g=createGame({core:true});
try{
 for(let id=35001;id<=35082;id++){
  const card=g.context.cardSet[id],printed=data[id];assert(card&&printed,`Missing ${id}`);
  assert.equal(card.player===g.context.corp?'corp':'runner',printed.side_code,`${id} side`);
  for(const [field,native]of [['type_code','cardType'],['strength','strength'],['memory_cost','memoryCost'],['agenda_points','agendaPoints'],['advancement_cost','advancementRequirement'],['faction_cost','influence']]){
   if(printed[field]==null||printed.type_code==='identity'||field==='faction_cost'&&printed[field]===0&&card[native]===undefined)continue;
   assert.equal(card[native],printed[field],`${id} ${printed.title}: ${field}`);
  }
  const cost={event:'playCost',operation:'playCost',asset:'rezCost',ice:'rezCost',upgrade:'rezCost',hardware:'installCost',resource:'installCost',program:'installCost'}[printed.type_code];
  if(cost&&printed.cost!=null)assert.equal(card[cost],printed.cost,`${id} printed cost`);
 }
 console.log('PASS all 82 Elevation printed values: side, type, costs, influence, memory, strength, agenda points and advancement requirements. Ability semantics require separate tests.');
}finally{g.close();}

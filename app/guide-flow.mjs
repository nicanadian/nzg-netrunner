export const guidePools=['gateway-v1','core-v1','vantage-preview-v1'];
export function poolUrl(pool){return pool==='vantage-preview-v1'?'/?vantage-preview=1':pool==='core-v1'?'/?core-preview=1':'/';}
export function setupUrl({pool,side='runner',runner,corp,tune}){
 const url=new URL(poolUrl(pool),'http://local.invalid');url.searchParams.set('guide-setup','1');url.searchParams.set('guide-side',side);url.searchParams.set('guide-runner',runner);url.searchParams.set('guide-corp',corp);if(tune)url.searchParams.set('guide-tune',tune);return url.pathname+url.search;
}
export function readGuideSetup(search,pool,resolve,validate){
 const q=new URLSearchParams(search);if(q.get('guide-setup')!=='1')return null;
 const side=q.get('guide-side'),runner=q.get('guide-runner'),corp=q.get('guide-corp'),tune=q.get('guide-tune');
 if(!['runner','corp'].includes(side)||tune&&!['runner','corp','basics'].includes(tune))throw Error('This guide setup is invalid. Choose your decks below.');
 for(const [s,id]of Object.entries({runner,corp})){const d=resolve(id);if(!id||!d||d.side!==s||!validate(d))throw Error('A guide deck is unavailable in these card sets. Choose your decks below.');}
 return {pool,side,runner,corp,tune};
}
export function deckDelta(before,after,cards){
 const a=new Map(before.cards.map(c=>[String(c.id),c.count])),b=new Map(after.cards.map(c=>[String(c.id),c.count]));const changes=[...new Set([...a.keys(),...b.keys()])].map(id=>{const n=(b.get(id)||0)-(a.get(id)||0);return n?`${n>0?'+':''}${n} ${cards[id]?.title||id}`:'';}).filter(Boolean);if(before.identity!==after.identity)changes.unshift('Identity changed');return changes.join(' · ');
}
export function dependencyAdvice(deck,cards){
 const present=deck.cards.filter(c=>c.count>0).map(c=>cards[c.id]).filter(Boolean),stealth=present.some(c=>(c.keywords||'').split(' - ').includes('Stealth'));
 if(stealth)return [];return present.filter(c=>/spend credits only from stealth cards/i.test(c.stripped_text||c.text||'')).map(c=>`${c.title}: its stealth-only ability has no Stealth credit source in this list. Ordinary economy cannot pay that cost. Other abilities or zero-strength ice may still make the card useful.`);
}

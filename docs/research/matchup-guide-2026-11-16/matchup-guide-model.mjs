// Presentation model shared by the inline chart and its offline checks.
export function selectedDecks(data,{pool,includeTests=false,runner='all'}){
 return data.decks.filter(d=>d.pool===pool&&(includeTests||d.purpose==='play')&&(d.side==='corp'||runner==='all'||d.id===runner));
}
export function selectedPairs(data,state){
 const ids=new Set(selectedDecks(data,state).map(d=>d.id));
 return data.pairs.filter(p=>p.pool===state.pool&&ids.has(p.runner)&&ids.has(p.corp));
}
export function matchupBand(rate){
 if(rate===null)return 'No completed games';
 if(rate>=.4&&rate<=.6)return 'Close in this sample';
 return rate>.6?'Runner-favored in this sample':'Corp-favored in this sample';
}
export function buildChart(data,state){
 const decks=selectedDecks(data,state),byId=new Map(decks.map(d=>[d.id,d]));
 if(state.runner!=='all'){
  const pairs=selectedPairs(data,state),runner=byId.get(state.runner);
  return {id:'netrunner-matchup-heatmap',title:runner.label+' · Runner win rate',description:'Each bar is an exact Corp deck opponent. The 50% line means equal observed wins. n is completed games.',height:Math.max(300,100+pairs.length*42),spec:{type:'horizontalBar',x:'Runner win rate',y:'Corp deck',xLabel:'Runner win rate',yLabel:'Corp opponent · sample size',xDomain:[0,1],showValues:true,showLegend:false,sortOrder:'original',valueFormat:{style:'percent',maximumFractionDigits:0},referenceLines:[{axis:'x',value:.5,label:'Equal wins'}]},columns:['Corp deck','Runner win rate','Completed games','Runner wins','Corp wins'],rows:pairs.map(p=>[byId.get(p.corp).label+' · n='+p.completed,p.completed?p.runnerWins/p.completed:null,p.completed,p.runnerWins,p.corpWins])};
 }
 const axisLabel=d=>state.pool==='vantage-preview-v1'&&!state.includeTests?d.label.split(' · ')[0]:d.label;
 return {id:'netrunner-matchup-heatmap',title:'Runner win rate by exact deck pairing',description:'Rows are Runner decks; columns are Corp decks. 50% means equal observed wins. This is fixed-policy AI evidence, not human balance.',height:Math.min(700,Math.max(270,170+decks.filter(d=>d.side==='runner').length*38)),
  spec:{type:'heatmap',x:'Corp deck',y:'Runner deck',value:'Runner win rate',xLabel:'Corp deck',yLabel:'Runner deck',xOrder:decks.filter(d=>d.side==='corp').map(axisLabel),yOrder:decks.filter(d=>d.side==='runner').map(axisLabel),colorDomain:[0,1],showValues:true,missingValues:'gap',valueFormat:{style:'percent',maximumFractionDigits:0}},
  columns:['Corp deck','Runner deck','Runner win rate','Completed games','Runner wins','Corp wins'],
  rows:selectedPairs(data,state).map(p=>[axisLabel(byId.get(p.corp)),axisLabel(byId.get(p.runner)),p.completed?p.runnerWins/p.completed:null,p.completed,p.runnerWins,p.corpWins])};
}
export function pairingSuggestions(data,state){
 const pairs=selectedPairs(data,state).filter(p=>p.completed),distance=p=>Math.abs(p.runnerWins/p.completed-.5);
 const close=pairs.filter(p=>distance(p)<=.1+1e-12).sort((a,b)=>distance(a)-distance(b)||b.completed-a.completed||a.runner.localeCompare(b.runner)||a.corp.localeCompare(b.corp)).slice(0,3);
 const corp=pairs.filter(p=>p.runnerWins/p.completed<.4).sort((a,b)=>a.runnerWins/a.completed-b.runnerWins/b.completed||b.completed-a.completed)[0]||null;
 const runner=pairs.filter(p=>p.runnerWins/p.completed>.6).sort((a,b)=>b.runnerWins/b.completed-a.runnerWins/a.completed||b.completed-a.completed)[0]||null;
 return {close,corp,runner};
}

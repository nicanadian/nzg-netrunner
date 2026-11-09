'use strict';
const fs=require('node:fs'),path=require('node:path'),{isDeepStrictEqual}=require('node:util');
const root=path.resolve(__dirname,'../..'),folder=path.join(root,'eval/jinteki-comparison');
const read=name=>JSON.parse(fs.readFileSync(path.join(folder,name),'utf8'));
const local=read('local.json'),reference=read('jinteki.json'),pins=require('./pins.json');
const expectedIds=['overclock-manegarm-credits','overclock-manegarm-clicks','overclock-manegarm-end',
  'whitespace-9','whitespace-10','spin-iced','spin-empty','leech','luminal','seamless-Palisade','seamless-Leech'];
const errors=[];
if(Object.keys(local.errors||{}).length)errors.push('Local scenario execution failed');
if(reference.summary.fail||reference.summary.error||reference.summary.test!==6)errors.push('Jinteki scenario execution failed');
for(const [label,data] of [['local',local],['jinteki',reference]]){
  if(!isDeepStrictEqual(Object.keys(data.scenarios).sort(),[...expectedIds].sort()))errors.push(`${label}: missing or unexpected scenarios`);
}
const cases=expectedIds.map(id=>{
  const a=local.scenarios[id],b=reference.scenarios[id];
  // Jinteki's JSON parser preserves map iteration order differently from JS;
  // deep equality here compares keys and types, never serialized key order.
  return {id,status:a&&b&&isDeepStrictEqual(a,b)?'match':'difference',local:a||null,jinteki:b||null};
});
const differences=cases.filter(c=>c.status==='difference');
const report={checkedAt:new Date().toISOString(),pins,
  scope:'Headless, explicitly constructed positions followed by engine actions. Comparison is limited to the recorded checkpoint fields; no browser playtest, full-game parity or exhaustive rules certification is claimed.',
  summary:{families:6,variants:cases.length,matches:cases.length-differences.length,differences:differences.length,harnessErrors:errors},
  cases,
  findings:differences.length?[{
    case:'seamless-Leech',
    observation:'Local Table places 2 advancement counters on installed Leech. Jinteki rejects Leech and leaves it at 0. Both reject newly installed Urtica and accept older non-advanceable Palisade.',
    cause:'Jinteki game.core.def-helpers/place-advancement-counter explicitly requires (corp? target). Our current rules profile enumerates installed cards on either side.',
    disposition:'Recorded implementation divergence. No game behavior changed to force agreement. The printed card text and CR 1.18.2 support separating counter placement from advancing; this run does not establish an official ruling on Runner-card targets.',
    sources:[`https://github.com/mtgred/netrunner/blob/${pins.jinteki}/src/clj/game/core/def_helpers.clj#L634`,
      `https://github.com/mtgred/netrunner/blob/${pins.jinteki}/src/clj/game/cards/operations.clj#L2858`,
      'https://rules.nullsignal.games/?r=rule_placing_advancement_counter',
      'https://nullsignal.games/players/learn-to-play/learn-to-play-corp/']
  }]:[]};
fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n');
for(const c of cases)console.log(`${c.status==='match'?'MATCH':'DIFFERENCE'} ${c.id}`);
console.log(`${report.summary.matches}/${cases.length} match; ${differences.length} differences; ${errors.length} harness errors`);
// A known discrepancy remains a failed strict comparison, rather than being
// silently blessed as parity. Use the separate harness output to assess setup.
if(differences.length||errors.length)process.exitCode=1;

'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const file=path.join(root,'tmp/jinteki-runtime/upstream/src/clj/game/core/to_string.cljc');
const marker=';; Local frontend fix: normalize serialized Corp card zones.';
function prepare(){
  const original=fs.readFileSync(file,'utf8');
  if(original.includes(marker))return false;
  const hash=crypto.createHash('sha256').update(original).digest('hex');
  if(hash!=='1c8de85ca72942440d1cce6dbee615805bc0f64f13741e78892b0a592652e0a7')
    throw Error('Jinteki card formatter changed; review the local zone-normalization patch before applying it');
  const updated=original
    .replace('    (let [location (cond',`    ${marker}\n    (let [zone (mapv keyword zone)\n          location (cond`)
    .replace('(remove #(= [:onhost] (or (second (:zone %)) (:zone %))) (iterate :host card))',
      '(remove #(= [:onhost] (mapv keyword (:zone %))) (iterate :host card))')
    .replace("          server-name (str/lower-case (zone->name zone'))",
      "          zone' (if (sequential? zone') (mapv keyword zone') (keyword zone'))\n          server-name (str/lower-case (zone->name zone'))");
  if(updated===original||!updated.includes(marker))throw Error('Could not patch Jinteki card formatter');
  fs.writeFileSync(file,updated);return true;
}
if(require.main===module)console.log(prepare()?'Applied serialized-zone formatter fix':'Serialized-zone formatter fix already applied');
module.exports={prepare};

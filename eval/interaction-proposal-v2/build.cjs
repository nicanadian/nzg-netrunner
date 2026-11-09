const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const images=Object.fromEntries(Object.entries({palisade:30072,mayfly:30032,carmen:30015,seamless:30040,telework:30027,ansel:30038})
  .map(([name,n])=>[name,'data:image/jpeg;base64,'+fs.readFileSync(path.join(root,`assets/cards/${n}.jpg`)).toString('base64')]));
const html=fs.readFileSync(path.join(__dirname,'proposal.template.html'),'utf8').replace('/* EMBEDDED_CARD_IMAGES */',`const images=${JSON.stringify(images)};`);
fs.writeFileSync(path.join(root,'eval/interaction-proposal-v2.html'),html);
console.log(`Built standalone proposal: ${Buffer.byteLength(html)} bytes`);

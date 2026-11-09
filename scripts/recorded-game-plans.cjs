'use strict';
// Explicit research completions, not claims about the original hidden shuffle.
const I=(n,s)=>({op:'install',n,s}), P=(n,target)=>({op:'play',n,target}), D=()=>({op:'draw'}), G=()=>({op:'gain'}), A=n=>({op:'advance',n}), S=n=>({op:'score',n}), U=(n,s)=>({op:'use',n,s});
const R=(s,ice=[],access=[],extra={})=>({op:'run',s,ice,access,...extra});
const E=(n,s,ice=[],access=[],extra={})=>({...R(s,ice,access,extra),event:n});
const RT=(s,ice=[],access=[],extra={})=>({...R(s,ice,access,extra),resource:30018});
const X=(n,mode='leave')=>({n,mode});
const B=(ice,breaker,boost=0,subs='all',leech=0)=>({ice,breaker,boost,subs,leech});
const Z=ice=>({ice,rez:true});
const F=ice=>({ice,fire:true});
const k=B(30047,30015,1), pali=B(30072,30006,0), remotePali=B(30072,30006,1);
const rows=a=>a.map((actions,i)=>({id:`${i%2?'R':'C'}${Math.floor(i/2)+1}`,side:i%2?'runner':'corp',actions}));
const neon=rows([
 [I(30071,'New remote'),I(30073,'Remote 0'),I(30042,'Remote 0')],
 [P(30030),I(30032),E(30029,'Remote 0',[{...F(30073),rez:true}],[X(30071,'trash'),X(30042,'trash')],{gate:30042,gateStage:'after-ice',damage:[30032]}),E(30028,'HQ',[],[X(30070,'steal'),X(30040)])],
 [D(),I(30046,'HQ'),G()], [D(),D(),I(30033),U(30033)],
 [D(),I(30047,'R&D'),G()], [D(),D(),D(),P(30020)],
 [P(30075),G(),P(30064)], [P(30030),P(30030),I(30027),R('Archives',[],[],{synthetic:'Fills unobserved fourth click without changing resources/hand'})],
 [D(),I(30073,'Remote 0'),I(30069,'Remote 0')],
 [D(),R('Remote 0',[{...B(30073,30032),rez:true},B(30073,30032)],[X(30069,'steal')],{freeRez:30047}),D(),U(30027)],
 [D(),D(),I(30074,'Remote 0')], [D(),D(),U(30027),P(30020)],
 [P(30064),I(30037,'New remote'),I(30067,'Remote 0')], [P(30021),I(30014),I(30013)],
 [A(30067),A(30067),P(30040,30067),S(30067)],
 [R('Remote 1',[],[X(30037,'trash')]),I(30015),E(30028,'R&D',[k],[X(null),X(null)]),U(30033)],
 [I(30039,'Remote 0'),I(30070,'Remote 0'),A(30070)],
 [E(30012,'Remote 0',[{ice:30039,unrezzed:true},{...F(30074),rez:true}],[]),U(30027),I(30027),U(30027)],
 [A(30070),A(30070),S(30070),P(30075)], [D(),I(30026),D(),U(30027)],
 [D(),D(),I(30045,'Remote 0')], [D(),D(),U(30027),I(30006)],
 [D(),D(),I(30045,'New remote')], [I(30018),RT('Archives'),RT('R&D',[k],[X(null)]),U(30033)],
 [D(),I(30069,'Remote 0'),A(30069)],
 [RT('Archives'),U(30014),R('Remote 0',[{...B(30039,30006,3),rez:true},B(30074,30026),B(30073,30015),B(30073,30015)],[X(30069,'steal')])],
]);
neon[14].preRez=30037;neon[22].discard=30072;

const starter=rows([
 [I(30072,'New remote'),I(30067,'Remote 0'),D()],
 [I(30018),RT('R&D',[],[X(null)]),RT('HQ',[],[X(30069,'steal')],{freeRez:30072}),E(30028,'HQ',[],[X(30039),X(30040)])],
 [I(30072,'R&D'),I(30039,'HQ'),G()],
 [I(30006),RT('Archives'),E(30028,'R&D',[{...pali,rez:true}],[X(30067,'steal'),X(null)]),RT('HQ',[{ice:30039,unrezzed:true}],[X(30037,'trash')])],
 [A(30067),A(30067),P(30040,30067),S(30067)],
 // Fifth Red Team use cannot exist under the written card. Basic run instead;
 // Sure Gamble must precede Mayfly to remain affordable after removing +3.
 [R('R&D',[pali],[X(null)],{synthetic:'Replace impossible fifth Red Team use with basic run'}),P(30030),I(30032),P(30020)],
 [I(30074,'R&D'),I(30073,'HQ'),G()], [D(),D(),D(),I(30026)],
 [D(),D(),G()], [D(),E(30012,'HQ',[{ice:30073,unrezzed:true},{ice:30039,unrezzed:true}],[X(30037,'trash')]),D(),I(30033)],
 [I(30042,'Remote 0'),I(30045,'Remote 0'),{...A(30045),probeSeamlessNew:true}],
 [D(),E(30029,'Remote 0',[remotePali],[X(30045)],{gate:30042,gateStage:'approach',damage:[30014,30006],fatal:true})],
]);

const booster=rows([
 [P(30075),G(),P(30064)],
 [I(30018),E(30028,'HQ',[],[X(30046),X(30037)]),RT('R&D',[],[X(30071,'trash')]),I(30033)],
 [I(30072,'New remote'),I(30067,'Remote 0'),A(30067)],
 [RT('R&D',[],[X(30045,'trash')]),R('R&D',[],[X(null)]),RT('HQ',[],[X(30040)]),U(30033)],
 [A(30067),A(30067),A(30067),S(30067)],
 [P(30030),I(30034),D(),E(30028,'HQ',[],[X(30047),X(30037,'trash')])],
 [I(30047,'R&D'),I(30046,'HQ'),I(30073,'Remote 0')],
 [P(30002),RT('Archives'),I(30008),G()],
 [I(30070,'Remote 0'),D(),A(30070)],
 [E(30012,'Remote 0',[{...F(30073),rez:true},{...F(30072),rez:true}],[],{damage:[30029]}),D(),I(30022),I(30032)],
 [P(30040,30070),S(30070),I(30037,'Remote 0'),G()], [D(),I(30013),U(30033),G()],
 [I(30072,'HQ'),I(30074,'R&D'),G()], [D(),I(30026),G(),G()],
 [D(),I(30054,'R&D'),P(30075)], [G(),G(),G(),E(30012,'HQ',[{ice:30072,unrezzed:true},{ice:30046,unrezzed:true}],[X(30047),X(30056)])],
 [D(),I(30068,'Remote 0'),I(30039,'Remote 0')], [D(),I(30027),R('Archives'),I(30015)],
 [P(30064),A(30068),D()], [U(30027),R('Remote 0',[{ice:30039,rez:true,clickBreak:0,fire:true}],[]),U(30033)],
 [P(30040,30068),A(30068),S(30068),{op:'trash-resource',n:30027}],
 [{op:'remove-tag'},E(30029,'HQ',[{ice:30072,unrezzed:true},{ice:30046,unrezzed:true}],[X(30056),X(30047)]),G(),P(30021)],
 [I(30070,'Remote 0'),I(30047,'New remote'),I(30071,'Remote 1')],
 [ {...I(30006),trashProgram:30032},G(),R('Remote 0',[B(30039,30006,0,'all',3),B(30073,30015,0,[0]),remotePali],[X(30070,'steal')]),G()],
 [U(30071),D(),U(30071)], [I(30022),D(),G(),P(30020)],
 [U(30071),U(30071),U(30071)], [U(30033),P(30002),I(30032),G()],
 [P(30075),I(30042,'Remote 0'),I(30045,'Remote 1')],
 [G(),G(),G(),R('HQ',[{...pali,rez:true},{...B(30046,30026,1),rez:true}],[X(30056),X(30065)])],
 [I(30069,'Remote 0'),A(30069),A(30069)],
 [R('Remote 1',[{...k,rez:true}],[X(30045)],{damage:[30028,30008]}),G(),G(),G()],
 [A(30069),A(30069),A(30069),S(30069)],
]);
booster[12].preRez=30037;booster[24].preRez=30071;booster[21].discard=30021;booster[27].discard=30011;
module.exports={plans:{'neon-starter':neon,'lt-starter':starter,'lt-booster':booster}};

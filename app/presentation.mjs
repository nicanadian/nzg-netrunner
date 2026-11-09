// Public-state copy and hierarchy shared by the table and focused regressions.
export const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;
export function displayText(text) {
  return String(text ?? '').replace(/Remote (\d+)/g, (_, n) => `Remote ${Number(n) + 1}`)
    .replace(/ at position (\d+)/g, (_, n) => ` · ice ${Number(n) + 1}`);
}
export function phaseHeading(state) {
  const phase=state.phase;
  if (state.terminal) return state.terminal.winner === state.side ? 'You win.' : 'Game over.';
  if (state.viewed) return state.viewed.kind==='expose' ? 'Exposed card' : 'Revealed card';
  if (phase.guide?.kind==='anoetic-trash') return `Trash ${phase.guide.remaining===2?'first':'second'} HQ card`;
  if (phase.identifier.includes('Mulligan')) return 'Your opening hand';
  if (phase.title === 'Trash Before Install') return 'Confirm installation';
  if (state.decision?.commands.some(c=>c.options.some(o=>o.subroutine))) return 'Choose a subroutine';
  if (state.access) return 'Access a card';
  if (phase.identifier === 'Scored') return 'Resolve score effects';
  if (/Action Phase/.test(phase.title)) return 'Choose an action';
  if (/Turn Begins/.test(phase.title)) return 'Turn begins';
  if (/Discard Phase/.test(phase.title)) return 'Discard to hand limit';
  return displayText(phase.title.replace(/^Run:\s*/,''));
}
export function priorityLabel(state, busy) {
  if (state.terminal) return 'GAME COMPLETE';
  if (state.viewed) return state.viewed.kind==='expose' ? 'REVIEW THE EXPOSED CARD' : 'REVIEW THE REVEALED CARD';
  if (state.phase.identifier.includes('Mulligan')) return 'OPENING HAND';
  const owner = state.playerTurn === state.side ? 'YOUR TURN' : 'OPPONENT’S TURN';
  return `${owner} · ${busy ? 'RESOLVING' : 'YOUR DECISION'}`;
}
export function responseLabel(state,busy=false) {
  if(state.terminal)return 'Game complete';
  const actor=state.active==='corp'?'Corp':'Runner';
  return `${busy ? 'Resolving' : 'Priority'}: ${actor}${state.active===state.side?' · you':' · opponent'}`;
}
export function receiptLabel(group, option, state) {
  if (state.phase.source?.includes('Salonga') && option?.multi) return 'Tāo Salonga · swap ice';
  if (option?.subroutine) return `Break subroutine ${option.subroutine}${state.phase.source ? ' · ' + state.phase.source : ''}`;
  if (state.phase.identifier.includes('Mulligan')) return group?.label || 'Opening hand';
  const values=[group?.label, option?.label].filter((value,i,list)=>value&&value!=='Continue'&&list.indexOf(value)===i);
  return displayText(values.join(' · ') || 'Resource changes');
}
export function orderedCommands(commands, state) {
  const primary = state.run?.encountering && commands.some(c=>c.command==='trigger') ? 'trigger'
    : ['score','steal','n','continue'].find(key=>commands.some(c=>c.command===key));
  // Bring the score/steal decision first without moving ordinary pass windows.
  return {primary, commands: ['score','steal'].includes(primary)
    ? [...commands].sort((a,b)=>Number(b.command===primary)-Number(a.command===primary)) : commands};
}
export function restrictionText(restriction) {
  const blocked=restriction.steal && restriction.trash ? 'steal agendas or trash Corp cards'
    : restriction.steal ? 'steal agendas' : 'trash Corp cards';
  return `${restriction.source}: the Runner cannot ${blocked} during this run.`;
}

// One explicit next step, backed by a single native non-target choice.
export function continuationModel(state) {
  if (!state?.decision || state.terminal) return null;
  const commands=state.decision.commands;
  if(commands.some(c=>['score','steal'].includes(c.command)))return null;
  const group=commands.find(c=>['n','continue'].includes(c.command)&&c.options.length===1&&
    !c.options[0].card&&!c.options[0].multi&&!c.options[0].subroutine);
  if(!group)return null;
  const base={command:group.command,index:group.options[0].index,cost:group.options[0].cost || group.cost};
  if(state.phase.title==='Trash Before Install')return {...base,kind:'install',label:'Confirm installation',
    detail:'Finish installing and pay the cost shown below. Trashing existing cards first is optional.'};
  if(state.phase.guide?.kind==='pantograph-install')return {...base,kind:'pass',label:'Continue without installing',detail:'Keep the gained credit and skip the optional install.'};
  if(state.viewed)return {...base,kind:'continue',label:'Done reading · continue',detail:'Close this viewing step and resume the game.'};
  if(state.phase.identifier==='Run Accessing')return {...base,kind:'continue',label:'Finish accessing this card',detail:'Resolve the next access or finish the breach.'};
  if(group.command==='continue'&&state.phase.source)return {...base,kind:'continue',label:`Finish ${state.phase.source} ability`,detail:'Complete this ability’s remaining step; any earlier payments stay spent.'};
  if(/\*$/.test(state.phase.identifier))return {...base,kind:'pass',label:state.playerTurn===state.side?(state[state.side]?.clicks>0?'Continue to next action':'Continue · finish action phase'):'Continue · allow the opponent’s next action',detail:'Use an optional ability first, or pass this response window. The next action starts after responses finish.'};
  if(['Corp 2.2','Runner 1.3'].includes(state.phase.identifier)&&/Action Phase/.test(state.phase.title))return {...base,kind:'continue',label:'End action phase',detail:'Finish taking actions and proceed to the remaining turn steps.'};
  if(state.run)return null; // The run footer supplies its context-specific step.
  return {...base,kind:'pass',label:group.label==='Continue'?'Continue · finish this window':group.label,
    detail:'Use any optional ability first, or continue. The game is waiting for your choice.'};
}

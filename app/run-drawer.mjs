import {displayText} from './presentation.mjs';

// Presentation only: retain the engine's command and option indices. Never
// manufacture a pass/jack-out choice or inspect information outside the DTO.
export function runDrawerModel(state, busy = false) {
  if (!state?.run || state.terminal) return null;
  const {run, phase} = state;
  const stage = state.access ? 'Access' : /Run 6\./.test(phase.identifier) ? 'Run ends'
    : run.encountering ? 'Encounter' : run.movement ? 'Movement'
    : phase.identifier === 'Run 1.5' ? 'Initiation' : run.ice >= 0 ? 'Approach' : 'Breach';
  const card = state.viewed?.card || state.access || run.card;
  const subroutines = card && !card.hidden ? card.subroutines || [] : [];
  const remaining = subroutines.filter(s => !s.broken && !s.fired).length;
  const commands = busy ? [] : state.decision?.commands || [];
  const controls = commands.filter(c => ['n','jack'].includes(c.command) && c.options.length === 1 &&
    !c.options[0].multi && !c.options[0].card && !c.options[0].subroutine).map(c => {
    let label = c.label, detail = 'Finish this timing window and continue the run.';
    if (c.command === 'jack') { label = 'Jack out'; detail = 'End this run without accessing the server.'; }
    else if (phase.title === 'Trash Before Install') {label='Confirm installation';detail='Finish installing and pay the cost shown. Trashing other cards first is optional.';}
    else if (phase.identifier === 'Run Accessing') detail = 'Finish resolving this card’s access.';
    else if (['Run 1.5','Run 2.1','Run 3.1','Run 4.5','Run 4.6.2'].includes(phase.identifier)) {
      label = phase.identifier==='Run 3.1' ? (remaining ? 'Continue · resolve unbroken subroutines' : 'Continue · all subroutines broken') : 'Continue · allow responses';
      detail = phase.identifier === 'Run 3.1'
        ? (remaining ? 'If both players pass, unbroken subroutines resolve in order.' : 'Pass this window. Pending responses finish before you move past this ice.')
        : 'Allow responses. The run advances when both players pass.';
    } else if (phase.identifier === 'Run 4.3') {label='Continue the run';detail='Move to the next run window, or jack out to end the run.';}
    return {command:c.command,index:c.options[0].index,label,detail,cost:c.cost};
  });
  const cancels = commands.filter(c => c.cancel).map(c => ({command:c.command,label:'Cancel selection'}));
  return {server:displayText(run.server),stage,card,remaining,
    contextLabel:state.access ? 'Accessed card' : state.viewed ? 'Revealed card' : 'Current ice',
    cardLabel:card ? card.hidden ? 'Unrevealed card' : card.title : 'Approaching the server',
    controls,cancels,
    waiting:busy ? 'Watching recorded actions · your next decision will appear here.'
      : phase.guide?.kind === 'credit-payment' ? `Payment in progress · ${phase.guide.remaining} credits left to pay.`
      : controls.length || cancels.length ? '' : 'Choose an option above to resolve this decision.',
  };
}

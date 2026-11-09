const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function virusStatus(card) {
  const hosts = (card.hosted || []).filter(c => !c.hidden && c.subTypes?.includes('Virus'));
  const effects = card.hidden ? [] : card.strengthEffects || [];
  return {hosts, effects,
    description: [...hosts.map(c => `Hosts ${c.title} with ${c.counters?.virus || 0} virus counter${c.counters?.virus === 1 ? '' : 's'} on the program`),
      ...effects.map(e => `${e.source}: ${e.amount} strength for ${e.duration}`)].join('. ')};
}
export function virusMarkup(card) {
  const {hosts, effects, description} = virusStatus(card);
  return `${hosts.length ? `<span class="virus-host-badge" title="${escape(description)}"><span>☣ HOSTED VIRUS</span><b>${hosts.map(c => `${escape(c.title)} · ${c.counters?.virus || 0}`).join(' / ')}</b></span>` : ''}${effects.length ? `<span class="virus-effect-badge" title="${escape(description)}">☣ ${escape(effects.map(e => `${e.source} ${e.amount} STR`).join(' · '))}<small>This encounter</small></span>` : ''}`;
}

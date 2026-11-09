// Both the archived and current UI consume exactly the same public engine snapshots.
export async function mountReference(renderPosition) {
  const params = new URLSearchParams(location.search);
  if (params.get('reference') !== 'example') return;
  const response = await fetch('/eval/reference-game.json');
  if (!response.ok) throw Error('Reference fixture unavailable');
  const fixture = await response.json();
  document.body.classList.add('reference-eval');
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = '/eval/reference-viewer.css'; document.head.append(css);
  const panel = document.createElement('section');
  panel.className = 'reference-controls'; panel.setAttribute('aria-label', 'Recorded example controls');
  panel.innerHTML = `<div class="reference-heading">RECORDED EXAMPLE <a href="/eval/reference.html">Evaluation ↗</a></div><div class="reference-navigation"><button aria-label="Previous example position">←</button><select aria-label="Example position"></select><button aria-label="Next example position">→</button></div><div class="reference-links"><a target="_blank" rel="noreferrer">Video moment ↗</a><button>Adaptation notes</button><a href="/">Play live ↗</a></div>`;
  document.querySelector('.decision-rail').prepend(panel);
  document.querySelector('#menu-button').hidden = true;
  const select = panel.querySelector('select');
  fixture.checkpoints.forEach((cp, i) => select.add(new Option(`${i + 1}. ${cp.title}`, cp.id)));
  const buttons = panel.querySelectorAll('button');
  const source = panel.querySelector('.reference-links a');
  function show(index) {
    const cp = fixture.checkpoints[index];
    select.value = cp.id;
    panel.dataset.checkpoint = cp.id;
    panel.dataset.traceIndex = cp.traceIndex;
    buttons[0].disabled = index === 0;
    buttons[1].disabled = index === fixture.checkpoints.length - 1;
    source.href = fixture.source.url + '&t=' + cp.videoTime;
    source.textContent = `Video ${Math.floor(cp.videoTime / 60)}:${String(cp.videoTime % 60).padStart(2, '0')} ↗`;
    const url = new URL(location.href); url.searchParams.set('step', cp.id); history.replaceState(null, '', url);
    renderPosition(structuredClone(cp.state));
    // This viewer is deliberately read-only: actions show the legal choices at this position.
    document.querySelectorAll('.player-name small').forEach(el => el.textContent = 'RECORDED PLAYER');
    document.querySelector('#session-label').textContent = 'EXAMPLE GAME · GATEWAY ADAPTATION';
    document.querySelectorAll('.mat').forEach(el => el.scrollTop = 0);
  }
  function current() { return fixture.checkpoints.findIndex(cp => cp.id === select.value); }
  buttons[0].onclick = () => show(current() - 1);
  buttons[1].onclick = () => show(current() + 1);
  select.onchange = () => show(current());
  buttons[2].onclick = () => {
    const dialog = document.createElement('dialog'); dialog.className = 'panel-dialog reference-notes';
    const close = document.createElement('button'); close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', 'Close adaptation notes'); close.onclick = () => dialog.close(); dialog.append(close);
    const title = document.createElement('h2'); title.textContent = 'A rules-valid adaptation'; dialog.append(title);
    for (const text of [fixture.checkpoints[current()].notes, ...fixture.adaptations]) { const p = document.createElement('p'); p.textContent = text; dialog.append(p); }
    dialog.addEventListener('close', () => dialog.remove()); document.body.append(dialog); dialog.showModal();
  };
  const initial = fixture.checkpoints.findIndex(cp => cp.id === params.get('step'));
  show(initial < 0 ? 0 : initial);
}

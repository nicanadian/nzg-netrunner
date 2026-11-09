const table = document.querySelector('#table');
const inspector = document.querySelector('#inspector');
const runButton = document.querySelector('#run-button');
const cards = {
  '30010': ['Zahya Sadeghi', 'Identity · Criminal', 'Once per turn, when a run on HQ or R&D ends, you may gain credits for the cards accessed during that run.'],
  '30035': ['Precision Design', 'Identity · Haas-Bioroid', 'A corporation built around efficient, precise development.'],
  '30038': ['Ansel 1.0', 'Ice · Sentry · Bioroid · Strength 4', 'A bioroid with three subroutines. The Runner can spend clicks to break its subroutines.'],
  '30005': ['Buzzsaw', 'Program · Icebreaker · Decoder', 'Break code gate subroutines and increase strength. Buzzsaw cannot break Ansel’s sentry subroutines.'],
  '30030': ['Sure Gamble', 'Event · Cost 5', 'Gain 9 credits.'],
  '30071': ['Regolith Mining License', 'Asset · Cost 2', 'A limited supply of credits, mined one click at a time.'],
  '30002': ['Wildcat Strike', 'Event · Cost 2', 'The Corp chooses whether you gain credits or draw cards.'],
  '30004': ['Botulus', 'Program · Trojan · Virus', 'Install on a piece of ice. Spend hosted virus counters to break its subroutines.'],
};
document.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', event => {
  event.stopPropagation();
  const code = button.dataset.card;
  const [title, type, copy] = cards[code];
  document.querySelector('#inspect-image').src = `assets/${code}.jpg`;
  document.querySelector('#inspect-image').alt = title;
  document.querySelector('#inspect-title').textContent = title;
  document.querySelector('#inspect-type').textContent = type;
  document.querySelector('#inspect-copy').textContent = copy;
  inspector.showModal();
}));
document.querySelector('.close').addEventListener('click', () => inspector.close());
inspector.addEventListener('click', event => { if (event.target === inspector) inspector.close(); });
for (const id of ['angled', 'overhead']) document.querySelector(`#${id}`).addEventListener('click', () => {
  table.classList.toggle('overhead', id === 'overhead');
  document.querySelector('#angled').setAttribute('aria-pressed', String(id === 'angled'));
  document.querySelector('#overhead').setAttribute('aria-pressed', String(id === 'overhead'));
});
let target = 'R&D';
let step = 0;
function resetRun() {
  step = 0;
  table.classList.remove('running', 'encounter');
  document.querySelector('#callout-title').textContent = 'Make a run';
  document.querySelector('#callout-text').textContent = 'Spend a click to approach a server. The Corp can rez ice to protect its secrets.';
  runButton.innerHTML = 'JACK IN <span>↗</span>';
  document.querySelectorAll('.run-track span').forEach((el, i) => el.classList.toggle('active', i === 0));
}
function selectTarget(name) {
  target = name;
  resetRun();
  document.querySelectorAll('[data-target]').forEach(b => b.classList.toggle('active', b.dataset.target === target));
  document.querySelectorAll('[data-server]').forEach(b => b.classList.toggle('selected', b.dataset.server === target));
  document.querySelector('#target-name').textContent = target;
  document.querySelector('#target-description').textContent = target === 'R&D' ? '1 piece of ice · central server' : target === 'Remote' ? 'Unrezzed card · remote server' : 'No ice · central server';
  document.querySelector('#run-path').style.left = ({Archives:18, 'R&D':40, HQ:62, Remote:84})[target] + '%';
}
document.querySelectorAll('[data-target]').forEach(b => b.addEventListener('click', () => selectTarget(b.dataset.target)));
document.querySelectorAll('[data-server]').forEach(b => b.addEventListener('click', () => selectTarget(b.dataset.server)));
function log(message) {
  const item = document.createElement('li');
  const time = document.createElement('span');
  time.textContent = 'DEMO';
  item.append(time, document.createTextNode(message));
  const list = document.querySelector('#activity-log');
  list.prepend(item);
  while (list.children.length > 3) list.lastElementChild.remove();
}
runButton.addEventListener('click', () => {
  step++;
  if (step === 4) { resetRun(); return; }
  table.classList.add('running');
  table.classList.toggle('encounter', step === 2 && target === 'R&D');
  const titles = [`Approaching ${target}`, target === 'R&D' ? 'Ansel 1.0 rezzes.' : 'An open connection.', `Breach ${target}`];
  const copy = ['The run begins. The camera stays grounded while a light traces your route through the server.', target === 'R&D' ? 'Buzzsaw is a decoder: it cannot break this sentry. This visual demo previews the next shot; the game engine will enforce resolution.' : 'There is no protecting ice in this staged scene. Continue toward the server.', 'The target comes into focus. A real match would now resolve access choices and card effects.'];
  document.querySelector('#callout-title').textContent = titles[step - 1];
  document.querySelector('#callout-text').textContent = copy[step - 1];
  runButton.innerHTML = [null,'PREVIEW ENCOUNTER <span>→</span>','PREVIEW BREACH <span>→</span>','RESET PREVIEW <span>↻</span>'][step];
  document.querySelectorAll('.run-track span').forEach((el, i) => el.classList.toggle('active', i === step - 1));
  log(titles[step - 1]);
});

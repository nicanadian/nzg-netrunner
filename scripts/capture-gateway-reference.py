import re,json,html,unicodedata
from urllib.request import urlopen
from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=urlopen('https://nullsignal.games/players/getting-started-sample-decklists/').read().decode()
data=json.loads((root/'assets/card-data.json').read_text())
def norm(s):return ''.join(c for c in unicodedata.normalize('NFKD',html.unescape(s)).lower() if c.isalnum())
lookup={norm(c['title']):int(n) for n,c in data.items()}
head=list(re.finditer(r'<span class="kt-blocks-accordion-title">(.*?)</span>',s,re.S))[1:9]
ids=[('loup-v1',30001),('zahya-v1',30010),('tao-v1',30019),('precision-design-v1',30035),('restoring-humanity-v1',30043),('reality-plus-v1',30051),('built-to-last-v2',30059)]
decks=[]
for i,(local,identity) in enumerate(ids):
 block=s[head[i].end():head[i+1].start()]
 text=html.unescape(re.sub('<[^>]*>','\n',block))
 cards=[]
 for q,title in re.findall(r'^\s*(\d+)x\s+([^\n●]+)',text,re.M):cards.append([lookup[norm(title)],int(q)])
 size=sum(q for n,q in cards);assert size==(40 if i<3 else 44),(local,size)
 influence=sum((0 if data[str(n)]['faction_code']==data[str(identity)]['faction_code'] else data[str(n)].get('faction_cost',0))*q for n,q in cards)
 assert influence<=15
 points=sum(data[str(n)].get('agenda_points',0)*q for n,q in cards)
 if i>=3:assert points==18
 decks.append(dict(id='nsg-'+local,localId=local,identity=identity,side='runner' if i<3 else 'corp',name=html.unescape(head[i].group(1)),cards=cards,size=size,influence=influence,agendaPoints=points,sourceDeckUrl=re.search(r'href="([^"]*netrunnerdb.com/[^"]+)"',block).group(1)))
(root/'eval/deck-benchmark/references.json').write_text(json.dumps(dict(source='https://nullsignal.games/players/getting-started-sample-decklists/',captured='2026-11-07',author='Grey “CritHitD20” Tongue',decks=decks),indent=2)+'\n')
print([(d['name'],d['size'],d['influence']) for d in decks])

"""Regression test for 100%-clean block gifts and delayed-retention progress."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':950})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('speechSynthesis.speak=()=>{}')
 page.goto('http://127.0.0.1:3000')
 page.evaluate('''localStorage.setItem('lara-woordentuin-v1',JSON.stringify({version:1,lists:[{id:'l',name:'Testwoorden',date:'',active:true,words:Array.from({length:10},(_,i)=>({id:'w'+i,en:'word'+i,nl:'betekenis'+i,alts:[],enAlts:[]}))}],progress:{},rewards:['2026-10-20']}));''')
 page.reload();page.clock.install()
 def storage(): return page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1"))')
 def word(fail=False):
  en=page.locator('.word-pair .word').nth(0).inner_text();nl=page.locator('.word-pair .word').nth(1).inner_text()
  page.locator('#listen').click();page.locator('#learned').click()
  for el in page.locator('[data-choice]').all():
   if el.evaluate('(el)=>el.childNodes[1].textContent')==nl:el.click();break
  page.clock.run_for(500);page.locator('#to-type').click()
  page.locator('#answer').fill('fout' if fail else en);page.locator('#answer').press('Enter')
  page.clock.run_for(500);page.locator('#next').click()
 page.get_by_role('button',name='Spelen',exact=False).click()
 for i in range(10):word(fail=i==0)
 assert storage()['studio']['awards']==[]
 page.locator('#review').click();word(fail=True)
 assert storage()['studio']['awards']==[]
 assert page.locator('#review').count()==1
 page.locator('#review').click();word()
 assert storage()['studio']['awards'][0]['name']=='Poeks koptelefoon'
 assert page.locator('.gift-card').count()==1
 page.get_by_role('button',name='Muziekstudio',exact=True).click()
 assert 'Poeks koptelefoon' in page.locator('main').inner_text()
 page.screenshot(path='/tmp/poek-studio-new.png',full_page=True)
 page.reload()
 assert len(storage()['studio']['awards'])==1
 assert storage()['rewards']==['2026-10-20'] or '2026-10-20' in storage()['rewards']
 page.get_by_role('button',name='Mijn voortgang',exact=True).click()
 assert page.get_by_text('Word0',exact=True).count()==0
 assert '6 november' in page.locator('main').inner_text().lower()
 assert page.locator('#self-check').count()==1
 assert len(storage()['practice']['w0']['cleanDays'])==1
 assert len(storage()['practice']['w0']['recallDays'])==0
 # Test retrieval on three distinct following days without showing English examples first.
 for day in range(3):
  page.clock.fast_forward(86400000)
  page.locator('#self-check').click()
  for i in range(10):
   nl=page.locator('.word').inner_text();en='word'+nl.removeprefix('betekenis')
   assert page.get_by_text(en,exact=True).count()==0
   page.locator('#answer').fill(en);page.locator('#answer').press('Enter')
   page.clock.run_for(500);page.locator('#self-next').click()
  page.get_by_role('button',name='Mijn voortgang',exact=True).last.click()
 assert all(len(v['recallDays'])==3 for v in storage()['practice'].values())
 assert page.locator('tbody tr').evaluate_all('(rows)=>rows.every(r=>r.cells[4].textContent.startsWith("Zelf onthouden"))')
 page.screenshot(path='/tmp/poek-progress-new.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert not errors,errors
 print('PASS: repeated failures block gifts; clean retry unlocks one gift; studio/reload persistence; existing data; separate practice days; three delayed recall days; no visible English answers in selfcheck; mobile progress')
 b.close()

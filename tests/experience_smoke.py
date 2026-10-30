"""Voice completion, spelling comparison, punctuation, celebrations, and wearable gifts."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':1000})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''const OriginalAudio=window.AudioContext;window.AudioContext=class extends OriginalAudio{constructor(...a){super(...a);window.applauseStarts=(window.applauseStarts||0)+1;}};window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};speechSynthesis.getVoices=()=>[{name:'Daniel',lang:'en-GB',voiceURI:'d'},{name:'Flo',lang:'en-GB',voiceURI:'f'}];speechSynthesis.speak=u=>{window.lastSpoken=u;u.onstart?.();window.finishAudio=()=>u.onend?.();};''')
 page.goto('http://127.0.0.1:3000')
 page.evaluate('''localStorage.setItem('lara-woordentuin-v1',JSON.stringify({version:1,lists:[{id:'l',name:'Zinnetje',date:'',active:true,words:[{id:'sentence',en:'What does ... look like?',nl:'Hoe ziet ... eruit?',alts:[],enAlts:[]}]}],progress:{},rewards:[],studio:{awards:[{key:'legacy',day:'2026-10-29',icon:'🎧',name:'Poeks koptelefoon',wordIds:['old'],at:1}]}}));''')
 page.reload();page.clock.install()
 page.get_by_role('button',name='Spelen',exact=False).click()
 assert page.locator('#learned').is_disabled();assert page.locator('#audio-skip').is_hidden()
 page.locator('#listen').click();page.clock.run_for(200)
 assert page.locator('#learned').is_disabled()
 assert page.evaluate('lastSpoken.voice.name')=='Flo'
 page.locator('#learned').dispatch_event('click')
 assert page.locator('.word-pair').count()==1
 page.evaluate('finishAudio()');assert page.locator('#learned').is_enabled()
 page.locator('#learned').click()
 for option in page.locator('[data-choice]').all():
  if option.evaluate('(e)=>e.childNodes[1].textContent')=='Hoe ziet ... eruit?':option.click();break
 assert page.locator('.confetti-burst').count()==1
 assert page.evaluate('window.applauseStarts')>=1
 applause_before=page.evaluate('window.applauseStarts')
 page.locator('#effects-toggle').click()
 assert not page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1")).effects.sound')
 page.clock.run_for(500);page.locator('#to-type').click()
 assert 'puntjes' in page.locator('.phrase-tip').inner_text()
 page.locator('#answer').fill('What does .. lok like?');page.locator('#answer').press('Enter')
 assert page.locator('#your-answer').inner_text()=='What does .. lok like?'
 assert page.locator('#expected-answer').inner_text()=='What does ... look like?'
 assert page.locator('#expected-answer mark').count()>0
 page.screenshot(path='/tmp/poek-spelling-new.png',full_page=True)
 page.clock.run_for(500);page.locator('#next').click();page.locator('#review').click()
 page.locator('#listen').click();page.evaluate('finishAudio()');page.locator('#learned').click()
 for option in page.locator('[data-choice]').all():
  if option.evaluate('(e)=>e.childNodes[1].textContent')=='Hoe ziet ... eruit?':option.click();break
 page.clock.run_for(500);page.locator('#to-type').click()
 page.locator('#answer').fill('What does .. look like');page.locator('#answer').press('Enter')
 assert 'Goed getypt' in page.locator('main').inner_text()
 assert page.evaluate('window.applauseStarts')==applause_before
 page.clock.run_for(500);page.locator('#next').click()
 assert page.locator('.gift-box').count()==1
 page.locator('[data-open]').click()
 assert page.locator('.gift-preview .fancy-poek').count()==1
 assert page.locator('.gift-preview .collectible-art').count()==1
 assert page.locator('.confetti-burst').count()==1
 page.get_by_role('button',name='Muziekstudio',exact=True).click()
 assert page.locator('.collection-card').count()==2
 page.locator('[data-open]').click() # opening the legacy headphones is preserved and upgrades the look
 assert page.locator('.stage-pet .fancy-poek').count()==1
 assert page.locator('.stage-pet rect[x="49"]').count()==1
 assert page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1")).studio.equipped')=='legacy'
 assert page.locator('.collection-card.equipped').count()==1
 assert '🎧' not in page.locator('main').inner_text()
 page.screenshot(path='/tmp/poek-fancy-studio.png',full_page=True)
 page.reload()
 page.get_by_role('button',name='Muziekstudio',exact=True).click()
 assert page.locator('.stage-pet rect[x="49"]').count()==1
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path='/tmp/poek-fancy-mobile.png',full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.get_by_role('button',name='Voor ouders',exact=True).click()
 assert page.locator('#voice-select option').count()==3
 page.locator('#voice-select').select_option('d');page.locator('#voice-preview').click()
 assert page.evaluate('lastSpoken.voice.name')=='Daniel'
 page.locator('#voice-pitch').evaluate("e=>e.value='1.5'");page.locator('#voice-pitch').dispatch_event('change')
 assert page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1")).voice.pitch')==1.5
 assert not errors,errors
 print('PASS: cannot skip active audio; selected light voice; exact typed answer + highlighted correction; two-dot phrase accepted; confetti + mute; gift unboxing; legacy headphone worn by Poekie; outfit persistence; mobile studio; parent voice choice')
 b.close()

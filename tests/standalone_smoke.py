"""Audio must complete; diagnosed failures permit only a confirmed adult bypass."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page()
 page.add_init_script("window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};speechSynthesis.getVoices=()=>[{name:'Flo',lang:'en-GB',voiceURI:'flo',localService:true}];speechSynthesis.speak=u=>{window.lastSpoken=u;if(window.audioMode==='stall')return;if(window.audioMode==='error'){u.onerror?.();return;}u.onstart?.();setTimeout(()=>u.onend?.(),400);};")
 page.goto('http://127.0.0.1:3000/lara.html');page.clock.install()
 page.get_by_role('button',name='Spelen',exact=False).click()
 assert page.locator('#audio-skip').is_hidden()
 page.locator('#listen').click();page.clock.run_for(100)
 assert page.locator('#learned').is_disabled()
 page.clock.run_for(500)
 assert page.locator('#learned').is_enabled()
 assert page.evaluate('lastSpoken.pitch')==1.3
 assert page.evaluate('lastSpoken.voice.name')=='Flo'
 page.locator('#learned').click();assert page.locator('[data-choice]').count()==4
 page.get_by_role('button',name='De club',exact=True).click()
 page.get_by_role('button',name='Spelen',exact=False).click()
 page.evaluate("window.audioMode='stall'")
 page.locator('#listen').click();page.clock.run_for(26000)
 assert page.locator('#learned').is_disabled()
 assert page.locator('#audio-skip').is_visible()
 page.once('dialog',lambda d:d.dismiss());page.locator('#audio-skip').click()
 assert page.locator('.word-pair').count()==1
 page.once('dialog',lambda d:d.accept());page.locator('#audio-skip').click()
 assert page.locator('[data-choice]').count()==4
 page.get_by_role('button',name='De club',exact=True).click()
 page.evaluate("Object.defineProperty(window,'speechSynthesis',{value:undefined})")
 page.get_by_role('button',name='Spelen',exact=False).click()
 page.locator('#listen').click();assert page.locator('#learned').is_disabled()
 page.once('dialog',lambda d:d.accept());page.locator('#audio-skip').click()
 assert page.locator('[data-choice]').count()==4
 print('PASS: full-listen gate, light voice/pitch, no immediate skip, stalled/missing audio, confirmed adult bypass')
 b.close()

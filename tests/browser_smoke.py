"""Requires running npm start, Python Playwright and Chromium."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script('''
      Object.defineProperty(crypto,'randomUUID',{value:undefined});
      window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};speechSynthesis.getVoices=()=>[{name:'Flo',lang:'en-GB',voiceURI:'flo',localService:true}];speechSynthesis.speak=u=>{window.lastSpoken=u;if(window.audioMode==='stall')return;if(window.audioMode==='error'){u.onerror?.();return;}u.onstart?.();setTimeout(()=>u.onend?.(),400);};
      window.micRequests=0;
      if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>{window.micRequests++;throw Error('No microphone');};
    ''')
    page.goto('http://127.0.0.1:3000')
    page.evaluate('''(()=>{const words=Array.from({length:13},(_,i)=>({id:'w'+i,en:'word'+i,nl:'betekenis'+i,alts:[],enAlts:[]}));localStorage.setItem('lara-woordentuin-v1',JSON.stringify({version:1,lists:[{id:'on',name:'School',date:'',active:true,words:words.slice(0,10)},{id:'off',name:'Voorheen uitgeschakeld',date:'',active:false,words:words.slice(10)}],progress:{'old:listen':{days:['2026-01-01'],sessions:['old'],attempts:1,helped:0,wrong:0,due:1}},rewards:[],music:false}));})();''')
    page.reload()
    page.clock.install()
    page.get_by_role('button',name='Spelen',exact=False).click()
    main_seen=[];review_seen=[]
    def do_word(wrong_choice=False,wrong_type=False,skip_audio=False):
        en=page.locator('.word-pair .word').nth(0).inner_text()
        nl=page.locator('.word-pair .word').nth(1).inner_text()
        assert page.locator('#learned').is_disabled()
        if skip_audio:
            page.evaluate("window.audioMode='error'")
            page.locator('#listen').click();page.clock.run_for(50)
            page.once('dialog',lambda d:d.accept())
            page.locator('#audio-skip').click()
            page.evaluate("window.audioMode='ok'")
        else:
            page.locator('#listen').click()
            assert page.locator('#learned').is_disabled()
            page.clock.run_for(500)
            assert page.locator('#learned').is_enabled()
            page.locator('#learned').click()
        assert page.locator('[data-choice]').count()==4
        assert page.locator('.word').inner_text()==en
        correct=page.locator('[data-choice]').filter(has_text=nl)
        if wrong_choice:
            page.locator('[data-choice]').filter(has_not_text=nl).first.click()
            assert 'Nog niet' in page.locator('#choice-status').inner_text()
            assert page.locator('#answer').count()==0
            correct=page.locator('[data-choice]').filter(has_text=nl)
        correct.click()
        assert page.locator('#to-type').is_disabled()
        page.clock.run_for(500)
        page.locator('#to-type').click()
        assert page.locator('.word').inner_text()==nl
        assert page.get_by_text(en,exact=True).count()==0
        page.locator('#answer').fill('fout' if wrong_type else en.upper())
        page.locator('#answer').press('Enter')
        for _ in range(5):page.keyboard.press('Enter')
        assert page.locator('.feedback').count()==1
        page.dispatch_event('#next','pointerdown')
        page.keyboard.down('Enter')
        page.clock.run_for(500)
        assert page.locator('#next').is_enabled()
        page.keyboard.up('Enter')
        page.locator('#next').click()
        return en
    for i in range(10):
        main_seen.append(do_word(wrong_choice=i==0,wrong_type=i==1))
    assert page.locator('#review').count()==1
    assert page.locator('.word-pair').count()==0
    page.locator('#review').click()
    for i in range(2):review_seen.append(do_word(skip_audio=i==1))
    assert review_seen==main_seen[:2]
    assert page.locator('#next-block').count()==1
    page.get_by_role('button',name='Muziekstudio',exact=True).click()
    page.locator('#resume').click()
    assert page.locator('#next-block').count()==1
    page.locator('#next-block').click()
    for i in range(3):main_seen.append(do_word())
    assert len(set(main_seen))==13
    assert '13 van 13 woorden gedaan' in page.locator('main').inner_text()
    data=page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1"))')
    assert data['progress']['old:listen']['days']==['2026-01-01']
    assert all(not v['days'] for k,v in data['progress'].items() if k.startswith('w'))
    assert page.evaluate('window.micRequests')==0
    page.reload()
    assert page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1")).lists.length')==2
    page.get_by_role('button',name='Voor ouders',exact=True).click()
    page.locator('#list-name').fill('Nieuw')
    page.locator('#pairs').fill('cat,kat,poes\nmusic,muziek')
    page.locator('#preview').click();page.locator('#save-list').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1")).lists.length')==3
    assert page.evaluate('JSON.parse(localStorage.getItem("lara-woordentuin-v1")).progress["old:listen"].days.length')==1
    page.get_by_role('button',name='De club',exact=True).click()
    page.screenshot(path='/tmp/poek-game-home.png',full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.get_by_role('button',name='Spelen',exact=False).click()
    page.locator('#listen').click();page.clock.run_for(500);page.locator('#learned').click()
    page.screenshot(path='/tmp/poek-game-mobile.png',full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert errors==[],errors
    print('PASS: full 13-word game; ALL lists; ten-word block; wrong MC retries before typing; typing errors; exactly two review words; next block; completed audio gate; Enter/touch guards; persistence and list import; mobile; no microphone')
    browser.close()

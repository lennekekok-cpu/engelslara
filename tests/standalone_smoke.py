"""Standalone bundle: missing and stalled audio must never lock the learning flow."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=b.new_page()
    page.add_init_script('speechSynthesis.speak=()=>{};')
    page.goto('http://127.0.0.1:3000/lara.html')
    page.clock.install()
    page.get_by_role('button',name='Spelen',exact=False).click()
    page.locator('#listen').click()
    assert page.locator('#learned').is_enabled()
    page.clock.run_for(10500)
    assert 'Geen geluid?' in page.locator('#audio-status').inner_text()
    page.locator('#learned').click()
    assert page.locator('[data-choice]').count()==4
    page.get_by_role('button',name='De club',exact=True).click()
    page.evaluate("Object.defineProperty(window,'speechSynthesis',{value:undefined})")
    page.get_by_role('button',name='Spelen',exact=False).click()
    page.locator('#listen').click()
    assert page.locator('#learned').is_enabled()
    page.locator('#learned').click()
    assert page.locator('[data-choice]').count()==4
    assert page.get_by_role('button',name='Neem mijn stem op',exact=False).count()==0
    print('PASS: standalone bundle; stalled/missing audio; step one can continue without browser speech signals')
    b.close()

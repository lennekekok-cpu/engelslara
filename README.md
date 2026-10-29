# Poek’s woordenclub — luisteren, kiezen, typen

Nederlandstalige app voor Lara met de 34 woorden en uitdrukkingen uit de Unit 1-foto’s. Poek is een blokkerige kattenvriend in een rustige gamewereld. Geen microfoon of account nodig.

## Zelf proberen

Pak `Lara-uitproberen.zip` uit en open `lara.html` in Chrome, Edge of Safari. Dit ene HTML-bestand bevat de volledige app. De nieuwe versie heeft een knop **Spelen** en drie zichtbare stappen: **Luisteren · Kiezen · Typen**.

Of start de server met Node.js 20 of nieuwer:

```sh
npm start
```

Er zijn geen npm-afhankelijkheden. De server gebruikt poort 3000, of `PORT`. Gebruik in een cloudomgeving een door het platform gedeelde poort om op je eigen apparaat te openen, of gebruik de zelfstandige HTML.

## Spelverloop

Tijdens **Spelen** doen alle woorden uit alle lijsten mee, ook lijsten die in een eerdere versie waren uitgeschakeld. De volgorde wordt per spel geschud. Ieder woord krijgt drie stappen:

1. Het Engelse en Nederlandse woord staan naast elkaar. Druk op **Luister** of **Langzamer** en daarna op **Verder**.
2. Alleen het Engelse woord staat in beeld. Kies de Nederlandse betekenis uit vier mogelijkheden. Bij een fout mag je een andere optie proberen. Na het goede antwoord komt de stap om zelf te typen.
3. Alleen het Nederlandse woord staat in beeld. Typ het Engelse woord. Hoofdletters, extra spaties en afsluitende vraagtekens/punten worden genegeerd. Ingestelde Engelse alternatieven worden geaccepteerd. Een spelfout telt als fout, met een aparte melding als het antwoord op het juiste woord lijkt. ‘Ik weet het nog niet’ toont het antwoord en markeert het woord voor herhaling.

Na tien woorden worden uitsluitend de woorden met minstens één fout in kiezen of typen opnieuw geoefend, in dezelfde drie stappen. Elk fout woord komt één keer in deze herhaling, ook als er meerdere fouten waren. Daarna is er een duidelijk pauzemoment en een knop voor de volgende tien woorden. De huidige schoollijst gaat dus in blokken van 10, 10, 10 en 4. Fouten in een herhaling blijven zichtbaar als ‘Nog oefenen’, maar starten geen eindeloze automatische herhaallus.

Bij korte eigen lijsten worden de antwoordopties aangevuld met Nederlandse betekenissen uit de meegeleverde schoollijst. Opties zijn verschillend en vermijden ingestelde synoniemen van het goede antwoord als afleider. Er is geen tijdsdruk; stoppen kan op elk moment.

## Audio zonder blokkade

Het apparaat gebruikt de Engelse browserstem, bij voorkeur Brits Engels. De beschikbaarheid en geluidskwaliteit verschillen per apparaat; het besturingssysteem kan hiervoor internet gebruiken.

**Verder** wordt ingeschakeld zodra op een luisterknop is gedrukt. De app wacht niet op een browsermelding dat het geluid is gestart of afgelopen: die melding kwam op sommige apparaten niet binnen en blokkeerde het oefenen. Bij ontbrekende audio is er ook een directe knop **Geen geluid? Verder zonder audio**. Dat omzeilt geen toets; het hele spel is oefenen met voorbeelden. Na uiterlijk tien seconden vastgelopen audio verschijnt een melding. Er wordt nooit microfoontoegang gevraagd of opgenomen.

Feedback en het doorgaan zijn aparte stappen. De vervolgknop wordt na 450 ms actief. Herhaald Enter en dubbelklikken slaan geen feedback over. Er wordt niet gewacht op mogelijk gemiste pointerup/keyup-gebeurtenissen. Sessies en lijstbeheer werken ook zonder `crypto.randomUUID`.

## Voortgang en privacy

Keuzevragen en typen na een getoond woordpaar zijn **begeleid oefenen**, geen bewijs van zelfstandige beheersing. De nieuwe voortgang wordt apart bijgehouden als `guided-choice` en `guided-english`, met pogingen en fouten. Er worden hiervoor geen zelfstandige beheersingsdagen toegekend. Eerdere lees-, luister- en spellingresultaten blijven in de back-up behouden, maar worden niet omgezet in resultaten voor deze oefenvorm.

Alles staat in localStorage van dezelfde browser op hetzelfde apparaat. Er is geen accountsynchronisatie. Bij stoppen of opnieuw openen blijven beantwoorde opdrachten bewaard, maar een onafgerond spel wordt niet hervat: een nieuw spel gebruikt opnieuw alle woorden in een nieuwe volgorde. Er is maximaal één oefendagbeloning per dag, na minimaal vier afgeronde woorden. Achtergrondmuziek is afwezig; een kort muziekje na afloop is optioneel.

Bij **Voor ouders** kun je lijsten plakken, CSV importeren, alternatieven en toetsdata aanpassen en een JSON-back-up exporteren/herstellen. Een controlevoorbeeld controleert ontbrekende en dubbele woorden. Nieuwe lijsten wissen bestaande resultaten niet. Back-upherstel vervangt de huidige gegevens na bevestiging. Het oudergedeelte heeft geen pincode.

Maak een back-up vóór je een nieuw bestand opent, van browser/apparaat wisselt of browsergegevens wist. Bestands-URL-opslag verschilt per browser; importeer je back-up in het nieuwe bestand als de gegevens daar niet automatisch verschijnen. De app stuurt zelf geen voortgang naar een server.

## Ontwikkelen en controleren

```sh
npm test
npm run bundle
```

De negen leerregeltests omvatten de volledige dekking van alle 34 woorden, blokken van tien met een laatste blok van vier, herhaling van uitsluitend fout beantwoorde woorden, vier unieke antwoordopties, behoud van gegevens en de eerdere leerregels.

Met een draaiende server, Python Playwright en Chromium op `/usr/bin/chromium`:

```sh
python3 tests/browser_smoke.py
python3 tests/standalone_smoke.py
```

De browsertests spelen een heel spel van 13 woorden door: tien woorden, twee foutwoorden herhalen, daarna de laatste drie. Ook een eerder uitgeschakelde lijst doet mee. Ze controleren de drie stappen, invoer, gegevensbehoud, nieuwe lijsten, mobiel formaat, ingedrukt Enter, gemiste aanraakacties, ontbrekende UUID-ondersteuning en falende/stagnerende audio zonder blokkerende vervolgknop. Audio-events worden gesimuleerd; de geluidskwaliteit moet op het doelapparaat worden beluisterd. De zelfstandige HTML wordt via HTTP getest omdat file:// door het cloudbrowserbeleid is geblokkeerd.

Bronnen: `app.js` voor de schermen, `game.js` voor blokken/herhaling/antwoordopties, `learning.js` voor antwoorden en voortgang, `data.js` voor de schoollijst. `npm run bundle` werkt `lara.html` bij.

## Openbare website (GitHub Pages)

`npm run build` maakt `docs/index.html` als zelfstandige app, met `docs/poek-icon.png` en `.nojekyll`. Alleen deze publieke bestanden worden door Pages aangeboden; de browsergegevens en back-ups maken geen deel uit van de site.

Publicatiebron in GitHub → Settings → Pages: **Deploy from a branch**, branch **main**, map **/docs**. Daarna is het verwachte adres `https://lennekekok-cpu.github.io/engelslara/`. Dat adres werkt pas nadat Pages daadwerkelijk is ingeschakeld en GitHub de publicatie heeft afgerond. Na bronwijzigingen: bouw opnieuw en push de bijgewerkte docs-bestanden mee.

Open het openbare adres op de iPhone in **Safari**, en kies **Deel → Zet op beginscherm**. Een Poek-icoon en appnaam zijn opgenomen. Voortgang hoort bij deze nieuwe weborigine; importeer een eerder geëxporteerde back-up bij Voor ouders als je gegevens uit een los HTML-bestand wilt meenemen. Safari en een beginschermwebapp kunnen aparte opslag gebruiken: kies voortaan één vaste manier van openen.

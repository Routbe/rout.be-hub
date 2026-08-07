# ROUT Profile Hub

Implementeer heel de publieke github code naar hier. Fix ook de bugs.

https://github.com/jdelplanche/rout-profile-hub.git

Alq je alles geïmplementeerd hebt en werkend gemaakt en nagekeken hebt. Begin dan met dit:

Die grijze placeholder-blokken (een standaard skeleton loader) voelen nu wat grof en technisch aan. Voor een platform waar snelheid, strakke feedback en een minimalistische Flat UI centraal staan, kan deze laadtoestand veel vloeibaarer en professioneler.

​Wat er nu misgaat in de beleving

​De overgang is abrupt: De grijze blokken proberen de vorm van een QR-code na te bootsen, maar ogen een beetje rommelig zodra de echte data Inent.

​Geen merkbeleving: Het is een generieke UI-component in plaats van dat het typisch aanvoelt voor ROUT.

​Hoe we dit veel strakker inrichten

​Directe SVG-rendering zonder laadstate: De QR-code moet niet pas verschijnen na een fetch, maar direct lokaal gegenereerd worden op basis van de initiële state (rout.be). Hierdoor is er überhaupt geen grijze laadscherm-fase nodig en staat de code er meteen haarscherp.

​De Flat Brand-Loader: Mocht er door zwaardere data of animaties toch een laadmoment zijn, vervang de grijze blokken dan door een egaal vlak met subtiele padding en gecentreerd het ROUT-konijntje dat met een zachte fade-in overgaat in de actieve QR-code.

​Optimistische UI: Zorg dat de invoer velden en de preview direct reageren op typgedrag (client-side), zodat de QR-matrix real-time mee-morf zonder dat de gebruiker op een server-antwoord hoeft te wachten.

​BLAUWDRUK: De ROUT Componentenbibliotheek (De Linktree-Killer)

​In plaats van een platte lijst met commerciële Amerikaanse socialmediagiganten, wordt de catalogus opgedeeld in logische, modulaire categorieën.

​📁 Categorie 1: Soeverein, Europees & Fediverse (Featured / Altijd Bovenaan)

​Deze categorie krijgt visuele prioriteit om te benadrukken waar ROUT voor staat: digitale onafhankelijkheid.

​Eyou.social — [https://eyou.social/u/](https://eyou.social/u/){username} (Het nieuwe Europese soevereine netwerk)

​Bluesky — [https://bsky.app/profile/](https://bsky.app/profile/){handle} (Gedecentraliseerd AT-protocol)

​Mastodon — @user@instance (Fediverse & ActivityPub microblogging)

​Pixelfed — Open-source en privacy-vriendelijk foto-platform (Instagram-alternatief)

​Wsocial — Lokaal/Europees sociaal netwerk

​Matrix / Element — [https://matrix.to/#/@user:server](https://matrix.to/#/@user:server) (End-to-end encrypted chat)

​Signal — Veilig communicatiekanaal (signal.me/#u/...)

​Substack / Ghost — Onafhankelijke publicaties en nieuwsbrieven

​📁 Categorie 2: Code, Ontwikkeling & Open Source

​Voor developers, sysadmins en open-source creators.

​GitHub — [https://github.com/](https://github.com/){username}

​GitLab — [https://gitlab.com/](https://gitlab.com/){username}

​Codeberg — Open-source alternatief gehost in Europa

​PGP / GPG Key — Veilige sleutel-fingerprint voor geverifieerde communicatie

​API Endpoint Status — Live status-indicator van je eigen server of node

​RSS / Atom Feed — Persoonlijke blog- of feedkoppeling

​📁 Categorie 3: Mainstream Communities & Socials

​Omdat gebruikers hun bereik soms toch willen koppelen aan grotere platforms, maar dan wel strak geïntegreerd.

​Instagram — [https://instagram.com/](https://instagram.com/){username}

​TikTok — [https://tiktok.com/](https://tiktok.com/)@{username}

​X (Twitter) — [https://x.com/](https://x.com/){username}

​YouTube / PeerTube — Kanaal of videolink

​LinkedIn — Professioneel netwerk

​Discord — Server invite of gebruikersprofiel

​Telegram — [https://t.me/](https://t.me/){username} of kanaal

​Reddit — [https://reddit.com/u/](https://reddit.com/u/){username}

​Twitch / Kick — Livestream kanalen

​📁 Categorie 4: Financiën, Betalingen & Souvereiniteit

​Transacties en steun zonder Big Tech tussenpersonen.

​SEPA / IBAN — Directe Europese bankoverschrijving

​Bitcoin Lightning — Snelle, gedecentraliseerde micro-payments (lnurl... of adres)

​EVM Wallet — Ethereum / Polygon adres (0x...)

​Open Collective / Ko-fi / Buy Me a Coffee — Community funding

​📁 Categorie 5: Media, Gaming & Creatief

​Wat je leest, luistert, speelt of maakt.

​Spotify / Apple Music — Favoriete afspeellijst of artiestenprofiel

​SoundCloud / Bandcamp — Eigen muziek of audio-sets

​Steam / Epic Games — Gaming profiel

​Letterboxd — Filmrecensies en watchlists

​Goodreads / Read.cv — Boeken en professionele portfolio's

​📁 Categorie 6: Contact, Bedrijf & Utilities

​Praktische tools voor direct contact en fysieke integratie.

​vCard (Direct Contact) — Direct opslaan van naam, telefoon, e-mail in contactenlijst

​E-mailadres — mailto:...

​Telefoonnummer — tel:...

​WhatsApp Direct — [https://wa.me/](https://wa.me/)...

​Cal.com / Calendly — Direct een afspraak inplannen

​OpenStreetMap / Google Maps — Fysieke locatie of kantoor

​Wi-Fi Netwerk QR — Automatisch verbinden met een lokaal netwerk

# SYSTEEM INSTRUCTIE & ARCHITECTUUR CORRECTIE: ROUT (Sovereign Identity & QR Hub)

Je bouwt aan ROUT, een geavanceerd, soeverein alternatief voor Linktree met geïntegreerde QR-infrastructuur (rout.be / rtq.li). Stop met generieke, luie implementaties. Voer onderstaande specificaties per direct feitelijk door:

## 1. Naamgeving & UI-Structuur (Geen "Add block")

- Verander de knop om componenten toe te voegen overal in de applicatie van het generieke "+ Add block" naar **"+ Voeg component toe"**.

- Haal het beheren van het profiel ("Social Profile Hub") volledig los van de QR-code generator. De Profile Hub is een eigen hoofdonderdeel in het dashboard. De QR-generator dient enkel om de gegenereerde hub of link te koppelen aan een QR-matrix.

## 2. Slimme Invoer per Component-Type (KRITIEK)

Niet elk component werkt hetzelfde! Stop met de fout om voor _alles_ een volledige URL te vragen óf juist alleen een gebruikersnaam. Bouw **smart input fields** die zich automatisch aanpassen aan het geselecteerde component:

A. HANDLE / USERNAME ALLES (Systeem plakt de basis-URL erachter):

- Voor netwerken zoals Instagram, TikTok, X, Bluesky, Eyou.social, GitHub, etc.

- De gebruiker vult **alleen de gebruikersnaam/handle** in (bijv. `jona`).

- Het systeem slaat dit op en genereert zelf de volledige URL (bijv. `https://instagram.com/jona` of `https://eyou.social/u/jona`). Toon in het invoerveld een subtiele placeholder die dit toont (bijv. `@gebruikersnaam` in plaats van een lege URL).

B. VOLLEDIGE URL (Exacte invoer vereist):

- Voor 'Website', 'Custom Link', portfolio's of specifieke diepe webpagina's.

- Hier moet de gebruiker wel de complete URL inclusief `https://` kunnen plakken.

C. SPECIFIEKE IDENTIFIER / PROTOCOL:

- **Matrix / Element:** Vraag om een volledige Matrix ID (bijv. `@gebruiker:server.org`).

- **E-mail / Contact:** Vraag om een geldig e-mailadres of telefoonnummer.

- **Financieel (IBAN / Crypto):** Vraag om het exacte rekeningnummer of wallet-adres.

## 3. De Uitgebreide Componentenbibliotheek (Prioriteer Europees & Soeverein)

De lijst van componenten moet gigantisch en modulair zijn, opgedeeld in duidelijke categorieën waarbij soevereine en Europese alternatieven **altijd bovenaan** staan:

- **📁 Soeverein, Europees & Fediverse (Bovenaan):**

  - Eyou.social (`eyou.social/u/...`)

  - Bluesky (`bsky.app/profile/...`)

  - Mastodon (`@user@instance`)

  - Pixelfed, Wsocial, Matrix (`matrix.to/#/...`), Signal, Substack.

- **📁 Code & Open Source:** GitHub, GitLab, Codeberg, PGP Key, API Endpoint Status.

- **📁 Mainstream Socials:** Instagram, TikTok, X, YouTube, LinkedIn, Discord, Telegram, Reddit, Twitch.

- **📁 Financiën & Web3:** SEPA / IBAN, Bitcoin Lightning, EVM Wallet, Open Collective.

- **📁 Media & Gaming:** Spotify, Apple Music, SoundCloud, Bandcamp, Steam, Letterboxd, Goodreads.

- **📁 Contact & Utilities:** vCard (Direct download), E-mail, Telefoon, WhatsApp Direct, Cal.com / Calendly, OpenStreetMap.

## 4. Technische Verfijning & Laadgedrag

- **Geen grijze skeleton-blokken** bij het laden van de QR-code: render de SVG direct client-side op basis van de initiële state om abrupte laadschermen te voorkomen.

- **Flat UI Minimalisme:** Strakke lijnen, monochrome knoppen, geen drukke visuele ballast. De UI moet aanvoelen als een professionele, snelle tech-tool.

Als dat allemaal staad begin dan pas aan dit:

​BLAUWDRUK: Permanente Sociale Media Verificatie & Bescherming

​1. De Marketing- & Permanentie-Strategie ("The Bio-Loop")

​De Regel: Verificatie is geen eenmalige handeling, maar een continu onderhouden verbinding. Om het groene vinkje te behouden, moet de link of het handvat in de externe biografie blijven staan.

​De Groeikracht: Elke geverifieerde creator fungeert als een wandelend billboard voor ROUT. Bezoekers van hun Instagram of TikTok zien direct de rout.be-link staan, klikken erop, en ontdekken het platform.

​2. Risico-Analyse & Preventie van Misbruik (Scams & Spoofing)

​Elk open systeem trekt kwaadwillenden aan. Dit zijn de belangrijkste risico's en hoe we ze waterdicht afdekken:

​Risico A: De "Hit-and-Run" Truc (Misbruik van vinkjes)

​Probleem: Een kwaadwillende zet tijdelijk rout.be/elonmusk in zijn Instagram-bio, klikt op "Verifieer", krijgt het vinkje, en haalt de link direct weer weg om een scam-link in zijn bio te zetten mét een vals geverifieerd ROUT-vinkje.

​Oplossing: Continue Achtergrond-Audits (Cron-jobs). Onze server voert dagelijks automatische checks uit op alle geverifieerde profielen. Zodra de crawler merkt dat de bio-string is verdedenen, wordt de verified: true status binnen 24 uur automatisch ingetrokken en valt het blok terug naar niet-geverifieerd.

​Risico B: Identiteitsdiefstal & Handle-Squatting

​Probleem: Iemand registreert op ROUT de naam van een bekende artiest of bedrijf om legitieme gebruikers te misleiden.

​Oplossing: De bio-verificatie is de ultieme rem. Je kunt op ROUT wel de naam @nike invoeren, maar zolang jij de officiële Instagram van Nike niet beheert en daar de verificatie-string kunt plaatsen, krijg je nooit het geverifieerde vinkje. Het vinkje is het bewijs dat de persoon achter de social media en de persoon achter ROUT dezelfde zijn.

​Risico C: Platform-blokkades (Rate-limiting / Scraping bans)

​Probleem: Sociale mediagiganten proberen profielscrapers te blokkeren.

​Oplossing: We bouwen slimme caching in. Verificatie hoeft niet 100 keer per seconde gecheckt te worden. Een gerichte check bij het instellen en een dagelijkse, gespreide achtergrond-audit via gerouleerde IP's of officiële oEmbed/OpenGraph-endpoints voorkomen dat ROUT wordt geblokkeerd.

​3. Visueel Ontwerp: Hoeziet de verificatie eruit voor bezoekers?

​De Flat UI moet direct duidelijk maken dat een link niet zomaar is ingetikt, maar cryptografisch of via bio-koppeling is hard-verificatoir.

​Het Geverifieerde Vinkje:

​Achter de naam van het social-media-blok staat een strak, minimalistisch groen vinkje of een klein soevereiniteits-schildje (✓ verified).

​De "Inspect" Tooltip (Transparantie voor de bezoeker):

​Als een bezoeker met zijn muis over het vinkje hovert (of op mobiel erop tikt), verschijnt er een subtiele popup/tooltip met de tekst:
​"Geverifieerd via actieve bio-koppeling op [Instagram]. Laatst gecontroleerd: vandaag."

​"Geverifieerd via actieve bio-koppeling op [Instagram]. Laatst gecontroleerd: vandaag."

​De Status in het Dashboard voor de Eigenaar:

​🟢 Actief & Geverifieerd (Groene balk: "Bio-link gedetecteerd. Je profiteert van maximale zichtbaarheid.")

​🟡 Verificatie Verloren (Gele waarschuwing: "We kunnen de link niet meer vinden in je Instagram-bio. Voeg hem binnen 24 uur terug om je vinkje te behouden.")

​4. De Stappen van het Verificatie-Proces (User Flow)

​Toevoegen: De gebruiker voegt het Instagram-blok toe aan zijn ROUT Profile Hub en vult zijn gebruikersnaam in (bijv. jona).

​De Instructie: Het systeem genereert een unieke verificatie-string (bijv. rout.be/@jona of een korte hash zoals rout-v:78a9).

​De Actie van de Gebruiker: De gebruiker plakt deze string in de biografie van zijn Instagram-account.

​De Check-Knop: De gebruiker gaat terug naar het ROUT-dashboard en klikt op "Verifieer koppeling".

​De Server-Side Magazijn: De backend haalt de publieke data van [instagram.com/jona](https://instagram.com/jona) op, scant de HTML/JSON naar de string.

​Succes: Wordt de string gevonden? De database zet verified: true, het groene vinkje licht direct op in de Profile Hub, en de server plant automatische achtergrond-audits in om de permanentie te waarborgen.

Begin daarna met deze:

​Hier is de complete blauwdruk voor alle overige verificatiemethoden binnen het ecosysteem.

​1. E-mailverificatie (De Fundering)

​Dit is de meest laagdrempelige en noodzakelijke stap voor elk account.

​De Methode: Magic Link of 6-cijferige OTP (One-Time Password).

​De Flow:

​De gebruiker vult zijn e-mailadres in.

​Het systeem stuurt een unieke, tijdelijke link of code die na 15 minuten verloopt.

​Zodra de gebruiker klikt of de code invoert, wordt de status gezet op email_verified: true. Dit is tevens de basisvereiste om überhaupt acties uit te kunnen voeren in het dashboard.

​2. WhatsApp & Telefoonverificatie (Laagdrempelig & Snel)

​Om te voorkomen dat je duizenden euro's kwijt bent aan dure enterprise Meta API's voor WhatsApp, lossen we dit slim en kostenefficiënt op:

​De Methode: De "Click-to-Chat" Bot Flow.

​De Flow:

​De gebruiker vult zijn telefoonnummer in bij het WhatsApp-blok.

​Het systeem genereert een unieke verificatiecode (bijv. ROUT-8832).

​De gebruiker klikt op een knop: "Stuur verificatiecode via WhatsApp". Dit opent direct een chat naar de officiële ROUT-bot met een vooraf ingevulde tekst: VERIFY ROUT-8832.

​De gebruiker verzendt dit bericht. Onze WhatsApp-webhook vangt het binnenkomende bericht op, koppelt het aan het telefoonnummer en vinkt het blok direct groen af (verified: true).

​3. Fysieke Adresverificatie via Brief (De Brief-PIN Methode)

​Dit is de ultieme test voor maximale betrouwbaarheid en fysieke soevereiniteit.

​Het Kostenmodel: Ja, hier reken je absoluut kosten voor aan. Het printen, inpakken en versturen via de postdienst kost fysieke middelen. Je kunt hiervoor een kleine vergoeding vragen (bijv. €5,00 tot €7,50 per brief, of het wordt gratis meegeleverd bij het duurste "Business Tier" abonnement). Dit houdt spammers en misbruikers direct buiten de deur.

​De Flow:

​De gebruiker vraagt een geverifieerd fysiek adres aan in zijn dashboard en rekent de verzendkosten af via Stripe.

​Het systeem genereert automatisch een beveiligde brief-PDF met een unieke, eenmalige Brief-PIN (bijv. RTQ-992-410) en het adres van de gebruiker.

​Via een geautomatiseerde post-API (of in het begin handmatig) wordt deze brief geprint en op de bon gestuurd.

​De gebruiker ontvangt de brief binnen 2 tot 5 werkdagen thuis, logt in op ROUT, voert de code in, en krijgt de felbegeerde badge: Fysiek Geverifieerd Adres.

​4. Overige Essentiële Verificaties

​Naast social media, e-mail en post, zijn er nog drie elementen die cruciaal zijn binnen de ROUT-architectuur:

​A. Eigen Domein & Subdomein Verificatie (DNS TXT / CNAME)

​Waarvoor: Voor gebruikers die hun eigen subdomein (jona.rout.be of een eigen extern domein) koppelen.

​Hoe het werkt: De gebruiker moet een unieke TXT-record of CNAME-record toevoegen bij zijn domain registrar (zoals Infomaniak). Onze server scant periodiek de DNS-zones. Zodra de DNS correct staat ingesteld, wordt het subdomein automatisch groen geverifieerd en activeert de server het AT-protocol (.well-known/atproto-did).

​B. Europese Bedrijfsverificatie (VAT / BTW Check)

​Waarvoor: Voor bedrijven en organisaties (zoals het Maximiliaan Park).

​Hoe het werkt: De gebruiker vult zijn BTW-nummer in. De backend koppelt direct via een API (zoals de Europese VIES-database) om te controleren of het bedrijf administratief actief en geldig is in Europa. Bij een succesvolle match krijgt het profiel de status Bedrijf / Geverifieerde Entiteit.

​C. Open-Source Developer Key (PGP / SSH Fingerprint)

​Waarvoor: Voor developers en tech-puristen.

​Hoe het werkt: De gebruiker uploadt zijn openbare PGP-sleutel of SSH-vingerafdruk. Het systeem verifieert of de sleutel valide is en koppelt dit aan het profiel, zodat men zeker weet dat code-commits of berichten daadwerkelijk van die persoon afkomstig zijn.

Check erna op dit te fixen:

​Dit zijn de belangrijkste blinde vlekken en hoe we ze waterdicht dichtmaken:

​1. SSRF (Server-Side Request Forgery) bij URL- en DID-checks

​Het risico: Wanneer onze backend-server automatisch URL's, subdomeinen of AT-protocol .well-known endpoints gaat crawlen om te verifiëren, kan een kwaadwillende een interne of kwaadaardige URL opgeven (bijv. http://localhost:5432 of een IP binnen jullie eigen cloud-netwerk). Onze server zou dan onbedoeld interne poorten kunnen gaan scannen of misbruikt worden als proxy.

​De oplossing: Bouw een strenge URL-sanitizer in de backend. Sta alleen externe https:// requests toe, blokkeer private IP-ranges (zoals 127.0.0.1, 10.x.x.x), en dwing strikte timeouts af op alle uitgaande netwerkverzoeken.

​2. Het "Handle-Change" Dilemma op Social Media

​Het risico: Een gebruiker verifieert zijn Instagram-account @jona via de bio-methode. Twee maanden later verandert die gebruiker zijn Instagram-handle naar @jona_oud, en een willekeurige scammer claimt direct de lege naam @jona. Als onze achtergrond-audit niet slim oplet, blijft de scammer profiteren van het groene vinkje dat eigenlijk bij de oorspronkelijke gebruiker hoorde.

​De oplossing: Sla niet alleen de tekst van de handle op, maar koppel het liefst ook de unieke platform-ID (indien zichtbaar in de API of meta-tags) of koppel de verificatie direct aan een unieke cryptografische sleutel/sessie die bij wijziging opnieuw moet worden bevestigd.

​3. Carding & Spam-aanvallen op de Fysische Brief (Adresverificatie)

​Het risico: Je vraagt een kleine vergoeding (bijv. €5) voor de fysieke brief-PIN om misbruik tegen te gaan. Toch kunnen kwaadwillenden met gestolen creditcards (carding) geautomatiseerde scripts loslaten om duizenden valse brieven te bestellen, wat jou op hoge print- en verzendkosten jagt.

​De oplossing:

​Gebruik Stripe Radar met strikte 3D-Secure verificatie om frauduleuze betaalkaarten automatisch te weigeren.

​Koppel de optie voor fysieke brieven aan een minimum account-leeftijd of eis dat de gebruiker al een geverifieerd e-mailadres en actieve activiteit heeft voordat een fysieke brief kan worden aangevraagd.

​4. Client-Side QR-manipulatie

​Het risico: Als de logica om dynamische QR-codes te genereren te veel op de client (de browser van de gebruiker) leunt, kan een tech-savvy gebruiker via devtools de payload aanpassen en QR-codes genereren die naar ongewenste locaties doorsturen.

​De oplossing: Houd de generatie van de uiteindelijke omleidings-hashes en de koppeling met rtq.li of rout.be strikt server-side. De browser stuurt alleen een verzoek in, de server valideert of de gebruiker eigenaar is van dat pad, en tekent de definitieve route.
Erna mag je met dit beginnen als je alles hierboven hebt gedaan.

​Hier is het laatste ontbrekende puzzelstuk van de blauwdruk:

​1. Privacy-First Analytics (Geen Cookies, Geen Big Tech)

​Een platform dat stoelt op digitale soevereiniteit kan natuurlijk geen gebruikmaken van Google Analytics, Meta Pixels of zware commerciële trackers die gebruikers bespioneren.

​Server-Side Anonieme Tellers: Alle statistieken (aantal QR-scans, kliks op specifieke componenten, geografische herkomst op landniveau) worden volledig server-side bijgehouden.

​Geen IP-opslag: IP-adressen worden direct onomkeerbaar gehasht (salted hash) en na verwerking weggegooid. Er worden geen cookies geplaatst in de browser van de bezoeker, waardoor je volledig AVG/GDPR-compliant bent zonder vervelende cookie-banners.

​2. True Data Portability (Jouw data is van jou)

​Echte soevereiniteit betekent dat een gebruiker nooit vastzit aan een platform. Als iemand besluit om ROUT te verlaten of zijn eigen server op te zetten, moet dat in één klik kunnen.

​De Export-Knop: In de instellingen komt een optie: "Exporteer Soeverein Profiel".

​Het Formaat: Dit genereert direct een gestructureerd en cryptografisch gesigneerd .json of .json-ld bestand met daarin al je ingestelde componenten, biografie, geverifieerde hashes en AT-protocol DID-gegevens. Dit bestand kun je direct importeren op een eigen instantie of ander open-source platform.

Blijf aan dit werken in een loop. Check steeds of het wel ecjt gedaan is zoals ik vroeg en begin steeds opnieuw tot je 100% bent dat het is zoals doorgegeven.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/97cf6cb6-e662-46b3-80b5-5145688ac18a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

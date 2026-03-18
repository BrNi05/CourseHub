# CourseHub Felhasználási Feltételek (ÁSZF)

**Hatályba lép:** 2026.03.19. (első változat)

Jelen Felhasználási Feltételek (a továbbiakban: **Feltételek**) határozzák meg a CourseHub szolgáltatás (a továbbiakban: **Szolgáltatás**) használatának szabályait. A Szolgáltatás üzemeltetője Szőcs Barnabás (a továbbiakban: **Üzemeltető**; email: <barni@sigsegv.hu>).

A CourseHub alkalmazás letöltésével, megnyitásával, illetve a szolgáltatásba történő bejelentkezéssel a felhasználó (a továbbiakban: **Felhasználó**) elfogadja a jelen Feltételeket.

## A Szolgáltatás célja és jellege

A CourseHub egy egyetemi kurzus aggregátor alkalmazás, ami segítségével a hallgatók egy helyen érhetik el a tárgyaikkal kapcsolatos oldalakat. A Szolgáltatás ingyenesen vehető igénybe, „ahogy van” (as-is) és „ahogy elérhető” (as-available) alapon. Az Üzemeltető fenntartja a jogot a Szolgáltatás funkcióinak előzetes értesítés nélküli módosítására, bővítésére vagy megszüntetésére.

## Regisztráció és Fiók

- **Hitelesítés:** A Szolgáltatás teljeskörű használatához (személyreszabás) Google fiókkal (OAuth2) történő bejelentkezés szükséges. A felhasználói adatok kezelését az [Adatkezelési Tájékoztató](https://github.com/BrNi05/CourseHub/blob/main/legal/privacy.md) szabályozza. A Szolgáltatás az EU adatvédelmi szabályai ([GDPR](https://eur-lex.europa.eu/HU/legal-content/summary/general-data-protection-regulation-gdpr.html)) szerint kezeli a személyes adatokat.

- **Felelősség:** A Felhasználó felelős a saját eszközének és Google fiókjának biztonságáért. Az Üzemeltető nem vállal felelősséget a fiókhoz való jogosulatlan hozzáférésből eredő károkért, ha az a Felhasználó gondatlanságából ered.

- **Inaktivitás:** Ahogy az [Adatkezelési Tájékoztatóban](https://github.com/BrNi05/CourseHub/blob/main/legal/privacy.md) is szerepel, 12 hónap inaktivitás után a fiók és a hozzá tartozó adatok (bizonyos kivételektől eltekintve) automatikusan törlésre kerülnek.

## API használat és Adatkinyerés (Scraping)

A CourseHub infrastruktúrájának (szervereinek, adatbázisainak és hálózatának) védelme és a megfelelő teljesítmény biztosítása érdekében az alábbi szabályok érvényesek a backenddel (API-val) való kommunikációra:

- **Kizárólag hivatalos kliensek:** A CourseHub API végpontjait (endpoints) kizárólag a hivatalos CourseHub kliensalkalmazások használhatják. Bármilyen harmadik fél által készített szoftver, script vagy nem hivatalos kliens API-hoz való csatlakozása **szigorúan tilos**. (A rendszergazdák a karbantartás és üzemeltetés céljából kivételt képeznek).

- **Adatbányászat és Crawling tilalma:** Szigorúan tilos a Szolgáltatásból bármilyen automatizált módszerrel (pl. botok, spiderek, scraperek, crawlerek) adatokat kinyerni, letölteni vagy másolni.

- **Kereskedelmi célú felhasználás tilalma:** A CourseHub adatainak harmadik féltől származó alkalmazásokba való integrálása vagy kereskedelmi célú felhasználása kizárólag az Üzemeltető előzetes, írásbeli engedélyével lehetséges.

- **DDoS védelem és szankciók:** Az automatizált lekérdezéseket és a nem hivatalos API hívásokat a rendszer biztonsági kockázatként (pl. DDoS támadásként) értékelheti, mivel ezek ronthatják az oldal és a szerver teljesítményét. A szabály megszegése ideiglenes IP cím tiltáshoz vezethet.

- **Hálózati és peremvédelmi intézkedések:** A Szolgáltatás forgalma biztonsági és rendelkezésre állási okokból harmadik fél (Cloudflare) által nyújtott hálózati/peremvédelmi infrastruktúrán is áthalad. Az Üzemeltető jogosult a gyanús, automatizált vagy túlzott mértékű forgalmat technikai intézkedésekkel - ideértve a korlátozást, szűrést vagy blokkolást - automatikusan kezelni.

Az Üzemeltető fenntartja a jogot, hogy a jelen Feltételek megsértése esetén a Felhasználó fiókját felfüggessze vagy törölje, valamint jogi lépéseket tegyen.

## Felhasználói magatartás

A Szolgáltatás igénybevétele 16. életévét betöltött felhasználók számára engedélyezett. Kiskorúak esetén a szülői vagy gondviselői beleegyezés szükséges.

A Felhasználó a Szolgáltatás használata során köteles jóhiszeműen eljárni, és nem végezhet olyan tevékenységet, amely:

- Sérti vagy veszélyezteti a Szolgáltatás integritását, működését vagy biztonságát.

- Jogszabályba ütközik, vagy mások jogait (például szellemi alkotásokhoz fűződő jogokat, személyiségi jogokat) sérti.

A Felhasználó által a Szolgáltatásba feltöltött linkekért és információkért teljes mértékben felel. A megosztott linkeknek pontosnak, valósnak és jogszerűnek kell lenniük; tilos tudatosan rosszindulatú, félrevezető vagy kárt okozó hivatkozásokat megosztani. Az Üzemeltető a feltöltött tartalmakat nem köteles előzetesen ellenőrizni, és alapesetben nem felel azok jogszerűségéért.

Amennyiben bárki (akár Felhasználó, akár harmadik személy) úgy észleli, hogy a Szolgáltatásban elérhető valamely tartalom (pl. egy megosztott kurzus-link) szerzői jogot sért, kártékony, vagy egyéb módon jogszabályba ütközik, kérjük, jelezze ezt az Üzemeltető felé a <barni@sigsegv.hu> email címen. Az értesítésnek tartalmaznia kell a sérelmezett tartalom pontos helyét és a jogsértés vélelmezett okát. Az Üzemeltető a bejelentést megvizsgálja, és amennyiben azt megalapozottnak érzi, haladéktalanul gondoskodik a jogsértő tartalom eltávolításáról vagy elérésének letiltásáról.

A Felhasználó a fiókja törlésével bármikor, azonnali hatállyal felmondhatja a jelen szerződést.

## Szellemi tulajdonjogok és nyílt forráskód

- **Apache 2.0 Licenc:** A CourseHub alkalmazás (kliens) és a backend architektúra nyílt forráskódú szoftverek, és az Apache License 2.0 feltételei alatt állnak. A Felhasználó a szoftverek forráskódját a licencben foglalt szabályok betartásával szabadon megtekintheti, módosíthatja, saját célra felhasználhatja és terjesztheti.

- **A hosztolt szolgáltatás, az adat és az API védelme:** Kifejezetten felhívjuk a figyelmet arra, hogy éles különbség van a nyílt forráskód és az Üzemeltető által fenntartott élő szolgáltatás (szerverek, API, adatbázis és a benne lévő adatok) között. Bár a kód szabadon felhasználható saját példány (instance) indítására, az Üzemeltető által futtatott infrastruktúra és a felhasználói adatok elérésére, valamint használatára szigorúan a jelen Feltételek - különös tekintettel az **API Használat és Adatkinyerés (Scraping)** fejezetre - az irányadók.

- **Védjegy és arculat:** A "CourseHub" név ezen célú használata, az egyedi logók és a vizuális márkaarculat az Üzemeltető kizárólagos tulajdonát képezik.

## Felelősségkorlátozás

- **Rendelkezésre állás:** Az Üzemeltető törekszik a Szolgáltatás folyamatos és hibamentes működtetésére, de nem garantálja a 100%-os rendelkezésre állást. A karbantartások, szerverhibák vagy vis maior események miatti leállásokért az Üzemeltető nem vállal felelősséget.

- **Adatvesztés:** Bár az Üzemeltető rendszeres biztonsági mentéseket készít, nem vállal felelősséget a felhasználói adatok (pl. rögzített kurzusok) esetleges elvesztéséért, sérüléséért.

- **Kártérítés kizárása:** Az Üzemeltető a jogszabályok által megengedett legteljesebb mértékben kizárja a felelősségét a Szolgáltatás használatából vagy használhatatlanságából eredő bármilyen közvetlen vagy közvetett kárért (ideértve az elmaradt hasznot vagy adatvesztést is).

## A Feltételek módosítása

Az Üzemeltető fenntartja a jogot, hogy a jelen Felhasználási Feltételeket bármikor módosítsa. A módosításokról a Felhasználókat a kliensalkalmazáson keresztül vagy a kapcsolódó platformokon értesítjük, legalább 15 nappal a hatályba lépés előtt. A Szolgáltatás további használatával a Felhasználó elfogadja a módosított Feltételeket.

## Irányadó jog és jogérvényesítés

Jelen Feltételekre és a Szolgáltatás használatára a magyar jogrendszer az irányadó. Bármilyen jogvita esetén a felek törekszenek a békés, peren kívüli megegyezésre. Ennek sikertelensége esetén a magyar bíróságok rendelkeznek joghatósággal.

**Kapcsolatfelvétel:** Ha bármilyen kérdése van a jelen Feltételekkel kapcsolatban, kérjük, írjon a <barni@sigsegv.hu> email címre.

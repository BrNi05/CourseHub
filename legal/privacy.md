# CourseHub Adatkezelési Tájékoztató

**Hatályba lép:** 2026.03.19. (első változat)

Jelen tájékoztató célja, hogy a CourseHub felhasználói („Érintettek”) részletes tájékoztatást kapjanak személyes adataik kezeléséről. Az adatkezelés során az alábbi jogszabályok az irányadók:

- **GDPR:** Az Európai Parlament és a Tanács (EU) 2016/679 Rendelete.

- **Infotv.:** Az információs önrendelkezési jogról és az információszabadságról szóló 2011. évi CXII. törvény.

## Az Adatkezelő adatai

Az adatkezelő az a jogi vagy természetes személy, amely a személyes adatok kezelésének céljait és eszközeit meghatározza. A CourseHub szolgáltatás backend (API) és adatbázis üzemeltetője, valamint az adatok kezelője:

**Név:** Szőcs Barnabás

**Email:** <barni@sigsegv.hu>

**Helyszín:** Magyarország (Európai Unió)

### Fogalommeghatározások

- **Személyes adat:** Azonosított vagy azonosítható természetes személyre vonatkozó bármely információ (pl. név, email cím, online azonosító).

- **Érintett:** Bármely meghatározott, személyes adat alapján azonosított vagy - közvetlenül vagy közvetve - azonosítható természetes személy (a Felhasználó).

## Kezelt adatok köre, célja és jogalapja

Személyes adatokat kizárólag meghatározott célból, jogalappal rendelkező esetekben kezelünk. Az adatkezelés jogszerűsége a GDPR 6. cikk (1) bekezdésén alapul.

### Regisztráció és Hitelesítés (Google OAuth2)

- **Kezelt adatok:** Google fiók azonosító (googleId), email cím, fiók létrehozásának dátuma.

- **Nem kezeljük:** Google jelszó, Google hozzáférési tokenek (access tokens).

- **Cél:** Az Érintett azonosítása, egyedi felhasználói profil biztosítása.

- **Jogalap:** Szerződés teljesítése (GDPR 6. cikk (1) b)).

- **Időtartam:** A fiók felhasználó általi törléséig. Törlés esetén az adatok azonnal megsemmisülnek.

### Felhasználói preferenciák (Kurzusok)

- **Kezelt adatok:** A felhasználó által rögzített kurzusok listája és esetleges kapcsolódó beállítások.

- **Cél:** A szolgáltatás személyre szabása és a felhasználói élmény javítása. _Felhívjuk az Érintettek figyelmét, hogy ilyen módon az Adatkezelő birtokába juthatnak olyan közvetett információk, amelyekből következtetni lehet az Érintett oktatási intézményére (pl. egyetem, kar) és tanulmányi területére (szak)._

- **Jogalap:** Szerződés teljesítése (GDPR 6. cikk (1) b)).

- **Megőrzési idő:** A felhasználói fiók törléséig.

### Rendszerdiagnosztika és Statisztika ("Ping")

Bejelentkezett felhasználó esetén egy adott platformon egy adott napon előszöri induláskor a kliens jelzi a backend számára ezt a tényt. Ez az úgynevezett 'ping' esemény.

- **Kezelt adatok:** Felhasználói ID, operációs rendszer típusa, kliens verzió, időbélyeg.

- **Cél:** Rendszerstabilitás monitorozása, verziókövetés, terhelési csúcsok meghatározása, fejlesztési irányok meghatározása (statisztika).

- **Jogalap:** Jogos érdek (GDPR 6. cikk (1) f)).

- **Időtartam:** Legfeljebb 1 év, ezt követően az adatok törlésre kerülnek. Fiók törlése esetén a ping rekordok anonimizálásra kerülnek, és azok többé nem kapcsolhatók a felhasználókhoz.

### Biztonsági naplózás (Logok)

A rendszer a visszaéléseket, támadásokat (pl. DDoS) és hibás kéréseket különböző módokon naplózza.

- **Kezelt adatok:** felhasználó IP címe, hívott API végpont, HTTP státuszkód, időbélyeg, felhasználó azonosítója.

- **Cél:** Az informatikai rendszer védelme, visszaélések megelőzése és kivizsgálása, incidenskezelés.

- **Jogalap:** Jogos érdek (GDPR 6. cikk (1) f)).

- **Időtartam:** legfeljebb 1 év.

### Peremvédelem

A CourseHub a Cloudflare szolgáltatásait használja az alkalmazás kiszolgálásához és védelméhez. Ekkor a Cloudflare az Adatkezelő adatfeldolgozójaként jár el.

- **Kezelt adatok:** IP cím, a kérésekhez kapcsolódó technikai metaadatok (pl. hosztnév, URL, HTTP fejlécek, UserAgent, időbélyeg, válaszkód), biztonsági eseményekhez kapcsolódó forgalmi adatok és mintázatok.

- **Cél:** A szolgáltatás internetes elérhetővé tétele, a forgalom biztonságos továbbítása, a rosszindulatú vagy automatizált forgalom kiszűrése, a DDoS és egyéb visszaélések megelőzése, valamint az infrastruktúra rendelkezésre állásának fenntartása.

- **Jogalap:** Jogos érdek (GDPR 6. cikk (1) f)).

- **Időtartam:** A Cloudflare által kezelt hálózati és biztonsági naplóadatok megőrzési idejét a mindenkori szolgáltatási és naplózási beállítások határozzák meg. Az Adatkezelő törekszik arra, hogy ezen adatok megőrzése a cél eléréséhez szükséges minimumra korlátozódjon.

- **Megjegyzés:** Bizonyos biztonsági funkciók működése során a Cloudflare feltétlenül szükséges technikai sütiket vagy hasonló azonosítókat is alkalmazhat a kérések hitelességének és a forgalom biztonságának ellenőrzésére.

### Hibabejelentés

A felhasználó a kliensen keresztül önkéntes alapon hibajelentést küldhet. Az Adatkezelő a bejelentést a kapott adatok alapján megvizsgálja, és amennyiben a hiba jellege megköveteli, az email címen keresztül kapcsolatba léphet az Érintettel a hiba további kivizsgálása vagy egyedi megoldási javaslat közlése céljából.

- **Kezelt adatok:** email cím, kliens verzió, operációs rendszer típusa, meghívott API végpont, felhasználói cselekmény, stack trace, egyéb üzenet, időbélyeg.

- **Cél:** Az informatikai rendszer javítása, működési hibák vizsgálata. Kapcsolatfelvétel az Érintettel az email címén keresztül, ha ez a hibajelentés kivizsgálásához szükséges.

- **Jogalap:** Az Érintett önkéntes hozzájárulása (GDPR 6. cikk (1) a)).

- **Időtartam:** legfeljebb 1 év.

- **Különös törlési szabály:** A felhasználói fiók (profil) törlése **nem vonja magával** a korábban beküldött hibajelentések automatikus törlését, azok a hibajavítási folyamatok folytonossága érdekében a megőrzési idő végéig tárolhatók. Az Érintett az elfeledtetéshez való jogát (törlési kérelmét) a hibajelentésekre vonatkozóan a maximális 1 éves időtartamon belül bármikor, egyedileg is gyakorolhatja a megadott elérhetőségen.

### GitHub alapú kurzusjavaslat

Amennyiben a felhasználó a CourseHub GitHub repository-n keresztül küld kurzus javaslatot, úgy az adatkezelésére a GitHub saját [adatvédelmi szabályzata](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) vonatkozik.

### Alkalmazáson belüli kurzusajánlás

A felhasználóknak lehetősége van a kliensen keresztül új kurzusok felvételét vagy meglevő kurzusok módosítását javasolni. Az ajánlás beküldése önkéntes.

- **Kezelt adatok:** Érintett email címe, a beküldés pontos dátuma, valamint a javasolt intézmény, kar és kurzus adatai (intézmény és kar neve és rövidítése, kurzus neve, kódja, és a kapcsolódó elérhetőségek: weboldal, TAD, Moodle, Teams, egyéb).

- **Cél:** A szolgáltatás adatbázisának bővítése, az intézményi és kurzuskínálat naprakészen tartása a felhasználói közösség bevonásával. Az email cím és dátum tárolásának célja a beküldések hitelességének ellenőrzése és az esetleges visszaélések (spam) megelőzése.

- **Jogalap:** Az Érintett önkéntes hozzájárulása (GDPR 6. cikk (1) a) bekezdés).

- **Időtartam és Törlés:** 30 nap. A fő adatbázisba átemelt kurzusinformációk a továbbiakban nem minősülnek személyes adatnak, és nem kapcsolhatók vissza a beküldő felhasználóhoz.

## Inaktivitás és automatikus adattörlés

A GDPR 5. cikk (1) bekezdés c) pontjában rögzített adattakarékosság elve, valamint az e) pont szerinti korlátozott tárolhatóság elve alapján az Adatkezelő törekszik arra, hogy ne tároljon olyan személyes adatokat, amelyek a cél eléréséhez már nem szükségesek.

- Törlési feltétel: Amennyiben az Érintett a fiókjában 12 hónapig (1 évig) nem végez aktív tevékenységet (ideértve a ping eseményeket, új kurzus rögzítését vagy meglévő kurzus-preferenciák módosítását), a rendszer a felhasználói profilt inaktívnak minősíti.

- A törlés folyamata: Az inaktivitási időszak leteltét követően a rendszer automatikusan és véglegesen törli a Felhasználóhoz kapcsolódó összes személyes adatot.

- Következmény: A törlést követően az adatok nem állíthatóak helyre. Amennyiben az Érintett újra igénybe kívánja venni a szolgáltatást, új regisztráció (hitelesítés) szükséges.

- Kivétel: A biztonsági naplókban és a rendszerdiagnosztikai ("ping") adatokban szereplő azonosítók a fenti 1 éves megőrzési idő után, vagy a fiók törlésekor azonnal anonimizálásra kerülnek, így azok a továbbiakban nem minősülnek személyes adatnak.

## Adatbiztonsági intézkedések

Az Adatkezelő kötelezi magát arra, hogy gondoskodik az általa kezelt személyes adatok biztonságáról. A tudomány és technológia állása szerint elvárható módon megteszi azokat a technikai és szervezési intézkedéseket, amelyek biztosítják, hogy a tárolt adatok védettek legyenek.

Alkalmazott védelmi intézkedések:

- **Hozzáférés-kezelés:** A személyes adatokhoz kizárólag az Adatkezelő, az Érintett, valamint megbízott Adatfeldolgozó harmadik felek férhetnek hozzá.

- **Hálózati védelem:** Az adatátvitel titkosított csatornán (HTTPS/TLS) történik. A szervereket tűzfal védi a külső támadások ellen.

- **Peremvédelem:** A nyilvános forgalom a Cloudflare infrastruktúráján keresztül érkezik, amely DNS, DDoS- és botvédelmi funkciókkal segíti a szolgáltatás biztonságát, válaszidejét és rendelkezésre állását.

- **Integritás és rendelkezésre állás:** Rendszeres biztonsági mentések készülnek az adatvesztés megelőzése érdekében.

- **Bizalmasság:** Az OAuth2 tokeneket a CourseHub szerverei nem tárolják.

- **Hitelesítés biztonsága:** A felhasználó azonosítására használt tokenek (JWT) sértetlenségét szerveroldali, magas biztonsági fokozatú kriptográfiai kulcsok (privát kulcs) garantálják. Ez biztosítja, hogy a felhasználónál tárolt azonosítókat illetéktelenek ne módosíthassák vagy hamisíthassák.

## Adatfeldolgozók és Adattovábbítás

Az Adatkezelő az adatok kezeléséhez az alábbi adatfeldolgozókat/szolgáltatókat veszi igénybe:

| Szolgáltató     | Tevékenység                 | Székhely |
|-----------------|-----------------------------|----------|
| Cloudflare Inc. | Peremvédelem                | USA / EU |
| Google LLC      | Hitelesítés (OAuth2)        | USA / EU |
| GitHub Inc.     | Nyílt forráskódú javaslatok | USA      |

A CourseHub nem értékesít adatokat. Személyes adatokat harmadik felek részére kizárólag adatfeldolgozók igénybevétele, jogszabályi kötelezettség teljesítése, illetve jogérvényesítés esetén továbbít.

Az egyes szolgáltatók az EGT-n kívül, így az Egyesült Államokban is végezhetnek adatkezelési műveleteket. Az ilyen adattovábbítások az érintett szolgáltató által biztosított megfelelő adatvédelmi garanciák mellett történnek.

## Más weboldalak

A CourseHub külső weboldalak tartalmát jeleníti meg. Ezekre a weboldalakra azok saját adatvédelmi szabályzataik vonatkoznak.

## Automatizált döntéshozatal és profilalkotás

A CourseHub nem alkalmaz automatizált döntéshozatalt vagy profilalkotást, amely az Érintettre nézve joghatással járna.

## Az Érintett jogai

Az Érintett kérelmezheti az Adatkezelőnél az alábbiakat:

- **Tájékoztatás és hozzáférés:** Joga van tudni, milyen adatait kezeljük, és azokról másolatot kérni.

- **Helyesbítés:** Kérheti pontatlan adatainak javítását vagy hiányos adatainak kiegészítését.

- **Törlés („elfeledtetéshez való jog”):** Kérheti adatai törlését, ha az adatkezelés célja megszűnt, vagy visszavonja hozzájárulását (fiók törlése). Megjegyzés: Jogi kötelezettség teljesítéséhez szükséges adatok esetén a törlés nem minden esetben lehetséges azonnal.

- **Zárolás/Korlátozás:** Kérheti az adatkezelés korlátozását, ha vitatja az adatok pontosságát vagy az adatkezelés jogszerűségét.

- **Adathordozhatóság:** Joga van adatait géppel olvasható formátumban megkapni.

- **Tiltakozás:** Tiltakozhat a jogos érdeken alapuló adatkezelés ellen.

**Joggyakorlás:** A fenti jogait gyakorolhatja a <barni@sigsegv.hu> email címen. Az Adatkezelő a kérelmet legfeljebb egy hónapon belül teljesíti vagy válaszolja meg.

## Jogorvoslati lehetőségek

Amennyiben az Érintett úgy véli, hogy adatkezelése nem felel meg a jogszabályoknak, az alábbi lehetőségekkel élhet:

- **Panasz az Adatkezelőnél:** Kérjük, első körben vegye fel velünk a kapcsolatot a fenti email címen.

- **Hatósági eljárás:** Panaszt tehet a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH).

  - **Weboldal:** <http://www.naih.hu>

  - **Cím:** 1055 Budapest, Falk Miksa utca 9-11.

  - **Postacím:** 1363 Budapest, Pf.: 9.

- **Bírósági eljárás:** Az Érintett döntése alapján a per megindítható a lakóhelye vagy tartózkodási helye szerinti Törvényszék előtt is.

## Szabályzat módosítása

Fenntartjuk a jogot a jelen tájékoztató módosítására. A változásokról a CourseHub felületén előre értesítjük a felhasználókat. A módosítások a (későbbi) közzététellel lépnek hatályba.

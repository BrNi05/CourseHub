# CourseHub adatvédelmi hatásvizsgálat (DPIA)

**Adatkezelő:** Szőcs Barnabás

**Szolgáltatás:** CourseHub

**Dokumentum státusza:** hatályos

**Készült:** 2026.05.30. (első verzió)

**Következő tervezett felülvizsgálat:** 2027.05.30., illetve minden olyan lényeges funkcionális, infrastrukturális, adatfeldolgozói vagy adatkezelési változás előtt, amely az érintetti kockázatokat növelheti.

## 1. A dokumentum célja és hatálya

Jelen adatvédelmi hatásvizsgálat célja annak dokumentálása, hogy a CourseHub szolgáltatásban kezelt személyes adatok, különösen a hallgatói kurzus- és jegyadatok kezelése milyen hatással lehet a természetes személyek jogaira és szabadságaira, továbbá milyen technikai és szervezési intézkedések csökkentik ezeket a kockázatokat.

**A vizsgálat a CourseHub alábbi szolgáltatási működésére terjed ki:**

- Google OAuth2 alapú regisztráció és bejelentkezés.

- Felhasználói rögzített kurzusok kezelése.

- Átlag kalkulátor helyi és szerveroldali mentése (átlagadatok).

- Felhasználói kurzuscsomagok létrehozása, kereshetősége és megosztása.

- Alkalmazáson belüli kurzusjavaslatok.

- Rendszerdiagnosztikai ping, biztonsági naplózás és peremvédelem.

- Automatikus adattörlési, gyorsítótárazási és megőrzési folyamatok.

Nem tartozik a jelen DPIA hatálya alá a CourseHub forráskódjától független, harmadik fél által önállóan futtatott saját példány adatkezelése, valamint a GitHub felületén, a GitHub saját adatkezelői minőségében végzett adatkezelés.

## 2. Jogszabályi és módszertani alap

**A hatásvizsgálat alapja:**

- [GDPR 35. cikk](https://gdpr-text.com/hu/read/article-35/), különösen a (1), (7), (9), (11) bekezdések.

- [GDPR 36. cikk](https://gdpr-text.com/hu/read/article-36/) az előzetes konzultációról.

- A NAIH által közzétett, GDPR 35. cikk (4) szerinti [hatásvizsgálati jegyzék](https://www.naih.hu/hatasvizsgalati-lista).

- A NAIH adatvédelmi hatásvizsgálatról és előzetes konzultációról szóló [tájékoztatója](https://www.naih.hu/az-adatvedelmi-hatasvizsgalat-es-elozetes-konzultacioja).

- A CourseHub hatályos [adatkezelési tájékoztatója](https://github.com/BrNi05/CourseHub/blob/main/legal/privacy.md).

- A CourseHub jogos érdeken alapuló adatkezeléseire vonatkozó [érdekmérlegelési teszt](https://github.com/BrNi05/CourseHub/blob/main/legal/LIA.md).

- A CourseHub [felhasználási feltételei](https://github.com/BrNi05/CourseHub/blob/main/legal/tos.md).

**A GDPR 35. cikk (7) bekezdése alapján a DPIA legalább az alábbiakat tartalmazza:**

- A tervezett adatkezelési műveletek módszeres leírását és az adatkezelés céljait.

- Az adatkezelési műveletek szükségességi és arányossági vizsgálatát.

- Az érintettek jogait és szabadságait érintő kockázatok vizsgálatát.

- A kockázatok kezelését célzó garanciák, biztonsági intézkedések és mechanizmusok bemutatását.

## 3. A DPIA lefolytatásának indoka

A DPIA elkészítése indokolt, mert a CourseHub átlag kalkulátorában a felhasználók önkéntesen rögzíthetnek eredményeket (jegyeket) különböző tárgyakhoz. Ezen adatok közvetlenül vagy közvetetten utalhatnak az érintett tanulmányi előmenetelére, intézményére, karára, szakjára és teljesítményére.

A NAIH kötelező hatásvizsgálati jegyzékének 9. pontja releváns lehet, mert hallgatók személyes adatainak felkészültség, teljesítmény vagy alkalmasság rögzítésére és vizsgálatára történő felhasználását nevesíti, ha az adatkezelés nem jogszabályon alapul. A CourseHub ugyan nem oktatási intézmény, nem hoz oktatási vagy joghatással járó döntést, és nem értékeli a hallgatót sem saját felhasználásra, sem harmadik személy részére, de a funkció tárgya hallgatói teljesítményadat. Az elővigyázatosság és az elszámoltathatóság elve alapján indokolt a DPIA lefolytatása.

## 4. Az adatkezelés rövid leírása

A CourseHub egy egyetemi kurzus aggregátor és hallgatói segédeszköz. A szolgáltatás célja, hogy a felhasználók egy helyen találják meg kurzusaikhoz kapcsolódó oldalakat, személyes kurzuslistát vezessenek, kurzuscsomagokat hozzanak létre, és opcionálisan átlag kalkulátort használjanak.

A szolgáltatás fő adatáramlása:

1. A felhasználó megnyitja a CourseHub webes felületét.

2. A kurzusok bejelentkezés nélkül is böngészhetők. Helyi (kurzuslista) mentés is létrehozható.

3. Személyre szabott funkciókhoz a felhasználó Google OAuth2-vel jelentkezik be.

4. A backend belső felhasználói profilt hoz létre vagy betölt, és `HttpOnly` authentikációs sütit állít be.

5. A felhasználó rögzíthet kurzusokat, kurzuscsomagokat és jegyadatokat.

6. Az átlag kalkulátor adatai alapértelmezés szerint a böngésző helyi tárhelyében kerülnek mentésre. Szerveroldali (felhős) mentés csak bejelentkezett felhasználó kifejezett, önkéntes mentési művelete esetén történik.

7. A backend PostgreSQL adatbázisban tárolja a tartós adatokat, a Redis és a folyamaton belüli gyorsítótárazás pedig teljesítménycélú ideiglenes tárolást biztosít.

8. A szolgáltatás a Cloudflare-en keresztül érhető el, és biztonsági / diagnosztikai naplózást alkalmaz.

9. Az adatbázis tartalma időnként biztonsági mentésre kerül lokálisan, illetve akár másik, védett EGT-n belüli szerverre is.

## 5. Érintettek köre

- Regisztrált vagy bejelentkezett CourseHub felhasználók.

- Egyetemi hallgatók, akik kurzus- vagy átlagkalkulátor funkciókat használnak.

- Legalább 16 éves felhasználók (ÁSZF). A szolgáltatás nem 16 év alatti személyek számára készült.

- Anonim látogatók, akik a nyilvános felületet használják, illetve akiknél technikai hálózati adatok keletkezhetnek.

- Adminisztrátori jogosultsággal rendelkező felhasználók, amennyiben admin funkciókat használnak.

## 6. Kezelt adatkategóriák

### 6.1. Fiók- és hitelesítési adatok

- Google fiók azonosító.

- Google email cím.

- Belső felhasználói azonosító.

- Fiók létrehozásának és frissítésének időpontja.

- Admin jogosultság jelölése.

- Bejelentkezési süti, amely szerver által aláírt JWT-t tartalmaz.

- OAuth állapot-süti a bejelentkezési folyamat védelmére.

### 6.2. Kurzuspreferenciák

- Felhasználó által rögzített kurzusok.

- A kurzusokhoz kapcsolódó intézmény, kar, kurzuskód, kreditérték és hivatkozások.

**Ezek az adatok közvetetten utalhatnak az érintett intézményére, karára, szakjára vagy érdeklődési körére.**

### 6.3. Átlag kalkulátor adatai

Szerveroldali mentés esetén a `User.creditProfile` JSON mező tartalmazhatja:

- Félévek számát és azonosítóit.

- Tárgyneveket, tárgykódokat és a hozzájuk tartozó kreditértékek.

- Tárgyakhoz tartozó jegyek.

### 6.4. Kurzuscsomagok

- Csomag neve.

- Opcionális leírása.

- Kapcsolódó kar (így kapcsolódó egyetem).

- Kapcsolt kurzusok listája.

- Létrehozó felhasználó belső azonosítója.

- Utolsó használat időpontja.

- Permanens állapot jelölése.

**A kurzuscsomagok neve, leírása és tartalma közvetetten és közvetlenül is utalhat az érintett (létrehozó felhasználó) tanulmányi területére vagy érdeklődési körére.**

### 6.5. Kurzusjavaslatok

- Beküldő email címe.

- Beküldés időpontja.

- Javasolt egyetem, kar és kurzus adatai.

- Kapcsolódó kurzuslinkek.

### 6.6. Diagnosztikai, biztonsági és hálózati adatok

- IP cím.

- Hívott API végpont.

- HTTP státuszkód.

- Időbélyeg.

- Felhasználói azonosító, ha a kérés hitelesített.

- Operációs rendszer típusa.

- User-Agent és egyéb technikai metaadatok.

- Cloudflare biztonsági eseményekhez és forgalomvédelemhez kapcsolódó technikai adatok.

### 6.7. Helyi böngészőtárhelyben tárolt adatok

- Rögzített kurzusok helyi mentése.

- Átlag kalkulátor helyi mentése.

- Kurzuskeresési és felhasználói felületi segédállapotok.

- Bejelentkezés utáni útvonal-visszatérési szándék.

- Napi ping helyi deduplikációs adatai.

**A helyi tárhelyben tárolt adatokat a felhasználó böngészője kezeli, teszi mindezt a szolgáltatás által megszabott módon, ezért a kockázatértékelésben figyelembe kell venni.**

## 7. Adatkezelési célok és jogalapok

Az EDPB 6. cikk (1) b) jogalapról szóló iránymutatása alapján az egyes online szolgáltatási elemeknél külön kell vizsgálni, hogy az adott adatkezelés objektíven szükséges-e a felhasználó által igénybe vett konkrét funkció teljesítéséhez.

| Adatkezelés                                                   | Cél                                                            | Jogalap                                                                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Nyilvános kurzusböngészés                                     | Kurzusadatok megjelenítése bejelentkezés nélkül                | Személyes adatkezelés főszabály szerint nem történik, kivéve a technikai hálózati és biztonsági adatokat, ami jogos érdek (ld. lentebb) |
| Regisztráció és hitelesítés az azonosított funkciókhoz        | Egyedi felhasználói profil és fiókhoz kötött funkciók nyújtása | Szerződés teljesítése, GDPR 6. cikk (1) b), kizárólag a bejelentkezett / fiókhoz kötött szolgáltatási elemekhez                         |
| Auth munkamenet süti                                          | Bejelentkezett munkamenet fenntartása                          | Szerződés teljesítése, GDPR 6. cikk (1) b), mert a fiókhoz kötött funkciók biztonságos használatához szükséges                          |
| OAuth állapot-süti                                            | OAuth folyamat védelme, login CSRF megelőzése                  | Jogos érdek, GDPR 6. cikk (1) f)                                                                                                        |
| Rögzített kurzusok szerveroldali, fiókhoz kötött kezelése     | Személyre szabott kurzuslista biztosítása több munkamenetben   | Szerződés teljesítése, GDPR 6. cikk (1) b)                                                                                              |
| Rögzített kurzusok és jegyadatok kizárólag helyi mentése      | Felhasználó által kért kliensoldali funkció biztosítása        | Szerződés teljesítése, GDPR 6. cikk (1) b)                                                                                              |
| Átlag kalkulátor szerveroldali mentése                        | Kalkulációs forrásadatok megőrzése és elérhetővé tétele        | Szerződés teljesítése, GDPR 6. cikk (1) b)                                                                                              |
| Kurzuscsomag saját kezelése                                   | Saját csomagok létrehozása, módosítása, törlése                | Szerződés teljesítése, GDPR 6. cikk (1) b)                                                                                              |
| Kurzuscsomag kereshetősége más bejelentkezett felhasználóknak | Közösségi, újrafelhasználható kurzusösszeállítások biztosítása | Jogos érdek, GDPR 6. cikk (1) f)                                                                                                        |
| Alkalmazáson belüli kurzusjavaslat                            | Adatbázis bővítése, spam megelőzése                            | Hozzájárulás, GDPR 6. cikk (1) a)                                                                                                       |
| Ping és diagnosztika                                          | Stabilitás, verziókövetés, fejlesztési prioritások             | Jogos érdek, GDPR 6. cikk (1) f)                                                                                                        |
| Biztonsági naplózás                                           | Incidenskezelés, visszaélés-megelőzés, rendszerbiztonság       | Jogos érdek, GDPR 6. cikk (1) f)                                                                                                        |
| Cloudflare peremvédelem                                       | DDoS-, bot- és hálózati védelem                                | Jogos érdek, GDPR 6. cikk (1) f)                                                                                                        |

A jogos érdeken alapuló műveletek részletes érdekmérlegelését [LIA dokumentum](https://github.com/BrNi05/CourseHub/blob/main/legal/LIA.md) tartalmazza.

## 8. Adatfeldolgozók és adattovábbítás

| Szolgáltató     | Szerep                                   | Lehetséges adattípus                                            |
| --------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Cloudflare Inc. | Peremvédelem, hálózati forgalom kezelése | IP cím, URL, HTTP metaadatok, biztonsági események              |
| Google LLC      | OAuth2 hitelesítés                       | Google fiókazonosító, email cím, bejelentkezési folyamat adatai |

Az egyes szolgáltatók EGT-n kívüli adattovábbítása esetén megfelelő garanciákra, például EU-USA DPF-re, SCC-re vagy más jogszerű továbbítási mechanizmusra kell támaszkodni.

Nem tartozik a jelen DPIA hatálya alá a GitHub adatkezelése.

## 9. Megőrzési idők és törlés

| Adatkategória                          | Megőrzés                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Fiókadatok                             | A fiók törléséig, inaktivitás esetén automatikus törlés                                              |
| Rögzített kurzusok                     | A fiók törléséig                                                                                     |
| Átlag kalkulátor szerveroldali mentése | A fiók törléséig vagy a felhasználó törlési műveletéig                                               |
| Átlag kalkulátor helyi mentése         | A böngésző helyi tárhelyében, a felhasználó eszközén, felhasználói törlésig                          |
| Kurzuscsomagok                         | Fióktörlésig vagy felhasználói törlésig, nem permanens csomagok 12 hónap inaktivitás után törölhetők |
| Kurzusjavaslatok                       | 30 nap, illetve elfogadás esetén a személyes adat leválasztása után törlés                           |
| Ping adatok                            | Legfeljebb 1 év, fióktörlés esetén anonimizálás                                                      |
| Biztonsági naplók                      | Legfeljebb 1 év, a jelenlegi implementációban akár jelentősen rövidebb ideig                         |

A gyorsítótárak adatvédelmi szempontból ideiglenes tárolók. A CourseHub alkalmazásban GDPR-kompatibilis cache invalidációs mechanizmusok működnek felhasználói törlés, kurzusváltozás, kar vagy egyetem törlése és jegyadatok törlése esetén.

## 10. Szükségességi és arányossági vizsgálat

### 10.1. Szolgáltatási szükségesség

A CourseHub alapvető célja a felhasználó által választott kurzusok és kapcsolódó linkek személyre szabott kezelése, valamint további releváns funkciók (pl. átlag kalkulátor) nyújtása. Ehhez szükséges a felhasználói fiók, a rögzített kurzuslista és a bejelentkezett állapot fenntartása.

Az átlag kalkulátor célja, hogy a felhasználó saját maga számára rögzíthesse a tanulmányi szempontból fontos mutatókhoz szükséges adatokat. Szerveroldali mentés nélkül a funkció több eszközön vagy böngészőváltás után kényelmetlenül, de használható, ezért a szerveroldali mentés szolgáltatási szempontból indokolható. A szerveroldali mentés ugyanakkor nem automatikus adatgyűjtés, hanem a bejelentkezett felhasználó funkcióhasználatához kapcsolódik.

### 10.2. Kevésbé invazív alternatívák

A szolgáltatás több kevésbé invazív megoldást is alkalmaz vagy lehetővé tesz:

- Az átlag kalkulátor bejelentkezés nélkül, kizárólag helyi böngészőtárhelyben is használható.

- A szerveroldali mentés bármikor, véglegesen törölhető.

- A kalkulátor mentése nem kapcsolja az egyes kalkulátor bejegyzéseket konkrét `Course` rekordokhoz.

- A szerveroldali mentések mérete korlátozott.

- A CourseHub nem alkalmaz reklámcélú követést vagy joghatással járó automatizált döntéshozatalt.

- A diagnosztikai ping mentén nem történik semmiféle viselkedéselemzés.

### 10.3. Arányosság

Az adatkezelés az alábbi okokból arányosnak tekinthető:

- Az adatkezelés a felhasználó által kért, oktatási segédcélú funkciókhoz kapcsolódik.

- A hallgatói teljesítményadatokat a szolgáltatás nem továbbítja oktatási intézménynek, munkáltatónak vagy harmadik félnek értékelési döntés céljából.

- A felhasználó törölheti fiókját, kurzusadatait és szerveroldali átlagmentését.

- A szolgáltatás használata önkéntes, és nem előfeltétele oktatáshoz, vizsgához vagy intézményi ügyintézéshez való hozzáférésnek.

- A publikus vagy közösségi jellegű funkciók elsősorban kurzuscsomagokra vonatkoznak, nem a jegyekre vagy átlagadatokra.

## 11. Adatvédelmi alapelvek szerinti értékelés

| GDPR alapelv                               | CourseHub megfelelési értékelés                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Jogszerűség, tisztességesség, átláthatóság | A jogalapok az adatkezelési tájékoztatóban szerepelnek, a jogos érdeken alapuló műveleteket a publikus LIA dokumentálja.                    |
| Célhoz kötöttség                           | Az adatok felhasználása a szolgáltatás működtetéséhez, személyre szabásához, biztonságához és önkéntes javaslatkezeléshez kapcsolódik.      |
| Adattakarékosság                           | Az OAuth tokeneket nem tárolja a rendszer, az átlagprofil JSON mérete korlátozott, a kalkulátor nem kapcsolódik kurzusrekord-azonosítókhoz. |
| Pontosság                                  | A felhasználó által megadott adatok pontosságáért elsődlegesen a felhasználó felel, a kurzusjavaslatok admin jóváhagyáson esnek át.         |
| Korlátozott tárolhatóság                   | Automatikus inaktivitási törlés, javaslat- és logrotáció, ping megőrzési idő, kurzuscsomag inaktivitási törlés.                             |
| Integritás és bizalmas jelleg              | HTTPS/TLS, HttpOnly sütik, CSP, Helmet, CORS, rate limiting, admin és ownership guardok, cache invalidáció, monitorozás.                    |
| Elszámoltathatóság                         | Adatkezelési tájékoztató, LIA, jelen DPIA, tesztekkel védett backend viselkedés és dokumentált architektúra, publikus repo.                 |

## 12. Beépített és alapértelmezett adatvédelem

A rendszer tervezése során az OWASP Top 10 és OWASP ASVS irányelvek figyelembevételével kerültek kialakításra a fő biztonsági kontrollok, így különösen a hitelesítés, jogosultságkezelés, session-kezelés, bemeneti validáció és naplózás.

- `HttpOnly`, `Secure`, `SameSite=Lax` attribútumokkal ellátott hitelesítési süti.

- Rövid életű OAuth state süti a bejelentkezési folyamat védelmére.

- Google OAuth tokenek nem kerülnek tartós tárolásra.

- Szerveroldali validáció és globális NestJS validation pipe.

- Rate limiting minden végponton.

- Admin és felhasználói tulajdonosi jogosultság-ellenőrzések.

- Átlagkalkulátor JSON méretkorlátozás.

- GDPR-kompatibilis, biztonságos gyorsítótárazás.

- PostgreSQL és Prisma ORM a biztonságos lekérdezések érdekében, és az SQL Injection támadások ellen.

- CSP, HSTS, referrer policy, Permissions-Policy, stb. biztonsági fejlécek.

- Cloudflare peremvédelem DDoS és bot jellegű forgalom ellen.

## 13. Érintetti jogok és átláthatóság

Az érintettek a CourseHub adatkezelési tájékoztatója alapján gyakorolhatják:

- Hozzáférési jogukat.

- Helyesbítéshez való jogukat.

- Törléshez való jogukat.

- Adatkezelés korlátozásához való jogukat.

- Adathordozhatósághoz való jogukat.

- Hozzájárulás visszavonási jogukat hozzájáruláson alapuló adatkezelésnél.

- Tiltakozási jogukat jogos érdeken alapuló adatkezelés esetén.

A felhasználó saját fiókjának és átlagadatainak törlésével közvetlenül is csökkentheti vagy megszüntetheti a szerveroldali adatkezelést. A helyi böngészőtárhelyben tárolt adatok törlése a böngésző vagy az alkalmazás helyi funkciói útján történhet.

## 14. Érintettek véleményének figyelembevétele

A GDPR 35. cikk (9) bekezdése alapján az adatkezelő adott esetben kikéri az érintettek vagy képviselőik véleményét.

A CourseHub fejlesztése teljes mértékben transzparens, a felhasználói visszajelzésekre nyitott:

- Minden jogi dokumentum nyilvános és verzió követett.

- Többféle visszajelzési csatorna is biztosított.

- A CourseHub kódbázisa, adatbázis szerkezete és kihelyezési módszere bárki által megvizsgálható.

## 15. Kockázatértékelési módszertan

A kockázatértékelés az érintetti jogokra és szabadságokra gyakorolt hatást vizsgálja, nem pusztán az üzemeltető üzleti vagy technikai kockázatát.

**Skála:**

- **Valószínűség:** 1 - nagyon alacsony, 2 - alacsony, 3 - közepes, 4 - magas, 5 - nagyon magas.

- **Hatás:** 1 - csekély, 2 - alacsony, 3 - közepes, 4 - magas, 5 - nagyon magas.

- **Kockázati pontszám**: valószínűség * hatás.

**Értelmezés:**

- 1-4: alacsony.

- 5-9: közepes.

- 10-15: magas.

- 16-25: nagyon magas.

## 16. Kockázatok, meglévő intézkedések és fennmaradó kockázat

| #   | Kockázat                                                                             | Lehetséges érintetti hatás                                                                                  | Kiinduló kockázat    | Meglévő vagy tervezett intézkedések                                                                                                                                                  | Fennmaradó kockázat |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| 1   | Szerveroldali jegyadatok jogosulatlan hozzáférése                                    | Jegyek, tanulmányi előmenetel, szak vagy intézmény illetéktelen megismerése, szégyen és reputációs kockázat | 3 x 4 = magas        | Auth süti HttpOnly/Secure, saját adat csak autentikált felhasználónak, admin endpointok külön védve, rate limiting, HTTPS, DB hozzáférés korlátozása, törlési lehetőség, méretkorlát | 2 x 4 = közepes     |
| 2   | Admin jogosultság hibás kezelése vagy admin fiók kompromittálódása                   | Több felhasználó adataihoz való hozzáférés, technikai adatok megismerése                                    | 4 x 5 = nagyon magas | Admin jogosultság adatbázisban, admin guardok, admin endpointok szigorú throttlinggal, admin hozzáférés szűk körben tartott, böngészőben admin süti nem tárolt, HS384 algo.          | 1 x 5 = közepes     |
| 3   | XSS vagy kliensoldali támadás miatt helyi szivárgása                                 | Helyi jegy- és kurzusadatok illetéktelen hozzáférése az adott eszközön                                      | 3 x 4 = magas        | CSP, script nonce, `script-src-attr` tiltás, referrer policy, nincs auth token localStorage-ban                                                                                      | 2 x 4 = közepes     |
| 4   | A kurzuscsomag neve vagy leírása túl sok személyes adatot tartalmaz                  | Közösségen belüli következtetés intézményre, szakra, érdeklődési körre                                      | 2 x 3 = közepes      | Adatkezelési tájékoztató figyelmeztet, csomag törölhető / módosítható, nem permanens csomagok inaktivitás után törölhetők, kereshetőség bejelentkezett kontextusra korlátozott       | 1 x 3 = alacsony    |
| 5   | JSON-ba (user.creditProfile) a felhasználó szükségtelen vagy különleges adatot ír    | Túlzott adatkezelés, érzékeny adatok indokolatlan tárolása                                                  | 3 x 4 = magas        | Méretkorlát, felhasználói önkéntesség, UI korlátok, törlési lehetőség, adatkezelési tájékoztató                                                                                      | 1 x 4 = alacsony    |
| 6   | Túl hosszú megőrzés vagy elfelejtett cache / backupszemét                            | Már nem szükséges hallgatói adatok fennmaradása                                                             | 3 x 4 = magas        | Inaktív felhasználók törlése, jegyadatok törlése, cache invalidáció, ping/log/javaslat rotáció, kurzuscsomag takarítás                                                               | 2 x 4 = közepes     |
| 7   | Biztonsági naplók túl sok információt tartalmaznak vagy jogosulatlanul hozzáférhetők | IP cím, felhasználói azonosító és használati minták illetéktelen megismerése                                | 3 x 3 = közepes      | Célhoz kötött naplózás, megőrzési idő, admin / internal hozzáférés, logrotáció                                                                                                       | 2 x 3 = közepes     |
| 8   | Harmadik országba irányuló adattovábbítás garanciáinak elégtelensége                 | Érintetti kontroll csökkenése, hatósági vagy harmadik fél hozzáférési kockázat                              | 3 x 4 = magas        | Cloudflare / Google adatkezelési feltételek és DPF / SCC jellegű garanciák ellenőrzése, adatminimalizálás, adattovábbítási tájékoztatás                                              | 2 x 4 = közepes     |
| 9   | Felhasználói fiók kompromittálódása Google oldalon vagy eszközszinten                | Saját CourseHub adatokhoz való jogosulatlan hozzáférés                                                      | 3 x 4 = magas        | Google OAuth2, CourseHub nem tárol Google jelszót, HttpOnly auth süti, felhasználó felelőssége saját Google fiók / eszköz biztonsága, kijelentkezés és fióktörlés lehetősége         | 2 x 4 = közepes     |
| 10  | 16-18 éves felhasználók adatainak kezelése                                           | Kiskorú érintettek fokozottabb sérülékenysége                                                               | 2 x 4 = közepes      | Szolgáltatás 16 év felettieknek, 16 év alatti adat tudomásszerzés esetén törlés, önkéntes használat, nincs marketingprofilozás                                                       | 2 x 2 = alacsony    |
| 11  | API scraping vagy tömeges lekérdezés személyes vagy közösségi adatokra               | Csomagadatok, mintázatok tömeges gyűjtése                                                                   | 3 x 3 = közepes      | ÁSZF scraping tiltás, rate limiting, Cloudflare, bejelentkezéshez kötött funkciók, monitorozás                                                                                       | 2 x 2 = alacsony    |

## 17. Kiemelt fennmaradó kockázatok

A jelen DPIA alapján a fennmaradó kockázatok többsége közepes vagy alacsony szintre csökkenthető. Az admin hozzáférés és a hallgatói teljesítményadatok szerveroldali tárolása továbbra is kiemelt körültekintéssel kezelendő.

## 18. Előzetes konzultáció szükségessége

A GDPR 36. cikke alapján előzetes konzultáció akkor szükséges, ha a DPIA szerint az adatkezelés a tervezett garanciák és intézkedések mellett is magas kockázattal járna, és az adatkezelő nem tud megfelelő intézkedéseket hozni a kockázat elfogadható szintre csökkentésére.

A jelen értékelés alapján a CourseHub adatkezelése a hallgatói teljesítményadatok miatt DPIA-kötelesnek vagy legalább DPIA-val igazolandónak tekinthető, de a jelenlegi intézkedések mellett a fennmaradó kockázatok jellemzően alacsony-közepes szintre csökkenthetők. Ez alapján a NAIH-val történő előzetes konzultáció **nem szükséges**.

## 19. Összegzés

A CourseHub adatkezelése a hallgatói kurzus- és teljesítményadatok önkéntes rögzítése miatt fokozott figyelmet igényel. A szolgáltatás ugyan nem része az oktatási rendszernek, nem hoz joghatással járó döntést, és nem értékeli a hallgatókat harmadik személy részére, a tárolható jegyadatok az érintettek magánszférájára nézve érzékeny következtetésekre adhatnak lehetőséget.

A jelenlegi adatvédelmi architektúra több lényeges kockázatcsökkentő elemet tartalmaz: önkéntes használat, helyi használati alternatíva, szerveroldali törlési lehetőség, authentication és admin guardok, biztonsági fejlécek, rate limiting, gyorsítótár invalidáció, megőrzési idők és adatkezelési tájékoztatás.

## 20. Dokumentáció és jóváhagyás

| Szerep                  | Név            | Döntés           | Dátum       | Megjegyzés                           |
| ----------------------- | -------------- | ---------------- | ----------- | ------------------------------------ |
| Adatkezelő              | Szőcs Barnabás | Jóváhagyott      | 2026.05.30. | Eljárt mint adatkezelő és fejlesztő. |
| Adatvédelmi tisztviselő | -              | Nem alkalmazandó | -           | Nincs kijelölt DPO.                  |

## 21. Felülvizsgálati napló

| Dátum       | Verzió      | Változás                                                                                       |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------- |
| 2026.05.30. | Első verzió | Első DPIA verzió a meglévő jogi dokumentumok, repo architektúra és NAIH/GDPR források alapján. |

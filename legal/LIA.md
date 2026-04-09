# GDPR érdekmérlegelési teszt (Legitimate Interest Assessment)

**Adatkezelő:** Szőcs Barnabás

**Szolgáltatás:** CourseHub

**Hatályba lép:** 2026.04.10. (harmadik verzió)

**Utolsó felülvizsgálat:** 2026.04.09.

## 1. A dokumentum célja

Jelen dokumentum célja annak rögzítése, hogy a CourseHub mely adatkezelési műveletek esetén támaszkodik a GDPR 6. cikk (1) bekezdés f) pontja szerinti jogos érdek jogalapra, és ezen adatkezelések miért tekinthetők jogszerűnek.

Az érdekmérlegelési teszt az alábbi három kérdést vizsgálja:

1. Van-e valós, jogszerű és kellően konkrét jogos érdek?

2. Szükséges-e az adott személyes adatok kezelése e cél eléréséhez?

3. Nem élveznek-e elsőbbséget az Érintettek érdekei, alapvető jogai és szabadságai?

## 2. Jogszabályi és módszertani alap

Az értékelés a következő forrásokra támaszkodik:

- **GDPR 6. cikk (1) f)**: személyes adatok kezelése jogszerű, ha az az Adatkezelő vagy harmadik fél jogos érdekeinek érvényesítéséhez szükséges, kivéve, ha ezekkel szemben elsőbbséget élveznek az Érintett érdekei vagy alapvető jogai és szabadságai.

- **GDPR (47) preambulumbekezdés:** a csalás megelőzése jogos érdek lehet.

- **GDPR (49) preambulumbekezdés:** a hálózati és információbiztonság biztosítása érdekében végzett, szigorúan szükséges és arányos adatkezelés jogos érdeknek minősülhet.

- **GDPR 21. cikk:** az Érintett tiltakozhat a jogos érdeken alapuló adatkezelés ellen, ugyanakkor az adatkezelés folytatható, ha az adatkezelő kényszerítő erejű jogos okokat igazol.

- **EDPB Guidelines 1/2024 (nyilvános konzultációs változat):** a jogos érdeknek valósnak, jelen idejűnek, kellően pontosnak és jogszerűnek kell lennie; az adatkezelés szükségességét és az Érintetti oldallal való mérlegelést dokumentálni kell.

- **ICO LIA guidance:** vizsgálandó az Érintettel fennálló kapcsolat, az észszerű elvárások, a várható hatás és a beépített garanciák.

## 3. A vizsgált adatkezelések köre

Jelen LIA az alábbi, a CourseHub adatkezelési tájékoztatójában is jogos érdekre alapított műveletekre terjed ki:

1. Rendszerdiagnosztika és statisztika ("ping").

2. Biztonsági naplózás.

3. Cloudflare alapú peremvédelem és forgalomvédelmi intézkedések.

4. OAuth2 bejelentkezési folyamat védelme ideiglenes állapot-sütivel.

5. Bejelentkezett felhasználók által létrehozott kurzuscsomagok kereshetővé és hozzáférhetővé tétele más bejelentkezett felhasználók számára.

## 4. Általános körülmények és közös garanciák

### 4.1. Érintetti kategóriák és az Adatkezelőhöz fűződő viszony

Az érdekmérlegelés során az Adatkezelő az alábbi fő Érintetti kategóriákat veszi figyelembe:

- **Anonim látogató**: olyan személy, aki a nyilvános webes felületet eléri, de nem jelentkezik be. Az Adatkezelőhöz fűződő viszonya laza, az adatkezelés főként hálózati és biztonsági célú.

- **Regisztrált vagy bejelentkezett felhasználó**: olyan személy, aki a CourseHub Szolgáltatást hitelesítetten használja. Az Adatkezelőhöz közvetlen szolgáltatási kapcsolat fűzi.

Az erőegyensúlytalanság a jelen kontextusban alacsony:

- Az Adatkezelő nem közhatalmi szerv.

- Az Adatkezelő nem munkáltatói vagy hasonló alá-fölérendeltségi helyzetben jár el.

- A Szolgáltatás használata teljesen önkéntes.

- A jelen LIA tárgyát képező adatkezelések nem reklámcélú profilalkotást, hanem működtetési és biztonsági célokat szolgálnak.

- A kurzuscsomagok kereshetősége esetén az adatkezelés nem reklámcélú, hanem korlátozott közösségi funkciót szolgál a Szolgáltatáson belül.

### 4.2. Ésszerű Érintetti elvárások alapja

- Az Adatkezelő az adatkezelésről kifejezett tájékoztatást ad.

- Az adatkezelés közvetlenül a Szolgáltatás elérhetőségéhez, integritásához, stabilitásához és biztonságához kapcsolódik.

- A személyes adatok az Érintett szolgáltatáshasználata során keletkeznek vagy válnak hozzáférhetővé.

- Az Érintettek ésszerűen számíthatnak egy webes szolgáltatás használata során hasonló jellegű adatkezelési mintákra.

### 4.3. Közös garanciák

Az egyes adatkezeléseknél közös, az érdekmérlegelés szempontjából releváns körülmények:

- A CourseHub a jogos érdeken alapuló adatkezeléseket a Szolgáltatás biztonságának, stabilitásának és korlátozott közösségi funkcióinak fenntartása érdekében végzi.

- Az adatok jelentős része technikai vagy fiókhasználathoz kapcsolódó adat, míg a kurzuscsomagok kereshetősége esetén a felhasználó által létrehozott tartalom korlátozott körű hozzáférhetővé tétele történik.

- A CourseHub nem kezel különleges adatokat a jelen LIA hatálya alá tartozó célokból.

- Az Adatkezelő adattakarékossági, hozzáférés-korlátozási és megőrzési időre vonatkozó korlátozásokat alkalmaz.

- A CourseHub nem értékesíti a személyes adatokat.

### 4.4. A megőrzési idő indokolása

A jelen LIA hatálya alá tartozó (technikai jellegű), legfeljebb 1 éves megőrzési idejű adatkezelések általános indokai:

- Lehetővé teszi a később felismert incidensek és visszaélések utólagos kivizsgálását.

- Segíti az ismétlődő vagy szezonális mintázatok felismerését.

- Az egyetemi félévekhez kötődő ciklikusság miatt indokolt lehet egy teljes éves időszak összehasonlíthatósága.

- Rövidebb megőrzési idő csökkenthetné az incidenskezelési képességet, illetve a statisztikák használhatóságát.

- Hosszabb megőrzési idő jelenleg nem tűnik szükségesnek a kitűzött célokhoz.

A kurzuscsomagok kereshetősége ettől eltérő logika szerint működik: a megőrzési idő a főszabály szerint addig tart, amíg az Érintett a csomagot nem törli, illetve a felhasználói fiókja meg nem szűnik, mert a funkció rendeltetése a tartós, közösségen belüli újrafelhasználhatóság.

## 5. Érdekmérlegelés adatkezelésenként

### 5.1. Rendszerdiagnosztika és statisztika ("ping")

**Kezelt adatok:** felhasználói azonosító, operációs rendszer típusa, kliens verzió, időbélyeg.

**Cél:** rendszerstabilitás monitorozása, verziókövetés, terhelési csúcsok meghatározása, fejlesztési irányok kijelölése.

**Megőrzési idő:** legfeljebb 1 év; fióktörlés esetén anonimizálás.

#### 5.1.1. Célteszt

Az Adatkezelő jogos érdeke, hogy:

- Lássa, mely operációs rendszereken használják a Szolgáltatását.

- Észlelje az üzemeltetési vagy kompatibilitási problémákat.

- Mérni tudja az alkalmazás tényleges használatát platformonként.

- Megalapozott döntést hozzon hibajavítási és fejlesztési prioritásokról.

Ez az érdek valós, jelenidejű, közvetlenül kapcsolódik a Szolgáltatás üzemeltetéséhez, és nem ellentétes a jogszabályokkal.

#### 5.1.2. Szükségességi teszt

Az adatkezelés szükséges, mert:

- A Szolgáltatás megbízható működésének vizsgálata és a fejlesztési irányok kijelölése a felhasználási információ nélkül nem végezhető el érdemben.

- Az aggregált számlálók önmagukban nem elegendők egyedi platform- vagy verzióhibák felismerésére.

- A napi első indulásra korlátozott **ping** esemény lényegesen kevésbé invazív, mint a részletes viselkedéskövetés.

- A kezelt adatkör szűk.

Kevésbé invazív alternatíva a teljesen anonim telemetria lehetne, de az nem biztosítaná ugyanazt a hibakeresési és megbízhatósági képet. A jelenlegi megoldás arányosabb, mint egy folyamatos, eseményalapú analitika.

#### 5.1.3. Mérlegelési teszt

Az Érintettekre gyakorolt hatás korlátozott, technikai jellegű, de nem teljesen elhanyagolható:

- A kezelt adatok technikai jellegűek.

- Nem történik marketing, profilalkotás vagy automatizált döntéshozatal.

- Az Érintett meglévő kapcsolatban áll a Szolgáltatással.

- Az adatkezelés egy bejelentkezett alkalmazás működtetéséhez kapcsolódik, ezért észszerűen várható.

Az Érintetti kockázatokat csökkentő garanciák:

- Adattakarékos adatkör.

- Napi egy esemény platformonként.

- Legfeljebb 1 éves megőrzés.

- Fióktörlés esetén anonimizálás.

- Hozzáférés-korlátozás.

- Átlátható tájékoztatás az adatkezelési tájékoztatóban.

- Tiltakozási jog biztosítása, azzal, hogy az Adatkezelő tiltakozás esetén egyedi mérlegelést végez.

**Következtetés:** az Adatkezelő jogos érdeke elsőbbséget élvez az Érintettek korlátozott beavatkozással járó érdekeivel szemben. A jogalap alkalmazása indokolt.

### 5.2. Biztonsági naplózás

**Kezelt adatok:** IP cím, hívott API végpont, HTTP státuszkód, időbélyeg, felhasználó azonosítója.

**Cél:** visszaélések megelőzése és kivizsgálása, incidenskezelés, rendszerbiztonság.

**Megőrzési idő:** legfeljebb 1 év.

#### 5.2.1. Célteszt

Az Adatkezelő jogos érdeke, hogy:

- Megvédje a CourseHub infrastruktúráját és a felhasználói fiókokat.

- Felismerje az illetéktelen hozzáférési kísérleteket, túlterhelést, scrapinget és egyéb visszaéléseket.

- Incidens esetén rekonstruálni tudja az eseményeket.

- Megőrizze a Szolgáltatás rendelkezésre állását és integritását.

Ez a cél közvetlenül illeszkedik a GDPR (49) preambulumbekezdésében nevesített hálózati és információbiztonsági jogos érdekhez.

#### 5.2.2. Szükségességi teszt

Az adatkezelés szükséges, mert:

- IP cím és kérésmetaadatok nélkül a rosszindulatú vagy hibás forgalom mintázatai nem azonosíthatók megbízhatóan.

- Naplózás nélkül egy incidens utólagos kivizsgálása jelentősen nehezebb vagy lehetetlen.

- A biztonsági intézkedések hatékonyságának ellenőrzéséhez szükséges a kérés- és válaszkörnyezet alapvető rögzítése.

Kevésbé invazív alternatíva a rövidebb vagy aggregált naplózás lenne, azonban ez csökkentené a visszaélések felismerhetőségét és az incidensek kivizsgálhatóságát. A jelenlegi adatkör ugyanakkor nem terjed ki a kommunikáció teljes tartalmára, csak a védelemhez érdemben szükséges technikai metaadatokra.

#### 5.2.3. Mérlegelési teszt

Az Érintettekre gyakorolt hatás korlátozott, technikai jellegű, de nem teljesen elhanyagolható:

- Az IP cím személyes adat, de internetes szolgáltatás igénybevétele során az ilyen típusú technikai feldolgozás széles körben észszerűen elvárható.

- Az adatkezelés nem megfigyelési vagy kereskedelmi célt szolgál.

- Az adatkezelés a Szolgáltatás és a többi felhasználó védelmét is szolgálja.

Garanciák:

- Célhoz kötöttség: kizárólag biztonsági, visszaélés-megelőzési és incidenskezelési cél.

- Hozzáférés-korlátozás.

- Legfeljebb 1 éves megőrzés.

- Transzparens tájékoztatás.

- Nincs automatizált döntéshozatal, amely joghatással járna.

- Tiltakozási jog biztosítása, azzal, hogy biztonsági és visszaélés-megelőzési célú adatkezelés esetén az Adatkezelő jellemzően kényszerítő erejű jogos érdeket tud igazolni a további kezeléshez a GDPR 21. cikke alapján.

**Következtetés:** a Szolgáltatás biztonságához fűződő jogos érdek erős, az Érintetti beavatkozás mértéke korlátozott és arányos. A jogalap alkalmazása indokolt.

### 5.3. Cloudflare alapú peremvédelem és forgalomvédelmi intézkedések

**Kezelt adatok:** IP cím, hosztnév, URL, HTTP fejlécek, User-Agent, időbélyeg, válaszkód, forgalmi mintázatok, biztonsági eseményekhez kapcsolódó technikai metaadatok.

**Cél:** a Szolgáltatás publikus kiszolgálása, DDoS- és botvédelem, rosszindulatú forgalom kiszűrése, rendelkezésre állás és hálózati biztonság fenntartása.

**Megőrzési idő:** a Cloudflare mindenkori szolgáltatási és naplózási beállításai szerint, az Adatkezelő törekvése szerint a szükséges minimumra korlátozva.

#### 5.3.1. Célteszt

Az Adatkezelő jogos érdeke, hogy:

- Biztosítsa a CourseHub internet felől történő biztonságos elérhetőségét.

- Ellenálljon DDoS, bot, scraping és más hálózati visszaéléseknek.

- Csökkentse a rendelkezésre állási és biztonsági kockázatokat.

- Harmadik fél peremvédelmi infrastruktúráját használja, ha az arányosabb és hatékonyabb, mint a kizárólag saját védelem.

Ez az érdek közvetlenül kapcsolódik a GDPR (49) preambulumbekezdésében elismert hálózati és információbiztonsági célhoz.

#### 5.3.2. Szükségességi teszt

Az adatkezelés szükséges, mert:

- Peremvédelem technikailag nem valósítható meg a kérések alapvető technikai metaadatainak elemzése nélkül.

- Az internet felől érkező támadások kiszűrése valós időben csak ilyen típusú adatkezeléssel lehetséges.

- Egy kisebb szolgáltatás számára életszerű és arányos külső infrastruktúrát igénybe venni ahelyett, hogy saját globális védelmi rendszert építene.

Kevésbé invazív alternatíva a peremvédelem teljes mellőzése vagy jelentős csökkentése lenne, de ez lényegesen növelné a rendelkezésre állási és biztonsági kockázatokat.

#### 5.3.3. Mérlegelési teszt

Az Érintettekre gyakorolt hatás korlátozott, technikai jellegű, de nem teljesen elhanyagolható:

- A kezelt adatok elsődlegesen technikai és hálózati adatok.

- Az Érintettek észszerűen számíthatnak arra, hogy egy interneten elérhető szolgáltatás forgalma biztonsági infrastruktúrán halad át.

- Figyelembe kell venni, hogy külső adatfeldolgozó és esetleges EGT-n kívüli adattovábbítás is megjelenik.

Garanciák:

- Adatfeldolgozó szerződéses és szolgáltatási keret igénybevétele.

- Kizárólag a Szolgáltatás nyújtásához és védelméhez szükséges technikai adatok kezelése.

- Az adatkezelési tájékoztatóban kifejezett tájékoztatás.

- Adattovábbítás esetén megfelelő garanciákra támaszkodás.

- Technikai és szervezési intézkedések alkalmazása.

- A biztonsági funkciókhoz kapcsolódó sütik használatának csak feltétlenül szükséges körre korlátozása.

**Következtetés:** az adatkezelés a célhoz szükséges és arányos, az Érintetti oldalon jelentkező többletkockázatokat a beépített garanciák megfelelően mérséklik, az Adatkezelő jogos érdeke elsőbbséget élvez az Érintettek korlátozott beavatkozással járó érdekeivel szemben. A jogalap alkalmazása indokolt.

### 5.4. OAuth2 bejelentkezési folyamat védelme ideiglenes állapot-sütivel

**Kezelt adatok:** rövid élettartamú, véletlenszerű állapotazonosító (`coursehub_oauth_state`), amely a bejelentkezést kezdeményező böngészőhöz kötődik.

**Cél:** annak biztosítása, hogy a külső azonosítótól (Google) visszaérkező callback-et csak az a böngésző tudja sikeresen lezárni, amely a bejelentkezést elindította. Login CSRF és jogosulatlan OAuth callback-kísérletek megelőzése.

**Megőrzési idő:** a callback lezárásáig, de legfeljebb 2 percig.

#### 5.4.1. Célteszt

Az Adatkezelő jogos érdeke, hogy:

- Megakadályozza, hogy egy támadó más böngészője által kezdeményezett vagy manipulált OAuth folyamatot egy Érintett böngészőjében fejezzen be.

- A külső hitelesítési folyamatot egyszerű, de hatékony, széles körben használt védelemmel lássa el.

Ez az érdek valós, jelenidejű, közvetlenül kapcsolódik a hitelesítési rendszer és a felhasználói fiókok védelméhez.

#### 5.4.2. Szükségességi teszt

Az adatkezelés szükséges, mert:

- A Google OAuth2 callback önmagában nem bizonyítja, hogy a bejelentkezést ugyanaz a böngésző indította el, amely a callback-et fogadja.

- Egy rövid élettartamú, véletlenszerű állapotérték hatékonyan és adattakarékosan köti össze a bejelentkezés indítását és lezárását.

- Kevésbé invazív alternatíva, amely ugyanezt a védelmi szintet biztosítja külön infrastruktúra nélkül, ésszerűen nem áll rendelkezésre.

A megoldás arányos, mert nem használ tartós azonosítót, nem követi a felhasználó viselkedését, és nem szolgál sem marketing-, sem analitikai célokat.

#### 5.4.3. Mérlegelési teszt

Az Érintettekre gyakorolt hatás minimális:

- A kezelt adat véletlenszerű technikai azonosító, amely önmagában nem alkalmas a felhasználó közvetlen azonosítására.

- A süti rövid élettartamú, egyszer használatos, és a callback ellenőrzése után törlésre kerül.

- Az adatkezelés észszerűen elvárható egy külső OAuth2 alapú bejelentkezési folyamat biztonságos működéséhez.

Garanciák:

- Szűk adatkör: kizárólag véletlenszerű állapotérték.

- Rövid megőrzési idő.

- `HttpOnly`, `SameSite=Lax`, `Secure` sütibeállítások.

- Kizárólag biztonsági célú felhasználás.

- Átlátható tájékoztatás az adatkezelési tájékoztatóban.

**Következtetés:** az Adatkezelő hitelesítési és fiókvédelmi érdeke erős, míg az Érintettek oldalán jelentkező többletbeavatkozás minimális és arányos. A jogos érdek jogalap alkalmazása indokolt.

### 5.5. Bejelentkezett felhasználók által létrehozott kurzuscsomagok kereshetővé és hozzáférhetővé tétele

**Kezelt adatok:** a kurzuscsomag neve, opcionális leírása, a csomaghoz rendelt kar és kurzusok listája, a csomag létrehozásához és kezeléséhez szükséges belső tulajdonosi kapcsolat, valamint a funkció működtetéséhez szükséges időbélyegek.

**Cél:** a bejelentkezett felhasználók számára olyan, mások által összeállított kurzuscsomagok elérhetővé tétele, amelyek újrafelhasználhatók (felvehetők), kereshetők és a szolgáltatás közösségi értékét növelik.

**Megőrzési idő:** a csomag felhasználó általi törléséig vagy a felhasználói fiók megszűnéséig.

#### 5.5.1. Célteszt

Az Adatkezelő jogos érdeke, hogy:

- A Szolgáltatást a pusztán egyéni preferenciatároláson túl közösségi hasznossággal bíró funkcióval bővítse.

- A meglévő kurzusadatbázisra építve többletértéket nyújtson anélkül, hogy a funkciót nyilvánosan, anonim látogatók felé tenné közzé.

Ez az érdek valós, jelenidejű, jogszerű és kellően konkrét. Ugyanakkor nem a Szolgáltatás legszűkebb értelemben vett alapfunkciója, ezért a szerződés teljesítésének jogalapja e mások felé történő hozzáférhetővé tételre önmagában nem elégséges.

#### 5.5.2. Szükségességi teszt

Az adatkezelés szükséges, mert:

- A funkció rendeltetése éppen az, hogy a felhasználó által létrehozott kurzuscsomagok más bejelentkezett felhasználók számára is megtalálhatók legyenek.

- Ha a csomagok kizárólag privát módon lennének tárolva, azzal a közösségi használhatóság és kereshetőség célja nem valósulna meg.

- A hozzáférhetőség korlátozott: a csomagok nem anonim nyilvánosság számára, hanem hitelesített felhasználói körben érhetők el.

- Az adatkör a célhoz képest szűk, és nincs szükség különleges adatok kezelésére.

Kevésbé invazív alternatíva lehetne a teljesen privát csomagkezelés vagy egy későbbi opt-in publikálás, ezek azonban eltérő termékdöntést jelentenének, és nem valósítanák meg a jelenlegi funkcióhoz tartozó közösségi kereshetőséget. A jelenlegi megoldás ezért a választott célhoz viszonyítva szükségesnek tekinthető.

#### 5.5.3. Mérlegelési teszt

Az Érintettekre gyakorolt hatás korlátozott, de nem elhanyagolható:

- A csomag neve, leírása és kurzuslistája közvetve utalhat az Érintett egyetemére, karára, tanulmányi irányára vagy érdeklődési körére. Az Érintett csak a belső ID-ja által azonosított.

- A kereshetőség nem teljesen váratlan, mert a funkció jellegéből következik, de erről az Érintetteket kifejezetten tájékoztatni kell.

- A hozzáférhetőség a bejelentkezett felhasználók körére korlátozódik, anonim külső nyilvánosság felé nem történik közzététel.

Garanciák:

- Adattakarékosság: nincs szükség a csomagtulajdonos közvetlen azonosító adatainak (pl. email cím) publikus megjelenítésére.

- Hozzáférés-korlátozás: csak hitelesített felhasználók érhetik el a csomagokat.

- Kontroll az Érintett oldalán: a csomag bármikor módosítható vagy törölhető.

- Átlátható tájékoztatás az adatkezelési tájékoztatóban.

- Tiltakozási jog biztosítása a GDPR 21. cikke alapján.

**Következtetés:** a közösségi kurzuscsomag-funkcióhoz fűződő jogos érdek fennáll, és megfelelő garanciák mellett elsőbbséget élvez az Érintettek korlátozott, kezelhető mértékű érdeksérelmével szemben. A GDPR 6. cikk (1) bekezdés f) pontja erre a szűk célra alkalmazható.

## 6. Összesített mérlegelési következtetés

Az Adatkezelő megállapítja, hogy a fenti adatkezelések esetén:

- A jogos érdek valós, pontosan meghatározott és jogszerű.

- Az adatkezelés szükséges a kitűzött célok eléréséhez.

- Nincs azonos hatékonyságú, érdemben kevésbé invazív alternatíva.

- Az Érintettek oldalán jelentkező kockázatok korlátozottak, jellemzően technikai jellegűek, és megfelelő garanciák mellett kezelhetők.

- Az Érintettek észszerűen számíthatnak az ilyen jellegű adatkezelésekre egy interneten elérhető alkalmazás működése során.

Ennek alapján a GDPR 6. cikk (1) bekezdés f) pontja a jelen dokumentumban felsorolt adatkezelések tekintetében megfelelő jogalap.

## 7. Alkalmazott garanciák összefoglalása

- Adattakarékosság és célhoz kötöttség.

- Megőrzési idő korlátozása.

- Hozzáférés-korlátozás.

- Anonimizálás, ahol alkalmazható.

- Külső adatfeldolgozó esetén megfelelő szerződéses és adatvédelmi garanciák.

- Átlátható tájékoztatás az adatkezelési tájékoztatóban.

- Rendszeres felülvizsgálat.

## 8. DPIA (Data Protection Impact Assessment) szükségessége

Jelen LIA alapján a vizsgált adatkezelések önmagukban nem minősülnek olyan, nagy valószínűséggel magas kockázatú műveleteknek, amelyek minden körülmények között külön adatvédelmi hatásvizsgálatot (DPIA) tennének szükségessé.

Új DPIA vagy a jelen LIA érdemi felülvizsgálata szükséges különösen akkor, ha:

- A naplózás köre érdemben bővül.

- Viselkedésfigyelés, profilalkotás vagy automatizált döntéshozatal jelenik meg.

- Nagyléptékű új analitika kerül bevezetésre.

- Különleges adatok kezelése rendszeressé válik.

- A megőrzési idő jelentősen nő.

- Új adatfeldolgozó vagy új, fokozott kockázatú adattovábbítási modell kerül bevezetésre.

## 9. Felülvizsgálati rend

A jelen LIA-t felül kell vizsgálni:

- Legalább évente egyszer.

- Az adatkezelési tájékoztató érdemi módosítása esetén.

- Új technológia, új adatfeldolgozó vagy új adatkezelési cél bevezetésekor.

- Biztonsági incidens vagy hatósági megkeresés esetén, ha az a jelen mérlegelés alapját érinti.

## 10. Eredmény

**Döntés:** a jelen dokumentumban vizsgált adatkezelések tekintetében a jogos érdek jogalap alkalmazása megfelelő és dokumentált.

**Feltétel:** az Adatkezelő köteles fenntartani a jelen dokumentumban rögzített garanciákat és az adatkezelési tájékoztatóban biztosítani az átlátható tájékoztatást.

## 11. Hivatkozások

- GDPR: <https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng>

- GDPR 21. cikk: <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679#d1e2502-1-1>

- EDPB Guidelines 1/2024 on processing of personal data based on Article 6(1)(f) GDPR: <https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2024/guidelines-12024-processing-personal-data-based_pl?page=0>

- ICO legitimate interests guidance: <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/legitimate-interests/how-do-we-apply-legitimate-interests-in-practice/>

- Cloudflare Data Privacy Framework: <https://www.cloudflare.com/cloudflare-customer-dpa/>

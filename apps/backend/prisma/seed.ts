/* eslint-disable no-console */
import 'dotenv/config';
import { type ClientPlatform, PrismaClient } from '../src/prisma/generated/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

async function main() {
  // Clean up all tables to prevent conflicts with existing data
  await prisma.user.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.university.deleteMany({});
  await prisma.coursePackage.deleteMany({});
  await prisma.clientPing.deleteMany({});

  // Seed univerities and faculties
  const universitiesData = [
    { name: 'Állatorvostudományi Egyetem', abbrevName: 'ÁTE', faculties: [] },
    { name: 'Budapesti Corvinus Egyetem', abbrevName: 'CORVINUS', faculties: [] },
    { name: 'Budapesti Gazdasági Egyetem', abbrevName: 'BGE', faculties: [] },
    {
      name: 'Budapesti Műszaki és Gazdaságtudományi Egyetem',
      abbrevName: 'BME',
      faculties: [
        { name: 'Villamosmérnöki és Informatikai Kar', abbrevName: 'VIK' },
        { name: 'Gazdaság- és Társadalomtudományi Kar', abbrevName: 'GTK' },
        { name: 'Természettudományi Kar', abbrevName: 'TTK' },
      ],
    },
    { name: 'Debreceni Egyetem', abbrevName: 'DE', faculties: [] },
    { name: 'Dunaújvárosi Egyetem', abbrevName: 'DUE', faculties: [] },
    { name: 'Eötvös Lóránd Tudományegyetem', abbrevName: 'ELTE', faculties: [] },
    { name: 'Károli Gáspár Református Egyetem', abbrevName: 'KRE', faculties: [] },
    { name: 'Magyar Agrár- és Élettudományi Egyetem', abbrevName: 'MATE', faculties: [] },
    { name: 'Milton Friedman Egyetem', abbrevName: 'MILTON', faculties: [] },
    { name: 'Miskolci Egyetem', abbrevName: 'ME', faculties: [] },
    { name: 'Moholy-Nagy Művészeti Egyetem', abbrevName: 'MOME', faculties: [] },
    { name: 'Nemzeti Közszolgálati Egyetem', abbrevName: 'NKE', faculties: [] },
    { name: 'Neumann János Egyetem', abbrevName: 'NJE', faculties: [] },
    { name: 'Óbudai Egyetem', abbrevName: 'ÓE', faculties: [] },
    { name: 'Pannon Egyetem', abbrevName: 'PE', faculties: [] },
    { name: 'Pázmány Péter Katolikus Egyetem', abbrevName: 'PPKE', faculties: [] },
    { name: 'Pécsi Tudományegyetem', abbrevName: 'PTE', faculties: [] },
    { name: 'Semmelweis Egyetem', abbrevName: 'SE', faculties: [] },
    { name: 'Széchenyi István Egyetem', abbrevName: 'SZE', faculties: [] },
    { name: 'Szegedi Tudományegyetem', abbrevName: 'SZTE', faculties: [] },
  ];

  const facultyRecord: Record<string, string> = {}; // facultyName -> facultyId

  for (const uni of universitiesData) {
    const createdUni = await prisma.university.upsert({
      where: { name: uni.name },
      update: { abbrevName: uni.abbrevName },
      create: { name: uni.name, abbrevName: uni.abbrevName },
    });

    for (const fac of uni.faculties) {
      const createdFaculty = await prisma.faculty.upsert({
        where: { name_universityId: { name: fac.name, universityId: createdUni.id } },
        update: { abbrevName: fac.abbrevName },
        create: {
          name: fac.name,
          abbrevName: fac.abbrevName,
          university: { connect: { id: createdUni.id } },
        },
      });
      facultyRecord[fac.name] = createdFaculty.id;
    }
  }

  // Seed courses
  const coursesData = [
    // GTK
    {
      facultyName: 'Gazdaság- és Társadalomtudományi Kar',
      name: 'Menedzsment és vállalkozásgazdaságtan',
      code: 'BMEGT20A001',
      credits: 4,
      coursePageUrl: '',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/GT20A001/',
      courseMoodleUrl: 'https://edu.gtk.bme.hu/course/view.php?id=11277',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Menedzsment_%C3%A9s_v%C3%A1llalkoz%C3%A1sgazdas%C3%A1gtan',
    },
    {
      facultyName: 'Gazdaság- és Társadalomtudományi Kar',
      name: 'Jogi alapismeretek',
      code: 'BMEGT55A405',
      credits: 3,
      coursePageUrl: '',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/GT55A405/',
      courseMoodleUrl: 'https://edu.gtk.bme.hu/course/view.php?id=11671',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Jogi_alapismeretek',
    },
    // TTK
    {
      facultyName: 'Természettudományi Kar',
      name: 'Analízis 1 informatikusoknak',
      code: 'BMETEMIBSVANL1-00',
      credits: 8,
      coursePageUrl: 'https://math.bme.hu/~tasnadi/merninf_anal_1/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/TEMIBSVANL1-00/',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Anal%C3%ADzis_I.',
    },
    {
      facultyName: 'Természettudományi Kar',
      name: 'Fizika alapismeretek',
      code: 'BMETE11AX52',
      credits: 4,
      coursePageUrl:
        'https://fizipedia.bme.hu/index.php/Fizika_alapismeretek_-_M%C3%A9rn%C3%B6k_informatikus_alapszak',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/TE11AX52/',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Fizikai_alapismeretek',
    },
    {
      facultyName: 'Természettudományi Kar',
      name: 'Analízis 2 informatikusoknak',
      code: 'BMETE90AX57',
      credits: 6,
      coursePageUrl: 'https://math.bme.hu/~tasnadi/merninf_anal_2/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/TE90AX57/',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Anal%C3%ADzis_II.',
    },
    {
      facultyName: 'Természettudományi Kar',
      name: 'Fizika i',
      code: 'BMETE11AX53',
      credits: 2,
      coursePageUrl:
        'https://fizipedia.bme.hu/index.php/Fizika_i_-_M%C3%A9rn%C3%B6k_informatikus_alapszak',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/TE11AX53/',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl:
        'https://fizipedia.bme.hu/index.php/Fizika_i_-_M%C3%A9rn%C3%B6k_informatikus_alapszak',
    },
    // VIK
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Szoftvertechnikák',
      code: 'BMEVIAUAB00',
      credits: 5,
      coursePageUrl: 'https://bmeviauab00.github.io/szoftvertechnikak/2024/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIAUAB00',
      courseMoodleUrl: 'https://edu.vik.bme.hu/course/view.php?id=15527',
      courseSubmissionUrl: '',
      courseTeamsUrl:
        'https://teams.microsoft.com/l/team/19%3Aiczgx62g0X6I7FYJ-p94XObEQYOn8hPjD_yIetaNzG81%40thread.tacv2/conversations?groupId=d30ec343-fe0b-44fc-b226-9f18e6992b4b&tenantId=6a3548ab-7570-4271-91a8-58da006970299',
      courseExtraUrl: 'https://vik.wiki/Szoftvertechnik%C3%A1k',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Bevezetés a számításelméletbe 1',
      code: 'BMEVISZAA06',
      credits: 5,
      coursePageUrl: 'https://cs.bme.hu/bsz1/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VISZAA06',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Bevezet%C3%A9s_a_sz%C3%A1m%C3%ADt%C3%A1selm%C3%A9letbe_I.',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'A programozás alapjai 1',
      code: 'BMEVIEEAA00',
      credits: 5,
      coursePageUrl: 'https://infoc.eet.bme.hu/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIEEAA00',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/A_programoz%C3%A1s_alapjai_I.',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Villamos alapismeretek',
      code: 'BMEVIETAA00',
      credits: 4,
      coursePageUrl: '',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIETAA00',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Villamos_alapismeretek',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Digitális technika',
      code: 'BMEVIMIAA03',
      credits: 5,
      coursePageUrl: 'https://www.mit.bme.hu/targyak/VIMIAA03',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIMIAA03',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Digit%C3%A1lis_technika',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Bevezetés a számításelméletbe 2',
      code: 'BMEVISZAA04',
      credits: 5,
      coursePageUrl: 'https://cs.bme.hu/bsz2/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VISZAA04',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Bevezet%C3%A9s_a_sz%C3%A1m%C3%ADt%C3%A1selm%C3%A9letbe_II.',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Algoritmuselmélet',
      code: 'BMEVISZAA08',
      credits: 4,
      coursePageUrl: 'https://www.cs.bme.hu/algel/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VISZAA08',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Algoritmuselm%C3%A9let',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Számítógép-architektúrák',
      code: 'BMEVIHIAA03',
      credits: 4,
      coursePageUrl: 'https://www.hit.bme.hu/~ghorvath/szgarch/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIHIAA03',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Sz%C3%A1m%C3%ADt%C3%B3g%C3%A9p_architekt%C3%BAr%C3%A1k',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Valószínűségszámítás és statisztika',
      code: 'BMEVISZAB04',
      credits: 6,
      coursePageUrl: 'https://www.cs.bme.hu/valszam/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VISZAB04',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl:
        'https://vik.wiki/Val%C3%B3sz%C3%ADn%C5%B1s%C3%A9gsz%C3%A1m%C3%ADt%C3%A1s_%C3%A9s_statisztika',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Kódolástechnika',
      code: 'BMEVIHIAB04',
      credits: 5,
      coursePageUrl: '',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIHIAB04',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/K%C3%B3dol%C3%A1stechnika',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Szoftvertechnológia',
      code: 'BMEVIMIAB04',
      credits: 5,
      coursePageUrl: 'https://www.mit.bme.hu/targyak/VIMIAB04',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIMIAB04',
      courseMoodleUrl: '',
      courseSubmissionUrl: '',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Szoftvertechnol%C3%B3gia',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'A programozás alapjai 2',
      code: 'BMEVIIIAA03',
      credits: 5,
      coursePageUrl: 'https://infocpp.iit.bme.hu/',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIIIAA03',
      courseMoodleUrl: '',
      courseSubmissionUrl: 'https://jporta.iit.bme.hu/home/',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/A_programoz%C3%A1s_alapjai_II.',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'A programozás alapjai 3',
      code: 'BMEVIIIAB00',
      credits: 6,
      coursePageUrl: 'https://www.iit.bme.hu/targyak/BMEVIIIAB00',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIIIAB00',
      courseMoodleUrl: '',
      courseSubmissionUrl: 'https://jporta.iit.bme.hu/home/',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/A_programoz%C3%A1s_alapjai_III.',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Operációs rendszerek',
      code: 'BMEVIMIAB03',
      credits: 4,
      coursePageUrl: 'https://www.mit.bme.hu/targyak/VIMIAB03',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIMIAB03',
      courseMoodleUrl: '',
      courseSubmissionUrl: 'https://hf.mit.bme.hu/hallgato',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Oper%C3%A1ci%C3%B3s_rendszerek',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Számítógépes grafika',
      code: 'BMEVIIIAB12',
      credits: 4,
      coursePageUrl: 'https://cg.iit.bme.hu/portal/szamitogepes-grafika',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIIIAB12',
      courseMoodleUrl: 'https://edu.vik.bme.hu/course/view.php?id=15953',
      courseSubmissionUrl: 'https://jporta.iit.bme.hu/home/',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Szoftver_projekt_laborat%C3%B3rium',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Kommunikációs hálózatok',
      code: 'BMEVITMAB06',
      credits: 7,
      coursePageUrl: '',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VITMAB06',
      courseMoodleUrl: 'https://edu.vik.bme.hu/course/view.php?id=16133',
      courseSubmissionUrl: 'https://edu.vik.bme.hu/course/section.php?id=235921',
      courseTeamsUrl:
        'https://teams.microsoft.com/l/team/19%3AkgRKnTInexVzVMoLtXq3Y27YB3y5lnZpI-RnOm8BPcs1%40thread.tacv2/conversations?groupId=cc009d19-69e4-4994-8e98-212befeb3e62&tenantId=6a3548ab-7570-4271-91a8-58da00697029',
      courseExtraUrl: 'https://vik.wiki/Kommunik%C3%A1ci%C3%B3s_h%C3%A1l%C3%B3zatok',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Szoftver projekt laboratórium',
      code: 'BMEVIIIAB11',
      credits: 4,
      coursePageUrl: 'https://www.iit.bme.hu/oktatas/tanszeki_targyak/BMEVIIIAB02',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIIIAB11',
      courseMoodleUrl: 'https://edu.vik.bme.hu/course/view.php?id=15959',
      courseSubmissionUrl: 'https://devil.iit.bme.hu:9181/hercules/start',
      courseTeamsUrl:
        'https://teams.microsoft.com/l/team/19%3A70wNZ11H1EYqZ2UgaG-ddekfDp_hlGhcbg4pLEYIuqo1%40thread.tacv2/conversations?groupId=f7d53815-1041-431e-b44d-66b3d4f9aff4&tenantId=6a3548ab-7570-4271-91a8-58da00697029',
      courseExtraUrl: 'https://vik.wiki/Szoftver_projekt_laborat%C3%B3rium',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Adatbázisok',
      code: 'BMEVITMAB04',
      credits: 4,
      coursePageUrl: 'https://www.db.bme.hu/adatbazisok',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VITMAB04',
      courseMoodleUrl: '',
      courseSubmissionUrl: 'https://fecske.db.bme.hu/#/student',
      courseTeamsUrl: '',
      courseExtraUrl: 'https://vik.wiki/Adatb%C3%A1zisok',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Blockchain technológiák és alkalmazások',
      code: 'BMEVIMIAV17',
      credits: 2,
      coursePageUrl: '',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIMIAV17/',
      courseMoodleUrl: 'https://edu.vik.bme.hu/course/view.php?id=15982',
      courseSubmissionUrl: '',
      courseTeamsUrl:
        'https://teams.microsoft.com/l/team/19%3AR9jEpp75TgxozRTwmpZWMHeuEXbi4g5OF4wqbfT8QwY1%40thread.tacv2/conversations?groupId=828aec23-6433-4431-bd7c-d4b663e67b75&tenantId=6a3548ab-7570-4271-91a8-58da00697029',
      courseExtraUrl:
        'https://vik.wiki/Blockchain_technol%C3%B3gi%C3%A1k_%C3%A9s_alkalmaz%C3%A1sok',
    },
    {
      facultyName: 'Villamosmérnöki és Informatikai Kar',
      name: 'Felhő alapú szoftverfejlesztés',
      code: 'BMEVIAUAV24',
      credits: 2,
      coursePageUrl: 'https://www.aut.bme.hu/Course/felho',
      courseTadUrl: 'https://portal.vik.bme.hu/kepzes/targyak/VIAUAV24',
      courseMoodleUrl: 'https://edu.vik.bme.hu/course/view.php?id=15442',
      courseSubmissionUrl: '',
      courseTeamsUrl:
        'https://teams.microsoft.com/l/team/19%3AKf4GVhdvC4Et_QDg_ginAy3i5SMzMD2PM13oXCfcASI1%40thread.tacv2/conversations?groupId=9b6cd92c-b1ec-468c-82ee-67b9b102a7be&tenantId=6a3548ab-7570-4271-91a8-58da00697029',
      courseExtraUrl: 'https://github.com/bmeaut/cloud/blob/master/hf.md',
    },
  ];

  const courseRecord: Record<string, string> = {}; // courseCode -> courseId

  for (const c of coursesData) {
    const facultyId = facultyRecord[c.facultyName];
    if (!facultyId) continue;

    const createdCourse = await prisma.course.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        credits: c.credits,
        coursePageUrl: c.coursePageUrl,
        courseTadUrl: c.courseTadUrl,
        courseMoodleUrl: c.courseMoodleUrl,
        courseSubmissionUrl: c.courseSubmissionUrl,
        courseTeamsUrl: c.courseTeamsUrl,
        courseExtraUrl: c.courseExtraUrl,
      },
      create: {
        name: c.name,
        code: c.code,
        credits: c.credits,
        faculty: { connect: { id: facultyId } },
        coursePageUrl: c.coursePageUrl,
        courseTadUrl: c.courseTadUrl,
        courseMoodleUrl: c.courseMoodleUrl,
        courseSubmissionUrl: c.courseSubmissionUrl,
        courseTeamsUrl: c.courseTeamsUrl,
        courseExtraUrl: c.courseExtraUrl,
      },
    });

    courseRecord[c.code] = createdCourse.id;
  }

  // Seed users
  const createUser = async (
    googleId: string,
    googleEmail: string,
    pinnedCourseCodes: string[] = [],
    isAdmin = false
  ) => {
    const validCodes = pinnedCourseCodes.filter((code) => courseRecord[code]);
    const pinnedConnect = validCodes.map((code) => ({ id: courseRecord[code] }));

    return prisma.user.upsert({
      where: { googleId },
      update: {
        googleEmail,
        isAdmin,
        pinnedCourses: { connect: pinnedConnect },
      },
      create: {
        googleId,
        googleEmail,
        isAdmin,
        pinnedCourses: { connect: pinnedConnect },
      },
    });
  };

  const adminUser = await createUser(
    'google-uid-admin', // will have to be overwritten with the real Google UID
    'szocsbarnabas8@gmail.com',
    ['BMEVIAUAB00', 'BMEVITMAB04', 'BMEVIMIAV17'],
    true
  );
  const user1 = await createUser('google-uid-1', 'john.doe@gmail.com', [
    'BMEVIEEAA00',
    'BMETEMIBSVANL1-00',
  ]);
  await createUser('google-uid-2', 'jane.smith@outlook.com', ['BMEGT20A001']);
  await createUser('google-uid-3', 'kovacs.istvan@freemail.hu', ['BMEVISZAA06', 'BMEVIMIAA03']);
  await createUser('google-uid-4', 'toth.gabor@yahoo.com');
  await createUser('google-uid-5', 'nemeth.anna@gmail.com', ['BMETE11AX52', 'BMETE90AX57']);
  await createUser('google-uid-6', 'horvath.peter@protonmail.com');

  // Seed course packages
  await prisma.coursePackage.create({
    data: {
      name: 'BME VIK Mérnökinformatikus 1. Félév',
      description: 'Alapozó tárgyak az első félévre.',
      isPermanent: true,
      owner: { connect: { id: adminUser.id } },
      faculty: { connect: { id: facultyRecord['Villamosmérnöki és Informatikai Kar'] } },
      courses: {
        connect: [
          { id: courseRecord['BMEVIEEAA00'] },
          { id: courseRecord['BMEVISZAA06'] },
          { id: courseRecord['BMEVIETAA00'] },
          { id: courseRecord['BMETEMIBSVANL1-00'] },
          { id: courseRecord['BMETE11AX52'] },
        ],
      },
    },
  });

  await prisma.coursePackage.create({
    data: {
      name: 'BME VIK Szoftverfejlesztés',
      description: 'Szoftveres irányultságú tárgyak gyűjteménye.',
      isPermanent: false,
      owner: { connect: { id: user1.id } },
      faculty: { connect: { id: facultyRecord['Villamosmérnöki és Informatikai Kar'] } },
      courses: {
        connect: [
          { id: courseRecord['BMEVIAUAB00'] },
          { id: courseRecord['BMEVIMIAB04'] },
          { id: courseRecord['BMEVIAUAV24'] },
          { id: courseRecord['BMEVIIIAB11'] },
        ],
      },
    },
  });

  // Seed suggested courses
  await prisma.suggestedCourse.upsert({
    where: { courseCode: 'OE-NIK-SZ1' },
    update: {},
    create: {
      userEmail: 'kovacs.istvan@freemail.hu',
      uniName: 'Óbudai Egyetem',
      uniAbbrevName: 'ÓE',
      facultyName: 'Neumann János Informatikai Kar',
      facultyAbbrevName: 'NIK',
      courseName: 'Szoftverfejlesztés',
      courseCode: 'OE-NIK-SZ1',
      coursePageUrl: 'https://nik.uni-obuda.hu/szoftverfejlesztes',
    },
  });

  await prisma.suggestedCourse.upsert({
    where: { courseCode: 'ELTE-IK-PROG1' },
    update: {},
    create: {
      userEmail: 'nemeth.anna@gmail.com',
      uniName: 'Eötvös Lóránd Tudományegyetem',
      uniAbbrevName: 'ELTE',
      facultyName: 'Informatikai Kar',
      facultyAbbrevName: 'IK',
      courseName: 'Programozási alapismeretek',
      courseCode: 'ELTE-IK-PROG1',
      courseTadUrl: 'https://elte.hu/ik/prog1',
    },
  });

  // Seed client pings
  const users = await prisma.user.findMany({ select: { id: true } });
  const platforms: ClientPlatform[] = ['windows', 'linux', 'macos', 'android', 'ios'];
  const today = new Date();
  const daysBack = 60;

  const pingsToInsert: {
    userId: string;
    date: Date;
    platform: ClientPlatform;
    version: string;
  }[] = [];

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)
    );

    for (const user of users) {
      if (Math.random() < 0.6) {
        const shuffled = [...platforms].sort(() => 0.5 - Math.random());
        const usedPlatforms = shuffled.slice(0, Math.ceil(Math.random() * 2));

        for (const platform of usedPlatforms) {
          pingsToInsert.push({
            userId: user.id,
            date,
            platform,
            version: '1.0.0',
          });
        }
      }
    }
  }

  const batchSize = 1000;
  for (let i = 0; i < pingsToInsert.length; i += batchSize) {
    await prisma.clientPing.createMany({
      data: pingsToInsert.slice(i, i + batchSize),
      skipDuplicates: true, // Prevents unique constraint failure on rerun
    });
  }

  console.log('Database seeding completed successfully.');
}

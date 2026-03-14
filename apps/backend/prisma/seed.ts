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
  const universities = [
    { name: 'Budapest University of Technology and Economics', abbrevName: 'BME' },
    { name: 'Eötvös Loránd University', abbrevName: 'ELTE' },
    { name: 'University of Szeged', abbrevName: 'SZTE' },
  ];

  const universityRecord: Record<string, string> = {};
  for (const uni of universities) {
    const createdUni = await prisma.university.upsert({
      where: { name: uni.name },
      update: {},
      create: uni,
    });
    universityRecord[uni.name] = createdUni.id;
  }

  const faculties = [
    {
      name: 'Faculty of Electrical Engineering and Informatics',
      universityName: 'Budapest University of Technology and Economics',
      abbrevName: 'VIK',
    },
    {
      name: 'Faculty of Mechanical Engineering',
      universityName: 'Budapest University of Technology and Economics',
      abbrevName: 'GPK',
    },
    { name: 'Faculty of Science', universityName: 'Eötvös Loránd University', abbrevName: 'TTK' },
    {
      name: 'Faculty of Humanities',
      universityName: 'Eötvös Loránd University',
      abbrevName: 'BTK',
    },
    { name: 'Faculty of Medicine', universityName: 'University of Szeged', abbrevName: 'ÁOK' },
    {
      name: 'Faculty of Law and Political Sciences',
      universityName: 'University of Szeged',
      abbrevName: 'ÁJK',
    },
  ];

  const facultyRecord: Record<string, string> = {};

  for (const f of faculties) {
    const uniId = universityRecord[f.universityName];

    const createdFaculty = await prisma.faculty.upsert({
      where: { name_universityId: { name: f.name, universityId: uniId } },
      update: {},
      create: {
        name: f.name,
        abbrevName: f.abbrevName,
        university: { connect: { id: uniId } },
      },
    });

    facultyRecord[f.name] = createdFaculty.id;
  }

  const courses = [
    {
      name: 'Introduction to Computer Engineering',
      code: 'CE101',
      facultyName: 'Faculty of Electrical Engineering and Informatics',
      urls: {
        coursePageUrl: 'https://bme.hu/ce101',
        courseTadUrl: 'https://tad.bme.hu/CE101',
        courseMoodleUrl: 'https://moodle.bme.hu/course/view.php?id=101',
        courseTeamsUrl: 'https://teams.microsoft.com/l/team/ce101',
        courseExtraUrl: 'https://github.com/bme-ce101',
      },
    },
    {
      name: 'Digital Systems',
      code: 'EE102',
      facultyName: 'Faculty of Electrical Engineering and Informatics',
      urls: {
        coursePageUrl: '',
        courseTadUrl: 'https://tad.bme.hu/EE102',
        courseMoodleUrl: '',
        courseTeamsUrl: 'https://teams.microsoft.com/l/team/ee102',
        courseExtraUrl: '',
      },
    },
    {
      name: 'Statics',
      code: 'ME101',
      facultyName: 'Faculty of Mechanical Engineering',
      urls: {
        coursePageUrl: 'https://mech.uni/ME101',
        courseTadUrl: '',
        courseMoodleUrl: 'https://moodle.uni/ME101',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      },
    },
    {
      name: 'Thermodynamics',
      code: 'ME102',
      facultyName: 'Faculty of Mechanical Engineering',
      urls: {
        coursePageUrl: '',
        courseTadUrl: 'https://tad.uni/ME102',
        courseMoodleUrl: '',
        courseTeamsUrl: 'https://teams.microsoft.com/l/team/me102',
        courseExtraUrl: 'https://wiki.uni/ME102',
      },
    },
    {
      name: 'Linear Algebra',
      code: 'MA101',
      facultyName: 'Faculty of Science',
      urls: {
        coursePageUrl: 'https://math.uni/MA101',
        courseTadUrl: '',
        courseMoodleUrl: 'https://moodle.uni/MA101',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      },
    },
    {
      name: 'Introduction to Physics',
      code: 'PH101',
      facultyName: 'Faculty of Science',
      urls: {
        coursePageUrl: '',
        courseTadUrl: '',
        courseMoodleUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      },
    },
    {
      name: 'Philosophy 101',
      code: 'HU101',
      facultyName: 'Faculty of Humanities',
      urls: {
        coursePageUrl: 'https://hum.uni/hu101?query=philosophy',
        courseTadUrl: 'https://tad.hum.uni/hu101',
        courseMoodleUrl: 'https://moodle.hum.uni/hu101',
        courseTeamsUrl: 'https://teams.microsoft.com/l/team/hu101',
        courseExtraUrl: 'https://wiki.hum.uni/hu101#section',
      },
    },
    {
      name: 'History of Literature',
      code: 'HU102',
      facultyName: 'Faculty of Humanities',
      urls: {
        coursePageUrl: '',
        courseTadUrl: '',
        courseMoodleUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      },
    },
    {
      name: 'Anatomy',
      code: 'MED101',
      facultyName: 'Faculty of Medicine',
      urls: {
        coursePageUrl: 'https://med.uni/MED101',
        courseTadUrl: '',
        courseMoodleUrl: 'https://moodle.med/MED101',
        courseTeamsUrl: 'https://teams.microsoft.com/l/team/med101',
        courseExtraUrl: '',
      },
    },
    {
      name: 'Physiology',
      code: 'MED102',
      facultyName: 'Faculty of Medicine',
      urls: {
        coursePageUrl: 'https://med.uni/MED102',
        courseTadUrl: 'https://tad.med/MED102',
        courseMoodleUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: 'https://github.com/med102',
      },
    },
    {
      name: 'Constitutional Law',
      code: 'LAW101',
      facultyName: 'Faculty of Law and Political Sciences',
      urls: {
        coursePageUrl: '',
        courseTadUrl: '',
        courseMoodleUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      },
    },
    {
      name: 'International Relations',
      code: 'LAW102',
      facultyName: 'Faculty of Law and Political Sciences',
      urls: {
        coursePageUrl: 'https://law.uni/LAW102',
        courseTadUrl: '',
        courseMoodleUrl: 'https://moodle.law.uni/LAW102',
        courseTeamsUrl: 'https://teams.microsoft.com/l/team/law102',
        courseExtraUrl: '',
      },
    },
  ];

  const courseRecord: Record<string, string> = {};

  for (const c of courses) {
    const facultyId = facultyRecord[c.facultyName];

    const createdCourse = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        name: c.name,
        code: c.code,
        faculty: { connect: { id: facultyId } },
        coursePageUrl: c.urls.coursePageUrl ?? '',
        courseTadUrl: c.urls.courseTadUrl ?? '',
        courseMoodleUrl: c.urls.courseMoodleUrl ?? '',
        courseTeamsUrl: c.urls.courseTeamsUrl ?? '',
        courseExtraUrl: c.urls.courseExtraUrl ?? '',
      },
    });

    courseRecord[c.code] = createdCourse.id;
  }

  const createUser = async (
    googleId: string,
    googleEmail: string,
    pinnedCourseCodes: string[] = [],
    isAdmin = false
  ) => {
    const pinnedConnect = pinnedCourseCodes.map((code) => ({ id: courseRecord[code] }));

    await prisma.user.create({
      data: {
        googleId,
        googleEmail,
        pinnedCourses: { connect: pinnedConnect },
        isAdmin,
      },
    });
  };

  // Example users
  await createUser('google-uid-1', 'user1@example.com', ['CE101', 'EE102']);
  await createUser('google-uid-2', 'user2@example.com', ['ME101']);
  await createUser('google-uid-3', 'user3@example.com');

  await createUser('google-uid-4', 'user4@example.com', ['MA101', 'PH101', 'HU101']);
  await createUser('google-uid-5', 'user5@example.com', ['HU102']);

  await createUser('google-uid-6', 'user6@example.com', ['MED101', 'MED102', 'LAW101'], true); // admin user
  await createUser('google-uid-7', 'user7@example.com');

  // Pings
  const users = await prisma.user.findMany({
    select: { id: true },
  });

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
      // Random chance user was active that day
      if (Math.random() < 0.6) {
        // Random number of platforms used that day (1–2)
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
      skipDuplicates: true,
    });
  }
}

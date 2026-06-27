import { saveStudentOnboarding } from "../src/lib/student-app";

async function main() {
  await saveStudentOnboarding({
    firstName: "Clement",
    lastName: "Demo",
    prepYear: 2,
    classId: "class-demo-ecg2",
    lv2Language: "ESPAGNOL",
    weekdayDailyHours: 3,
    weekendDailyHours: 5,
    weekdayStart: "18:00",
    weekdayEnd: "21:30",
    weekendStart: "09:30",
    weekendEnd: "14:30",
    sessionBlockMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 25,
    breakEveryBlocks: 2,
    energyLevel: "modere",
    bacAverage: 16,
    bacMention: "TB",
    subjectAssessments: {
      MATHS: 9,
      ESH: 11,
      HGG: 10,
      CG: 12,
      ANG: 13
    },
    bacSubjectAssessments: {
      MATHS: 15,
      ESH: 16,
      HGG: 14,
      CG: 17,
      ANG: 18
    },
    bceSchools: ["HEC", "ESSEC", "ESCP"],
    ecricomeSchools: ["NEOMA"]
  });

  console.log("ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

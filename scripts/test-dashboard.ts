import { getStudentDashboardData } from "../src/lib/student-app";

async function main() {
  const data = await getStudentDashboardData();
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

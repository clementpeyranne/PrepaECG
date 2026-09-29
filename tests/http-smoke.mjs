import assert from "node:assert/strict";
const base = process.env.PREPA_TEST_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local fixture server required");

async function login(email, password) {
  const html = await (await fetch(`${base}/login`)).text();
  const action = html.match(/name="(\$ACTION_ID_[^"]+)"/);
  assert.ok(action, "Formulaire de connexion serveur present");
  const data = new FormData();
  data.set(action[1], ""); data.set("email", email); data.set("password", password);
  const response = await fetch(`${base}/login`, { method: "POST", body: data, headers: { Origin: base }, redirect: "manual" });
  assert.equal(response.status, 303);
  assert.ok(!response.headers.get("location").startsWith("/login"));
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie?.includes("prepa_auth=v2."));
  return cookie.split(";")[0];
}

for (const [email, password, expectedCourse] of [
  ["student@example.test", "new-password-123", true],
  ["student-b@example.test", "test-password-123", false]
]) {
  const cookie = await login(email, password);
  const response = await fetch(`${base}/resources`, { headers: { Cookie: cookie } });
  assert.equal(response.status, 200);
  assert.equal((await response.text()).includes("Cours ESH"), expectedCourse);
  console.log(`PASS: connexion serveur et isolation des ressources pour ${email}`);
  if (expectedCourse) {
    for (const route of ["/dashboard", "/planning", "/flashcards", "/resources", "/essays", "/assistant", "/actualites", "/progress", "/onboarding"]) {
      const routeResponse = await fetch(base + route, { headers: { Cookie: cookie } });
      assert.equal(routeResponse.status, 200, `${route} doit etre accessible depuis le menu eleve`);
    }
    console.log("PASS: tous les onglets eleve sont accessibles");

    const planning = await fetch(`${base}/planning`, { headers: { Cookie: cookie } });
    assert.equal(planning.status, 200);
    const html = await planning.text();
    assert.ok(html.includes("Mon emploi du temps"));
    assert.ok(html.includes("Affichage du planning"));
    assert.equal((html.match(/<button[^>]+aria-label="Afficher /g) || []).length, 7);
    assert.ok(!html.includes("Blocs de la journee"));
    console.log("PASS: planning HTTP 200, selecteur de vue, sept jours et ancien panneau retire");

    const dashboard = await fetch(`${base}/dashboard`, { headers: { Cookie: cookie } });
    assert.equal(dashboard.status, 200);
    const dashboardHtml = await dashboard.text();
    const visibleDashboardHtml = dashboardHtml.replace(/<script[\s\S]*?<\/script>/g, "");
    assert.equal((visibleDashboardHtml.match(/Classement anonyme/g) || []).length, 1);

    const progress = await fetch(`${base}/progress`, { headers: { Cookie: cookie } });
    assert.equal(progress.status, 200);
    const progressHtml = await progress.text();
    assert.ok(!progressHtml.includes("Retours les plus utiles"));
    assert.ok(!progressHtml.includes(">Signal<"));
    assert.ok(!progressHtml.includes("Ajouter une note"));
    console.log("PASS: classement unique et anciens panneaux de progression retires");

    const teacherArea = await fetch(`${base}/teacher/grades`, { headers: { Cookie: cookie }, redirect: "manual" });
    assert.ok([303, 307, 308].includes(teacherArea.status));
    assert.equal(teacherArea.headers.get("location"), "/dashboard");
    console.log("PASS: un eleve ne peut pas ouvrir l'espace professeur");
  }
}
const teacher = await login("teacher@example.test", "test-password-123");
for (const route of ["/teacher/resources", "/teacher/resources/new", "/teacher/essays", "/teacher/grades", "/teacher/rubrics"]) {
  const response = await fetch(base + route, { headers: { Cookie: teacher } });
  assert.equal(response.status, 200);
  console.log(`PASS: ${route} HTTP 200`);
}
const studentArea = await fetch(`${base}/dashboard`, { headers: { Cookie: teacher }, redirect: "manual" });
assert.ok([303, 307, 308].includes(studentArea.status));
assert.equal(studentArea.headers.get("location"), "/teacher/resources");
console.log("PASS: un professeur est renvoye vers son espace dedie");
const page = await fetch(`${base}/forgot-password`, { headers: { Cookie: "prepa_auth=invalid" } });
assert.equal(page.status, 200);
assert.ok((await page.text()).includes("pas encore disponible"));
const rejected = await fetch(`${base}/api/uploads`, {
  method: "POST", headers: { Origin: "https://foreign.example.test", "Content-Type": "application/json" }, body: "{}"
});
assert.equal(rejected.status, 403);
console.log("PASS: ancien cookie sans crash, recuperation inactive explicite, origine etrangere refusee");

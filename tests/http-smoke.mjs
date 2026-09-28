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
}
const teacher = await login("teacher@example.test", "test-password-123");
for (const route of ["/teacher/resources", "/teacher/resources/new", "/teacher/essays"]) {
  const response = await fetch(base + route, { headers: { Cookie: teacher } });
  assert.equal(response.status, 200);
  console.log(`PASS: ${route} HTTP 200`);
}
const page = await fetch(`${base}/forgot-password`, { headers: { Cookie: "prepa_auth=invalid" } });
assert.equal(page.status, 200);
assert.ok((await page.text()).includes("pas encore disponible"));
const rejected = await fetch(`${base}/api/uploads`, {
  method: "POST", headers: { Origin: "https://foreign.example.test", "Content-Type": "application/json" }, body: "{}"
});
assert.equal(rejected.status, 403);
console.log("PASS: ancien cookie sans crash, recuperation inactive explicite, origine etrangere refusee");

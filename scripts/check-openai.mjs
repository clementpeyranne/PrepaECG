import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env"));

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const provider = process.env.AI_PROVIDER || "auto";

if (!apiKey) {
  console.error("OPENAI_API_KEY est vide dans .env.");
  process.exit(1);
}

if (provider === "local") {
  console.error('AI_PROVIDER vaut "local". Passe-le a "auto" pour activer OpenAI.');
  process.exit(1);
}

const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model,
    input: "Reponds uniquement par OK.",
    max_output_tokens: 20
  })
});

const payload = await response.json();

if (!response.ok) {
  console.error("Connexion OpenAI echouee.");
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

const outputText =
  typeof payload.output_text === "string" && payload.output_text.trim()
    ? payload.output_text.trim()
    : "Reponse recue, mais sans output_text simple.";

console.log(`Connexion OpenAI OK avec le modele ${model}.`);
console.log(`Reponse test : ${outputText}`);

import { createClient } from "@supabase/supabase-js";
import { loadMergedEnv } from "./load-env-files.mjs";

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};

const supabaseUrl = (env.SUPABASE_URL || "").trim();
const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const bucket = (env.SUPABASE_STORAGE_BUCKET || "prepa-files").trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const { data: buckets, error: listError } = await client.storage.listBuckets();

if (listError) {
  console.error(`Impossible de lire les buckets Supabase : ${listError.message}`);
  process.exit(1);
}

const alreadyExists = buckets.some((entry) => entry.name === bucket);

if (!alreadyExists) {
  const { error: createError } = await client.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: "50MB"
  });

  if (createError) {
    console.error(`Creation du bucket impossible : ${createError.message}`);
    process.exit(1);
  }
}

console.log(`Bucket Supabase pret : ${bucket}`);

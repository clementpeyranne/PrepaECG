import { NextResponse } from "next/server";

import { getRuntimeStatus } from "@/lib/runtime-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtimeStatus = await getRuntimeStatus();

  return NextResponse.json(runtimeStatus, {
    status: runtimeStatus.status === "fail" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

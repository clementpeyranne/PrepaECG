import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 30%, rgba(201,107,74,0.75), transparent 35%), linear-gradient(135deg, #14221d 0%, #21493d 55%, #1a2f29 100%)",
          color: "#f7f1e7",
          fontSize: 84,
          fontWeight: 700,
          borderRadius: 46
        }}
      >
        ECG
      </div>
    ),
    {
      width: 180,
      height: 180
    }
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF9F0",
          fontSize: 72,
          fontWeight: 800,
        }}
      >
        🔁 LexiLoop
      </div>
    ),
    { ...size },
  );
}

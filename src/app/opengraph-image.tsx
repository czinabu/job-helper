import { ImageResponse } from "next/og";

export const alt = "Rolevisor: tailor your resume to any job";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0f0f10",
          color: "#ededed",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, color: "#6b8cff" }}>Rolevisor</div>
        <div style={{ fontSize: 48, marginTop: 24 }}>Tailor your resume to any job.</div>
        <div style={{ fontSize: 32, marginTop: 24, color: "#a0a0a0" }}>
          Resume tailoring, role matches and cover letters, with Claude or a free local model.
        </div>
      </div>
    ),
    size,
  );
}

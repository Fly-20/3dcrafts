import { ImageResponse } from "next/og";

export function createSocialImage(size: { width: number; height: number }) {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f2f0e8", color: "#11120f", padding: "72px 84px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, fontWeight: 700, letterSpacing: "0.08em" }}>
        <span>3DCRAFTS</span>
        <span style={{ color: "#65740c", fontSize: 20, fontWeight: 500 }}>EDINBURGH, SCOTLAND</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 84, lineHeight: 1.02, letterSpacing: "-0.055em", fontWeight: 600 }}>Ideas, made physical.</span>
        <span style={{ marginTop: 28, fontSize: 30, color: "#55564f" }}>Custom 3D printing, laser cutting &amp; engraving</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px solid rgba(17,18,15,.25)", paddingTop: 26, fontSize: 22 }}>
        <span>Prototypes · small batches · bespoke objects</span>
        <span style={{ background: "#c8ff32", padding: "12px 20px", fontWeight: 700 }}>3DCRAFTS.UK</span>
      </div>
    </div>,
    size,
  );
}

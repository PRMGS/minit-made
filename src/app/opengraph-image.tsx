import { ImageResponse } from "next/og";

export const alt = "Minit Made — your moment, filmed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated rather than shipped as a file, so the card can never drift from the
 * brand and there's no binary to keep in the repo. A shared link previously
 * rendered as a bare URL with no image at all.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background:
            "radial-gradient(ellipse 80% 60% at 25% 20%, rgba(255,215,0,0.14), transparent 60%), #000000",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: "-4px",
            color: "#f5f5f5",
          }}
        >
          MINIT&nbsp;<span style={{ color: "#ffd700" }}>MADE</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: "#d4d4d4", maxWidth: 900, lineHeight: 1.3 }}>
          Show up, do your thing, walk away with real footage.
        </div>
        <div
          style={{
            marginTop: 44,
            display: "flex",
            gap: 18,
            fontSize: 22,
            color: "#8a8a8a",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          <span>Hanging Mic</span><span>·</span>
          <span>Running Gun</span><span>·</span>
          <span>Mic&apos;d Up Cypher</span><span>·</span>
          <span>City on Fire</span>
        </div>
      </div>
    ),
    size
  );
}

import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { waveformBars } from "@/lib/waveform";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social card carries the same two marks as the site: the name in a didone,
 * and the waveform as its baseline.
 */
export default function OpenGraphImage() {
  const bars = waveformBars(site.name, 72);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#16110f",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#d14b32",
            }}
          />
          <div
            style={{
              color: "#a2938a",
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Podcast
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#f2ebe2", fontSize: 128, lineHeight: 1 }}>
            {site.name}
          </div>
          <div
            style={{
              color: "#cdc2b7",
              fontSize: 34,
              marginTop: 24,
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            {site.tagline}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 88 }}>
          {bars.map((value, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(4, value * 100)}%`,
                background: i < bars.length * 0.42 ? "#e8b04b" : "#453733",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}

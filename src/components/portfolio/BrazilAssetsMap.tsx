import { useState } from "react";
import { BR_VIEWBOX, BR_STATES } from "@/lib/brazil-map";

export interface AssetPoint {
  id: string;
  name: string;
  state: string; // sigla UF
}

interface Props {
  assets: AssetPoint[];
  onAssetClick?: (a: AssetPoint) => void;
}

// Palette inspired by VILG11 reference
const PALETTE = [
  "#1E2A78", "#22B6F0", "#0B4F8A", "#1763C8", "#1A56A8",
  "#2D7AD9", "#0E5266", "#0B6E7F", "#0E7C8C", "#2DB07A", "#5BC773",
];

const BrazilAssetsMap = ({ assets, onAssetClick }: Props) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  // States that have at least one asset → painted
  const assetStates = new Set(assets.map((a) => a.state));

  // Group assets by state for coloring
  const stateColor = (sigla: string) => {
    if (!assetStates.has(sigla)) return "hsl(var(--muted))";
    // Pick a palette color based on the first asset of that state
    const idx = assets.findIndex((a) => a.state === sigla);
    return PALETTE[idx % PALETTE.length];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 items-center">
      {/* Asset list */}
      <div className="space-y-2">
        {assets.map((a, i) => {
          const color = PALETTE[i % PALETTE.length];
          const isHover = hoveredAsset === a.id || hoveredState === a.state;
          return (
            <button
              key={a.id}
              onMouseEnter={() => setHoveredAsset(a.id)}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => onAssetClick?.(a)}
              className={`w-full text-left px-4 py-2.5 rounded-full text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md ${isHover ? "scale-[1.02] ring-2 ring-foreground/20" : ""}`}
              style={{ backgroundColor: color }}
            >
              {a.name}
              <span className="ml-2 opacity-75 text-xs font-normal">{a.state}</span>
            </button>
          );
        })}
      </div>

      {/* SVG map */}
      <div className="relative">
        <p className="text-center text-sm text-muted-foreground mb-2">
          Clique no estado para visualizar mais informações do ativo
        </p>
        <svg
          viewBox={BR_VIEWBOX}
          className="w-full h-auto max-h-[480px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {BR_STATES.map((s) => {
            const hasAsset = assetStates.has(s.sigla);
            const fill = stateColor(s.sigla);
            const isHover = hoveredState === s.sigla;
            return (
              <path
                key={s.sigla}
                d={s.d}
                fill={fill}
                stroke="#fff"
                strokeWidth={1}
                opacity={isHover ? 1 : hasAsset ? 0.95 : 0.55}
                style={{ cursor: hasAsset ? "pointer" : "default", transition: "opacity 0.2s" }}
                onMouseEnter={() => hasAsset && setHoveredState(s.sigla)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => {
                  if (!hasAsset) return;
                  const asset = assets.find((a) => a.state === s.sigla);
                  if (asset) onAssetClick?.(asset);
                }}
              >
                <title>{s.sigla}{hasAsset ? ` — ${assets.filter(a => a.state === s.sigla).map(a => a.name).join(", ")}` : ""}</title>
              </path>
            );
          })}
          {/* State labels for highlighted states */}
          {BR_STATES.filter((s) => assetStates.has(s.sigla)).map((s) => {
            // crude centroid from path d
            const nums = s.d.match(/-?\d+\.?\d*/g)?.map(Number) || [];
            const xs: number[] = [], ys: number[] = [];
            for (let i = 0; i < nums.length - 1; i += 2) {
              xs.push(nums[i]); ys.push(nums[i + 1]);
            }
            const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
            const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
            return (
              <text
                key={`label-${s.sigla}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="700"
                fill="#fff"
                pointerEvents="none"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
              >
                {s.sigla}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default BrazilAssetsMap;

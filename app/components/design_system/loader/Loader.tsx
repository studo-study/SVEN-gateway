// Transitions.dev — Matrix dot loader (React, self-contained)
// Drop into any React project — no extra CSS file needed.

// ── Styles ──────────────────────────────────────────────
// Auto-injected on first import. Idempotent (guarded by
// the element id) and SSR-safe (no-ops without document).
const __TRANSITION_STYLES = `
:root {
  --matrix-cycle: 1200ms;
  --matrix-base: var(--color-blue-600);
  --matrix-active: var(--color-blue-300);
  --matrix-ease: ease-in-out;
}

.t-matrix {
  display: grid;
  grid-template-columns: repeat(4, 2px);
  grid-auto-rows: 2px;
  gap: 2px;
}
.t-matrix i {
  display: block;
  background: var(--matrix-base);
  animation: t-matrix-pulse var(--matrix-cycle) var(--matrix-ease) infinite;
  animation-delay: calc(var(--d, 0) * 1ms);
}
/* Hole positions (rounded variants) render nothing. */
.t-matrix i.is-gap { visibility: hidden; animation: none; }
@keyframes t-matrix-pulse {
  0%, 45%, 100% { background-color: var(--matrix-base); }
  15%           { background-color: var(--matrix-active); }
}

@media (prefers-reduced-motion: reduce) {
  .t-matrix i { animation: none !important; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("transitions-p33")) {
    const __style = document.createElement("style");
    __style.id = "transitions-p33";
    __style.textContent = __TRANSITION_STYLES;
    document.head.appendChild(__style);
}

// Pair with the CSS from the CSS tab. Sixteen 2px dots share one
// colour-pulse keyframe; the variant is just a per-dot delay table into
// that cycle. `cycle` must match --matrix-cycle (1200ms by default).
const CORNERS = [0, 3, 12, 15];
// Clockwise perimeter (corner-less ring), then centre cells.
const RING = [1, 2, 7, 11, 14, 13, 8, 4];
const INNER = [5, 6, 9, 10];
const TWINKLE = [7, 2, 11, 5, 14, 9, 0, 12, 3, 15, 6, 10, 13, 1, 8, 4];


export type MatrixVariants = "scan" | "twinkle" | "orbit"

interface IMatrixLoaderProps {
    variant?: MatrixVariants;
    rounded?: boolean;
    cycle?: number;
    label?: string;
}
export const MatrixLoader: React.FC<IMatrixLoaderProps> = (props ) => {
    const { variant = "scan", rounded = false, cycle = 1200, label = "Loading" } = props;

    function delayFor(variant: MatrixVariants, idx: number, cycle: number) {
        const col = idx % 4;
        if (variant === "scan") return Math.round(col * (cycle / 10));
        if (variant === "twinkle") return Math.round(TWINKLE[idx] * (cycle / 16));
        if (variant === "orbit") {
            const k = RING.indexOf(idx);
            return k === -1 ? null : Math.round(k * (cycle / 8)); // null: centre holds steady
        }
        if (variant === "pulse") return Math.round((INNER.includes(idx) ? 0 : 1) * (cycle * 0.16));
        return 0;
    }

    return (
        <div className="t-matrix" data-variant={variant} role="status" aria-label={label}>
            {Array.from({ length: 16 }, (_, idx) => {
                if (rounded && CORNERS.includes(idx)) return <i key={idx} className="is-gap" />;
                const d = delayFor(variant, idx, cycle);
                // @ts-ignore
                return <i key={idx} style={d === null ? { animation: "none" } : { "--d": d }} />;
            })}
        </div>
    );
}

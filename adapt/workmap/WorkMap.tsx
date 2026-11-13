"use client";

// The work map: a tool run drawn as an OpenIntelligentUI-style diagram.
// One card per step in time order, colored by the kind of work (the fork's
// color-ramp classes), joined by leader lines. Running cards pulse; selecting
// one opens the run and jumps to that step.
import type { TranscriptItem } from "@/lib/transcript";

type ToolItem = Extract<TranscriptItem, { kind: "tool" }>;

const NODE_W = 92;
const NODE_H = 28;
const GAP_X = 16;
const GAP_Y = 14;
const PER_ROW = 6;
const PAD = 4;

// OpenIntelligentUI color ramps (packages/design-system/src/index.ts), remapped
// onto the .workmap tokens in globals.css so app themes stay in control.
const KIND_RAMP: { re: RegExp; ramp: string }[] = [
  { re: /^(bash|shell|exec|terminal|command)/i, ramp: "blue" },
  { re: /^(read|glob|grep|find|ls|search|view|inspect)/i, ramp: "teal" },
  { re: /^(write|edit|multi_?edit|str_?replace|patch|create|notebook)/i, ramp: "amber" },
  { re: /^(web|fetch|browser|http|task|agent|team)/i, ramp: "purple" },
];

function rampFor(tool: ToolItem): string {
  if (tool.state === "error") return "red";
  if (tool.state === "stopped") return "gray";
  return KIND_RAMP.find((kind) => kind.re.test(tool.name))?.ramp ?? "gray";
}

function nodeAt(index: number) {
  const row = Math.floor(index / PER_ROW);
  const col = index % PER_ROW;
  return { x: PAD + col * (NODE_W + GAP_X), y: PAD + row * (NODE_H + GAP_Y) };
}

const STATE_LABEL = { running: "Running", done: "Done", error: "Failed", stopped: "Stopped" } as const;

export function WorkMap({ tools, highlight, onSelect }: { tools: ToolItem[]; highlight: string | null; onSelect: (key: string) => void }) {
  const rows = Math.ceil(tools.length / PER_ROW);
  const cols = Math.min(PER_ROW, tools.length);
  const width = PAD * 2 + cols * NODE_W + (cols - 1) * GAP_X;
  const height = PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y;
  return (
    <div className="workmap overflow-x-auto pb-1" role="group" aria-label={`Work map: ${tools.length} steps in order`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="min-w-full" aria-hidden="false">
        {/* Leader lines between consecutive steps, drawn under the cards. */}
        {tools.slice(1).map((tool, i) => {
          const prev = nodeAt(i);
          const here = nodeAt(i + 1);
          const d =
            prev.y === here.y
              ? `M ${prev.x + NODE_W} ${prev.y + NODE_H / 2} H ${here.x}`
              : `M ${prev.x + NODE_W / 2} ${prev.y + NODE_H} V ${here.y + NODE_H / 2} H ${here.x + NODE_W / 2}`;
          return <path key={`lead-${tool.key}`} d={d} fill="none" stroke="var(--oi-lead)" strokeWidth={1} strokeDasharray="4 4" />;
        })}
        {tools.map((tool, i) => {
          const { x, y } = nodeAt(i);
          const ramp = rampFor(tool);
          const label = tool.name.length > 11 ? `${tool.name.slice(0, 10)}…` : tool.name;
          const selected = highlight === tool.key;
          return (
            <g
              key={tool.key}
              className={`wm-node${tool.state === "running" ? " wm-live" : ""}`}
              style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}
              role="button"
              tabIndex={0}
              aria-label={`${tool.name}: ${STATE_LABEL[tool.state]}${tool.summary ? `. ${tool.summary}` : ""}`}
              onClick={() => onSelect(tool.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(tool.key);
                }
              }}
            >
              <title>{`${tool.name} · ${STATE_LABEL[tool.state]}${tool.summary ? ` · ${tool.summary}` : ""}`}</title>
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill={`var(--oi-${ramp}-bg)`}
                stroke={selected ? "var(--focus)" : `var(--oi-${ramp}-line)`}
                strokeWidth={selected ? 2.5 : 1}
              />
              <text x={x + 10} y={y + NODE_H / 2 + 3.5} fontSize={11} fontFamily="var(--font-mono)" fill={`var(--oi-${ramp}-text)`}>
                {label}
              </text>
              {tool.state === "running" && <circle cx={x + NODE_W - 9} cy={y + NODE_H / 2} r={2.5} fill={`var(--oi-${ramp}-text)`} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

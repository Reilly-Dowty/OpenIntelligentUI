# Work map — adapting OpenIntelligentUI's diagram language to a coding-agent chat

This branch carries the adaptation we built for **Open Duet** (a local coding-agent
chat UI, Next.js + Tailwind): the design system's color-ramp diagram vocabulary
(`packages/design-system/src/index.ts`: `.c-blue .c-teal …`, `.box .node .arr .leader`)
becomes an in-transcript visualization of the agent's own tool calls.

## What it shows

When an agent runs a batch of shell/read/write/web tool calls, the chat folds them
into one "Working · N tool calls" group. Inside the group, the work map draws every
step as a diagram card in time order:

- one rounded card per step, colored by the kind of work (blue = shell, teal =
  read/search, amber = write/edit, purple = web/agents, red = failed, gray = stopped)
- dotted leader lines join consecutive steps (the `.leader` pattern)
- running cards pulse; completed cards stand still
- selecting a card (mouse or keyboard) opens the matching step below and flashes it

## Files

- `WorkMap.tsx` — the React component (SVG, no dependencies). Written for a chat
  transcript (`TranscriptItem` union), so the data types are Open Duet's; the visual
  layer is 100% this design system's vocabulary.
- `workmap.css` — the `.workmap` token block. It re-declares the design system's
  light and dark ramp values as CSS variables scoped to the widget, then overrides
  them per host app theme. Porting to the app's own theme: keep the light block,
  drop the `[data-theme=…]` overrides.

## Integration sketch (host side)

```tsx
<details>{/* the folded tool-run group */}
  <WorkMap tools={tools} highlight={selectedKey} onSelect={jumpToStep} />
  {/* then the plain per-step rows, as before */}
</details>
```

Accessibility: every card is a focusable button with a full `aria-label`
(name, state, summary); entrance and pulse animations honor
`prefers-reduced-motion`; colors carry meaning but are paired with text labels.

# Local-markdown issue tracker (build tickets)

Same convention as the portfolio repo's tracker. The wayfinder **map** for
this effort lives in the portfolio repo —
[An atlas drawn from memory](../../portfolio/tracker/map-pixel-atlas.md) —
with all design decisions in its Decisions-so-far. This tracker holds only
the **build milestone tickets**, moved here at Ignas's request so the work
ships next to the code.

- Tickets are `tickets/NNN-slug.md` with the same frontmatter convention
  (`title`, `label`, `status`, `assignee`, `blocked-by`).
- `map:` points at the portfolio repo's map file.
- m0 (provisioning: GitHub repo publication, Vercel, DNS) is tracked in the
  portfolio tracker as ticket 019 and blocks m2's deploy step, not m1.

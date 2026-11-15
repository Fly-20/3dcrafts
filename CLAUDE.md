@AGENTS.md

## Business planning docs (shared memory across sessions)

Each Claude session works on **one workstream**. Read the backlog first, then only the doc for your workstream. When a task's status changes, update the backlog so other sessions see it.

| Doc | What it holds | Used by |
|---|---|---|
| `3d-crafts-action-backlog.md` | **Single to-do list**: every task, owner, priority, due date | every session |
| `3d-crafts-hq-technical-brief.md` | HQ system design, pricing engine, goals and targets, risks, build rules | HQ build, website & ops, Product Lab, business admin |
| `3d-crafts-marketing-plan.md` | 90-day plan, weekly sessions, scorecard, hooks, SEO and Google Business Profile | weekly sessions, marketing |
| `3d-crafts-platform-vision-roadmap.md`, `3d-crafts-phase1-technical-plan.md` | Original website vision and Phase 1 build record | reference |

Rules that apply in every session:
- Nothing is sent to a customer or posted publicly without the owner's approval.
- Never steer Etsy buyers off Etsy (no website links or discounts in Etsy messages).
- Pricing uses the engine and settings in the brief §9 (labour/design £15/h, VAT 20% registered).
- Weekly session notes and scorecards go in `planning/weekly/YYYY-MM-DD.md`.

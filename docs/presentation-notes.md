# FRCS — Speaker notes & demo checklist

Use with **`docs/presentation.html`** (open in a browser; advance with arrow keys or click left/right of the screen).

---

## Before the session

- [ ] `npm install` at repo root (once)
- [ ] `npm run seed` so airports / conflicts / NOTAMs exist
- [ ] `npm run dev` — confirm Vite URL and that the **advisories** sidebar populates
- [ ] Second window: presentation deck, **fullscreen** (F11) if presenting

---

## Suggested timing (~10–12 min)

| Segment        | Deck slides | Time   |
|----------------|------------|--------|
| Intro + problem | 1–3    | 2–3 min |
| Architecture    | 4      | 1 min   |
| Live demo       | 5–8    | 5–7 min |
| Limitations + Q&A | 9–10 | 2 min   |

---

## Talking points (concise)

1. **Title** — FRCS is a *decision-support style* scanner: map + scored routes + risk factors + advisories, not a dispatch system.

2. **Problem** — Airlines and corporate travel risk care about *explainability*: why this route might be sensitive this week, beyond “draw a line.”

3. **Capabilities** — Call out the **three panels**: main scanner, risk breakdown, live advisory stream; then the **two tabs** for deeper views.

4. **Stack** — Fastify + SQLite + Lit keeps the demo self-contained; seed script makes offline demos reliable.

5. **Demo** — Prefer **JFK → LHR** or **TLV → DXB** so you never hit “airport not found.” Mention that coverage is seed-limited.

6. **Results** — Click a **secondary route card** to show map + zone emphasis updating; read **one sentence** from the reasoning field.

7. **Limitations** — Sample data, not certified; sets expectations for technical audiences.

---

## If something breaks during demo

- Sidebar empty → backend not on **3001** or proxy/Vite config not used (run dev from root; frontend uses root `vite.config.ts`).
- Scan 404 “airport not found” → code not in seed; pick another pair from `packages/backend/src/db/seed.ts`.
- Map blank → ensure dev build includes Leaflet CSS in app shell (recent fix); hard refresh.

---

## Optional: embed live app (advanced)

If both run locally, you can duplicate the last slide in the HTML deck and add:

```html
<iframe src="http://localhost:5173" title="FRCS" style="width:100%;height:70vh;border:1px solid #333;border-radius:8px;margin-top:1rem"></iframe>
```

Only use while `npm run dev` is running; adjust port if Vite chooses another.

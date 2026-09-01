# Contract fixtures

Written by `tests/contract.test.ts` from live dev calls as the QA user — the exact JSON the endpoints return, so the
Flutter parsers (`lib/features/meal_planning/domain/`) are tested against real wire shapes, not hand-typed ones.

| File | Wire | Shape |
|---|---|---|
| `opener.json` | `POST /api/vana/chat-ndjson {kind:'meal_planning', opener:true}` | `{status, headers, lines[]}` — the NDJSON lines (`status` · `ui` · `text` · `done`) |
| `general_turn.json` | `POST /api/vana/chat-ndjson {kind:'general', message}` | same envelope |
| `meal_picker.json` · `choices.json` · `day_guidance.json` · `staples.json` · `shopping_list.json` | one `VanaPart` each | `contracts.ts` `VanaPart` |
| `batch.json` · `confirm_plan.json` · `home.json` · `meal_detail.json` · `meal_detail_saved.json` · `recent_meals.json` | `POST /api/vana/action` results | `{parts: VanaPart[], ...extras}` |

Regenerate: `pnpm test` (needs `packages/web/.env.local`). Contents drift with the library and the QA user's data; the
shapes are what is frozen (`contract-v1`).

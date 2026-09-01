# Content data for the meal-library pipeline

Inputs and outputs of the one-shot scripts in `../scripts/`. The schema these assume lives in the
Flutter repo: `mealvana_endurance/supabase/migrations/20260827090000_meal_planning_vana.sql` through
`20260901160000_meal_image_licensing.sql` (all applied to the dev project). The research/provenance
behind the two libraries stays in `mealvana_endurance/docs/new_mealplanning/`.

| File | Produced by | Consumed by |
|---|---|---|
| `meal-library-400.json` | research (docs/new_mealplanning) | `seed_meal_library.mjs` (kind by heuristic) |
| `assembly-library.json` | research (docs/new_mealplanning) | `seed_meal_library.mjs` (kind = assembly) |
| `source-scrape.json` | `fetch_recipe_sources.mjs` (raw pages cached in `../.cache/`, ignored) | `apply_source_scrape.mjs`, `export_direction_batches.mjs` |
| `direction-batches/` | `export_direction_batches.mjs` | agent runs that write `direction-results/` |
| `direction-results/` | agent runs | `apply_agent_directions.mjs` |
| `meal-images.json` | `find_meal_images.mjs` (Wikimedia Commons) | report only |
| `recipe-steps.json` (absent) | hand/agent-written `[{id, steps[]}]` | `backfill_recipe_steps.mjs` |

Every script takes `--env <file>` (default `packages/web/.env.local`) and `--dry`.

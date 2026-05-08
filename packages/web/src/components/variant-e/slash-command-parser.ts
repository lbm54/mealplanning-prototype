/**
 * slash-command-parser.ts — parse slash commands in the composer.
 *
 * Design source: 07_parallel_build_plans.md §6 (1.E.7)
 *
 * Supported commands:
 *   /swap [day] [slot]   → send a structured swap request
 *   /lock [day] [slot]   → send a structured lock request
 *   /why [day]           → ask Jade to explain a specific day
 *
 * Returns a structured message or null if not a slash command.
 * Parsed commands translate to natural-language messages — no extra LLM round-trip.
 */

export type SlashCommand =
  | { type: "swap"; day: string; slot: string }
  | { type: "lock"; day: string; slot: string }
  | { type: "why"; day: string };

const DAY_ALIASES: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

const SLOT_ALIASES: Record<string, string> = {
  b: "breakfast", breakfast: "breakfast",
  l: "lunch", lunch: "lunch",
  d: "dinner", dinner: "dinner",
  s: "snack", snack: "snack",
  pre: "pre-workout", "pre-workout": "pre-workout", preworkout: "pre-workout",
  post: "post-workout", "post-workout": "post-workout", postworkout: "post-workout",
  during: "during-workout", "during-workout": "during-workout",
};

function resolveDay(raw: string): string {
  return DAY_ALIASES[raw.toLowerCase()] ?? raw;
}

function resolveSlot(raw: string): string {
  return SLOT_ALIASES[raw.toLowerCase()] ?? raw;
}

/**
 * Parse a message for slash commands.
 * Returns a human-readable expanded message if it's a slash command.
 * Returns null if it's not a slash command (regular chat).
 */
export function parseSlashCommand(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case "/swap": {
      const day = parts[1] ? resolveDay(parts[1]) : "today";
      const slot = parts[2] ? resolveSlot(parts[2]) : "lunch";
      return `Swap ${day} ${slot} for something different.`;
    }
    case "/lock": {
      const day = parts[1] ? resolveDay(parts[1]) : "today";
      const slot = parts[2] ? resolveSlot(parts[2]) : "dinner";
      return `Lock ${day} ${slot} — keep it as-is when regenerating.`;
    }
    case "/why": {
      const day = parts[1] ? resolveDay(parts[1]) : "today";
      return `Why did you plan ${day} this way? Explain the macro targets and training context.`;
    }
    default:
      // Unknown slash command — pass through as-is
      return null;
  }
}

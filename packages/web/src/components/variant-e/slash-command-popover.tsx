/**
 * SlashCommandPopover — keyboard command palette above the composer.
 *
 * Appears when the user types "/" — shows the 3 slash commands
 * with their argument hints. Feels like Cursor/Linear command palette.
 * Click or keyboard (future) to select.
 */
import { cn } from "@/lib/utils";
import { KyleCard } from "@/components/shared/kyle-card";

interface SlashCommand {
  command: string;
  args: string;
  hint: string;
}

export interface SlashCommandPopoverProps {
  commands: SlashCommand[];
  onSelect: (command: string) => void;
  onClose: () => void;
  className?: string;
}

export function SlashCommandPopover({
  commands,
  onSelect,
  className,
}: SlashCommandPopoverProps) {
  if (commands.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute bottom-full left-4 right-4 mb-2 z-50",
        "animate-fade-up",
        className,
      )}
      // Prevent textarea blur when clicking a command
      onMouseDown={(e) => e.preventDefault()}
    >
      <KyleCard
        variant="glass"
        className={cn(
          "border border-white/12 overflow-hidden",
          "shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.5)]",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
          <span
            className={cn(
              "font-[var(--font-apercu-mono)] text-[0.6rem] tracking-widest uppercase",
              "text-[var(--color-electrolyte)]/60",
            )}
          >
            Slash commands
          </span>
        </div>

        {/* Commands list */}
        <div className="py-1">
          {commands.map((cmd) => (
            <button
              key={cmd.command}
              type="button"
              onClick={() => onSelect(cmd.command)}
              className={cn(
                "w-full flex items-baseline gap-3 px-3 py-2",
                "transition-colors duration-100",
                "hover:bg-[var(--color-electrolyte)]/8",
                "group",
              )}
            >
              {/* Command name */}
              <span
                className={cn(
                  "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] shrink-0",
                  "text-[var(--color-electrolyte)] group-hover:text-[var(--color-electrolyte)]",
                  "tracking-wide",
                )}
              >
                {cmd.command}
              </span>

              {/* Args */}
              <span
                className={cn(
                  "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)]",
                  "text-muted-foreground/50",
                )}
              >
                {cmd.args}
              </span>

              {/* Hint — pushed to right */}
              <span
                className={cn(
                  "ml-auto font-[var(--font-apercu)] text-[var(--font-size-caption)]",
                  "text-muted-foreground/40 group-hover:text-muted-foreground/60",
                  "transition-colors duration-100",
                )}
              >
                {cmd.hint}
              </span>
            </button>
          ))}
        </div>
      </KyleCard>
    </div>
  );
}

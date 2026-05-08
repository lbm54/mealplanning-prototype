import { useRef, useState } from "react";
import { Camera, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PhotoUploadPrompt — "Snap your fridge" CTA with file picker.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #10
 *
 * Large dashed-border tile with camera icon + copy.
 * Click → opens file picker (image/*, capture=environment on mobile).
 * On select → calls onUserResponse with { filename, sizeKb }.
 * Does NOT upload — stub only (real CV pipeline deferred per spec §6.2).
 */

export interface PhotoUploadPromptOutput {
  label?: string;
  subLabel?: string;
}

export interface PhotoUploadPromptProps {
  output: PhotoUploadPromptOutput;
  onUserResponse?: (response: { filename: string; sizeKb: number }) => void;
  className?: string;
}

export default function PhotoUploadPrompt({
  output,
  onUserResponse,
  className,
}: PhotoUploadPromptProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<{ filename: string; sizeKb: number } | null>(null);

  function handleClick() {
    if (uploaded) return;
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = {
      filename: file.name,
      sizeKb: Math.round(file.size / 1024),
    };
    setUploaded(result);
    onUserResponse?.(result);
  }

  const label = output.label ?? "Snap your fridge";
  const subLabel = output.subLabel ?? "Jade plans around what you have.";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
        aria-hidden
      />

      <button
        onClick={handleClick}
        disabled={!!uploaded}
        className={cn(
          "w-full rounded-[var(--radius-card)] border-2 border-dashed",
          "flex flex-col items-center justify-center gap-3 py-8",
          "transition-all duration-200",
          uploaded
            ? "border-[var(--color-electrolyte)]/50 bg-[var(--color-electrolyte)]/5 cursor-default"
            : "border-border hover:border-[var(--color-electrolyte)]/50 hover:bg-[var(--color-electrolyte)]/5 cursor-pointer",
        )}
        aria-label={label}
      >
        {uploaded ? (
          <>
            <CheckCircle
              size={36}
              className="text-[var(--color-electrolyte)]"
              aria-hidden
            />
            <div className="text-center">
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] font-medium text-foreground">
                Photo received
              </p>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                {uploaded.filename} · {uploaded.sizeKb}kb
              </p>
            </div>
          </>
        ) : (
          <>
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-[var(--color-electrolyte)]/15 text-[var(--color-electrolyte)]",
              )}
            >
              <Camera size={24} aria-hidden />
            </span>
            <div className="text-center">
              <p className="font-[var(--font-sansita)] text-[var(--font-size-body-lg)] uppercase tracking-wider text-foreground">
                {label}
              </p>
              <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground mt-1">
                {subLabel}
              </p>
            </div>
          </>
        )}
      </button>
    </div>
  );
}

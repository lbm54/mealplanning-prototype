/**
 * MessagePartText — renders Jade's text replies as markdown.
 *
 * 2026 facelift:
 * - Refined bullet character (›) instead of default disc
 * - Inline code: small monospace pill with subtle backdrop-blur tint
 * - Generous line-height, slightly larger body text
 * - Headings use Sansita Bold uppercase tracking
 * - No harsh borders, everything feels like a letter
 *
 * Security: react-markdown + remark-gfm + rehype-sanitize (preserved).
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

export interface MessagePartTextProps {
  content: string;
  className?: string;
}

export function MessagePartText({ content, className }: MessagePartTextProps) {
  return (
    <div
      className={cn(
        "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-[1.75]",
        "text-foreground/90",
        // Paragraphs
        "[&_p]:mb-3 [&_p:last-child]:mb-0",
        // Lists — refined bullet
        "[&_ul]:mb-3 [&_ul]:space-y-1",
        "[&_ul_li]:relative [&_ul_li]:pl-4",
        "[&_ul_li::before]:content-['›'] [&_ul_li::before]:absolute [&_ul_li::before]:left-0",
        "[&_ul_li::before]:text-[var(--color-electrolyte)]/60 [&_ul_li::before]:font-bold",
        "[&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:space-y-1",
        // Emphasis
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic [&_em]:text-foreground/75",
        // Inline code — monospace pill with tint
        "[&_code]:font-[var(--font-apercu-mono)] [&_code]:text-[0.78em]",
        "[&_code]:bg-[var(--color-electrolyte)]/10 [&_code]:text-[var(--color-electrolyte)]",
        "[&_code]:rounded-[4px] [&_code]:px-1.5 [&_code]:py-0.5",
        "[&_code]:border [&_code]:border-[var(--color-electrolyte)]/20",
        // Block headings
        "[&_h1]:font-[var(--font-sansita)] [&_h1]:font-bold [&_h1]:uppercase [&_h1]:tracking-widest",
        "[&_h1]:text-[var(--font-size-section)] [&_h1]:mb-2 [&_h1]:mt-4 [&_h1:first-child]:mt-0",
        "[&_h2]:font-[var(--font-sansita)] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider",
        "[&_h2]:text-[var(--font-size-body)] [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2:first-child]:mt-0",
        "[&_h3]:font-[var(--font-apercu)] [&_h3]:font-semibold [&_h3]:text-[var(--font-size-body)]",
        "[&_h3]:mb-1 [&_h3]:mt-2.5 [&_h3]:text-muted-foreground",
        // Blockquote — refusal/dimmer style
        "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30",
        "[&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground/70",
        "[&_blockquote]:my-2",
        // Tables
        "[&_table]:w-full [&_table]:text-[var(--font-size-caption)] [&_table]:my-2",
        "[&_th]:font-[var(--font-compadre)] [&_th]:uppercase [&_th]:tracking-wider",
        "[&_th]:text-muted-foreground [&_th]:pb-1",
        "[&_td]:py-0.5 [&_td]:border-t [&_td]:border-border/40",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          li: ({ children }) => <li>{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

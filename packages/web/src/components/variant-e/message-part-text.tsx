/**
 * MessagePartText — renders Jade's text replies as markdown.
 *
 * Uses react-markdown + remark-gfm for tables/lists.
 * Uses rehype-sanitize to strip dangerous HTML.
 * Never allows raw <script> tags or inline event handlers.
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
        "font-[var(--font-apercu)] text-[var(--font-size-body)] leading-relaxed",
        // Markdown typography overrides inside this container
        "[&_p]:mb-2 [&_p:last-child]:mb-0",
        "[&_ul]:mb-2 [&_ul]:pl-4 [&_li]:mb-0.5",
        "[&_ol]:mb-2 [&_ol]:pl-4",
        "[&_strong]:font-semibold",
        "[&_em]:italic",
        "[&_code]:font-[var(--font-apercu-mono)] [&_code]:text-[var(--font-size-caption)] [&_code]:bg-muted [&_code]:rounded px-1",
        "[&_h1]:font-[var(--font-sansita)] [&_h1]:font-bold [&_h1]:uppercase [&_h1]:tracking-wider [&_h1]:text-[var(--font-size-section-title)]",
        "[&_h2]:font-[var(--font-sansita)] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-[var(--font-size-body)]",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Prevent generic wrapper <div> inside <p> issues
          p: ({ children }) => (
            <p>{children}</p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

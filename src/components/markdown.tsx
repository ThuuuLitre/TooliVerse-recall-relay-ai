import ReactMarkdown from "react-markdown";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-table:text-sm prose-th:bg-muted/40 prose-td:border-border prose-th:border-border">
      <ReactMarkdown
        components={{
          table: (p) => <table className="w-full border-collapse" {...p} />,
          th: (p) => <th className="border border-border bg-muted/40 p-2 text-left" {...p} />,
          td: (p) => <td className="border border-border p-2" {...p} />,
          code: ({ children, ...p }) => (
            <code className="rounded bg-muted px-1 py-0.5 text-xs" {...p}>
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

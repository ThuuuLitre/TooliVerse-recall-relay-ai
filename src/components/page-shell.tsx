import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="flex gap-3">
        {Icon && (
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="bg-gradient-surface border-border shadow-elegant">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      ⚠️ {children}
    </div>
  );
}

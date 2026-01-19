interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="page-header inline-block rounded-sm">
        {title}
      </div>
      {subtitle && (
        <div className="bg-destructive/80 text-destructive-foreground px-6 py-2 text-base font-semibold uppercase inline-block ml-0 -ml-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}

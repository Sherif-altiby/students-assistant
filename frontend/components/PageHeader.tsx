import React from "react";

const PageHeader = ({title, description, icon}: {title: string; description: string; icon: React.ReactNode}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-7 sm:px-8 sm:py-8">
      {/* Gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/10" />

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
          {icon}
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;

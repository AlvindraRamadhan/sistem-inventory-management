import { cn } from "@/lib/utils";

type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

// ─── PageTitle ────────────────────────────────────────────────────────────────

export function PageTitle({ className, children, ...props }: PolymorphicProps<"h1">) {
  return (
    <h1
      className={cn(
        "text-2xl font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ className, children, ...props }: PolymorphicProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-snug text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

// ─── CardTitle ────────────────────────────────────────────────────────────────

export function CardTitle({ className, children, ...props }: PolymorphicProps<"h3">) {
  return (
    <h3
      className={cn(
        "text-base font-semibold leading-snug text-card-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────

export function Label({ className, children, ...props }: PolymorphicProps<"span">) {
  return (
    <span
      className={cn(
        "text-sm font-medium leading-none text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── BodyText ─────────────────────────────────────────────────────────────────

export function BodyText({ className, children, ...props }: PolymorphicProps<"p">) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

// ─── Caption ─────────────────────────────────────────────────────────────────

export function Caption({ className, children, ...props }: PolymorphicProps<"span">) {
  return (
    <span
      className={cn(
        "text-xs leading-normal text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Mono ─────────────────────────────────────────────────────────────────────

export function Mono({ className, children, ...props }: PolymorphicProps<"code">) {
  return (
    <code
      className={cn(
        "font-mono text-sm tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}

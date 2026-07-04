import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "default" | "wide" | "narrow";
  className?: string;
}

const maxWidthMap = {
  default: "max-w-4xl",
  wide: "max-w-6xl",
  narrow: "max-w-2xl",
};

export function PageContainer({ children, maxWidth = "default", className }: PageContainerProps) {
  return (
    <main className={cn("mx-auto px-4 py-8 md:px-6 md:py-10", maxWidthMap[maxWidth], className)}>
      {children}
    </main>
  );
}

const bunny = "/img/rout-bunny.png";
import { cn } from "@/lib/utils";

interface RoutLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

/**
 * ROUT brand lockup — hand-drawn rabbit mark + monospace wordmark.
 * The rabbit is a CSS mask tinted with the neutral ink colour (black /
 * anthracite in light mode, off-white in dark) so the mark stays grown-up.
 */
export function RoutLogo({ className, size = 28, showWordmark = true }: RoutLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="block bg-foreground shrink-0"
        style={{
          width: size,
          height: size,
          WebkitMaskImage: `url(${bunny})`,
          maskImage: `url(${bunny})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      {showWordmark && (
        <span
          className="font-brand text-foreground tracking-[0.18em] font-bold leading-none"
          style={{ fontSize: Math.round(size * 0.72) }}
        >
          ROUT
        </span>
      )}
    </span>
  );
}

export { bunny as routBunnySrc };

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  layout?: "stacked" | "horizontal" | "mark";
  size?: "sm" | "md" | "lg";
};

export function LaundryHubLogo({
  className,
  markClassName,
  textClassName,
  layout = "horizontal",
  size = "md",
}: BrandLogoProps) {
  const isStacked = layout === "stacked";
  const isMark = layout === "mark";
  const stackedWordSize = size === "sm" ? "text-3xl" : size === "lg" ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl";
  const stackedHubSize = size === "sm" ? "mt-2 text-xl" : size === "lg" ? "mt-3 text-3xl sm:text-4xl" : "mt-3 text-2xl sm:text-3xl";
  const horizontalWordSize = size === "sm" ? "text-base" : "text-lg";
  const horizontalHubSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div
      className={cn(
        "inline-flex items-center text-primary",
        isStacked ? "flex-col justify-center gap-2 text-center" : "gap-3",
        className,
      )}
      aria-label="Laundry Hub"
    >
      <svg
        viewBox="0 0 96 72"
        role="img"
        aria-hidden="true"
        className={cn(isStacked ? "h-14 w-20" : "h-10 w-14", markClassName)}
        fill="none"
      >
        <path
          d="M35 19a13 13 0 0 1 26 0"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M48 31v9"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M48 39 16 58c-5 3-3 10 3 10h58c6 0 8-7 3-10L48 39Z"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <path
          d="M18 67h60"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>

      {!isMark && (
        <div className={cn(isStacked ? "leading-none" : "leading-tight", textClassName)}>
          <div
            className={cn(
              "font-black uppercase tracking-normal",
              isStacked ? stackedWordSize : horizontalWordSize,
            )}
          >
            Laundry
          </div>
          <div
            className={cn(
              "font-black uppercase tracking-normal",
              isStacked ? stackedHubSize : horizontalHubSize,
            )}
          >
            Hub
          </div>
        </div>
      )}
    </div>
  );
}

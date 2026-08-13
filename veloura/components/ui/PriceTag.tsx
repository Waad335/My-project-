import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  amount: string;
  currencyCode: string;
  compareAtAmount?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PriceTag({ amount, currencyCode, compareAtAmount, className, size = "md" }: PriceTagProps) {
  const hasDiscount = compareAtAmount && Number(compareAtAmount) > Number(amount);
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-2xl",
  }[size];

  return (
    <span className={cn("inline-flex items-baseline gap-2 font-sans", sizeClasses, className)}>
      <span className={cn(hasDiscount && "text-brown")}>{formatPrice(amount, currencyCode)}</span>
      {hasDiscount && (
        <span className="text-muted line-through opacity-60">
          {formatPrice(compareAtAmount!, currencyCode)}
        </span>
      )}
    </span>
  );
}

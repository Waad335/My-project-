export function HeartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.6 2 5 5.6 5c2 0 3.4 1 4.4 2.5C11 6 12.4 5 14.4 5 18 5 19.5 8.6 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function BowIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 10c-2-4-7-7-11-6-3 .8-3.6 5-1 7 2 1.6 6 1 8-1M16 10c2-4 7-7 11-6 3 .8 3.6 5 1 7-2 1.6-6 1-8-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="10" r="2.1" fill="currentColor" />
    </svg>
  );
}

export function GoldHairline({ className = "" }: { className?: string }) {
  return <div className={`h-px w-16 bg-gradient-to-r from-transparent via-gold-400 to-transparent ${className}`} />;
}

export function SparkleDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <GoldHairline />
      <HeartIcon className="h-3.5 w-3.5 text-blush-400" />
      <GoldHairline />
    </div>
  );
}

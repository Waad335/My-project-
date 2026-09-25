import Link from "next/link";
import { User } from "lucide-react";

export function AccountIconButton({ label, initial }: { label: string; initial?: string | null }) {
  return (
    <Link
      href="/account"
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-mocha-700 transition hover:bg-mocha-700/5"
    >
      {initial ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mocha-700 font-heading text-sm uppercase text-ivory">
          {initial}
        </span>
      ) : (
        <User size={20} strokeWidth={1.75} />
      )}
    </Link>
  );
}

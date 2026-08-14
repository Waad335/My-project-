"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">Something went wrong</p>
      <h1 className="font-serif-display text-4xl sm:text-5xl">A small snag.</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        We hit an unexpected error loading this page. Please try again.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">404</p>
      <h1 className="font-serif-display text-4xl sm:text-5xl">This page has stepped away.</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or has moved. Let&apos;s get you back
        to the collection.
      </p>
      <Button href="/shop">Return to Shop</Button>
    </div>
  );
}

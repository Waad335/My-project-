export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-live="polite">
      <span className="font-serif-display text-sm uppercase tracking-[0.3em] text-muted">
        Loading…
      </span>
    </div>
  );
}

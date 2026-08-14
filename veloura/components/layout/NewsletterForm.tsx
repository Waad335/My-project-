"use client";

import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitted");
  }

  if (status === "submitted") {
    return <p className="text-sm text-gold-deep">Thank you — you&apos;re on the list.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center border-b border-black/25 pb-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="Email address"
        className="w-full bg-transparent text-sm placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="shrink-0 text-xs uppercase tracking-[0.16em] text-gold-deep hover:text-black"
      >
        Join
      </button>
    </form>
  );
}

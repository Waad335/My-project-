"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Client-side contact form. No backend is wired yet — see README "Contact form
 * backend" for how to connect this to Shopify customer service, a form
 * endpoint (Formspree/Resend), or a custom API route.
 */
export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-sm border border-gold/30 bg-gold/5 p-8 text-center">
        <p className="font-serif-display text-2xl">Message received.</p>
        <p className="mt-2 text-sm text-muted">We&apos;ll be in touch within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Name" id="name" name="name" type="text" required />
        <Field label="Email" id="email" name="email" type="email" required />
      </div>
      <Field label="Subject" id="subject" name="subject" type="text" />
      <div>
        <label htmlFor="message" className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full border-b border-black/20 bg-transparent py-2 text-sm focus:border-black focus:outline-none"
        />
      </div>
      <Button type="submit" disabled={status === "submitting"} className="mt-2 w-fit">
        {status === "submitting" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}

function Field({
  label,
  id,
  name,
  type,
  required,
}: {
  label: string;
  id: string;
  name: string;
  type: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        className="w-full border-b border-black/20 bg-transparent py-2 text-sm focus:border-black focus:outline-none"
      />
    </div>
  );
}

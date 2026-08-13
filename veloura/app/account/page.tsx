import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { isShopifyConfigured } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-lg px-6 pb-24 pt-32 text-center md:px-10 lg:pt-40">
      <Reveal>
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold">Account</p>
        <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">
          Sign in with Shopify
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          {isShopifyConfigured
            ? "Account access, order history, and saved details are managed securely by Shopify. Continue to your account through checkout, or connect the Shopify Customer Account API to embed sign-in here."
            : "Account management is powered by Shopify Customer Accounts once a live store is connected. See the README for setup steps."}
        </p>
        <div className="mt-8">
          <Button href="/shop">Continue Shopping</Button>
        </div>
      </Reveal>
    </div>
  );
}

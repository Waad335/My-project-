import type { Metadata } from "next";
import { WishlistPageContent } from "@/components/wishlist/wishlist-page-content";

export const metadata: Metadata = { title: "Your Wishlist" };

export default function WishlistPage() {
  return <WishlistPageContent />;
}

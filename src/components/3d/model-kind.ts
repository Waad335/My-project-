export type ModelKind =
  | "perfume"
  | "flacon"
  | "serum"
  | "jar"
  | "pump"
  | "lipstick"
  | "handbag"
  | "ring"
  | "necklace";

// Picks an illustrative 3D model for a product from its category/subcategory.
// Returns null where a stylised model wouldn't represent the product well
// (clothing, home goods, …) — those products simply don't get a 3D view.
export function modelKindForProduct(categorySlug: string, subcategorySlug?: string | null): ModelKind | null {
  const sub = (subcategorySlug || "").toLowerCase();
  const cat = categorySlug.toLowerCase();

  if (/bag|tote|crossbody|pouch|clutch|wallet/.test(sub) || cat === "bags") return "handbag";
  if (/necklace|pearl/.test(sub)) return "necklace";
  if (/ring|earring|jewel|bracelet|hair-accessor/.test(sub) || cat === "accessories") return "ring";
  if (/perfume|parfum|mist|musk|fragrance/.test(sub) || cat === "perfumes") return sub.includes("mist") ? "flacon" : "perfume";
  if (/moistur|cream|jar|body-cream/.test(sub)) return "jar";
  if (/lip/.test(sub)) return "lipstick";
  if (/shampoo|conditioner|pump|body-wash/.test(sub) || cat === "haircare") return "pump";
  if (/serum|cleanser|skin|oil|treatment/.test(sub) || cat === "skincare") return "serum";
  return null;
}

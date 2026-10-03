import { useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { ProductDetail } from "@shared/api-types";
import type { PurchaseState } from "@/catalog/product-logic";
import { CircleCheck, ShoppingBag } from "@/components/icons";
import { AppText, Button, Icon } from "@/components/ui";
import { MAX_LINE_QUANTITY, useCartStore, type CartItem } from "@/shopping/cart-store";
import { colors, spacing } from "@/theme";
import { QuantityStepper } from "./QuantityStepper";
import { WishlistButton } from "./WishlistButton";

type AddToCartProps = {
  product: ProductDetail;
  // Price and stock for the chosen colour or size.
  state: PurchaseState;
};

// The website's purchase controls (product-purchase-panel.tsx): quantity,
// Add to Cart and the wishlist heart. Remount it (key) when the chosen
// variant changes so the quantity starts again at 1.
export function AddToCart({ product, state }: AddToCartProps) {
  const t = useTranslations();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<"added" | "maxReached" | null>(null);

  // Variants are always stock-tracked; a made-to-order product allows 99.
  const max = state.stockTracked ? Math.max(state.stock, 1) : MAX_LINE_QUANTITY;
  const value = Math.min(quantity, max);

  function add() {
    if (state.outOfStock) return;
    const variant = state.variant;
    const line: CartItem = {
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      image: product.image,
      unitPrice: state.unitPrice,
      quantity: value,
      variantLabel: variant ? [variant.color, variant.size].filter(Boolean).join(" / ") || null : null,
      // As the server and the website's product card store it: the stock,
      // or 99 for a made-to-order product.
      maxStock: state.stockTracked ? state.stock : MAX_LINE_QUANTITY,
    };
    const result = addItem(line) > 0 ? "added" : "maxReached";
    setFeedback(result);
    AccessibilityInfo.announceForAccessibility(result === "added" ? t("product.addedToCart") : t("app.cart.maxReached"));
  }

  return (
    <View style={styles.container}>
      <AppText variant="label" color="text">
        {t("product.quantity")}
      </AppText>
      <View style={styles.row}>
        <QuantityStepper
          value={value}
          max={max}
          onChange={(next) => {
            setQuantity(next);
            setFeedback(null);
          }}
          decreaseLabel={t("product.decreaseQuantity")}
          increaseLabel={t("product.increaseQuantity")}
        />
        <Button
          label={state.outOfStock ? t("product.outOfStock") : t("product.addToCart")}
          onPress={add}
          disabled={state.outOfStock}
          icon={state.outOfStock ? undefined : <Icon icon={ShoppingBag} size={18} color="textInverse" />}
          style={styles.addButton}
        />
        <WishlistButton
          item={{
            productId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            image: product.image,
            price: product.effectivePrice,
          }}
          size={48}
          style={styles.heart}
        />
      </View>
      {feedback === "added" ? (
        <View style={styles.feedback}>
          <Icon icon={CircleCheck} size={18} />
          <AppText variant="body" color="text" style={styles.feedbackText}>
            {t("product.addedToCart")}
          </AppText>
          <Pressable accessibilityRole="link" onPress={() => router.navigate("/cart")} hitSlop={8}>
            <AppText variant="body" color="text" style={styles.link}>
              {t("cart.viewCart")}
            </AppText>
          </Pressable>
        </View>
      ) : feedback === "maxReached" ? (
        <AppText variant="caption" color="danger">
          {t("app.cart.maxReached")}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm + 2 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addButton: { flex: 1, alignSelf: "stretch", paddingHorizontal: spacing.md },
  heart: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  feedback: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  feedbackText: { flexShrink: 1 },
  link: { textDecorationLine: "underline" },
});

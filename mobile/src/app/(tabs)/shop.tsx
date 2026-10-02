import { useEffect, useRef, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, View, type TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { activeFilterCount, type BrowseFilters } from "@/catalog/filters";
import { localized } from "@/catalog/product-logic";
import { useCategories } from "@/catalog/queries";
import { ProductBrowser } from "@/components/catalog/ProductBrowser";
import { SearchSuggestions } from "@/components/catalog/SearchSuggestions";
import { AppText, Chip, SearchField } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, spacing } from "@/theme";

const DEFAULT_FILTERS: BrowseFilters = { sort: "featured" };
// The API accepts searches of up to 80 characters.
const MAX_QUERY_LENGTH = 80;

// Shop: search (with suggestions while typing), category chips, and the
// whole catalogue with sort and price filters — the website's /shop.
export default function ShopScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const searchRef = useRef<TextInput>(null);
  const categories = useCategories();

  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);

  // Hiding the keyboard (Android back button, iOS swipe) ends the search
  // and closes the suggestions.
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => searchRef.current?.blur());
    return () => sub.remove();
  }, []);

  // A blurred search box hides the suggestions a moment later, so a tap on
  // a suggestion still lands (on the web the box blurs before the click).
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  // Home's search button opens Shop with the search box ready to type in.
  useEffect(() => {
    if (focus !== "1") return;
    searchRef.current?.focus();
    router.setParams({ focus: undefined });
  }, [focus, router]);

  function submitSearch(text = draft) {
    const next = text.trim();
    setDraft(next);
    setQuery(next);
    searchRef.current?.blur();
  }

  function clearAll() {
    setDraft("");
    setQuery("");
    setCategory(undefined);
    setFilters(DEFAULT_FILTERS);
  }

  const showSuggestions = searchFocused && draft.trim().length > 0 && draft.trim() !== query;
  const narrowed = Boolean(query || category || activeFilterCount(filters, DEFAULT_FILTERS.sort));
  const shopCategories = categories.data?.shopCategories ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.top}>
        <AppText variant="title" accessibilityRole="header">
          {t("shop.title")}
        </AppText>
        <SearchField
          ref={searchRef}
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            if (text === "") setQuery("");
          }}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setSearchFocused(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setSearchFocused(false), 200);
          }}
          onSubmitEditing={() => submitSearch()}
          placeholder={t("shop.searchPlaceholder")}
          accessibilityLabel={t("shop.searchLabel")}
          clearLabel={t("shop.clearSearch")}
          maxLength={MAX_QUERY_LENGTH}
        />
      </View>

      <View style={styles.body}>
        <ProductBrowser
          scope={{ q: query || undefined, category }}
          filters={filters}
          defaultSort={DEFAULT_FILTERS.sort}
          onFiltersChange={setFilters}
          narrowed={narrowed}
          onClearAll={clearAll}
          header={
            shopCategories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsRow}
                accessibilityRole="radiogroup"
                accessibilityLabel={t("shop.categoriesLabel")}
              >
                <Chip role="radio" label={t("shop.all")} selected={!category} onPress={() => setCategory(undefined)} />
                {shopCategories.map((c) => (
                  <Chip
                    key={c.id}
                    role="radio"
                    label={localized(locale, c.nameEn, c.nameAr)}
                    selected={category === c.slug}
                    onPress={() => setCategory(c.slug)}
                  />
                ))}
              </ScrollView>
            ) : undefined
          }
        />
        {showSuggestions ? (
          <View style={styles.suggestions}>
            <SearchSuggestions query={draft} onSeeAll={() => submitSearch()} onNavigate={() => searchRef.current?.blur()} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  body: { flex: 1 },
  chipsScroll: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  suggestions: { position: "absolute", top: 0, start: spacing.lg, end: spacing.lg, maxHeight: "80%" },
});

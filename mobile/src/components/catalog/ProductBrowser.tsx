import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View, useWindowDimensions } from "react-native";
import { useTranslations } from "use-intl";
import type { ProductCard as ProductCardData } from "@shared/api-types";
import { activeFilterCount, type BrowseFilters, type BrowseSort } from "@/catalog/filters";
import { useProductList } from "@/catalog/queries";
import { SearchX, SlidersHorizontal } from "@/components/icons";
import { AppText, Button, EmptyState, ErrorState, Icon } from "@/components/ui";
import { colors, radii, spacing } from "@/theme";
import { FilterSheet } from "./FilterSheet";
import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

type ProductBrowserProps = {
  // What to list: search text, category and subcategory slugs.
  scope: { q?: string; category?: string; sub?: string };
  filters: BrowseFilters;
  defaultSort: BrowseSort;
  onFiltersChange: (filters: BrowseFilters) => void;
  // Whether anything narrows the list (search, chips or filters); the
  // empty state then offers "Clear filters".
  narrowed: boolean;
  onClearAll: () => void;
  // Screen content shown above the results (category header, chips).
  header?: ReactElement;
};

// The two-column product grid behind Shop and every category: loads 20 at a
// time as you scroll, pull to refresh, sort and price filters in a sheet.
export function ProductBrowser({ scope, filters, defaultSort, onFiltersChange, narrowed, onClearAll, header }: ProductBrowserProps) {
  const t = useTranslations();
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);
  const listRef = useRef<FlatList<ProductCardData>>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const query = useProductList({ ...scope, ...filters });
  const { data, isPending, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError, isPlaceholderData } =
    query;

  // Offset pages can shift if products are added mid-scroll; never show one twice.
  const products = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) => page.products).filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  }, [data]);
  const total = data?.pages[0]?.total ?? 0;

  // New search or filters: start again from the top.
  const listKey = JSON.stringify([scope, filters]);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [listKey]);

  async function refresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  function openFilters() {
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  }

  const filterCount = activeFilterCount(filters, defaultSort);
  // A failed refresh keeps what's already on screen; the error state is
  // only for a list that never loaded.
  const showList = data !== undefined;

  const toolbar = (
    <View style={styles.toolbar}>
      <AppText variant="caption" color="textMuted" accessibilityLiveRegion="polite" style={styles.count}>
        {isPending ? t("common.loading") : isPlaceholderData ? t("shop.updating") : showList ? t("shop.results", { count: total }) : ""}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={filterCount ? `${t("common.filter")} (${filterCount})` : t("common.filter")}
        onPress={openFilters}
        hitSlop={6}
        style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
      >
        <Icon icon={SlidersHorizontal} size={16} />
        <AppText variant="caption" color="text" style={styles.filterLabel}>
          {t("common.filter")}
        </AppText>
        {filterCount ? (
          <View style={styles.badge}>
            <AppText variant="caption" color="textInverse" style={styles.badgeText}>
              {filterCount}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );

  return (
    <>
      <FlatList
        ref={listRef}
        data={showList ? products : []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={
          <View style={styles.header}>
            {header}
            {toolbar}
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <ProductGridSkeleton cardWidth={cardWidth} />
          ) : isError && !showList ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              icon={SearchX}
              title={t("shop.emptyTitle")}
              body={t("shop.emptyBody")}
              action={narrowed ? { label: t("shop.clearFilters"), onPress: onClearAll } : undefined}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={styles.footer} />
          ) : isFetchNextPageError ? (
            <View style={styles.footer}>
              <Button label={t("app.retry")} variant="secondary" onPress={() => void fetchNextPage()} style={styles.retry} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textMuted} colors={[colors.primary]} />}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        style={[styles.list, isPlaceholderData && styles.updating]}
      />
      <FilterSheet
        key={sheetKey}
        visible={sheetOpen}
        filters={filters}
        defaultSort={defaultSort}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setSheetOpen(false);
          onFiltersChange(next);
        }}
      />
    </>
  );
}

function RowGap() {
  return <View style={styles.rowGap} />;
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  updating: { opacity: 0.6 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  header: { gap: spacing.lg, paddingBottom: spacing.lg },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  count: { flex: 1 },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterButtonPressed: { backgroundColor: colors.surfaceMuted },
  filterLabel: { fontSize: 13 },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 11, lineHeight: 14 },
  row: { gap: spacing.md },
  rowGap: { height: spacing.xl },
  footer: { paddingVertical: spacing.xl, alignItems: "center" },
  retry: { alignSelf: "center" },
});

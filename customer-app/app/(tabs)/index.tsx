import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ShoppingBag } from 'lucide-react-native';
import { catalogApi } from '../../src/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/theme';
import ProductCard from '../../src/components/ProductCard';

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        catalogApi.getProducts(),
        catalogApi.getCategories(),
      ]);
      setProducts(prodRes.data.items);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={TYPOGRAPHY.h1}>Enamels Store</Text>
              </View>
              <View style={styles.iconButton}>
                <ShoppingBag size={22} color={COLORS.text.primary} />
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
              <TextInput
                placeholder="Search medical apparel..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={TYPOGRAPHY.h3}>Categories</Text>
              <Text style={styles.seeAll}>See All</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
              {categories.map((cat) => (
                <View key={cat.id} style={styles.categoryItem}>
                  <View style={styles.categoryIcon}>
                    <Text style={{ fontSize: 28 }}>{cat.icon || '📦'}</Text>
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.sectionHeader}>
              <Text style={TYPOGRAPHY.h3}>Featured Products</Text>
              <Text style={styles.seeAll}>View More</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onPress={() => router.push(`/product/${item.id}`)} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={TYPOGRAPHY.body}>No products found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  iconButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.soft,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...TYPOGRAPHY.body,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAll: {
    ...TYPOGRAPHY.small,
    color: COLORS.brand.primary,
    fontWeight: '700',
  },
  categories: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  categoryIcon: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.surface,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.soft,
  },
  categoryName: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  empty: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
});

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, useWindowDimensions, Platform, FlatList, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, ShoppingBag, Heart, Share2, Film, PlayCircle, ShieldCheck, Truck } from 'lucide-react-native';
import { catalogApi } from '../../src/api';
import { useCartStore, useAuthStore } from '../../src/store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/theme';
import Button from '../../src/components/Button';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const addItem = useCartStore((state) => state.addItem);
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await catalogApi.getProduct(id);
        setProduct(res.data);
        if (res.data.variants?.length > 0) {
          setSelectedVariant(res.data.variants[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      alert('Please log in to add items to your cart.');
      router.push('/login');
      return;
    }

    setAdding(true);
    try {
      await addItem({
        product_id: product.id,
        variant_id: selectedVariant?.id,
        quantity: 1,
      });
      router.push('/(tabs)/cart');
    } catch (err) {
      console.error(err);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  };


  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / width);
        if (index !== activeIndex) setActiveIndex(index);
      }
    }
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={TYPOGRAPHY.body}>Product not found.</Text>
      </View>
    );
  }

  const media = product.images?.length > 0 ? product.images : [{ url: 'https://via.placeholder.com/600', type: 'image' }];
  const price = selectedVariant?.price_override || product.price;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ 
        headerTitle: '',
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.circleButton}>
            <ChevronLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.circleButton}>
              <Share2 size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
        )
      }} />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.imageContainer}>
          <FlatList
            data={media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ width, height: width * 1.25 }}>
                <Image 
                  source={{ uri: item.url }} 
                  style={styles.image} 
                  resizeMode="cover" 
                />
                {item.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <PlayCircle size={64} color="white" />
                    <View style={styles.videoBadge}>
                      <Film size={12} color="white" />
                      <Text style={styles.videoBadgeText}>Watch Video</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          />
          
          <View style={styles.pagination}>
            {media.map((_: any, i: number) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  activeIndex === i && styles.dotActive
                ]} 
              />
            ))}
          </View>

          <TouchableOpacity 
            onPress={() => setIsFavorite(!isFavorite)}
            style={styles.favoriteButton}
          >
            <Heart size={24} color={isFavorite ? COLORS.brand.primary : COLORS.text.primary} fill={isFavorite ? COLORS.brand.primary : 'transparent'} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryName}>{product.category_name || 'Medical Wear'}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>★ 4.9</Text>
              <Text style={styles.reviewsText}>(128 reviews)</Text>
            </View>
          </View>
          
          <Text style={TYPOGRAPHY.h1}>{product.name}</Text>
          <Text style={styles.price}>Rs. {price.toLocaleString()}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || 'Crafted with premium cotton-blend fabric for ultimate comfort and durability in medical environments.'}
            </Text>
          </View>

          {product.variants?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.variantsGrid}>
                {product.variants.map((v: any) => (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => setSelectedVariant(v)}
                    style={[
                      styles.variantItem,
                      selectedVariant?.id === v.id && styles.variantActive
                    ]}
                  >
                    <Text style={[
                      styles.variantText,
                      selectedVariant?.id === v.id && styles.variantTextActive
                    ]}>
                      {v.size || 'M'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Truck size={20} color={COLORS.brand.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Fast Delivery</Text>
                <Text style={styles.infoSub}>24-48 Hours delivery</Text>
              </View>
            </View>
            
            <View style={[styles.infoItem, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEEEEE' }]}>
              <View style={styles.infoIcon}>
                <ShieldCheck size={20} color={COLORS.brand.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>2-Day Return Policy</Text>
                <Text style={styles.infoSub}>Return in 2 days (must be unused)</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <View>
            <Text style={styles.footerLabel}>Total Price</Text>
            <Text style={styles.footerPrice}>Rs. {price.toLocaleString()}</Text>
          </View>
          <Button
            title="Add to Cart"
            onPress={handleAddToCart}
            loading={adding}
            style={styles.addButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  circleButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    ...SHADOWS.soft,
  },
  headerRight: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#F9FAFB',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  videoBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 20,
    backgroundColor: 'white',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: -24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 120,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    ...TYPOGRAPHY.mono,
    color: COLORS.brand.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFB800',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  description: {
    ...TYPOGRAPHY.body,
    lineHeight: 24,
    color: COLORS.text.secondary,
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  variantItem: {
    width: 56,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  variantActive: {
    borderColor: COLORS.brand.primary,
    backgroundColor: COLORS.brand.primary + '10', // 10% opacity
  },
  variantText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  variantTextActive: {
    color: COLORS.brand.primary,
  },
  infoGrid: {
    marginTop: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  infoSub: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  footerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text.primary,
  },
  addButton: {
    width: 200,
  },
});

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

interface ProductCardProps {
  product: any;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/150';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          {hasDiscount && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>-{Math.round((1 - product.price/product.compare_at_price)*100)}%</Text>
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.category}>{product.category_name || 'Medical Wear'}</Text>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>Rs. {product.price.toLocaleString()}</Text>
            {hasDiscount && (
              <Text style={styles.oldPrice}>Rs. {product.compare_at_price.toLocaleString()}</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    marginBottom: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: '#F9FAFB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: SPACING.md,
  },
  category: {
    ...TYPOGRAPHY.mono,
    fontSize: 9,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brand.primary,
  },
  oldPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    color: COLORS.text.tertiary,
    marginLeft: 6,
  },
  saleBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.brand.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  saleText: {
    color: COLORS.text.inverted,
    fontSize: 10,
    fontWeight: '900',
  },
});

export default ProductCard;

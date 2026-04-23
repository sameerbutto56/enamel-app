import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  style?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  error,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.mono,
    fontSize: 10,
    marginBottom: 6,
    color: COLORS.text.secondary,
    fontWeight: '700',
  },
  input: {
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.brand.primary,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: '#EF4444',
    marginTop: 4,
    fontSize: 12,
  },
});

export default Input;

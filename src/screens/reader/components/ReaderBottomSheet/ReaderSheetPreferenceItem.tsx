import React, { Suspense } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../../../../theme/types';
import Switch from '@components/Switch/Switch';

interface ReaderSheetPreferenceItemProps {
  label: string;
  value: boolean;
  onPress: () => void;
  theme: ThemeColors;
}

const ReaderSheetPreferenceItem: React.FC<ReaderSheetPreferenceItemProps> = ({
  label,
  value,
  onPress,
  theme,
}) => {
  return (
    <Pressable
      style={styles.container}
      android_ripple={{ color: theme.rippleColor }}
      onPress={onPress}
    >
      <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
        {label}
      </Text>
      <Suspense fallback={<View style={styles.fallback} />}>
        <Switch value={value} onValueChange={onPress} />
      </Suspense>
    </Pressable>
  );
};

export default ReaderSheetPreferenceItem;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    flex: 1,
    paddingRight: 16,
  },
  fallback: {
    width: 52,
    height: 32,
    borderRadius: 16,
  },
});

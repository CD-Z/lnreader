import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '@theme/types';

export interface ChartLegendEntry {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface ChartLegendProps {
  entries: ChartLegendEntry[];
  highlightedKey?: string;
  onEntryPress: (key: string) => void;
  theme: ThemeColors;
}

const ChartLegend: React.FC<ChartLegendProps> = ({
  entries,
  highlightedKey,
  onEntryPress,
  theme,
}) => (
  <View style={styles.legendContainer}>
    {entries.map(entry => (
      <Pressable
        key={entry.key}
        onPress={() => onEntryPress(entry.key)}
        style={styles.legendRow}
      >
        <View
          style={[
            styles.legendDot,
            {
              backgroundColor: entry.color,
              borderWidth: highlightedKey === entry.key ? 2 : 0,
              borderColor: theme.onSurface,
            },
          ]}
        />
        <Text
          style={[styles.legendLabel, { color: theme.onSurface }]}
          numberOfLines={1}
        >
          {entry.label}
        </Text>
        <Text
          style={[styles.legendValue, { color: theme.onSurfaceVariant }]}
        >
          {entry.value}
        </Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  legendContainer: {
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
  },
  legendValue: {
    fontSize: 14,
    textAlign: 'right',
    width: 40,
  },
});

export default ChartLegend;

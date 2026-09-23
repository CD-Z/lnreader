import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DonutChart } from './DonutChart';
import ChartLegend, { type ChartLegendEntry } from './ChartLegend';
import type { ThemeColors } from '@theme/types';

interface DonutChartWithLegendProps {
  title: string;
  entries: { key: string; value: number }[];
  size?: number;
  thickness?: number;
  colors: Record<string, string>;
  theme: ThemeColors;
  centerLabel?: string;
  getLabel?: (key: string) => string;
}

const DonutChartWithLegend: React.FC<DonutChartWithLegendProps> = ({
  title,
  entries,
  size = 104,
  thickness = 16,
  colors,
  theme,
  centerLabel,
  getLabel,
}) => {
  const [highlightedKey, setHighlightedKey] = useState<string | undefined>(
    undefined,
  );

  const handleSegmentPress = useCallback(
    (key: string) =>
      setHighlightedKey(prev => (prev === key ? undefined : key)),
    [],
  );
  const legendEntries: ChartLegendEntry[] = entries
    .filter(e => e.value > 0)
    .map(e => ({
      key: e.key,
      label: getLabel ? getLabel(e.key) : e.key,
      value: e.value,
      color: colors[e.key] || theme.outline,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <View>
      <Text style={[styles.header, { color: theme.onSurface }]}>{title}</Text>
      <View style={styles.chartRow}>
        <View style={styles.donutContainer}>
          <DonutChart
            entries={entries}
            size={size}
            thickness={thickness}
            colors={colors}
            centerLabel={centerLabel}
            highlightedKey={highlightedKey}
            onSegmentPress={handleSegmentPress}
          />
        </View>
        <ChartLegend
          entries={legendEntries}
          highlightedKey={highlightedKey}
          onEntryPress={handleSegmentPress}
          theme={theme}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  donutContainer: {
    alignItems: 'center',
  },
});

export default DonutChartWithLegend;

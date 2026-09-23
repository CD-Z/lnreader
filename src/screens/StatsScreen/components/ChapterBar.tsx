import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '@hooks/persisted';
import { getString } from '@i18n/translations';

interface ChapterBarProps {
  read: number;
  total: number;
  downloaded: number;
}

export const ChapterBar: React.FC<ChapterBarProps> = ({
  read,
  total,
  downloaded,
}) => {
  const theme = useTheme();
  const readPercent = total > 0 ? Math.min(read / total, 1) : 0;
  const downloadedPercent = total > 0 ? Math.min(downloaded / total, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.totalRow}>
        <Text style={[styles.totalCount, { color: theme.onSurface }]}>
          {total.toLocaleString()}
        </Text>
        <Text style={[styles.totalLabel, { color: theme.onSurfaceVariant }]}>
          {getString('statsScreen.chaptersInLibrary')}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.surfaceVariant }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${readPercent * 100}%`,
              backgroundColor: theme.primary,
            },
          ]}
        />
      </View>
      <View style={styles.labelsRow}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
            {getString('statsScreen.readLabel')}
          </Text>
          <Text style={[styles.labelValue, { color: theme.onSurface }]}>
            {read.toLocaleString()}
          </Text>
          <Text style={[styles.percent, { color: theme.onSurfaceVariant }]}>
            {Math.round(readPercent * 100)}%
          </Text>
        </View>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: theme.secondary }]} />
          <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
            {getString('statsScreen.downloadedLabel')}
          </Text>
          <Text style={[styles.labelValue, { color: theme.onSurface }]}>
            {downloaded.toLocaleString()}
          </Text>
          <Text style={[styles.percent, { color: theme.onSurfaceVariant }]}>
            {Math.round(downloadedPercent * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  totalCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 13,
  },
  track: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 6,
    marginTop: 10,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
  },
  labelValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  percent: {
    fontSize: 11,
  },
});

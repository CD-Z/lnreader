import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '@hooks/persisted';

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

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.track,
          { backgroundColor: theme.surfaceVariant },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${readPercent * 100}%` as any,
              backgroundColor: theme.primary,
            },
          ]}
        />
      </View>
      {total === 0 ? (
        <Text style={[styles.noChaptersText, { color: theme.onSurfaceVariant }]}>
          No chapters
        </Text>
      ) : (
        <View style={styles.labelsRow}>
          <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
            Read {read}
          </Text>
          <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
            Total {total}
          </Text>
          <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
            Downloaded {downloaded}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  track: {
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
  },
  noChaptersText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

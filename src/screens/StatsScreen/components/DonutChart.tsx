import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

import { useTheme } from '@hooks/persisted';

export const DONUT_COLORS: Record<string, string> = {
  Ongoing: '#4CAF50',
  Completed: '#2196F3',
  'On Hiatus': '#FF9800',
  Cancelled: '#F44336',
  Unknown: '#9E9E9E',
  Licensed: '#9C27B0',
  'Publishing Finished': '#009688',
};

interface DonutChartProps {
  entries: { key: string; value: number }[];
  size: number;
  thickness: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  entries,
  size,
  thickness,
}) => {
  const theme = useTheme();

  const total = entries.reduce((s, e) => s + e.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 1; // slight inset to avoid clipping
  const innerRadius = radius - thickness;
  const active = entries.filter(e => e.value > 0);

  // Build accumulated angles (math coords, CW from 3 o'clock)
  const segments: { color: string; startAngle: number; endAngle: number }[] = [];
  let cursor = 0;

  for (const entry of active) {
    const angle = (entry.value / total) * 360;
    segments.push({
      color: DONUT_COLORS[entry.key] || '#9E9E9E',
      startAngle: cursor,
      endAngle: cursor + angle,
    });
    cursor += angle;
  }

  // Convert math angle to SVG coordinate on circle of given radius
  const polarToSvg = (angleDeg: number, r: number) => {
    // SVG y-down: angle 0° = 3 o'clock, positive = clockwise
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size}>
        <G>
          {/* Pie slices (from center to arc) */}
          {segments.map((seg, i) => {
            const start = polarToSvg(seg.startAngle, radius);
            const end = polarToSvg(seg.endAngle, radius);
            const sweepDeg = seg.endAngle - seg.startAngle;
            const largeArc = sweepDeg > 180 ? 1 : 0;

            return (
              <Path
                key={i}
                d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                fill={seg.color}
              />
            );
          })}

          {/* Donut hole overlay */}
          <Circle cx={cx} cy={cy} r={innerRadius} fill={theme.surface} />
        </G>
      </Svg>

      {/* Center count */}
      <View style={[styles.centerLabel, { width: size, height: size }]}>
        <Text style={[styles.centerCount, { color: theme.onSurface }]}>
          {total}
        </Text>
        <Text style={[styles.centerUnit, { color: theme.onSurfaceVariant }]}>
          novels
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  centerUnit: {
    fontSize: 11,
  },
});

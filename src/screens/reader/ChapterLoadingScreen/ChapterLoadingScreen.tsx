import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import color from 'color';

import SkeletonLines from '../components/SkeletonLines';
import { useChapterReaderSettings } from '@hooks/persisted';

const ChapterLoadingScreen = () => {
  const {
    theme: backgroundColor,
    padding,
    textSize,
    lineHeight,
  } = useChapterReaderSettings();
  const [skeletonColor, highlightColor] = useMemo(() => {
    const background = color(backgroundColor);
    // hex() (not toString()) so the colors stay valid for SVG stops,
    // which reject hsl()/hwb() formats
    if (!background.isDark()) {
      return [background.darken(0.06).hex(), background.darken(0.1).hex()];
    }
    if (background.luminosity() !== 0) {
      return [background.lighten(0.15).hex(), background.lighten(0.4).hex()];
    }
    return [
      background.mix(color('#ffffff'), 0.08).hex(),
      background.mix(color('#ffffff'), 0.14).hex(),
    ];
  }, [backgroundColor]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SkeletonLines
        containerMargin={padding}
        containerHeight={'100%'}
        containerWidth={'100%'}
        color={skeletonColor}
        highlightColor={highlightColor}
        textSize={textSize}
        lineHeight={lineHeight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChapterLoadingScreen;

import { IconButtonV2 } from '@components';
import { useTheme } from '@providers/Providers';
import { memo } from 'react';
import { StyleSheet } from 'react-native';

const ChapterBookmarkButtonImpl: React.FC = () => {
  const theme = useTheme();

  return (
    <IconButtonV2
      name="bookmark"
      theme={theme}
      color={theme.primary}
      size={18}
      style={styles.iconButtonLeft}
    />
  );
};
export const ChapterBookmarkButton = memo(ChapterBookmarkButtonImpl);

const styles = StyleSheet.create({
  iconButtonLeft: { marginLeft: 2 },
});

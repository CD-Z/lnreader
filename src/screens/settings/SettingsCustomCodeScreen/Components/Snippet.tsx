import { IconButtonV2 } from '@components';
import Switch from '@components/Switch/Switch';
import { useTheme } from '@hooks/persisted';
import { getString } from '@i18n/translations';
import { CodeSnippet } from '@utils/customCode';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

function Snippet({
  delete: deleteSnippet,
  edit,
  rename,
  snippet,
  index,
  toggle,
}: {
  delete: (index: number, isJS: boolean) => void;
  edit: (index: number, isJS: boolean) => void;
  rename: (index: number, isJS: boolean, name: string) => void;
  toggle: (index: number, isJS: boolean) => void;
  index: number;
  snippet: CodeSnippet;
}) {
  const theme = useTheme();
  const colorTheme = useMemo(() => ({ colors: theme }), [theme]);
  const isJS = snippet.lang === 'js';

  return (
    <View style={[styles.card, { backgroundColor: theme.secondaryContainer }]}>
      <Pressable
        accessibilityHint={getString('customCodeSettings.renameHint')}
        accessibilityLabel={snippet.name}
        accessibilityRole="button"
        accessibilityActions={[
          {
            name: 'activate',
            label: getString('customCodeSettings.renameSnippet'),
          },
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === 'activate') {
            rename(index, isJS, snippet.name);
          }
        }}
        onLongPress={() => rename(index, isJS, snippet.name)}
        style={styles.content}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isJS
                  ? theme.tertiaryContainer
                  : theme.primaryContainer,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: isJS
                    ? theme.onTertiaryContainer
                    : theme.onPrimaryContainer,
                },
              ]}
              theme={colorTheme}
            >
              {isJS ? 'JS' : 'CSS'}
            </Text>
          </View>
          <Text
            numberOfLines={2}
            style={[styles.name, { color: theme.onSurface }]}
            theme={colorTheme}
          >
            {snippet.name}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={[styles.preview, { color: theme.onSurfaceVariant }]}
          theme={colorTheme}
        >
          {snippet.code}
        </Text>
      </Pressable>
      <View style={styles.footer}>
        <Switch
          accessibilityLabel={snippet.name}
          containerStyle={styles.switchContainer}
          value={snippet.active}
          onValueChange={() => toggle(index, isJS)}
        />
        <View style={styles.actions}>
          <IconButtonV2
            accessibilityLabel={getString('common.edit')}
            name="pencil-outline"
            color={theme.onSurface}
            onPress={() => edit(index, isJS)}
            padding={12}
            theme={theme}
          />
          <IconButtonV2
            accessibilityLabel={getString('common.delete')}
            color={theme.onSurface}
            name="delete-outline"
            onPress={() => deleteSnippet(index, isJS)}
            padding={12}
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
}

export default memo(Snippet);

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: 8,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  content: {
    minHeight: 48,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  preview: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  switchContainer: {
    justifyContent: 'center',
    minHeight: 48,
  },
});

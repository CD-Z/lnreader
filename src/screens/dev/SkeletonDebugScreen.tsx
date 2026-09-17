import { memo, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Appbar, SafeAreaView } from '@components';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { SkeletonSection } from '@components/Skeleton/SkeletonSection';
import { useTheme, useAppSettings } from '@hooks/persisted';
import { getLoadingColors } from '@utils/useLoadingColors';
import Switch from '@components/Switch/Switch';

import SourceScreenSkeletonLoading from '@screens/browse/loadingAnimation/SourceScreenSkeletonLoading';
import GlobalSearchSkeletonLoading from '@screens/browse/loadingAnimation/GlobalSearchSkeletonLoading';
import MalLoading from '@screens/browse/loadingAnimation/MalLoading';
import TrackerLoading from '@screens/browse/loadingAnimation/TrackerLoading';
import CategorySkeletonLoading from '@screens/Categories/components/CategorySkeletonLoading';
import HistorySkeletonLoading from '@screens/history/components/HistorySkeletonLoading';
import UpdatesSkeletonLoading from '@screens/updates/components/UpdatesSkeletonLoading';
import ChapterLoadingScreen from '@screens/reader/ChapterLoadingScreen/ChapterLoadingScreen';
import NovelScreenMask, {
  NovelButtonGroupMask,
  NovelChaptersMask,
  NovelHeaderMask,
  NovelMetaMask,
} from '@screens/novel/components/LoadingAnimation/NovelScreenMask';

type Props = {
  navigation: {
    goBack: () => void;
  };
};

const Section = memo(
  ({
    label,
    children,
    containerStyle,
  }: {
    label: string;
    children: React.ReactNode;
    containerStyle?: object;
  }) => {
    const theme = useTheme();
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>
          {label}
        </Text>
        <View
          style={[
            styles.sectionBody,
            { backgroundColor: theme.surface },
            containerStyle,
          ]}
        >
          {children}
        </View>
      </View>
    );
  },
);

const SkeletonColorSwatch = memo(() => {
  const theme = useTheme();
  const [highlightColor, skeletonColor] = getLoadingColors(theme);
  const { disableLoadingAnimations } = useAppSettings();

  return (
    <Section
      label={`Skeleton color (animations ${
        disableLoadingAnimations ? 'disabled' : 'enabled'
      })`}
    >
      <SkeletonSection
        baseColor={skeletonColor}
        highlightColor={highlightColor}
        loading
        style={styles.maskBox40}
        maskElement={
          <SkeletonBlock
            width="100%"
            height={40}
            borderRadius={8}
            color={skeletonColor}
          />
        }
      />
    </Section>
  );
});

type SkeletonRow = {
  id: string;
  label: string;
  render: () => React.ReactNode;
};

const SkeletonDebugScreen = ({ navigation }: Props) => {
  const theme = useTheme();
  const [debugHighlight, debugSkeleton] = getLoadingColors(theme);
  const { width } = useWindowDimensions();
  const { disableLoadingAnimations, setAppSettings } = useAppSettings();
  const [selectedId, setSelectedId] = useState('novel-screen');

  const toggleAnimations = () =>
    setAppSettings({ disableLoadingAnimations: !disableLoadingAnimations });

  const sections = useMemo<SkeletonRow[]>(
    () => [
      { id: 'swatch', label: 'Colors', render: () => <SkeletonColorSwatch /> },
      {
        id: 'source',
        label: 'Source',
        render: () => (
          <Section label="Source screen (grid)">
            <SourceScreenSkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'global-search',
        label: 'Global search',
        render: () => (
          <Section label="Global search">
            <GlobalSearchSkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'novel-screen',
        label: 'Novel screen',
        render: () => (
          <Section label="Novel screen (full mask)">
            <SkeletonSection
              baseColor={debugSkeleton}
              highlightColor={debugHighlight}
              loading
              style={styles.maskBoxFull}
              maskElement={
                <NovelScreenMask
                  color={debugSkeleton}
                  loadingHeader
                  loadingMeta
                  loadingChapters
                  showGenres
                  showReadButton
                />
              }
            />
          </Section>
        ),
      },
      {
        id: 'novel-header',
        label: 'Novel header',
        render: () => (
          <Section label="Novel header (cover + details)">
            <SkeletonSection
              baseColor={debugSkeleton}
              highlightColor={debugHighlight}
              loading
              style={styles.maskBoxHeader}
              maskElement={
                <NovelHeaderMask
                  color={debugSkeleton}
                  active
                  showCoverSkeleton
                  showTitleSkeleton
                />
              }
            />
          </Section>
        ),
      },
      {
        id: 'button-group',
        label: 'Button group',
        render: () => (
          <Section label="Button group (read/migrate/webview)">
            <SkeletonSection
              baseColor={debugSkeleton}
              highlightColor={debugHighlight}
              loading
              style={styles.maskBoxButtons}
              maskElement={
                <NovelButtonGroupMask
                  color={debugSkeleton}
                  active
                  numOfButtons={2}
                />
              }
            />
          </Section>
        ),
      },
      {
        id: 'novel-meta',
        label: 'Novel meta',
        render: () => (
          <Section label="Novel meta (summary + genres)">
            <SkeletonSection
              baseColor={debugSkeleton}
              highlightColor={debugHighlight}
              loading
              style={styles.maskBoxMeta}
              maskElement={
                <NovelMetaMask
                  color={debugSkeleton}
                  active
                  showGenres
                  showReadButton
                />
              }
            />
          </Section>
        ),
      },
      {
        id: 'chapter-list',
        label: 'Chapter list',
        render: () => (
          <Section label="Chapter list (with covers)">
            <SkeletonSection
              baseColor={debugSkeleton}
              highlightColor={debugHighlight}
              loading
              style={styles.maskBoxChapters}
              maskElement={<NovelChaptersMask color={debugSkeleton} />}
            />
          </Section>
        ),
      },
      {
        id: 'history',
        label: 'History',
        render: () => (
          <Section label="History">
            <HistorySkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'updates',
        label: 'Updates',
        render: () => (
          <Section label="Updates">
            <UpdatesSkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'mal',
        label: 'MAL',
        render: () => (
          <Section label="MAL browse">
            <MalLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'tracker',
        label: 'Tracker',
        render: () => (
          <Section label="Tracker">
            <TrackerLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'categories',
        label: 'Categories',
        render: () => (
          <Section label="Categories">
            <CategorySkeletonLoading
              width={Math.min(360, width - 32)}
              height={90}
              theme={theme}
            />
          </Section>
        ),
      },
      {
        id: 'reader',
        label: 'Reader',
        render: () => (
          <Section
            label="Reader chapter loading (full-screen)"
            containerStyle={styles.readerSection}
          >
            <View style={styles.readerBox}>
              <ChapterLoadingScreen />
            </View>
          </Section>
        ),
      },
    ],
    [theme, width, debugHighlight, debugSkeleton],
  );

  const selectedSection = sections.find(section => section.id === selectedId);

  return (
    <SafeAreaView excludeTop>
      <Appbar
        theme={theme}
        title="Skeleton Debug"
        handleGoBack={navigation.goBack}
      />
      <View style={[styles.controls, { backgroundColor: theme.surface }]}>
        <Text style={[styles.controlLabel, { color: theme.onSurface }]}>
          Disable animations (inspect static layout)
        </Text>
        <Switch
          value={disableLoadingAnimations}
          onValueChange={toggleAnimations}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipContent}
      >
        {sections.map(section => {
          const selected = section.id === selectedId;
          return (
            <Pressable
              key={section.id}
              onPress={() => setSelectedId(section.id)}
              android_ripple={{ color: theme.rippleColor }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.primaryContainer
                    : theme.surface,
                  borderColor: selected ? theme.primary : theme.outline,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: selected ? theme.primary : theme.onSurfaceVariant,
                  },
                ]}
              >
                {section.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView style={styles.list} contentContainerStyle={styles.content}>
        {selectedSection?.render()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipContent: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipRow: {
    flexGrow: 0,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  controlLabel: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  list: {
    flex: 1,
  },
  maskBox40: { height: 40 },
  maskBoxButtons: { height: 60 },
  maskBoxChapters: { height: 448 },
  maskBoxFull: { height: 1100 },
  maskBoxHeader: { height: 268 },
  maskBoxMeta: { height: 248 },
  readerBox: {
    height: 300,
    overflow: 'hidden',
    width: '100%',
  },
  readerSection: {
    overflow: 'hidden',
  },
  section: {
    marginBottom: 16,
  },
  sectionBody: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 4,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
});

export default SkeletonDebugScreen;

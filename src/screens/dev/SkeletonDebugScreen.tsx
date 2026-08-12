import { memo, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';

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
import NovelScreenLoading from '@screens/novel/components/LoadingAnimation/NovelScreenLoading';
import CategorySkeletonLoading from '@screens/Categories/components/CategorySkeletonLoading';
import HistorySkeletonLoading from '@screens/history/components/HistorySkeletonLoading';
import UpdatesSkeletonLoading from '@screens/updates/components/UpdatesSkeletonLoading';
import ChapterLoadingScreen from '@screens/reader/ChapterLoadingScreen/ChapterLoadingScreen';
import {
  ChapterListSkeleton,
  NovelMetaSkeleton,
  VerticalBarSkeleton,
} from '@components/Skeleton/Skeleton';
import {
  ButtonGroupSkeleton,
  ChapterCountSkeleton,
  NovelDetailsSkeleton,
} from '@screens/novel/components/Info/NovelInfoSkeletons';

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
      >
        <SkeletonBlock
          width="100%"
          height={40}
          borderRadius={8}
          color={skeletonColor}
        />
      </SkeletonSection>
    </Section>
  );
});

type SkeletonRow = {
  id: string;
  render: () => React.ReactNode;
};

const SkeletonDebugScreen = ({ navigation }: Props) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { disableLoadingAnimations, setAppSettings } = useAppSettings();

  const toggleAnimations = () =>
    setAppSettings({ disableLoadingAnimations: !disableLoadingAnimations });

  const sections = useMemo<SkeletonRow[]>(
    () => [
      { id: 'swatch', render: () => <SkeletonColorSwatch /> },
      {
        id: 'source',
        render: () => (
          <Section label="Source screen (grid)">
            <SourceScreenSkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'global-search',
        render: () => (
          <Section label="Global search">
            <GlobalSearchSkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'novel-screen',
        render: () => (
          <Section label="Novel screen (details + chapters)">
            <NovelScreenLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'chapter-list',
        render: () => (
          <Section label="Chapter list (with covers)">
            <ChapterListSkeleton img />
          </Section>
        ),
      },
      {
        id: 'novel-meta',
        render: () => (
          <Section label="Novel meta (summary + genres)">
            <NovelMetaSkeleton />
          </Section>
        ),
      },
      {
        id: 'vertical-bar',
        render: () => (
          <Section label="Vertical bar">
            <VerticalBarSkeleton />
          </Section>
        ),
      },
      {
        id: 'chapter-count',
        render: () => (
          <Section label="Chapter count">
            <ChapterCountSkeleton theme={theme} />
          </Section>
        ),
      },
      {
        id: 'novel-details',
        render: () => (
          <Section label="Novel details (author/status)">
            <NovelDetailsSkeleton theme={theme} />
          </Section>
        ),
      },
      {
        id: 'button-group',
        render: () => (
          <Section label="Button group (read/migrate/webview)">
            <ButtonGroupSkeleton theme={theme} />
          </Section>
        ),
      },
      {
        id: 'history',
        render: () => (
          <Section label="History">
            <HistorySkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'updates',
        render: () => (
          <Section label="Updates">
            <UpdatesSkeletonLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'mal',
        render: () => (
          <Section label="MAL browse">
            <MalLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'tracker',
        render: () => (
          <Section label="Tracker">
            <TrackerLoading theme={theme} />
          </Section>
        ),
      },
      {
        id: 'categories',
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
    [theme, width],
  );

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
      <LegendList
        data={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => item.render()}
        contentContainerStyle={styles.content}
        style={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

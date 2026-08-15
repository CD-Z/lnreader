import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Row } from '@components/Common';
import { SkeletonBlock } from '@components/Skeleton/SkeletonBlock';
import { styles as chapterItemStyles } from '../ChapterItem';
import { styles as novelInfoComponentStyles } from '../Info/NovelInfoComponents';
import { styles as novelInfoHeaderStyles } from '../Info/NovelInfoHeader';
import { styles as buttonGroupStyles } from '../NovelScreenButtonGroup/NovelScreenButtonGroup';
import { styles as summaryStyles } from '../NovelSummary/NovelSummary';

const INFO_WIDTHS = [130, 180] as const;
const CHIP_WIDTHS = [64, 88, 52, 72] as const;
const CHAPTER_ITEMS = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * Mask parts render their wrapper geometry always (empty Views when inactive)
 * so parts below stay vertically aligned when earlier flags turn off.
 */
const NovelHeaderMask = memo(
  ({
    color,
    active = false,
    showCoverSkeleton = false,
    showTitleSkeleton = false,
  }: {
    color: string;
    active?: boolean;
    showCoverSkeleton?: boolean;
    showTitleSkeleton?: boolean;
  }) => (
    <View style={novelInfoComponentStyles.novelInfoContainer}>
      <View style={novelInfoComponentStyles.novelThumbnailContainer}>
        {active && showCoverSkeleton ? (
          <SkeletonBlock
            width="100%"
            height={150}
            borderRadius={6}
            color={color}
          />
        ) : null}
      </View>
      <View style={novelInfoHeaderStyles.novelDetails}>
        {active ? (
          <>
            <Row style={novelInfoHeaderStyles.infoRow}>
              {showTitleSkeleton ? (
                <SkeletonBlock
                  width="100%"
                  height={novelInfoComponentStyles.novelTitle.fontSize * 1.4}
                  borderRadius={8}
                  color={color}
                />
              ) : (
                <View
                  style={{
                    height: novelInfoComponentStyles.novelTitle.fontSize * 1.4,
                  }}
                />
              )}
            </Row>
            {INFO_WIDTHS.map((width, index) => (
              <Row
                key={`header-info-${index}`}
                style={novelInfoHeaderStyles.infoRow}
              >
                <SkeletonBlock
                  width={width}
                  height={novelInfoComponentStyles.novelInfo.fontSize * 1.4}
                  borderRadius={4}
                  color={color}
                />
              </Row>
            ))}
          </>
        ) : null}
      </View>
    </View>
  ),
);

const NovelButtonGroupMask = memo(
  ({
    color,
    active = false,
    numOfButtons = 2,
  }: {
    color: string;
    active?: boolean;
    numOfButtons: number;
  }) => (
    <View style={buttonGroupStyles.buttonGroupContainer}>
      {Array(numOfButtons)
        .fill(1)
        .map((_, index) => (
          <View
            key={`button-group-${index}`}
            style={[buttonGroupStyles.buttonContainer, styles.buttonSlot]}
          >
            {active ? (
              <SkeletonBlock
                width="100%"
                height="100%"
                borderRadius={0}
                color={color}
              />
            ) : null}
          </View>
        ))}
    </View>
  ),
);

const NovelMetaMask = memo(
  ({
    color,
    active = false,
    showGenres,
    showReadButton,
  }: {
    color: string;
    active?: boolean;
    showGenres: boolean;
    showReadButton: boolean;
  }) => (
    <>
      <View style={summaryStyles.summaryContainer}>
        {[0, 1, 2].map(index => (
          <View
            key={`summary-line-${index}`}
            style={{ height: summaryStyles.summaryText.lineHeight }}
          >
            {active ? (
              <SkeletonBlock
                width="100%"
                height={16}
                borderRadius={4}
                color={color}
              />
            ) : null}
          </View>
        ))}
      </View>
      {showGenres ? (
        <View
          style={[novelInfoComponentStyles.genreContainer, styles.chipsRow]}
        >
          {CHIP_WIDTHS.map(width => (
            <View key={`chip-${width}`} style={styles.chip}>
              {active ? (
                <SkeletonBlock
                  width={width}
                  height={32}
                  borderRadius={8}
                  color={color}
                />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      {showReadButton ? (
        <View style={styles.readButtonBox}>
          {active ? (
            <SkeletonBlock
              width="100%"
              height={40}
              borderRadius={20}
              color={color}
            />
          ) : null}
        </View>
      ) : null}
      <View style={novelInfoHeaderStyles.bottomsheetContainer}>
        <View style={novelInfoHeaderStyles.bottomsheet}>
          <View style={styles.countRow}>
            {active ? (
              <SkeletonBlock
                width={120}
                height={16}
                borderRadius={4}
                color={color}
                style={styles.countBlock}
              />
            ) : (
              <View style={styles.countSpacer} />
            )}
          </View>
        </View>
      </View>
    </>
  ),
);

const NovelChaptersMask = memo(({ color }: { color: string }) => (
  <>
    {CHAPTER_ITEMS.map(index => (
      <View
        key={`chapter-skeleton-${index}`}
        style={chapterItemStyles.chapterCardContainer}
      >
        <View style={styles.chapterText}>
          <SkeletonBlock
            width="100%"
            height={18}
            borderRadius={4}
            color={color}
          />
          <SkeletonBlock
            width="100%"
            height={12}
            borderRadius={4}
            color={color}
            style={styles.chapterMeta}
          />
        </View>
        <SkeletonBlock
          width={30}
          height={30}
          borderRadius={20}
          color={color}
          style={styles.chapterIcon}
        />
      </View>
    ))}
  </>
));

interface NovelScreenMaskProps {
  color: string;
  loadingHeader: boolean;
  loadingMeta: boolean;
  loadingChapters: boolean;
  showGenres: boolean;
  showReadButton: boolean;
  numOfButtons?: number;
}

const NovelScreenMask = ({
  color,
  loadingHeader,
  loadingMeta,
  loadingChapters,
  showGenres,
  showReadButton,
  numOfButtons = 2,
}: NovelScreenMaskProps) => (
  <>
    <NovelHeaderMask color={color} active={loadingHeader} />
    <NovelButtonGroupMask
      numOfButtons={numOfButtons}
      color={color}
      active={loadingHeader}
    />
    <NovelMetaMask
      color={color}
      active={loadingMeta}
      showGenres={showGenres}
      showReadButton={showReadButton}
    />
    {loadingChapters ? <NovelChaptersMask color={color} /> : null}
  </>
);

const styles = StyleSheet.create({
  buttonSlot: { height: 60 },
  chip: { marginHorizontal: 2 },
  chapterIcon: { marginLeft: 20, marginRight: 5 },
  chapterMeta: { marginTop: 4 },
  chapterText: { flex: 1 },
  chipsRow: { flexDirection: 'row', marginTop: -8 },
  countBlock: { marginHorizontal: 16 },
  countRow: { flex: 1, marginTop: 20, marginBottom: 16 },
  countSpacer: { height: 14, marginHorizontal: 16 },
  readButtonBox: { height: 40, margin: 16 },
});

export default memo(NovelScreenMask);
export {
  NovelButtonGroupMask,
  NovelChaptersMask,
  NovelHeaderMask,
  NovelMetaMask,
};

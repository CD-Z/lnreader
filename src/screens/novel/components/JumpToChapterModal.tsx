import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { getString } from '@strings/translations';
import { Modal } from '@components';

import {
  Text as DSText,
  TextInput as DSTextInput,
  Switch as DSSwitch,
  Button as DSButton,
} from '@components/design-system';
import { useTheme } from '@providers/Providers';
import { ChapterInfo } from '@database/types';
import { NovelScreenProps } from '@navigators/types';
import { FlashList, FlashListRef, ListRenderItem } from '@shopify/flash-list';
import useNovelState from '@hooks/persisted/novel/useNovelState';
import useNovelChapters from '@hooks/persisted/novel/useNovelChapters';
import { Portal } from 'tamagui';

interface JumpToChapterModalProps {
  hideModal: () => void;
  modalVisible: boolean;
  navigation: NovelScreenProps['navigation'];
  chapterListRef: React.RefObject<FlashListRef<ChapterInfo> | null>;
}

const JumpToChapterModal = ({
  hideModal,
  modalVisible,
  navigation,
  chapterListRef,
}: JumpToChapterModalProps) => {
  const { novel, loading } = useNovelState();
  const { chapters } = useNovelChapters();
  const minNumber = Math.min(...chapters.map(c => c.chapterNumber || -1));
  const maxNumber = Math.max(...chapters.map(c => c.chapterNumber || -1));
  const theme = useTheme();
  const [mode, setMode] = useState(false);
  const [openChapter, setOpenChapter] = useState(false);

  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ChapterInfo[]>([]);

  const onDismiss = () => {
    hideModal();
    setText('');
    setError('');
    setResult([]);
  };
  const navigateToChapter = (chap: ChapterInfo) => {
    onDismiss();
    if (loading) return;
    navigation.navigate('Chapter', {
      novel: novel,
      chapter: chap,
    });
  };

  const scrollToChapter = (chap: ChapterInfo) => {
    onDismiss();
    chapterListRef.current?.scrollToItem({
      animated: true,
      item: chap,
      viewPosition: 0.5,
    });
  };

  const scrollToIndex = (index: number) => {
    onDismiss();
    chapterListRef.current?.scrollToIndex({
      animated: true,
      index: index,
      viewPosition: 0.5,
    });
  };

  const executeFunction = (item: ChapterInfo) => {
    if (openChapter) {
      navigateToChapter(item);
    } else {
      scrollToChapter(item);
    }
  };

  const renderItem: ListRenderItem<ChapterInfo> = ({ item }) => {
    return (
      <Pressable
        android_ripple={{ color: theme.rippleColor }}
        onPress={() => executeFunction(item)}
        style={styles.listElementContainer}
      >
        <DSText numberOfLines={1} style={{ color: theme.onSurface }}>
          {item.name}
        </DSText>
        {item?.releaseTime ? (
          <DSText
            numberOfLines={1}
            style={[{ color: theme.onSurfaceVariant }, styles.dateCtn]}
          >
            {item.releaseTime}
          </DSText>
        ) : null}
      </Pressable>
    );
  };

  const onSubmit = () => {
    if (!mode) {
      const num = Number(text);
      if (num && num >= minNumber && num <= maxNumber) {
        if (openChapter) {
          const chapter = chapters.find(c => c.chapterNumber === num);
          if (chapter) {
            return navigateToChapter(chapter);
          }
        } else {
          const index = chapters.findIndex(c => c.chapterNumber === num);
          return scrollToIndex(index);
        }
      }
      return setError(
        getString('novelScreen.jumpToChapterModal.error.validChapterNumber') +
          ` (${num < minNumber ? '≥ ' + minNumber : '≤ ' + maxNumber})`,
      );
    } else {
      const searchedChapters = chapters.filter(chap =>
        chap.name.toLowerCase().includes(text?.toLowerCase()),
      );

      if (!searchedChapters.length) {
        setError(
          getString('novelScreen.jumpToChapterModal.error.validChapterName'),
        );
        return;
      }

      if (searchedChapters.length === 1) {
        if (openChapter) {
          return navigateToChapter(searchedChapters[0]);
        }
        return scrollToChapter(searchedChapters[0]);
      }

      return setResult(searchedChapters);
    }
  };

  const onChangeText = (txt: string) => {
    setText(txt);
    setResult([]);
  };

  // const errorColor = !theme.isDark ? '#B3261E' : '#F2B8B5';
  const placeholder = mode
    ? getString('novelScreen.jumpToChapterModal.chapterName')
    : getString('novelScreen.jumpToChapterModal.chapterNumber') +
      ` (≥ ${minNumber},  ≤ ${maxNumber})`;

  // preserved variables from previous styling no longer used
  return (
    <Portal>
      <Modal visible={modalVisible} onDismiss={onDismiss}>
        <View>
          <DSText style={[styles.modalTitle, { color: theme.onSurface }]}>
            {getString('novelScreen.jumpToChapterModal.jumpToChapter')}
          </DSText>
          <DSTextInput
            label={placeholder}
            mode="outlined"
            value={text}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit as any}
            keyboardType={mode ? 'default' : 'numeric'}
            helperText={error}
            error={!!error}
          />
          <View style={{ height: 8 }} />
          <DSSwitch
            label={getString('novelScreen.jumpToChapterModal.openChapter')}
            value={openChapter}
            onValueChange={setOpenChapter}
          />
          <DSSwitch
            label={getString('novelScreen.jumpToChapterModal.chapterName')}
            value={mode}
            onValueChange={setMode}
          />
        </View>
        {result.length ? (
          <View style={[styles.flashlist, { borderColor: theme.outline }]}>
            <FlashList
              data={result}
              extraData={openChapter}
              renderItem={renderItem}
              contentContainerStyle={styles.listContentCtn}
            />
          </View>
        ) : null}
        <View style={styles.modalFooterCtn}>
          <DSButton onPress={onSubmit}>{getString('common.submit')}</DSButton>
          <DSButton onPress={hideModal}>{getString('common.cancel')}</DSButton>
        </View>
      </Modal>
    </Portal>
  );
};

export default JumpToChapterModal;

const styles = StyleSheet.create({
  dateCtn: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    paddingTop: 12,
  },
  flashlist: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    height: 300,
    marginTop: 8,
  },
  listContentCtn: {
    paddingVertical: 8,
  },
  listElementContainer: {
    paddingVertical: 12,
  },
  modalFooterCtn: {
    flexDirection: 'row-reverse',
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  textInput: {
    borderRadius: 4,
    borderStyle: 'solid',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});

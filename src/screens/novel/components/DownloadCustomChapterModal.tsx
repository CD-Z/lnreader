import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import IconButtonV2 from '@components/IconButtonV2/IconButtonV2';
import {
  Button as DSButton,
  TextInput as DSTextInput,
  Text as DSText,
} from '@components/design-system';
import { ChapterInfo, NovelInfo } from '@database/types';
import { getString } from '@strings/translations';
import { Modal } from '@components';
import { useTheme } from '@providers/Providers';
import { useNovelChapters, useNovelState } from '@hooks/persisted/index';
import { Portal } from 'tamagui';

interface DownloadCustomChapterModalProps {
  hideModal: () => void;
  modalVisible: boolean;
  downloadChapters: (novel: NovelInfo, chapters: ChapterInfo[]) => void;
}

const DownloadCustomChapterModal = ({
  hideModal,
  modalVisible,
  downloadChapters,
}: DownloadCustomChapterModalProps) => {
  const theme = useTheme();
  const { novel, loading } = useNovelState();
  const { chapters } = useNovelChapters();

  const [text, setText] = useState(0);

  const onDismiss = () => {
    hideModal();
    setText(0);
  };

  const onSubmit = () => {
    hideModal();
    if (loading) return;
    downloadChapters(
      novel,
      chapters
        .filter(chapter => chapter.unread && !chapter.isDownloaded)
        .slice(0, text),
    );
  };

  const onChangeText = (txt: string) => {
    if (Number(txt) >= 0) {
      setText(Number(txt));
    }
  };

  return (
    <Portal>
      <Modal visible={modalVisible} onDismiss={onDismiss}>
        <DSText style={[styles.modalTitle, { color: theme.onSurface }]}>
          {getString('novelScreen.download.customAmount')}
        </DSText>
        <View style={styles.row}>
          <IconButtonV2
            name="chevron-double-left"
            theme={theme}
            onPress={() => text > 9 && setText(prevState => prevState - 10)}
          />
          <IconButtonV2
            name="chevron-left"
            theme={theme}
            onPress={() => text > 0 && setText(prevState => prevState - 1)}
          />
          <DSTextInput
            value={String(text)}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit as any}
            keyboardType="numeric"
            mode="outlined"
            style={styles.marginHorizontal}
          />
          <IconButtonV2
            name="chevron-right"
            theme={theme}
            onPress={() => setText(prevState => prevState + 1)}
          />
          <IconButtonV2
            name="chevron-double-right"
            theme={theme}
            onPress={() => setText(prevState => prevState + 10)}
          />
        </View>
        <DSButton onPress={onSubmit}>
          {getString('libraryScreen.bottomSheet.display.download')}
        </DSButton>
      </Modal>
    </Portal>
  );
};

export default DownloadCustomChapterModal;

const styles = StyleSheet.create({
  errorText: {
    color: '#FF0033',
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'center' },
  marginHorizontal: { marginHorizontal: 4 },
});

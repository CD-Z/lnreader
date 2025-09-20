import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { updateNovelInfo } from '@database/queries/NovelQueries';

import { getString } from '@strings/translations';
import { Modal } from '@components';
import { Portal } from 'tamagui';
import { ThemeColors } from '@theme/types';
import { NovelStatus } from '@plugins/types';
import { translateNovelStatus } from '@utils/translateEnum';
import useNovelState from '@hooks/persisted/novel/useNovelState';
import { NovelInfo } from '@database/types';
import {
  Button as DSButton,
  TextInput as DSTextInput,
  Text as DSText,
  Chip as DSChip,
} from '@components/design-system';

interface EditInfoModalProps {
  theme: ThemeColors;
  hideModal: () => void;
  modalVisible: boolean;
}

// --- Dynamic style helpers ---
const getModalTitleColor = (theme: ThemeColors) => ({ color: theme.onSurface });
const getStatusLabelColor = (theme: ThemeColors) => ({
  color: theme.onSurfaceVariant,
});
const getScrollViewStyle = () => styles.statusScrollView;
const getStatusChipContainer = () => styles.statusChipContainer;
const getStatusChipPressable = (selected: boolean, theme: ThemeColors) => ({
  backgroundColor: selected ? theme.rippleColor : 'transparent',
});
const getStatusChipText = (selected: boolean, theme: ThemeColors) => ({
  color: selected ? theme.primary : theme.onSurfaceVariant,
});
const getGenreListStyle = () => styles.genreList;
const getButtonRowStyle = () => styles.buttonRow;
const getFlex1 = () => styles.flex1;

// --- Main Component ---
const EditInfoModal = ({
  theme,
  hideModal,
  modalVisible,
}: EditInfoModalProps) => {
  const { novel: _novel, setNovel, loading } = useNovelState();
  const novel = _novel as NovelInfo;
  const initialNovelInfo = { ...novel };
  const [novelInfo, setNovelInfo] = useState<NovelInfo>(novel);

  const [newGenre, setNewGenre] = useState('');

  useEffect(() => {
    if (loading) return;
    setNovelInfo(novel);
  }, [loading, novel]);

  const removeTag = (t: string) => {
    if (!novelInfo || loading) return;
    setNovelInfo({
      ...novel,
      genres: novelInfo.genres
        ?.split(',')
        .filter(item => item !== t)
        ?.join(','),
    });
  };

  const status = Object.values(NovelStatus);

  if (!novelInfo || loading) return null;

  return (
    <Portal>
      <Modal visible={modalVisible} onDismiss={hideModal}>
        <DSText style={[styles.modalTitle, getModalTitleColor(theme)]}>
          {getString('novelScreen.edit.info')}
        </DSText>
        <View style={styles.statusRow}>
          <DSText style={getStatusLabelColor(theme)}>
            {getString('novelScreen.edit.status')}
          </DSText>
          <ScrollView
            style={getScrollViewStyle()}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {status.map((item, index) => (
              <View style={getStatusChipContainer()} key={'novelInfo' + index}>
                <Pressable
                  style={[
                    styles.statusChipPressable,
                    getStatusChipPressable(novelInfo.status === item, theme),
                  ]}
                  android_ripple={{
                    color: theme.rippleColor,
                  }}
                  onPress={() => setNovelInfo({ ...novel, status: item })}
                >
                  <DSText
                    style={getStatusChipText(novelInfo.status === item, theme)}
                  >
                    {translateNovelStatus(item)}
                  </DSText>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
        <DSTextInput
          defaultValue={initialNovelInfo.name}
          value={novelInfo.name}
          placeholder={getString('novelScreen.edit.title', {
            title: novel.name,
          })}
          numberOfLines={1}
          mode="outlined"
          onChangeText={text => setNovelInfo({ ...novel, name: text })}
          style={styles.inputWrapper}
        />
        <DSTextInput
          defaultValue={initialNovelInfo.author ?? ''}
          value={novelInfo.author}
          placeholder={getString('novelScreen.edit.author', {
            author: novel.author,
          })}
          numberOfLines={1}
          mode="outlined"
          onChangeText={text => setNovelInfo({ ...novel, author: text })}
          style={styles.inputWrapper}
        />
        <DSTextInput
          defaultValue={initialNovelInfo.artist}
          value={novelInfo.artist}
          placeholder={'Artist: ' + novel.artist}
          numberOfLines={1}
          mode="outlined"
          onChangeText={text => setNovelInfo({ ...novel, artist: text })}
          style={styles.inputWrapper}
        />
        <DSTextInput
          defaultValue={initialNovelInfo.summary}
          value={novelInfo.summary}
          placeholder={getString('novelScreen.edit.summary', {
            summary: novel.summary?.substring(0, 16),
          })}
          numberOfLines={1}
          mode="outlined"
          onChangeText={text => setNovelInfo({ ...novel, summary: text })}
          style={styles.inputWrapper}
        />

        <DSTextInput
          value={newGenre}
          placeholder={getString('novelScreen.edit.addTag')}
          numberOfLines={1}
          mode="outlined"
          onChangeText={text => setNewGenre(text)}
          onSubmitEditing={() => {
            const newGenreTrimmed = newGenre.trim();

            if (newGenreTrimmed === '') {
              return;
            }

            setNovelInfo(prevVal => ({
              ...prevVal,
              genres: novelInfo.genres
                ? `${novelInfo.genres},` + newGenreTrimmed
                : newGenreTrimmed,
            }));
            setNewGenre('');
          }}
          style={styles.inputWrapper}
        />

        {novelInfo.genres !== undefined && novelInfo.genres !== '' ? (
          <FlatList
            style={getGenreListStyle()}
            horizontal
            data={novelInfo.genres?.split(',')}
            keyExtractor={(_, index) => 'novelTag' + index}
            renderItem={({ item }) => (
              <DSChip key={item} onClose={() => removeTag(item)}>
                {item}
              </DSChip>
            )}
            showsHorizontalScrollIndicator={false}
          />
        ) : null}
        <View style={getButtonRowStyle()}>
          <DSButton
            mode="outlined"
            onPress={() => {
              setNovelInfo(initialNovelInfo);
              updateNovelInfo(initialNovelInfo);
            }}
          >
            {getString('common.reset')}
          </DSButton>
          <View style={getFlex1()} />
          <DSButton
            mode="contained"
            onPress={() => {
              setNovel(novelInfo);
              updateNovelInfo(novelInfo);
              hideModal();
            }}
          >
            {getString('common.save')}
          </DSButton>
          <DSButton mode="text" onPress={hideModal}>
            {getString('common.cancel')}
          </DSButton>
        </View>
      </Modal>
    </Portal>
  );
};

export default EditInfoModal;

const styles = StyleSheet.create({
  inputWrapper: {
    fontSize: 14,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  statusRow: {
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusScrollView: {
    marginLeft: 8,
  },
  statusChipContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusChipPressable: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  genreList: {
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
});

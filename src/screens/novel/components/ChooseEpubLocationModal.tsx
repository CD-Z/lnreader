import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { openDocumentTree } from 'react-native-saf-x';

import { Button, List, Modal, SwitchItem } from '@components';

import { useBoolean } from '@hooks';
import { getString } from '@strings/translations';
import { useTheme } from '@hooks/persisted';
import { showToast } from '@utils/showToast';
import { useSettingsContext } from '@components/Context/SettingsContext';

interface ChooseEpubLocationModalProps {
  isVisible: boolean;
  onSubmit?: (uri: string) => void;
  hideModal: () => void;
}

const ChooseEpubLocationModal: React.FC<ChooseEpubLocationModalProps> = ({
  isVisible,
  onSubmit: onSubmitProp,
  hideModal,
}) => {
  const theme = useTheme();
  const {
    epubLocation,
    epubUseAppTheme,
    epubUseCustomCSS,
    epubUseCustomJS,
    setSettings: setChapterReaderSettings,
  } = useSettingsContext();

  const [uri, setUri] = useState(epubLocation);
  const useAppTheme = useBoolean(epubUseAppTheme);
  const useCustomCSS = useBoolean(epubUseCustomCSS);
  const useCustomJS = useBoolean(epubUseCustomJS);

  const onDismiss = () => {
    hideModal();
    setUri(epubLocation);
  };

  const onSubmit = () => {
    setChapterReaderSettings({
      epubLocation: uri,
      epubUseAppTheme: useAppTheme.value,
      epubUseCustomCSS: useCustomCSS.value,
      epubUseCustomJS: useCustomJS.value,
    });

    onSubmitProp?.(uri);
    hideModal();
  };

  const openFolderPicker = async () => {
    try {
      const resultUri = await openDocumentTree(true);
      if (resultUri) {
        setUri(resultUri.uri);
      }
    } catch (error: any) {
      showToast(error.message);
    }
  };

  return (
    <Modal visible={isVisible} onDismiss={onDismiss}>
      <View>
        <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
          {getString('novelScreen.convertToEpubModal.chooseLocation')}
        </Text>
        <TextInput
          onChangeText={setUri}
          value={uri}
          placeholder={getString('novelScreen.convertToEpubModal.pathToFolder')}
          onSubmitEditing={onSubmit}
          mode="outlined"
          theme={{ colors: { ...theme } }}
          underlineColor={theme.outline}
          dense
          right={
            <TextInput.Icon
              icon="folder-edit-outline"
              onPress={openFolderPicker}
            />
          }
        />
      </View>
      <View style={styles.settings}>
        <SwitchItem
          label={getString('novelScreen.convertToEpubModal.useReaderTheme')}
          value={useAppTheme.value}
          onPress={useAppTheme.toggle}
          theme={theme}
        />
        <SwitchItem
          label={getString('novelScreen.convertToEpubModal.useCustomCSS')}
          value={useCustomCSS.value}
          onPress={useCustomCSS.toggle}
          theme={theme}
        />
        <SwitchItem
          label={getString('novelScreen.convertToEpubModal.useCustomJS')}
          description={getString(
            'novelScreen.convertToEpubModal.useCustomJSWarning',
          )}
          value={useCustomJS.value}
          onPress={useCustomJS.toggle}
          theme={theme}
        />
      </View>
      <List.InfoItem
        style={styles.infoItem}
        title={getString('novelScreen.convertToEpubModal.chaptersWarning')}
        theme={theme}
      />
      <View style={styles.modalFooterCtn}>
        <Button title={getString('common.submit')} onPress={onSubmit} />
        <Button title={getString('common.cancel')} onPress={hideModal} />
      </View>
    </Modal>
  );
};

export default ChooseEpubLocationModal;

const styles = StyleSheet.create({
  infoItem: {
    paddingHorizontal: 0,
  },

  modalFooterCtn: {
    flexDirection: 'row-reverse',

    paddingBottom: 20,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  settings: {
    marginTop: 12,
  },
});

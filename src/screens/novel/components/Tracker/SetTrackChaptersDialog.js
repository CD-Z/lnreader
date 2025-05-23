import { Modal } from '@components';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { TextInput } from 'react-native-paper';

const SetTrackChaptersDialog = ({
  trackItem,
  trackChaptersDialog,
  setTrackChaptersDialog,
  updateTrackChapters,
  theme,
}) => {
  const [trackChapters, setTrackChapters] = useState(trackItem.progress);

  return (
    <Modal
      visible={trackChaptersDialog}
      onDismiss={() => setTrackChaptersDialog(false)}
    >
      <Text style={[styles.dialogTitle, { color: theme.onSurface }]}>
        Chapters
      </Text>
      <TextInput
        value={trackChapters.toString()}
        onChangeText={text => setTrackChapters(text ? +text : '')}
        onSubmitEditing={() => updateTrackChapters(trackChapters)}
        mode="outlined"
        keyboardType="numeric"
        theme={{
          colors: {
            primary: theme.primary,
            placeholder: theme.outline,
            text: theme.onSurface,
            background: 'transparent',
          },
        }}
        underlineColor={theme.outline}
      />
    </Modal>
  );
};

export default SetTrackChaptersDialog;

const styles = StyleSheet.create({
  dialogTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
});

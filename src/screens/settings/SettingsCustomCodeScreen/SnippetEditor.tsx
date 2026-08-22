import { getString } from '@i18n/translations';
import React from 'react';
import { StyleSheet } from 'react-native';
import CodeInput from './Components/CodeInput';
import { showToast } from '@utils/showToast';
import { useChapterReaderSettings, useTheme } from '@hooks/persisted';
import { TextInput as PaperTextInput } from 'react-native-paper';

import { useNavigation } from '@react-navigation/native';
import { Dialog } from '@components';
export type SnippetEditorHandle = {
  save: () => void;
  setCode: (val: string) => void;
  getCode: () => string;
};

type SnippetEditorProps = {
  snippetIndex?: number;
  language: 'css' | 'js';
};

const SnippetEditor = React.forwardRef<SnippetEditorHandle, SnippetEditorProps>(
  ({ snippetIndex, language }, ref) => {
    const navigation = useNavigation();
    const theme = useTheme();
    const {
      codeSnippetsJS,
      codeSnippetsCSS,
      setChapterReaderSettings: setSettings,
    } = useChapterReaderSettings();

    const isEditing = snippetIndex !== undefined && snippetIndex >= 0;
    const snippets = language === 'js' ? codeSnippetsJS : codeSnippetsCSS;
    const snippet = isEditing ? snippets[snippetIndex!] : null;

    const [code, setCode] = React.useState<string>(snippet?.code ?? '');
    const [error, setError] = React.useState({ code: false });

    const [snippetName, setSnippetName] = React.useState('');

    const [showNameModal, setShowNameModal] = React.useState(false);

    const save = React.useCallback(() => {
      setError({ code: false });
      if (!code.trim()) {
        setError({ code: true });
        return;
      }
      if (isEditing) {
        const newSnippets = [...snippets];
        newSnippets[snippetIndex!].code = code;
        setSettings({
          [language === 'js' ? 'codeSnippetsJS' : 'codeSnippetsCSS']:
            newSnippets,
        });
        showToast(getString('customCodeSettings.snippetUpdated'));
        navigation.goBack();
      } else {
        setShowNameModal(true);
      }
    }, [
      code,
      snippets,
      setSettings,
      isEditing,
      snippetIndex,
      language,
      navigation,
    ]);
    const handleNameModalSave = React.useCallback(() => {
      if (!snippetName.trim()) return false;
      const newSnippets = [...snippets];
      newSnippets.push({
        name: snippetName.trim(),
        code,
        active: true,
        lang: language,
      });
      setSettings({
        [language === 'js' ? 'codeSnippetsJS' : 'codeSnippetsCSS']: newSnippets,
      });
      showToast(getString('customCodeSettings.snippetSaved'));
      setShowNameModal(false);
      navigation.goBack();
      return true;
    }, [snippetName, code, language, snippets, setSettings, navigation]);

    const handleNameModalCancel = React.useCallback(() => {
      setShowNameModal(false);
      setSnippetName('');
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({ save, setCode, getCode: () => code }),
      [save, setCode, code],
    );

    return (
      <>
        <CodeInput
          language={language}
          code={code}
          setCode={setCode}
          error={error.code}
        />
        <Dialog.Root visible={showNameModal} onDismiss={handleNameModalCancel}>
          <Dialog.Header>
            <Dialog.Title>{getString('common.name')}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Content>
            <PaperTextInput
              label={getString('common.name')}
              defaultValue={snippetName}
              onChangeText={setSnippetName}
              autoFocus
              mode="outlined"
              style={styles.mb16}
              theme={{ colors: theme }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Dialog.Action onPress={handleNameModalCancel}>
              Cancel
            </Dialog.Action>
            <Dialog.Action
              onPress={() => {
                if (handleNameModalSave()) setShowNameModal(false);
              }}
            >
              Save
            </Dialog.Action>
          </Dialog.Actions>
        </Dialog.Root>
      </>
    );
  },
);

export default React.memo(SnippetEditor);

const styles = StyleSheet.create({
  mb16: { marginBottom: 16 },
});

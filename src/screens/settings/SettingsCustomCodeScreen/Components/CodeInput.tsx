import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useTheme } from '@hooks/persisted';
import { getString } from '@i18n/translations';

import {
  AndroidSoftInputModes,
  KeyboardController,
  useKeyboardContext,
} from 'react-native-keyboard-controller';

import { buildEditorTheme } from './editorTheme';

type CodeInputProps = {
  language: 'css' | 'js';
  code: string;
  setCode: (code: string) => void;
  error?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

type NativeEditorMessage =
  | {
      type: 'READY';
    }
  | {
      type: 'CODE_CHANGE';
      value: string;
    }
  | {
      type: 'FOCUS';
    }
  | {
      type: 'BLUR';
    }
  | {
      type: 'EDITOR_ERROR';
      value: string;
    };

type EditorMessage = {
  type: string;
  value?: unknown;
};

const START_JS_CODE = `const qs = (s) => document.querySelector(s);
let html = qs("#LNReader-chapter").innerHTML;`;

const START_CSS_CODE = `:root {
  --StatusBar-currentHeight: number px;
  --readerSettings-theme: color;
  --readerSettings-padding: number px;
  --readerSettings-textSize: number px;
  --readerSettings-textColor: color;
  --readerSettings-textAlign: alignment;
  --readerSettings-lineHeight: number;
  --readerSettings-fontFamily: font;
  --theme-primary: color;
  --theme-onPrimary: color;
  --theme-secondary: color;
  --theme-tertiary: color;
  --theme-onTertiary: color;
  --theme-onSecondary: color;
  --theme-surface: color;
  --theme-surface-0-9: color;
  --theme-onSurface: color;
  --theme-surfaceVariant: color;
  --theme-onSurfaceVariant: color;
  --theme-outline: color;
  --theme-rippleColor: color;
}`;

const END_JS_CODE = 'qs("#LNReader-chapter").innerHTML = html;';

const assetsUriPrefix = __DEV__
  ? 'http://localhost:8081/assets'
  : 'file:///android_asset';

const EDITOR_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0,
        maximum-scale=1.0, user-scalable=no"
    />
    <style>
      html,
      body {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        overscroll-behavior: none;
        background: transparent;
      }

      #editor {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
      }

      * {
        box-sizing: border-box;
      }
    </style>
    <script
      src="${assetsUriPrefix}/editor/codemirror.js"
    ></script>
  </head>
  <body>
    <div id="editor"></div>

    <script>
      (function () {
        var api = CM6.createEditor(
          document.getElementById('editor'),
        );

        var editorEl = document.getElementById('editor');
        function syncEditorHeight() {
          var vv = window.visualViewport;
          editorEl.style.height = (vv ? vv.height : window.innerHeight) + 'px';
        }
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', syncEditorHeight);
        }
        syncEditorHeight();

        function handleNativeMessage(event) {
          try {
            api.handleMessage(JSON.parse(event.data));
          } catch (error) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'EDITOR_ERROR',
                value:
                  error instanceof Error
                    ? error.message
                    : String(error),
              }),
            );
          }
        }

        document.addEventListener(
          'message',
          handleNativeMessage,
        );
        window.addEventListener(
          'message',
          handleNativeMessage,
        );

        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'READY',
          }),
        );
      })();
    </script>
  </body>
</html>`;

function getWrapper(language: 'css' | 'js'): {
  prefix: string;
  suffix: string;
} {
  if (language === 'js') {
    return {
      prefix: `${START_JS_CODE}\n`,
      suffix: `\n${END_JS_CODE}`,
    };
  }

  return {
    prefix: `${START_CSS_CODE}\n`,
    suffix: '',
  };
}

const CodeInput = ({
  language,
  code,
  setCode,
  onFocus,
  onBlur,
  error: externalError,
}: CodeInputProps) => {
  const theme = useTheme();
  const webViewRef = React.useRef<WebView<object>>(null);
  const readyRef = React.useRef(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [syntaxError, setSyntaxError] = React.useState<string>();

  const wrapper = React.useMemo(() => getWrapper(language), [language]);

  const editorTheme = React.useMemo(() => buildEditorTheme(theme), [theme]);

  const postMessage = React.useCallback((message: EditorMessage) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  const scrollWebViewIntoView = React.useCallback(() => {
    if (readyRef.current) {
      postMessage({ type: 'SCROLL_INTO_VIEW' });
    }
  }, [postMessage]);

  const {
    reanimated: { height: keyboardHeight },
  } = useKeyboardContext();

  React.useEffect(() => {
    // The window stays full-size; the animated padding below shrinks the
    // WebView to the visible area, so the layout viewport never exceeds
    // the screen and the editor cannot be panned out of view.
    KeyboardController.setInputMode(
      AndroidSoftInputModes.SOFT_INPUT_ADJUST_NOTHING,
    );

    return () => KeyboardController.setDefaultMode();
  }, []);

  // On API 30+ the keyboard height arrives in one jump when the keyboard
  // opens (no per-frame insets events), while closing reports every frame.
  // Ease only the opening jump, calibrated by how long the last close
  // animation ran, so both directions track at any animator scale. The
  // caret scrolls into view once the easing settles, not per resize frame.
  const paddingHeight = useSharedValue(0);
  const openDuration = useSharedValue(250);
  const closeStartedAt = useSharedValue(0);

  useAnimatedReaction(
    () => keyboardHeight.value,
    (height, previous) => {
      if (height === previous) {
        return;
      }

      // keyboardHeight is negative while the keyboard is visible
      const keyboardNow = Math.abs(height);
      const keyboardBefore = Math.abs(previous ?? 0);
      const isOpening = keyboardBefore === 0 && keyboardNow > 0;
      const isClosing = keyboardBefore > 0 && keyboardNow === 0;
      const isMidClose = keyboardBefore > 0 && keyboardNow > 0;
      if (isOpening) {
        closeStartedAt.value = 0;
        paddingHeight.value = withTiming(
          keyboardNow,
          { duration: openDuration.value },
          finished => {
            if (finished) {
              runOnJS(scrollWebViewIntoView)();
            }
          },
        );
      } else if (isMidClose) {
        if (!closeStartedAt.value) {
          closeStartedAt.value = performance.now();
        }
        paddingHeight.value = keyboardNow;
      } else if (isClosing) {
        if (closeStartedAt.value) {
          const measured = performance.now() - closeStartedAt.value;
          if (measured > 60) {
            openDuration.value = measured;
          }
          closeStartedAt.value = 0;
        }
        paddingHeight.value = 0;
      } else {
        paddingHeight.value = keyboardNow;
      }
    },
  );

  const webViewStyle = useAnimatedStyle(() => ({
    paddingBottom: paddingHeight.value,
  }));

  const analyzeCode = React.useCallback(
    (value: string) => {
      if (language !== 'js') {
        setSyntaxError(undefined);
        return;
      }

      try {
        new Function(value);
        setSyntaxError(undefined);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        setSyntaxError(message);
      }
    },
    [language],
  );

  const setAndAnalyzeCode = React.useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (language === 'js') {
        debounceRef.current = setTimeout(() => {
          analyzeCode(value);
        }, 500);
      }

      setCode(value);
    },
    [analyzeCode, language, setCode],
  );

  const initializeEditor = React.useCallback(() => {
    postMessage({
      type: 'INITIALIZE',
      value: {
        language,
        prefix: wrapper.prefix,
        suffix: wrapper.suffix,
        code,
        placeholder: getString('customCodeSettings.yourCodeHere'),
        theme: editorTheme,
      },
    });
  }, [
    code,
    editorTheme,
    language,
    postMessage,
    wrapper.prefix,
    wrapper.suffix,
  ]);

  const handleMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      let message: NativeEditorMessage;

      try {
        message = JSON.parse(event.nativeEvent.data) as NativeEditorMessage;
      } catch {
        return;
      }

      switch (message.type) {
        case 'READY':
          readyRef.current = true;
          initializeEditor();
          break;

        case 'CODE_CHANGE':
          setAndAnalyzeCode(message.value);
          break;

        case 'FOCUS':
          onFocus?.();
          break;

        case 'BLUR':
          onBlur?.();
          break;

        case 'EDITOR_ERROR':
          setSyntaxError(message.value);
          break;
      }
    },
    [initializeEditor, onBlur, onFocus, setAndAnalyzeCode],
  );

  React.useEffect(() => {
    if (!readyRef.current) {
      return;
    }

    postMessage({
      type: 'SET_CODE',
      value: code,
    });
  }, [code, postMessage]);

  React.useEffect(() => {
    if (!readyRef.current) {
      return;
    }

    postMessage({
      type: 'SET_THEME',
      value: editorTheme,
    });
  }, [editorTheme, postMessage]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const displayedError =
    syntaxError ?? (externalError ? 'Invalid code' : undefined);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.error,
          {
            backgroundColor: theme.errorContainer,
            maxHeight: displayedError ? 35 : 0,
            padding: displayedError ? 8 : 0,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.errorText,
            {
              color: theme.onErrorContainer,
            },
          ]}
        >
          {displayedError}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.webViewContainer, webViewStyle]}>
        <WebView
          key={language}
          ref={webViewRef}
          source={{
            html: EDITOR_HTML,
            baseUrl: `https://lnreader-editor.local/`,
          }}
          style={[styles.webView, { backgroundColor: theme.background }]}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled={false}
          allowFileAccess
          allowFileAccessFromFileURLs
          mixedContentMode="always"
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView
          overScrollMode="never"
          onLoadStart={() => {
            readyRef.current = false;
          }}
          onMessage={handleMessage}
        />
      </Animated.View>
    </View>
  );
};

export default CodeInput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  error: {
    width: '100%',
    marginBottom: 8,
    overflow: 'hidden',
  },
  errorText: {
    textAlign: 'center',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});

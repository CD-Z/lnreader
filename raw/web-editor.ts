import { basicSetup } from 'codemirror';
import {
  Annotation,
  Compartment,
  EditorState,
  type Extension,
} from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

type Language = 'css' | 'js';

type EditorTheme = {
  background: string;
  foreground: string;
  gutterBackground?: string;
  gutterForeground?: string;
  selection?: string;
  dark: boolean;
};

type InitializeOptions = {
  language: Language;
  prefix: string;
  suffix: string;
  code: string;
  placeholder?: string;
  theme: EditorTheme;
};

type NativeMessage =
  | {
      type: 'SET_CODE';
      value: string;
    }
  | {
      type: 'SET_THEME';
      value: EditorTheme;
    }
  | {
      type: 'INITIALIZE';
      value: InitializeOptions;
    }
  | {
      type: 'FOCUS';
    };

const externalUpdate = Annotation.define<boolean>();

function sendToNative(type: string, value?: unknown): void {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type,
      value,
    }),
  );
}

function languageExtension(language: Language): Extension {
  return language === 'css' ? css() : javascript();
}

function themeExtension(theme: EditorTheme): Extension {
  const gutterBackground = theme.gutterBackground ?? theme.background;
  const gutterForeground = theme.gutterForeground ?? theme.foreground;
  const selection = theme.selection ?? (theme.dark ? '#3c4b64' : '#add6ff');

  const highlighting = theme.dark
    ? HighlightStyle.define([
        {
          tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword],
          color: '#ff79c6',
        },
        {
          tag: [tags.name, tags.variableName, tags.propertyName],
          color: '#f8f8f2',
        },
        {
          tag: [
            tags.function(tags.variableName),
            tags.function(tags.propertyName),
          ],
          color: '#50fa7b',
        },
        {
          tag: [tags.string, tags.special(tags.string)],
          color: '#f1fa8c',
        },
        {
          tag: [tags.number, tags.bool, tags.null, tags.atom],
          color: '#bd93f9',
        },
        {
          tag: [tags.comment, tags.lineComment, tags.blockComment],
          color: '#6272a4',
          fontStyle: 'italic',
        },
        {
          tag: [tags.typeName, tags.className, tags.namespace],
          color: '#8be9fd',
        },
        {
          tag: [tags.punctuation, tags.bracket],
          color: '#f8f8f2',
        },
        {
          tag: tags.invalid,
          color: '#ff5555',
        },
      ])
    : HighlightStyle.define([
        {
          tag: [tags.keyword, tags.controlKeyword],
          color: '#7f0055',
          fontWeight: 'bold',
        },
        {
          tag: [tags.string, tags.special(tags.string)],
          color: '#2a7b2e',
        },
        {
          tag: [tags.number, tags.bool, tags.null],
          color: '#7b3fb3',
        },
        {
          tag: [tags.comment, tags.lineComment, tags.blockComment],
          color: '#6a737d',
          fontStyle: 'italic',
        },
        {
          tag: [
            tags.function(tags.variableName),
            tags.function(tags.propertyName),
          ],
          color: '#005cc5',
        },
        {
          tag: tags.invalid,
          color: '#d73a49',
        },
      ]);

  return [
    EditorView.theme(
      {
        '&': {
          height: '100%',
          color: theme.foreground,
          backgroundColor: theme.background,
          fontSize: '14px',
        },
        '&.cm-focused': {
          outline: 'none',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'monospace',
          lineHeight: '20px',
        },
        '.cm-content': {
          minHeight: '100%',
          caretColor: theme.foreground,
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: theme.foreground,
        },
        '.cm-selectionBackground': {
          backgroundColor: `${selection} !important`,
        },
        '.cm-gutters': {
          color: gutterForeground,
          backgroundColor: gutterBackground,
          borderRight: 'none',
        },
        '.cm-activeLine': {
          backgroundColor: theme.dark ? '#ffffff0a' : '#00000008',
        },
        '.cm-activeLineGutter': {
          backgroundColor: theme.dark ? '#ffffff10' : '#0000000d',
        },
      },
      {
        dark: theme.dark,
      },
    ),
    syntaxHighlighting(highlighting),
  ];
}

export function createEditor(parent: HTMLElement) {
  let prefix = '';
  let suffix = '';
  let currentPlaceholder = '';

  const languageCompartment = new Compartment();
  const themeCompartment = new Compartment();
  const placeholderCompartment = new Compartment();

  const editBoundaryFilter = EditorState.transactionFilter.of(transaction => {
    if (!transaction.docChanged || transaction.annotation(externalUpdate)) {
      return transaction;
    }

    const bodyStart = prefix.length;
    const bodyEnd = transaction.startState.doc.length - suffix.length;

    let valid = true;

    transaction.changes.iterChangedRanges((fromBefore, toBefore) => {
      if (fromBefore < bodyStart || toBefore > bodyEnd) {
        valid = false;
      }
    });

    return valid ? transaction : [];
  });

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        keymap.of([]),
        editBoundaryFilter,
        languageCompartment.of(javascript()),
        themeCompartment.of(
          themeExtension({
            background: '#1e1e1e',
            foreground: '#f8f8f2',
            dark: true,
          }),
        ),
        placeholderCompartment.of([]),
        EditorView.updateListener.of(update => {
          if (!update.docChanged) {
            return;
          }

          const isExternal = update.transactions.some(transaction =>
            transaction.annotation(externalUpdate),
          );

          if (isExternal) {
            return;
          }

          const bodyEnd = update.state.doc.length - suffix.length;
          const value = update.state.doc.sliceString(prefix.length, bodyEnd);

          sendToNative('CODE_CHANGE', value);
        }),
        EditorView.domEventHandlers({
          focus: () => {
            sendToNative('FOCUS');
          },
          blur: () => {
            sendToNative('BLUR');
          },
        }),
      ],
    }),
  });

  function setCode(code: string): void {
    const bodyEnd = view.state.doc.length - suffix.length;
    const currentCode = view.state.doc.sliceString(prefix.length, bodyEnd);

    if (currentCode === code) {
      return;
    }

    view.dispatch({
      changes: {
        from: prefix.length,
        to: bodyEnd,
        insert: code,
      },
      annotations: externalUpdate.of(true),
    });
  }

  function setTheme(theme: EditorTheme): void {
    view.dispatch({
      effects: themeCompartment.reconfigure(themeExtension(theme)),
      annotations: externalUpdate.of(true),
    });
  }

  function initialize(options: InitializeOptions): void {
    prefix = options.prefix;
    suffix = options.suffix;
    currentPlaceholder = options.placeholder ?? '';

    const placeholderExtension =
      currentPlaceholder.length > 0 &&
      prefix.length === 0 &&
      suffix.length === 0
        ? placeholder(currentPlaceholder)
        : [];

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: `${prefix}${options.code}${suffix}`,
      },
      effects: [
        languageCompartment.reconfigure(languageExtension(options.language)),
        themeCompartment.reconfigure(themeExtension(options.theme)),
        placeholderCompartment.reconfigure(placeholderExtension),
      ],
      annotations: externalUpdate.of(true),
    });
  }

  function handleMessage(message: NativeMessage): void {
    switch (message.type) {
      case 'INITIALIZE':
        initialize(message.value);
        break;

      case 'SET_CODE':
        setCode(message.value);
        break;

      case 'SET_THEME':
        setTheme(message.value);
        break;

      case 'FOCUS':
        view.focus();
        break;
    }
  }

  return {
    handleMessage,
    destroy: () => view.destroy(),
  };
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
  }
}

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
  activeLine?: string;
  activeLineGutter?: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  type: string;
  comment: string;
  variable: string;
  punctuation: string;
  invalid: string;
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

  const highlighting = HighlightStyle.define([
    {
      tag: [
        tags.keyword,
        tags.controlKeyword,
        tags.operatorKeyword,
        tags.moduleKeyword,
      ],
      color: theme.keyword ?? '#7f0055',
    },
    {
      tag: [tags.string, tags.special(tags.string)],
      color: theme.string ?? '#2a7b2e',
    },
    {
      tag: [tags.number, tags.bool, tags.null, tags.atom],
      color: theme.number ?? '#7b3fb3',
    },
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
      color: theme.function ?? '#005cc5',
    },
    {
      tag: [tags.typeName, tags.className, tags.namespace],
      color: theme.type ?? '#6f42c1',
    },
    {
      tag: [tags.comment, tags.lineComment, tags.blockComment],
      color: theme.comment ?? '#6a737d',
      fontStyle: 'italic',
    },
    {
      tag: [tags.name, tags.variableName, tags.propertyName],
      color: theme.variable ?? '#24292e',
    },
    {
      tag: [tags.punctuation, tags.bracket],
      color: theme.punctuation ?? '#24292e',
    },
    {
      tag: tags.invalid,
      color: theme.invalid ?? '#d73a49',
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
          backgroundColor: theme.activeLine ?? '#00000008',
        },
        '.cm-activeLineGutter': {
          backgroundColor: theme.activeLineGutter ?? '#0000000d',
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
        EditorView.lineWrapping,
        keymap.of([]),
        editBoundaryFilter,
        languageCompartment.of(javascript()),
        themeCompartment.of(
          themeExtension({
            background: '#1e1e1e',
            foreground: '#f8f8f2',
            keyword: '#ff79c6',
            string: '#f1fa8c',
            number: '#bd93f9',
            function: '#50fa7b',
            type: '#8be9fd',
            comment: '#6272a4',
            variable: '#f8f8f2',
            punctuation: '#f8f8f2',
            invalid: '#ff5555',
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

  function scrollSelectionIntoView(): void {
    view.dispatch({
      effects: EditorView.scrollIntoView(view.state.selection.main.head),
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
    scrollSelectionIntoView,
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

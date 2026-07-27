import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AnimatableNumericValue,
  Animated,
  ColorValue,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { PrismLight as Light } from 'react-syntax-highlighter';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import materialDark from 'react-syntax-highlighter/dist/esm/styles/prism/material-dark';
import materialLight from 'react-syntax-highlighter/dist/esm/styles/prism/material-light';
import { FONT_SIZE, LINE_HEIGHT } from './CodeInput';

Light.registerLanguage('javascript', js);
Light.registerLanguage('css', css);

const LANG_MAP = {
  js: 'javascript',
  css: 'css',
} as const;

type SupportedMode = keyof typeof LANG_MAP;
type HLStyleValue = string | number;
type HLStyle = Record<string, HLStyleValue>;
type RNStylesheet = Record<string, TextStyle>;

interface RendererNode {
  type?: 'element' | 'text';
  value?: string | number;
  properties?: {
    className?: string[];
    [key: string]: unknown;
  };
  children?: RendererNode[];
}

export type HighlightMode = 'off' | 'on' | 'combined';

type SimpleCodeEditorProps = Omit<
  TextInputProps,
  'value' | 'defaultValue' | 'children' | 'onChangeText'
> & {
  highlightMode?: HighlightMode;
  onChangeText?: (text: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
};

interface LineModel {
  id: string;
  code: string;
}

interface HighlightedLineProps {
  code: string;
  isDark?: boolean;
  mode: SupportedMode;
  textStyle: TextStyle;
  hide: boolean;
}

type PrismStylesheet = Record<string, React.CSSProperties>;

interface RendererProps {
  rows: RendererNode[];
  stylesheet: PrismStylesheet;
}

const stylesheetCache = new WeakMap<PrismStylesheet, RNStylesheet>();
function Passthrough({
  children,
}: {
  children?: React.ReactNode;
  [_key: string]: unknown;
}) {
  return <>{children}</>;
}

function cssToTextStyle(cssStyle: HLStyle): TextStyle {
  const rn: TextStyle = {};

  for (const [key, value] of Object.entries(cssStyle)) {
    switch (key) {
      case 'background':
      case 'backgroundColor':
        rn.backgroundColor = String(value);
        break;

      case 'color':
        rn.color = String(value);
        break;

      case 'textDecoration':
      case 'textDecorationLine':
        rn.textDecorationLine = value as TextStyle['textDecorationLine'];
        break;

      default:
        break;
    }
  }

  return rn;
}

function getRNStylesheet(stylesheet: PrismStylesheet): RNStylesheet {
  const cached = stylesheetCache.get(stylesheet);

  if (cached) {
    return cached;
  }

  const rn: RNStylesheet = {};

  for (const [key, value] of Object.entries(stylesheet)) {
    rn[key] = cssToTextStyle(value as HLStyle);
  }

  stylesheetCache.set(stylesheet, rn);

  return rn;
}

function getStylesForNode(
  node: RendererNode,
  rnStylesheet: RNStylesheet,
): TextStyle {
  const result: TextStyle = {};

  for (const className of node.properties?.className ?? []) {
    const classStyle = rnStylesheet[className];

    if (classStyle) {
      Object.assign(result, classStyle);
    }
  }

  return result;
}

function stripLineBreaks(value: string | number): string {
  return String(value).replace(/\r?\n/g, '');
}

function renderInlineNodes(
  nodes: RendererNode[],
  rnStylesheet: RNStylesheet,
  defaultColor: ColorValue,
  keyPrefix = 'n',
): React.ReactNode[] {
  const result: React.ReactNode[] = [];

  nodes.forEach((node, index) => {
    const key = `${keyPrefix}_${index}`;

    if (node.children?.length) {
      result.push(
        <Text
          key={key}
          allowFontScaling={false}
          style={[
            {
              color: defaultColor,
              includeFontPadding: false,
              ...getStylesForNode(node, rnStylesheet),
            },
          ]}
        >
          {renderInlineNodes(
            node.children,
            rnStylesheet,
            defaultColor,
            `${key}_c`,
          )}
        </Text>,
      );
    }

    if (node.value != null) {
      result.push(stripLineBreaks(node.value));
    }
  });

  return result;
}

function lineHighlightRenderer(raw: RendererProps): React.ReactNode {
  const { rows, stylesheet } = raw;
  const rnStylesheet = getRNStylesheet(stylesheet);
  const defaultColor =
    rnStylesheet['code[class*="language-"]']?.color ??
    rnStylesheet['pre[class*="language-"]']?.color ??
    '#abb2bf';
  const result: React.ReactNode[] = [];

  rows.forEach((row, rowIndex) => {
    if (row.children?.length) {
      result.push(
        ...renderInlineNodes(
          row.children,
          rnStylesheet,
          defaultColor,
          `r_${rowIndex}`,
        ),
      );
    } else if (row.value != null) {
      result.push(stripLineBreaks(row.value));
    }
  });

  return result;
}

function shallowEqualTextStyle(a: TextStyle, b: TextStyle): boolean {
  const aKeys = Object.keys(a) as (keyof TextStyle)[];
  const bKeys = Object.keys(b) as (keyof TextStyle)[];

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every(key => a[key] === b[key]);
}

const HighlightedLine = memo(
  function _HighlightedLine({
    code,
    mode,
    isDark = true,
    textStyle,
    hide,
  }: HighlightedLineProps) {
    return (
      <Text
        allowFontScaling={false}
        style={[
          textStyle,
          styles.codeLine,
          hide && styles.hidden,
          styles.withoutFontPadding,
        ]}
      >
        {code.length === 0 ? (
          '\u200B'
        ) : (
          <Light
            language={LANG_MAP[mode]}
            style={isDark ? materialDark : materialLight}
            PreTag={Passthrough}
            CodeTag={Passthrough}
            renderer={lineHighlightRenderer}
          >
            {code}
          </Light>
        )}
      </Text>
    );
  },
  (prev, next) =>
    prev.code === next.code &&
    prev.mode === next.mode &&
    prev.isDark === next.isDark &&
    prev.hide === next.hide &&
    shallowEqualTextStyle(prev.textStyle, next.textStyle),
);

function splitLines(value: string): string[] {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

export function useStableLineModels(value: string): LineModel[] {
  const previousRef = useRef<{
    lines: string[];
    models: LineModel[];
  } | null>(null);

  const nextIdRef = useRef(0);

  return useMemo(() => {
    const newLines = splitLines(value);
    const previous = previousRef.current;

    if (!previous) {
      const models = newLines.map(line => ({
        id: `line_${nextIdRef.current++}`,
        code: line,
      }));

      previousRef.current = {
        lines: newLines,
        models,
      };

      return models;
    }

    const oldLines = previous.lines;
    const oldModels = previous.models;

    let prefix = 0;

    while (
      prefix < oldLines.length &&
      prefix < newLines.length &&
      oldLines[prefix] === newLines[prefix]
    ) {
      prefix += 1;
    }

    let oldSuffix = oldLines.length - 1;
    let newSuffix = newLines.length - 1;

    while (
      oldSuffix >= prefix &&
      newSuffix >= prefix &&
      oldLines[oldSuffix] === newLines[newSuffix]
    ) {
      oldSuffix -= 1;
      newSuffix -= 1;
    }

    const models: LineModel[] = [];

    for (let i = 0; i < prefix; i += 1) {
      models.push(oldModels[i]);
    }

    for (let i = prefix; i <= newSuffix; i += 1) {
      models.push({
        id: `line_${nextIdRef.current++}`,
        code: newLines[i],
      });
    }

    const suffixCount = oldLines.length - 1 - oldSuffix;

    for (let i = suffixCount; i > 0; i -= 1) {
      const oldIndex = oldLines.length - i;
      models.push(oldModels[oldIndex]);
    }

    previousRef.current = {
      lines: newLines,
      models,
    };

    return models;
  }, [value]);
}

function extractOpacityStyle(style: StyleProp<TextStyle>): {
  opacity: AnimatableNumericValue;
} {
  const flat = StyleSheet.flatten(style) ?? {};

  return {
    opacity: flat.opacity ?? 1,
  };
}

function extractTextStyle(style: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};

  return {
    color: flat.color ?? '#abb2bf',
    fontFamily: flat.fontFamily ?? 'monospace',
    fontSize: typeof flat.fontSize === 'number' ? flat.fontSize : FONT_SIZE,
    fontStyle: flat.fontStyle,
    fontWeight: flat.fontWeight,
    letterSpacing: flat.letterSpacing ?? 0,
    lineHeight:
      typeof flat.lineHeight === 'number' ? flat.lineHeight : LINE_HEIGHT,
  };
}

export type MemoizedHighlightedCodeProps = {
  lines?: LineModel[];
  value?: string;
  mode: SupportedMode;
  style?: StyleProp<TextStyle>;
  hide?: boolean;
  isDark?: boolean;
  setLines?: (num: number) => void;
  startLine?: number;
};

export function MemoizedHighlightedCode({
  lines,
  value,
  mode,
  style,
  hide = false,
  setLines,
  isDark = false,
  startLine = 0,
}: MemoizedHighlightedCodeProps) {
  // Never call a hook conditionally. Generating this for externally supplied
  // lines is cheap and keeps the hook order valid.
  const generatedLines = useStableLineModels(value ?? '');
  const resolvedLines = lines ?? generatedLines;

  const opacityStyle = useMemo(() => extractOpacityStyle(style), [style]);
  const textStyle = useMemo(() => extractTextStyle(style), [style]);

  useEffect(() => {
    setLines?.(resolvedLines.length);
  }, [resolvedLines.length, setLines]);

  return (
    <View style={[styles.lineContainer, opacityStyle]}>
      {resolvedLines.map((line, index) => (
        <View key={line.id} style={styles.row}>
          <Text
            allowFontScaling={false}
            style={[textStyle, styles.lineNumber, styles.withoutFontPadding]}
          >
            {index + 1 + startLine}
          </Text>

          <HighlightedLine
            code={line.code}
            isDark={isDark}
            mode={mode}
            hide={hide}
            textStyle={textStyle}
          />
        </View>
      ))}
    </View>
  );
}

export function SimpleCodeEditor({
  highlightMode = 'combined',
  onChangeText,
  onScroll,
  containerStyle,
  scrollEnabled = true,
  lines,
  value,
  mode,
  style,
  isDark,
  setLines,
  startLine,
  ...props
}: SimpleCodeEditorProps & Omit<MemoizedHighlightedCodeProps, 'hide'>) {
  const hideHighlight = highlightMode === 'off';
  const scrollY = useRef(new Animated.Value(0)).current;

  const negativeScrollY = useMemo(
    () => Animated.multiply(scrollY, -1),
    [scrollY],
  );

  const textStyle = useMemo(() => extractTextStyle(style), [style]);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText?.(text);
    },
    [onChangeText],
  );

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: {
                y: scrollY,
              },
            },
          },
        ],
        {
          useNativeDriver: true,
          listener: onScroll,
        },
      ) as NonNullable<TextInputProps['onScroll']>,
    [onScroll, scrollY],
  );

  const inputColor = hideHighlight ? textStyle.color : 'rgba(0, 0, 0, 0.1)';

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.highlightLayer,
          {
            transform: [{ translateY: negativeScrollY }],
          },
        ]}
      >
        <MemoizedHighlightedCode
          lines={lines}
          value={value}
          mode={mode}
          style={style}
          hide={hideHighlight}
          isDark={isDark}
          setLines={setLines}
          startLine={startLine}
        />
      </Animated.View>

      <TextInput
        {...props}
        multiline
        allowFontScaling={false}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        scrollEnabled={scrollEnabled}
        underlineColorAndroid="transparent"
        value={value}
        onChangeText={handleChangeText}
        //onScroll={handleScroll}
        cursorColor="#abb2bf"
        selectionColor="#abb2bf"
        style={[
          style,
          styles.input,
          textStyle,
          {
            color: inputColor,
          },
        ]}
      />
    </View>
  );
}

const GUTTER_WIDTH = 32;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  highlightLayer: {
    zIndex: 0,
  },
  lineContainer: {
    position: 'relative',
    width: '100%',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lineNumber: {
    width: GUTTER_WIDTH,
    flexShrink: 0,
    margin: 0,
    padding: 0,
    paddingRight: 4,
    textAlign: 'right',
  },
  codeLine: {
    flex: 1,
    minWidth: 0,
    margin: 0,
    padding: 0,
  },
  input: {
    zIndex: 1,
    width: '100%',
    margin: 0,
    borderWidth: 0,
    padding: 0,
    paddingLeft: GUTTER_WIDTH,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  hidden: {
    opacity: 0,
  },
  withoutFontPadding: {
    includeFontPadding: false,
  },
});

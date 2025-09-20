import React from 'react';
import {
  GetProps,
  Input,
  Label,
  SizeTokens,
  Text,
  YStack,
  createStyledContext,
  styled,
  withStaticProperties,
} from 'tamagui';

type Mode = 'flat' | 'outlined';

export const TextInputContext = createStyledContext({
  size: '$md' as SizeTokens,
  mode: 'outlined' as Mode,
  error: false,
  focus: false,
  editable: true,
});

export const TextInputFrame = styled(YStack, {
  name: 'TextInput',
  context: TextInputContext,

  gap: '$2',

  variants: {
    editable: {
      true: {
        opacity: 1,
      },
      false: {
        opacity: 0.6,
      },
    },
  } as const,

  defaultVariants: {
    editable: true,
  },
});

export const TextInputLabel = styled(Label, {
  name: 'TextInputLabel',
  context: TextInputContext,

  color: '$color',
  fontWeight: '400',
  lineHeight: 14,

  variants: {
    size: {
      '...fontSize': (name, { font }) => ({
        fontSize: font?.size[name],
      }),
    },
  } as const,

  defaultVariants: {
    size: '$md',
  },
});

export const TextInputInputFrame = styled(YStack, {
  name: 'TextInputInputFrame',
  context: TextInputContext,

  position: 'relative',

  variants: {
    mode: {
      outlined: {},
      flat: {},
    },
  } as const,

  defaultVariants: {
    mode: 'outlined',
  },
});

export const TextInputInput = styled(Input, {
  name: 'TextInputInput',
  context: TextInputContext,

  color: '$color',
  placeholderTextColor: '$color02',

  variants: {
    mode: {
      outlined: {
        borderWidth: 1,
        borderColor: '$borderColor',
        backgroundColor: 'transparent',
      },
      flat: {
        borderWidth: 0,
        backgroundColor: '$background',
      },
    },
    error: {
      true: {
        borderColor: '$color5',
      },
      false: {},
    },
    focus: {
      true: {
        borderColor: '$borderColorFocus',
        borderWidth: 2,
      },
      false: {},
    },
    size: {
      '...fontSize': (name, { font }) => ({
        fontSize: font?.size[name],
      }),
    },
  } as const,

  defaultVariants: {
    mode: 'outlined',
    error: false,
    focus: false,
    size: '$md',
  },
});

export const TextInputHelper = styled(Text, {
  name: 'TextInputHelper',
  context: TextInputContext,

  fontSize: '$3',

  variants: {
    error: {
      true: {
        color: '$color5',
      },
      false: {
        color: '$color02',
      },
    },
  } as const,

  defaultVariants: {
    error: false,
  },
});

const TextInputAdornment = styled(YStack, {
  name: 'TextInputAdornment',
  context: TextInputContext,

  position: 'absolute',
  height: '100%',
  display: 'flex',
});

type TextInputProps = GetProps<typeof TextInputFrame> & {
  label?: string;
  helperText?: string;
  mode?: Mode;
  error?: boolean;
  editable?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

const TextInputComponent = TextInputFrame.styleable<TextInputProps>(
  (
    {
      label,
      helperText,
      left,
      right,
      mode = 'outlined',
      error = false,
      editable = true,
      id,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <TextInputFrame ref={ref} editable={editable} {...props}>
        {label && (
          <TextInputLabel
            htmlFor={id ?? label.replace(' ', '-')}
            onPress={() => {
              // Focus the input when label is pressed
              // We'll add a ref later if needed
            }}
            pressStyle={{ opacity: 0.7 }}
          >
            {label}
          </TextInputLabel>
        )}

        <TextInputInputFrame>
          {left && (
            <TextInputAdornment
              style={{
                left: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {left}
            </TextInputAdornment>
          )}

          <TextInputInput
            {...(props as any)}
            id={id ?? label?.replace(' ', '-')}
            editable={editable}
            paddingLeft={left ? '$9' : '$3'}
            paddingRight={right ? '$9' : '$3'}
            style={{ minHeight: 48 }}
            mode={mode}
            error={error}
            focus={isFocused}
            onFocus={e => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={e => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
          />

          {right && (
            <TextInputAdornment
              style={{
                right: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {right}
            </TextInputAdornment>
          )}
        </TextInputInputFrame>

        {helperText && (
          <TextInputHelper error={error as boolean}>
            {helperText}
          </TextInputHelper>
        )}
      </TextInputFrame>
    );
  },
);

export const TextInput = withStaticProperties(TextInputComponent, {
  Props: TextInputContext.Provider,
  Label: TextInputLabel,
  Input: TextInputInput,
  Helper: TextInputHelper,
  Adornment: TextInputAdornment,
});

export default TextInput;

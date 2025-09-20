import React from 'react';
import { Button as TamaguiButton, Text, styled } from 'tamagui';

type Mode = 'text' | 'contained' | 'outlined';

export interface ButtonProps {
  mode?: Mode;
  children?: React.ReactNode;
  compact?: boolean;
  uppercase?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

const StyledButton = styled(TamaguiButton, {
  name: 'Button',
  borderRadius: '$2',
  paddingVertical: '$3',
  paddingHorizontal: '$4',
  minHeight: 44, // Minimum touch target
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    mode: {
      text: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
      },
      contained: {
        backgroundColor: '$color9',
        borderWidth: 0,
      },
    },
    compact: {
      true: {
        paddingVertical: '$2',
        paddingHorizontal: '$3',
      },
      false: {
        paddingVertical: '$3',
        paddingHorizontal: '$4',
      },
    },
  } as const,

  defaultVariants: {
    mode: 'text',
    compact: false,
  },
});

const ButtonText = styled(Text, {
  name: 'ButtonText',
  fontWeight: '500',

  variants: {
    mode: {
      text: {
        color: '$color',
      },
      outlined: {
        color: '$color',
      },
      contained: {
        color: '$background',
      },
    },
    compact: {
      true: {
        fontSize: '$3',
      },
      false: {
        fontSize: '$4',
      },
    },
  } as const,

  defaultVariants: {
    mode: 'text',
    compact: false,
  },
});

export const Button: React.FC<ButtonProps> = ({
  mode = 'text',
  children,
  compact = false,
  uppercase = false,
  disabled = false,
  loading = false,
  onPress,
  ...props
}) => {
  const textTransform = uppercase ? 'uppercase' : 'none';

  return (
    <StyledButton
      mode={mode}
      compact={compact}
      disabled={disabled || loading}
      onPress={onPress}
      pressStyle={{
        opacity: 0.8,
        ...(mode === 'text' || mode === 'outlined'
          ? {
              backgroundColor: '$color7', // Light accent background
            }
          : {}),
      }}
      {...props}
    >
      <ButtonText mode={mode} compact={compact} textTransform={textTransform}>
        {loading ? 'Loading...' : children}
      </ButtonText>
    </StyledButton>
  );
};

export default Button;

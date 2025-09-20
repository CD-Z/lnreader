import React from 'react';
import { Button as TamaguiButton, Text, useTheme } from 'tamagui';

type Mode = 'text' | 'contained' | 'outlined';

export interface ButtonProps {
  mode?: Mode;
  children?: React.ReactNode;
  compact?: boolean;
  uppercase?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  mode = 'text',
  children,
  compact = false,
  uppercase = false,
  disabled = false,
  loading = false,
  onPress,
  style,
  ...props
}) => {
  const theme = useTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: 8,
      paddingVertical: compact ? 4 : 8,
      paddingHorizontal: compact ? 12 : 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    switch (mode) {
      case 'text':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.borderColor,
        };
      case 'contained':
        return {
          ...baseStyles,
          backgroundColor: theme.color9, // Brighter color for contained buttons
          borderWidth: 0,
        };
      default:
        return baseStyles;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.color02; // Muted/disabled text
    switch (mode) {
      case 'text':
      case 'outlined':
        return theme.color; // Primary text color
      case 'contained':
        return theme.background; // Light text on colored background
      default:
        return theme.color;
    }
  };

  const textTransform = uppercase ? 'uppercase' : 'none';

  return (
    <TamaguiButton
      disabled={disabled || loading}
      onPress={onPress}
      style={[getButtonStyles(), style]}
      pressStyle={{
        opacity: 0.8,
        ...(mode === 'text' || mode === 'outlined'
          ? {
              backgroundColor: theme.color7, // Light accent background
            }
          : {}),
      }}
      {...props}
    >
      <Text
        style={{ color: getTextColor() }}
        fontSize={compact ? 14 : 16}
        fontWeight="500"
        textTransform={textTransform}
      >
        {loading ? 'Loading...' : children}
      </Text>
    </TamaguiButton>
  );
};

export default Button;

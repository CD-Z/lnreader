import React from 'react';
import { Button as TButton, Spinner, styled, Text } from 'tamagui';
import { GestureResponderEvent } from 'react-native';

type Mode = 'text' | 'contained' | 'outlined';

export interface ButtonProps {
  mode?: Mode;
  disabled?: boolean;
  loading?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
  uppercase?: boolean;
}

const Base = styled(TButton, {
  borderRadius: 4,
  gap: '$3',
  pressStyle: { opacity: 0.9 },
});

export const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  disabled,
  loading,
  onPress,
  children,
  icon,
  compact,
  uppercase,
}) => {
  const content = (
    <>
      {icon}
      {typeof children === 'string' ? (
        <Text fontWeight={600} textTransform={uppercase ? 'uppercase' : 'none'}>
          {children}
        </Text>
      ) : (
        children
      )}
    </>
  );

  const size = compact ? '$3' : '$4';

  if (mode === 'text') {
    return (
      <Base
        disabled={disabled || loading}
        unstyled
        paddingHorizontal={size}
        onPress={onPress}
      >
        {loading ? <Spinner size="small" /> : content}
      </Base>
    );
  }

  if (mode === 'outlined') {
    return (
      <Base
        disabled={disabled || loading}
        onPress={onPress}
        size={size}
        themeInverse={false}
        borderWidth={1}
        backgroundColor="transparent"
      >
        {loading ? <Spinner size="small" /> : content}
      </Base>
    );
  }

  return (
    <Base disabled={disabled || loading} onPress={onPress} size={size}>
      {loading ? <Spinner size="small" /> : content}
    </Base>
  );
};

export default Button;

import React from 'react';
import { Pressable } from 'react-native';
import { Text, useTheme, XStack } from 'tamagui';

export interface ChipProps {
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
}

//

export const Chip: React.FC<ChipProps> = ({
  selected,
  onPress,
  onClose,
  icon,
  children,
  disabled = false,
}) => {
  const theme = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.surfaceDisabled?.toString();
    return selected
      ? theme.primary?.toString()
      : theme.surfaceVariant?.toString();
  };

  const getBorderColor = () => {
    if (disabled) return theme.outlineVariant?.toString();
    return selected ? theme.primary?.toString() : theme.outline?.toString();
  };

  const getTextColor = () => {
    if (disabled) return theme.onSurfaceDisabled?.toString();
    return selected
      ? theme.onPrimary?.toString()
      : theme.onSurfaceVariant?.toString();
  };

  return (
    <XStack
      style={{
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
        borderWidth: 1,
        borderColor: getBorderColor(),
        backgroundColor: getBackgroundColor(),
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Text
          style={{
            color: getTextColor(),
            fontSize: 14,
            fontWeight: '500',
          }}
        >
          {children}
        </Text>
      </Pressable>
      {onClose ? (
        <Pressable
          disabled={disabled}
          onPress={onClose}
          style={{
            padding: 2,
            borderRadius: 12,
            backgroundColor: selected
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Text
            style={{
              color: getTextColor(),
              fontSize: 16,
              fontWeight: 'bold',
              lineHeight: 16,
            }}
          >
            ×
          </Text>
        </Pressable>
      ) : null}
    </XStack>
  );
};

export default Chip;

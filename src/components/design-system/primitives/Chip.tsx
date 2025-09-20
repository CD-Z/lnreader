import React from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, styled } from 'tamagui';

export interface ChipProps {
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
}

const ChipFrame = styled(XStack, {
  name: 'Chip',
  borderRadius: '$4',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  gap: '$1.5',
  borderWidth: 1,
  alignItems: 'center',
  minHeight: 32,

  variants: {
    selected: {
      true: {
        backgroundColor: '$color9',
        borderColor: '$color9',
      },
      false: {
        backgroundColor: '$color02',
        borderColor: '$borderColor',
      },
    },
    disabled: {
      true: {
        opacity: 0.6,
        backgroundColor: '$color02',
        borderColor: '$color02',
      },
      false: {},
    },
  } as const,

  defaultVariants: {
    selected: false,
    disabled: false,
  },
});

const ChipText = styled(Text, {
  name: 'ChipText',
  fontSize: '$3',
  fontWeight: '500',

  variants: {
    selected: {
      true: {
        color: '$background',
      },
      false: {
        color: '$color',
      },
    },
    disabled: {
      true: {
        color: '$color02',
      },
      false: {},
    },
  } as const,

  defaultVariants: {
    selected: false,
    disabled: false,
  },
});

const ChipCloseButton = styled(Pressable, {
  name: 'ChipCloseButton',
  padding: '$0.5',
  borderRadius: '$3',

  variants: {
    selected: {
      true: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      },
      false: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
});

const CloseIcon = styled(Text, {
  name: 'CloseIcon',
  fontSize: '$4',
  fontWeight: 'bold',
  lineHeight: 16,

  variants: {
    selected: {
      true: {
        color: '$background',
      },
      false: {
        color: '$color',
      },
    },
    disabled: {
      true: {
        color: '$color02',
      },
      false: {},
    },
  } as const,

  defaultVariants: {
    selected: false,
    disabled: false,
  },
});

export const Chip: React.FC<ChipProps> = ({
  selected = false,
  onPress,
  onClose,
  icon,
  children,
  disabled = false,
}) => {
  return (
    <ChipFrame selected={selected} disabled={disabled}>
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
        <ChipText selected={selected} disabled={disabled}>
          {children}
        </ChipText>
      </Pressable>
      {onClose ? (
        <ChipCloseButton
          selected={selected}
          disabled={disabled}
          onPress={onClose}
        >
          <CloseIcon selected={selected} disabled={disabled}>
            ×
          </CloseIcon>
        </ChipCloseButton>
      ) : null}
    </ChipFrame>
  );
};

export default Chip;

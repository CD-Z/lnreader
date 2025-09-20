import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, styled } from 'tamagui';

export interface CheckboxProps {
  status?: 'checked' | 'unchecked' | 'indeterminate';
  disabled?: boolean;
  onPress?: () => void;
  label?: string;
}

const CheckboxFrame = styled(View, {
  name: 'Checkbox',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$2',

  variants: {
    disabled: {
      true: {
        opacity: 0.6,
      },
      false: {},
    },
  } as const,

  defaultVariants: {
    disabled: false,
  },
});

const CheckboxBox = styled(Pressable, {
  name: 'CheckboxBox',
  width: 20,
  height: 20,
  borderRadius: '$1',
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    status: {
      checked: {
        backgroundColor: '$color9',
        borderColor: '$color9',
      },
      unchecked: {
        backgroundColor: 'transparent',
        borderColor: '$borderColor',
      },
      indeterminate: {
        backgroundColor: '$color9',
        borderColor: '$color9',
      },
    },
    disabled: {
      true: {
        backgroundColor: '$color02',
        borderColor: '$color02',
      },
      false: {},
    },
  } as const,

  defaultVariants: {
    status: 'unchecked',
    disabled: false,
  },
});

const CheckIcon = styled(Text, {
  name: 'CheckIcon',
  fontSize: '$3',
  fontWeight: 'bold',
  lineHeight: 14,

  variants: {
    status: {
      checked: {
        color: '$background',
      },
      unchecked: {
        color: 'transparent',
      },
      indeterminate: {
        color: '$background',
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
    status: 'unchecked',
    disabled: false,
  },
});

const CheckboxLabel = styled(Text, {
  name: 'CheckboxLabel',

  variants: {
    disabled: {
      true: {
        color: '$color02',
      },
      false: {
        color: '$color',
      },
    },
  } as const,

  defaultVariants: {
    disabled: false,
  },
});

export const Checkbox: React.FC<CheckboxProps> = ({
  status = 'unchecked',
  disabled = false,
  onPress,
  label,
}) => {
  const icon =
    status === 'indeterminate' ? '−' : status === 'checked' ? '✓' : '';

  return (
    <CheckboxFrame disabled={disabled}>
      <CheckboxBox status={status} disabled={disabled} onPress={onPress}>
        <CheckIcon status={status} disabled={disabled}>
          {icon}
        </CheckIcon>
      </CheckboxBox>
      {label ? (
        <CheckboxLabel disabled={disabled}>{label}</CheckboxLabel>
      ) : null}
    </CheckboxFrame>
  );
};

export default Checkbox;

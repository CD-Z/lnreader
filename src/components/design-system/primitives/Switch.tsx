import React from 'react';
import { Switch as TamaguiSwitch, Text, View, styled } from 'tamagui';

export interface SwitchProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

const SwitchFrame = styled(View, {
  name: 'SwitchFrame',
  display: 'flex',
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

const SwitchLabel = styled(Text, {
  name: 'SwitchLabel',

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

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  label,
}) => {
  return (
    <SwitchFrame disabled={disabled}>
      <TamaguiSwitch
        checked={value}
        onCheckedChange={onValueChange}
        disabled={disabled}
        size="$4"
        color
        native // Use native switch on mobile
      >
        <TamaguiSwitch.Thumb />
      </TamaguiSwitch>
      {label ? <SwitchLabel disabled={disabled}>{label}</SwitchLabel> : null}
    </SwitchFrame>
  );
};

export default Switch;

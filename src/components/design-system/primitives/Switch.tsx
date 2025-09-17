import React from 'react';
import { Switch as TSwitch, XStack, Label } from 'tamagui';

export interface SwitchProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled,
  label,
}) => {
  return (
    <XStack alignItems="center" gap="$3" opacity={disabled ? 0.6 : 1}>
      <TSwitch
        checked={value}
        onCheckedChange={onValueChange as any}
        disabled={disabled}
      />
      {label ? <Label>{label}</Label> : null}
    </XStack>
  );
};

export default Switch;

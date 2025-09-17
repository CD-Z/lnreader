import React from 'react';
import { Label, RadioGroup, XStack, YStack, styled } from 'tamagui';

export interface RadioButtonProps {
  value: string;
  label?: string;
  disabled?: boolean;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  value,
  label,
  disabled,
}) => {
  return (
    <XStack alignItems="center" gap="$3" opacity={disabled ? 0.6 : 1}>
      <RadioGroup.Item value={value} disabled={disabled}>
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      {label ? <Label>{label}</Label> : null}
    </XStack>
  );
};

export interface RadioButtonGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({
  value,
  onValueChange,
  children,
}) => {
  return (
    <RadioGroup value={value} onValueChange={onValueChange}>
      <YStack gap="$3">{children}</YStack>
    </RadioGroup>
  );
};

export default RadioButton;

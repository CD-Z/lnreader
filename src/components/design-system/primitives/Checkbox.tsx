import React from 'react';
import { Checkbox as TCheckbox, Label, XStack, Text } from 'tamagui';

export interface CheckboxProps {
  status?: 'checked' | 'unchecked' | 'indeterminate';
  disabled?: boolean;
  onPress?: () => void;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  status = 'unchecked',
  disabled,
  onPress,
  label,
}) => {
  const checked = status === 'checked';
  const indeterminate = status === 'indeterminate';

  return (
    <XStack
      alignItems="center"
      gap="$3"
      onPress={onPress as any}
      opacity={disabled ? 0.6 : 1}
    >
      <TCheckbox
        size="$4"
        disabled={disabled}
        checked={checked}
        indeterminate={indeterminate}
      >
        <TCheckbox.Indicator>
          <Text color="$background">{indeterminate ? '–' : '✓'}</Text>
        </TCheckbox.Indicator>
      </TCheckbox>
      {label ? <Label>{label}</Label> : null}
    </XStack>
  );
};

export default Checkbox;

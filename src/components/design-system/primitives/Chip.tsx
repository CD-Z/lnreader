import React from 'react';
import { XStack, YStack, Text, styled, View } from 'tamagui';

export interface ChipProps {
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const Container = styled(XStack, {
  borderRadius: 16,
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  alignItems: 'center',
  gap: '$2',
  borderWidth: 1,
});

export const Chip: React.FC<ChipProps> = ({
  selected,
  onPress,
  onClose,
  icon,
  children,
}) => {
  return (
    <Container
      backgroundColor={selected ? '$primary' : 'transparent'}
      borderColor={selected ? '$primary' : '$outline'}
      onPress={onPress as any}
    >
      {icon}
      <Text color={selected ? '$background' : '$color'}>{children}</Text>
      {onClose ? (
        <View onPress={onClose as any}>
          <Text>×</Text>
        </View>
      ) : null}
    </Container>
  );
};

export default Chip;

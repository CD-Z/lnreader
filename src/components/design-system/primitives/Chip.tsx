import React from 'react';
import { Text, Pressable } from 'react-native';

export interface ChipProps {
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

//

export const Chip: React.FC<ChipProps> = ({
  selected,
  onPress,
  onClose,
  icon,
  children,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: selected ? '#0057ce' : '#9E9E9E',
        backgroundColor: selected ? '#0057ce' : 'transparent',
      }}
    >
      {icon}
      <Text style={{ color: selected ? '#fff' : '#000' }}>{children}</Text>
      {onClose ? (
        <Pressable onPress={onClose}>
          <Text>×</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export default Chip;

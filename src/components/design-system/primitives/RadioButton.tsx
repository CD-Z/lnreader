import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, styled } from 'tamagui';

export interface RadioButtonProps {
  value: string;
  label?: string;
  disabled?: boolean;
  selected?: boolean;
  onPress?: () => void;
}

const RadioButtonFrame = styled(Pressable, {
  name: 'RadioButton',
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: '$1',
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

const RadioCircle = styled(View, {
  name: 'RadioCircle',
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    selected: {
      true: {
        borderColor: '$color9',
      },
      false: {
        borderColor: '$borderColor',
      },
    },
    disabled: {
      true: {
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

const RadioDot = styled(View, {
  name: 'RadioDot',
  width: 10,
  height: 10,
  borderRadius: 5,

  variants: {
    selected: {
      true: {
        backgroundColor: '$color9',
      },
      false: {
        backgroundColor: 'transparent',
      },
    },
    disabled: {
      true: {
        backgroundColor: '$color02',
      },
      false: {},
    },
  } as const,

  defaultVariants: {
    selected: false,
    disabled: false,
  },
});

const RadioLabel = styled(Text, {
  name: 'RadioLabel',

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

export const RadioButton: React.FC<RadioButtonProps> = ({
  value: _value,
  label,
  disabled = false,
  selected = false,
  onPress,
}) => {
  return (
    <RadioButtonFrame disabled={disabled} onPress={onPress}>
      <RadioCircle selected={selected} disabled={disabled}>
        <RadioDot selected={selected} disabled={disabled} />
      </RadioCircle>
      {label ? <RadioLabel disabled={disabled}>{label}</RadioLabel> : null}
    </RadioButtonFrame>
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
  // Clone children and add selected/onPress props
  const enhancedChildren = React.Children.map(children, child => {
    if (
      React.isValidElement<RadioButtonProps>(child) &&
      child.type === RadioButton
    ) {
      return React.cloneElement(child, {
        selected: child.props.value === value,
        onPress: () => onValueChange(child.props.value),
      } as Partial<RadioButtonProps>);
    }
    return child;
  });

  return <View>{enhancedChildren}</View>;
};

export default RadioButton;

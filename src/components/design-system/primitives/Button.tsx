import React from 'react';
import {
  Button as PaperButton,
  ButtonProps as PaperButtonProps,
} from 'react-native-paper';

type Mode = 'text' | 'contained' | 'outlined';

export interface ButtonProps extends Partial<PaperButtonProps> {
  mode?: Mode;
  children?: React.ReactNode;
  compact?: boolean;
  uppercase?: boolean;
}

export const Button: React.FC<ButtonProps> = props => {
  return (
    <PaperButton {...(props as PaperButtonProps)}>{props.children}</PaperButton>
  );
};

export default Button;

import React from 'react';
import { View } from 'react-native';
import { useTheme } from 'tamagui';

export interface SurfaceProps {
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  children?: React.ReactNode;
  padding?: any;
  style?: any;
}

export const Surface: React.FC<SurfaceProps> = ({
  elevation = 0,
  children,
  padding,
  style,
}) => {
  const theme = useTheme();

  // Basic shadow for Android/iOS; Tamagui keeps platform differences minimal here.
  const shadow = elevation
    ? {
        elevation,
        shadowColor: '#000',
        shadowOpacity: 0.14 + elevation * 0.02,
        shadowRadius: 1 + elevation * 2,
        shadowOffset: { width: 0, height: 0.5 + elevation * 0.5 },
      }
    : undefined;

  const backgroundColor = theme.background;

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: 4,
        },
        shadow,
        padding !== undefined && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Surface;

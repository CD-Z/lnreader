import React from 'react';
import { View, styled } from 'tamagui';

export interface SurfaceProps {
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  children?: React.ReactNode;
  padding?: any;
  style?: any;
}

const Base = styled(View, {
  backgroundColor: '$background',
  borderRadius: 8,
});

export const Surface: React.FC<SurfaceProps> = ({
  elevation = 0,
  children,
  padding,
  style,
}) => {
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
  return (
    <Base padding={padding} style={[shadow, style]}>
      {children}
    </Base>
  );
};

export default Surface;

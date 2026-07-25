import React from 'react';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { List } from '@components';
import { useTheme } from '@hooks/persisted';

const AdvancedTab: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <BottomSheetScrollView>
      <List.Item
        title="Custom Code"
        description="Manage custom CSS and JavaScript snippets"
        icon="code-braces"
        onPress={() => navigation.navigate('CustomCode' as never)}
        theme={theme}
      />
    </BottomSheetScrollView>
  );
};

export default AdvancedTab;

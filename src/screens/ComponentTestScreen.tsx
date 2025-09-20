import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTheme, YStack, XStack } from 'tamagui';
import {
  Button,
  TextInput,
  Checkbox,
  RadioButton,
  RadioButtonGroup,
  Switch,
  Chip,
  Surface,
  Text,
} from '../components/design-system';

export const ComponentTestScreen: React.FC = () => {
  const theme = useTheme();
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchValue, setSwitchValue] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [errorTextInput, setErrorTextInput] = useState('');

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: theme.background as unknown as string,
      }}
    >
      <YStack padding="$4" gap="$6">
        <Text size="$6" fontWeight="bold" textAlign="center">
          Design System Test
        </Text>

        {/* Buttons Section */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Buttons
          </Text>

          <XStack gap="$2" flexWrap="wrap">
            <Button mode="text">Text Button</Button>
            <Button mode="outlined">Outlined Button</Button>
            <Button mode="contained">Contained Button</Button>
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            <Button mode="contained" compact>
              Compact
            </Button>
            <Button mode="contained" disabled>
              Disabled
            </Button>
            <Button mode="contained" loading>
              Loading
            </Button>
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            <Button mode="outlined" uppercase>
              Uppercase
            </Button>
            <Button mode="contained" onPress={() => alert('Pressed!')}>
              With Action
            </Button>
          </XStack>
        </YStack>

        {/* TextInput Section */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Text Inputs
          </Text>

          <TextInput
            label="Basic Text Input"
            placeholder="Enter some text"
            value={textInputValue}
            onChangeText={setTextInputValue}
          />

          <TextInput
            label="Outlined Mode"
            mode="outlined"
            placeholder="Outlined input"
            helperText="This is helper text"
          />

          <TextInput
            label="With Error"
            placeholder="Error input"
            error
            helperText="This field has an error"
            value={errorTextInput}
            onChangeText={setErrorTextInput}
          />

          <TextInput
            label="Disabled Input"
            placeholder="Disabled input"
            editable={false}
            value="This is disabled"
          />

          <TextInput
            label="With Left Icon"
            placeholder="Search..."
            left={<Text size="$5">🔍</Text>}
          />

          <TextInput
            label="With Right Icon"
            placeholder="Password"
            right={<Text size="$5">👁️</Text>}
          />

          {/* Compound TextInput Demo */}
          <YStack gap="$2">
            <Text>Compound TextInput Usage:</Text>
            <TextInput.Props size="$lg" mode="flat">
              <TextInput.Label>Large Flat Input</TextInput.Label>
              <TextInput.Input placeholder="Large flat input" />
              <TextInput.Helper>Custom large helper text</TextInput.Helper>
            </TextInput.Props>
          </YStack>
        </YStack>

        {/* Checkbox Section */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Checkboxes
          </Text>

          <Checkbox
            status={checkboxValue ? 'checked' : 'unchecked'}
            onPress={() => setCheckboxValue(!checkboxValue)}
            label="Basic checkbox"
          />

          <Checkbox status="indeterminate" label="Indeterminate checkbox" />

          <Checkbox status="checked" disabled label="Disabled checked" />

          <Checkbox status="unchecked" disabled label="Disabled unchecked" />
        </YStack>

        {/* Radio Buttons Section */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Radio Buttons
          </Text>

          <RadioButtonGroup value={radioValue} onValueChange={setRadioValue}>
            <RadioButton value="option1" label="Option 1" />
            <RadioButton value="option2" label="Option 2" />
            <RadioButton value="option3" label="Option 3" />
          </RadioButtonGroup>

          <RadioButton value="disabled" label="Disabled option" disabled />
        </YStack>

        {/* Switch Section */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Switches
          </Text>

          <Switch
            value={switchValue}
            onValueChange={setSwitchValue}
            label="Basic switch"
          />

          <Switch value={true} disabled label="Disabled on" />

          <Switch value={false} disabled label="Disabled off" />
        </YStack>

        {/* Chips Section */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Chips
          </Text>

          <XStack gap="$2" flexWrap="wrap">
            <Chip selected={false}>Basic Chip</Chip>
            <Chip selected={true}>Selected Chip</Chip>
            <Chip selected={false} disabled>
              Disabled Chip
            </Chip>
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            <Chip selected={false} onClose={() => {}}>
              With Close
            </Chip>
            <Chip selected={true} icon={<Text>⭐</Text>} onClose={() => {}}>
              With Icon
            </Chip>
          </XStack>
        </YStack>

        {/* Surface Section */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Surfaces
          </Text>

          <Surface elevation={0} padding="$4">
            <Text>Elevation 0</Text>
          </Surface>

          <Surface elevation={1} padding="$4">
            <Text>Elevation 1</Text>
          </Surface>

          <Surface elevation={2} padding="$4">
            <Text>Elevation 2</Text>
          </Surface>

          <Surface elevation={3} padding="$4">
            <Text>Elevation 3</Text>
          </Surface>

          <Surface elevation={4} padding="$4">
            <Text>Elevation 4</Text>
          </Surface>

          <Surface elevation={5} padding="$4">
            <Text>Elevation 5</Text>
          </Surface>
        </YStack>

        {/* Size Variants Demo */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Size Variants
          </Text>

          <XStack gap="$2" alignItems="center">
            <Text width={60}>Small:</Text>
            <TextInput.Props size="$sm">
              <TextInput.Input placeholder="Small input" />
            </TextInput.Props>
          </XStack>

          <XStack gap="$2" alignItems="center">
            <Text width={60}>Medium:</Text>
            <TextInput.Props size="$md">
              <TextInput.Input placeholder="Medium input" />
            </TextInput.Props>
          </XStack>

          <XStack gap="$2" alignItems="center">
            <Text width={60}>Large:</Text>
            <TextInput.Props size="$lg">
              <TextInput.Input placeholder="Large input" />
            </TextInput.Props>
          </XStack>
        </YStack>

        {/* Theme Demo */}
        <YStack gap="$4">
          <Text size="$5" fontWeight="bold">
            Theme Demo
          </Text>
          <Text>
            This screen demonstrates the design system components with the
            midnightDusk theme. All components automatically adapt to light/dark
            theme changes.
          </Text>

          <Surface padding="$4" backgroundColor="$color9">
            <Text color="$background" textAlign="center" fontWeight="bold">
              Themed Surface with Custom Background
            </Text>
          </Surface>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default ComponentTestScreen;

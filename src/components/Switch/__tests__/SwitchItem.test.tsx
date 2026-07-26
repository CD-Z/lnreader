import './mocks';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SwitchItem from '../SwitchItem';

// Mock reanimated — setUpTests in global setup may have failed.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: (fn) => fn(),
    useDerivedValue: (fn) => fn(),
    withTiming: (val) => val,
    withSpring: (val) => val,
    interpolateColor: () => 'transparent',
    createAnimatedComponent: (c) => c,
    default: { View },
    __esModule: true,
  };
});

const mockUseTheme = jest.fn();

jest.mock('@hooks/persisted', () => ({
  useTheme: () => mockUseTheme(),
}));

const mockTheme = {
  primary: '#6200ee',
  onSurface: '#000',
  onSurfaceVariant: '#666',
  surfaceVariant: '#e8e8e8',
  rippleColor: 'rgba(0,0,0,0.1)',
  outline: '#ccc',
  error: '#f00',
  background: '#fff',
  surface: '#f5f5f5',
  onPrimary: '#fff',
  onBackground: '#000',
};

describe('SwitchItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue(mockTheme);
  });

  it('renders label text', () => {
    render(<SwitchItem label="Test Label" value={false} onPress={() => { }} theme={mockTheme} />);
    expect(screen.getByText('Test Label')).toBeTruthy();
  });

  it('renders description when provided', () => {
    render(
      <SwitchItem
        label="Test"
        description="A helpful description"
        value={false}
        onPress={() => { }}
        theme={mockTheme}
      />,
    );
    expect(screen.getByText('A helpful description')).toBeTruthy();
  });

  it('does not render description when omitted', () => {
    render(<SwitchItem label="Test" value={false} onPress={() => { }} theme={mockTheme} />);
    expect(screen.queryByText('A helpful description')).toBeNull();
  });

  it('calls onPress on press', () => {
    const onPress = jest.fn();
    render(<SwitchItem label="Pressable" value={false} onPress={onPress} theme={mockTheme} />);
    fireEvent.press(screen.getByText('Pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onLongPress on long press', () => {
    const onLongPress = jest.fn();
    render(
      <SwitchItem
        label="Long Press"
        value={false}
        onPress={() => { }}
        onLongPress={onLongPress}
        theme={mockTheme}
      />,
    );
    fireEvent(screen.getByText('Long Press'), 'onLongPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility role and label', () => {
    render(
      <SwitchItem label="Accessible" value={false} onPress={() => { }} theme={mockTheme} />,
    );
    const element = screen.getByRole('switch', { name: 'Accessible' });
    expect(element).toBeTruthy();
  });
});

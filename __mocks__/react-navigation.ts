jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);

// Include this line for mocking react-native-gesture-handler
require('react-native-gesture-handler/jestSetup');

// Include this section for mocking react-native-reanimated
const { setUpTests } = require('react-native-reanimated');

setUpTests();

// __tests__/jest.setup.ts

jest.mock('@react-navigation/native', () => {
  //const actualNav = jest.requireActual('@react-navigation/native');
  return {
    //...actualNav,
    useFocusEffect: jest.fn(),
    useNavigation: () => ({
      navigate: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

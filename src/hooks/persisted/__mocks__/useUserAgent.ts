export const USER_AGENT = 'USER_AGENT';

export const getUserAgent = jest.fn(() => 'MockUserAgent/1.0');

export default function useUserAgent() {
  const userAgent = 'MockUserAgent/1.0';
  const setUserAgent = jest.fn();

  return {
    userAgent,
    setUserAgent,
  };
}

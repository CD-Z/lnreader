export const SELF_HOST_BACKUP = 'SELF_HOST_BACKUP';

const useSelfHost = jest.fn(() => ({
  host: '',
  setHost: jest.fn(),
}));

export default useSelfHost;

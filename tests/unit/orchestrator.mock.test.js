jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => {
    return {
      listContainers: jest.fn().mockResolvedValue([
        { Names: ['/tempusstack_mocked'], Id: 'mocked123', State: 'running', Ports: [] }
      ]),

      getContainer: jest.fn().mockImplementation(() => ({
      inspect: jest.fn().mockResolvedValue({ id: 'mockedcontainer123', State: { Running: true } }),
      remove: jest.fn().mockResolvedValue(),
      stop: jest.fn().mockResolvedValue()
      })),

      createContainer: jest.fn().mockResolvedValue({
        id: 'mockedcontainer123',
        start: jest.fn().mockResolvedValue()
      }),

      pull: jest.fn((image, cb) => cb(null, {})),

      modem: {
        followProgress: (stream, cb) => cb(null, {})
      }
    };
  });
});

const { up, down } = require('../../core/orchestrator');

describe('orchestrator using mocked Docker', () => {
  const mockConfig = {
    services: {
      fake: {
        image: 'alpine',
        port: 12345
      }
    }
  };

  test('calls up() and returns mocked container id', async () => {
    const ids = await up(mockConfig, true);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids[0]).toMatch(/mockedcontainer/);
  });

  test('calls down() without error', async () => {
    await expect(down()).resolves.not.toThrow();
  }, 10000);
});

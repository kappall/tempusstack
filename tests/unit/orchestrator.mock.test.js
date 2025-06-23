jest.mock('dockerode');

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
    console.log("DEBUG - container ids returned:", ids);
    expect(ids[0]).toMatch(/mockedcontainer/);
  });

  test('calls down() without error', async () => {
    await expect(down()).resolves.not.toThrow();
  });
});

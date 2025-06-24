const { down } = require('../../core/orchestrator');

test('down() when no containers exist does not throw', async () => {
  await expect(down()).resolves.not.toThrow();
});
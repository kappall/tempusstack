const { up } = require('../../core/orchestrator');

jest.mock('../../plugins/mock', () => ({
  run: jest.fn().mockResolvedValue('plugincontainer123')
}));

test('up() uses plugin handler', async () => {
  const config = { services: { custom: { type: 'mock' } } };
  const ids = await up(config, true);
  expect(ids[0]).toBe('plugincontainer123');
});

jest.mock('../../plugins/badplugin', () => ({
  run: jest.fn().mockRejectedValue(new Error('Plugin failed'))
}));

test('up() with failing plugin throws', async () => {
  const config = { services: { bad: { type: 'badplugin' } } };
  await expect(up(config, true)).rejects.toThrow(/Start of stack failed/);
});
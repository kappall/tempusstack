const { parseConfig } = require('../core/configParser');
test('should parse config without error', () => {
  const config = parseConfig();
  expect(config.services).toBeDefined();
});

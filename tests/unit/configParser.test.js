const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { parseConfig } = require('../../core/configParser');

describe('parseConfig', () => {
  const tempFilePath = path.join(__dirname, 'tempusstack.test.yaml');

  afterEach(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('parses a valid config correctly', () => {
    const yamlData = yaml.stringify({
      services: {
        testdb: {
          image: 'postgres:15',
          port: 5432
        }
      }
    });

    fs.writeFileSync(tempFilePath, yamlData);

    const parsed = parseConfig(tempFilePath);
    expect(parsed.services).toBeDefined();
    expect(parsed.services.testdb.image).toBe('postgres:15');
  });

  test('throws on invalid config (missing services)', () => {
    const badYaml = yaml.stringify({ something: 'wrong' });
    fs.writeFileSync(tempFilePath, badYaml);
    expect(() => parseConfig(tempFilePath)).toThrow(/services/);
  });
});

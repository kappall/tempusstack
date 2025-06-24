const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const Docker = require('dockerode');
const docker = new Docker();

const { up, down } = require('../../core/orchestrator');
const { parseConfig } = require('../../core/configParser');

test('up() with empty services does nothing', async () => {
  const config = { services: {} };
  const ids = await up(config, true);
  expect(ids).toEqual([]);
});

describe('up() integration test', () => {
  const testYamlPath = path.join(__dirname, 'tempusstack.test.yaml');

  beforeAll(() => {
    const yamlData = yaml.stringify({
      services: {
        integtest: {
          image: 'alpine',
          port: 12345,
          Cmd: ['sleep', '60']
        }
      }
    });
    fs.writeFileSync(testYamlPath, yamlData);
  });

  afterAll(async () => {
    fs.unlinkSync(testYamlPath);
    await down();
  });

  test('starts a container and assigns correct name', async () => {
    const config = parseConfig(testYamlPath);
    const ids = await up(config, true); // detached=true
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);

    const containers = await docker.listContainers({ all: true });
    const matching = containers.find(c =>
      c.Names.some(name => name.startsWith('/tempusstack_integtest'))
    );
    expect(matching).toBeDefined();
  }, 10000);
});

test('up() with invalid image triggers cleanup and throws generic error', async () => {
  const config = { services: { bad: { image: 'nonexistent:image' } } };
  await expect(up(config, true)).rejects.toThrow(/Start of stack failed/);
});

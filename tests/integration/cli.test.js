const { down } = require('../../core/orchestrator');

const execa = require('execa');

describe('CLI commands intergation test', () => {

    beforeAll(async () => {
        await down();
      });

    test('CLI up with missing config fails', async () => {
      const { stderr } = await execa('node', ['bin/tempusstack.js', 'up', '--config', 'nofile.yaml'], { reject: false });
      expect(stderr).toMatch(/ENOENT|not found/);
    });
    
    test('CLI status prints no containers', async () => {
      const { stdout } = await execa('node', ['bin/tempusstack.js', 'status']);
      expect(stdout).toMatch(/No tempusstack container/);
    });
    
    test('CLI logs for missing service fails', async () => {
      const { stderr } = await execa('node', ['bin/tempusstack.js', 'logs', 'notfound'], { reject: false });
      expect(stderr).toMatch(/not running or does not exist/);
    });
})
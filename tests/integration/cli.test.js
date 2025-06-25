const { down, up } = require('../../core/orchestrator');

const execa = require('execa');

test('CLI up with missing config fails', async () => {
    const { stderr } = await execa('node', ['bin/tempusstack.js', 'up', '--config', 'nofile.yaml'], { reject: false });
    expect(stderr).toMatch(/ENOENT|not found/);
  });
    
describe('container lifecycle', () => {
  test('up creates container that shows in status', async () => {
    const config = { services: { mytest: { image: 'alpine' } } };
    await up(config);
    
    const { stdout } = await execa('node', ['bin/tempusstack.js', 'status']);
    expect(stdout).toContain('tempusstack_mytest');
  });
  
  test('down removes specific container', async () => {

    const config = { services: { mytest2: { image: 'alpine' } } };
    await up(config);
    await down();
    
    const { stdout } = await execa('node', ['bin/tempusstack.js', 'status']);
    expect(stdout).not.toContain('tempusstack_mytest2');
  });
});
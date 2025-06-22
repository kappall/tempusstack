const chalk = require('chalk');
const Docker = require('dockerode')

const docker = new Docker()

async function up(config) {
  console.log(chalk.green('Starting the services defined in tempusstack.yaml...\n'));

  for (const [name, cfg] of Object.entries(config.services || {})) {
    console.log(chalk.blue(`- Startinng Service: ${name}`));
    console.log(`  image: ${cfg.image}`);
    console.log(`  port: ${cfg.port}`);

    try {
        console.log(chalk.yellow(`  Checking and pulling the image ${cfg.image}...`));
        await docker.pull(cfg.image);
        console.log(chalk.green(`   Image ${cfg.image} ready.`));

        const containerOptions = {
            image: cfg.image,
            name: `tempusstack_${name}`,
            ExposedPorts: {},
            HostConfig: {
                PortBindings: {},
            },
            Env: Object.entries(cfg.env || {}).map(([key, value]) => `${key}=${value}`),
        };

        if(cfg.port) {
            const protocol = 'tcp';
            containerOptions.ExposedPorts[`${cfg.port}/${protocol}`] = {};
            containerOptions.HostConfig.PortBindings[`${cfg.port}/${protocol}`] = [{HostPort: String(cfg.port)}];
        }
        
        console.log(chalk.yellow(`  Creating the container for ${name}...`));
        const container = await docker.createContainer(containerOptions);
        console.log(chalk.green(`   Container "${container.id.substring(0,12)}" created.`));

        console.log(chalk.yellow(`  Starting the container for ${name}...`));
        await container.start();
        console.log(chalk.green(`   Service "${name}" started on port ${cfg.port || 'not mapped'}!`));
        console.log('');
    } catch (error) {
        console.error(chalk.red(`   Error starting service "${name}":`));
        console.error(chalk.red(`       ${error.message || error}`));
        console.log('');
    }
  }
}

module.exports = { up };

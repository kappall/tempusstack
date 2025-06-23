const chalk = require("chalk");
const Docker = require("dockerode");
const { loadHandler } = require("./configParser")

const docker = new Docker();


async function getTempusstackContainers() {
    const containers = await docker.listContainers({all: true});
    return containers.filter( c=> 
        c.Names.some(name => name.startsWith('/tempusstack_'))
    );
}

async function stopAndRemoveContainer(containerId, serviceName) {
    try {
        const container = docker.getContainer(containerId);
        const inspectData = await container.inspect();
        
        if(inspectData.State.Running) {
            console.log(chalk.yellow(`  Stopping container "${serviceName}" (${containerId.substring(0, 12)})...`))
            await container.stop();
            console.log(chalk.green(`   Container "${serviceName}" stopped.`));
        } else {
            console.log(chalk.grey(`   Container "${serviceName}" (${containerId.substring(0, 12)}) not running, skipping the stop.`));
        }

        console.log(chalk.yellow(`  Removing container "${serviceName}" (${containerId.substring(0, 12)})...`));
        await container.remove();
        console.log(chalk.green(`   Container "${serviceName}" removed.`));
        return true;
    } catch (error) {
        console.error(chalk.red(`   Error removing container "${serviceName}" (${containerId.substring(0, 12)}):`))
        console.error(chalk.red(`       ${error.message || error}`));
        return false;
    }
}

async function up(config, detached = false) {
  console.log(
    chalk.green("Starting the services defined in tempusstack.yaml...\n")
  );

  const startedContainerIds = [];
  startFailed = false;

  for (const [name, cfg] of Object.entries(config.services || {})) {
    const type = cfg.type || 'docker';

    let handler;
    try {
      handler = loadHandler(type);
    } catch (error) {
      console.log(chalk.red(`   Cannot load handler for type '${type}': ${error.message || error}`));
      startFailed = true;
      break;
    }
    
    try {
      const containerId = await handler.run(docker, name, cfg);
      if (containerId) startedContainerIds.push(containerId);
    } catch (error) {
      console.log(chalk.red(`   Error starting service '${name}': ${error.message || error}`));
      startFailed = true;
      break;
    }
  }
  if (startFailed) {
      console.error(chalk.red(`One or more services failed to start. Cleaning...`));
      await down();
      throw new Error('Start of stack failed, check errors above');

  }
  if (detached) {
    console.log(chalk.green("All services have been started in backgound."));
    console.log(chalk.grey("Use `tempusstack down` to stop and remove them."));
  }

  return startedContainerIds;
}

async function down() {
  console.log(chalk.green('Stopping and removing tempusstack services...\n'));

  const tempusstackContainers = await getTempusstackContainers();

  if(tempusstackContainers.length === 0) {
    return;
  }

  for (const c of tempusstackContainers) {
    const serviceName = c.Names[0].replace('/tempusstack_','');
    await stopAndRemoveContainer(c.Id, serviceName);
  }
  console.log(chalk.green('\nAll tempusstack containers stopped and removed.'));
}

module.exports = { up, down, getTempusstackContainers };

const chalk = require("chalk");
const Docker = require("dockerode");
const { loadHandler } = require("./configParser");
const stream = require('stream');
const { getTempusstackContainers, stopAndRemoveContainer } = require('./utils');


const docker = new Docker();

async function up(config, detached = false, verbose = false) {
  console.log(
    chalk.green("Starting the services defined in tempusstack.yaml...\n")
  );

  const startedContainerIds = [];
  let startFailed = false;

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
      const containerId = await handler.run(docker, name, cfg, verbose);
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
    if (verbose)
      console.log(chalk.green("All services have been started in backgound."));
    console.log(chalk.grey("Use `tempusstack down` to stop and remove them."));
  }

  return startedContainerIds;
}

async function down(verbose = true) {
  console.log(chalk.green('Stopping and removing tempusstack services...\n'));

  const tempusstackContainers = await getTempusstackContainers(docker);

  if(tempusstackContainers.length === 0) {
    return;
  }

  for (const c of tempusstackContainers) {
    const serviceName = c.Names[0].replace('/tempusstack_','');
    await stopAndRemoveContainer(c.Id, serviceName, docker, verbose);
  }

  await waitForContainersToBeGone();

  console.log(chalk.green('\nAll tempusstack containers stopped and removed.'));
}

async function waitForContainersToBeGone(maxRetries = 10, delayMs = 500) {
  for (let i = 0; i < maxRetries; ++i) {
    const containers = await getTempusstackContainers(docker);
    if (containers.length === 0)
      return;

    await new Promise(resolve => {setTimeout(resolve, delayMs)});
  }

  const remainingContainers = await getTempusstackContainers(docker);
  console.warn(chalk.yellow(`Warning: ${remainingContainers.length} tempusstack containers still visible after cleanup`));
}


async function showStatus() {
  const containers = await getTempusstackContainers(docker);
  if (!containers.length) {
    console.log(chalk.yellow('No tempusstack container are running'));
    return;
  }
  for (const c of containers) {
    console.log(chalk.green(` - ${c.Names[0]} (${c.Id.substring(0, 12)})`));
    console.log(`   Status: ${c.State} | Ports: ${c.Ports.map(p => `${p.PublicPort}->${p.PrivatePort}`).join(', ')}`);
  }
}

async function showLogs(service, follow = false) {
  const containerName = `tempusstack_${service}`;
  const container = docker.getContainer(containerName);

  // checking if container exist
  try {
    await container.inspect();
  } catch {
    throw Error(`Service '${service}' is not running or does not exist.`)
  }

  const logOpts = {
    stdout: true,
    stderr: true,
    follow,
    tail: 100
  };

  if (follow) { //stream
    const logStream = new stream.PassThrough();
    logStream.on('data', chunk => process.stdout.write(chunk));
  
    const dockerStream = await container.logs(logOpts) //await needed, ignore ide suggestion
    dockerStream.pipe(logStream);
    dockerStream.on('end', () => logStream.end());
  } else { //buffer
    logOpts.follow = false;
    const logs = await container.logs(logOpts); //await needed, ignore ide suggestion
    process.stdout.write(logs);
  }
}

async function restartService(service, verbose = false) {
  const containerName = `tempusstack_${service}`;
  const container = docker.getContainer(containerName);

  // checking if container exist
  try {
    await container.inspect();
  } catch {
    throw Error(`Service '${service}' is not running or does not exist.`)
  }
  if (verbose)
    console.log(chalk.yellow('Restarting service...'))
  try {
    await container.restart();
  } catch (error) {
    throw error;
  }

  if (verbose)
    console.log(chalk.green('Service restarted'));
}

module.exports = { up, down, showLogs, showStatus, restartService};

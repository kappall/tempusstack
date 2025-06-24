const chalk = require("chalk");

async function getTempusstackContainers(docker) {
    const containers = await docker.listContainers({all: true});
    return containers.filter( c=> 
        c.Names.some(name => name.startsWith('/tempusstack_'))
    );
}

async function stopAndRemoveContainer(containerId, serviceName, docker, verbose) {
    try {
        const container = docker.getContainer(containerId);
        const inspectData = await container.inspect();
        
        if(inspectData.State.Running) {
            if (verbose)
              console.log(chalk.yellow(`  Stopping container "${serviceName}" (${containerId.substring(0, 12)})...`))
            await ensureContainerStopped(container);
            if (verbose)
              console.log(chalk.green(`   Container "${serviceName}" stopped.`));
        } else {
            if (verbose)
              console.log(chalk.grey(`   Container "${serviceName}" (${containerId.substring(0, 12)}) not running, skipping the stop.`));
        }
        if (verbose)
          console.log(chalk.yellow(`  Removing container "${serviceName}" (${containerId.substring(0, 12)})...`));
        await container.remove();
        if (verbose)
          console.log(chalk.green(`   Container "${serviceName}" removed.`));
        return true;
    } catch (error) {
        console.error(chalk.red(`   Error removing container "${serviceName}" (${containerId.substring(0, 12)}):`))
        console.error(chalk.red(`       ${error.message || error}`));
        return false;
    }
}

async function pullImageWithRetry(docker, image, maxRetries = 3, verbose = false) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (verbose)
        console.log(chalk.yellow(`  Pulling image ${image} (attempt ${attempt}/${maxRetries})...`));
      
      await new Promise((resolve, reject) => {
        docker.pull(image, (err, stream) => {
          if (err) return reject(err);
          
          docker.modem.followProgress(stream, (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        });
      });
      if (verbose)
        console.log(chalk.green(`   Image ${image} ready.`));
      return;
      
    } catch (error) {
      if (verbose)
        console.log(chalk.yellow(`   Pull attempt ${attempt} failed: ${error.message}`));
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to pull image ${image} after ${maxRetries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function ensureContainerStopped(container) {
  try {
    const inspectData = await container.inspect();
    if (inspectData.State.Running) {
      await container.stop({ t: 10 });
    }
  } catch (error) {
    if (error.statusCode === 404) {
      // Container doesn't exist, that's fine
      return;
    }
    throw error;
  }
}


module.exports = { stopAndRemoveContainer, getTempusstackContainers, pullImageWithRetry, ensureContainerStopped };
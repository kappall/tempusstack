const chalk = require("chalk");

async function getTempusstackContainers(docker) {
    const containers = await docker.listContainers({all: true});
    return containers.filter( c=> 
        c.Names.some(name => name.startsWith('/tempusstack_'))
    );
}

async function stopAndRemoveContainer(containerId, serviceName, docker) {
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


module.exports = { stopAndRemoveContainer, getTempusstackContainers };
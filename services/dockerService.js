const chalk = require("chalk");
const { pullImageWithRetry } = require('../core/utils');

module.exports = {
  run: async (docker, name, cfg, verbose) => {
    const containerName = `tempusstack_${name}`;
    if (verbose){
      console.log(chalk.blue(`- Starting Service: ${name}`));
      console.log(`  image: ${cfg.image}`);
      console.log(`  port: ${cfg.port}`);
    }
    let existingContainer;
    try {
      existingContainer = await docker.getContainer(containerName);
      const inspectData = await existingContainer.inspect();
      if (inspectData.State.Running) {
        if (verbose)
          console.log(chalk.yellow(`  Container "${containerName}" already running. Skipping start`));
        return inspectData.id;
      } else {
        if (verbose)
          console.log(chalk.yellow(`  Container "${containerName}" already exists but not running. Removing to recreate.`));
        await existingContainer.remove({ force: true });
      }
    } catch (e) {
      // container does not exsist. proceed to create
    }
    if (verbose)

    // TODO: progress bar
    pullImageWithRetry(docker,cfg.image);

    const container = await docker.createContainer({
      Image: cfg.image,
      name: containerName,
      ExposedPorts: cfg.port ? { [`${cfg.port}/tcp`]: {} } : undefined,
      HostConfig: {
        PortBindings: cfg.port ? { [`${cfg.port}/tcp`]: [{ HostPort: String(cfg.port) }] } : undefined,
        RestartPolicy: { Name: "no" },
      },
      Env: Object.entries(cfg.env || {}).map(([key, value]) => `${key}=${value}`),
    });

    if (verbose)
      console.log(chalk.green(`   Container "${container.id.substring(0, 12)}" created.`));

    await container.start();
    if (verbose) {
      console.log(chalk.green(`   Service "${name}" started on port ${cfg.port}!`));
      console.log("");
    }
    return container.id;
  }
};

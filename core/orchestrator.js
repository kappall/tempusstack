const chalk = require("chalk");
const Docker = require("dockerode");

const docker = new Docker();

async function up(config, detached = false) {
  console.log(
    chalk.green("Starting the services defined in tempusstack.yaml...\n")
  );

  const startedContainerIds = [];

  for (const [name, cfg] of Object.entries(config.services || {})) {
    const containerName = `tempusstack_${name}`;
    console.log(chalk.blue(`- Startinng Service: ${name}`));
    console.log(`  image: ${cfg.image}`);
    console.log(`  port: ${cfg.port}`);

    try {
      let existingContainer;
      try {
        existingContainer = await docker.getContainer(containerName);
        const inspectData = await existingContainer.inspect();
        if (inspectData.State.Running) {
          console.log(
            chalk.yellow(
              `  Container "${containerName}" already running. Skippinf start`
            )
          );
          startedContainerIds.push(existingContainer.id);
          continue;
        } else {
          console.log(
            chalk.yellow(
              `  Container "${containerName}" already exists but not running. Removing to recreate.`
            )
          );
          await existingContainer.remove({ force: true });
        }
      } catch (e) {
        // container does not exsist. proceed to create
      }
      console.log(
        chalk.yellow(`  Checking and pulling the image ${cfg.image}...`)
      );

      // TODO: progress bar
      await new Promise((resolve, reject) => {
        docker.pull(cfg.image, (err, stream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err, res) =>
            err ? reject(err) : resolve(res)
          );
        });
      });
      console.log(chalk.green(`   Image ${cfg.image} ready.`));

      const containerOptions = {
        image: cfg.image,
        name: containerName,
        ExposedPorts: {},
        HostConfig: {
          PortBindings: {},
          RestartPolicy: { Name: "no" },
        },
        Env: Object.entries(cfg.env || {}).map(
          ([key, value]) => `${key}=${value}`
        ),
      };

      if (cfg.port) {
        const protocol = "tcp";
        containerOptions.ExposedPorts[`${cfg.port}/${protocol}`] = {};
        containerOptions.HostConfig.PortBindings[`${cfg.port}/${protocol}`] = [
          { HostPort: String(cfg.port) },
        ];
      }

      console.log(chalk.yellow(`  Creating the container for ${name}...`));
      const container = await docker.createContainer(containerOptions);
      console.log(
        chalk.green(`   Container "${container.id.substring(0, 12)}" created.`)
      );
      startedContainerIds.push(container.id);

      console.log(chalk.yellow(`  Starting the container for ${name}...`));
      await container.start();
      console.log(
        chalk.green(
          `   Service "${name}" started on port ${cfg.port || "not mapped"}!`
        )
      );
      console.log("");
    } catch (error) {
      console.error(chalk.red(`   Error starting service "${name}":`));
      console.error(chalk.red(`       ${error.message || error}`));
      console.log("");
    }
  }
  if (detached) {
    console.log(chalk.green("All services have been started in backgound."));
    console.log(chalk.grey("Use `tempusstack down` to stop and remove them.")); // TODO: tempusstack down
  }

  return startedContainerIds;
}

module.exports = { up };

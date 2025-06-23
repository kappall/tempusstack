const path = require("path");
const chalk = require("chalk");
const fs = require("fs");

module.exports = {
  run: async (docker, name, cfg) => {
    const containerName = `tempusstack_${name}`;
    const containerPort = cfg.port || 3001;

    const mockPath = path.resolve(process.cwd(), cfg.file);
    if (!fs.existsSync(mockPath)) {
      throw new Error(`File not found: ${mockPath}`);
    }

    const mountDir = path.dirname(mockPath);
    const image = "node:18-alpine";

    try {
      const existing = docker.getContainer(containerName);
      const data = await existing.inspect();
      if (data.State.Running) {
        console.log(chalk.yellow(`  Container '${containerName}' already running.`));
        return data.Id;
      } else {
        console.log(chalk.gray(`  Removing old container '${containerName}'...`));
        await existing.remove({ force: true });
      }
    } catch (_) {
    }

    console.log(chalk.yellow(`  Pulling image ${image}...`));
    await new Promise((resolve, reject) => {
      docker.pull(image, (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err, res) =>
          err ? reject(err) : resolve(res)
        );
      });
    });

    const container = await docker.createContainer({
      Image: image,
      name: containerName,
      Cmd: ["npx", "http-server", ".", "-p", `${containerPort}`],
      WorkingDir: "/data",
      HostConfig: {
        Binds: [`${mountDir}:/data:ro`],
        PortBindings: {
          [`${containerPort}/tcp`]: [{ HostPort: `${containerPort}` }]
        }
      },
      ExposedPorts: { [`${containerPort}/tcp`]: {} }
    });

    await container.start();
    console.log(chalk.green(`  Mock service '${name}' started on port ${containerPort}`));
    console.log(chalk.gray(`  Served file: ${cfg.file}`));
    return container.id;
  }
};

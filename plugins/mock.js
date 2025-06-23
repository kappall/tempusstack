const path = require("path");
const chalk = require("chalk");

module.exports = {
  run: async (docker, name, cfg) => {
    const containerName = `tempusstack_${name}`;
    const mockPath = path.resolve(process.cwd(), 'test', 'exmaple', cfg.file);
    const mountDir = path.dirname(mockPath);
    const containerPort = cfg.port || 3001;

    const image = "node:18-alpine";

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
    return container.id;
  }
};

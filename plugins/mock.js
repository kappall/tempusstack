const path = require("path");
const chalk = require("chalk");
const fs = require("fs");
const { pullImageWithRetry } = require('../core/utils')

module.exports = {
  run: async (docker, name, cfg, verbose = false) => {
    const containerName = `tempusstack_${name}`;
    const containerPort = cfg.port || 3001;

    const mockPath = path.resolve(process.cwd(), cfg.file);
    if (!fs.existsSync(mockPath)) {
      throw new Error(`Mock file not found: ${mockPath}`);
    }

    // Validate JSON structure
    try {
      const mockData = JSON.parse(fs.readFileSync(mockPath, 'utf8'));
      if (typeof mockData !== 'object') {
        throw new Error('Mock file must contain a JSON object');
      }
    } catch (error) {
      throw new Error(`Invalid mock file ${cfg.file}: ${error.message}`);
    }

    const mountDir = path.dirname(mockPath);
    const fileName = path.basename(mockPath);
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
    } catch (error) {
      // Container doesn't exist, continue
    }

    pullImageWithRetry(docker, image);

    // Create a simple HTTP server script
    const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const mockData = JSON.parse(fs.readFileSync('/data/${fileName}', 'utf8'));
const port = ${containerPort};

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const response = mockData[req.url];
  if (response) {
    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', available: Object.keys(mockData) }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(\`Mock server running on port \${port}\`);
});
`;

    const container = await docker.createContainer({
      Image: image,
      name: containerName,
      Cmd: ["node", "-e", serverScript],
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
    if (verbose) {
      console.log(chalk.green(`  Mock service '${name}' started on port ${containerPort}`));
      console.log(chalk.gray(`  Available endpoints: ${Object.keys(JSON.parse(fs.readFileSync(mockPath, 'utf8'))).join(', ')}`));
    }
    return container.id;
  }
};
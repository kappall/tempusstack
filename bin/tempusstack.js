#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { parseConfig } = require('../core/configParser');
const { up, down, showStatus, showLogs, restartService } = require('../core/orchestrator');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('tempusstack')
  .description('Tool to handle temporal stacks in Docker')
  .version('0.1.0');

program
  .command('up')
  .description('Start the services defined in tempusstack.yaml')
  .option('-d --detached', 'Start all services in background')
  .option('--config <path>', 'Specify custom config file paths')
  .option('-v --verbose', 'Enable verbose output')
  .action(async (options) => {
    let isShuttingDown = false;
    let filePath = options.config;
    const config = parseConfig(filePath);

    const sigintHandler = async () => {
      if (isShuttingDown) return;

      isShuttingDown = true;

      console.log(chalk.red('\n\nCtrl+c detected. Starting cleaning...'));
      try {
        await down(options.verbose === true)
      } catch (cleanupError) {
        console.error(chalk.red(`Error during cleaning: ${cleanupError.message || cleanupError}`));
      } finally {
        process.exit(0);
      }
    };
    try {
      await up(config, options.detached, options.verbose);
      if(!options.detached) {
        process.on('SIGINT',sigintHandler);
          console.log(chalk.blue('\nServices Started. Press Ctrl+c to stop and remove them.'));

          // to keep alive
          setInterval(()=>{}, 1<<30);
      }
    } catch (_) { // errors already printed
        process.exit(1);
    }
  });

program
  .command('down')
  .description('Stop and remove all services started by tempusstack')
  .action(async () => {
    try {
      await down();
    } catch (error) {
        console.error(chalk.red(`Error during executions of command 'down': ${error.message || error}`));
        process.exit(1);
    }
  })

program
  .command('status')
  .description('List active tempusstack containers')
  .action(async () => {
    await showStatus();
  });

program
  .command('init')
  .description('Create an example tempusstack.yaml file in the current directory')
  .action(() => {
    const yamlPath = path.resolve(process.cwd(), 'tempusstack.yaml');
    const mockPath = path.resolve(process.cwd(), 'mock.json');

    if (fs.existsSync(yamlPath)) {
      console.log(chalk.red('Error: tempusstack.yaml already exists. Aborting'));
      process.exit(1);
    }

    const example = `# tempusstack.yaml - example config file
services:
  db:
    image: postgres:15
    port: 5432
    env:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
  
  mock-api:
    type: mock
    file: ./mock.json
    port: 3001
`;

    const exampleMock = {
      "/api/status": { "status": "ok", "timestamp": new Date().toISOString()},
      "/api/user": { "id": 1, "name": "Tempus Tester", "role": "admin"}
    };

    fs.writeFileSync(yamlPath,example);
    console.log(chalk.green('tempusstack.yaml created.'));

    if(!fs.existsSync(mockPath)) {
      fs.writeFileSync(mockPath,JSON.stringify(exampleMock,null,2));
      console.log(chalk.green('mock.json created.'));
    }

  });

program
  .command('logs <service>')
  .description('Show logs for a running tempusstack service')
  .option('-f --follow', 'Follow log output, like tail')
  .action(async (service, options) => {
    try {
      await showLogs(service, options.follow);
    } catch (error) {
      console.error(chalk.red(`Error fetching logs: ${error.message || error}`));
      process.exit(1);
    }
  })

program
  .command('restart <service>')
  .description('restart a running tempusstack service')
  .action(async (service) => {
    try {
      await restartService(service);
    } catch (error) {
      console.error(chalk.red(`Error restarting service: ${error.message || error}`));
      process.exit(1);
    }
  })


program.parse(process.argv);

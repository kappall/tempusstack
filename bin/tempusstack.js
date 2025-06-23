#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { parseConfig } = require('../core/configParser');
const { up, down } = require('../core/orchestrator');

const program = new Command();

program
  .name('tempusstack')
  .description('Tool to handle temporal stacks in Docker')
  .version('0.1.0');

program
  .command('up')
  .description('Start the services defined in tempusstack.yaml')
  .option('-d --detached', 'Start all services in background')
  .action(async (options) => {
    let isShuttingDown = false;
    const config = parseConfig();

    const sigintHandler = async () => {
        console.log(chalk.gray(`ignoring this Ctrl+c`))
      if (isShuttingDown) return;

      isShuttingDown = true;

      console.log(chalk.red('\n\nCtrl+c relevated. Starting cleaning...'));
      try {
        await down()
      } catch (cleanupError) {
        console.error(chalk.red(`Error during cleaning: ${cleanupError.message || cleanupError}`));
      } finally {
        process.exit(0);
      }
    };
    try {
      await up(config, options.detached);
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

program.parse(process.argv);

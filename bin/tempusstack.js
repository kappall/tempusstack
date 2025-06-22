#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { parseConfig } = require('../core/configParser');
const { up } = require('../core/orchestrator');

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
    try {
        const config = parseConfig();
        await up(config, options.detached);

        if(!options.detached) {
            console.log(chalk.blue('\nServices Started. Press Ctrl+c to stop and remove them.'));
            process.stdin.resume();
            process.on('SIGINT',async ()=>{
                console.log(chalk.red('\n\nCtrl+c relevated. Starting cleaning...'));
                // TODO: down
                process.exit(0);
            });
        }
    } catch (error) {
        console.error(chalk.red(`Error during executions of command 'up': ${error.message || error}`));
        process.exit(1);
    }
  });

program
  .command('down')
  .description('Stop and remove all services started by tempusstack')
  .action(async () => {
    try {

    } catch (error) {
        console.error(chalk.red(`Error during executions of command 'down': ${error.message || error}`));
        process.exit(1);
    }
  })

program.parse(process.argv);

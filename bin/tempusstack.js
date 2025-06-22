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
  .action(() => {
    const config = parseConfig();
    up(config);
  });

program.parse(process.argv);

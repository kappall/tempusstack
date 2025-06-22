const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

function parseConfig() {
  const configPath = path.resolve(process.cwd(), 'tempusstack.yaml');
  const file = fs.readFileSync(configPath, 'utf8');
  return yaml.parse(file);
}

module.exports = { parseConfig };

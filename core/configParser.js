const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

function parseConfig() {
  const configPath = path.resolve(process.cwd(), 'tempusstack.yaml');
  const file = fs.readFileSync(configPath, 'utf8');
  parsedYaml = yaml.parse(file)
  validateConfig(parsedYaml)
  return parsedYaml;
}

function validateConfig(config) {
  const errors = [];

  if(!config.services || typeof config.services !== 'object') {
    throw new Error("Invalid or missing 'services block.");
  }

  for (const [name, cfg] of Object.entries(config.services)) {
    if (!cfg.image) errors.push(`Service '${name}' missing required field 'image'.`);
    if (cfg.port && isNaN(Number(cfg.port))) errors.push(`Service '${name}' has invalid port.`);
  }

  if (errors.length) {
    const message = errors.map(e => ` - ${e}`).join('\n');
    throw new Error(`Config validation failed:\n${message}`);
  }
}

module.exports = { parseConfig };

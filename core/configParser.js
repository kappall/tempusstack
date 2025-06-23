const fs = require('fs');
const yaml = require('yaml');
const path = require('path');


function loadHandler(type) {
  const basePath = path.resolve(__dirname, '..');
  const pluginPath = type === 'docker' 
    ? path.join(basePath, 'services', 'dockerService.js')
    : path.join(basePath, 'plugins', `${type}.js`);
  
  if (!fs.existsSync(pluginPath)) {
    throw new Error(`Plugin '${type}' not found at ${pluginPath}`);
  }
  return require(pluginPath);
}


function parseConfig(filepath) {
  const configPath = filepath || path.resolve(process.cwd(), 'tempusstack.yaml');
  const file = fs.readFileSync(configPath, 'utf8');
  const parsedYaml = yaml.parse(file);
  validateConfig(parsedYaml);
  return parsedYaml;
}

function validateConfig(config) {
  const errors = [];
  const warnings = [];

  if (!config.services || typeof config.services !== 'object') {
    throw new Error("Invalid or missing 'services' block.");
  }

  if (Object.keys(config.services).length === 0) {
    warnings.push("No services defined in configuration.");
  }

  for (const [name, cfg] of Object.entries(config.services)) {
    const type = cfg.type || 'docker';

    // Validate service name
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      errors.push(`Service '${name}' has invalid name. Use only alphanumeric, underscore, and dash characters.`);
    }

    // Type-specific validation
    if (type === 'docker') {
      if (!cfg.image) {
        errors.push(`Service '${name}' missing required field 'image'.`);
      } else if (typeof cfg.image !== 'string') {
        errors.push(`Service '${name}' field 'image' must be a string.`);
      }

      if (cfg.port) {
        const port = Number(cfg.port);
        if (isNaN(port) || port < 1 || port > 65535) {
          errors.push(`Service '${name}' has invalid port '${cfg.port}'. Must be between 1-65535.`);
        }
      }

      if (cfg.env && typeof cfg.env !== 'object') {
        errors.push(`Service '${name}' field 'env' must be an object.`);
      }
    }
    
    if (type === 'mock') {
      if (!cfg.file) {
        errors.push(`Service '${name}' (type=mock) missing required field 'file'.`);
      } else {
        // Check if file exists
        const filePath = path.resolve(process.cwd(), cfg.file);
        if (!fs.existsSync(filePath)) {
          errors.push(`Service '${name}' mock file not found: ${cfg.file}`);
        }
      }

      if (cfg.port) {
        const port = Number(cfg.port);
        if (isNaN(port) || port < 1 || port > 65535) {
          errors.push(`Service '${name}' has invalid port '${cfg.port}'. Must be between 1-65535.`);
        }
      }
    }
  }

  // Check for port conflicts
  const usedPorts = new Set();
  for (const [name, cfg] of Object.entries(config.services)) {
    if (cfg.port) {
      if (usedPorts.has(cfg.port)) {
        errors.push(`Port ${cfg.port} is used by multiple services.`);
      }
      usedPorts.add(cfg.port);
    }
  }

  if (warnings.length) {
    console.log(chalk.yellow('Configuration warnings:'));
    warnings.forEach(w => console.log(chalk.yellow(` - ${w}`)));
  }

  if (errors.length) {
    const message = errors.map(e => ` - ${e}`).join('\n');
    throw new Error(`Config validation failed:\n${message}`);
  }
}

module.exports = { parseConfig, loadHandler };

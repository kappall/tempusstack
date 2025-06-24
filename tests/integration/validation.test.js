const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const { parseConfig } = require('../../core/configParser');

test('parseConfig throws if service missing image and type', () => {
  const badConfig = { services: { bad: {} } };
  const tempPath = path.join(__dirname, 'bad.yaml');
  fs.writeFileSync(tempPath, yaml.stringify(badConfig));
  expect(() => parseConfig(tempPath)).toThrow(/image|type/);
  fs.unlinkSync(tempPath);
});

test('parseConfig throws on invalid YAML', () => {
  const tempPath = path.join(__dirname, 'bad.yaml');
  fs.writeFileSync(tempPath, 'not: [valid: yaml');
  expect(() => parseConfig(tempPath)).toThrow();
  fs.unlinkSync(tempPath);
});
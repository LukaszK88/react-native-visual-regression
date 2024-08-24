const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(process.cwd(), 'package.json');

const packageJson = require(packageJsonPath);

const scriptName = 'vr';
const scriptCommand = 'rn-vr';

if (!packageJson.scripts) {
    packageJson.scripts = {};
}

packageJson.scripts[scriptName] = scriptCommand;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(`Added/updated script "${scriptName}" in package.json`);

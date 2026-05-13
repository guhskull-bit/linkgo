import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const configRoot = path.join(projectRoot, '.netlify-cli-config');
const binaryName = process.platform === 'win32' ? 'netlify.cmd' : 'netlify';
const netlifyBin = path.join(projectRoot, 'node_modules', '.bin', binaryName);
const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : netlifyBin;
const extraArgs = process.argv.slice(2);
const windowsArgs = extraArgs.join(' ');
const commandArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', `${netlifyBin} dev ${windowsArgs}`.trim()]
    : ['dev', ...extraArgs];

mkdirSync(configRoot, { recursive: true });

const child = spawn(command, commandArgs, {
  cwd: projectRoot,
  env: {
    ...process.env,
    APPDATA: configRoot,
    XDG_CONFIG_HOME: configRoot,
  },
  shell: false,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

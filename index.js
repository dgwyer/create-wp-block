#!/usr/bin/env node
import yargs from "yargs";
import { execa } from 'execa';

const argv = yargs(process.argv.slice(2))
  .alias('name', 'n')
  .alias('dir', 'd')
  .array('name')
  //.boolean('auto_deploy')
  //.number('dropbox_base_index')
  .argv;

/* Todo

- Test running this from a separate app.
- Setup a test app to test locally.
- npm link package and test app.
- Get it to run @wordpress/create-block with no scripts to begin with to make sure everything is running.
- Try to capture a block name and run the core package and run a test post script to console log the block name.
- Add post script code to format the block to have the new block name. Can we use mustache for this?
- Try to capture multiple block names.
- See what happens when you don't enter a plugin slug, with/without a block name(s).
- Add tailwind support. Note for this we'll need to publish a template to integrate Tailwind for a single block.
- Add keywords to package.json.
- AplineJS support?
- Change 'master' branch to 'main'.

*/

/*

Done:
- Capture single or multiple block names.
- Output @wordpress/create-block to './out' folder.
- Pass in the plugin slug as a CLI option.

Bugs:
- When in interactive mode each line of prompt text is outputted twice.

*/

console.log("1. Args:\n");
console.log(argv);

let pluginSlug;

if (argv._) {
  pluginSlug = argv._;
} else {
  pluginSlug = ''; // If no plugin slug then trigger interactive mode for npx @wordpress/create-block
}

const cb = (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
};

execa(
  'npm',
  ['exec', '--', '@wordpress/create-block', pluginSlug, '--no-wp-scripts'],
  {
    cwd: './out',
    stdin: 'inherit'
  }
).stdout.pipe(process.stdout);


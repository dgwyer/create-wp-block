#!/usr/bin/env node
import yargs from "yargs";
import { execa } from 'execa';
import replace from 'replace-in-file';

const argv = yargs(process.argv.slice(2))
  .alias('name', 'n')
  .alias('block', 'b')
  .alias('dir', 'd')
  .array('name')
  .array('block')
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
- Don't think we have to locally install @wordpress/create-block?
- AplineJS support?

*/

/*

Done:
- Capture single or multiple block names.
- Output @wordpress/create-block to './out' folder.
- Pass in the plugin slug as a CLI option.

Bugs:
- When in interactive mode each line of prompt text is outputted twice.

*/

console.log("11. Passed in args:\n");
console.log(argv);

let pluginSlug;

if (argv._) {
  if (argv._.length > 0) {
    pluginSlug = argv._[0];
  }
  if (argv._.length === 0) {
    console.log('Exiting! No plugin slug found. Please retry and enter a plugin slug.');
    process.exit();
  }
}

const cb = (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
};

const createBlockScript = await execa(
  "npx",
  // ["@wordpress/create-block", pluginSlug],
  ["@wordpress/create-block", pluginSlug, "--no-wp-scripts"],
  {
    stdin: 'inherit'
  }
);
// ).stdout.pipe(process.stdout);
console.log(createBlockScript.stdout);

console.log("Let's do some post processing now.");

if (argv.b && typeof (argv.b) === 'object') {

  console.log("GOT SOME BLOCK NAMES", argv.b.length);
  if (argv.b.length === 1) {
    console.log("SINGLE BLOCK NAME", argv.b[0]);
    rename(argv.b[0]);
  }

  if (argv.b.length > 1) {
    console.log("MULTIPLE BLOCK NAMES", ...argv.b);
  }

  if (argv.b.length === 0) {
    // Use plugin slug if no block name specified. 
    console.log("NO BLOCK NAME. USING PLUGIN SLUG", pluginSlug);
  }
} else {
  console.log("NO BLOCK NAMES - JUST PROCEED AS NORMAL");
  //pluginSlug = ''; // If no plugin slug then trigger interactive mode for npx @wordpress/create-block
}

// Change directory and do a final rebuild.
const changeDir = await execa(
  'sh',
  ['-c', `cd ${ pluginSlug } && pwd`]
);
console.log("??", changeDir);

// const reRunBuild = await execa(
//   "npm",
//   ["run", "build"]
// );

// ============

async function rename(blockName) {
  
  // 1. Replace block name.
  let options = {
    files: `${pluginSlug}/src/block.json`,
    from: /"name": "(create-block\/{1})(.*)?"/gm,
    to: `"name": "$1${blockName.toLowerCase()}"`,
  };
  
  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    //console.log('Replacement results:', results);
  }
  catch (error) {
    //console.error('Error occurred:', error);
  }

  // 2. Replace block name.
  let regex = new RegExp(`"title": "(${capitalize(pluginSlug)}{1})(.*)?"`, 'gm');
  options = {
    files: `${pluginSlug}/src/block.json`,
    from: regex,
    to: `"title": "${capitalize(blockName)}"`,
  };

  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    //console.log('Replacement results:', results);
  }
  catch (error) {
    //console.error('Error occurred:', error);
  }

  // 3. Replace style.scss selector.
  regex = new RegExp(`.wp-block-create-block-${pluginSlug}`);
  options = {
    files: `${pluginSlug}/src/style.scss`,
    from: regex,
    to: `.wp-block-create-block-${blockName.toLowerCase()}`,
  };

  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    //console.log('Replacement results:', results);
  }
  catch (error) {
    //console.error('Error occurred:', error);
  }

  // 4. Replace editor.scss selector.
  regex = new RegExp(`.wp-block-create-block-${pluginSlug}`);
  options = {
    files: `${pluginSlug}/src/editor.scss`,
    from: regex,
    to: `.wp-block-create-block-${blockName.toLowerCase()}`,
  };

  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    //console.log('Replacement results:', results);
  }
  catch (error) {
    //console.error('Error occurred:', error);
  }

  // 5. Replace block name in index.js.
  regex = new RegExp(`create-block/${pluginSlug}`);
  options = {
    files: `${pluginSlug}/src/index.js`,
    from: regex,
    to: `create-block/${blockName.toLowerCase()}`,
  };

  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    //console.log('Replacement results:', results);
  }
  catch (error) {
    //console.error('Error occurred:', error);
  }

  //const { stdout, stdin, stderr } = await execa("ls");
  //console.log(stdout);
}

/*

- Rename procedure:
  - [done] block.json: update name, title properties.
  - [done] style.scss: update CSS selector.
  - [done] editor.scss: update CSS selector.
  - [done] index.js: update block registration
- Move procedure:
  - Move all scr files into subfolder.
  - Update PHP plugin file with folder name.
  - If more than one block then copy block folder and rename that.

- If -b is an array with length 1 just rename block, no need to add to sub folder.
- If -b is an array with length other than 1 then add to sub folders for each block and rename as you loop through the block names.
- Do another build as some items will have been moved/renamed.

*/

function capitalize(str) {
  const lower = str.toLowerCase();
  return str.charAt(0).toUpperCase() + lower.slice(1);
}
#!/usr/bin/env node
import yargs from "yargs";
import { execa, execaCommand, execaCommandSync } from 'execa';
import { join } from 'path';
import replace from 'replace-in-file';
import { log } from './log.js';

const argv = yargs(process.argv.slice(2))
  .alias('name', 'n')
  .alias('no-wp-scripts', 's')
  .alias('block', 'b')
  .alias('dir', 'd')
  .array('name')
  .array('block')
  .boolean('ns')
  //.default('ns', false)
  //.number('dropbox_base_index')
  .argv;

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

log('\nLet\'s create some blocks! This may take a couple of minutes...');

console.log(`\nCreating a new WordPress plugin with slug: "${pluginSlug}"\n`);

if (argv.b && typeof (argv.b) === 'object') {
  console.log("Creating the following named blocks:", ...argv.b);
  log('\n---');
}
//console.log("\nPassed in args:\n", argv);

const cb = (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
};

const opt = [];
if (argv.s) {
  opt.push('--no-wp-scripts');
}

// log(execaCommandSync(`npx @wordpress/create-block ${pluginSlug}`, { stdin: 'inherit' }).stdout);
log(execaCommandSync(`npx @wordpress/create-block ${pluginSlug} ${opt.join(' ')}`, { stdin: 'inherit' }).stdout);

// await execa(
//   "npx",
//   // ["@wordpress/create-block", pluginSlug],
//   ["@wordpress/create-block", pluginSlug, "--no-wp-scripts"],
//   {
//     stdin: 'inherit'
//   }
// ).stdout.pipe(process.stdout);
//console.log(createBlockScript.stdout);

console.log("\nPost processing...\n");

if (argv.b && typeof (argv.b) === 'object') {

  //console.log("GOT SOME BLOCK NAMES", argv.b.length);
  if (argv.b.length === 1) {
    //console.log("Single block name:", argv.b[0]);
    renameBlockFiles(argv.b[0], `${pluginSlug}/src`, pluginSlug);
  }

  if (argv.b.length > 1) {
    //console.log("Multiple block names:", ...argv.b);

    argv.b.forEach((item, index) => {

      // Handle first block slightly differently (move into folder and rename).
      if (index === 0) {
        // Move block files into a new folder using the block name for the folder.
        log(execaCommandSync(`mkdir ${pluginSlug}/src/${argv.b[index]}`).stdout);
        // log(execaCommandSync(`mkdir ${pluginSlug}/src/${argv.b[index]} -v`).stdout);
        log(execaCommandSync(`mv *.* ${argv.b[index]}`, { cwd: `${pluginSlug}/src` }).stdout);

        // Rename block files.
        renameBlockFiles(argv.b[index], `${pluginSlug}/src/${argv.b[index]}`, pluginSlug);

        // Update PHP block registration code to include the block path.
        renameFirstPhpBlock(argv.b[index], pluginSlug);
      } else {
        // For all other blocks just copy first block folder and rename.

        // Move block files into a new folder using the block name for the folder.
        log(execaCommandSync(`cp -R ${pluginSlug}/src/${argv.b[0]} ${pluginSlug}/src/${argv.b[index]}`).stdout);

        // Rename block files.
        renameBlockFiles(argv.b[index], `${pluginSlug}/src/${argv.b[index]}`, argv.b[0]);

        // Update PHP block registration code to include the block path.
        renamePhpBlock(argv.b[index], pluginSlug);
      }
    });
  }

  if (argv.b.length === 0) {
    // Use plugin slug if no block name specified. 
    //console.log("NO BLOCK NAME. USING PLUGIN SLUG", pluginSlug);
  }
} else {
  //console.log("NO BLOCK NAMES - JUST PROCEED AS NORMAL");
  //pluginSlug = ''; // If no plugin slug then trigger interactive mode for npx @wordpress/create-block
}

// Rebuild plugin files only if '--no-wp-scripts' isn't set.
if (!argv.s) {
  log('\nRebuilding plugin files for production.');
  log(execaCommandSync(`npm run build`, { cwd: `${pluginSlug}` }).stdout);
}

log('\nAll finished. Happy block development!');

// ============

function renameFirstPhpBlock(blockName, path) {

  let options = {
    files: `${path}/${pluginSlug}.php`,
    from: /build/gm,
    to: `build/${blockName.toLowerCase()}`,
  };

  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    //console.log('Replacement results:', results);
  }
  catch (error) {
    //console.error('Error occurred:', error);
  }
}

function renamePhpBlock(blockName, path) {

  let options = {
    files: `${path}/${pluginSlug}.php`,
    from: /^}/gm,
    to: `	register_block_type( __DIR__ . '/build/${blockName}' );\n}`,
  };

  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    //console.log('Replacement results:', results);
  }
  catch (error) {
    //console.error('Error occurred:', error);
  }
}

function renameBlockFiles(blockName, path, replaceStr) {

  // 1. Replace block name.
  let options = {
    files: `${path}/block.json`,
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

  // 2. Replace block title.
  let regex = new RegExp(`"title": "(${capitalize(replaceStr)}{1})(.*)?"`, 'gm');
  options = {
    files: `${path}/block.json`,
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
  regex = new RegExp(`.wp-block-create-block-${replaceStr}`);
  options = {
    files: `${path}/style.scss`,
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
  regex = new RegExp(`.wp-block-create-block-${replaceStr}`);
  options = {
    files: `${path}/editor.scss`,
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
  regex = new RegExp(`create-block/${replaceStr}`);
  options = {
    files: `${path}/index.js`,
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

function capitalize(str) {
  const lower = str.toLowerCase();
  return str.charAt(0).toUpperCase() + lower.slice(1);
}
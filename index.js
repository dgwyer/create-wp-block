#!/usr/bin/env node
import yargs from "yargs";
import { execa, execaCommand, execaCommandSync } from 'execa';
import { join } from 'path';
import replace from 'replace-in-file';
import { log } from './log.js';
import { readFile } from 'fs/promises';

const argv = yargs(process.argv.slice(2))
  .alias('name', 'n')
  .alias('namespace', 'nsp')
  //.alias('no-wp-scripts', 's')
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

const json = JSON.parse(
  await readFile(
    new URL('./package.json', import.meta.url)
  )
);
log('\nVersion: ' + json.version);
log('\nBy David Gwyer');
log('\nLet\'s create some blocks!');

log('\n---');

console.log(`\nCreating a new WordPress plugin with slug: ${pluginSlug}`);

if (argv.b && typeof (argv.b) === 'object') {
  console.log("\nCreating the following named blocks:", argv.b.join(', '));
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
if (argv.ns) {
  opt.push('--no-wp-scripts');
}
if (argv.tw) {
  opt.push('-t tw-block');
}
if (argv.nsp) {
  opt.push(`--namespace ${argv.nsp}`);
}

//opt.push(`--title ${pluginSlug}`);

log('\nBlock options: ' + opt.join(' '));

// log(execaCommandSync(`npx @wordpress/create-block ${pluginSlug}`, { stdin: 'inherit' }).stdout);
log(`\nRunning package: npx @wordpress/create-block ${pluginSlug} ${opt.join(' ')}`);
log('\n---');

const subprocess = execaCommand(`npx @wordpress/create-block ${pluginSlug} ${opt.join(' ')}`);
subprocess.stdout.pipe(process.stdout);
const { stdout } = await subprocess;
console.log('\n', stdout);

// log(execaCommandSync(`npx @wordpress/create-block ${pluginSlug} ${opt.join(' ')}`, { shell: true, stdin: 'inherit' }).stdout);

// await execa(
//   "npx",
//   // ["@wordpress/create-block", pluginSlug],
//   ["@wordpress/create-block", pluginSlug, "--no-wp-scripts"],
//   {
//     stdin: 'inherit'
//   }
// ).stdout.pipe(process.stdout);
//console.log(createBlockScript.stdout);

console.log("\nPost processing...");

if (argv.b && typeof (argv.b) === 'object') {

  if (argv.b.length === 1) {
    console.log("Single block name:", argv.b[0]);
    renameBlockFiles(argv.b[0], `${pluginSlug}/src`, pluginSlug);
  }

  if (argv.b.length > 1) {
    console.log("\nInstalling blocks:", ...argv.b);

    argv.b.forEach((item, index) => {

      // Handle first block slightly differently (move into folder and rename).
      if (index === 0) {
        // Move block files into a new folder using the block name for the folder.
        execaCommandSync(`mkdir ${pluginSlug}/src/${argv.b[index]}`);
        // log(execaCommandSync(`mkdir ${pluginSlug}/src/${argv.b[index]} -v`).stdout);
        execaCommandSync(`mv *.* ${argv.b[index]}`, { cwd: `${pluginSlug}/src` });

        // Rename block files.
        renameBlockFiles(argv.b[index], `${pluginSlug}/src/${argv.b[index]}`, pluginSlug);

        // Update PHP block registration code to include the block path.
        renameFirstPhpBlock(argv.b[index], pluginSlug);
      } else {
        // For all other blocks just copy first block folder and rename.

        // Copy the first block folder to a new folder using the current block name for the folder.
        execaCommandSync(`cp -R ${pluginSlug}/src/${argv.b[0]} ${pluginSlug}/src/${argv.b[index]}`);

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
if (!argv.ns) {
  log('\nRebuilding plugin files for production.');
  log(execaCommandSync(`npm run build`, { cwd: `${pluginSlug}`, stdin: 'inherit' }).stdout);
}

log('\nAll finished. Happy block development!');
log('\nFollow me on Twitter: dgwyer');

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
    from: new RegExp(`"name": "(create-block\/{1})(.*)?"`, 'gm'),
    to: `"name": "$1${blockName.toLowerCase()}"`,
  };
  replaceSync(options);

  // 2. Replace block title.
  //console.log(`DEBUGGING: ${path}/block.json >> ${capitalize(replaceStr)} >> ${blockName}`);
  options = {
    files: `${path}/block.json`,
    from: new RegExp(`"title": "(.*?)"`, 'gm'),
    to: `"title": "${capitalize(blockName)}"`,
  };
  replaceSync(options);

  // 3. Replace style.scss selector.
  options = {
    files: `${path}/style.scss`,
    from: new RegExp(`.wp-block-create-block-${replaceStr}`),
    to: `.wp-block-create-block-${blockName.toLowerCase()}`,
  };
  replaceSync(options);

  // 4. Replace editor.scss selector.
  options = {
    files: `${path}/editor.scss`,
    from: new RegExp(`.wp-block-create-block-${replaceStr}`),
    to: `.wp-block-create-block-${blockName.toLowerCase()}`,
  };
  replaceSync(options);

  // 5. Replace block name in index.js.
  options = {
    files: `${path}/index.js`,
    from: new RegExp(`create-block/${replaceStr}`),
    to: `create-block/${blockName.toLowerCase()}`,
  };
  replaceSync(options);

  // 6. Replace block name in tailwind.config.js, only if we're integrating with Tailwind CSS.
  if (argv.tw) {
    options = {
      files: `${path}/tailwind.config.js`,
      from: /content: \[(.*?)\]/gm,
      to: `content: ['./src/${blockName.toLowerCase()}/*.js']`,
    };
    replaceSync(options);
  }

  //const { stdout, stdin, stderr } = await execa("ls");
  //console.log(stdout);
}

function capitalize(str) {
  const lower = str.toLowerCase();
  return str.charAt(0).toUpperCase() + lower.slice(1);
}

function replaceSync(options, log = false) {
  // Synchronous replacement.
  try {
    const results = replace.sync(options);
    if(log) { console.log('Replacement results:', results); }
  }
  catch (error) {
    if (log) { console.error('Error occurred:', error); }
  }
}
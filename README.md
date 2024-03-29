# Create Single or Multiple WordPress Blocks

Extends the WordPress core `@wordpress/create-block` package that creates a new block plugin. It's basically a thin wrapper around the core CLI which allows us to expose some new features right now until they're officially available, such as:

- Single named blocks.
- Multiple named blocks.
- Full Tailwind CSS integration.

The `create-wp-blocks` script is meant to be a useful tool to create blocks with additional functionality currently available in `@wordpress/create-block`. Hopefully, over time, most (or all) of these extra features will be available in the core package and this one can be deprecated.
## New functionality
Specify a block name via the `--block` (or `-b` alias). By default in `@wordpress/create-block` there's no way to name a block, it's always set to the name of the plugin slug. e.g. `npx create-wp-block test -b block1`.

Note, if the block name is specified but a plugin name (slug) is, then this will trigger interactive mode which is the default behaviour of `@wordpress/create-block` when no slug is specified.

Optional Tailwind CSS integration is now available via the `--tw` flag.

# Usage

To create a basic plugin containing a single block:

`npx create-wp-block todo-list`

**Note: This produces exactly the same plugin as `npx @wordpress/create-block todo-list`**

Things become interesting when we use the new features:

`npx create-wp-block todo-list -b block1`

This will create a plugin with the slug `todo-list`, which contains a single block with the slug `block1`.

Create multiple blocks with:

`npx create-wp-block todo-list -b block1 block2 block3`

This will create a plugin with the slug `todo-list`, which contains three blocks with slugs: `block1`, `block2`, `block3`. Each block is located inside its own sub-folder. e.g. `/src/block1/`.

Enable full Tailwind integration with the `--tw` option:

`npx create-wp-block todo-list -b block1 block2 block3 --tw`

Each block compiles its own Tailwind styles, which is inline with how blocks are compiled with `@wordpress/create-block`. Blocks continue to maintain their own styles independently.

For quick testing you can disable wp-scripts with the `--ns` option:

`npx create-wp-block todo-list -b block1 block2 block3 --ns`

This doesn't install npm modules and creates the block plugin much quicker. However, you'll need to manually run `npm install` to do an initial build of the plugin block JavaScript code.

# Trouble Shooting

If no named blocks are specified then the plugin slug will be used as a fallback.

There will probably be regular updates to this CLI as it's refined and new features are added. Sometimes `npx` will cache the version of the script which can be annoying. To make sure you're always running the latest release version you can add `@latest`. e.g. `npx create-wp-block@latest myplugin -b one`.

For now (at least) there's no interactive mode if a plugin slug is not specified. This is required or the script will exit with a warning message. You're required to enter a plugin slug.
# Request a Feature?

Are you looking for a feature to be included in this package? Simply open a [new issue](https://github.com/dgwyer/create-wp-block/issues) and let's talk! All suggestions welcome.

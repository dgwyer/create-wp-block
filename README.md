# Create Single or Multiple WordPress Blocks

Extends the WordPress core `@wordpress/create-block` package that creates a new block plugin.

This npm package is meant to be a useful tool to create blocks with additional functionality currently available in `@wordpress/create-block`. Hopefully, over time, most or all of these extra features will be available in the core package.
## New functionality
- Specify a block name via the --name (or -n alias). By default in `@wordpress/create-block` there is no way to name a block, it's always set to the name of the plugin slug. e.g. npx create-wp-block test -n block1. Note, if the block name is specified but a plugin name (slug) is, then this will trigger interactive mode which is the default behaviour of `@wordpress/create-block` when no slug is specified.

# Usage

To create a basic plugin containing a single block:

`npx create-wp-block todo-list`

Note: This produces exactly the same plugin as `npx @wordpress/create-block todo-list`

Things become interesting when we use the new features:

`npx create-wp-block todo-list -n block1`

This will create a plugin with the slug `todo-list`, which contains a single block with the slug `block1`.

# Request a Feature?

Are you looking for a feature to be included in this package? Simply open a [new issue](https://github.com/dgwyer/create-wp-block/issues) and let's talk! All suggestions welcome.
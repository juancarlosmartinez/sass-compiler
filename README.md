[npm-image]: https://img.shields.io/npm/v/node-sass-compiler.svg
[npm-url]: https://npmjs.com/package/node-sass-compiler
[downloads-image]: https://img.shields.io/npm/dm/node-sass-compiler.svg
[downloads-url]: https://npmjs.com/package/node-sass-compiler
[node-version-image]: https://img.shields.io/node/v/node-sass-compiler.svg
[node-version-url]: https://nodejs.org/en/download
[license-image]: https://img.shields.io/npm/l/node-sass-compiler.svg?maxAge=2592000
[license-url]: https://github.com/juancarlosmartinez/sass-compiler/blob/master/LICENSE

# sass-compiler

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![License][license-image]][license-url]

> A compiler for scss and sass files to css

## Installation
Install the package using npm or yarn as a dev dependency.

### NPM
```bash
npm install --save-dev node-sass-compiler
```

### Yarn
```bash
yarn add --dev node-sass-compiler
```

## Basic usage

```bash
sass-compiler
```
This command will compile all the scss and sass files in the `.` directory and will output the css files in the same directory.

For customize the input and output directories you must create a `sass-compiler.config.js` file in the root of your project.

```javascript
module.exports = {
    entries: [
        {
            baseDir: './src/app/scss',
            outputDir: './src/app/css',
        }
    ]
}
```

It replies the directory structure of the `baseDir` directory in the `outputDir` directory.

You can create multiple entries to compile multiple directories.

## Development
If you don't want to run the command every time you make a change in the scss files, you can use the `--watch` flag.

```bash
sass-compiler --watch
```

## Options
- `--watch`: Watch the files for changes and recompile them on the fly.
- `--config`: Specify the path to the configuration file. By default, it will look for a `sass-compiler.config.js` file in the root of your project.
- `--verbose`: Show more information about the compilation process.
- `--version` or `-v`: Show the version of the package.
- `--help` or `-h`: Show the help message.

## Author
Juan Carlos Martínez - [juancarlosmartinez](https://github.com/juancarlosmartinez)

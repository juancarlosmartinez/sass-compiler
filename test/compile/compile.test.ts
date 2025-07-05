import {Compiler} from "../../src/compile/compile";
import {exists} from "../../src/util/fs";
import {unlink, rm, writeFile, mkdir} from "node:fs/promises";
import {Log} from "../../src/util/log";

const scssContent = `
    body {
      .my-class {
        color: #000000;
      }
    }
`;

const scssContentChanged = `
    body {
      .my-class {
        color: #ffffff;
      }
    }
`;

describe('Compiler', () => {

    beforeEach(async () => {
        Log.init({
            verbose: true
        });
        await mkdir('test/compile/scss', {
            recursive: true
        });
        await writeFile('test/compile/scss/test.scss', scssContent);
    });

    it('should build a new instance of Compiler', async () => {
        const compiler = Compiler.build();

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(compiler).toBeInstanceOf(Compiler);

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await unlink('test/compile/scss/test.scss');

        expect(await exists('test/compile/scss//test.scss')).toBe(false);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(await exists('test/compile/css/v1/test.css')).toBe(false);

        await compiler.stop();
    });

    it('should build a new instance of Compiler with watch option', async () => {
        const compiler = Compiler.build({
            watch: true
        });

        expect(compiler).toBeInstanceOf(Compiler);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await unlink('test/compile/scss/test.scss');

        expect(await exists('test/compile/scss/test.scss')).toBe(false);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await compiler.stop();
    });

    it('should change css on change scss file', async () => {
        const compiler = Compiler.build({
            watch: true
        });

        expect(compiler).toBeInstanceOf(Compiler);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await writeFile('test/compile/scss/test.scss', scssContentChanged);

        expect(await exists('test/compile/scss/test.scss')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await compiler.stop();
    });

    it('should change css on change scss file minified', async () => {
        const compiler = Compiler.build({
            watch: true
        });

        expect(compiler).toBeInstanceOf(Compiler);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/,
                minify: true,
                sourceMap: false
            }]
        });

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await writeFile('test/compile/scss/test.scss', scssContentChanged);

        expect(await exists('test/compile/scss/test.scss')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await compiler.stop();
    });

    it('should delete css on delete scss file', async () => {
        const compiler = Compiler.build({
            watch: true
        });

        expect(compiler).toBeInstanceOf(Compiler);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await rm('test/compile/scss/test.scss', {
            force: true,
            recursive: true
        });

        expect(await exists('test/compile/scss/test.scss')).toBe(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(await exists('test/compile/css/v1/test.css')).toBe(false);

        await compiler.stop();
    });

    it('should delete css dir on delete scss dir', async () => {
        const compiler = Compiler.build({
            watch: true
        });

        await mkdir('test/compile/scss/src', {
            recursive: true
        });

        expect(compiler).toBeInstanceOf(Compiler);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        await writeFile('test/compile/scss/src/test.scss', scssContentChanged);

        await new Promise(resolve => setTimeout(resolve, 1000));

        expect(await exists('test/compile/css/v1/test.css')).toBe(true);
        expect(await exists('test/compile/css/v1/src/test.css')).toBe(true);

        await rm('test/compile/scss/src', {
            force: true,
            recursive: true
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        expect(await exists('test/compile/scss/src')).toBe(false);

        await compiler.stop();
    });

    it('should delete css dir on delete scss dir', async () => {
        await mkdir('test/compile/css/v1/src', {
            recursive: true
        });

        await Promise.all([
            writeFile('test/compile/css/v1/test.css', 'body { color: #000000; }'),
            writeFile('test/compile/css/v1/src/test.css', 'body { color: #000000; }')
        ]);

        expect(await exists('test/compile/css/v1/test.css')).toBe(true);
        expect(await exists('test/compile/css/v1/src/test.css')).toBe(true);
        expect(await exists('test/compile/scss/src/test.scss')).toBe(false);

        const compiler = Compiler.build();

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        await compiler.stop();

        expect(await exists('test/compile/css/v1/test.css')).toBe(true);
        expect(await exists('test/compile/css/v1/src/test.css')).toBe(false);
        expect(await exists('test/compile/css/v1/src')).toBe(false);
        expect(await exists('test/compile/scss/src/test.scss')).toBe(false);
    });

    it('should generate css files with custom output filename', async () => {
        const compiler = Compiler.build();

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }],
            output: {
                filename: '[name].[hash].css'
            }
        });

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.704c8bb7.css')).toBe(true);

    });

    afterEach(async () => {
        await Promise.all([
            rm('test/compile/scss', {
                recursive: true,
                force: true
            }),
            rm('test/compile/css', {
                recursive: true,
                force: true
            })
        ]);
    });
});
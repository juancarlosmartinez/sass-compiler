import {Compiler} from "../../src/compile/compile";
import {exists} from "../../src/util/fs";
import {unlink, rm, writeFile, mkdir, readFile} from "node:fs/promises";
import {Log} from "../../src/util/log";

const scssContent = `
    body {
      .my-class {
        color: #000000;
      }
    }
`;


describe('Compiler', () => {

    beforeEach(async () => {
        Log.init({
            verbose: true
        });
        await mkdir('test/compile/scss/2nd/3rd', {
            recursive: true
        });
        await writeFile('test/compile/scss/test.scss', scssContent);
        await writeFile('test/compile/scss/2nd/test.scss', scssContent);
        await writeFile('test/compile/scss/2nd/3rd/test.scss', scssContent);

    });


    it('should generate css files with custom output filename', async () => {
        const compiler = Compiler.build({
            watch: true,
        });

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }],
            output: {
                filename: '[name].[hash].css',
                manifest: {
                    path: 'test/compile'
                }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));


        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.44bd709f.css')).toBe(true);
        expect(await exists('test/compile/css/v1/2nd')).toBe(true);
        expect(await exists('test/compile/css/v1/2nd/test.44bd709f.css')).toBe(true);
        expect(await exists('test/compile/css/v1/2nd/3rd')).toBe(true);
        expect(await exists('test/compile/css/v1/2nd/3rd/test.44bd709f.css')).toBe(true);

        expect(await exists('test/compile/manifest.json')).toBe(true);

        let manifestContent = JSON.parse(await readFile('test/compile/manifest.json').then(buffer => buffer.toString()));

        expect(manifestContent['test/compile/scss/test']).toBe('test/compile/css/v1/test.44bd709f.css');
        expect(manifestContent['test/compile/scss/2nd/test']).toBe('test/compile/css/v1/2nd/test.44bd709f.css');
        expect(manifestContent['test/compile/scss/2nd/3rd/test']).toBe('test/compile/css/v1/2nd/3rd/test.44bd709f.css');

        await unlink('test/compile/scss/test.scss');

        await new Promise(resolve => setTimeout(resolve, 1000));

        expect(await exists('test/compile/scss/test.scss')).toBe(false);
        expect(await exists('test/compile/css/v1/test.44bd709f.css')).toBe(false);

        manifestContent = JSON.parse(await readFile('test/compile/manifest.json').then(buffer => buffer.toString()));
        expect(manifestContent['test/compile/scss/test']).toBe(undefined);
        expect(manifestContent['test/compile/scss/2nd/test']).toBe('test/compile/css/v1/2nd/test.44bd709f.css');
        expect(manifestContent['test/compile/scss/2nd/3rd/test']).toBe('test/compile/css/v1/2nd/3rd/test.44bd709f.css');

        await compiler.stop();
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
            }),
            unlink('test/compile/manifest.json').catch(() => {
                // Ignore if file does not exist
            }),
            unlink('test/compile/manifest.json.lock').catch(() => {
                // Ignore if file does not exist
            })
        ]);
    });
});
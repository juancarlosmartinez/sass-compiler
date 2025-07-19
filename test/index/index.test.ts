import {mkdir, rm, writeFile} from "node:fs/promises";
import {spawn} from "node:child_process";

const scssContent = `
    body {
      .my-class {
        color: #000000;
      }
    }
`;

describe('Main Compiler', () => {

    beforeEach(async () => {
        await mkdir('test/index/scss', {
            recursive: true
        });
        await writeFile('test/index/scss/test.scss', scssContent);
    })

    it('should init compiler', async () => {
        const originalArgv = process.argv;
        process.argv = [
            'node',
            'script.js',
            '--config=test/index/config.js',
            '--verbose'
        ];

        await import('../../src/index');
        await new Promise(resolve => setTimeout(resolve, 1000));

        process.argv = originalArgv
    });

    afterEach(async () => {
        await Promise.all([
            rm('test/index/scss', {
                recursive: true,
                force: true
            }),
            rm('test/index/css', {
                recursive: true,
                force: true
            })
        ]);
    });
});
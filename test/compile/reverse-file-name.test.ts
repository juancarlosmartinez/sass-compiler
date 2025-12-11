import {EntryCompiler} from "../../src/compile/entry-compiler";

describe('buildReverseOutputFileName', () => {


    it('devuelve el nombre .scss cuando el filename es simple', async () => {
        const entries = [{
            baseDir: 'test/compile/scss',
            outputConfig: {
                directory: 'test/compile/css/v1',
                filename: '[name].css'
            },
            filenames: /\.s[ca]ss$/
        }];

        const entry = EntryCompiler.build(entries[0]);

        expect(entry['getBaseName']('archivo.css', '.css')).toBe('archivo');
    });

    it('devuelve el nombre .scss cuando el filename es con hash', async () => {
        const entries = [{
            baseDir: 'test/compile/scss',
            outputConfig: {
                directory: 'test/compile/css/v1',
                filename: '[name].[hash].css'
            },
            filenames: /\.s[ca]ss$/
        }];

        const entry = EntryCompiler.build(entries[0]);

        expect(entry['getBaseName']('archivo.123456.css', '.css')).toBe('archivo');
    });
});
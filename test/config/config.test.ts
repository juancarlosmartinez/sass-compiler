import {loader} from "../../src/config/config";
import {Log} from "../../src/util/log";

describe("Tests for compiler configuration", () => {

    beforeEach(() => {
        Log.init({});
    });

    it('should load the default configuration', async () => {
        const config = await loader({});

        expect(config.entries.length).toBe(1);
        expect(config.entries[0].baseDir).toBe('.');
        expect(config.entries[0].outputDir).toBe('.');
        expect(config.entries[0].filenames.source).toBe('^[a-zA-Z].+\\.(scss|sass)$');
    });

    it('should load the empty user configuration', async () => {
        const config = await loader({
            config: 'test/config/test-config.js'
        });

        expect(config.entries.length).toBe(1);
        expect(config.entries[0].baseDir).toBe('.');
        expect(config.entries[0].outputDir).toBe('.');
        expect(config.entries[0].filenames.source).toBe('^[a-zA-Z].+\\.(scss|sass)$');
    });

    it('should load the user configuration with an empty entry array', async () => {
        const config = await loader({
            config: 'test/config/test-config-2.js'
        });

        expect(config.entries.length).toBe(1);
        expect(config.entries[0].baseDir).toBe('.');
        expect(config.entries[0].outputDir).toBe('.');
        expect(config.entries[0].filenames.source).toBe('^[a-zA-Z].+\\.(scss|sass)$');
    });

    it('should load the user configuration with few entries', async () => {
        const config = await loader({
            config: 'test/config/test-config-3.js'
        });

        expect(config.entries.sort().length).toBe(3);

        expect(config.entries[0].baseDir).toBe('test/fixtures');
        expect(config.entries[0].outputDir).toBe('test/fixtures');
        expect(config.entries[0].filenames.source).toBe('^[a-zA-Z].+\\.(scss|sass)$');

        expect(config.entries[1].baseDir).toBe('.');
        expect(config.entries[1].outputDir).toBe('test/css');
        expect(config.entries[1].filenames.source).toBe('^[a-zA-Z].+\\.(scss|sass)$');

        expect(config.entries[2].baseDir).toBe('test/fixtures');
        expect(config.entries[2].outputDir).toBe('test/css');
        expect(config.entries[2].filenames.source).toBe('^[A-Z].+\\.(scss|sass)$');
    });

    it('should fail to load the user configuration with invalid entry', async () => {
        const config = loader({
            config: 'test/config/test-config-4.js'
        }).catch(err => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe(`Configuration file not found: test/config/test-config-4.js`);
        });
    });
});
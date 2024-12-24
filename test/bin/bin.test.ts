import { build } from 'esbuild';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import {copyFile, access, mkdtemp, rm} from "node:fs/promises";
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from "node:child_process";

let tmpDir: string;
let executable: string;

beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'sass-compiler'));
    executable = path.join(tmpDir, 'index.js');
    await Promise.all([
        build({
            entryPoints: [path.join(__dirname, '..', '..', 'src', "index.ts")],
            platform: 'node',
            bundle: true,
            outfile: executable,
        }),
        copyFile(path.join(__dirname, 'sass-compiler.config.js'), path.join(tmpDir, 'sass-compiler.config.js')),
        copyFile(path.join(__dirname, 'test.scss'), path.join(tmpDir, 'test.scss')),
        copyFile(path.join(__dirname, '..', '..', 'package.json'), path.join(tmpDir, 'package.json')),
    ])
})

describe("Compile", () => {
    it("should compile", async () => {
        const code = await run();
        expect(code).toBe(0);

        const existsCSSFile = await access(path.join(tmpDir, 'test.css'), fs.constants.F_OK).then(() => true).catch(() => false);
        expect(existsCSSFile).toBe(true);
    });

    it("should delete css file - watch", async () => {
        const child = await run({
            watch: true
        }) as ChildProcess;

        await new Promise(resolve => setTimeout(resolve, 1000));

        const cssPath = path.join(tmpDir, 'test.css');
        const scssPath = path.join(tmpDir, 'test.scss');

        const existsCSSFile = await access(cssPath, fs.constants.F_OK).then(() => true).catch(() => false);
        expect(existsCSSFile).toBe(true);

        expect(fs.existsSync(scssPath)).toBe(true);
        fs.unlinkSync(scssPath);
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(fs.existsSync(scssPath)).toBe(false);
        expect(fs.existsSync(cssPath)).toBe(false);

        child.kill();
    });

    it("should delete css file - initial", async () => {
        const code = await run();
        expect(code).toBe(0);

        const existsCSSFile = await access(path.join(tmpDir, 'test.css'), fs.constants.F_OK).then(() => true).catch(() => false);
        expect(existsCSSFile).toBe(true);

        fs.unlinkSync(path.join(tmpDir, 'test.scss'));

        const code2 = await run();
        expect(code2).toBe(0);

        const existsCSSFile2 = await access(path.join(tmpDir, 'test.css'), fs.constants.F_OK).then(() => true).catch(() => false);
        expect(existsCSSFile2).toBe(false);
    });
});

const run = ({watch}: {watch?: boolean} = {}): Promise<ChildProcessWithoutNullStreams|number> => {

    const nodeArgs = [executable];

    if (watch) {
        nodeArgs.push('--watch');
    }

    const child = spawn("node", nodeArgs, {
        cwd: tmpDir
    });

    return new Promise(resolve  => {

        child.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        child.stdout.on('error', (data) => {
            console.log(data.toString());
        });

        if (watch) {
            resolve(child);
        } else {
            child.on('exit', (code) => {
                resolve(code!);
            });
        }
    });
}


afterAll(async () => {
    await rm(tmpDir, {
        force: true,
        recursive: true
    });
});
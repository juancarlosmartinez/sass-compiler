import { build } from 'esbuild';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import {copyFile, access} from "node:fs/promises";
import {spawn} from "node:child_process";

let tmpDir: string;
let executable: string;

beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sass-compiler'));
    executable = path.join(tmpDir, 'index.js');
    await Promise.all([
        build({
            entryPoints: [path.join(__dirname, '..', '..', 'src', "index.ts")],
            platform: 'node',
            bundle: true,
            outfile: executable,
        }),
        copyFile(path.join(__dirname, 'sass-compiler.config.js'), path.join(tmpDir, 'sass-compiler.config.js')),
        copyFile(path.join(__dirname, 'test.scss'), path.join(tmpDir, 'test.scss'))
    ])
})

const run = () => {
    const child = spawn("node", [executable], {
        cwd: tmpDir
    });
    return new Promise((resolve: Function) => {

        child.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        child.stdout.on('error', (data) => {
            console.log(data.toString());
        });
        child.on('exit', (code) => {
            resolve(code);
        });
    });
}

describe("Compile", () => {
    it("should compile", async () => {
        const code = await run();
        expect(code).toBe(0);

        // const css = fs.readFileSync(path.join(__dirname, 'test.css')).toString();
        console.log(path.join(tmpDir, 'test.css'));
        const existsCSSFile = await access(path.join(tmpDir, 'test.css'), fs.constants.F_OK).then(() => true).catch(() => false);
        expect(existsCSSFile).toBe(true);
    });
});


afterAll(async () => {
    fs.rmSync(tmpDir, {recursive: true});
});
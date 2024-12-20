import sass from "sass";
import fs from "node:fs";
import {mkdir, readdir} from "node:fs/promises";
import path from "node:path";
import {exists, isDir, writeFile} from "./util/fs";

interface SassCompilerConfig {
    entries: CompileEntry[];
}

interface CompileEntry {
    baseDir: string;
    outputDir: string;
}

const loadConfig = async (): Promise<SassCompilerConfig> => {
    const configPath = path.join(__dirname, 'sass-compiler.config.js');
    if (!await exists(configPath)) {
        return Promise.reject(new Error('Configuration file not found'));
    }
    return require(configPath);
}

const processEntry = async (entry: CompileEntry): Promise<void> => {
    try {
        const baseDir = `${__dirname}/${entry.baseDir}`;
        const outputDir = `${__dirname}/${entry.outputDir}`;
        if (!await isDir(baseDir)) {
            return Promise.reject(new Error(`Base directory ${baseDir} not found`));
        }
        if (!await isDir(outputDir)) {
            await mkdir(outputDir, {
                recursive: true
            });
        }

        await processDir(baseDir, outputDir).catch(() => {
            return Promise.reject(new Error(`Error processing directory ${entry.baseDir}`));
        });
    } catch (e) {
        console.error(`Error processing entry ${entry.baseDir}`, e);
    }

}

const processDir = async (dir: string, outputDir: string): Promise<void> => {
    const files = await readdir(dir);
    await Promise.all(files.map(async (file) => {
        const fullPath = path.join(dir, file);
        if (await isDir(fullPath)) {
            await processDir(fullPath, path.join(outputDir, file));
        } else {
            await processFile(fullPath);
        }
    }));
}

const processFile = async (file: string): Promise<void> => {
    const ext = path.extname(file);
    if (ext === '.scss' || ext === '.sass') {
        const {css} = sass.compile(file);
        const outFile = file.replace(ext, '.css');
        await writeFile(outFile, css);
    }
}

const main = async (): Promise<void> => {

    // Load configuration file
    const config = await loadConfig();

    // Compile all entries
    await Promise.all(config.entries.map(processEntry));
}

main().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
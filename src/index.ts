import sass from "sass";
import {mkdir, readdir} from "node:fs/promises";
import path from "node:path";
import {exists, isDir, writeFile} from "./util/fs";
import yargs from 'yargs';
import {hideBin} from "yargs/helpers";

interface SassCompilerConfig {
    entries: CompileEntry[];
}

interface CompileEntry {
    baseDir: string;
    outputDir: string;
}

const loadConfig = async (): Promise<SassCompilerConfig> => {
    const configPath = path.join(process.cwd(), 'sass-compiler.config.js');
    if (!await exists(configPath)) {
        return Promise.reject(new Error('Configuration file not found'));
    }
    return require(configPath);
}

const processEntry = async (entry: CompileEntry): Promise<void> => {
    try {
        const baseDir = `${process.cwd()}/${entry.baseDir}`;
        const outputDir = `${process.cwd()}/${entry.outputDir}`;
        if (!await exists(baseDir) && !await isDir(baseDir)) {
            return Promise.reject(new Error(`Base directory ${baseDir} not found`));
        }
        if (!await exists(outputDir)) {
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
            await processFile(fullPath, outputDir);
        }
    }));
}

const processFile = async (file: string, outputDir: string): Promise<void> => {
    const ext = path.extname(file);
    if (ext === '.scss' || ext === '.sass') {
        const filename = path.basename(file);
        const {css} = sass.compile(file);
        const outFile = path.join(outputDir, filename.replace(ext, '.css'));
        await writeFile(outFile, css);
    }
}

const main = async (): Promise<void> => {

    // Load configuration file
    const config = await loadConfig();

    // Compile all entries
    await Promise.all(config.entries.map(processEntry));
}


const args = yargs(hideBin(process.argv)).parseSync();

console.log(args.argv);


main().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
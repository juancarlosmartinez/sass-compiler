import path from "node:path";
import {mkdir, readdir, unlink} from "node:fs/promises";

import chokidar from "chokidar";
import sass from "sass";

import {log} from "../util/log";
import {exists, isDir, writeFile} from "../util/fs";
import {CompileEntry} from "../config/config";
import {CompilerOptions} from "../options/options";

export class EntryCompiler {
    /* STATIC */
    public static build(entry: CompileEntry, options?: CompilerOptions): EntryCompiler {
        return new EntryCompiler(entry, options);
    }

    /* INSTANCE */
    private readonly baseDir: string;
    private readonly outputDir: string;
    private readonly filenames: RegExp;
    private constructor(entry: CompileEntry, private readonly options?: CompilerOptions) {
        this.baseDir = entry.baseDir;
        this.outputDir = entry.outputDir;
        this.filenames = entry.filenames;
    }

    private matchFile(file: string): boolean {
        return this.filenames.test(file);
    }

    public async compile(): Promise<void> {
        const baseDir = path.join(process.cwd(), this.baseDir);
        const outputDir = path.join(process.cwd(), this.outputDir);

        if (!await exists(baseDir) && !await isDir(baseDir)) {
            return Promise.reject(new Error(`Base directory ${baseDir} not found`));
        }
        if (!await exists(outputDir)) {
            await mkdir(outputDir, {
                recursive: true
            });
        }

        if (this.options?.watch) {
            console.log(`Watching directory ${baseDir}...`);
            chokidar.watch(baseDir, {
                ignored: (file, _stats) => !!_stats && _stats.isFile() && !this.matchFile(path.basename(file)),
                persistent: true,
                interval: 100,
                depth: 10,
            }).on('all', async (event, watchPath) => {
                log(`File ${watchPath} has been ${event}`);
                switch (event) {
                    case 'add':
                    case 'change':
                    case 'unlink':
                        await this.processDirs(baseDir, outputDir).catch(() => {
                            return Promise.reject(new Error(`Error processing directory ${this.baseDir}`));
                        });
                        break;
                }
            });
        }

        await this.processDirs(baseDir, outputDir).catch(() => {
            return Promise.reject(new Error(`Error processing directory ${this.baseDir}`));
        });
    }

    /**
     * Process directories recursively.
     * @param inputDir The input directory
     * @param outputDir The output directory
     * @private
     */
    private async processDirs(inputDir: string, outputDir: string): Promise<void> {
        await this.processOutputDir(inputDir, outputDir);
        await this.processDir(inputDir, outputDir);
    }

    /**
     * Process a directory and compile all files in it.
     * @param dir The directory to process
     * @param outputDir The output directory
     * @private
     */
    private async processDir(dir: string, outputDir: string): Promise<void> {
        const files = await readdir(dir);
        await Promise.all(files.map(async (file) => {
            const fullPath = path.join(dir, file);
            if (await isDir(fullPath)) {
                await this.processDir(fullPath, path.join(outputDir, file));
            } else {
                await this.processFile(fullPath, outputDir);
            }
        }));
    }

    /**
     * Process the output directory and remove all CSS files that don't have a corresponding SCSS file.
     * @param inputDir The input directory
     * @param outputDir The output directory
     * @private
     */
    private async processOutputDir(inputDir: string, outputDir: string): Promise<void> {
        if (await exists(outputDir)) {
            const files = await readdir(outputDir);
            await Promise.all(files.map(async (file) => {
                const fullPath = path.join(outputDir, file);
                if (await isDir(fullPath)) {
                    await this.processOutputDir(path.join(inputDir, file), fullPath);
                } else if (file.endsWith('.css')){
                    // Check if the corresponding source file exists or not and delete the CSS file if it doesn't.
                    const inputFiles = await readdir(inputDir);
                    const cssBaseName = path.basename(file, '.css');
                    const exists = inputFiles.find(inputFile => {
                        const baseName = path.basename(inputFile);
                        return baseName == cssBaseName && this.matchFile(baseName);
                    });
                    if (!exists) {
                        await unlink(fullPath).catch(err => {
                            console.error(`Error deleting file ${fullPath}: ${err}`);
                        });
                    }
                }
            }));
        }
    }

    /**
     * Process a file and compile it to CSS.
     * @param file The file path to process
     * @param outputDir The output directory
     * @private
     */
    private async processFile(file: string, outputDir: string): Promise<void> {
        if (this.matchFile(path.basename(file))) {
            const ext = path.extname(file);
            const filename = path.basename(file);
            try {
                const {css} = sass.compile(file);
                console.log(`Compiled successfully: ${file}`);
                const outFile = path.join(outputDir, filename.replace(ext, '.css'));
                await writeFile(outFile, css);
            } catch (e) {
                console.error(e);
            }
        }
    }

}
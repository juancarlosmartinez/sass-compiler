import {CompilerOptions} from "../options/options";
import path from "node:path";
import sass from "sass";
import chokidar from "chokidar";
import {exists, isDir, writeFile} from "../util/fs";
import {mkdir, readdir} from "node:fs/promises";
import {CompileEntry, SassCompilerConfig} from "../config/config";
import fs from "node:fs";
import {log} from "../util/log";

export class Compiler {
    /* STATIC */
    public static build(options?: CompilerOptions): Compiler {
        return new Compiler(options);
    }

    /* INSTANCE */
    private constructor(private readonly options?: CompilerOptions) {
    }

    /**
     * Process a single entry from the configuration file.
     * @param entry The entry to process
     * @private
     */
    private async processEntry(entry: CompileEntry): Promise<void> {
        try {
            const baseDir = path.join(process.cwd(), entry.baseDir);
            const outputDir = path.join(process.cwd(), entry.outputDir);

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
                    ignored: (file, _stats) => !!_stats && _stats?.isFile() && !file.endsWith('.scss') && !file.endsWith('.sass'),
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
                                return Promise.reject(new Error(`Error processing directory ${entry.baseDir}`));
                            });
                            break;
                        }
                    });
            }

            await this.processDirs(baseDir, outputDir).catch(() => {
                return Promise.reject(new Error(`Error processing directory ${entry.baseDir}`));
            });
        } catch (e) {
            console.error(`Error processing entry ${entry.baseDir}`, e);
        }
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
                } else if (file.endsWith('.css') && !await exists(path.join(inputDir, file.replace('.css', '.scss'))) && !await exists(path.join(inputDir, file.replace('.css', '.scss')))) {
                    fs.unlinkSync(fullPath);
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
        const ext = path.extname(file);
        if (ext === '.scss' || ext === '.sass') {
            const filename = path.basename(file);
            const {css} = sass.compile(file);
            const outFile = path.join(outputDir, filename.replace(ext, '.css'));
            await writeFile(outFile, css);
        }
    }

    public async compile(config: SassCompilerConfig): Promise<void> {
        await Promise.all(config.entries.map(entry => this.processEntry(entry)));
    }
}
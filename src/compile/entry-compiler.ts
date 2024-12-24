import path from "node:path";
import {mkdir, readdir, rm, unlink} from "node:fs/promises";

import chokidar, {FSWatcher} from "chokidar";
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
    private _watcher: FSWatcher | null = null;
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
            log(`Created directory ${outputDir}`);
        }

        // Initial processor
        await this.processDirs(baseDir, outputDir).catch(err => {
            console.error(err);
            return Promise.reject(new Error(`Error processing directory ${this.baseDir}`));
        });

        // Watcher
        if (this.options?.watch) {
            console.log(`Watching directory ${baseDir}...`);

            this._watcher = chokidar.watch(baseDir, {
                ignored: (file, _stats) => !!_stats && _stats.isFile() && !this.matchFile(path.basename(file)),
                persistent: true,
                interval: 100,
                depth: 10,
            });

            this._watcher.on('all', async (event, watchPath) => {
                log(`File ${watchPath} has been ${event}`);
                switch (event) {
                    case 'add':
                    case 'change':
                        await this.processDir(baseDir, outputDir).catch((err) => {
                            console.error(err);
                            return Promise.reject(new Error(`Error processing directory ${this.baseDir}`));
                        });
                        break;
                    case 'unlink':
                        await this.doUnlink(watchPath, baseDir, outputDir);
                        break;
                    case 'unlinkDir':
                        await this.doUnlinkDir(watchPath, baseDir, outputDir);
                        break;
                }
            });
        }
    }

    /**
     * Stop the watcher.
     */
    public async stop(): Promise<void> {
        if (this._watcher) {
            await this._watcher.close();
        }
    }

    /**
     * Unlink a file.
     * @param watchPath The path of the file to unlink
     * @param baseDir The base directory
     * @param outputDir The output directory
     * @private
     */
    private async doUnlink(watchPath: string, baseDir: string, outputDir: string): Promise<void> {
        const relativeFilePath = watchPath.replace(baseDir, '');

        console.log(`File ${relativeFilePath} has been removed`);

        const ext = path.extname(relativeFilePath);
        const filename = path.basename(relativeFilePath).replace(ext, '');

        console.log(`Deleting file ${path.join(outputDir, `${filename}.css`)}`);

        await rm(path.join(outputDir, `${filename}.css`), {
            force: true,
            recursive: true
        }).catch(err => {
            console.error(`Error deleting file ${relativeFilePath}: ${err}`);
        });
    }

    /**
     * Unlink a directory.
     * @param watchPath The path of the directory to unlink
     * @param baseDir The base directory
     * @param outputDir The output directory
     * @private
     */
    private async doUnlinkDir(watchPath: string, baseDir: string, outputDir: string): Promise<void> {
        const relativePath = watchPath.replace(baseDir, '');
        console.log(`Directory ${relativePath} has been removed`);
        await rm(path.join(outputDir, relativePath), {
            force: true,
            recursive: true
        }).catch(err => {
            console.error(`Error deleting directory ${relativePath}: ${err}`);
        });
    }

    /**
     * Process directories recursively.
     * @param inputDir The input directory
     * @param outputDir The output directory
     * @private
     */
    private async processDirs(inputDir: string, outputDir: string): Promise<void> {
        await this.processDir(inputDir, outputDir);
        await this.processOutputDir(inputDir, outputDir);
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
        log(`Processing output directory ${outputDir}`);
        if (await exists(outputDir)) {
            const files = await readdir(outputDir);
            await Promise.all(files.map(async (file) => {
                const fullPath = path.join(outputDir, file);
                if (await isDir(fullPath)) {
                    await this.processOutputDir(path.join(inputDir, file), fullPath);
                } else if (file.endsWith('.css')) {
                    // Check if the corresponding source file exists or not and delete the CSS file if it doesn't.
                    if (!await exists(inputDir)) {
                        await rm(outputDir, {
                            force: true,
                            recursive: true
                        }).catch(err => {
                            console.error(`Error deleting directory ${outputDir}: ${err}`);
                        });
                    } else {
                        const inputFiles = await readdir(inputDir);
                        const cssBaseName = path.basename(file, '.css');
                        const exists = inputFiles.find(inputFile => {
                            const ext = path.extname(inputFile);
                            return cssBaseName == path.basename(inputFile, ext) && this.matchFile(inputFile);
                        });

                        if (!exists) {
                            await unlink(fullPath).catch(err => {
                                console.error(`Error deleting file ${fullPath}: ${err}`);
                            });
                        }

                        // Check if the current directory is empty and delete it if it is.
                        const outputFiles = await readdir(outputDir);
                        if (outputFiles.length === 0) {
                            await rm(outputDir, {
                                force: true,
                                recursive: true
                            }).catch(err => {
                                console.error(`Error deleting directory ${outputDir}: ${err}`);
                            });
                        }
                    }
                }
            }));
        } else {
            log(`Output directory ${outputDir} not found`);
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
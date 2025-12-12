import crypto from "node:crypto";
import path from "node:path";
import {mkdir, readdir, rm, unlink} from "node:fs/promises";

import {FSWatcher, watch} from "chokidar";
import sass from "sass";

import {log} from "../util/log";
import {exists, isDir, writeFile} from "../util/fs";
import {CompileEntry} from "../config/config";
import {CompilerOptions} from "../options/options";
import {Manifest} from "../config/manifest";
import {ChangeQueue} from "./event/change-queue";
import {ChangeEvent} from "./event/change-event";

type BuildOptions = {
    options?: CompilerOptions;
    manifest?: Manifest;
}

export class EntryCompiler {
    /* STATIC */
    public static build(entry: CompileEntry, buildOptions?: BuildOptions): EntryCompiler {
        const {options} = buildOptions || {};
        return new EntryCompiler(entry, options);
    }

    /* INSTANCE */
    private readonly baseDir: string;
    private readonly outputDir: string;
    private readonly filename: string;
    private readonly filenames: RegExp;
    private readonly minify: boolean;
    private readonly sourceMap: boolean;
    private readonly manifest?: Manifest;
    private readonly changeQueue?: ChangeQueue;
    private _watcher: FSWatcher | null = null;
    private constructor(
        entry: CompileEntry,
        private readonly options?: CompilerOptions,
    ) {
        this.baseDir = entry.baseDir;
        this.outputDir = entry.outputConfig.directory;
        this.filename = entry.outputConfig.filename;
        this.filenames = entry.filenames;

        if (entry.outputConfig?.manifest) {
            this.manifest = Manifest.build(entry.outputConfig.manifest);
            log(`Building manifest for entry at ${this.baseDir}`);
        }

        if (entry.minify !== undefined) {
            this.minify = entry.minify;
        } else {
            this.minify = !options?.watch;
        }

        if (entry.sourceMap !== undefined) {
            this.sourceMap = entry.sourceMap;
        } else {
            this.sourceMap = !options?.watch;
        }

        if (this.options?.watch) {
            this.changeQueue = new ChangeQueue();
        }
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
            let tries = 0;
            let created: boolean = false;
            let mkDirError: Error | null = null;
            while (!created && tries < 3) {
                await mkdir(outputDir, {
                    recursive: true
                }).then(() => {
                    created = true;
                }).catch(e => {
                    mkDirError = e;
                    tries++;
                    return false;
                });
            }

            if (!created) {
                return Promise.reject(new Error(`Error creating directory ${outputDir}: ${mkDirError}`));
            }

            log(`Created directory ${outputDir}`);
        }

        // Initial processor
        await this.processDirs(baseDir, outputDir).catch(err => {
            console.error(err);
            return Promise.reject(new Error(`Error processing directory ${this.baseDir}`));
        });

        // Watcher
        if (this.options?.watch) {
            log(`Watching directory ${baseDir}...`);

            this._watcher = watch(baseDir, {
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
                        this.changeQueue?.push(new ChangeEvent(event, async () => {
                            try {
                                return await this.processDir(baseDir, outputDir);
                            } catch (err) {
                                console.error(err);
                                return Promise.reject(new Error(`Error processing directory ${this.baseDir}`));
                            }
                        }))
                        break;
                    case 'unlink':
                        this.changeQueue?.push(new ChangeEvent('unlink', async () => {
                            try {
                                return await this.doUnlink(watchPath, baseDir, outputDir);
                            } catch (err) {
                                console.error(err);
                                return Promise.reject(new Error(`Error processing unlink for file ${watchPath}`));
                            }
                        }));
                        break;
                    case 'unlinkDir':
                        this.changeQueue?.push(new ChangeEvent('unlinkDir', async () => {
                            try {
                                return await this.doUnlinkDir(watchPath, baseDir, outputDir);
                            } catch (err) {
                                console.error(err);
                                return Promise.reject(new Error(`Error processing unlinkDir for directory ${watchPath}`));
                            }
                        }));
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
            this.changeQueue?.stop();
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

        log(`File ${relativeFilePath} has been removed`);

        const ext = path.extname(relativeFilePath);
        const filename = path.basename(relativeFilePath).replace(ext, '');

        // Find filename that matches the output filename patterns
        const outputFiles = await readdir(outputDir);

        for (const outputFile of outputFiles) {
            const outputExt = path.extname(outputFile);
            const outputBaseName = this.getBaseName(outputFile, outputExt);

            if (outputBaseName === filename) {
                // If the file matches the output filename pattern, delete it
                log(`Deleting file ${path.join(outputDir, outputFile)}`);
                await unlink(path.join(outputDir, outputFile)).catch(err => {
                    console.error(`Error deleting file ${relativeFilePath}: ${err}`);
                });

                if (this.manifest) {
                    const key = path.relative(process.cwd(), watchPath.replace(ext, ''));
                    this.manifest.delete(key);
                    await this.manifest.save();
                    log(`Removed from manifest: ${key}`);
                }
            }
        }

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
        log(`Directory ${relativePath} has been removed`);
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
                } else {
                    const extension = this.filename ? path.extname(this.filename) : '.css';

                    if (file.endsWith(extension)) {
                        if (!await exists(inputDir)) {
                            await rm(outputDir, {
                                force: true,
                                recursive: true
                            }).catch(err => {
                                console.error(`Error deleting directory ${outputDir}: ${err}`);
                            });
                        } else {
                            const inputFiles = await readdir(inputDir);
                            const generatedBaseName = this.getBaseName(file, extension);

                            const exists = inputFiles.find(inputFile => {
                                const ext = path.extname(inputFile);
                                return generatedBaseName == path.basename(inputFile, ext) && this.matchFile(inputFile);
                            });

                            if (!exists) {
                                await unlink(fullPath).catch(err => {
                                    console.error(`Error deleting file ${fullPath}: ${err}`);
                                });

                                if (this.manifest) {
                                    const key = path.relative(process.cwd(), fullPath);
                                    this.manifest.delete(key);
                                    await this.manifest.save();
                                    log(`Removed from manifest: ${key}`);
                                }
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
            try {
                const {css} = sass.compile(file, {
                    style: this.minify ? 'compressed' : 'expanded',
                    sourceMap: this.sourceMap,
                });
                log(`Compiled successfully: ${file}`);
                const outFilename = this.buildOutputFileName(file, css);
                const outFile = path.join(outputDir, outFilename);
                await writeFile(outFile, css);

                if (this.manifest) {
                    const extension = path.extname(file);
                    const key = path.relative(process.cwd(), file.replace(extension, ''));
                    const value = path.relative(process.cwd(), outFile);
                    this.manifest.add(key, value);
                    await this.manifest.save();
                }
                log(`Output written to: ${outFile}`);
            } catch (e) {
                console.error(e);
            }
        }
    }

    private buildOutputFileName(file: string, content: string): string {
        const ext = path.extname(file);
        const filename = path.basename(file);

        let outputExtension = '.css';
        const variables: string[] = [];
        if (this.filename) {
            // Identify all template variables in the output filename
            const match = this.filename.match(/\[([^\]]+)]/g);

            if (match) {
                match.forEach(variable => {
                    variables.push(variable.replace(/[[\]]/g, ''));
                });
            }

            outputExtension = path.extname(this.filename) || outputExtension;
        }

        let outputFilename: string = (this.filename||filename).replace(ext, outputExtension);

        variables.forEach(variable => {
            switch (variable) {
                case 'name':
                    outputFilename = outputFilename.replace('[name]', path.basename(file, ext));
                    break;
                case 'hash': {
                        const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
                        outputFilename = outputFilename.replace('[hash]', hash);
                    }
                    break;
            }
        });

        return outputFilename;
    }

    private getBaseName(file: string, extension: string): string {

        let baseName: string;


        if (this.filename) {
            // Identify all template variables in the output filename
            const match = this.filename.match(/\[([^\]]+)]/g);
            const variables = match?.map(variable => variable.replace(/[[\]]/g, '')) || [];

            const filenameParts = file.split('.');

            baseName = this.filename.replace(extension, '');
            variables.forEach((variable, idx) => {
                switch (variable) {
                    case 'name':
                        baseName = baseName.replace('[name]', filenameParts[idx]);
                        break;
                    default:
                        baseName = baseName.replace(`[${variable}]`, '');
                        break;
                }
            });
        } else {
            baseName = path.basename(file, path.extname(file));
        }

        // Remove any trailing dots or underscores
        baseName = baseName.replace(/[._]+$/, '');

        return baseName;
    }
}
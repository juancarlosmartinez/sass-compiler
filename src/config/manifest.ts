import {ManifestConfig} from "./config";
import {writeFile} from "../util/fs";
import fs from "node:fs/promises";

export class Manifest {
    /* STATIC */
    public static build(config: ManifestConfig): Manifest {
        return new Manifest(config.path, config.filename);
    }

    /* INSTANCE */
    private readonly path: string;
    private readonly mapping: Record<string, string>;
    private constructor(private readonly _basedir: string, private readonly _name: string = 'manifest.json') {
        this.path = `${this._basedir}${this._basedir.endsWith('/') ? '' : '/'}${this._name}`;
        this.mapping = {};
    }

    /**
     * Add a file to the manifest.
     * @param original The original file path
     * @param compiled The compiled file path
     */
    public add(original: string, compiled: string): void {
        this.mapping[original] = compiled;
    }

    /**
     * Get the compiled file path for the original file.
     * @param original The original file path
     * @returns The compiled file path or undefined if not found
     */
    public get(original: string): string | undefined {
        return this.mapping[original];
    }

    /**
     * Delete item from the manifest.
     */
    public delete(original: string): void {
        delete this.mapping[original];
    }

    /**
     * Save the manifest to the file system.
     */
    public async save(): Promise<void> {
        const lockFile = `${this.path}.lock`;
        let lockAcquired = false;

        try {
            // Tray to acquire a lock
            await fs.writeFile(lockFile, process.pid.toString(), { flag: 'wx' });
            lockAcquired = true;

            const keys = Object.keys(this.mapping);
            // Sort the keys to ensure consistent order
            keys.sort();
            const sortedMapping: Record<string, string> = {};
            for (const key of keys) {
                sortedMapping[key] = this.mapping[key];
            }
            await writeFile(this.path, JSON.stringify(sortedMapping, null, 2));
        } catch (error: unknown) {
            if (error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code === 'EEXIST') {
                // Lock file already exists, another process is writing the manifest
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.save(); // Retry saving after waiting
            }
            console.error(`Error saving manifest to ${this.path}:`, error);
        } finally {
            if (lockAcquired) {
                await fs.unlink(lockFile).catch(() => {});
            }
        }
    }

}
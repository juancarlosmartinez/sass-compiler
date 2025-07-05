import {ManifestConfig} from "./config";
import {writeFile} from "../util/fs";

export class Manifest {
    /* STATIC */
    public static build(config: ManifestConfig): Manifest {
        return new Manifest(config.path, config.filename);
    }

    /* INSTANCE */
    private readonly path: string;
    private readonly mapping: Record<string, string>;
    private constructor(private readonly _basedir: string, private readonly _name: string = 'manifest.json') {
        this.path = `${this._basedir}/${this._name}`;
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
        try {
            await writeFile(this.path, JSON.stringify(this.mapping, null, 2));
        } catch (error) {
            console.error(`Error saving manifest to ${this.path}:`, error);
        }
    }

}
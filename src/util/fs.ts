
import fs from "node:fs/promises";

const exists = async (file: string): Promise<boolean> => {
    return fs.readFile(file).then(() => true).catch(() => false);
}

const writeFile = async (path: string, data: string) => {
    const dir = path.split("/").slice(0, -1).join("/");
    await fs.mkdir(dir, {
        recursive: true
    });

    if (await exists(path)) {
        await fs.unlink(path);
    }

    await fs.writeFile(path, data);
}

const readJSON = async <T=any>(file: string): Promise<T> => {
    const buffer = await fs.readFile(file);
    return JSON.parse(buffer.toString("utf-8"));
}

const isDir = async (path: string): Promise<boolean> => {
    const stats = await fs.stat(path);
    return stats.isDirectory();
}

export {
    exists,
    writeFile,
    readJSON,
    isDir
};

import fs from "node:fs/promises";

const exists = async (file: string): Promise<boolean> => {
    return fs.access(file).then(() => true).catch(() => false);
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

const isDir = async (path: string): Promise<boolean> => {
    const stats = await fs.stat(path);
    return stats.isDirectory();
}

export {
    exists,
    writeFile,
    isDir
};
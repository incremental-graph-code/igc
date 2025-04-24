import path from "path";
import os from "os";

export const getConfigPath = (): string => {
    if (process.env.CONFIG_PATH) {
        return path.join(process.env.CONFIG_PATH);
    } else {
        const homeDir = os.homedir();
        return path.join(homeDir, ".IGC");
    }
};

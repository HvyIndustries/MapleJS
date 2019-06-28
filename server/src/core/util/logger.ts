import { Connection } from "vscode-languageserver";

export class Logger {
    public debugEnabled: boolean = false;

    private connection: Connection = null;
    private workspaceFolder: string = null;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    public setWorkspaceFolder(folder: string): void {
        this.workspaceFolder = folder;
    }

    /**
     * Write a log message to the plugin output panel
     *
     * @param message The log message
     */
    public log(message: string): void {
        this.connection.console.log(`[Server(${process.pid}) ${this.workspaceFolder}] ${message}`);
    }

    /**
     * Write a debugging log message to the plugin output panel if 'debugEnabled' is true
     *
     * @param message The log message
     */
    public debug(message: string): void {
        if (this.debugEnabled) {
            this.log(`[DEBUG] ${message}`);
        }
    }
}

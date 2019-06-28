import * as acorn from "acorn";
import { IFileNode } from "./interfaces/IFileNode";
import { Logger } from "./util/logger";

const glob = require("glob");
const fs = require("fs");

export class MapleJS {
    public ast: IFileNode[] = [];

    private _workspaceFolder: string = null;

    public get workspaceFolder() : string {
        if (this._workspaceFolder == null) {
            throw "Workspace folder not set";
        }

        return this._workspaceFolder;
    }

    public set workspaceFolder(folder : string) {
        this._workspaceFolder = folder;
    }

    private logger: Logger = null;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Build an array of AST nodes for the workspace folder
     */
    public buildAstForWorkspace(): Promise<void> {
        return new Promise(() => {
            const folder = this.workspaceFolder.replace("file://", "");

            // TODO: get all JS files in workspace and parse them with acorn (exclude node_modules)

            this.logger.debug(`Looking for files in ${folder}`);

            const globOptions = { ignore: `${folder}/node_modules/**/*` };
            glob(`${folder}/**/*.js`, globOptions, (err, fileNames: string[]) => {
                if (err != null) {
                    this.logger.log(err);
                    return;
                }

                // TODO: status bar information about parsing (ie. % complete)
                this.logger.debug(`Found ${fileNames.length} JS files in workspace`);

                fileNames.forEach((path: string) => {
                    this.logger.debug(path);

                    const fileUri = `file://${path}`;

                    this.buildAstForFile(fileUri)
                        .then((fileNode) => {
                            this.ast.push(fileNode);

                            // DEBUG
                            // if (fileUri.endsWith("my-app.js")) {
                            //     this.logger.log(JSON.stringify(fileNode, undefined, 4));
                            // }
                        })
                        .catch((err) => {
                            this.logger.log(err);
                        })
                });
            });
        });
    }

    /**
     * Generate an AST for the given file URI
     *
     * @param fileUri The file to generate AST for
     */
    private buildAstForFile(fileUri: string): Promise<IFileNode> {
        return new Promise((resolve, reject) => {
            const path = fileUri.replace("file://", "");

            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                const acornOptions: acorn.Options = {};
                const fileNodes = acorn.parse(data, acornOptions);

                const file: IFileNode = {
                    uri: fileUri,
                    nodes: fileNodes
                };

                // TODO: meta information:
                //  - all components + link to their HTML template file (or inline HTML string)
                //  - services
                //  - directives

                resolve(file);
            });
        });
    }
}

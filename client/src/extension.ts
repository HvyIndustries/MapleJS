/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as path from "path";
import {
    workspace as Workspace,
    window as Window,
    ExtensionContext, TextDocument, OutputChannel, WorkspaceFolder, Uri, StatusBarAlignment
} from "vscode";

import {
    LanguageClient, LanguageClientOptions, TransportKind
} from "vscode-languageclient";

let defaultClient: LanguageClient;
let clients: Map<string, LanguageClient> = new Map();

let _sortedWorkspaceFolders: string[] | undefined;
function sortedWorkspaceFolders(): string[] {
    if (_sortedWorkspaceFolders === void 0) {
        _sortedWorkspaceFolders = Workspace.workspaceFolders ? Workspace.workspaceFolders.map(folder => {
            let result = folder.uri.toString();
            if (result.charAt(result.length - 1) !== "/") {
                result = result + "/";
            }
            return result;
        }).sort(
            (a, b) => {
                return a.length - b.length;
            }
        ) : [];
    }
    return _sortedWorkspaceFolders;
}
Workspace.onDidChangeWorkspaceFolders(() => _sortedWorkspaceFolders = undefined);

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
    let sorted = sortedWorkspaceFolders();
    for (let element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== "/") {
            uri = uri + "/";
        }
        if (uri.startsWith(element)) {
            return Workspace.getWorkspaceFolder(Uri.parse(element))!;
        }
    }
    return folder;
}

export function activate(context: ExtensionContext) {

    let module = context.asAbsolutePath(path.join("server", "out", "server.js"));
    let outputChannel: OutputChannel = Window.createOutputChannel("MapleJS");

    function didOpenTextDocument(document: TextDocument): void {
        const languageIds = [
            "plaintext",
            "javascript",
            "html"
        ];

        if (languageIds.indexOf(document.languageId) === -1 || (document.uri.scheme !== "file" && document.uri.scheme !== "untitled")) {
        // if (document.languageId !== "plaintext" || (document.uri.scheme !== "file" && document.uri.scheme !== "untitled")) {
            return;
        }

        let uri = document.uri;
        // Untitled files go to a default client.
        if (uri.scheme === "untitled" && !defaultClient) {
            let debugOptions = { execArgv: ["--nolazy", "--inspect=6010"] };
            let serverOptions = {
                run: { module, transport: TransportKind.ipc },
                debug: { module, transport: TransportKind.ipc, options: debugOptions}
            };
            let clientOptions: LanguageClientOptions = {
                documentSelector: [
                    { scheme: "untitled", language: "plaintext" },
                    { language: "javascript" },
                    { language: "html" },
                ],
                diagnosticCollectionName: "maplejs",
                outputChannel: outputChannel
            }
            defaultClient = new LanguageClient("maplejs", "MapleJS - AngularJS Language Server", serverOptions, clientOptions);
            defaultClient.start();
            return;
        }

        let folder = Workspace.getWorkspaceFolder(uri);

        // Files outside a folder can't be handled. This might depend on the language.
        // Single file languages like JSON might handle files outside the workspace folders.
        if (!folder) {
            return;
        }

        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = getOuterMostWorkspaceFolder(folder);

        if (!clients.has(folder.uri.toString())) {
            let debugOptions = { execArgv: ["--nolazy", `--inspect=${6011 + clients.size}`] };
            let serverOptions = {
                run: { module, transport: TransportKind.ipc },
                debug: { module, transport: TransportKind.ipc, options: debugOptions}
            };

            let clientOptions: LanguageClientOptions = {
                documentSelector: [
                    { scheme: "file", language: "plaintext", pattern: `${folder.uri.fsPath}/**/*` },
                    { scheme: "file", language: "javascript", pattern: `${folder.uri.fsPath}/**/*` },
                    { scheme: "file", language: "html", pattern: `${folder.uri.fsPath}/**/*` },
                ],
                diagnosticCollectionName: "maplejs",
                workspaceFolder: folder,
                outputChannel: outputChannel
            }

            let client = new LanguageClient("maplejs", "MapleJS - AngularJS Language Server", serverOptions, clientOptions);

            client.start();
            clients.set(folder.uri.toString(), client);
        }
    }

    Workspace.onDidOpenTextDocument(didOpenTextDocument);
    Workspace.textDocuments.forEach(didOpenTextDocument);
    Workspace.onDidChangeWorkspaceFolders((event) => {
        for (let folder  of event.removed) {
            let client = clients.get(folder.uri.toString());
            if (client) {
                clients.delete(folder.uri.toString());
                client.stop();
            }
        }
    });

    // Create a status bar item
    const status = Window.createStatusBarItem(StatusBarAlignment.Left, 1000000);
    status.text = "MapleJS";
    context.subscriptions.push(status);
    status.show();
}

export function deactivate(): Thenable<void> {
    let promises: Thenable<void>[] = [];
    if (defaultClient) {
        promises.push(defaultClient.stop());
    }
    for (let client of clients.values()) {
        promises.push(client.stop());
    }
    return Promise.all(promises).then(() => undefined);
}

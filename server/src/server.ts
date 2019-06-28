/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    SymbolInformation,
    Hover,
    Definition,
    SymbolKind
} from "vscode-languageserver";
import { HandlerResult } from "vscode-jsonrpc";
import { MapleJS } from "./core/maplejs";
import { Logger } from "./core/util/logger";

// Creates the LSP connection
let connection = createConnection(ProposedFeatures.all);

// Create a manager for open text documents
let documents = new TextDocuments();

// The workspace folder this server is operating on
let workspaceFolder: string | null;

const logger = new Logger(connection);
// TODO: convert this to plugin setting
logger.debugEnabled = true;

const maplejs = new MapleJS(logger);

// const hoverProvider = new HoverProvider(maplejs, logger);
// const definitionProvider = new DefinitionProvider(maplejs, logger);
// const documentSymbolProvider = new DocumentSymbolProvider(maplejs, logger);
// const workspaceSymbolProvider = new WorkspaceSymbolProvider(maplejs, logger);

let timer = null;

connection.onInitialize((params) => {
    workspaceFolder = params.rootUri;
    maplejs.workspaceFolder = workspaceFolder;
    logger.setWorkspaceFolder(workspaceFolder);

    logger.log("Started server initialization");

    maplejs.buildAstForWorkspace();

    // Prevent garbage collection of essential maplejs object
    // TODO: is this needed?
    if (timer != null) {
        clearTimeout(timer);
    }
    timer = setInterval(() => {
        return maplejs.ast.length;
    }, 15000);

    return {
        capabilities: {
            // completionProvider: {
            //     resolveProvider: false,
            //     triggerCharacters: ["{", "."],
            // },

            definitionProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            hoverProvider: true,

            // signatureHelpProvider: {
            //     triggerCharacters: ["(", ","]
            // },

            // textDocumentSync: {
            //     openClose: true,
            //     change: TextDocumentSyncKind.None
            // }
        }
    }
});

// TODO: replace inline handler function with reference to class method
connection.onDocumentSymbol((params, cancelToken): Promise<SymbolInformation[]> => {
    return new Promise((resolve, reject) => {
        const symbols = [{
            name: "TEST",
            containerName: "",
            kind: SymbolKind.Class,
            location: {
                uri: "test",
                range: {
                    start: {
                        character: 0,
                        line: 0
                    },
                    end: {
                        character: 0,
                        line: 0
                    }
                }
            }
        }];

        resolve(symbols);
    });
});

// TODO: replace inline handler function with reference to class method
connection.onWorkspaceSymbol((params, cancelToken): SymbolInformation[] => {
    return null;
});

// TODO: replace inline handler function with reference to class method
connection.onHover((params, cancelToken): HandlerResult<Hover, void> => {
    // TODO: get js-doc comment info
    // TODO: make this work within HTML files
    return null;
});

// TODO: replace inline handler function with reference to class method
connection.onDefinition((params, cancelToken): HandlerResult<Definition, void> => {
    return null;
});



documents.onDidOpen((event) => {
    logger.log(`Document opened: ${event.document.uri}`);
})

documents.listen(connection);
connection.listen();

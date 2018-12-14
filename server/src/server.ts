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

// import * as acorn from "acorn";

// const js = "";
// const options: acorn.Options = {};
// acorn.parse(js, options);

// Creates the LSP connection
let connection = createConnection(ProposedFeatures.all);

// Create a manager for open text documents
let documents = new TextDocuments();

// The workspace folder this server is operating on
let workspaceFolder: string | null;

documents.onDidOpen((event) => {
    connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Document opened: ${event.document.uri}`);
})
documents.listen(connection);

connection.onInitialize((params) => {
    workspaceFolder = params.rootUri;
    connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Started and initialize received`);

    // TODO: start parsing & building tree for workspaceFolder
    //  - all components + link to HTML file
    //  - services
    //  - directives

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
connection.listen();

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

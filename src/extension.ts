import * as vs from "vscode";
import * as path from "path";

import { DocBlockr } from "./docblockr";

let docblockr: DocBlockr;

function lazyInitializeDocumenter() {
    if (!docblockr) {
        docblockr = new DocBlockr();
    }
}

function languageIsSupported(document: vs.TextDocument) {
    return (document.languageId === "javascript" ||
        document.languageId === "typescript" ||
        document.languageId === "vue" ||
        document.languageId === "javascriptreact" ||
        document.languageId === "typescriptreact" ||
        path.extname(document.fileName) === ".vue");
}

function verifyLanguageSupport(document: vs.TextDocument, commandName: string) {
    if (!languageIsSupported(document)) {
        vs.window.showWarningMessage(`Sorry! '${commandName}' currently supports JavaScript and TypeScript only.`);
        return false;
    }

    return true;
}

function runCommand(commandName: string, document: vs.TextDocument, implFunc: () => void) {
    if (!verifyLanguageSupport(document, commandName)) {
        return;
    }

    try {
        lazyInitializeDocumenter();
        implFunc();
    }
    catch (e) {
        debugger;
        console.error(e);
    }
}

export function activate(context: vs.ExtensionContext): void {
    context.subscriptions.push(vs.workspace.onDidChangeTextDocument(e => {
        if (!vs.workspace.getConfiguration().get("doc.automaticForBlockComments", true)) {
            return;
        }

        if (!languageIsSupported(e.document)) {
            return;
        }

        const editor = vs.window.activeTextEditor;
        if (editor.document !== e.document) {
            return;
        }

        if (e.contentChanges.length > 1) {
            return;
        }

        const change = e.contentChanges[0];
        if (change.text === "* */") {
            lazyInitializeDocumenter();
            setTimeout(() => {
                try {
                    docblockr.automaticDocument(editor);
                }
                catch (ex) {
                    console.error("docblockr: Failed to document at current position.");
                }
            }, 0);
        }
    }));

    context.subscriptions.push(vs.commands.registerCommand("doc.docblockr", () => {
        const commandName = "docblockr";
        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            docblockr.documentThis(vs.window.activeTextEditor, commandName);
        });
    }));

    context.subscriptions.push(vs.commands.registerCommand("doc.traceTypeScriptSyntaxNode", () => {
        const commandName = "Trace TypeScript Syntax Node";

        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            docblockr.traceNode(vs.window.activeTextEditor);
        });
    }));
}
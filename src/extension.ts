'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

var firebase = require('firebase')
var T_CONFIG = require('../../t_config.json')

// Initialize Firebase
var config = {
    apiKey: "AIzaSyAXJ5PRbI0cPJHh6BS-1pjvaRmRs5ibJYM",
    authDomain: "rt-code-collab.firebaseapp.com",
    databaseURL: "https://rt-code-collab.firebaseio.com",
    storageBucket: "rt-code-collab.appspot.com",
    messagingSenderId: "89041205883"
};

firebase.initializeApp(config);


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "rt-code-collab" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let codeUpdater = new CodeUpdater();
    let controller = new CodeUpdateController(codeUpdater);

    var disposable = vscode.commands.registerCommand('extension.startWire', () => {
        codeUpdater.updateCode();
    });

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(codeUpdater);
    context.subscriptions.push(controller);
    context.subscriptions.push(disposable);
}

class CodeUpdater {

    private _statusBarItem: vscode.StatusBarItem;

    constructor() {

    }

    public updateCode() {

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        // Get the current text editor
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        console.log(doc.getText())

        let codeRef = firebase.database().ref('teams/' + T_CONFIG.teamKey + '/code/')
        codeRef.update({ "A": doc.getText() })

    }




    dispose() {
        this._statusBarItem.dispose();
    }
}

class CodeUpdateController {

    private _codeUpdater: CodeUpdater;
    private _disposable: vscode.Disposable;

    constructor(codeUpdater: CodeUpdater) {
        this._codeUpdater = codeUpdater;
        this._codeUpdater.updateCode();

        // subscribe to selection change and editor activation events
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);


        // update the counter for the current file
        this._codeUpdater.updateCode();

        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._codeUpdater.updateCode();
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
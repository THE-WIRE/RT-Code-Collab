'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

var firebase = require('firebase')
var T_CONFIG = require('../../t_config.json')
let doc_text: string
let cur_text: string
let initially: boolean = true
let rootPath
let globalTimeStamp;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyAXJ5PRbI0cPJHh6BS-1pjvaRmRs5ibJYM",
    authDomain: "rt-code-collab.firebaseapp.com",
    databaseURL: "https://rt-code-collab.firebaseio.com",
    storageBucket: "rt-code-collab.appspot.com",
    messagingSenderId: "89041205883"
};

firebase.initializeApp(config);

let initial = true;

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

    var disposable = vscode.commands.registerCommand('extension.startWire', () => {

        if (vscode.workspace.rootPath == undefined) {
            //push error
        }
        else {
            rootPath = vscode.workspace.rootPath
        }



        let e = vscode.window.activeTextEditor;
        let codeRef = firebase.database().ref('active/' + T_CONFIG.teamKey + "/" + replaceDot(e.document.fileName) + '/code')

        codeRef.on('value', function (snap) {

            if ((!snap.val() || snap.val() == "") && initially) {
                console.log("updated initially")
                initially = false
                codeUpdater.updateCode()
            }
            else {
                doc_text = snap
                e.edit(function (edit) {
                    edit.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1000, 1000)), doc_text)
                    e.selection = new vscode.Selection(new vscode.Position(e.selection.end.line, e.selection.end.character), new vscode.Position(e.selection.end.line, e.selection.end.character))

                })
            }

        })
    });

    let controller = new CodeUpdateController(codeUpdater);

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

        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;

        if (initially) {
            let codeRef = firebase.database().ref('active/' + T_CONFIG.teamKey + "/" + replaceDot(editor.document.fileName) + '/code')
            codeRef.on('value', function (snap) {

                if ((!snap.val() || snap.val() == "")) {
                    console.log("updated initially")
                    initially = false
                    this.updateCode()
                }
                else {
                    doc_text = snap
                    editor.edit(function (edit) {
                        edit.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1000, 1000)), doc_text)
                        editor.selection = new vscode.Selection(new vscode.Position(editor.selection.end.line, editor.selection.end.character), new vscode.Position(editor.selection.end.line, editor.selection.end.character))

                    })
                }

            })
        } else {
            let codeRef = firebase.database().ref('active/' + T_CONFIG.teamKey + "/" + replaceDot(editor.document.fileName) + "/")
            codeRef.update({ "code": doc.getText() });
            globalTimeStamp = Date.now();
        }
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
        //this._codeUpdater.updateCode();
        globalTimeStamp = Date.now()
        // subscribe to selection change and editor activation events
        let subscriptions: vscode.Disposable[] = [];

        let e = vscode.window.activeTextEditor;



        // let codeRef = firebase.database().ref('active/' + T_CONFIG.teamKey + "/" + rootPath + "/" + replaceDot(e.document.fileName) + '/code')
        // codeRef.on('child_changed', function (snap) {
        //     doc_text = snap

        //     console.log("snap", snap)

        //     if (snap == null && initially) {
        //         this._codeUpdater.updateCode()
        //         initially = false
        //     }
        //     else {
        //         e.edit(function (edit) {
        //             edit.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1000, 1000)), doc_text)
        //             e.selection = new vscode.Selection(new vscode.Position(e.selection.end.line, e.selection.end.character), new vscode.Position(e.selection.end.line, e.selection.end.character))

        //         })
        //     }

        // })

        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._callEventOnActiveChange, this, subscriptions);



        // update the counter for the current file
        //this._codeUpdater.updateCode();

        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        if (globalTimeStamp <= Date.now() - 50) {
            this._codeUpdater.updateCode();
        }

    }

    private _callEventOnActiveChange() {
        initially = true;
        this._onEvent()
    }
}

function replaceDot(str: string): string {
    let x
    if (str.includes('/')) {
        x = str.split('/')
    }
    else {
        x = str.split('\\')
    }

    let y = x[x.length - 1]
    let z = y.replace(/\./g, '_thewire_')
    return z
}

function normalizePath(str: string): string {
    return str.replace(/_thewire_/g, '\.')
}

// this method is called when your extension is deactivated
export function deactivate() {
}
'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// The module 'sqlops' contains the SQL Operations Studio extensibility API
// This is a complementary set of APIs that add SQL / Data-specific functionality to the app
// Import the module and reference it with the alias sqlops in your code below

import * as sqlops from 'sqlops';

type settingstype = {[name: string]: string | undefined};
const SGLH = 'sglh.JSON';
const TRANSPARENCY = 0.2; //transparency
let isActive = false;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    isActive = true;

    const padLeft = (str:string,len:number,padder:string):string => {
        let retval = str;
        for(let i = 0; i < len-str.length; ++i){
            retval = padder + retval;
        }
        return retval;
    }
    const _transparency = padLeft(Math.round(0xff*TRANSPARENCY).toString(16),2,'0');


    function getSettings() : settingstype
    {
        return (context.workspaceState.get(SGLH) || {}) as settingstype;
    }

    function newSetting(name:string, color:string) : Thenable<void>
    {
        let current = getSettings() || {};
        current[name] = color;
        return context.workspaceState.update(SGLH,current);
    }

    function removeSetting(name:string) : Thenable<void>
    {
        let current = getSettings() || {};
        current[name] = undefined;
        return context.workspaceState.update(SGLH,current);
    }

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "server-group-line-highlight" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('sglh.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('sglh.color', () => {
        sqlops.connection.getCurrentConnection().then(connection => {
            if(connection){
                vscode.window.showInputBox({
                    prompt: 'Enter hex value of color (e.g. ffffff)',
                    validateInput: (text: string): string | undefined => {
                        if (!text) {
                            return 'must be non-empty';
                        } 
                        if(!text.match(/^[0-9a-fA-F]{6}$/)){
                            return 'must be valid 6 digit hexadecimal number (/^[0-9a-fA-F]{6}$/)'
                        }
                        return undefined;
                    }
                }).then(color=>{
                    if(!color){
                        //vscode.window.showInformationMessage('No color')
                        return;
                    }
                    let groupid = connection.options['groupId'];
                    newSetting(groupid,color).then(()=>{
                        vscode.window.showInformationMessage(`${groupid} made #${color.toLowerCase()}`);
                    });
                });
            }
            else{
                vscode.window.showWarningMessage('No connection found!');
            }
        }, error => {
                console.info(error);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('sglh.colorText', () => {
        sqlops.connection.getCurrentConnection().then(connection => {
            if(connection){
                let groupid = connection.options['groupId'];
                let color = getSettings()[groupid];
                if(color){
                    vscode.window.showErrorMessage(Object.keys(vscode.workspace.getConfiguration().get("editor.background") || {}).join('|'));
                    vscode.window.showInformationMessage(color);
                }
                else{
                    vscode.window.showInformationMessage('no color specified');
                }
            }
            else{
                vscode.window.showWarningMessage('No connection found!');
            }
        }, error => {
                console.info(error);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('sglh.colorRemove', () => {
        sqlops.connection.getCurrentConnection().then(connection => {
            if(!connection){
                vscode.window.showWarningMessage('No connection found!');
                return;
            }

            let groupid = connection.options['groupId'];
            vscode.window.showInformationMessage(`${groupid} removed`);
            removeSetting(groupid);
            triggerChange();
        });
    }));

    const triggerChange = () => sqlops.connection.getCurrentConnection().then(connection => {
        try{
            if(connection){
                let groupid = connection.options['groupId'];
                let color = getSettings()[groupid];
                if(color){
                    // const rval = parseInt(color.substr(0,2),16);
                    // const gval = parseInt(color.substr(2,2),16);
                    // const bval = parseInt(color.substr(4,2),16);
                    // const cvector = [rval,gval,bval];
                    // const nvector = [0x80,0x80,0x80];
                    // const selection = cvector.map((val,i)=>{
                    //     let avg = (val+nvector[i])/2;
                    //     return padLeft(avg.toString(16),2,'0')
                    // }).reduce((p,n)=>p+n,'');
                    // let cmag = rval + gval + bval || 1;
                    // let selection = cvector.map((val):string=>{
                    //     let direction = val < 0x80 ? 1 : -1;
                    //     let modif = Math.round(SELECTION_MODIFIER*SELECTION_MODIFIER_DIST*direction*val/cmag + SELECTION_MODIFIER*(1-SELECTION_MODIFIER_DIST)*direction + val);
                    //     if(modif > 0xff) return 'ff';
                    //     if(modif < 0) return '00';
                    //     return padLeft(modif.toString(16),2,'0');
                    // }).reduce((p,n)=>p+n,'');
                    vscode.workspace.getConfiguration().update("workbench.colorCustomizations",{
                        "editor.lineHighlightBackground" : '#' + color.toLowerCase() + _transparency,
                        "editor.selectionBackground" : '#' + color.toLowerCase(),
                    },true);
                }
                else{
                    vscode.workspace.getConfiguration().update("workbench.colorCustomizations",{},true);
                }
            }
            else{
                vscode.workspace.getConfiguration().update("workbench.colorCustomizations",{},true);
            }
        }
        catch (err){
            vscode.window.showInformationMessage(err);
        }
    }, error => {
        console.info(error);
   });

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((textEditor)=>{
        if(!textEditor) return;
        triggerChange();
    }));

    const pollChange = () =>{
        if(!isActive) return;
        triggerChange();
        setTimeout(pollChange,1500);
    }
    pollChange();
}

// this method is called when your extension is deactivated
export function deactivate() {
    isActive = false;
    vscode.workspace.getConfiguration().update("workbench.colorCustomizations",{},true);
}
import * as vscode from 'vscode';
import * as fs from 'fs';
import { isUndefined } from 'util';
import { strict } from 'assert';
import { stringify } from 'querystring';
import { emitKeypressEvents } from 'readline';

const myPath : string = "C:/Users/Ryan/AppData/Roaming/Code/User/settings.json";
const testPath : string = "c:/source/codeui/settingsTest.json";

export class CustomizedElementProvider implements vscode.TreeDataProvider<Element> {

    public currentElements: Element[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;

    constructor() {

    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Element): vscode.TreeItem {
        return element;
    }


    getChildren(): Element[] { //departed working: added parameter
        let elements : Element[] = this.getCustomizedElements();
        return elements;
    }

    getBaseElements(): Element[] {
        let text : string = "";
        let jsonObject;
        let elements : Element[] = [];

        text = fs.readFileSync('c:/source/codeui/allElements.json', "utf8");

        jsonObject = JSON.parse(text);
        for(var propt in jsonObject){
            elements.push(new Element(propt,"-",vscode.TreeItemCollapsibleState.Collapsed,));
        }

        return elements;
    }

    getElementProperties(element : Element): Element[] {
        let childElements : Element[] = [];
        let subproperties : [] = [];
        let text : string = "";
        let jsonObject;
        let t : Element;

        text = fs.readFileSync('c:/source/codeui/allElements.json', "utf8");

        jsonObject = JSON.parse(text);

        for(var propt in jsonObject){
            if(propt === element.label){
                subproperties = jsonObject[propt];
                subproperties.forEach(function (item, index) {
                    let element = new Element(item,"-",vscode.TreeItemCollapsibleState.None);
                    element.command = {
						command: 'elementProvider.editValue',
						title: '',
                        arguments: [element]
                    };
                    childElements.push(element);
                });
                break;
            }
        }

        return childElements;
    }

    editValue(key : string): void {

        vscode.window.showInputBox().then((return_result) => {
            if(return_result){
                this.setCustomizedElements(key, return_result);
                vscode.commands.executeCommand('getCustomizedElements');
            }
        });

    }

    getCustomizedElements(): Element[] { //Updates existing treeitems, and returns an array of elements that represent all

        let text : string = "";
        let jsonObject;
        let isCustomized : boolean = false;
        let customizations : any;
        let elements : Element[] = [];

        // Get text:string from json file
        text = fs.readFileSync(myPath, "utf8");

        // Check if customizations are present
        jsonObject = JSON.parse(text);
        for(var propt in jsonObject){
            if(propt === 'workbench.colorCustomizations'){
                isCustomized = true;
            }
        }

        // If so, save them to a json object
        if(isCustomized){
            customizations = jsonObject['workbench.colorCustomizations'];
        }

        // Create a new treeItem for each
        for(var key in customizations){
            console.log('Key: ' + key + ' Value: ' + customizations[key]);
            // //If the jsonObject key (modification) exists in our currentElements array, change the description of the treeitem repr of the 'currentElement'
            // elements.push(new Element(key,customizations[key],vscode.TreeItemCollapsibleState.None));
            let element = new Element(key,customizations[key],vscode.TreeItemCollapsibleState.None);
            element.command = {
                command: 'elementProvider.editValue',
                title: '',
                arguments: [element.label]
            };
            elements.push(element);
        }
        // Return them
        return elements;
    }

    setCustomizedElements(key : string, val : string): void {
        let initial_text : string = fs.readFileSync(myPath, 'utf8');
        let final_text : string;
        let jsonObject;

        jsonObject = JSON.parse(initial_text);

        jsonObject['workbench.colorCustomizations'][key] = val;

        final_text = JSON.stringify(jsonObject,undefined,4);

        fs.writeFileSync(myPath, final_text, 'utf8');

    }
    // public editValue(elementName : string): any {

    //     vscode.window.showInputBox().then((input) => {
    //         if(input){
    //             vscode.window.showInformationMessage(input);
    //             //get element from elementName
    //         }
    //     });
    // }


}


class Element extends vscode.TreeItem {

    constructor(
        label: string,
        color: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        command?: vscode.Command,
        parent?: Element,
    ) {
        super(label, collapsibleState);
        this.description = color;

    }

}
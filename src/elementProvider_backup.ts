import * as vscode from 'vscode';
import * as fs from 'fs';
import { isUndefined } from 'util';
import { strict } from 'assert';
import { stringify } from 'querystring';

export class CustomizedElementProvider implements vscode.TreeDataProvider<Element> {

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


    getChildren(element? : Element | undefined): Element[] { //departed working: added parameter
        let elements : Element[];
        if(element){
            elements = this.getElementProperties(element);
            return elements;
        }
        elements = this.getBaseElements();
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

    editValue(element : Element) {
        element.description = "updated";
        this.refresh();
    }

    parseCustomizedElements(): Element[] {

        let text : string = "";
        let jsonObject;
        let isCustomized : boolean = false;
        let customizations : any;
        let elements : Element[] = [];

        text = fs.readFileSync('c:/source/codeui/settingsTest.json', "utf8");

        jsonObject = JSON.parse(text);
        for(var propt in jsonObject){
            if(propt === 'workbench.colorCustomizations'){
                isCustomized = true;
            }
        }

        if(isCustomized){
            customizations = jsonObject['workbench.colorCustomizations'];
        }

        for(var key in customizations){
            console.log('Key: ' + key + ' Value: ' + customizations[key]);
            elements.push(new Element(key,customizations[key],vscode.TreeItemCollapsibleState.None));
        }

        return elements;
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
    ) {
        super(label, collapsibleState);
        this.description = color;
        this.command = command;
    }

}
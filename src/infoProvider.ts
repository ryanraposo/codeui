import * as vscode from 'vscode';
import { Element } from './elementProvider';
import { AnyTxtRecord } from 'dns';

export class InfoProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element| undefined> = this._onDidChangeTreeData.event;

    selectedElement : any;

    constructor(){
    }

    refresh(){
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element : vscode.TreeItem) : vscode.TreeItem {
        return element;
    }

    getChildren(elementInfo?: ElementInfo) : vscode.TreeItem[] {

        if(this.selectedElement){
            if(elementInfo){
                let elementInfo : vscode.TreeItem[] = [];
                elementInfo.push(new ElementInfo("Default", this.selectedElement.defaultColor, vscode.TreeItemCollapsibleState.None));
                elementInfo.push(new ElementInfo("Theme", this.selectedElement.themeColor, vscode.TreeItemCollapsibleState.None));
                elementInfo.push(new ElementInfo("Settings", this.selectedElement.settingsColor, vscode.TreeItemCollapsibleState.None));
                return elementInfo;
            }else{
                return [new ElementInfo(this.selectedElement.elementData["titleName"], "", vscode.TreeItemCollapsibleState.Expanded)];
            }
        }
        else{
            return [new vscode.TreeItem("No element selected", vscode.TreeItemCollapsibleState.None)];
        }
    }


    setElement(element : Element) {
        this.selectedElement = element;
        this.refresh();
    }

}

class ElementInfo extends vscode.TreeItem{

    constructor(label: string, description: string, collapsibleState : vscode.TreeItemCollapsibleState){
        super(label, collapsibleState);
        this.description = description;
    }

}
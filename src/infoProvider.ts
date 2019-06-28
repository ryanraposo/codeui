import * as vscode from 'vscode';
import { Element } from './elementProvider';
import { CurrentTheme } from './theme';

export class InfoProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<InfoItem | undefined> = new vscode.EventEmitter<InfoItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<InfoItem| undefined> = this._onDidChangeTreeData.event;

    selectedElement : any;
    currentTheme : any = new CurrentTheme();

    constructor(){
    }


    refresh(infoItem?: InfoItem){
        if(infoItem){
            this._onDidChangeTreeData.fire(infoItem);
        }else{
            this._onDidChangeTreeData.fire();
        }
    }

    getTreeItem(element : vscode.TreeItem) : vscode.TreeItem {
        return element;
    }

    getChildren(infoItem?: InfoItem) : vscode.TreeItem[] {

        let children : vscode.TreeItem[] = [];

        if(!infoItem){ // If root...
            let sections : InfoItem[] = [];
            sections.push(new InfoItem("Current Theme", this.currentTheme.themeName, vscode.TreeItemCollapsibleState.Collapsed));
            if(this.selectedElement){
                sections.push(new InfoItem("Element", this.selectedElement.elementData["titleName"], vscode.TreeItemCollapsibleState.Expanded));
            }else{
                sections.push(new InfoItem("Element", "None selected", vscode.TreeItemCollapsibleState.Expanded));
            }
            children = sections;
        }else{
            if(infoItem.label === "Theme"){ // If theme section...
                let themeInfo : InfoItem[] = [];
                themeInfo.push(new InfoItem("Type", this.currentTheme.themeType, vscode.TreeItemCollapsibleState.None));
                children = themeInfo;
            }
            if(infoItem.label === "Element"){ // If element section...
                let elementInfo : InfoItem[] = [];
                if(this.selectedElement){
                    elementInfo.push(new InfoItem("Default", this.selectedElement.defaultColor, vscode.TreeItemCollapsibleState.None));
                    elementInfo.push(new InfoItem("Theme", this.selectedElement.themeColor, vscode.TreeItemCollapsibleState.None));
                    elementInfo.push(new InfoItem("Customization", this.selectedElement.settingsColor, vscode.TreeItemCollapsibleState.None));
                    infoItem.iconPath = this.selectedElement.iconPath;
                    this.refresh(infoItem);
                }else{
                    elementInfo.push(new InfoItem("Default", "", vscode.TreeItemCollapsibleState.None));
                    elementInfo.push(new InfoItem("Theme", "", vscode.TreeItemCollapsibleState.None));
                    elementInfo.push(new InfoItem("Customization", "", vscode.TreeItemCollapsibleState.None));
                    infoItem.iconPath = undefined;

                }
                children = elementInfo;
            }
        }

        return children;

    }


    setElement(element : Element) {
        this.selectedElement = element;
        this.refresh();
    }

}

class InfoItem extends vscode.TreeItem{

    iconPath : any;
    description : any;

    constructor(label: string, description: string, collapsibleState : vscode.TreeItemCollapsibleState){
        super(label, collapsibleState);
        this.description = description;
    }

}
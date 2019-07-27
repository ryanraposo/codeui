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
            sections.push(new InfoItem({ label: "Current Theme", description: this.currentTheme.themeName, collapsibleState: vscode.TreeItemCollapsibleState.Collapsed }));
            if(this.selectedElement){
                sections.push(new InfoItem({ label: "Element", description: this.selectedElement.elementData["titleName"], collapsibleState: vscode.TreeItemCollapsibleState.Expanded }));
            }else{
                sections.push(new InfoItem({ label: "Element", description: "None selected", collapsibleState: vscode.TreeItemCollapsibleState.Expanded }));
            }
            children = sections;
        }else{
            if(infoItem.label === "Theme"){ // If theme section...
                let themeInfo : InfoItem[] = [];
                themeInfo.push(new InfoItem({ label: "Type", description: this.currentTheme.themeType, collapsibleState: vscode.TreeItemCollapsibleState.None }));
                children = themeInfo;
            }
            if(infoItem.label === "Element"){ // If element section...
                let elementInfo : InfoItem[] = [];
                let values : Array<any> = [];
                if(this.selectedElement){
                    for(let key in this.selectedElement.colorConfig){
                        let value = this.selectedElement.colorConfig[key];
                        if(value){
                            values.push(value);
                        }else{
                            values.push("-");
                        }
                    }
                    elementInfo.push(new InfoItem({ label: "Default", description: values[0], collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Theme", description: values[1], collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Settings", description: values[2], collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    infoItem.iconPath = this.selectedElement.iconPath;
                }else{
                    elementInfo.push(new InfoItem({ label: "Default", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Theme", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Customization", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.None }));
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

    constructor({ label, description, collapsibleState }: { label: string; description: string; collapsibleState: vscode.TreeItemCollapsibleState; }){
        super(label, collapsibleState);
        this.description = description;
    }

}
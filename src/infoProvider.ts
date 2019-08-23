import * as vscode from 'vscode';
import { Element } from './elementProvider';
import { CurrentTheme } from './theme';

export class InfoProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<InfoItem | undefined> = new vscode.EventEmitter<InfoItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<InfoItem| undefined> = this._onDidChangeTreeData.event;

    selectedElement : any;
    currentTheme : any;

    constructor(){
        this.currentTheme = new CurrentTheme();
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
            let themeConfiguration : any = vscode.workspace.getConfiguration().get("workbench.colorTheme");
            if(themeConfiguration){
                sections.push(new InfoItem({ label: "Theme", description: themeConfiguration, collapsibleState: vscode.TreeItemCollapsibleState.None}));
            }else{
                sections.push(new InfoItem({ label: "Theme", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.None }));
            }
            if(this.selectedElement){
                sections.push(new InfoItem({ label: "Element", description: this.selectedElement.elementData["titleName"], collapsibleState: vscode.TreeItemCollapsibleState.Expanded }));
            }else{
                sections.push(new InfoItem({ label: "Element", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.Collapsed }));
            }
            children = sections;
        }else{
            if(infoItem.label === "Element"){ // If element section...
                let elementInfo : InfoItem[] = [];
                if(this.selectedElement){
                    elementInfo.push(new InfoItem({ label: "Default", description: definitionToLowerCaseDescription(this.selectedElement.colorConfig.default), collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Theme", description: definitionToLowerCaseDescription(this.selectedElement.colorConfig.theme), collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Settings", description:"", collapsibleState: vscode.TreeItemCollapsibleState.Expanded}));
                    infoItem.iconPath = this.selectedElement.iconPath;
                }else{
                    elementInfo.push(new InfoItem({ label: "Default", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Theme", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    elementInfo.push(new InfoItem({ label: "Settings", description: "-", collapsibleState: vscode.TreeItemCollapsibleState.None }));
                    infoItem.iconPath = undefined;

                }
                children = elementInfo;
            }
            if(infoItem.label === "Settings"){
                let settingsItems : InfoItem[] = [];
                settingsItems.push(new InfoItem({label: "Global", description: definitionToLowerCaseDescription(this.selectedElement.colorConfig.settings.global), collapsibleState: vscode.TreeItemCollapsibleState.None}));
                settingsItems.push(new InfoItem({label: "Workspace", description: definitionToLowerCaseDescription(this.selectedElement.colorConfig.settings.workspace), collapsibleState: vscode.TreeItemCollapsibleState.None}));
                children = settingsItems;
            }
        }

        return children;

    }


    setElement(element : Element) {
        this.selectedElement = element;
        this.refresh();
    }


    setTheme() {
        this.currentTheme = new CurrentTheme();
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


function definitionToLowerCaseDescription(value : any) : string {
    if(value && typeof value === 'string'){
            return value.toLowerCase();
    }else{
        return "-";
    }
}
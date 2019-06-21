import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";

export class ElementProvider implements vscode.TreeDataProvider<vscode.TreeItem>{

    viewType : ViewType;

    constructor(viewType : ViewType){
        this.viewType = viewType;
    }

    getCustomizableElements(): any {
        let text : string = "";
        let allElementsJson : [];

        text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");

        allElementsJson = JSON.parse(text);

        return allElementsJson;
    }


    getTreeItem(): any {
        return "";
    }


    getChildren(element: ElementTreeItem): any {
        let customizableElements = this.getCustomizableElements();

        if(this.viewType === ViewType.Standard){
            for(let key in customizableElements){

            }
        }
        if(this.viewType === ViewType.Palette){

        }
    }


    getStandardViewItem(elementData : any, color?: string): ElementTreeItem{

        let standardViewItem : ElementTreeItem;

        if(color){
            let iconPath = this.getColorIcon(color);
            standardViewItem = new ElementTreeItem(elementData["groupedName"], color, iconPath, elementData["info"], vscode.TreeItemCollapsibleState.None);
        }else{
            standardViewItem = new ElementTreeItem(elementData["groupedName"], undefined, undefined, elementData["info"], vscode.TreeItemCollapsibleState.None);
        }

        return standardViewItem;

    }


    getPaletteViewItem(elementData : any, color?: string): any{
        let standardViewItem : ElementTreeItem;

        if(color){
            let iconPath = this.getColorIcon(color);
            standardViewItem = new ElementTreeItem(elementData["titleName"], color, iconPath, elementData["info"], vscode.TreeItemCollapsibleState.None);
        }else{
            standardViewItem = new ElementTreeItem(elementData["titleName"], undefined, undefined, elementData["info"], vscode.TreeItemCollapsibleState.None);
        }

        return standardViewItem;
    }


    getColorIcon(color : string) : string {

        let iconPath : string = "";

        let template_svg_text = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch_template.svg'), 'utf8');
        let new_svg_text = template_svg_text.replace('%CUSTOMCOLOR%', color);
        iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + color + '.svg');

        fs.writeFileSync(iconPath,new_svg_text);

        return iconPath;

    }


}

class ElementTreeItem extends vscode.TreeItem {

    constructor(
        label : string,
        collapsibleState : vscode.TreeItemCollapsibleState;
        ){
            super(label, collapsibleState);
            this.label = label;
            if(color){
                this.description = color;
            }
            if(iconPath){
                this.iconPath = iconPath;
            }else{
                iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch_transparent.svg');
            }
        }

}

class ElementTreeGroup extends vscode.TreeItem {

    constructor(
        label : string,
        color : any,
        iconPath: any,
        tooltip : string,
        collapsibleState : vscode.TreeItemCollapsibleState
        ){
            super(label, collapsibleState);
            this.label = label;
            if(color){
                this.description = color;
            }
            if(iconPath){
                this.iconPath = iconPath;
            }else{
                iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch_transparent.svg');
            }
        }

}

export enum ViewType {
    Standard = 0,
    Palette = 1,
}

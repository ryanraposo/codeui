import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { CurrentTheme } from './theme';
import { slateblue } from 'color-name';
import { deactivate } from './extension';

var allElements : any;
var colors : any;

export class ElementProvider implements vscode.TreeDataProvider<vscode.TreeItem>{

    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element| undefined> = this._onDidChangeTreeData.event;

    viewType : ViewType;
    standardItems : Element[] = [];
    paletteItems : Element[] = [];


    constructor(viewType : ViewType){
        this.loadCustomizableElements();
        this.loadColors();
        this.viewType = viewType;
    }


    refresh(element? : any): void {
        this._onDidChangeTreeData.fire(element);
    }


    getTreeItem(element : Element): vscode.TreeItem {
        return element;
    }


    getChildren(elementTreeGroup?: any): any {

        var children : any = [];

        if(this.viewType === ViewType.Standard){
            if(elementTreeGroup){
                for(let key in allElements){
                    let elementData = allElements[key];
                    if(allElements[key]['group'] === elementTreeGroup.label){
                        let child = new Element(elementData, vscode.TreeItemCollapsibleState.None, ViewType.Standard);
                        this.standardItems.push(child);
                        children.push(child);
                    }
                }
                return children;
            }else{
                return this.getStandardViewGroups();
            }
        }

        if(this.viewType === ViewType.Palette){
            if(elementTreeGroup){
                for(let key in allElements){
                    let elementData = allElements[key];
                    let child = new Element(elementData, vscode.TreeItemCollapsibleState.None, ViewType.Palette);
                    this.paletteItems.push(child);
                    children.push(child);
                }
                return children;
            }else{
                // return this.getPaletteViewGroups();
            }
        }

    }


    getStandardViewGroups(): ElementTreeGroup[] {

        let elementGroupNames = [];
        let elementTreeGroups : any = [];

        for(let key in allElements){
            let group = allElements[key]['group'];
            if(elementGroupNames.indexOf(group,) < 0){
                elementGroupNames.push(group);
                elementTreeGroups.push(new ElementTreeGroup(group, vscode.TreeItemCollapsibleState.Collapsed, undefined, undefined, "", ViewType.Standard));
            }
        }

        return elementTreeGroups;

    }


    // getPaletteViewGroups(): ElementTreeGroup[] {


    // }


    loadCustomizableElements(): any{

        let text : string = "";

        text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");

        allElements = JSON.parse(text);

    }


    loadColors(): any {

        let text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'colors.json'),"utf8");
        colors = JSON.parse(text);

    }


    updateElements(): void {

        for(let key in this.standardItems){
            let element = this.standardItems[key];
            element.update();
        }

        for(let key in this.paletteItems){
            let element = this.paletteItems[key];
            element.update();
        }

    }


    customizeElement(element : Element) : void {

        let targetElementName : string = element.elementData["fullName"];
        let colorItems : Array<string> = [];
        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
        let customization : string = "";

        for(let key in colors){
            colorItems.push(colors[key] + " (" + key + ")");
        }

        vscode.window.showQuickPick(["Enter a value...", "Pick from a list..."]).then((actionSelection : any) => {
            if(actionSelection === "Pick from a list..."){
                vscode.window.showQuickPick(colorItems).then((selection : any) => {
                if(selection){
                    let value = selection.substring(selection.indexOf("#"), selection.indexOf(")"));
                    customization = value;
                    currentCustomizations[targetElementName] = customization;
                    vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
                }
            });
            }else{
                vscode.window.showInputBox({placeHolder : "eg. #00ff00"}).then((selection) => {
                    if(selection){
                        customization = selection;
                        currentCustomizations[targetElementName] = customization;
                        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
                    }
                });
            }
        });


    }


}

export class Element extends vscode.TreeItem {

    viewType : ViewType;
    elementData : any;

    defaultColor : any;
    themeColor : any;
    settingsColor : any;
    effectiveColor : any;

    constructor(
        elementData : any,
        collapsibleState : vscode.TreeItemCollapsibleState,
        viewType : ViewType
        ){
            super('', collapsibleState);

            this.elementData = elementData;
            this.viewType = viewType;
            this.tooltip = elementData["info"];
            this.command = {title: "", command : "showElementInfo", arguments : [this]};


            if(viewType === ViewType.Standard){
                this.label = elementData["groupedName"];
            }
            if(viewType === ViewType.Palette){
                this.label = elementData["fullName"];
            }

            this.update();
        }


    update(): void { // Retrieves the items config values, and updates the color description and icon accordingly

        this.settingsColor = this.getUserSettingsColorConfig();
        this.themeColor = this.getThemeColorConfig();
        this.defaultColor = this.getDefaultColorConfig(true);

        if(this.settingsColor){
            this.description = this.settingsColor.toUpperCase();
            this.iconPath = this.getGeneratedIcon(true);
            return;
        }
        if(this.themeColor){
            this.description = this.themeColor.toUpperCase();
            this.iconPath = this.getGeneratedIcon(false);
            return;
        }
        if(this.defaultColor){
            this.description = this.defaultColor.toUpperCase();
            this.iconPath = this.getGeneratedIcon(false);
            return;
        }

    }


    private getGeneratedIcon(isCustomized : boolean): string {

        let iconPath : string = "";
        let template_svg_text : string = "";
        let new_svg_text : string = "";

        if(isCustomized){
            template_svg_text = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'color_customized.svg'), 'utf8');
            new_svg_text = template_svg_text.replace('#ffffff00', this.themeColor);
            new_svg_text = new_svg_text.replace('%CUSTOMIZATIONCOLOR%', this.settingsColor);
            iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + this.settingsColor + "-" + this.themeColor + '.svg');
        }else{
            template_svg_text = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'color_base.svg'), 'utf8');
            if(this.themeColor){
                new_svg_text = template_svg_text.replace('%COLOR%', this.themeColor);
            }else{
                new_svg_text = template_svg_text.replace('%COLOR%', this.defaultColor);
            }
            iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + this.themeColor + '.svg');
        }

        fs.writeFileSync(iconPath,new_svg_text);
        return iconPath;

    }


    private getUserSettingsColorConfig(): string | undefined {

        let userSettings : any;
        userSettings = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");

        let colorConfig : any;
        colorConfig = userSettings[this.elementData["fullName"]];

        return colorConfig;

    }


    private getThemeColorConfig(): string | undefined {

        let colorConfig : any;
        let currentTheme = new CurrentTheme();

        colorConfig = currentTheme.workbenchCustomizations[this.elementData["fullName"]];

        return colorConfig;

    }


    private getDefaultColorConfig(isDark : boolean): any{

        let fileText : string = "";
        let defaultColors : any;

        if(isDark){
            fileText = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'defaultColors_dark.json'), 'utf8');
        }

        defaultColors = JSON.parse(fileText);

        let defaultColorConfig = defaultColors[this.elementData["fullName"]];

        return defaultColorConfig;

    }


    contextValue = "element";

}


class ElementTreeGroup extends vscode.TreeItem {

    constructor(
        label : string,
        collapsibleState : vscode.TreeItemCollapsibleState,
        color : any,
        iconPath: any,
        tooltip : string,
        viewType : ViewType
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
    Palette = 1
}

import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as copypaste from 'copy-paste';
import { CurrentTheme } from './theme';


var allElements : any;
var colors : any;


export enum ViewType {
    Standard = 0,
    Palette = 1
}


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


    loadCustomizableElements(): any{

        let text : string = "";

        text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");

        allElements = JSON.parse(text);

    }


    loadColors(): any {

        let text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'colors.json'),"utf8");
        colors = JSON.parse(text);

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


}

export class Element extends vscode.TreeItem {

    viewType : ViewType;
    elementData : any;

    defaultColor : any;
    themeColor : any;
    settingsColor : any;

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

        this.description = "";

        if(this.defaultColor){
            this.defaultColor = this.defaultColor.toUpperCase();
            this.description = this.defaultColor;
        }
        if(this.themeColor){
            this.themeColor = this.themeColor.toUpperCase();
            this.description = this.themeColor;
        }
        if(this.settingsColor){
            this.settingsColor = this.settingsColor.toUpperCase();
            this.description = this.settingsColor;
        }

        this.iconPath = this.getGeneratedIcon();

    }


    customize(value?: string) : void {

        let targetElementName : string = this.elementData["fullName"];
        let colorItems : Array<string> = [];
        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
        let customization : string = "";

        if(value){
            currentCustomizations[targetElementName] = value;
            vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
        }else{
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
                    }});
                }
                if(actionSelection === "Enter a value..."){
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


    copy(): void {
        if(this.description){
            copypaste.copy(this.description);
        }

        vscode.window.showInformationMessage('CODEUI: Copied: ' + this.description);
    }


    paste(): void {
        this.customize(copypaste.paste());
    }


    clear(): void {
        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
        currentCustomizations[this.elementData["fullName"]] = undefined;
        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
    }


    private getGeneratedIcon(): string {

        let iconPath : string = "";
        let svgText : string = "";
        let baseColor : any;
        // Load template svg text
        svgText = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch.svg'), 'utf8');
        // Get & apply base color (if any)
        if(this.defaultColor){
            baseColor = this.defaultColor;
        }
        if(this.themeColor){
            baseColor = this.themeColor;
        }
        if(baseColor){
            svgText = svgText.replace('fill:%COLOR1%;fill-opacity:0', ('fill:' + baseColor + ';fill-opacity:1'));
        }
        // Apply customization color (if any)
        if(this.settingsColor){
            svgText = svgText.replace('<path style="fill:%COLOR2%;stroke-width:0.83446652;fill-opacity:0', '<path style="fill:' + this.settingsColor + ';stroke-width:0.83446652;fill-opacity:1');
        }
        // Write new svg text to a temp, generated svg file
        iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + baseColor + "-" + this.settingsColor + '.svg');
        fs.writeFileSync(iconPath,svgText);
        // Return the path
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

        if(currentTheme.themeObject){
            colorConfig = currentTheme.workbenchCustomizations[this.elementData["fullName"]];
            return colorConfig;
        }


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




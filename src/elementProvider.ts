import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as copypaste from 'copy-paste';
import { CurrentTheme } from './theme';



var colors : any;


export enum ViewType {
    Standard = 0,
    Palette = 1
}


export class ElementProvider implements vscode.TreeDataProvider<any>{

    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    viewType : ViewType;
    elements : Element[] = [];

    constructor(viewType : ViewType){
        this.viewType = viewType;
        this.loadColors();
        this.elements = this.loadCustomizableElements();
    }


    refresh(element? : any): void {
        this._onDidChangeTreeData.fire(element);
    }


    getTreeItem(element : Element): vscode.TreeItem {
        return element;
    }


    getChildren(elementTreeGroup?: any): any {

        let children : any = [];

        if(this.viewType === ViewType.Standard){
            if(elementTreeGroup){
                for(let key in this.elements){
                    let element = this.elements[key];
                    if(element.elementData["group"] === elementTreeGroup.label){
                        children.push(element);
                    }
                }
                return children;
            }else{
                return this.getStandardViewGroups();
            }
        }

        if(this.viewType === ViewType.Palette){
            if(elementTreeGroup){
                for(let key in elementTreeGroup.children){
                    let child = elementTreeGroup.children[key];
                    children.push(child);
                }
                return children;
            }else{
                return this.getPaletteViewGroups();
            }
        }

    }

    getPaletteGroupItems(elementTreeGroup : ElementTreeGroup) : any {

        let paletteGroupItems : any = [];

        for(let key in this.elements){
            let element = this.elements[key];
            if(element.description === elementTreeGroup.color){
                paletteGroupItems.push(element);
            }
        }

        return paletteGroupItems;

    }


    loadCustomizableElements(): any{

        let text : string = "";

        text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");

        let allElements = JSON.parse(text);

        let elementItems : Element[] = [];

        for(let key in allElements){
            let value = allElements[key];
            if(this.viewType === ViewType.Standard){
                elementItems.push(new Element(value, vscode.TreeItemCollapsibleState.None, ViewType.Standard));
            }
            if(this.viewType === ViewType.Palette){
                elementItems.push(new Element(value, vscode.TreeItemCollapsibleState.None, ViewType.Palette));
            }
        }

        return elementItems;

    }


    loadColors(): any {

        let text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'colors.json'),"utf8");
        colors = JSON.parse(text);

    }




    getStandardViewGroups(): ElementTreeGroup[] {

        let elementGroupNames = [];
        let elementTreeGroups : any = [];

        for(let key in this.elements){
            let group = this.elements[key].elementData['group'];
            if(elementGroupNames.indexOf(group,) < 0){
                elementGroupNames.push(group);
                elementTreeGroups.push(new ElementTreeGroup(group, vscode.TreeItemCollapsibleState.Collapsed, undefined, "", ViewType.Standard));
            }
        }

        return elementTreeGroups;

    }


    getPaletteViewGroups(): ElementTreeGroup[] {

        let elementColors = [];
        let elementTreeGroups = [];

        let colorCount : any = [];

        for(let key in this.elements){
            let color : any = this.elements[key].description;
            if(elementColors.indexOf(color,) < 0){
                elementColors.push(color);
                let label = color;
                if(!label){
                    label = "(unset)";
                }
                let elementTreeGroup = new ElementTreeGroup(label, vscode.TreeItemCollapsibleState.Collapsed, color, "", ViewType.Palette);
                elementTreeGroup.setChildren(this.getPaletteGroupItems(elementTreeGroup));
                elementTreeGroups.push(elementTreeGroup);
            }
        }

        elementTreeGroups = elementTreeGroups.sort((e1,e2) => {
            e1.description = "(" + e1.children.length + ")";
            e2.description = "(" + e2.children.length + ")";
            if(e1.children.length > e2.children.length){
                return -1;
            }
            else{
                return 1;
            }
        });



        return elementTreeGroups;

    }







}


function getEffectiveColor(elementName : string): string | undefined {

    let settingsColor : any = getUserSettingsColorConfig(elementName);
    let themeColor : any = getThemeColorConfig(elementName);
    let defaultColor : any = getDefaultColorConfig(elementName, true);

    let effectiveColor : any;

    for(let item in [defaultColor, themeColor, settingsColor]){
        if(item){
            effectiveColor = item;
        }
    }

    return effectiveColor;

}


function getUserSettingsColorConfig(elementName : string): string | undefined {

    let userSettings : any;
    userSettings = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");

    let colorConfig : any;
    colorConfig = userSettings[elementName];

    return colorConfig;

}


function getThemeColorConfig(elementName : string): string | undefined {

    let colorConfig : any;
    let currentTheme = new CurrentTheme();

    if(currentTheme.themeObject){
        colorConfig = currentTheme.workbenchCustomizations[elementName];
        return colorConfig;
    }


}


function getDefaultColorConfig(elementName : string, isDark : boolean): string | undefined{

    let fileText : string = "";
    let defaultColors : any;

    if(isDark){
        fileText = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'defaultColors_dark.json'), 'utf8');
    }

    defaultColors = JSON.parse(fileText);

    let defaultColorConfig = defaultColors[elementName];

    return defaultColorConfig;

}

export class Element extends vscode.TreeItem {

    viewType : any;
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
            this.viewType = viewType;

            if(this.viewType === ViewType.Standard){
                this.label = this.elementData["groupedName"];
            }

            if(this.viewType === ViewType.Palette){
                this.label = this.elementData["titleName"];
            }

            this.update();
        }


    update(): void { // Retrieves the items config values, and updates the color description and icon accordingly

        this.settingsColor = getUserSettingsColorConfig(this.elementData["fullName"]);
        this.themeColor = getThemeColorConfig(this.elementData["fullName"]);
        this.defaultColor = getDefaultColorConfig(this.elementData["fullName"], true);

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


    setViewType(viewType : ViewType) : void {


    }

    contextValue = "element";

}


class ElementTreeGroup extends vscode.TreeItem {

    size : any;
    children : any = [];
    color : any;

    constructor(
        label : string,
        collapsibleState : vscode.TreeItemCollapsibleState,
        color : any,
        tooltip : string,
        viewType : ViewType
        ){
            super(label, collapsibleState);
            this.label = label;
            this.color = color;
            if(color){
                this.iconPath = this.getGeneratedIcon();
            }

        }

        private getGeneratedIcon(): string {

            let iconPath : string = "";
            let svgText : string = "";
            let baseColor : any;
            // Load template svg text
            svgText = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch.svg'), 'utf8');
            // Get & apply base color (if any)

            svgText = svgText.replace('fill:%COLOR1%;fill-opacity:0', ('fill:' + this.color + ';fill-opacity:1'));


            // Write new svg text to a temp, generated svg file
            iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + this.color + '.svg');
            fs.writeFileSync(iconPath,svgText);
            // Return the path
            return iconPath;

        }

        setChildren(elements : Element[]) : void {
                this.children = elements;
                this.description = this.children.length.toString();
        }

}




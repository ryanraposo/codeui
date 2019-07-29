import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as copypaste from 'copy-paste';
import { CurrentTheme } from './theme';
import tinycolor from '@ctrl/tinycolor';


export class ElementProvider implements vscode.TreeDataProvider<any>{

    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    viewType : ViewType;

    colors : any;
    elementData : any = [];

    colorConfigs : ColorConfig[] = [];

    elementItems : any = [];


    constructor(viewType : ViewType){
        this.viewType = viewType;
        this.loadElementData();
        this.loadColors();
        this.loadColorConfigs();

        for(let key in this.elementData){
            let elementData = this.elementData[key];
            let treeItem = new Element(elementData, vscode.TreeItemCollapsibleState.None, this.viewType, this);
            this.elementItems[elementData["fullName"]] = treeItem;
        }

    }


    refresh(element? : any): void {

        this.loadColorConfigs();

        if(element){
            element.update();
            this._onDidChangeTreeData.fire(element);
        }
        else{
            for(let key in this.elementItems){
                this.elementItems[key].update();
            }
            this._onDidChangeTreeData.fire();
        }

    }


    getTreeItem(element : Element): vscode.TreeItem {
        return element;
    }


    getChildren(elementTreeGroup?: any): any {

        let children : any = [];

        if(this.viewType === ViewType.Standard){
            if(elementTreeGroup){
                for(let key in this.elementItems){
                    let value = this.elementItems[key];
                    if(value.elementData["group"] === elementTreeGroup.label){
                        children.push(value);
                    }
                }
                return children;
            }else{
                return this.getStandardViewGroups();
            }
        }

        if(this.viewType === ViewType.Palette){
            if(elementTreeGroup){
                return elementTreeGroup.children;
            }else{
                return this.getPaletteViewGroups();
            }
        }
    }




    loadColors(): any {

        let text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'colors.json'),"utf8");
        this.colors = JSON.parse(text);

    }


    loadElementData() : any {
        let fileText : string = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");
        let allElementsObject = JSON.parse(fileText);
        for(let key in allElementsObject){
            let value = allElementsObject[key];
            this.elementData[value["fullName"]] = value;
        }
    }


    loadColorConfigs() : void {

        function appendConfigs(elementNames: string[], defaultConfigs: any, themeConfigs: any, settingsConfigs : any) : Array<ColorConfig>{

            let colorConfig : any = {};

            for(let key in elementNames){
                let element : string = elementNames[key];

                if(themeConfigs){
                    colorConfig[element]={
                        default : defaultConfigs[element],
                        theme : themeConfigs[element],
                        settings : settingsConfigs[element]
                    };
                }else{
                    colorConfig[element]={
                        default : defaultConfigs[element],
                        theme : "",
                        settings : settingsConfigs[element]
                    };
                }
            }

            return colorConfig;

        }


        function getDefaultConfigs(): Object {

            let fileText : string = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'defaultColors_dark.json'), 'utf8');
            let defaultColorsObject = JSON.parse(fileText);

            return defaultColorsObject;
        }


        function getThemeConfigs(): any {

            let currentTheme = new CurrentTheme();
            let themeObject = currentTheme.themeObject;

            let themeColorsObject : any = undefined;
            
            if(themeObject){
                themeColorsObject = themeObject["colors"]; 
            }

            return themeColorsObject;

        }


        function getSettingsConfigs() : Object {

            let workbenchColorCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
            let settingsConfigs : any = {};

            for(let key in workbenchColorCustomizations){
                let value = workbenchColorCustomizations[key];

                if(key.startsWith("[")){
                    continue;
                }

                settingsConfigs[key] = value;
            }

            return settingsConfigs;

        }


        let elementNames : string[] = [];
        for(let key in this.elementData){
            let value = this.elementData[key];
            elementNames.push(value["fullName"]);

        }
        let defaultConfigs = getDefaultConfigs();
        let themeConfigs = getThemeConfigs();
        let settingsConfigs = getSettingsConfigs();

        this.colorConfigs = appendConfigs(elementNames, defaultConfigs, themeConfigs, settingsConfigs);

    }


    getStandardViewGroups(): ElementTreeGroup[] {

        let elementGroupNames = [];
        let elementTreeGroups : any = [];

        for(let key in this.elementItems){
            let group = this.elementItems[key].elementData['group'];
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

        for(let key in this.elementItems){
            let value = this.elementItems[key].colorConfig;
            let effectiveColor = getEffectiveColor(value);
            if(elementColors.indexOf(effectiveColor,) < 0){
                elementColors.push(effectiveColor);
                let label = effectiveColor;
                if(!label){
                    label = "(unset)";
                }
                let elementTreeGroup = new ElementTreeGroup(label, vscode.TreeItemCollapsibleState.Collapsed, effectiveColor, "", ViewType.Palette);
                elementTreeGroup.addChild(this.elementItems[key]);
                elementTreeGroups.push(elementTreeGroup);
            }
            else{
                elementTreeGroups.find((treeGroup) => {
                    if(treeGroup.label === effectiveColor){
                        treeGroup.addChild(this.elementItems[key]);
                    }
                });
            }
        }

        elementTreeGroups = elementTreeGroups.sort((e1,e2) => {
            // e1.description = "(" + e1.children.length + ")";
            // e2.description = "(" + e2.children.length + ")";
            if(e1.children.length > e2.children.length){
                return -1;
            }
            else{
                return 1;
            }
        });



        return elementTreeGroups;

    }


    getPaletteGroupItems(elementTreeGroup : ElementTreeGroup) : any {

        let paletteGroupItems : any = [];

        for(let key in this.colorConfigs){
            let value = this.colorConfigs[key];
            let effectiveColor = getEffectiveColor(value);
            if(effectiveColor === elementTreeGroup.color){
                // this.elements
            }
        }

        return paletteGroupItems;

    }


    customizeGroup(elementTreeGroup : ElementTreeGroup) {

        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
        
        let colorItems : Array<string> = [];
        let customization : string = "";

        for(let key in this.colors){
            colorItems.push(this.colors[key] + " (" + key + ")");
        }

        vscode.window.showQuickPick(["Enter a value...", "Pick from a list..."]).then((actionSelection : any) => {
            if(actionSelection === "Pick from a list..."){
                vscode.window.showQuickPick(colorItems).then((selection) => {
                if(selection){
                    let value = selection.substring(selection.indexOf("#"), selection.indexOf(")"));
                    customization = value;
                    for(let key in elementTreeGroup.children){
                        let value = elementTreeGroup.children[key];
                        currentCustomizations[value.elementData["fullName"]] = customization;
                    }
                    vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
                }});
            }
            if(actionSelection === "Enter a value..."){
                vscode.window.showInputBox({placeHolder : "eg. #00ff00"}).then((selection) => {
                    if(selection){
                        if(is_hexadecimal(selection)){
                            customization = selection;
                            for(let key in elementTreeGroup.children){
                                let value = elementTreeGroup.children[key];
                                currentCustomizations[value.elementData["fullName"]] = customization;
                            }
                            vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);        
                        }else{
                            showNotification("CodeUI: '" + selection + "' is not a valid color code! Use hex format (#00ff00)");
                        }
                    }
                });
            }
        });

        
                
    }

    darken(item : Element | ElementTreeGroup) {

        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");

        if(item instanceof Element){
            let darkenedValue = "#" + tinycolor(getEffectiveColor(item.colorConfig)).darken(5).toHex();
            currentCustomizations[item.elementData['fullName']] = darkenedValue;
        }
        
        if(item instanceof ElementTreeGroup){
            for(let key in item.children){
                let value = item.children[key];
                let darkenedValue = "#" + tinycolor(getEffectiveColor(value.colorConfig)).darken(5).toHex();
                currentCustomizations[value.elementData['fullName']] = darkenedValue;    
            }
        }
        
        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);

    }
    


    lighten(item : Element | ElementTreeGroup) {

        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");

        if(item instanceof Element){
            let lightenedValue = "#" + tinycolor(getEffectiveColor(item.colorConfig)).lighten(5).toHex();
            currentCustomizations[item.elementData['fullName']] = lightenedValue;
        }
        
        if(item instanceof ElementTreeGroup){
            for(let key in item.children){
                let value = item.children[key];
                let lightenedValue = "#" + tinycolor(getEffectiveColor(value.colorConfig)).lighten(5).toHex();
                currentCustomizations[value.elementData['fullName']] = lightenedValue;    
            }
        }
        
        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);

    }


    clearIconCache() : void {

        let generatedIconDirPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated');
        let dirContents : any = fs.readdirSync(generatedIconDirPath);
        
        if(dirContents){
            
        }
    }
        

}




export function getEffectiveColor(colorConfig:ColorConfig) : string | undefined {

    let effective : string | undefined;

    for(let key in colorConfig){
        let value = colorConfig[key];
        if(value){
            effective = value;
        }
    }

    return effective;

}


function is_hexadecimal(str: string) {
    
    let regexp = /^#[0-9a-fA-F]+$/;

    if (regexp.test(str))
      {
        return true;
      }
    else
      {
        return false;
      }
}


function showNotification(message : string) {

    const isEnabled = vscode.workspace.getConfiguration().get("codeui.showNotifications");

	if(isEnabled === true){
		vscode.window.showInformationMessage(message);
	}else{
		return;
	}

}


export class Element extends vscode.TreeItem {

    viewType : any;
    elementData : any;
    colorConfig : any;
    dataProvider : any;


    constructor(
        elementData : any,
        collapsibleState : vscode.TreeItemCollapsibleState,
        viewType : ViewType,
        dataProvider : vscode.TreeDataProvider<any>
        ){
            super('', collapsibleState);
            this.elementData = elementData;
            this.tooltip = elementData["info"];
            this.command = {title: "", command : "showElementInfo", arguments : [this]};

            if(viewType === ViewType.Standard){
                this.label = this.elementData["groupedName"];
            }

            if(viewType === ViewType.Palette){
                this.label = this.elementData["titleName"];
            }
            this.dataProvider = dataProvider;

            this.update();

    }


    update(): void {
        this.colorConfig = this.dataProvider.colorConfigs[this.elementData["fullName"]];
        if(getEffectiveColor(this.colorConfig)){
            this.description = getEffectiveColor(this.colorConfig);
        }else{
            this.description = "-";
        }
        this.iconPath = this.generateIcon();
    }


    customize(value?: string) : void {

        let targetElementName : string = this.elementData["fullName"];
        let colorItems : Array<string> = [];
        let customization : string = "";
        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");

        if(value){
            currentCustomizations[targetElementName] = value;
            vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
            return;
        }else{
            for(let key in this.dataProvider.colors){
                colorItems.push(this.dataProvider.colors[key] + " (" + key + ")");
            }

            vscode.window.showQuickPick(["Enter a value...", "Pick from a list..."]).then((actionSelection : any) => {
                if(actionSelection === "Pick from a list..."){
                    vscode.window.showQuickPick(colorItems).then((selection : any) => {
                    if(selection){
                        let value = selection.substring(selection.indexOf("#"), selection.indexOf(")"));
                        customization = value;
                        currentCustomizations[targetElementName] = customization;
                        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
                        showNotification("CodeUI: Success! " + selection + " applied to " + this.elementData["fullName"]);
                    }});
                }
                if(actionSelection === "Enter a value..."){
                    vscode.window.showInputBox({placeHolder : "eg. #00ff00"}).then((selection) => {
                        if(selection){
                            if(is_hexadecimal(selection)){
                                customization = selection;
                                currentCustomizations[targetElementName] = customization;
                                vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
                                showNotification("CodeUI: Success! " + selection + " applied to " + this.elementData["fullName"]);

                            }else{
                                showNotification("CodeUI: '" + selection + "' is not a valid color code! Use hex format (#00ff00)");
                            }
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

        vscode.window.showInformationMessage('CodeUI: Copied: ' + this.description);
    }


    paste(): void {
        this.customize(copypaste.paste());
    }


    clear(): void {
        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
        currentCustomizations[this.elementData["fullName"]] = undefined;
        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);
        this.update();
    }


    private generateIcon(): string {

        let iconPath : string = "";
        let svgText : string = "";
        let baseColor : any;
        // Load template svg text
        svgText = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch.svg'), 'utf8');
        // Get & apply base color (if any)
        if(this.colorConfig.default){
            baseColor = this.colorConfig.default;
        }
        if(this.colorConfig.theme){
            baseColor = this.colorConfig.theme;
        }
        if(baseColor){
            svgText = svgText.replace('fill:%COLOR1%;fill-opacity:0', ('fill:' + baseColor + ';fill-opacity:1'));
        }
        // Apply customization color (if any)
        if(this.colorConfig.settings){
            svgText = svgText.replace('<path style="fill:%COLOR2%;stroke-width:0.83446652;fill-opacity:0', '<path style="fill:' + this.colorConfig.settings + ';stroke-width:0.83446652;fill-opacity:1');
        }
        // Write new svg text to a temp, generated svg file
        iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + baseColor + "-" + this.colorConfig.settings + '.svg');
        fs.writeFileSync(iconPath,svgText);
        // Return the path
        return iconPath;

    }


    contextValue = "element";


}


export class ElementTreeGroup extends vscode.TreeItem {

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
            if(viewType === ViewType.Palette){
                this.contextValue =  "group";
            }
            // if(viewType === ViewType.Palette){
                //     this.setCommand(this.command = {title: "", command : "customizeGroup", arguments : [this]});
            // }

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

        addChild(element : Element) : void {
                this.children.push(element);
                this.description = this.children.length.toString();
        }

        setCommand(command : vscode.Command) : void {
            this.command = command;
        }


        customizeChildren(){


        }


}


export enum ViewType {
    Standard = 0,
    Palette = 1
}


interface ColorConfig {
    [index:number] : string;
    "default" : string | undefined;
    "theme" : string | undefined;
    "settings" : string | undefined;
}


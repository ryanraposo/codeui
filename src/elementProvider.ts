import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as copypaste from 'copy-paste';
import tinycolor from '@ctrl/tinycolor';
import { CurrentTheme } from './theme';
import { chooseTarget, showNotification } from './extension';


interface ColorConfig {
    [index:number] : string;
    "default" : string | undefined;
    "theme" : string | undefined;
    "settings" : {
        "global" : string | undefined;
        "workspace" : string | undefined;
    };
}


interface WorkbenchCustomizations{[key:string]:any;}


export enum ViewType {
    Standard = 0,
    Palette = 1
}


export class ElementProvider implements vscode.TreeDataProvider<any>{

    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    viewType : ViewType;

    colors : any;
    elementData : any = [];
    colorConfigs : any;
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

        this.colors = {};
        
        let userColors : any = vscode.workspace.getConfiguration().get("codeui.favoriteColors");
        if(userColors){
            for(let key in userColors){
                let value = userColors[key];
                if(isHexidecimal(value)){
                    this.colors[value] = "$(star)  " + key;
                }else{
                    showNotification("CodeUI: " + "user-defined color '" + key + ":" + value + " is not valid. Refer to the configuration tooltip");
                }
            }
        }        

        let presetColorsText = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'colors.json'),"utf8");        
        let presetColors = JSON.parse(presetColorsText);
        for(let key in presetColors){
            let value = presetColors[key];
            if(!this.colors[key]){
                this.colors[key] = value;             
            }
        }
        
    }


    loadElementData() : any {
        let fileText : string = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");
        let allElementsObject = JSON.parse(fileText);
        for(let key in allElementsObject){
            let value = allElementsObject[key];
            this.elementData[value["fullName"]] = value;
        }
    }


    loadColorConfigs() : any {

        let elementNames : string[] = [];
        for(let key in this.elementData){
            let value = this.elementData[key];
            elementNames.push(value["fullName"]);

        }
        let defaultConfigs = getDefaultConfigs();
        let themeConfigs = getThemeConfigs();
        let settingsConfigs = getSettingsConfigs();

        this.colorConfigs = appendConfigs(elementNames, defaultConfigs, themeConfigs, settingsConfigs);
        

        function appendConfigs(elementNames: string[], defaultConfigs: any, themeConfigs: any, settingsConfigs : any) : any{

            let colorConfigurations : any = {};

            for(let key in elementNames){
                let element : string = elementNames[key];
                let colorConfig : ColorConfig = {
                    default : undefined,
                    theme : undefined,
                    settings : {
                        global : undefined,
                        workspace : undefined
                    }
                };

                colorConfig.default = defaultConfigs[element];

                if(themeConfigs){
                    colorConfig.theme = themeConfigs[element];
                }

                if(settingsConfigs){
                    if(settingsConfigs.globalValue){
                        colorConfig.settings.global = settingsConfigs.globalValue[element];
                    }
                    if(settingsConfigs.workspaceValue){
                        colorConfig.settings.workspace = settingsConfigs.workspaceValue[element];
                    }
                }


                colorConfigurations[element] = colorConfig;
                
            }

            return colorConfigurations;

        }


        function getDefaultConfigs(): Object {

            let fileText : string = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'defaultColors_dark.json'), 'utf8');
            let defaultColorsObject = JSON.parse(fileText);

            return defaultColorsObject;
        }


        function getThemeConfigs(): Object {

            let currentTheme = new CurrentTheme();
            let workbenchCustomizations = currentTheme.workbenchCustomizations;

            if(workbenchCustomizations){
                return workbenchCustomizations;
            }else{
                return {};
            }

        }


        function getSettingsConfigs() : Object {

            let configurations : vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
            const workbenchColorCustomizations = configurations.inspect("workbench.colorCustomizations");

            if(workbenchColorCustomizations){
                return workbenchColorCustomizations;
            }else{
                return {};
            }

        }

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
            if(e1.children.length > e2.children.length){
                return -1;
            }
            else{
                return 1;
            }
        });

        return elementTreeGroups;

    }


    customize(item : Element | ElementTreeGroup) {
        
        let targetElements : Array<any> = [];
        let colorItems : Array<vscode.QuickPickItem> = [];
        let customizations : WorkbenchCustomizations = {};
        let userColor : string | undefined;         
        
        // Get preset quickpickItems (colors)
        for(let key in this.colors){
            let value = this.colors[key];
            colorItems.push({label:value,description:key});
        }        

        // Parse selected element(s)
        if(item instanceof(Element)){
            targetElements.push(item.elementData["fullName"]);
        }
        if(item instanceof(ElementTreeGroup)){
            for(let child of item.children){
                targetElements.push(child.elementData["fullName"]);
            }
        }

        // Get customization value from user
        vscode.window.showQuickPick([{label:"Enter a value..."}, {label:"Choose a preset..."}]).then((selection) => {
            if(selection){
                if(selection.label === "Enter a value..."){
                    vscode.window.showInputBox({placeHolder:"eg. #f2f2f2"}).then((selectedColor) => {
                        if(selectedColor){
                            userColor = selectedColor;
                            apply(this); // Write the customization to settings
                        }
                    });
                }
                if(selection.label === "Choose a preset..."){
                    vscode.window.showQuickPick(colorItems,{canPickMany:false}).then((selectedColor) => {
                        if(selectedColor){
                            userColor = selectedColor.description;
                            apply(this); // Write the customization to settings
                        }
                    });
                }
            }
        });


        function apply(provider : any) {
            for(let element of targetElements){
                customizations[element] = userColor;
            }
            provider.updateWorkbenchColors(customizations);
        }

    }


    adjustBrightness(item : Element | ElementTreeGroup) {


        vscode.window.showQuickPick(["Darken (10%)", "Lighten (10%)"]).then((actionSelection : any) => {
            if(actionSelection){
                if(actionSelection === "Darken (10%)"){
                    darken(item, this);
                }
                if(actionSelection === "Lighten (10%)"){
                        lighten(item, this);
                    }
            }
        });


        function darken(item : Element | ElementTreeGroup, provider : any) {

            let customizations : WorkbenchCustomizations = {};
    
            if(item instanceof Element){
                let darkenedValue = "#" + tinycolor(getEffectiveColor(item.colorConfig)).darken(5).toHex();
                customizations[item.elementData['fullName']] = darkenedValue;
            }
            
            if(item instanceof ElementTreeGroup){
                for(let key in item.children){
                    let value = item.children[key];
                    let darkenedValue = "#" + tinycolor(getEffectiveColor(value.colorConfig)).darken(5).toHex();
                    customizations[value.elementData['fullName']] = darkenedValue;    
                }
            }
            
            provider.updateWorkbenchColors(customizations);
        }
    
    
        function lighten(item : Element | ElementTreeGroup, provider : any) {
    
            let customizations : WorkbenchCustomizations = {};
    
            if(item instanceof Element){
                let lightenedValue = "#" + tinycolor(getEffectiveColor(item.colorConfig)).lighten(5).toHex();
                customizations[item.elementData['fullName']] = lightenedValue;
            }
            
            if(item instanceof ElementTreeGroup){
                for(let key in item.children){
                    let value = item.children[key];
                    let lightenedValue = "#" + tinycolor(getEffectiveColor(value.colorConfig)).lighten(5).toHex();
                    customizations[value.elementData['fullName']] = lightenedValue;    
                }
            }
            
            provider.updateWorkbenchColors(customizations);
            
        }


    }


    clear(item : Element){

        let elementName : string = item.elementData["fullName"];
        this.updateWorkbenchColors({[elementName]:undefined});

    }


    copy(item : Element): void {
        
        if(item.description){
            copypaste.copy(item.description);
        }

        showNotification("CodeUI: copied " + item.description);

    }    


    async updateWorkbenchColors(customizations: WorkbenchCustomizations){

        let workbenchColorCustomizations : any = vscode.workspace.getConfiguration().inspect("workbench.colorCustomizations");
        let targetColorCustomizations : any = {};

        const target = await chooseTarget();

        for(let element in customizations){
            let value = customizations[element];
            if(value === undefined){
                targetColorCustomizations[element] = undefined;
            }else{
                if(isHexidecimal(value)){
                    targetColorCustomizations[element] = value;
                }else{
                    showNotification("CodeUI: " + value + "is not a valid hex color!");
                    return; 
                }
            }
        }

        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", targetColorCustomizations, target);
            
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


    private update(): void {

        this.colorConfig = this.dataProvider.colorConfigs[this.elementData["fullName"]];
        if(getEffectiveColor(this.colorConfig)){
            this.description = getEffectiveColor(this.colorConfig);
        }else{
            this.description = "-";            
        }

        // debug
        if(this.elementData["fullName"] === "terminal.foreground"){
            console.log("term");                
        }
        // debug

        this.iconPath = this.generateIcon();
    }



    private generateIcon(): string {

        let iconPath : string = "";
        let svgText : string = "";
        let baseColor : string = "";
        let customizationColor : string = "";
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
            if(this.colorConfig.settings.global){
                customizationColor = this.colorConfig.settings.global;
                svgText = svgText.replace('<path style="fill:%COLOR2%;stroke-width:0.83446652;fill-opacity:0', '<path style="fill:' + this.colorConfig.settings.global + ';stroke-width:0.83446652;fill-opacity:1');
            }
            if(this.colorConfig.settings.workspace){
                customizationColor = this.colorConfig.settings.workspace;
                svgText = svgText.replace('<path style="fill:%COLOR2%;stroke-width:0.83446652;fill-opacity:0', '<path style="fill:' + this.colorConfig.settings.workspace + ';stroke-width:0.83446652;fill-opacity:1');
            }
        }
        // Write new svg text to a temp, generated svg file
        iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + baseColor + "-" + customizationColor + '.svg');
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
                this.contextValue =  "paletteGroup";
            }
            if(viewType === ViewType.Standard){
                this.contextValue =  "standardGroup";
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

        addChild(element : Element) : void {
                this.children.push(element);
                this.description = this.children.length.toString();
        }


}


function getEffectiveColor(colorConfig:ColorConfig) : string | undefined {

    let effective : string | undefined;

    for(let item of [colorConfig.default, colorConfig.theme, colorConfig.settings.global, colorConfig.settings.workspace]){
        if(item){
            effective = item;
        }
    }

    return effective;

}


function isHexidecimal(str: string) {
    
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

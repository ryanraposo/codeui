"use strict";

import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as copypaste from 'copy-paste';
import tinycolor from '@ctrl/tinycolor';

import { chooseScope, showNotification, getInfoProvider } from './extension';

import * as theme from './theme';
import * as configuration from './configuration';


interface ColorConfig {
    [index:number] : string;
    "default" : string | undefined;
    "theme" : string | undefined;
    "settings" : {
        "global" : string | undefined;
        "workspace" : string | undefined;
    };
}


export enum ViewType {
    Standard = 0,
    Palette = 1
}


interface WorkbenchCustomizations{[key:string]:any;}


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


    private getUserColors() {
        this.colors = {};
        let userColors: any = vscode.workspace.getConfiguration().get("codeui.favoriteColors");
        if (userColors) {
            for (let key in userColors) {
                let value = userColors[key];
                if (isHexidecimal(value)) {
                    this.colors[value] = "$(star)  " + key;
                }
                else {
                    showNotification("user-defined color '" + key + ":" + value + " is not valid. Refer to the configuration tooltip");
                }
            }
        }
    }


    private loadColors(): any {

        this.getUserColors();      

        let presetColorsText = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'colors.json'),"utf8");        
        let presetColors = JSON.parse(presetColorsText);
        for(let key in presetColors){
            let value = presetColors[key];
            if(!this.colors[key]){
                this.colors[key] = value;             
            }
        }
        
    }


    private loadElementData() : any {
        let fileText : string = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");
        let allElementsObject = JSON.parse(fileText);
        for(let key in allElementsObject){
            let value = allElementsObject[key];
            this.elementData[value["fullName"]] = value;
        }
    }


    private loadColorConfigs() : any {

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

            const currentThemeName : string = configuration.getEffectiveColorThemeName();

            for(let key in elementNames){
                let element : string = elementNames[key];
                let elementColorConfig : ColorConfig = {
                    default : undefined,
                    theme : undefined,
                    settings : {
                        global : undefined,
                        workspace : undefined
                    }
                };

                elementColorConfig.default = defaultConfigs[element];

                if(themeConfigs){
                    elementColorConfig.theme = themeConfigs[element];
                }

                if(settingsConfigs){
                    if(settingsConfigs.globalValue){
                        elementColorConfig.settings.global = settingsConfigs.globalValue[element];
                        // resolve theme-specific value 
                        if(settingsConfigs.globalValue["[" + currentThemeName + "]"]){
                            const themeSpecificCustomizations = settingsConfigs.globalValue["[" + currentThemeName + "]"];
                            if(themeSpecificCustomizations[element]){
                                elementColorConfig.settings.global = themeSpecificCustomizations[element];
                            }
                        }
                        // resolve theme-specific value 
                    }
                    if(settingsConfigs.workspaceValue){
                        elementColorConfig.settings.workspace = settingsConfigs.workspaceValue[element];
                        // resolve theme-specific value 
                        if(settingsConfigs.workspaceValue["[" + currentThemeName + "]"]){
                            const themeSpecificCustomizations = settingsConfigs.workspaceValue["[" + currentThemeName + "]"];
                            if(themeSpecificCustomizations[element]){
                                elementColorConfig.settings.workspace = themeSpecificCustomizations[element];
                            }
                        }
                        // resolve theme-specific value 
                    }
                }


                colorConfigurations[element] = elementColorConfig;
                
            }

            return colorConfigurations;

        }


        function getDefaultConfigs(): Object {

            let fileText : string = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'defaultColors_dark.json'), 'utf8');
            let defaultColorsObject = JSON.parse(fileText);

            return defaultColorsObject;
        }


        function getThemeConfigs(): Object {

            let currentTheme = theme.getCurrentColorTheme();
            let workbenchCustomizations = currentTheme.workbenchColorCustomizations;

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


    public getStandardViewGroups(): ElementTreeGroup[] {

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


    public getPaletteViewGroups(): ElementTreeGroup[] {

        let elementColors = [];
        let elementTreeGroups = [];

        let colorCount : any = [];

        for(let key in this.elementItems){
            let value = this.elementItems[key].colorConfig;
            let effectiveColor = getEffectiveColor(value);
            if(effectiveColor){
                effectiveColor = effectiveColor.toLowerCase();
            }
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


    public customize(item : Element | ElementTreeGroup) {
        
        let targetElements : Array<any> = [];
        let colorItems : Array<vscode.QuickPickItem> = [];
        let customizations : WorkbenchCustomizations = {};
        let userColor : string | undefined;  
        
        
        // Get preset quickpickItems (colors)
        for(let key in this.colors){
            let value = this.colors[key];
            colorItems.push({label:value,description:key});
        }        

        // Parse selected element(s) & if element, pass to InfoProvider
        const infoProvider = getInfoProvider();
        if(item instanceof(Element)){
            targetElements.push(item.elementData["fullName"]);
            infoProvider.updateSelectedElement(item);
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
                            apply(); // Write the customization to settings
                        }
                    });
                }
                if(selection.label === "Choose a preset..."){
                    vscode.window.showQuickPick(colorItems,{canPickMany:false}).then((selectedColor) => {
                        if(selectedColor){
                            userColor = selectedColor.description;
                            apply(); // Write the customization to settings
                        }
                    });
                }
            }
        });


        function apply() {
            for(let element of targetElements){
                customizations[element] = userColor;
            }
            ElementProvider.updateWorkbenchColors(customizations);
        }

    }


    public async adjustBrightness(item : Element | ElementTreeGroup) {
        if(item instanceof Element){
            const infoProvider = getInfoProvider();
            infoProvider.updateSelectedElement(item);
        }

        const darken10 = "Darken (10%)";
        const lighten10 = "Lighten (10%)";
        const darkenCustom = "Darken (Custom value)";
        const lightenCustom = "Lighten (Custom value)";
        const actionSelection = await vscode.window.showQuickPick([darken10, lighten10, darkenCustom, lightenCustom]);
        if(!actionSelection) {
            return;
        }
        if(actionSelection === lighten10) {
            lighten(item);
        }else if(actionSelection === darken10) {
            darken(item);
        }else if(actionSelection === lightenCustom) {
            const lightenCustomValueNumber = await showPercentInput();
            if(!lightenCustomValueNumber) {
                return;
            }
            lighten(item, lightenCustomValueNumber);
        }else if(actionSelection === darkenCustom) {
            const darkenCustomValueNumber = await showPercentInput();
            if(!darkenCustomValueNumber) {
                return;
            }
            darken(item, darkenCustomValueNumber);
        }

        async function showPercentInput() : Promise<number | undefined> {
            const percentString = await vscode.window.showInputBox({
                prompt: 'Enter a number (Percent)',
                validateInput(input : string) {
                    const percentNumber = parseFloat(input);
                    if(!isNaN(percentNumber) && isFinite(percentNumber)) {
                        return '';
                    }
                    return 'Value is not a valid number.';
                }
            });
            if(percentString) {
                return parseFloat(percentString);
            }
        }

        function darken(item : Element | ElementTreeGroup, value = 5) {

            let customizations : WorkbenchCustomizations = {};
    
            if(item instanceof Element){
                let darkenedValue = "#" + tinycolor(getEffectiveColor(item.colorConfig)).darken(value).toHex();
                customizations[item.elementData['fullName']] = darkenedValue;
            }
            
            if(item instanceof ElementTreeGroup){
                for(let key in item.children){
                    let value = item.children[key];
                    let darkenedValue = "#" + tinycolor(getEffectiveColor(value.colorConfig)).darken(value).toHex();
                    customizations[value.elementData['fullName']] = darkenedValue;    
                }
            }
            
            ElementProvider.updateWorkbenchColors(customizations);
        }
    
    
        function lighten(item : Element | ElementTreeGroup, value = 5) {
    
            let customizations : WorkbenchCustomizations = {};
    
            if(item instanceof Element){
                let lightenedValue = "#" + tinycolor(getEffectiveColor(item.colorConfig)).lighten(value).toHex();
                customizations[item.elementData['fullName']] = lightenedValue;
            }
            
            if(item instanceof ElementTreeGroup){
                for(let key in item.children){
                    let value = item.children[key];
                    let lightenedValue = "#" + tinycolor(getEffectiveColor(value.colorConfig)).lighten(value).toHex();
                    customizations[value.elementData['fullName']] = lightenedValue;    
                }
            }
            
            ElementProvider.updateWorkbenchColors(customizations);
            
        }


    }


    public clear(item : Element | ElementTreeGroup){

        if(item instanceof Element){
            const infoProvider = getInfoProvider();
            infoProvider.updateSelectedElement(item);
            let elementName : string = item.elementData["fullName"];
            ElementProvider.updateWorkbenchColors({[elementName]:undefined});
        }else{
            let customizations : any = {};
            for(let element of item.children){
                customizations[element.elementData["fullName"]] = undefined;
                ElementProvider.updateWorkbenchColors(customizations);
            }
        }

    }


    public copy(item : Element): void {        
        if(item.description){
            copypaste.copy(item.description);
        }

        showNotification("copied " + item.description);
    }    


    static async updateWorkbenchColors(customizations: WorkbenchCustomizations){

        const currentThemeProp = "[" + configuration.getEffectiveColorThemeName() + "]";
        
        const target = await resolveTarget();
        let scopedCustomizations : any = {};

        if(target === vscode.ConfigurationTarget.Global){
            scopedCustomizations = await configuration.getGlobalWorkbenchColorCustomizations();
        }
        if(target === vscode.ConfigurationTarget.Workspace){
            scopedCustomizations = await configuration.getWorkspaceWorkbenchColorCustomizations();
        }        
        
        for(let element in customizations){ // for key(element name) in supplied array
            let value = customizations[element]; // value = color value
                if(await isHexidecimal(value) || value === undefined){
                    const targetingMode = configuration.getTargetingMode();
                    if(targetingMode === 'themeSpecific'){
                        if(scopedCustomizations[currentThemeProp]){
                            scopedCustomizations[currentThemeProp][element] = value;
                        } else {
                            scopedCustomizations[currentThemeProp] = {};
                            scopedCustomizations[currentThemeProp][element] = value;
                        }
                    } else {
                        scopedCustomizations[element] = value;
                    }
                }else{
                    await showNotification(value + "is not a valid hex color!");
                    return; 
                }
            }        

        await vscode.workspace.getConfiguration().update("workbench.colorCustomizations", scopedCustomizations, target);
            
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
        let effectiveColor = getEffectiveColor(this.colorConfig);
        if(effectiveColor){
            this.description = effectiveColor.toLowerCase();
        }else{
            this.description = "-";            
        }

        this.iconPath = this.generateIcon();
    }


    private generateIcon(): string {

        let iconPath : string = "";
        let svgText : string = "";
        
        let baseColor : string = "";
        let topColor : string = "";
        
        const colorConfig = this.colorConfig;

        //Decides the base color & top color, with only customizations appearing as topcoats
        
        if(colorConfig.settings.global && colorConfig.settings.workspace){
            baseColor = colorConfig.settings.global;
            topColor = colorConfig.settings.workspace;
        }else{
            for(let item of [colorConfig.default, colorConfig.theme]){
                if(item){
                    baseColor = item;
                }
            }
            for(let item of [colorConfig.settings.global, colorConfig.settings.workspace]){
                if(item){
                    topColor = item;
                }
            }
        }        
        
        // Load template svg text
        svgText = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch.svg'), 'utf8');

        //Insert base color to svg text, change corresponding opacity to 1 from 0
        if(baseColor){
            
            svgText = svgText.replace('fill:%COLOR1%;fill-opacity:0', ('fill:' + baseColor + ';fill-opacity:1'));
        }

        //Insert top color to svg text,, change corresponding opacity to 1 from 0
        if(topColor){
            svgText = svgText.replace('<path style="fill:%COLOR2%;stroke-width:0.83446652;fill-opacity:0', '<path style="fill:' + topColor + ';stroke-width:0.83446652;fill-opacity:1');

        }

        // Write new svg text to a temp, generated svg file
        iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + baseColor + "-" + topColor + '.svg');
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


function resolveTarget() : any {

    const workspaceRootFolder = configuration.getWorkspaceRootFolder();
    const preferredScope = configuration.getPreferredScope();

    let target : any;
    
    if(workspaceRootFolder){
        if(preferredScope === "alwaysAsk"){
            target = chooseScope(workspaceRootFolder); 
            if(!target){
                return;
            }
        } else if(preferredScope === "global"){
            target = vscode.ConfigurationTarget.Global;
        } else if(preferredScope === "workspace"){
            target = target = vscode.ConfigurationTarget.Workspace;
        }
    }else if(!workspaceRootFolder){
        target = vscode.ConfigurationTarget.Global;
    }

    return target;

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

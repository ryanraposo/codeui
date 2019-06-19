import * as vscode from 'vscode';
import * as fs from 'fs';
import * as copypaste from 'copy-paste';
import * as path from "path";

import * as clr from "color";

var allElements: Element[] = [];


export class CustomizationProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;

    readonly colors : any = [];

    constructor() {
        this.colors = this.loadColors();
    }

    refreshCustomizations(): void {
        this.updateCustomizations();
        vscode.window.showInformationMessage("CodeUI: Customizations refreshed");
    }


    loadColors(): any {

        let colors : any = [];
        let text : string;
        let jsonObject;

        text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'colors.json'), 'utf8');

        jsonObject = JSON.parse(text);

        for(var item in jsonObject){
            let colorCode : string = item;
            let colorName : string = jsonObject[item];

            colors[colorName] = colorCode;
        }
        return colors;
    }


    getCustomizableElements(): any { // Returns object containing data from vscodeUIElements.json
        let text : string = "";
        let allElementsJson;

        text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeUIElements.json'),"utf8");

        allElementsJson = JSON.parse(text);

        return allElementsJson;
    }


    refresh(element?: Element): void {
        this._onDidChangeTreeData.fire(element);
    }


    getTreeItem(element: Element): vscode.TreeItem {
        return element;
    }


    getChildren(category? : Category): vscode.TreeItem[] {
        if(category){ //If category supplied, get its elements
            let returnElements =  this.getElementTreeItems(category);
            this.updateCustomizations();
            return returnElements;
        }else{ //If no category supplied, get the categories
            return this.getCategories();
        }
    }


    getCategories(): Category[] {

        let categories : Category[] = [];

        let customizableElements = this.getCustomizableElements();

        for(var propt in customizableElements){
            categories.push(new Category(propt,vscode.TreeItemCollapsibleState.Collapsed));
        }

        return categories;
    }


    getElementTreeItems(category : Category): Element[] {

        let categoryName : string = category.name;
        let categoryElements : any;
        let returnElements : Element[] = [];

        let customizableElements : any = this.getCustomizableElements();

        categoryElements = customizableElements[categoryName];

        // console.log(categoryElements);

        for(const key of Object.keys(categoryElements)){
            let fullName : string = key;
            let newElement : Element = new Element(categoryElements[key]["label"],undefined,categoryElements[key]['description'],vscode.TreeItemCollapsibleState.None,fullName,undefined);
            returnElements.push(newElement);
            allElements.push(newElement);
        }

        return returnElements;
    }


    updateCustomizations() : void { //Update elements in tree view with data from settings
        let customizationData = [];
        let configurationObject = undefined;
        configurationObject = Object(vscode.workspace.getConfiguration().get("workbench.colorCustomizations"));

        for(let item in configurationObject){ // Create array of key:value pairs based on workbench customizations
            customizationData.push({
                key : item,
                value : configurationObject[item]
            });
        }

        allElements.filter((elmnt : Element) => { // Gets loaded tree items with values, and clears them
            if(elmnt.description){
                elmnt.description = undefined;
                this.refresh(elmnt);
            }
        });

        for(var pair of customizationData){ // Uses retrieved configs to update corresponding tree items
            var elementName = pair.key;
            var value = pair.value;
            let elementToBeUpdated;

            elementToBeUpdated = allElements.find(i => i.name === elementName);
            if(elementToBeUpdated){
                elementToBeUpdated.description = value;
                elementToBeUpdated.setColor(value);
                elementToBeUpdated.generateSvg();
                this.refresh(elementToBeUpdated);
            }
        }
    }


    customizeElementFromList(element : Element): void { //

        let colorMenuStrings : string[] = [];
        let elementName : string;


        elementName = element.name;

        vscode.window.showInformationMessage("SELECTED ELEMENT: " + elementName);

        for(var color in this.colors){
            colorMenuStrings.push(color + " - " + this.colors[color]);
        }

        vscode.window.showQuickPick(colorMenuStrings).then((return_result) => {
            if(return_result){
                vscode.window.showInformationMessage("SELECTED COLOR: " + return_result);
                let colorCode :string = "";
                let return_split = return_result.split("-");
                colorCode = return_split[1].trim();
                let customizations : any = [];
                customizations[elementName] = colorCode;

                this.writeCustomizationsToSettings(customizations);
                this.updateCustomizations();
            }
        });
    }


    editCustomization(element : Element): void {

        let currentValue : any = element.description;

        vscode.window.showInputBox({placeHolder : currentValue}).then((returnResult) => {
            if(returnResult){
                if(returnResult.startsWith("#") && returnResult.length <= 7){
                    let customizations : any = [];
                    customizations[element.name] = returnResult;
                    this.writeCustomizationsToSettings(customizations);
                    // this.updateCustomizations();
                }
            }
        });

    }


    clearCustomization(element: Element) {

        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");

        currentCustomizations[element.name] = undefined;
        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);

        console.log("CODEUI: Customization cleared");
    }


    writeCustomizationsToSettings(customizations : any) {

        let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
        for(var cust in customizations){
            currentCustomizations[cust] = customizations[cust];
        }
        vscode.workspace.getConfiguration().update("workbench.colorCustomizations", currentCustomizations, vscode.ConfigurationTarget.Global);

    }

    copyValue(element : Element) {

        if(element.description){
            copypaste.copy(element.description);
        }

        vscode.window.showInformationMessage('CODEUI: COPY ' + element.name + ' ' + copypaste.paste());

    }

    pasteValue(element : Element) {

        vscode.window.showInformationMessage('CODEUI: PASTE ' + element.name + ' ' + copypaste.paste());

        let customization : any = [];

        customization[element.name] = copypaste.paste();
        this.writeCustomizationsToSettings(customization);


    }

}

export class ThemeViewDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>{

    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;

    themeViewJsonObject : any;
    themeName : any;

    constructor(themeJsonObject : any){
        this.themeViewJsonObject = themeJsonObject;
        this.themeName = this.themeViewJsonObject['name'];
    }

    setJsonObject(themeJsonObject : any) {
        this.themeViewJsonObject = themeJsonObject;
    }

    getThemeName(): any {
        return this.themeViewJsonObject['name'];
    }


    getTreeItem(element: Element): vscode.TreeItem {
        return element;
    }


    getChildren(paletteGroup?:any): any {


        if(paletteGroup){ // If palette group is supplied, get its member UI elements...
            let themeColors = this.themeViewJsonObject['colors'];
            let paletteGroupElements : any = [];
            for(let key in themeColors){
                let value = themeColors[key];
                if(paletteGroup.color === value){
                    paletteGroupElements.push(key);
                }
            }
            return this.getPaletteItems(paletteGroupElements);
        }else{ // If root, get palette groups...
            return this.getPaletteGroups();
        }

    }

    getPaletteGroups(): any {

        // Array to store objects representing colors in the theme and their affected elements
        let paletteColors : any = {};

        // Template object for each listed color
        for(let key in this.themeViewJsonObject['colors']){
            paletteColors[this.themeViewJsonObject['colors'][key]] = {'elements': [], 'count' : null};
        }

        // Add elements and element count to each object
        for(let key in this.themeViewJsonObject['colors']){
            let value = this.themeViewJsonObject['colors'][key];
            paletteColors[value]['elements'].push(key);
            paletteColors[value]['count'] = paletteColors[value]['elements'].length;
        }

        // SORT BY 'COUNT'
        let largestGroup : number = 0;
        let sortedPalette : any = [];
        let temp : any = {};

        for(let key in paletteColors){ // Get largest palette group count
            let groupColor = key;
            let groupSize = paletteColors[key]['count'];

            if(groupSize > largestGroup){
                largestGroup = groupSize;
            }
        }
        let sizeRange : Array<number> = []; // Create array of numbers from largest count to 1
        let x = largestGroup;
        while(x > 0){
            sizeRange.push(x);
            x-=1;
        }
        for(let size in sizeRange){ // For each number in the array, add palette colors with the corresponding group size to a new (sorted) list
            for(let color in paletteColors){
                if(paletteColors[color]['count'] === sizeRange[size]){
                    sortedPalette[color] = paletteColors[color];
                }
            }
        }
        // SORT BY 'COUNT'

        // CREATE TREE ITEM (Palette Group) FOR EACH ITEM IN THE SORTED LIST
        var paletteGroups : any = [];
        var groupNo = 1;
        for(let key in sortedPalette){
            let value = sortedPalette[key];
            paletteGroups.push(new PaletteGroup(('Palette group #' + groupNo),key,vscode.TreeItemCollapsibleState.Collapsed));
            groupNo += 1;
        }
        // CREATE TREE ITEM (Palette Group) FOR EACH ITEM IN THE SORTED LIST

        return paletteGroups;

    }

    getPaletteItems(elementFullNames : string[]): any {

        let text : string = "";
        let allElementsJson;
        let elementData : any = {};
        let paletteItems : PaletteItem[] = [];

        text = fs.readFileSync(path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),"utf8");

        allElementsJson = JSON.parse(text);

        for(let name in elementFullNames){
            for(let element in allElementsJson){
                let value = allElementsJson[element];
                if(value['fullName'] === elementFullNames[name]){
                    let fullName : string = value['fullName'];
                    let titleName : string = value['titleName'];
                    let groupedName : string = value['groupedName'];
                    let info : string = value['info'];
                    let group : string = value['group'];
                    paletteItems.push(new PaletteItem(titleName,fullName,info,vscode.TreeItemCollapsibleState.None));
                }
            }
        }

        return paletteItems;
    }


    async customizeTargetPaletteGroup(element : any){

        var elementGroup : any = [];
        var customizations : any = [];
        var color : string;

        // Get all theme elements with matching color
        if(element.description){
            color = element.description;
            for(let key in this.themeViewJsonObject['colors']){
                let value = this.themeViewJsonObject['colors'][key];

                if(value === element.description){
                    elementGroup.push(key);
                    console.log(key);
                }

            }
        }



        // Prompt user for new color
        var updatedColor : any;
        await vscode.window.showInputBox({placeHolder : element.description}).then((returnResult) => {
            if(returnResult){
                if(returnResult.startsWith("#") && returnResult.length <= 7){
                    updatedColor = returnResult;
                }else{
                    vscode.window.showInformationMessage('CodeUI: Invalid color code entered!');
                    return;
                }
            }
        });

        for(var name of elementGroup){
            customizations[name] = updatedColor;
        }

        vscode.commands.executeCommand("writeCustomizationsToSettings", customizations);
    }

    darkenAllElementsWithColor(element : any) : void {

        // Get all elements in target's Palette Group and their shared color
        let customizations : any = [];
        if(element.description){
            for(let key in this.themeViewJsonObject['colors']){
                let value = this.themeViewJsonObject['colors'][key];
                if(value === element.description){
                    customizations[key] = this.darkenColor(value);
                }
            }
        }

        // Override any values found to be customized in settings
        var currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
        for(var item in customizations){
            if(currentCustomizations[item]){
                customizations[item] = this.darkenColor(currentCustomizations[item]);
            }
        }

        // Write darkened customizations to settings
        vscode.commands.executeCommand('writeCustomizationsToSettings', customizations);
    }

    darkenColor(colorValue : string): any {

        let c = clr(colorValue, "hex").darken(.1).hex();
        console.log(colorValue + " -> " + c);

        return c;
    }

    removeDups(names : any) {
        let unique : any = {};
        names.forEach(function(i : any) {
          if(!unique[i]) {
            unique[i] = true;
          }
        });
        return Object.keys(unique);
      }



}


class Element extends vscode.TreeItem {

    [x : string] : any;
    name : string;
    color : any;

    constructor(
        label: string,
        color: string | undefined,
        elementInfo : string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        fullname: string,
        command?: vscode.Command,
    ) {
        super(label, collapsibleState);
        this.description = color;
        this.tooltip = elementInfo;
        this.name = fullname;
        this.color = color;
        this.generateSvg();
        }

    contextValue = "element";

    setColor(colorValue: string){
        this.color = colorValue;
    }

    generateSvg() {
        if(this.color){
            let template_text = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch_template.svg'), 'utf8');
            console.log(template_text);

            let new_svg_text = template_text.replace('%CUSTOMCOLOR%', this.color);

            let new_svg_path = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + this.color + '.svg');

            fs.writeFileSync(new_svg_path,new_svg_text);

            this.iconPath = new_svg_path;
        }else{
            this.iconPath = path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch_transparent.svg');
        }
    }

}


class Category extends vscode.TreeItem {

    name : string;

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.name = label;
    }

    iconPath = {
        light : path.join(__filename, '..', '..', 'resources', 'bullet-list.png'),
        dark : path.join(__filename, '..', '..', 'resources', 'bullet-list.png')
        };

}

class PaletteGroup extends vscode.TreeItem {

    color : string;

    constructor(
        label: string,
        description: string,
        collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.color = description;
        this.getDynamicSvg();
    }

    // iconPath = {
    //     light : path.join(__filename, '..', '..', 'resources', 'bullet-list.png'),
    //     dark : path.join(__filename, '..', '..', 'resources', 'bullet-list.png')
    //     };


    getDynamicSvg() {
        let template_text = fs.readFileSync(path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch_template.svg'), 'utf8');
        console.log(template_text);

        let new_svg_text = template_text.replace('%CUSTOMCOLOR%', this.color);

        let new_svg_path = path.join(__filename, '..', '..', 'resources', 'swatches', 'generated', 'generated_' + this.color + '.svg');

        fs.writeFileSync(new_svg_path,new_svg_text);

        this.iconPath = new_svg_path;
    }
}

class PaletteItem extends vscode.TreeItem{

    constructor(label : string, description: string, tooltip: string, collapsibleState : vscode.TreeItemCollapsibleState){
        super(label, collapsibleState);

        this.label = label;
        this.description = description;
        this.tooltip = tooltip;
        this.collapsibleState = collapsibleState;
    }
}

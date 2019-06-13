import * as vscode from 'vscode';
import * as fs from 'fs';
import * as copypaste from 'copy-paste';
import * as path from "path";

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
            let returnElements =  this.getElements(category);
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


    getElements(category : Category): Element[] {

        let categoryName : string = category.name;
        let categoryElements : any;
        let returnElements : Element[] = [];

        let customizableElements : any = this.getCustomizableElements();
        
        categoryElements = customizableElements[categoryName];

        console.log(categoryElements);

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


class Element extends vscode.TreeItem {

    [x : string] : any;
    name : string;
    
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
    }

    contextValue = "element";
    
    
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
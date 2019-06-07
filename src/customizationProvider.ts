import * as vscode from 'vscode';
import * as fs from 'fs';
import { strict } from 'assert';
import { settings } from 'cluster';

const myPath : string = "C:/Users/Ryan/AppData/Roaming/Code/User/settings.json";
const testPath : string = "c:/source/codeui/settingsTest.json";

var customizableElementsObject : any;
var allElements: Element[] = [];
var colors : any = [];

// var customizedElementsData: any;

export class CustomizationProvider implements vscode.TreeDataProvider<Element> {

    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;
    
    constructor() {
        customizableElementsObject = this.loadCustomizableElements();
        colors = this.loadColors();
    }

    loadColors(): any {

        let colors : any = [];
        let text : string;
        let jsonObject;

        text = fs.readFileSync('c:/source/codeui/colors.json', 'utf8');

        jsonObject = JSON.parse(text);

        for(var item in jsonObject){
            // console.log(jsonObject[item] + " (" + item + ")");
            let colorCode : string = item;
            let colorName : string = jsonObject[item];

            colors[colorName] = colorCode;
        }                
        return colors;
    }
    
    
    loadCustomizableElements(): any {
        let text : string = "";
        let allElementsJson;
        
        text = fs.readFileSync('c:/source/codeui/allElements.json', "utf8");
        
        allElementsJson = JSON.parse(text);
        
        return allElementsJson;
    }
    

    getCustomizedElementData(): any {

        let text : string = "";
        let jsonSettings;
        let customizedElementsObject : any;
        var customizedElementsData : any = {};

        text = fs.readFileSync(myPath, 'utf8');

        jsonSettings = JSON.parse(text);

        customizedElementsObject = jsonSettings['workbench.colorCustomizations'];

        if(!customizedElementsObject){
            vscode.window.showInformationMessage("codeUI: No customized elements found.");
            return undefined;
        }

        for(var i in customizedElementsObject){
            customizedElementsData[i] = customizedElementsObject[i];
            console.log(i,customizedElementsObject[i]);
        }

        return customizedElementsData;

    }


    writeCustomizationsToSettings(customizations : any) {

        let initial_text : string = fs.readFileSync(myPath, 'utf8');
        let final_text : string;
        let jsonObject;

        jsonObject = JSON.parse(initial_text);

        if(jsonObject){
            for(var customization in customizations){
                var val : string = customizations[customization];
                var key : string = customization;
                jsonObject['workbench.colorCustomizations'][key] = val;
            }
        }
        
        final_text = JSON.stringify(jsonObject,undefined,4);

        fs.writeFileSync(myPath, final_text, 'utf8');
    }


    refresh(element?: Element): void {
        this._onDidChangeTreeData.fire(element);
    }


    getTreeItem(element: Element): vscode.TreeItem {
        return element;
    }


    getChildren(category? : Category): Element[] {
        if(category){ //If element supplied...
            let returnElements =  this.getElements(category);
            this.updateCustomizedElements();
            return returnElements;
        }else{ //If not (root)...
            // this.updateCustomizedElements();
            return this.getCategories();
        }
    }


    getCategories(): Category[] {

        let categories : Category[] = [];

        for(var propt in customizableElementsObject){
            categories.push(new Category(propt,vscode.TreeItemCollapsibleState.Collapsed));
        }

        return categories;
    }


    getElements(category : Category): Element[] {

        let categoryName : string = category.name;
        let categoryElements : any;
        let returnElements : Element[] = [];

        categoryElements = customizableElementsObject[categoryName];

        for(var categoryElement of categoryElements){
            let fullName : string = categoryName + "." + categoryElement;
            let newElement : Element = new Element(categoryElement,undefined,vscode.TreeItemCollapsibleState.None,undefined,fullName);
            returnElements.push(newElement);
            allElements.push(newElement);
        }

        return returnElements;
    }


    updateCustomizedElements() : void {
       
        let customizedElementsData = this.getCustomizedElementData();

        
        for(var element in customizedElementsData){
           let elementToBeUpdated;
           elementToBeUpdated = allElements.find(i => i.tooltip === element);

           if(elementToBeUpdated){
               console.log(elementToBeUpdated);
               elementToBeUpdated.description = customizedElementsData[element];
               this.refresh(elementToBeUpdated);
           }
        }
    }


    customizeElement(element : Element): void {
        let colorMenuStrings : string[] = [];
        let elementName : string;
        
        if(element.tooltip){
            elementName = element.tooltip;        

            vscode.window.showInformationMessage("SELECTED ELEMENT: " + elementName);

            for(var color in colors){
                colorMenuStrings.push(color + " - " + colors[color]);
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
                    this.updateCustomizedElements();
                }
            });
        }
    }
}

class Element extends vscode.TreeItem {

    [x : string] : any;
    
    constructor(
        label: string,
        color: string | undefined,
        collapsibleState: vscode.TreeItemCollapsibleState,
        command?: vscode.Command,
        fullname?: any,
    ) {
        super(label, collapsibleState);
        this.description = color;
        this.tooltip = fullname;
        // this.x = fullname;
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

}
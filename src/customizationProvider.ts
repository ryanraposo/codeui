import * as vscode from 'vscode';
import * as fs from 'fs';
import { strict } from 'assert';

const myPath : string = "C:/Users/Ryan/AppData/Roaming/Code/User/settings.json";
const testPath : string = "c:/source/codeui/settingsTest.json";

var customizableElementsObject : any;
var allElements: Element[] = [];
// var customizedElementsData: any;

export class CustomizationProvider implements vscode.TreeDataProvider<Element> {

    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;
    
    constructor() {
        customizableElementsObject = this.loadCustomizableElements();
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

        text = fs.readFileSync(testPath, 'utf8');

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
           elementToBeUpdated = allElements.find(i => i.x === element);

           if(elementToBeUpdated){
               console.log(elementToBeUpdated);
               elementToBeUpdated.description = customizedElementsData[element];
               this.refresh(elementToBeUpdated);
           }
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
        this.x = fullname;
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
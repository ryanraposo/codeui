import * as vscode from 'vscode';
import * as fs from 'fs';

const myPath : string = "C:/Users/Ryan/AppData/Roaming/Code/User/settings.json";
const testPath : string = "c:/source/codeui/settingsTest.json";

var currentElements: Element[] = [];
var allElements: Element[] = [];

export class CustomizedElementProvider implements vscode.TreeDataProvider<Element> {

    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;

    constructor() {
        
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Element): vscode.TreeItem {
        return element;
    }
    
    
    getChildren(): Element[] { //departed working: added parameter
        let elements : Element[];
        elements = this.getCustomizedElements();
        return elements;
    }
    

    getCustomizedElements(): Element[] { //Updates existing treeitems, and returns an array of elements that represent all

        let text : string = "";
        let jsonObject;
        let isCustomized : boolean = false;
        let customizations : any;
        let elements : Element[] = [];

        // Get text:string from json file
        text = fs.readFileSync(myPath, "utf8");

        // Check if customizations are present
        jsonObject = JSON.parse(text);
        for(var propt in jsonObject){
            if(propt === 'workbench.colorCustomizations'){
                isCustomized = true;
            }
        }

        // If so, save them to a json object
        if(isCustomized){
            customizations = jsonObject['workbench.colorCustomizations'];
        }

        // Create a new treeItem for each
        for(var key in customizations){
            console.log('Key: ' + key + ' Value: ' + customizations[key]);
            // //If the jsonObject key (modification) exists in our currentElements array, change the description of the treeitem repr of the 'currentElement'
            // elements.push(new Element(key,customizations[key],vscode.TreeItemCollapsibleState.None));
            let element = new Element(key,customizations[key],vscode.TreeItemCollapsibleState.None);
            element.command = {
                command: 'elementProvider.editValue',
                title: '',
                arguments: [element.label]
            };
            currentElements.push(element);
            elements.push(element);
        }
        // Return them
        return elements;
    }
    

    loadColors(): string[]{

        let colors = [];
        let text : string;
        let jsonObject;

        text = fs.readFileSync('c:/source/codeui/colors.json', 'utf8');

        jsonObject = JSON.parse(text);

        for(var item in jsonObject){
            console.log(jsonObject[item] + " (" + item + ")");
            colors.push(jsonObject[item] + " (" + item + ")");
        }        

        return colors;
    }


    editValue(key : string): void {

        vscode.window.showInputBox().then((return_result) => {
            if(return_result){
                this.setCustomizedElements(key, return_result);
                vscode.commands.executeCommand('getCustomizedElements');
            }
        });

    }


    pickColorFromList(element : any, allViewElement : Element): void {

        vscode.window.showInformationMessage("pickColorFromList succesfully called.");

        let colors : string[];
        colors = this.loadColors();    
        
        vscode.window.showQuickPick(colors,undefined,undefined).then((returnResult) => {
            if(returnResult){
                vscode.window.showInformationMessage('codeUI: Color picked: ' + returnResult);
                
                let colorValue = "";
                let start : number = 0;
                let end : number = 0;
                
                start = returnResult.indexOf("(");
                end = returnResult.indexOf(")");

                colorValue = returnResult.substring(start+1,end);

                //Customize the element and update customizedView tree
                this.setCustomizedElements(element.label,colorValue);
                vscode.commands.executeCommand('getCustomizedElements');
                

                // Update allView tree               
                for(var allElement of allElements){
                    if(allElement.tooltip === element.label){
                        allViewElement = allElement;
                    }
                }
                vscode.commands.executeCommand("updateElement", allViewElement, colorValue);
            }
        });
        
    }
    

    setCustomizedElements(key : string, val : string): void {
        let initial_text : string = fs.readFileSync(myPath, 'utf8');
        let final_text : string;
        let jsonObject;

        jsonObject = JSON.parse(initial_text);

        jsonObject['workbench.colorCustomizations'][key] = val;

        final_text = JSON.stringify(jsonObject,undefined,4);

        fs.writeFileSync(myPath, final_text, 'utf8');

    }

    
    
}

export class AllElementProvider implements vscode.TreeDataProvider<Element> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<Element | undefined> = new vscode.EventEmitter<Element | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Element | undefined> = this._onDidChangeTreeData.event;


    constructor() {
        
    }

    refresh(element:Element): void {
        this._onDidChangeTreeData.fire(element);
    }

    getTreeItem(element: Element): Element{
        return element;
    }
    
    getChildren(element?: Element): Element[]{
        let elements : Element[] = [];
        if(element){
            elements = this.getElementProperties(element);
        }else{
            elements = this.getBaseElements();
        }
        return elements;
    }

    // getElementFromFullName(fullName : string): Element {
    //     let matchingElement : Element;


        
    //     return matchingElement;
    // }

    updateElement(element: Element, colorStr : string): void {
        this.getTreeItem(element).description = colorStr;
        this.refresh(element);        
    }

    getBaseElements(): Element[] {
        let text : string = "";
        let jsonObject;
        let elements : Element[] = [];

        text = fs.readFileSync('c:/source/codeui/allElements.json', "utf8");

        jsonObject = JSON.parse(text);
        for(var propt in jsonObject){
            elements.push(new Element(propt,"",vscode.TreeItemCollapsibleState.Collapsed));
        }

        return elements;
    }

    getElementProperties(element : Element): Element[] {
        let childElements : Element[] = [];
        let subproperties : [] = [];
        let text : string = "";
        let jsonObject;
        
        text = fs.readFileSync('c:/source/codeui/allElements.json', "utf8");
        
        jsonObject = JSON.parse(text);
        
        for(var propt in jsonObject){
            if(propt === element.label){
                let baseName : string;
                baseName = element.label;
                let elementToBeCustomized : Element | undefined;
                let customColor : string = "-";
                subproperties = jsonObject[propt];
                subproperties.forEach(function (item, index) { // For each subproperty of the base element...
                    customColor = "-";
                    let found : boolean = false;
                    for(var el of currentElements){
                        if(el.label === baseName + "." + item){
                            if(typeof el.description === "string"){ //If element is customized, get it $its listed color 
                                customColor = el.description;     
                                elementToBeCustomized = el;   
                                found = true;                                   
                                break;
                            }
                        }
                    }
                    if(found === false){
                        elementToBeCustomized = undefined;

                    }
                    let newElement = new Element(item,customColor,vscode.TreeItemCollapsibleState.None,undefined,baseName + "." + item);
                    newElement.command = {
						command: 'pickColorFromList',
						title: '',
                        arguments: [elementToBeCustomized, element, customColor]
                    };
                    childElements.push(newElement);
                    allElements.push(newElement);
                });
                break;
            }
        }

        return childElements;
    }

}

class Element extends vscode.TreeItem {
    
    constructor(
        label: string,
        color: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        command?: vscode.Command,
        fullname?: string, 
    ) {
        super(label, collapsibleState);
        this.description = color;
        this.tooltip = fullname;
    }

}
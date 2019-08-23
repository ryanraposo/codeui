import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getEffectiveColorTheme } from "./configuration";


export class CurrentTheme {

    name : any;
    author : any;
    type : any;
    workbenchCustomizations : any;


    constructor(){

        const userSettingsThemeName = getEffectiveColorTheme();

        const themePath = this.getThemePath(userSettingsThemeName);
        const themeObject = this.getThemeObject(themePath);

        const name = this.getName(themeObject);
        const type = this.getType(themeObject);
        const author = this.getAuthor(themeObject);
        const workbenchCustomizations = this.getWorkbenchColorCustomizations(themeObject);

        this.name = name;
        this.type = type;
        this.author = author;
        this.workbenchCustomizations = workbenchCustomizations;
        
    }


    private getThemeObject(themePath : any): any {
        let text : string = '';

        if(themePath){
            text = fs.readFileSync(themePath, 'utf8');
            text = text.replace(/\\n/g, "\\n")  
               .replace(/\\'/g, "\\'")
               .replace(/\\"/g, '\\"')
               .replace(/\\&/g, "\\&")
               .replace(/\\r/g, "\\r")
               .replace(/\\t/g, "\\t")
               .replace(/\\b/g, "\\b")
               .replace(/\\f/g, "\\f");
            text = text.replace(/[\u0000-\u0019]+/g,""); 
            const jsonObject = JSON.parse(text);
            return jsonObject;
        }
    }

    
    private getWorkbenchColorCustomizations(themeObject : any) : any {
        const workbenchCustomizations = themeObject["colors"]; 
        return workbenchCustomizations;
    }


    private getName(themeObject : any) {
        const name = themeObject["name"];
        return name;
    }


    private getType(themeObject: any) {
        const type = themeObject["type"];
        return type;
    }


    private getAuthor(themeObject : any) {
        const author = themeObject["author"];
        return author;
    }


    private getThemePath(userSettingsTheme : any): any{
        
        let themePath : any = undefined;

        try{
            for(var extension of vscode.extensions.all){
                let contributions : any = extension.packageJSON["contributes"];
                if(contributions){
                    if(contributions["themes"]){
                        for(let theme of contributions["themes"]){
                            if(theme["label"] === userSettingsTheme){
                                return path.join(extension.extensionPath, theme["path"]);
                            }
                        }
                    }
                }              
            }
        }
        catch{
            return undefined;
        }

    }


}
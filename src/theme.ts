import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as configuration from './configuration';
import * as jsonc from "jsonc-parser";


export function getCurrentColorTheme() : ColorTheme {

    const effectiveColorThemeName = configuration.getEffectiveColorThemeName();
    
    const currentColorTheme = new ColorTheme(effectiveColorThemeName);
    
    return currentColorTheme;
    
}


export class ColorTheme {

    private themePath : any;
    private themeObject : any;
    name : string;

    constructor(colorThemeName: string){

        this.name = colorThemeName;
        this.themePath = this.getThemePath(colorThemeName);
        this.themeObject = this.getThemeObject(this.themePath);
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


    private getThemeObject(themePath : any): any {
        let text : string = '';

        if(themePath){
            text = fs.readFileSync(themePath, 'utf8');
            // text = text.replace(/\\n/g, "\\n")  
            //    .replace(/\\'/g, "\\'")
            //    .replace(/\\"/g, '\\"')
            //    .replace(/\\&/g, "\\&")
            //    .replace(/\\r/g, "\\r")
            //    .replace(/\\t/g, "\\t")
            //    .replace(/\\b/g, "\\b")
            //    .replace(/\\f/g, "\\f");
            // text = text.replace(/[\u0000-\u0019]+/g,""); 
            // text = JSON.stringify(text);
            let jsonObject = jsonc.parse(text);
            return jsonObject;
        }
    }

    
    get workbenchColorCustomizations() : any {
        if(!this.themeObject){
            return undefined;
        }
        const workbenchCustomizations = this.themeObject.colors; 
        return workbenchCustomizations;
    }


    get type() {
        try{
            return this.themeObject["type"];
        }
        catch{
            return "-";            
        }
    }


    get author() {
        try{
            return this.themeObject["author"];
        }
        catch{
            return "-";            
        }
    }


}
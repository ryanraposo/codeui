import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export class CurrentTheme {

    workbenchCustomizations : any = [];
    themeObject : any;

    themeName : any;
    themeAuthor : any;
    themeType : any;


    constructor(){
        this.themeObject = this.getThemeObject();
        if(this.themeObject){
            this.workbenchCustomizations = this.getWorkbenchCustomizations(this.themeObject);
            this.themeName = this.getThemeName();
            this.themeType = this.getThemeType();
        }
    }

    getThemePath(): any {
        var currentThemeName : string | undefined = vscode.workspace.getConfiguration().get("workbench.colorTheme");
        var currentThemeBaseName : any;
        var themeDirPath : any;
        var themeJsonPath : any;

        if(currentThemeName){
            // Get theme base name eg. "Monokai" of "Monokai Dark"
            let split = currentThemeName.split(" ");
            if(split.length > 0){
                currentThemeBaseName = split[0].toLowerCase();
            }
            // Build name as it will be found in the title of the themes JSON file
            currentThemeName = currentThemeName.toLowerCase();
            currentThemeName = currentThemeName.replace(" ", "-");
            let themeExtension : any;
            // Find the extension folder for the theme
            for(var extension of vscode.extensions.all){
                if(extension.id.includes(currentThemeBaseName)){
                    let strippedThemeName : string = "";
                    let split : Array<string> = [];
                    split = extension.id.split(".");
                    strippedThemeName = split[1];
                    split = strippedThemeName.split("-");
                    strippedThemeName = "";
                    for(let key in split){
                        let part = split[key];
                        if(part !== 'vscode' && part !== 'theme'){
                            strippedThemeName += part + " ";
                        }
                    }
                    strippedThemeName = strippedThemeName.trimRight();
                    if(strippedThemeName === currentThemeName){
                        themeDirPath = extension.extensionPath;
                        themeJsonPath = path.join(themeDirPath + "/themes/" + (currentThemeName + ".json"));
                    }
                }
            }
            // Return the path
            return themeJsonPath;
        }
    }

    getThemeObject(): any {
        let text : string = '';
        let jsonObject : any;
        let themePath = this.getThemePath();

        if(themePath){
            try{
                text = fs.readFileSync(themePath, 'utf8');
                jsonObject = JSON.parse(text);
                return jsonObject;
            }
            catch{
                // console.log("CODEUI: No current theme.");
            }
        }
    }

    getWorkbenchCustomizations(themeObject : any) : any {

        if(themeObject){
            let workbenchCustomizations : any = [];

            for(let key in themeObject['colors']){
                workbenchCustomizations[key] = themeObject['colors'][key];
            }
            return workbenchCustomizations;
        }

    }


    getThemeName(): any {
        return this.themeObject["name"];
    }


    getThemeType(): any {
        return this.themeObject["type"];
    }

}
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export class CurrentTheme {

    workbenchCustomizations : any = [];
    themePath : string | undefined;
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
                let customization : string;
                if(themeObject['colors'][key] !== null){
                    customization = themeObject['colors'][key];
                    workbenchCustomizations[key] = customization.toLowerCase();
                }else{
                    workbenchCustomizations[key] = null;
                }
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


    getThemePath(): string | undefined {

        // Get colorTheme name from settings
        let configTheme : any = vscode.workspace.getConfiguration().get("workbench.colorTheme");
        let themePath : any = undefined;

        // If user has a theme selected, locate extension folder for the theme
        if(configTheme){
            for(var extension of vscode.extensions.all){
                let contributions : any = extension.packageJSON["contributes"];
                if(contributions){
                    if(contributions["themes"]){
                        for(let theme of contributions["themes"]){
                            if(theme["label"] === configTheme){
                                return path.join(extension.extensionPath, theme["path"]);
                            }
                        }
                    }
                }              
            }
        }

        return undefined;

    }


}
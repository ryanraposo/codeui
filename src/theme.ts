import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export class CurrentTheme {

    workbenchCustomizations : any;
    themePath : string | undefined;
    themeObject : any;

    themeName : any;
    themeAuthor : any;
    themeType : any;


    constructor(){        
        this.themeObject = this.getThemeObject();
        if(this.themeObject){
            this.workbenchCustomizations = this.getWorkbenchCustomizations(this.themeObject);
            this.themeName = this.getThemeName(this.themeObject);
            this.themeType = this.getThemeType(this.themeObject);
        }
    }


    public getThemeObject(): any {
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
                return undefined;
            }
        }
    }

    
    private getWorkbenchCustomizations(themeObject : any) : any {
        return themeObject['colors'];
    }


    private getThemeName(themeObject : any): any {
        return this.themeObject["name"];
    }


    private getThemeType(themeObject: any): any {
        return this.themeObject["type"];
    }


    private getThemePath(): string | undefined {

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
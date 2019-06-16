import * as vscode from 'vscode';
import * as path from 'path';

export class FunctionTest {

    test1(): void {

        var currentTheme : string | undefined = vscode.workspace.getConfiguration().get("workbench.colorTheme");
        var themePath : string = '';

        if(currentTheme){
            currentTheme = currentTheme.toLowerCase();
            vscode.window.showInformationMessage("CodeUI: Current theme name: " + currentTheme);
            for(var extension of vscode.extensions.all){
                if(extension.id.includes(currentTheme)){
                    vscode.window.showInformationMessage("CodeUI: Current theme folder: " + extension.extensionPath);
                    themePath = extension.extensionPath;
                }
            }

            let themeJsonPath = path.join(themePath + "/themes/" + (currentTheme + ".json"));
            console.log(themeJsonPath);
        }







        // for(var extension in vscode.extensions.all){

        // }
    }
}
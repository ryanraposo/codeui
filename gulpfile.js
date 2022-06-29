/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const inquirer = require('inquirer');


function updateReadme(newVersion) {
    const re = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/gm;

    let readme = fs.readFileSync('./README.md', {encoding:'utf8', flag:'r'});

    readme = readme.replaceAll(re, newVersion);

    fs.writeFileSync('./README.md', readme, {encoding:'utf-8'});
    
    console.log(`README updated ✅`);
};


function updateManifest(newVersion) {
    const re = /"version":.*/gm;

    let manifest = fs.readFileSync('./package.json', {encoding:'utf8', flag:'r'});

    manifest = manifest.replace(re, `"version": "${newVersion}",`);

    fs.writeFileSync('./package.json', manifest, {encoding:'utf-8'});

    console.log(`Manifest updated ✅`);
};


async function promptChange(changes) {
    if (!changes) {
        changes = [];
    }

    return await inquirer.prompt([
        {
            type: 'input',
            name: 'change',
            message: 'Enter a change for the changelog:',
            validate: changeInput => {
                if (changeInput) {
                    return true;
                } else {
                    console.log('Please enter a change!');
                    return false;
                }
            }
        },
        {
            type: 'confirm',
            name: 'confirmAddChange',
            message: 'Would you like to enter another change?',
            default: false
        }
        ])
        .then((answers) => {
            changes.push(answers.change);
            if (answers.confirmAddChange) {
              return promptChange(changes);
            } else {
              return changes;
            }
        })
        .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt couldn't be rendered in the current environment");
        } else {
            console.log(error);
        }
    });
};


async function updateChangelog(newVersion) {

    const changes = await promptChange();

    let logText = `## [${newVersion}] \n \n`;

    changes.forEach((change) => {
        logText += `- ${change} \n \n`;
    });

    let changelog = fs.readFileSync('./CHANGELOG.md', {encoding:'utf8', flag:'r'});

    changelog = logText + changelog;

    fs.writeFileSync('./CHANGELOG.json', changelog, {encoding:'utf-8'});
    
    console.log(`Changelog updated ✅`);

};


async function upver() {
    const newVersion = process.argv[4];

    try {
        updateReadme(newVersion);
        updateManifest(newVersion);
        await updateChangelog(newVersion);
    }
    catch(err){
        console.log(err);
    }
}


exports.upver = upver;
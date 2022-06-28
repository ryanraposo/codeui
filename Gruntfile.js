module.exports = (grunt) => {  
    grunt.registerTask('upver', 'Updates the extension version to the specified value.', function(newVersion) {
        const re = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/gm;
        const re2 = /"version":.*/gm;

        let readme = grunt.file.read('README.md').toString();
        let manifest = grunt.file.read('package.json').toString();

        readme = readme.replaceAll(re, newVersion);
        manifest = manifest.replace(re2, `"version": "${newVersion}",`);

        grunt.file.write('README.md', readme);
        grunt.file.write('package.json', manifest);
    });
};
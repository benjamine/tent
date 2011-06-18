
var jakelib = require('./tools/jakelib');

desc('This is the default task.');
task('default', function(){
    console.log('use -T parameter to list available tasks');
});

jakelib.setOptions({
    paths: {
        // path for compiled packages
        build: 'dist',
        
        // path to tools
        jsdoctoolkit: 'tools/jsdoc-toolkit',
        closurecompiler: 'tools/closure-compiler/compiler.jar'
    }
});

new jakelib.Project('src/__project__.json').jakify();

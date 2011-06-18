var sys = require('sys'), path = require('path'), fs = require('fs'), child_process = require('child_process');

var jakelib = {};

jakelib.jakeFunctions = {
    desc: desc,
    task: task,
    file: file,
    complete: complete,
    fail: fail
}

jakelib.options = {
    paths: {
        build: 'build'
    }
};

jakelib.setOptions = function(op){
    jakelib.extend(jakelib.options, op);
};

exports.setOptions = jakelib.setOptions;

// recursively merges object arguments into the first argument
jakelib.extend = function(){

    var target = arguments[0] || {};
    for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        if (typeof arg == 'object') {
            for (var p in arg) {
                if (target[p] !== arg[p]) {
                    if (typeof arg[p] == 'object') {
                        target[p] = jakelib.extend(target[p], arg[p]);
                    }
                    else {
                        target[p] = arg[p];
                    }
                }
            }
        }
    }
    return target;
}

jakelib.logging = {
    silent: false,
    log: function(){
        if (jakelib.logging.silent) {
            return;
        }
        console.log.apply(console.log, arguments);
    }
}

var log = jakelib.logging.log;

/**
 * Executes an external command in a child process
 * @param {String} command path to executable file or command
 * @param {Object} [options]
 * @param {Object} [options.args] command name (for logging)
 * @param {Object} [options.args] command arguments
 * @param {Object} [options.timeout] command timeout
 * @param {Object} callback
 */
jakelib.exec = function(command, options, callback){

    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (typeof options != 'object') {
        options = {};
    }
    
    var logp = (options.name || path.basename(command)) + '> ';
    log(logp + ' start');
    
    var cmd = command;
    if (options.args) {
        cmd += ' ' + options.args;
    }
    try {
        child_process.exec(cmd, {
            timeout: options.timeout || 0
        }, function(error, stdout, stderr){
            if (stdout) {
                log(logp + stdout);
            }
            if (stderr && ((stderr + '') !== (error + ''))) {
                log(logp + 'ERR:' + stderr);
            }
            if (error) {
                log(logp + ' ERROR: ' + error);
            }
            else {
                log(logp + ' done!');
            }
            if (callback) {
                callback(error, stdout);
            }
        });
    } 
    catch (err) {
        log(logp + ' ERROR: ' + error);
        if (callback) {
            callback(err);
        }
    }
}

jakelib.tools = {

    compile_debug: function(task, options){
    
        var cmd = 'java -jar ' + options.paths.closurecompiler +
        ' --js ' +
        task.deps.join(' --js ') +
        ' --js_output_file=' +
        task.name +
        ' --compilation_level WHITESPACE_ONLY --formatting PRETTY_PRINT';
        
        jakelib.exec(cmd, {
            name: 'closure-compiler(' + task.name + ')'
        }, function(error){
            if (error) {
                jakelib.jakeFunctions.fail(error);
            }
            jakelib.jakeFunctions.complete();
        });
    },
    
    compile_release: function(task, options){
    
        var cmd = 'java -jar ' + options.paths.closurecompiler +
        ' --js ' +
        task.deps.join(' --js ') +
        ' --js_output_file=' +
        task.name;
        
        jakelib.exec(cmd, {
            name: 'closure-compiler-min(' + task.name + ')'
        }, function(error){
            if (error) {
                jakelib.jakeFunctions.fail(error);
            }
            jakelib.jakeFunctions.complete();
        });
    },
    
    jsdoc: function(task, options){
        var cmd = 'java -jar ' + options.paths.jsdoctoolkit + '/jsrun.jar ' +
        options.paths.jsdoctoolkit +
        '/app/run.js -c=' +
        task.config;
        
        jakelib.exec(cmd, {
            name: 'jsdoc'
        }, function(error){
            if (error) {
                jakelib.jakeFunctions.fail(error);
            }
            jakelib.jakeFunctions.complete();
        });
    }
};

/**
 * Creates a new Project, that contains packages and docs of a library or application
 * @param {String} [filename] path to project json file containing project info
 * @param {Object} [options] project options
 */
var Project = function Project(filename, options){
    if (typeof filename == 'object') {
        options = filename;
        filename = null;
    }
    this.options = jakelib.extend({}, jakelib.options, options);
    if (filename) {
        this.load(filename);
    }
};

exports.Project = Project;

/**
 * loads a project json file
 * @param {String} filename
 */
Project.prototype.load = function(filename){
    var data = JSON.parse(fs.readFileSync(filename));
    // set base dir
    var baseDir = path.dirname(filename);
    if (baseDir && baseDir != '.' && baseDir != './') {
        for (var pi = 0; pi < data.packages.length; pi++) {
            var p = data.packages[pi];
            for (var fi = 0; fi < p.files.length; fi++) {
                p.files[fi] = path.join(baseDir, p.files[fi]);
            }
        }
    }
    
    this.baseDir = baseDir;
    this.data = data;
    return this;
};

/**
 * Returns all tasks defined for this project
 */
Project.prototype.getTasks = function(){
    if (!this.data.packages instanceof Array) {
        return [];
    }
    var tasks = [];
    var compileList = [];
    
    for (var i = 0; i < this.data.packages.length; i++) {
        var p = this.data.packages[i];
        
        var fdebug = path.join(this.options.paths.build, p.name + '.debug.js');
        tasks.push({
            description: p.name + ' compile for debug',
            tool: 'compile_debug',
            type: 'file',
            name: path.join(this.options.paths.build, p.name + '.debug.js'),
            deps: p.files,
            isAsync: true
        });
        
        var frelease = path.join(this.options.paths.build, p.name + '.js');
        tasks.push({
            description: p.name + ' compile for release (minified)',
            tool: 'compile_release',
            type: 'file',
            name: path.join(this.options.paths.build, p.name + '.js'),
            deps: p.files,
            isAsync: true
        });
        
        tasks.push({
            description: p.name + ' compile all (debug+release)',
            name: p.name + '.compile',
            deps: [fdebug, frelease]
        });
        compileList.push(p.name + '.compile');
        
    }
    
    if (compileList && compileList.length > 0) {
        tasks.push({
            description: 'compile all packages (debug+release)',
            name: 'compile',
            deps: compileList
        });
    }
    
    // doc
    if (this.data.doc) {
        if (this.data.doc.type === 'jsdoc') {
            tasks.push({
                description: 'generate documentation',
                tool: 'jsdoc',
                name: 'doc',
                config: path.join(this.baseDir, this.data.doc.config),
                isAsync: true
            });
        }
    }
    
    return tasks;
};

/**
 * Registers all jake for this project
 */
Project.prototype.jakify = function(){
    var tasks = this.getTasks();
    
    var project = this;
    if (!tasks || tasks.length < 1) {
        return this;
    }
    
    var makeHandler = function(t, project){
        return function(){
            if (t.tool) {
                log('running tool ' + t.tool + '...');
                jakelib.tools[t.tool](t, jakelib.extend({}, project.options));
            }
            else {
                log(t.name + ' done!');
            }
        }
    }
    
    for (var i = 0; i < tasks.length; i++) {
        var t = tasks[i];
        
        jakelib.jakeFunctions.desc(t.description);
        if (t.type === 'file') {
            jakelib.jakeFunctions.file(t.name, t.deps, t.handler || makeHandler(t, project), t.isAsync || false);
        }
        else {
            jakelib.jakeFunctions.task(t.name, t.deps, t.handler || makeHandler(t, project), t.isAsync || false);
        }
    }
    return this;
};

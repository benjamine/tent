var sys = require('sys'), path = require('path'), fs = require('fs'), child_process = require('child_process');
var jakeutil = require('./tools/jakeutil').jakeutil;

desc('This is the default task.');
task('default', function(){
    console.log('use -T parameter to list available tasks')
});

jakeutil.registerTaskDescription = desc;
jakeutil.registerTask = task;
jakeutil.registerFileTask = file;

jakeutil.load('src/__packages__.json');

jakeutil.defineTasks();

//var srcFiles = ['src/base.js', 'src/arrays.js', 'src/coretypes.js', 'src/logging.js', 'src/changes.js', 'src/databinding.js', 'src/changes.reverseproperties.js', 'src/entities.js', 'src/connectors/base.js', 'src/connectors/http.js', 'src/connectors/rest.js', 'src/connectors/couchdb.js'];
/*

 var exec = function(cmd, name, callback){

 console.log(name + '> start');

 child_process.exec(cmd, function(error, stdout, stderr){

 var ok = true;

 if (stderr) {

 ok = false;

 sys.print(name + '> ' + stderr);

 }

 if (error !== null) {

 ok = false;

 console.log(name + '> error: ' + error);

 }

 if (stdout) {

 sys.print(name + '> ' + stdout);

 }

 else {

 if (ok) {

 sys.print(name + '> complete');

 }

 else {

 sys.print(name + '> complete with errors');

 }

 }

 if (!ok) {

 fail(error || stderr);

 }

 if (callback) {

 callback(error || stderr);

 }

 });

 }

 desc('Compiles JSDoc');

 task('jsdoc', function(){

 var docspath = 'docs/api';

 path.exists(docspath, function(exists){

 if (!exists) {

 console.error('creating path "' + docspath + '"');

 fs.mkdirSync(docspath);

 }

 console.log('compiling jsdoc');

 var cmd = 'java -jar jsdoc-toolkit/jsrun.jar jsdoc-toolkit/app/run.js -c=jsdoc.conf';

 exec(cmd, 'jsdoc', function(error){

 if (!error) {

 console.log('jsdoc compiled at ' + docspath);

 }

 complete();

 });

 });

 }, true);

 desc('Compiles src');

 file('dist/tent.js', srcFiles, function(){

 var distpath = 'dist';

 path.exists(distpath, function(exists){

 if (!exists) {

 console.error('creating path "' + distpath + '"');

 fs.mkdirSync(distpath);

 }

 var cmd = 'java -jar closure-compiler/compiler.jar' +

 ' --js ' +

 srcFiles.join(' --js ') +

 ' --js_output_file=' +

 distpath +

 '/tent.js' +

 ' --compilation_level WHITESPACE_ONLY --formatting PRETTY_PRINT';

 exec(cmd, 'compiler', function(error){

 if (!error) {

 console.log('src compiled at ' + distpath);

 }

 complete();

 });

 });

 }, true);

 desc('Compiles src minified');

 file('dist/tent.min.js', srcFiles, function(){

 var distpath = 'dist';

 path.exists(distpath, function(exists){

 if (!exists) {

 console.error('creating path "' + distpath + '"');

 fs.mkdirSync(distpath);

 }

 var cmd = 'java -jar closure-compiler/compiler.jar' +

 ' --js ' +

 srcFiles.join(' --js ') +

 ' --js_output_file=' +

 distpath +

 '/tent.min.js';

 exec(cmd, 'compiler_min', function(error){

 if (!error) {

 console.log('src compiled & minified at ' + distpath);

 }

 complete();

 });

 });

 }, true);

 desc('Compiles src');

 task('compile', ['dist/tent.min.js', 'dist/tent.js'], function(){

 });

 namespace('test', function(){

 desc('start test server');

 task('server', ['compile'], function(){

 

 var cmd = 'java -jar jstestdriver/JsTestDriver.jar --config jsTestDriver-dist.conf --tests all --basePath .';

 exec(cmd, 'test', function(error){

 if (!error) {

 console.log('test complete!');

 }

 complete();

 });

 

 });

 

 desc('tests minified src');

 task('min', ['compile'], function(){

 

 var cmd = 'java -jar jstestdriver/JsTestDriver.jar --config jsTestDriver-dist.conf --tests all --basePath .';

 exec(cmd, 'test', function(error){

 if (!error) {

 console.log('test complete!');

 }

 complete();

 });

 

 });

 

 desc('measures tests coverage');

 task('coverage', ['compile'], function(){

 

 var cmd = 'java -jar jstestdriver/JsTestDriver.jar --config jsTestDriver-coverage.conf --tests all --basePath .';

 exec(cmd, 'test', function(error){

 if (!error) {

 console.log('test complete!');

 }

 complete();

 });

 

 });

 

 });

 */



/**
 * Prepare for including jstestdriver Asserts.js
 * defining all required variables and functions
 */
/*
 
 jstestdriver.expectedAssertCount = count;
 jstestdriver.assertCount++;
 jstestdriver.jQuery.isArray(actual)
 
 
 
 MyTestCase = TestCase("MyTestCase");
 MyTestCase.prototype.testA = function(){
 };
 MyTestCase.prototype.testB = function(){
 };
 
 TestCase("MyTestCase", {
 testA:function(){
 },
 testB:function(){
 }
 });
 
 
 */
if (typeof jstestdriver == 'undefined') {
    jstestdriver = {};
}

if (typeof jstestdriver.console == 'undefined') {
    jstestdriver.console = {};
}

if (typeof jstestdriver.console.log == 'undefined') {
    jstestdriver.console.log = function(msg){
        if (typeof tent == 'undefined') {
            console.log.apply(console, arguments);
        }
        else {
            tent.log.info.apply(tent.log, arguments);
        }
    }
}

if (typeof jstestdriver.assertCount == 'undefined') {
    jstestdriver.assertCount = 0;
}

if (typeof jstestdriver.jQuery == 'undefined') {
    jstestdriver.jQuery = {};
}
if (typeof jstestdriver.jQuery.isArray == 'undefined') {
    jstestdriver.jQuery.isArray = function(obj){
        return (obj instanceof Array);
    };
}

var tests = {};

tests.cases = [];

tests.run = function(callback){

    this.startTime = (new Date).getTime();
    delete this.endTime;
    delete this.elapsed;
    
    for (var i = 0; i < this.cases.length; i++) {
        this.cases[i].run();
    }
    
    // tests ended
    this.endTime = (new Date).getTime();
    this.elapsed = this.endTime - this.startTime;
    
    if (callback) {
        callback();
    }
}

tests.runAsync = function(callback){

    this.startTime = (new Date).getTime();
    delete this.endTime;
    delete this.elapsed;
    
    var rNext = function(){
        tests._runNext(0, callback);
    }
    setTimeout(rNext, 10);
    
}

tests._runNext = function(i, callback){
    if (i > tests.cases.length - 1) {
        // tests ended
        tests.endTime = (new Date).getTime();
        tests.elapsed = tests.endTime - tests.startTime;
        if (callback) {
            callback();
        }
    }
    else {
        tests.cases[i].run();
        
        var rNext = function(){
            tests._runNext(i + 1, callback);
        }
        setTimeout(rNext, 100)
    }
}


tests.updateResults = function(){
    this.succeeded = true;
    this.errors = 0;
    for (var i = 0; i < this.cases.length; i++) {
        if (this.cases[i].succeeded === false) {
            this.succeeded = false;
            this.errors += this.cases[i].errors;
        }
    }
}

/**
 * simplistic TestCase implementation emulating jstestdriver TestCase
 * @param {Object} name
 * @param {Object} proto
 */
TestCase = function TestCase(name, proto){
    if (!(this instanceof TestCase)) {
        return new TestCase(name, proto);
    }
    else {
        this.name = name;
        for (var n in proto) {
            if (proto.hasOwnProperty(n) && typeof proto[n] == 'function') {
                if (n == 'setUp' || n == 'tearDown' || n.substr(0, 4) == 'test') {
                    this[n] = proto[n];
                }
            }
        }
        tests.cases.push(this);
    }
}

TestCase.prototype.run = function(){

    this.startTime = (new Date).getTime();
    delete this.endTime;
    delete this.elapsed;
    
    this.results = {};
    this.errors = 0;
    delete this.succeeded;
    if (tent) {
        tent.log.info('  TestCase ' + this.name);
    }
    
    if (typeof this.setUp == 'function') {
        try {
            this.setUp();
        } 
        catch (error) {
            this.errors++;
            this.results['setUp'] = {
                success: false,
                error: error
            }
            if (typeof tent == 'undefined') {
                console.error('    setUp failed: ' + error);
            }
            else {
                tent.log.error('    setUp failed: ' + error);
            }
        }
    }
    
    if (this.errors === 0) {
        for (var n in this) {
            if (this.hasOwnProperty(n) && n.substr(0, 4) == 'test' && typeof this[n] == 'function') {
                jstestdriver.assertCount = 0;
                delete jstestdriver.expectedAssertCount;
                var test = this[n];
                try {
                    test();
                    if (typeof jstestdriver.expectedAssertCount != 'undefined') {
                        assertEquals('Assert count ', jstestdriver.expectedAssertCount, jstestdriver.assertCount);
                    }
                    this.results[n] = {
                        success: true
                    }
                    if (typeof tent == 'undefined') {
                        console.info('    ' + n + ' succeeded');
                    }
                    else {
                        tent.log.info('    ' + n + ' succeeded');
                    }
                } 
                catch (error) {
                    this.errors++;
                    this.results[n] = {
                        success: false,
                        error: error
                    }
                    if (typeof tent == 'undefined') {
                        console.error('    ' + n + ' failed: ' + error);
                    }
                    else {
                        tent.log.error('    ' + n + ' failed: ' + error);
                    }
                }
            }
        }
        
        
        if (this.errors === 0) {
            if (typeof this.tearDown == 'function') {
                try {
                    this.tearDown();
                } 
                catch (error) {
                    this.errors++;
                    this.results['tearDown'] = {
                        success: false,
                        error: error
                    }
                    if (typeof tent == 'undefined') {
                        console.error('    tearDown failed: ' + error);
                    }
                    else {
                        tent.log.error('    tearDown failed: ' + error);
                    }
                }
            }
        }
    }
    
    this.endTime = (new Date).getTime();
    this.elapsed = this.endTime - this.startTime;
    
    this.succeeded = !(this.errors > 0);
    tests.updateResults();
}


tests.scripts = {};

tests.scripts.load = function(url, callback){

    if (typeof jQuery == 'undefined' || jQuery.support.scriptEval) {
        var scriptTags = document.getElementsByTagName('script');
        for (var i = scriptTags.length - 1; i >= 0; i--) {
            var scriptTag = scriptTags[i];
            if (scriptTag.src === url) {
                scriptTag.parentNode.removeChild(scriptTag);
            }
        }
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.onload = function(){
            callback(typeof data == 'undefined' ? null : data);
        };
        script.src = url;
        head.appendChild(script);
    }
    else {
        $.getScript(url, function(d, textStatus){
            callback(typeof data == 'undefined' ? d : (data || d), textStatus);
        });
    }
    
}

tests.scripts.loadList = function(list, path, callback){

    if (typeof path == 'function') {
        callback == path;
        path = null;
    }
    
    if (typeof list == 'string') {
        // list is an url of the file list in json format
        tests.scripts.load(list + '?' + Math.random(), function(data, textStatus){
            if (!data || !data.scripts) {
                if (!(typeof tent == 'undefined')) {
                    tent.log.error('error loading script list');
                }
                else {
                    console.error('error loading script list');
                }
                return;
            }
            tests.scripts.loadList(data.scripts, path, callback);
        });
        
    }
    else 
        if (list instanceof Array) {
            // list is an array of urls
            var loadcount = 0;
            var prefix = path;
            if (typeof prefix == 'string' && prefix.length > 0 && prefix.substr(prefix.length - 1, 1) != '/') {
                prefix += '/';
            }
            for (var i = 0; i < list.length; i++) {
                tests.scripts.load(prefix + list[i] + '?' + Math.random(), function(data, textStatus){
                    loadcount++;
                    if (loadcount == list.length) {
                        callback(list);
                    }
                });
            }
        }
        else {
            throw 'In order to load a list of scripts provide an Array of urls, or an url to the JSON list';
        }
    
}


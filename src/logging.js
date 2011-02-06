
tent.declare('tent.logging', function(exports){

    exports.Levels = new tent.coreTypes.Enum('TRACE,DEBUG,INFO,WARN,ERROR,FATAL');
    
    exports.Log = function Log(){
        if (arguments.length > 0) {
            this.add.apply(this, arguments);
        }
        
        // by default log to console
        if (typeof console != 'undefined') {
            this.out = {
                TRACE: function(msg){
                    if (console.trace) {
                        console.trace(msg);
                    }
                    else {
                        console.info(msg);
                    }
                },
                DEBUG: function(msg){
                    if (console.debug) {
                        console.debug(msg);
                    }
                    else {
                        console.info(msg);
                    }
                },
                INFO: function(msg){
                    console.info(msg);
                },
                WARN: function(msg){
                    console.warn(msg);
                },
                ERROR: function(msg){
                    console.error(msg);
                },
                FATAL: function(msg){
                    console.error(msg);
                }
            };
        }
        
        this.listeners = [];
    }
    
    tent.log = new exports.Log();
    
    exports.Log.prototype.bind = function(callback, level){
        if (!callback instanceof Function) {
            throw 'a callback Function must be provided';
        }
        
        var lvl = level;
        if (typeof lvl != 'number') {
            if (typeof lvl == 'undefined') {
                lvl = exports.Levels.TRACE;
            }
            else {
                lvl = exports.Levels[lvl] || exports.Levels.TRACE;
            }
        }
        
        this.listeners.push({
            callback: callback,
            level: lvl
        })
    }
    
    exports.Log.prototype.unbind = function(callback){
        if (!callback instanceof Function) {
            throw 'a callback Function must be provided';
        }
        for (var i = this.listeners.length; i >= 0; i--) {
            if (this.listeners[i].callback === callback) {
                this.listeners.splice(i, 1);
            }
        }
    }
    
    exports.Log.prototype.notify = function(message, level){
    
        var lvl = level;
        if (typeof lvl != 'number') {
            if (!lvl) {
                lvl = exports.Levels.INFO;
            }
            else {
                lvl = exports.Levels[lvl] || exports.Levels.INFO;
            }
        }
        
        for (var i = 0, l = this.listeners.length; i < l; i++) {
            var lst = this.listeners[i];
            if (lst.callback) {
                if ((typeof lst.level == 'undefined') || (lst.level <= lvl)) {
                    lst.callback(message, level);
                }
            }
        }
    }
    
    exports.Log.prototype.__log__ = function(message, level){
        level = level || exports.Levels.INFO;
        var levelName = exports.Levels.getName(level);
        if (this.out && this.out[levelName]) {
            this.out[levelName](exports.Levels.getName(level) + ' ' + message);
        }
        this.notify(message, level);
    }
    
    exports.Log.prototype.trace = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.__log__(message, exports.Levels.TRACE);
    }
    
    exports.Log.prototype.debug = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.__log__(message, exports.Levels.DEBUG);
    }
    
    exports.Log.prototype.info = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.__log__(message, exports.Levels.INFO);
    }
    
    exports.Log.prototype.warn = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.__log__(message, exports.Levels.WARN);
    }
    
    exports.Log.prototype.error = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.__log__(message, exports.Levels.ERROR);
    }
    
    exports.Log.prototype.fatal = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.__log__(message, exports.Levels.FATAL);
    }
    
    exports.Log.prototype.stringify = function(){
    
        var s = '';
        
        try {
        
            var options = (arguments.length > 0 && arguments[arguments.length - 1] &&
            arguments[arguments.length - 1]._options) ? arguments[arguments.length - 1] : {
                _options: true
            };
            
            if (!options.deepStack) {
                options.deepStack = [];
                tent.arrays.addFunctions(options.deepStack);
            }
            
            for (var i = 0, l = arguments.length; i < l; i++) {
                if (arguments[i] && (typeof arguments[i] == 'object') && arguments[i]._options) {
                    continue;
                }
                if (arguments[i] instanceof Function) {
                    continue;
                }
                if (s) {
                    s += ', ';
                }
                if (options.deepStack.length > 3 || options.deepStack.lastIndexOf(arguments[i]) >= 0) {
                    s += '#';
                }
                else {
                    if (typeof arguments[i] == 'undefined') {
                        s += 'undefined';
                    }
                    else 
                        if (arguments[i] == null) {
                            s += 'null';
                        }
                        else 
                            if (arguments[i] instanceof Array) {
                                var arg = tent.arrays.functions.clone.apply(arguments[i]).filter(function(item){
                                    if (item instanceof Function) {
                                        return false;
                                    }
                                    if (options.deepStack.lastIndexOf(item >= 0)) {
                                        return false;
                                    }
                                    return true;
                                });
                                arg.push(options);
                                options.deepStack.push(arguments[i]);
                                s += '[';
                                if (options.deepStack.length < 4) {
                                    s += this.stringify.apply(this, arg);
                                }
                                options.deepStack.pop();
                                s += ']';
                            }
                            else 
                                if (typeof(arguments[i]) == 'string') {
                                    s += '"' + arguments[i] + '"';
                                }
                                else 
                                    if (arguments[i] instanceof Date) {
                                        s += '"' + arguments[i] + '"';
                                    }
                                    else 
                                        if (typeof(arguments[i]) == 'object') {
                                            var so = '';
                                            options.deepStack.push(arguments[i]);
                                            if (options.deepStack.length < 4) {
                                                for (var n in arguments[i]) {
                                                    if (arguments[i][n] instanceof Function) {
                                                        continue;
                                                    }
                                                    if (options.deepStack.lastIndexOf(arguments[i][n]) >= 0) {
                                                        continue;
                                                    }
                                                    if (so) {
                                                        so += ', ';
                                                    }
                                                    so += '"' + n + '": ' + this.stringify.apply(this, [arguments[i][n], options]);
                                                }
                                            }
                                            options.deepStack.pop();
                                            s += '{' + so + '}';
                                        }
                                        else {
                                            s += arguments[i];
                                        }
                }
            }
            
        } 
        catch (err) {
            return '#err#';
        }
        return s;
    }
    
    exports.Log.prototype.stringOrStringify = function(){
        if (arguments.length == 1 && typeof arguments[0] == 'string') {
            return arguments[0];
        }
        else {
            return this.stringify.apply(this, arguments);
        }
        
    }
    
    return exports;
});


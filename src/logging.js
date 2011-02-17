/**
 * @requires tent
 * @requires tent.arrays
 * @requires tent.coreTypes
 * @name tent.logging
 * @namespace Logging
 */
tent.declare('tent.logging', function(){

    /**
     * Event severity levels
     * @type tent.coreTypes.Enum
     */
    tent.logging.Levels = new tent.coreTypes.Enum('TRACE,DEBUG,INFO,WARN,ERROR,FATAL');
    
    /**
     * Creates a new log sink
     * @class a log sink
     * @constructor
     */
    tent.logging.Log = function Log(){
        this.listeners = [];
    }

	/**
	 * Binds this Log to the browser's console
	 * @param {Number} [level] minimum level for events sent
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.bindToConsole = function(level){
        if (typeof console != 'undefined') {
            this.bind(tent.logging.consoleLogger, level);
        }
        return this;
    }
    
	/**
	 * Binds this Log to the alert function (ie: shows an alert dialog for every event)
	 * @param {Number} [level] minimum level for events sent
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.bindToAlert = function(level){
        this.bind(tent.logging.alertLogger, level);
        return this;
    }
    
	/**
	 * Binds this Log to an Html element (ie: adds some html for every event)
	 * @param {Object} outputElement html element for appends, INPUT (add line to value), UL (add LI), TABLE (add TR) or DIV (add line to innerHTML)
	 * @param {Number} [level] minimum level for events sent
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.bindToHtml = function(outputElement, level){
        this.bind(tent.logging.createHtmlAppendLogger(outputElement), level);
        return this;
    }
    
	/**
	 * Unbinds this Log from browser's console
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.unbindConsole = function(){
        if (typeof console != 'undefined') {
            this.unbind(tent.logging.consoleLogger);
        }
        return this;
    }
    
	/**
	 * Unbinds this Log from alert function
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.unbindAlert = function(){
        this.unbind(tent.logging.alertLogger, level);
        return this;
    }
    
	/**
	 * Unbinds this Log from an Html element
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.unbindHtml = function(outputElement){
        for (var i = this.listeners.length; i >= 0; i--) {
            if (this.listeners[i].callback.outputElement === outputElement) {
                this.listeners.splice(i, 1);
            }
        }
        return this;
    }
    
	/**
	 * Binds a callback function to events of this Log
	 * @param {function()} callback 
	 * @param {Number} [level]
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.bind = function(callback, level){
        if (!callback instanceof Function) {
            throw 'a callback Function must be provided';
        }
        
        var lvl = level;
        if (typeof lvl != 'number') {
            if (typeof lvl == 'undefined') {
                lvl = tent.logging.Levels.TRACE;
            }
            else {
                lvl = tent.logging.Levels[lvl] || tent.logging.Levels.TRACE;
            }
        }
        
        var found = false;
        for (var i = this.listeners.length - 1; i >= 0; i--) {
            var list = this.listeners[i];
            if (list.callback === callback) {
                // already bound, just update level
                list.level = lvl;
                found = true;
            }
        };
        if (!found) {
            this.listeners.push({
                callback: callback,
                level: lvl
            })
        }
        
        return this;
    }
    
	/**
	 * Unbinds a callback function from events of this Log
	 * @param {function()} callback 
	 * @return {tent.logging.Log} this
	 */
    tent.logging.Log.prototype.unbind = function(callback){
        if (!callback instanceof Function) {
            throw 'a callback Function must be provided';
        }
        for (var i = this.listeners.length; i >= 0; i--) {
            if (this.listeners[i].callback === callback) {
                this.listeners.splice(i, 1);
            }
        }
        return this;
    }
    
	/**
	 * Notifies an event to Log listeners
	 * @private
	 * @param {String} message
	 * @param {Number} level
	 */	
    tent.logging.Log.prototype.notify = function(message, level){
    
        var lvl = level;
        if (typeof lvl != 'number') {
            if (!lvl) {
                lvl = tent.logging.Levels.INFO;
            }
            else {
                lvl = tent.logging.Levels[lvl] || tent.logging.Levels.INFO;
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
        
	/**
	 * Logs an event with severity TRACE, all arguments are stringified in a message
	 */
    tent.logging.Log.prototype.trace = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.notify(message, tent.logging.Levels.TRACE);
    }
    
	/**
	 * Logs an event with severity DEBUG, all arguments are stringified in a message
	 */
    tent.logging.Log.prototype.debug = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.notify(message, tent.logging.Levels.DEBUG);
    }
    
	/**
	 * Logs an event with severity INFO, all arguments are stringified in a message
	 */
    tent.logging.Log.prototype.info = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.notify(message, tent.logging.Levels.INFO);
    }
    
	/**
	 * Logs an event with severity WARN, all arguments are stringified in a message
	 */
    tent.logging.Log.prototype.warn = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.notify(message, tent.logging.Levels.WARN);
    }
    
	/**
	 * Logs an event with severity ERROR, all arguments are stringified in a message
	 */
    tent.logging.Log.prototype.error = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.notify(message, tent.logging.Levels.ERROR);
    }
    
	/**
	 * Logs an event with severity FATAL, all arguments are stringified in a message
	 */
    tent.logging.Log.prototype.fatal = function(){
        var message = this.stringOrStringify.apply(this, arguments);
        this.notify(message, tent.logging.Levels.FATAL);
    }
    
	/**
	 * Stringifies all arguments
	 * @private
	 * @return {String} a String represeting all arguments
	 */
    tent.logging.Log.prototype.stringify = function(){
    
        var s = '';
        
        try {
        
            var options = (arguments.length > 0 && arguments[arguments.length - 1] &&
            arguments[arguments.length - 1]._options) ? arguments[arguments.length - 1] : {
                _options: true
            };
            
            if (!options.deepStack) {
                options.deepStack = [];
                tent.arrays.extend(options.deepStack);
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
    
	/**
	 * If a String argument is used returns the same string, otherwise the stringified arguments (as {@link #stringify})
	 * @private
	 * @return {String} a String represeting all arguments 
	 */
    tent.logging.Log.prototype.stringOrStringify = function(){
        if (arguments.length == 1 && typeof arguments[0] == 'string') {
            return arguments[0];
        }
        else {
            return this.stringify.apply(this, arguments);
        }        
    }
    
	/**
	 * @private
	 * @param {Object} message
	 * @param {Object} level
	 */
    tent.logging.consoleLogger = function(message, level){
    
        if (level == tent.logging.Levels.TRACE) {
            if (console.trace) {
                console.trace(message);
            }
            else {
                console.info(message);
            }
        }
        if (level == tent.logging.Levels.DEBUG) {
            if (console.debug) {
                console.debug(message);
            }
            else {
                console.info(message);
            }
        }
        if (level == tent.logging.Levels.INFO) {
            console.info(message);
        }
        if (level == tent.logging.Levels.WARN) {
            if (console.warn) {
                console.warn(message);
            }
            else {
                console.info(message);
            }
        }
        if (level == tent.logging.Levels.ERROR) {
            console.error(message);
        };
        if (level == tent.logging.Levels.FATAL) {
            console.error(message);
        }
    }
    
	/**
	 * @private
	 * @param {Object} message
	 * @param {Object} level
	 */
    tent.logging.alertLogger = function(message, level){
        alert(message);
    }
    
	/**
	 * @private
	 * @param {Object} outputElement
	 */
    tent.logging.createHtmlAppendLogger = function(outputElement){
        var f=null;
        if (outputElement.tagName == 'INPUT') {
			/**
			 * @inner
			 */
            f = function(message, level){
                outputElement.value += '\n[' + tent.logging.Levels.getName(level) + '] ' + message;
            }
        }
        else 
            if (outputElement.tagName == 'UL') {
				/**
				 * @inner
				 */
                f = function(message, level){
                    var li = document.createElement('li');
                    li.innerHTML = '[' + tent.logging.Levels.getName(level) + '] ' + message;
                    outputElement.appendChild(li);
                }
            }
            else 
                if (outputElement.tagName == 'TABLE') {
					/**
					 * @inner
					 */
                    f = function(message, level){
                        var tr = document.createElement('tr');
                        var td1 = document.createElement('td');
                        td1.setAttribute('class', 'eventType');
                        td1.innerHTML = tent.logging.Levels.getName(level);
                        tr.appendChild(td1);
                        var td2 = document.createElement('td');
                        td2.setAttribute('class', 'eventMessage');
                        
                        td2.innerHTML = message.replace(/(\<)/g, '&lt;').replace(/(\>)/g, '&gt;').replace(/(\&)/g, '&amp;').replace(/(\s)/g, '&nbsp;');
                        
                        tr.appendChild(td2);
                        
                        var tbody = outputElement.tBodies[0];
                        tbody.appendChild(tr);
                    }
                }
                else {
					/**
					 * @inner
					 */
                    f = function(message, level){
                        outputElement.innerHTML += '<br/>[' + tent.logging.Levels.getName(level) + '] ' + message;
                    }
                }
        f.outputElement = outputElement;
        return f;
    }
	    
    /**
     * Default global log sink
     * @constant
     * @type tent.logging.Log
     */
    tent.log = new tent.logging.Log().bindToConsole();
    	    
});


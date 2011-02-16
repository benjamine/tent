/**
 * Utility classes used by this library
 * @requires tent
 * @name tent.coreTypes
 * @namespace Utility classes used by this library
 */
tent.declare('tent.coreTypes', function(){
    
    /**
     * Creates a new Enum.
     * 
     * @example
     * 
     * var WeekDays = new tent.coreTypes.Enum('FRIDAY,SATURDAY,SUNDAY');
     * assertTrue(WeekDays.FRIDAY === 1 &&
	 * 	 WeekDays.SATURDAY === 2 &&
     * 	 WeekDays.SUNDAY == 3);
     * 
     * // flag enum
     * var FontStyles = new tent.coreTypes.Enum('_FLAGS,BOLD,ITALIC,UNDERLINE,SMALLCAPS');
     * assertTrue(FontStyles.BOLD == 1 &&
     *   FontStyles.ITALIC == 2 &&
     *   FontStyles.UNDERLINE == 4 &&
     *   FontStyles.SMALLCAPS == 8);
     * 
     * // get names
     * assertEquals('SATURDAY',WeekDays.getName(2));
     * assertEquals('ITALIC|SMALLCAPS',FontStyles.getName(10));
     * 
     * @class an Enum of Number values
     * @constructor
     * @param arguments Enum names, string arguments, comma separated allowed (eg: ('ONE,TWO,THREE','FOUR')), use '_FLAGS' special name to create a flag based enum (every name gets a Math.pow(2,n) value)
     */
    tent.coreTypes.Enum = function Enum(){
        this.__names__ = [];
        this.__values__ = {};
		/**
		 * Indicates if flag enabled values are used (ie Math.pow(2,n))
		 * @field
		 */
        this.__flags__ = false;
        this.__enum = true; // identify as Enum, e.g. provides intellisense is VisualStudio
        if (arguments.length > 0) {
            this.add.apply(this, arguments);
        }
    }
    
    /**
     * @param {Number} value
     * @return {String} the name of a numeric value (if it's a combination of flags, returns a pipe separated string)
     */
    tent.coreTypes.Enum.prototype.getName = function(value){
    
        if (this.__names__) {
            if (this.__names__[value]) {
                return this.__names__[value];
            }
            else 
                if (this.__flags__) {
                    var v = value, n = '';
                    for (var name in this.__values__) {
                        if (this.__values__[name] && ((this.__values__[name] & v) === this.__values__[name])) {
                            v -= this.__values__[name];
                            if (n) {
                                n += '|';
                            }
                            n += name;
                        }
                    }
                    if (n && (v === 0)) {
                        return n;
                    }
                    else 
                        if (n) {
                            return n + '|' + v;
                        }
                }
        }
    };
	
    tent.coreTypes.Enum.prototype.__freeValue__ = function(){
        var free = (typeof this.__maxValue__ == 'undefined' ? 1 : this.__maxValue__ + 1);
        if (this.__values__ && typeof this.__values__[free] != 'undefined') {
            // __maxValue is out-dated, recalculate
            for (var n in this.__values__) {
                if (this.__values__[n] >= free) {
                    this.__maxValue__ = this.__values__[n];
                    free = this.__values__[n] + 1;
                }
            }
        }
        if (this.__flags__) {
            if (free < 1) {
                free = 1;
            }
            else {
                // return the next valid flag (Math.pow(2,x))
                free = Math.pow(2, Math.ceil(Math.log(free) / Math.log(2)));
            }
        }
        return free;
    };
    
    /**
     * Activates/Deactivates the use of flag enabled values (Math.pow(2,n))
     * @param {Boolean} use flag enabled values?
     * @return {tent.Enum} this Enum
     */
    tent.coreTypes.Enum.prototype.useFlags = function(uf){
        this.__flags__ = uf;
        return this;
    };
    
    var __setNameValue__ = function(_enum, name, value){
        // warning: only for internal use, doesnt validate for conflicts!
        _enum[name] = value;
        _enum.__values__[name] = value;
        if (typeof _enum.__names__[value] == 'undefined') {
            _enum.__names__[value] = name;
        }
        if ((typeof _enum.__maxValue__ == 'undefined') || _enum.__maxValue__ < value) {
            _enum.__maxValue__ = value;
        }
    };
    
    /**
     * Adds names to this Enum
     * @param arguments Enum names, string arguments, comma separated allowed (eg: ('ONE,TWO,THREE','FOUR')), use '_FLAGS' special name to create a flag based enum (every name gets a Math.pow(2,n) value)
     * @return {tent.Enum} this Enum
     */
    tent.coreTypes.Enum.prototype.add = function(){
    
        if (arguments.length < 1) {
            return this;
        }
        
        var names, name;
        
        for (var argi = 0, argl = arguments.length; argi < argl; argi++) {
        
            var data = arguments[argi];
            
            if (data instanceof Array) {
                // add from names array
                this.add.apply(this, data);
            }
            else 
                if (typeof data == 'object') {
                    // add from values dict
                    for (name in data) {
                        if (data.hasOwnProperty(name)) {
                            var v = this.__values__[name];
                            if ((!v instanceof Number) || (typeof this.__names__[v] != 'undefined')) {
                                v = this.__freeValue__();
                            }
                            __setNameValue__(this, name, v);
                        }
                    }
                }
            if (typeof data == 'string') {
                // add names, allow comma-separated names
                if (data) {
                    names = data.split(',');
                    for (var i = 0, l = names.length; i < l; i++) {
                        name = names[i].replace(/^\s+/g, '').replace(/\s+$/g, ''); // trim
                        if (name == '_FLAGS') {
                            // special name to activate flags behavior
                            this.useFlags(true);
                        }
                        else {
                            if (typeof this.__values__[name] != 'undefined') {
                                if (this.__values__[name] instanceof Number) {
                                    throw 'Enum duplicate name found: ' + name;
                                }
                                else {
                                    throw 'Enum invalid name (reserved): ' + name;
                                }
                            }
                            if (i == l - 1 && argi < argl - 1 && typeof arguments[argi + 1] == 'number') {
                                // add Enum name=specified value
                                __setNameValue__(this, name, arguments[argi + 1]);
                                argi++;
                            }
                            else {
                                // add new Enum name=value
                                __setNameValue__(this, name, this.__freeValue__());
                            }
                        }
                    }
                }
            }
        }
        return this;
    };
    
    var NameCounter_NodeToString = function(){
        var s = this._name + ((this._count > 1) ? '(' + this._count + ')' : '');
        if (this._childrenCount) {
            s += '{';
            var i = 0;
            for (var n in this) {
                if (n.substr(0, 1) != '_' && typeof this[n] == 'object') {
                    if (i > 0) {
                        s += ', ';
                    }
                    s += this[n];
                    i++;
                }
            }
            s += '}';
        }
        return s;
    };
    
    
    /**
     * Creates a new NameCounter
     * 
     * @example
     * 
     * var counter = new tent.coreTypes.NameCounter();
     * counter.add('reptiles.frog');
     * counter.add('mammals.cat',4);
     * counter.add('reptiles.frog');
     * counter.add('mammals.rat',8);
     * counter.add('reptiles',2);
     * 
     * // check totals
     * assertEquals('animals=(15){mammals(12){cat(4), rat(8)}, reptiles(4){frog(2)}}',
     * 		'animals='+counter);
     * 
     * @class a NameCounter that holds a (hierarchical) collection of named numeric counters, use {@link #toString} to get the current human-readable totals
     * @constructor
     * @param {String} name Counter root Name
     */
    tent.coreTypes.NameCounter = function NameCounter(name){
        this.root = {
            _name: name || '',
            _count: 0,
            toString: NameCounter_NodeToString
        };
    };
    
    tent.coreTypes.NameCounter.prototype.__nodeAdd__ = function(node, inc){
    
        node._count = (node._count || 0) + inc;
        if (node._parent) {
            if (node._count == 0 && !node._childrenCount) {
                if (node._parent._childrenCount) {
                    node._parent._childrenCount--;
                }
                delete node._parent[node._name];
            }
            this.__nodeAdd__(node._parent, inc);
        }
    };
    
    /**
     * Increments the count for a certain name
     * @param {String} name the name of the counter, a hierarchical counter can be specified using dot-separated name
     * @param {Number} inc
     */
    tent.coreTypes.NameCounter.prototype.add = function(name, inc){
        if (typeof inc != "number") {
            inc = 1;
        }
        
        var namePath = name.split('.');
        var node = this.root;
        for (var i = 0; i < namePath.length; i++) {
            if (typeof node[namePath[i]] == 'undefined') {
                node._childrenCount = (node._childrenCount || 0) + 1;
                node[namePath[i]] = {
                    _parent: node,
                    _name: namePath[i],
                    _count: 0,
                    toString: NameCounter_NodeToString
                };
            }
            node = node[namePath[i]];
        }
        
        this.__nodeAdd__(node, inc);
        
    };
    
    /**
     * Resets all counters
     */
    tent.coreTypes.NameCounter.prototype.reset = function(){
        this.root = {
            _name: this.root._name,
            _count: 0,
            toString: NameCounter_NodeToString
        };
    };
    
    tent.coreTypes.NameCounter.prototype.toString = function(){
        return NameCounter_NodeToString.apply(this.root);
    };
    
});


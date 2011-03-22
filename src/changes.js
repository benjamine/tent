/**
 * @requires tent
 * @requires tent.arrays
 * @requires tent.coreTypes
 * @name tent.changes
 * @namespace Change Tracking for Javascript Objects and Arrays
 */
tent.declare('tent.changes', function(){

    /**
     * Event change type
     * @type tent.coreTypes.Enum
     */
    tent.changes.EventTypes = new tent.coreTypes.Enum('ANY,MANYCHANGES,CHANGING,CHANGED,ADDING,ADDED,REMOVING,REMOVED');
    
    /**
     * Interceptor types
     * @type tent.coreTypes.Enum
     */
    tent.changes.InterceptorTypes = new tent.coreTypes.Enum('PROPERTY,FUNCTION');
    
    /**
     * Property setter intercept modes
     * @type tent.coreTypes.Enum
     */
    tent.changes.PropertyInterceptModes = new tent.coreTypes.Enum('NONE,DEFINESETTER,DEFINEPROPERTY,DEFINEPROPERTYONLYDOM');
	
    var _PropertyInterceptMode;
    
    /**
     * @return {Number} the best property setter intercept mode support in the current environment, a value of {@link tent.changes.PropertyInterceptModes}
     */
    tent.changes.getPropertyInterceptMode = function(){
        if (typeof _PropertyInterceptMode == 'undefined') {
            // detect available property intercept mode
            
            var anobject = {};
            if (Object.defineProperty) {
                try {
                    Object.defineProperty(anobject, 'myproperty', {
                        get: function(){
                            return this._myproperty;
                        },
                        set: function(value){
                            this._myproperty = value;
                        }
                    })
                    anobject.myproperty = 'my value';
                    if (anobject.myproperty === 'my value' && anobject._myproperty === 'my value') {
                        _PropertyInterceptMode = tent.changes.PropertyInterceptModes.DEFINEPROPERTY;
                    }
                } 
                catch (err) {
                    // defineProperty on javascript objects not supported test DOM object
                    if (document && document.createElement) {
                        var adomobject = document.createElement('span');
                        try {
                            Object.defineProperty(adomobject, 'myproperty', {
                                get: function(){
                                    return this._myproperty;
                                },
                                set: function(value){
                                    this._myproperty = value;
                                }
                            })
                            adomobject.myproperty = 'my value';
                            if (adomobject.myproperty === 'my value' && adomobject._myproperty === 'my value') {
                                _PropertyInterceptMode = tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM;
                            }
                        } 
                        catch (err) {
                            // defineProperty on dom objects not supported either
                        }
                    }
                }
            }
            if (typeof _PropertyInterceptMode == 'undefined') {
                anobject = {};
                if (anobject.__defineSetter__) {
                    try {
                        anobject.__defineGetter__('myproperty', function(){
                            return this._myproperty;
                        });
                        anobject.__defineSetter__('myproperty', function(value){
                            this._myproperty = value;
                        });
                        anobject.myproperty = 'my value';
                        if (anobject.myproperty === 'my value' && anobject._myproperty === 'my value') {
                            _PropertyInterceptMode = tent.changes.PropertyInterceptModes.DEFINESETTER;
                        }
                    } 
                    catch (err) {
                    }
                }
            }
            if (typeof _PropertyInterceptMode == 'undefined') {
                _PropertyInterceptMode = tent.changes.PropertyInterceptModes.NONE;
            }
        }
        return _PropertyInterceptMode;
    }
    
    /**
     * @return {String} the name of the best property setter intercept mode support in the current environment, a member of {@link tent.changes.PropertyInterceptModes}
     */
    tent.changes.getPropertyInterceptModeName = function(){
        return tent.changes.PropertyInterceptModes.getName(tent.changes.getPropertyInterceptMode());
    }
    
    /**
     * Creates a new Change
     * @class represents a detected change in an Object
     * @param {Object} subject the change object
     * @param {Number} eventType a value of {@link tent.changes.EventTypes}
     * @param {Object} [data] additional change data
     */
    tent.changes.Change = function Change(subject, eventType, data){
		/**
		 * The Object that changed
		 * @type Object|Array
		 * @field
		 */
        this.subject = subject;
		/**
		 * the type of change, a value of {@link tent.change.EventTypes}
		 * @type Number
		 * @field
		 */
        this.eventType = eventType;
		/**	
		 * additional information, depending on {@link #eventType}
		 * @field
		 */
        this.data = data;
    }
    
	/**
	 * Functions that stringify a {link tent.changes.Change} indexed by eventType (a value of {@link tent.changes.EventTypes})
	 * @type function()[]
	 */
    tent.changes.ChangeStringifiers = [];
    
    tent.changes.Change.prototype.toString = function(){
    
    
        if (typeof tent.changes.ChangeStringifiers[this.eventType] != 'undefined') {
        
            tent.changes.ChangeStringifiers[this.eventType](this);
            
        }
        else {
        
            // default change stringifier
            
            var change = this;
            var message = tent.changes.EventTypes.getName(change.eventType);
            if (change.eventType == tent.changes.EventTypes.MANYCHANGES) {
                message += ': ';
                if (change.data.length <= 3) {
                    for (var i = 0, l = change.data.length; i < l; i++) {
                        message += change.data[i].toString() + ",";
                    }
                }
                else {
                    // digest by event types
                    var et = {};
                    for (var i = 0, l = change.data.length; i < l; i++) {
                        et[change.data[i].eventType] = (et[change.data[i].eventType] || 0) + 1;
                    }
                    for (var e in et) {
                        message += tent.changes.EventTypes.getName(e) + '(' + et[e] + '),';
                    }
                }
            }
            else {
                if (change.data.propertyName) {
                    message += ' ' + change.data.propertyName;
                    if (change.eventType == tent.changes.EventTypes.CHANGING) {
                        message += ' from ' + change.data.current + ' to ' + change.data.newValue;
                    }
                    else 
                        if (change.eventType == tent.changes.EventTypes.CHANGED) {
                            message += ' from ' + change.data.oldValue + ' to ' + change.data.current;
                        }
                    message += ' (on ' + change.subject + ')';
                }
                if (change.data.items) {
                    var items = change.data.items;
                    message += ' ' + items.length + (items.length > 1 ? ' items' : ' item');
                    if (typeof change.data.index != 'undefined') {
                        message += ' at index ' + change.data.index;
                    }
                    if (change.data.propertyName) {
                        message += ' (' + change.subject.__parent__ + '.' + change.data.propertyName + ')';
                    }
                    else {
                        message += ' ([' + items + '])';
                    }
                }
            }
            return '[Change: ' + message + ']';
        }
    }
    
    
    /**
     * Creates a new Observable that notifies changes on a Javascript object, 
     * see http://en.wikipedia.org/wiki/Observer_pattern
     * @class Observes changes on a Javascript object and notifies them to subscribed handlers
     * @param {Object} subject the object to observe
     */
    tent.changes.Observable = function Observable(subject){
		
		/**
		 * Object or Array beeing observed
		 * @field
		 * @type Object|Array
		 */
        this.subject = subject;				
        this.handlers = {};
        this.interceptors = {};
		
		/**
		 * Indicates if change notification is suspended, see {@link #suspend} and {@link #resume}
		 * 
		 * This can be used to suspend notifications while performing bulk changes.
		 * Changes while suspended are notified on resume.
		 * @field
		 * @type Boolean
		 */
        this.suspended = false;
		
		/**
		 * Changes (Array of {@link tent.changes.Change} occurred while suspended (see {@link #suspend})
		 * 
		 * @type Array
		 * @field
		 */
		this.changesWhileSuspended=null;
    }
    
	/**
	 * Default prefix for back storage properties (used for intercepted properties)
	 * @type String
	 */
    var defaultBackPropertyPrefix = '_';
    
	/**
	 * Intercepts a function on {@link #subject}
	 * @param {Object} name the function name
	 * @param {Object} override the function to use as replacement
	 */
    tent.changes.Observable.prototype.interceptFunction = function(name, override){
        if (this.interceptors[name]) {
            return;
        }
        var _name = defaultBackPropertyPrefix + name;
        var intercept = {
            name: name,
            _name: _name,
            type: tent.changes.InterceptorTypes.FUNCTION
        };
        this.subject[_name] = this.subject[name];
        this.subject[name] = override;
        this.interceptors[name] = intercept;
    }
    
	/**
	 * Sets an object property value. If subject is an observed object, it ensures that its {@link tent.changes.Observable} is notified.
	 * 
	 * Its useful when no property intercept mode is supported {link tent.changes.PropertyInterceptModes}.
	 * 
	 * @example
	 * 
	 * 		tent.pset(subject, propertyName, value); // is equivalent to...
	 * 		subject[propertyName] = value; 
	 * 
	 * 		tent.pset(subject, source); // is equivalent to...
	 * 		subject[property1] = source[property1]; 
	 * 		subject[property2] = source[property2];
	 * 		// etc. (every property in source is copied)
	 * 
	 * @param {Object} subject the modified object
	 * @param {String|Object} propertyName the property to set, or an object to copy properties from
	 * @param [value] the value to set on property
	 * @param {Boolean} [skipInterceptors] if true values are set without calling interceptors
	 * @return the set value
	 */
    tent.pset = function(subject, propertyName, value, skipInterceptors){
		
		if (typeof propertyName == 'object') {
			for (var prop in propertyName) {
				if (propertyName.hasOwnProperty(prop)) {
					tent.pset(subject, prop, propertyName[prop], value);
				}
			}
			return subject;
		}
		else {
		
			if (subject.__observable__ && subject.__observable__.interceptors &&
			subject.__observable__.interceptors[propertyName]) {
				if (skipInterceptors) {
					var storeProp = subject.__observable__.interceptors[propertyName]._name || propertyName;
					subject[storeProp] = value;
				}
				else {
					subject.__observable__.interceptors[propertyName].newsetter.call(subject, value);
				}
			}
			else {
				subject[propertyName] = value;
			}
			return value;
		}
    }
    
	/**
	 * Gets the value of an object property. If subject is an observed object, it ensures that current value is obtained.
	 * 
	 * Its useful when no property intercept mode is supported {link tent.changes.PropertyInterceptModes}.  
	 * Equivalent to:
	 * 		subject[propertyName] 
	 * 
	 * @param {Object} subject the object to read
	 * @param {String} propertyName the property to read
	 * @return the property value
	 */
    tent.pget = function(subject, propertyName){
        if (subject.__observable__ && subject.__observable__.interceptors &&
        subject.__observable__.interceptors[propertyName]) {
            return subject.__observable__.interceptors[propertyName].newgetter.call(subject);
        }
        else {
            return subject[propertyName];
        }
    }
    
	/**
	 * Intercepts a property on {@link #subject}
	 * @param {String} name property name
	 * @param {String} _name back storage property name
	 * @param {function()} getter getter function
	 * @param {function()} setter setter function
	 * @return {Object} the new interceptor, or the already existing if there was one.
	 */
    tent.changes.Observable.prototype.interceptProperty = function(name, _name, getter, setter){
    
        if (this.interceptors[name]) {
            return this.interceptors[name];
        }
        
        var intercept = {
            name: name,
            type: tent.changes.InterceptorTypes.PROPERTY,
            newsetter: setter,
            newgetter: getter
        };
        
        if (_name) {
            _name = defaultBackPropertyPrefix + name;
            try {
                this.subject[_name] = this.subject[name];
            } 
            catch (error) {
                // error on property get, initialize as null
                this.subject[_name] = null;
            }
            intercept._name = _name;
        }
        
        var mode = tent.changes.getPropertyInterceptMode();
        
        if ((mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTY) ||
        ((mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM) &&
        (tent.isDOMObject(this.subject)))) {
        
            try {
                intercept.descriptor = Object.getOwnPropertyDescriptor(this.subject, name);
            } 
            catch (err) {
                // no descriptor found
            }
            var newDescriptor = { //   configurable: true,
                //   writable: true
            }
            
            if (getter) {
                newDescriptor.get = getter;
            }
            if (setter) {
                newDescriptor.set = setter;
            }
            
            try {
                Object.defineProperty(this.subject, name, newDescriptor);
            } 
            catch (error) {
                tent.log.warn('Object.defineProperty for property \'' + name + '\' failed: ' + error);
            }
        }
        else 
            if (mode == tent.changes.PropertyInterceptModes.DEFINESETTER) {
            
                try {
                    intercept.getter = this.subject.__lookupGetter__(name);
                    intercept.setter = this.subject.__lookupSetter__(name);
                } 
                catch (err) {
                // no getter/setter found
                }
                if (getter) {
                    try {
                        this.subject.__defineGetter__(name, getter);
                    } 
                    catch (error) {
                        tent.log.warn('Object.__defineGetter__ for property \'' + name + '\' failed: ' + error);
                    }
                }
                if (setter) {
                    try {
                        this.subject.__defineSetter__(name, setter);
                    } 
                    catch (error) {
                        tent.log.warn('Object.__defineSetter__ for property \'' + name + '\' failed: ' + error);
                    }
                }
            }
            else {
            // no property intercept supported
            // use: tent.pset(this.subject,'propertyName',value);  
            //      tent.pget(this.subject,'propertyName');  
            }
        
        if (intercept) {
            this.interceptors[name] = intercept;
        }
		return intercept;
    }

	/**
	 * Indicates if this Observable should notify a parent
	 * @private
	 * @return {Boolean} true if this Observable should notify a parent
	 */	
    tent.changes.Observable.prototype.shouldNotifyParent = function(){
		return !!(this.parentObject && 
			this.parentObject !== this &&
			this.parentObjectPropertyName &&
			this.parentObject.__observable__ &&
			this.parentObject.__observable__.interceptors &&
			this.parentObject.__observable__.interceptors[this.parentObjectPropertyName]
		); 
	}
	
	/**
	 * Notifies that the Observable parent property is changing
	 * @private
	 * @param {Object} data inner change data
	 */	
    tent.changes.Observable.prototype.notifyParentChanging = function(data){
		// notify parent object (change tracking on complex properties)
		data.subject = this.subject;
        this.parentObject.__observable__.notifyChange(tent.changes.EventTypes.CHANGING, {
            propertyName: this.parentObjectPropertyName,
		    innerChange: data
        });
	}

	/**
	 * Notifies that the Observable parent property has changed
	 * @private
	 * @param {Object} data inner change data
	 */	
    tent.changes.Observable.prototype.notifyParentChanged = function(data){
		// notify parent object (change tracking on complex properties)
		data.subject = this.subject;
        this.parentObject.__observable__.notifyChange(tent.changes.EventTypes.CHANGED, {
            propertyName: this.parentObjectPropertyName,
		    innerChange: data
        });
	}
	
	/**
	 * Creates a setter for a property that notifies the {@link tent.changes.Observable}
	 * @private
	 * @param {String} propName
	 * @param {String} _propName back storage property
	 * @return {function()} setter function
	 */
    var buildPropertySetter = function(propName, _propName){
        return function(value){
        
            var current = this[_propName];
            if (current != value) {
            
                this.__observable__.notifyChange(tent.changes.EventTypes.CHANGING, {
                    propertyName: propName,
                    current: current,
                    newValue: value
                });
				
				var notifyParent = this.__observable__.shouldNotifyParent();

				if (notifyParent) {
					// notify parent object (change tracking on complex properties)
	                this.__observable__.notifyParentChanging({
						propertyName: propName,
	                    current: current,
	                    newValue: value
					});
				}
                
                this[_propName] = value;
                
                this.__observable__.notifyChange(tent.changes.EventTypes.CHANGED, {
                    propertyName: propName,
                    current: value,
                    oldValue: current
                });
				
				if (notifyParent) {
					// notify parent object (change tracking on complex properties)
	                this.__observable__.notifyParentChanged({
						propertyName: propName,
	                    current: value,
	                    oldValue: current
					});
				}
            }
        }
    };
    
	/**
	 * Creates a getter for a property that uses a back storage property
	 * @private
	 * @param {String} propName
	 * @param {String} _propName back storage property
	 * @return {function()} getter function
	 */
    var buildPropertyGetter = function(propName, _propName){
        return function(){
            return this[_propName];
        }
    };
    
	/**
	 * Default filter for properties to intercept, by default it filters properties starting with underscore, ie: '_'
	 * @param {Object} obj
	 * @param {String} propName
	 */
    var defaultPropertyInterceptFilter = function(obj, propName){
        return propName.substr(0, 1) != defaultBackPropertyPrefix;
    };
    
	/**
	 * Intercepts properties of {@link #subject}, if new properties are added this function can be called again (it's idempotent)
	 * @param {Object} [options] intercepting options
	 * @param {function()} [options.propertyFilter] property filter, by default all properties starting with underscore are filtered
	 * @param {String} [options.backPropertyPrefix] prefix for back storage properties, by default is underscore
	 * @param {Boolean} [options.trackDomProperties] if true dom properties are intercepted too (by default false), see {@link tent.isDomObject} and {@link tent.isDomProperty}
	 * @return {tent.changes.Observable} this
	 */
    tent.changes.Observable.prototype.interceptProperties = function(options){
    
        if (!options) {
            options = {};
        }
        var filter = options.propertyFilter || defaultPropertyInterceptFilter;
        var backPropertyPrefix = options.backPropertyPrefix || defaultBackPropertyPrefix;
        
        var filterDomProps = (!options.trackDomProperties) && this.isDOMObject();
        
        
        for (var propName in this.subject) {
        
            if (tent.isDOMProperty(propName)) {
                continue;
            }
            
            var valueType;
            try {
                if (((valueType = typeof this.subject[propName]) != 'function') && filter(this.subject, propName)) {
                    var _propName = backPropertyPrefix + propName;
                    
                    this.interceptProperty(propName, _propName, buildPropertyGetter(propName, _propName), buildPropertySetter(propName, _propName));
                }
            } 
            catch (error) {
                tent.log.warn('Error intercepting property \'' + propName + '\': ' + error);
            }
        }
		return this;        
    }
    
	/**
	 * @return {Boolean} true if {@link #subject} is a DOM Object, see {@link tent.isDOMObject}
	 */
    tent.changes.Observable.prototype.isDOMObject = function(){
        if (typeof this._isDomObject == 'undefined') {
            this._isDOMObject = tent.isDOMObject(this.subject);
        }
        return this._isDOMObject;
    }
    
	/**
	 * Intercepts all array modifying functions on {@link #subject} (if {@link #subject} is an Array)
	 * <p>
	 * The only modifications that are not intercepted are:
	 * <ul>
	 *   <li>setting by index, ie: array[index]=value, use array.set(index,value) instead.</li>
	 *   <li>setting array length property, ie: array.length = newlength, use array.setLength(newLength) instead.</li>
	 * </ul>
	 * </p>	
	 * @param {Object} [options] intercepting options
	 * @return {tent.changes.Observable} this
	 */
    tent.changes.Observable.prototype.interceptArrayModifiers = function(options){
    
        if (!this.subject instanceof Array) {
            return this;
        }
		
        var array = this.subject;
       
	   	/**
	   	 * @inner
	   	 * @param {Object} l
	   	 */
        this.subject.setLength = function(l){
			// length setter that uses splice to trim arrays
            if (this.length > l) {
                this.splice(l, this.length - l);
            }
            else {
                this.lengh = l;
            }
        }
        
        this.interceptFunction('push', function(){
            var index = this.length;
            var itemsToAdd = Array.prototype.slice.call(arguments);
            this.__observable__.notifyChange(tent.changes.EventTypes.ADDING, {
                items: itemsToAdd,
                index: index,
                propertyName: this.__propertyName__
            });
			
			var notifyParent = this.__observable__.shouldNotifyParent();

			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanging({
					type: tent.changes.EventTypes.ADDING,
                    data: {
		                items: itemsToAdd,
		                index: index,
		                propertyName: this.__propertyName__
		            }
				});
			}
			
            this._push.apply(this, arguments);
            this.__observable__.notifyChange(tent.changes.EventTypes.ADDED, {
                items: itemsToAdd,
                index: index,
                propertyName: this.__propertyName__
            });
			
			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanged({
					type: tent.changes.EventTypes.ADDED,
                    data: {
		                items: itemsToAdd,
		                index: index,
		                propertyName: this.__propertyName__
		            }
				});
			}
        });
        
        this.interceptFunction('unshift', function(){
            var itemsToAdd = Array.prototype.slice.call(arguments);
            this.__observable__.notifyChange(tent.changes.EventTypes.ADDING, {
                items: itemsToAdd,
                index: 0,
                propertyName: this.__propertyName__
            });
									
			var notifyParent = this.__observable__.shouldNotifyParent();

			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanging({
					type: tent.changes.EventTypes.ADDING,
                    data: {
		                items: itemsToAdd,
		                index: 0,
		                propertyName: this.__propertyName__
		            }
				});
			}
			
            this._unshift.apply(this, arguments);
            this.__observable__.notifyChange(tent.changes.EventTypes.ADDED, {
                items: itemsToAdd,
                index: 0,
                propertyName: this.__propertyName__
            });
			
			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanged({
					type: tent.changes.EventTypes.ADDED,
                    data: {
		                items: itemsToAdd,
		                index: 0,
		                propertyName: this.__propertyName__
		            }
				});
			}
        });
        
        this.interceptFunction('pop', function(){
            var index = this.length - 1;
            this.__observable__.notifyChange(tent.changes.EventTypes.REMOVING, {
                items: [this[index]],
                index: index,
                propertyName: this.__propertyName__
            });
						
			var notifyParent = this.__observable__.shouldNotifyParent();

			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanging({
					type: tent.changes.EventTypes.REMOVING,
                    data: {
				        items: [this[index]],
				        index: index,
				        propertyName: this.__propertyName__
		            }
				});
			}
						
            var item = this._pop();
            this.__observable__.notifyChange(tent.changes.EventTypes.REMOVED, {
                items: [item],
                index: index,
                propertyName: this.__propertyName__
            });
			
			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanged({
					type: tent.changes.EventTypes.REMOVED,
                    data: {
		                items: [item],
		                index: index,
		                propertyName: this.__propertyName__
		            }
				});
			}
			
            return item;
        });
        
        this.interceptFunction('shift', function(){
            this.__observable__.notifyChange(tent.changes.EventTypes.REMOVING, {
                items: [this[0]],
                index: 0,
                propertyName: this.__propertyName__
            });
			
			var notifyParent = this.__observable__.shouldNotifyParent();

			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanging({
					type: tent.changes.EventTypes.REMOVING,
                    data: {
		                items: [this[0]],
		                index: 0,
		                propertyName: this.__propertyName__
		            }
				});
			}
			
            var item = this._shift();
            this.__observable__.notifyChange(tent.changes.EventTypes.REMOVED, {
                items: [item],
                index: 0,
                propertyName: this.__propertyName__
            });
			
						
			if (notifyParent) {
				// notify parent object (change tracking on complex properties)
                this.__observable__.notifyParentChanged({
					type: tent.changes.EventTypes.REMOVED,
                    data: {
		                items: [item],
		                index: 0,
		                propertyName: this.__propertyName__
		            }
				});
			}
			
            return item;
        });
        
        this.interceptFunction('splice', function(start, deleteCnt){
        
            var itemsToAdd;
			var notifyParent = this.__observable__.shouldNotifyParent();
            if (deleteCnt && deleteCnt > 0) {
                this.__observable__.notifyChange(tent.changes.EventTypes.REMOVING, {
                    items: this.slice(start, start + deleteCnt),
                    index: start,
                    propertyName: this.__propertyName__
                });

				if (notifyParent) {
					// notify parent object (change tracking on complex properties)
	                this.__observable__.notifyParentChanging({
						type: tent.changes.EventTypes.REMOVING,
	                    data: {
			                items: this.slice(start, start + deleteCnt),
			                index: start,
			                propertyName: this.__propertyName__
			            }
					});
				}
            }
            if (arguments.length > 2) {
                itemsToAdd = Array.prototype.slice.call(arguments, 2);
                this.__observable__.notifyChange(tent.changes.EventTypes.ADDING, {
                    items: itemsToAdd,
                    index: start,
                    propertyName: this.__propertyName__
                });
				
				if (notifyParent) {
					// notify parent object (change tracking on complex properties)
	                this.__observable__.notifyParentChanging({
						type: tent.changes.EventTypes.ADDING,
	                    data: {
		                    items: itemsToAdd,
		                    index: start,
		                    propertyName: this.__propertyName__
			            }
					});
				}
            }
            
            if (itemsToAdd && itemsToAdd.length > 0) {
                var spliceArgs = itemsToAdd.slice(0);
                spliceArgs.unshift(start, deleteCnt);
                var removedItems = this._splice.apply(this, spliceArgs);
            }
            else {
                var removedItems = this._splice(start, deleteCnt);
            }
            
            if (removedItems && removedItems.length > 0) {
                this.__observable__.notifyChange(tent.changes.EventTypes.REMOVED, {
                    items: removedItems,
                    index: start,
                    propertyName: this.__propertyName__
                });
				
				if (notifyParent) {
					// notify parent object (change tracking on complex properties)
	                this.__observable__.notifyParentChanged({
						type: tent.changes.EventTypes.REMOVED,
	                    data: {
		                    items: removedItems,
		                    index: start,
		                    propertyName: this.__propertyName__
			            }
					});
				}				
            }
            if (arguments.length > 2) {
                this.__observable__.notifyChange(tent.changes.EventTypes.ADDED, {
                    items: itemsToAdd,
                    index: start,
                    propertyName: this.__propertyName__
                });
								
				if (notifyParent) {
					// notify parent object (change tracking on complex properties)
	                this.__observable__.notifyParentChanged({
						type: tent.changes.EventTypes.ADDED,
	                    data: {
		                    items: itemsToAdd,
		                    index: start,
		                    propertyName: this.__propertyName__
			            }
					});
				}	
            }
            
            return removedItems;
        });
        

        //// intercept length setter is not allowed on some browsers
        //        this.interceptProperty('length', null, null, function(value) {
        //            if (this.length > value) {
        //                this.splice(value, this.length - value);
        //            }
        //        });
        
        // add remove function
        array.remove = tent.arrays.functions.remove;
        
        // add set function (to use instead of: array[i] = item;)
        array.set = tent.arrays.functions.set;
        
        if (!array.indexOf) {
            // add indexOf function (not provided by some browsers)
            array.indexOf = tent.arrays.functions.indexOf;
        }
        if (!array.lastIndexOf) {
            // add lastIndexOf function (not provided by some browsers)
            array.lastIndexOf = tent.arrays.functions.lastIndexOf;
        }
        
        return this;
    }
    
	/**
	 * Removes an interceptor by name, restoring the property or function original state
	 * @param {String} name a function or property name on {@link #subject}
	 */
    tent.changes.Observable.prototype.removeInterceptor = function(name){
        var interceptor = this.interceptors[name];
        
        if (interceptor._name) {
            if (interceptor.type != tent.changes.InterceptorTypes.FUNCTION) {
                try {
                    delete this.subject[interceptor.name];
                } 
                catch (error) {
                    tent.log.warn('Error deleting property interceptor \'' + interceptor.name + '\': ' + error);
                }
                
                var mode = tent.changes.getPropertyInterceptMode();
                if (mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTY ||
                (mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM &&
                tent.isDOMObject(this.subject))) {
                    if (interceptor.descriptor && interceptor.descriptor.name) {
                        Object.defineProperty(this.subject, name, interceptor.descriptor);
                    }
                }
                else 
                    if (mode == tent.changes.PropertyInterceptModes.DEFINESETTER) {
                        if (interceptor.getter) {
                            this.subject.__defineGetter__(name, interceptor.getter);
                        }
                        if (interceptor.setter) {
                            this.subject.__defineSetter__(name, interceptor.setter);
                        }
                    }
                    else {
                    // no property interceptors supported, nothing to remove
                    }
                
            }
            
            var domObject;
            try {
                this.subject[interceptor.name] = this.subject[interceptor._name];
            } 
            catch (error) {
                domObject = tent.isDOMObject(this.subject);
                // error setting property values are common on DOM objects
                if (!domObject) {
                    tent.log.warn('Error restoring property \'' + interceptor.name + '\' value: ' + error);
                }
            }
            try {
                delete this.subject[interceptor._name];
            } 
            catch (error) {
                tent.log.warn('Error deleting back storage property \'' + interceptor._name + '\': ' + error);
            }
        }
        else {
            if (interceptor.type != tent.changes.InterceptorTypes.FUNCTION) {
                var val = this.subject[interceptor.name];
                delete this.subject[interceptor.name];
                this.subject[interceptor.name] = val;
            }
        }
        delete interceptor[name];
    }
    
	/**
	 * Removes all interceptors, see {@link #removeInterceptor}
	 */
    tent.changes.Observable.prototype.removeInterceptors = function(){
        for (var propName in this.interceptors) {
            try {
                this.removeInterceptor(propName);
            } 
            catch (error) {
                tent.log.warn('Error removing interceptor from property \'' + propName + '\': ' + error);
            }
        }
        this.interceptors = {};
    }
    
	/**
	 * Suspends change notification, see {@link #suspended}
	 */
    tent.changes.Observable.prototype.suspend = function(){
        this.suspended = true;
    }
    
	/**
	 * Resumes change notification, notifying at once all changes ocurred while suspended
	 * 
	 * If few changes have ocurred while suspended (5 or less) they are all notified in order.
	 * If many changes have ocurred a {@link tent.changes.EventTypes.MANYCHANGES} event is fired with all changes packed in its data
	 */
    tent.changes.Observable.prototype.resume = function(){
        this.suspended = false;
        if (this.changesWhileSuspended) {
            // notify changes while suspended
            if (this.changesWhileSuspended.length < 5) {
                // if there were few changes, notify them now
                for (var i = 0, l = this.changesWhileSuspended.length; i < l; i++) {
                    this.notifyChange(this.changesWhileSuspended[i]);
                }
            }
            else 
                if (this.changesWhileSuspended.length > 1) {
                    // too many changes, notify MANYCHANGES, list of changes data can be used to find specific changes
                    this.notifyChange(tent.changes.EventTypes.MANYCHANGES, this.changesWhileSuspended);
                }
            delete this.changesWhileSuspended;
        }
    }

	/**
	 * Test if an object is a valid change handler, eg: a function or an object with handle() function 
	 * 
	 * This function is used to test handlers when binding {@link #bind}
	 * @param {Object|function()} handler
	 * @return {Boolean} true if handler is a valid change handler
	 */    
    tent.changes.Observable.prototype.isValidHandler = function(handler){
        if (!handler) {
            return false;
        }
        if ((typeof handler == 'function') ||
        ((typeof handler == 'object') && (typeof handler.handle == 'function'))) {
            return true;
        }
        return false;
    }
    
	/**
	 * Binds a change handler to an event type, see {@link tent.changes.EventTypes}
	 * @param {Number} [eventType] a value of {@link tent.changes.EventTypes}, if none is provided all events are included
	 * @param {Object|function()} handler a valid change handler, see {@link #isValidHandler}
	 * @return {Boolean} false if no action has been performed (ie: the binding already exists)
	 */
    tent.changes.Observable.prototype.bind = function(eventType, handler){
        if (!handler) {
            if (this.isValidHandler(eventType)) {
                handler = eventType;
                eventType = tent.changes.EventTypes.ANY;
            }
            else {
                throw 'must specify a handler: function (Change) or and object with a handle(Change) function';
            }
        }
        
        if (!this.isValidHandler(handler)) {
            throw 'must specify a handler: function (Change) or and object with a handle(Change) function';
        }
        
        if (!eventType) {
            eventType = tent.changes.EventTypes.ANY;
        }
        var ehandlers = this.handlers[eventType];
        if (!ehandlers) {
            ehandlers = this.handlers[eventType] = [];
        }
        for (var i = 0; i < ehandlers.length; i++) {
            if (ehandlers[i] == handler) {
                return false;
            }
        }
        this.handlers[eventType].push(handler);
        return true;
    }
    
	/**
	 * Unbinds a handler
	 * @param {Number} [eventType] a value of {@link tent.changes.EventTypes}, if none is provided all events are included
	 * @param {Object|function()} handler the handler to unbind
	 * @return {Boolean} false if no action has been performed (ie: the binding doesn't exists)
	 */
    tent.changes.Observable.prototype.unbind = function(eventType, handler){
        if (!handler) {
            if (this.isValidHandler(eventType)) {
                handler = eventType;
                eventType = tent.changes.EventTypes.ANY;
            }
            else {
                throw 'must specify a handler to remove';
            }
        }
        
        if (!this.isValidHandler(handler)) {
            throw 'must specify a handler to remove';
        }
        
        if (!eventType) {
            eventType = tent.changes.EventTypes.ANY;
        }
        var ehandlers = this.handlers[eventType];
        var removed = false;
        if (ehandlers) {
            for (var i = 0, l = ehandlers.length; i < l; i++) {
                if (ehandlers[i] == handler) {
                    ehandlers.splice(i, 1);
                    i--;
                    l--;
                    removed = true;
                }
            }
        }
        return removed;
    }
    
	/**
	 * Unbinds all handlers that pass a filter
	 * @param {function()} filter a function that receives a handler and returns true if it must be unbound
	 * @return {Boolean} false if no action has been performed (ie: no handler has been unbound)
	 */
    tent.changes.Observable.prototype.unbindWhere = function(filter){
        var changed = false;
        for (var eventType in this.handlers) {
            var ehandlers = this.handlers[eventType];
            for (var i = 0, l = ehandlers.length; i < l; i++) {
                if (filter(ehandlers[i])) {
                    ehandlers.splice(i, 1);
                    i--;
                    l--;
                    changed = true;
                }
            }
        }
        return changed;
    }
    
	/**
	 * Notifies a handler of a {@link tent.changes.Change}
	 * @private
	 * @param {tent.changes.Change} change a change to notify
	 * @param {Object|function()} handler a change handler, see {@link #isValidHandler}
	 * @return the handler result 
	 */
    tent.changes.Observable.prototype.notifyHandler = function(change, handler){
        try {
            if (typeof handler == 'function') {
                return handler.call(this.subject, change);
            }
            else {
                return handler.handle(change);
            }
        } 
        catch (err) {
            var message = '';
            if (err.stack) {
                message += err.stack;
            }
            else 
                if (err.message) {
                    message += err.message;
                }
            tent.log.error('Change Handler Error: ' + err + (message ? ('\n' + message) : ''));
            return err;
        }
    }
    
	/**
	 * Notifies a {@link tent.changes.Change} to bound handlers 
	 * @private
	 * @param {Number|tent.changes.Change} [eventType] a value of {@link tent.changes.EventTypes}, or a {@link tent.changes.Change} (in this case data parameter is ignored)
	 * @param {Object} [data] change additional data
	 */
    tent.changes.Observable.prototype.notifyChange = function(eventType, data){
        if (this.suspended) {
            // register changes while suspended to notify them on resume
            if (!this.changesWhileSuspended) {
                this.changesWhileSuspended = [];
                if (!this.changesWhileSuspended.filter) {
                    this.changesWhileSuspended.filter = tent.arrays.functions.filter;
                }
                this.changesWhileSuspended.findByEventType = function(){
                    for (var i = 0, l = this.length; i < l; i++) {
                        for (var ai = 0, al = arguments.length; ai < al; ai++) {
                            if (this[i].eventType == arguments[ai]) {
                                return this[i];
                            }
                        }
                    }
                }
                this.changesWhileSuspended.findPropertyChanged = function(subject, propertyName){
                    for (var i = 0, l = this.length; i < l; i++) {
                        if (this[i].subject == subject &&
                        this[i].eventType == tent.changes.EventTypes.CHANGED &&
                        this[i].data.propertyName == propertyName) {
                            return this[i];
                        }
                    }
                }
                this.changesWhileSuspended.findArrayChanged = function(array){
                    for (var i = 0, l = this.length; i < l; i++) {
                        if (this[i].subject == subject &&
                        (this[i].eventType == tent.changes.EventTypes.ADDED ||
                        this[i].eventType == tent.changes.EventTypes.REMOVED)) {
                            return this[i];
                        }
                    }
                }
            }
            this.changesWhileSuspended.push(new tent.changes.Change(this.subject, eventType, data));
            return;
        }
        var change;
        if (eventType instanceof tent.changes.Change) {
            change = eventType;
        }
        else {
            change = new tent.changes.Change(this.subject, eventType, data);
        }
        var ehandlers = this.handlers[eventType];
        if (ehandlers) {
            for (var i = 0, l = ehandlers.length; i < l; i++) {
                this.notifyHandler(change, ehandlers[i]);
            }
        }
        ehandlers = this.handlers[tent.changes.EventTypes.ANY];
        if (ehandlers) {
            for (var i = 0, l = ehandlers.length; i < l; i++) {
                this.notifyHandler(change, ehandlers[i]);
            }
        }
    }
    
    var defaultLogHandler;
    
	/**
	 * Activates/Deactivates logging of changes, a default {@link tent.changes.LogHandler} is used.
	 * @param {Boolean} [enable] true to enable (default), false to disable
	 * @return {Boolean} false if no action has been performed (ie: logging was already enabled/disabled)
	 */
    tent.changes.Observable.prototype.log = function(enable){
		if (typeof enable=='undefined'){
			enable = true;
		}
        if (enable) {
            if (!defaultLogHandler) {
                defaultLogHandler = new tent.changes.LogHandler();
            }
            return this.bind(defaultLogHandler);
        }
        else {
            if (defaultLogHandler) {
                return this.unbind(defaultLogHandler);
            }
        }
        return false;
    }
 
 	/**
 	 * Creates a new change handler that sends change data to the log, see {@link tent.log.info} 
 	 * @class Change handler that sends change data to log, see {@link tent.log.info}
 	 * @constructor
 	 * @param {String} [prefix] a prefix for log entries of this handler
 	 */   
    tent.changes.LogHandler = function LogHandler(prefix){
    	
        if (typeof prefix == 'undefined') {
            prefix = ''
        }
        else 
            if (prefix && prefix[prefix.length - 1] != ' ') {
                prefix += ' ';
            }
		
		/**
		 * prefix for log entries
		 * @type String
		 * @field
		 */
		this.prefix = prefix;
    }
	
	/**
	 * Logs a {@link tent.changes.Change}
	 * @param {tent.changes.Change} change
	 */	
	tent.changes.LogHandler.prototype.handle = function(change){
	    tent.log.info(this.prefix + change.toString());
	}
    
	/**
	 * Creates a live propagate handler, a handler that binds current handlers on new added/connected objects
	 * @private
	 * @param {Object} [options] propagate options
	 * @param {Boolean} [options.deepOverDOM] propagate thru dom properties, see {@link tent.isDomProperty}
	 */
    var buildLivePropagateHandler = function(options){
        var propagateOptions = {};
        for (opName in options) {
            if (opName != 'deepStack' && opName != 'liveHandler') {
                propagateOptions[opName] = options[opName];
            }
        }
        var f = function(change){
            if (change.eventType == tent.changes.EventTypes.CHANGED) {
                if (typeof change.data.current == 'object') {
                    if (propagateOptions.deepOverDOM || !tent.isDOMObject(change.data.current)) {
                        propagateOptions.deepStack = [change.data.subject];
                        tent.changes.track(change.data.current, propagateOptions);
                        delete propagateOptions.deepStack;
                    }
                }
            }
            else 
                if (change.eventType == tent.changes.EventTypes.ADDED) {
                    for (var i = 0, l = change.data.items.length; i < l; i++) {
                        if (typeof change.data.items[i] == 'object') {
                            if (propagateOptions.deepOverDOM || !tent.isDOMObject(change.data.current)) {
                                propagateOptions.deepStack = [change.data.subject];
                                tent.changes.track(change.data.items[i], propagateOptions);
                                delete propagateOptions.deepStack;
                            }
                        }
                    }
                }
        }
        f.isLivePropagator = true;
        return f;
    }
    
	/**
	 * Activates Change Tracking on a Javascript Object or Array.
	 * Optionally binds change handlers. This function is idempotent.
	 * 
	 * <p>
	 * 		The attached {@link tent.changes.Observable} is stored on the obj.__observable__ property.
	 * </p>
	 * 
	 * @param {Object|Array} obj an Object or Array to track. 
	 * @param {Object} [options] tracking options
	 * @param {tent.changes.Observable} [options.observable] an {@link tent.changes.Observable} to attach (otherwise a new one is created)
	 * @param {Boolean} [options.remove] if true, indicates that specified bindings must be removed 
	 * @param {Boolean} [options.removeAll] if true, indicates that all bindings, even {@link tent.changes.Observable} instances must be removed
	 * @param {Object} [options.interceptOptions] options to use when calling {@link tent.changes.Observable.interceptProperties} or {@link tent.changes.Observable.interceptArrayModifiers}
	 * @param {Array} [options.bindings] bindings to add (or remove, see options.remove), eg: { eventType: tent.changes.EventTypes.CHANGED, handler: function(change){alert(change+'');} };
	 * @param {Boolean} [options.log] if true log handlier is included, see {@link tent.changes.LogHandler}
	 * @param {Boolean} [options.reverseProperties] if true reverse properties handling is included, see {@link tent.changes.reverseProperties.getHandler}
	 * @param {Boolean} [options.deep] if true recursively traverse Object properties and Array items
	 * @param {Boolean} [options.attachedObjects] if true objects attached to a {@link tent.entities.Context} are tracked too, by default is true (if false deep tracking stops at attached objects)
	 * @param {Object} [options.parentObject] the object that is modified when this object changes (allows change tracking on complex properties)
	 * @param {String} [options.parentObjectPropertyName] name of the property in parentObject that contains this observed object (allows change tracking on complex properties)
	 * @param {Boolean} [options.live] if true combined with options.deep, when new Objects or Arrays are added/linked to tracked ones they get tracked too 
	 * @param {function()} [options.propertyFilter] if true combined with options.deep, when traversing Object properties, properties that doesn't satisfy this condition are ignored
	 * @return {Boolean} false if no action has been performed (ie: the object was already tracked)
	 */
    tent.changes.track = function(obj, options){
    
        if (!options) {
            options = {};
        }
        
        if (typeof obj != 'object') {
            if (!options.deepStack) {
                throw ('Cannot track changes of ' + typeof obj);
            }
            return false;
        }
        else 
            if (obj == null) {
                if (!options.deepStack) {
                    throw ('Cannot track changes of null');
                }
                return false;
            }
			
		if ((options.attachedObjects === false) && (obj.__collection__)){
			// object is attached to a context
			return false;
		}
        
        var isArray = (obj instanceof Array);
        
        var changed = false;
        
        if (!options.remove && !options.removeAll && !obj.__observable__) {
        
            // attach a Observable
            if (options.observable && (!options.observable.subject || options.observable.subject == obj)) {
                obj.__observable__ = options.observable;
                obj.__observable__.subject = obj;
            }
            else {
                obj.__observable__ = new tent.changes.Observable(obj);
            }
			
            changed = true;
              
            if (!options.interceptOptions) {
                options.interceptOptions = {};
            }
            
            // add interceptors to obj
            if (isArray) {
                obj.__observable__.interceptArrayModifiers(options.interceptOptions);
            }
            else {
                obj.__observable__.interceptProperties(options.interceptOptions);
            }
        }
		
		if (options.parentObject && typeof options.parentObjectPropertyName){
			// register Observable parentObject and property, 
			// any change will be reported as a change on this parent object property
			// this allows complex properties change tracking
			if (obj.__observable__.parentObject !== options.parentObject){				
	            obj.__observable__.parentObject = options.parentObject;
				changed = true;
			}
			if (obj.__observable__.parentObjectPropertyName !== options.parentObjectPropertyName){
	            obj.__observable__.parentObjectPropertyName = options.parentObjectPropertyName;
				changed = true;
			}
		}else if (options.parentObject === false){
			if (typeof obj.__observable__.parentObject != 'undefined'){				
	            delete obj.__observable__.parentObject;
				changed = true;
			}
			if (obj.__observable__.parentObjectPropertyName != 'undefined'){
	            delete obj.__observable__.parentObjectPropertyName;
				changed = true;
			}
		}
		
        
        // bind event handlers
        if (options.bindings) {
            for (var i = 0, l = options.bindings.length; i < l; i++) {
                var binding = options.bindings[i];
                if ((isArray && binding.bindArrays != false) || (!isArray && binding.bindObjects != false)) {
                    if (options.remove) {
                        if (obj.__observable__ && obj.__observable__.unbind(binding.eventType, binding.handler)) {
                            changed = true;
                        }
                    }
                    else {
                        if (obj.__observable__.bind(binding.eventType, binding.handler)) {
                            changed = true;
                        }
                    }
                }
            }
        }
        // bind special event handlers
        if (options.log) {
            // log changes
            if (obj.__observable__ && obj.__observable__.log(!options.remove)) {
                changed = true;
            }
        }
        if (options.reverseProperties) {
            // keep reverse properties in sync
            if (options.remove) {
                if (obj.__observable__ && obj.__observable__.unbind(tent.changes.reverseProperties.getHandler())) {
                    changed = true;
                }
            }
            else {
                if (obj.__observable__.bind(tent.changes.reverseProperties.getHandler())) {
                    changed = true;
                }
            }
        }
        
        if (options.removeAll && obj.__observable__) {
            // remove observable
            obj.__observable__.removeInterceptors();
            delete obj.__observable__.subject;
            delete obj.__observable__;
            changed = true;
        }
        
        if (options.deep && options.live && !options.remove) {
            // propagate bindings when new items are added to the graph
            if (options.remove) {
                // remove all live propagators
                if (obj.__observable__.unbindWhere(function(l){
                    return l.isLivePropagator;
                })) {
                    changed = true;
                }
            }
            else {
                if (!options.liveHandler) {
                    options.liveHandler = buildLivePropagateHandler(options);
                }
                if (obj.__observable__.bind(options.liveHandler)) {
                    changed = true;
                }
            }
        }
        
        if (options.deep) {
            if (!options.deepStack) {
                options.deepStack = [obj];
                if (!options.deepStack.lastIndexOf) {
                    options.deepStack.lastIndexOf = tent.arrays.functions.lastIndexOf;
                }
            }
            else {
                options.deepStack.push(obj);
            }
            
            if (isArray) {
                // go deep, through array items
                for (var i = 0, l = obj.length; i < l; i++) {
                    var subObj = obj[i];
                    if (subObj && typeof subObj == "object" && options.deepStack.lastIndexOf(subObj) < 0) {
                        if (tent.changes.track(subObj, options)) {
                            changed = true;
                        }
                    }
                }
            }
            else {
                // go deep, through referred objects
                var filter = options.propertyFilter || defaultPropertyInterceptFilter;
                var backPropertyPrefix = options.backPropertyPrefix || defaultBackPropertyPrefix;
                for (var propName in obj) {
                    var valueType;
                    if (((valueType = typeof obj[propName]) != 'function') && filter(obj, propName)) {
                        var subObj = obj[propName];
                        if (options.deepOverDOM || !tent.isDOMObject(subObj)) {
                            if (typeof subObj == "object" && options.deepStack.lastIndexOf(subObj) < 0) {
                                if (tent.changes.track(subObj, options)) {
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
            
            options.deepStack.pop();
        }
        
        return changed;
    }
    
	/**
	 * Deactivates Change Tracking on a Javascript Object or Array.
	 * Optionally unbinds change handlers. This function is idempotent.
	 * 
	 * @param {Object|Array} obj an Object or Array to deactivate tracking. 
	 * @param {Object} [options] untracking options, for details see {@link tent.changes.track} options, this functions forces options.removeAll=true
	 * @return {Boolean} false if no action has been performed (ie: the object wasn't tracked)
	 */
    tent.changes.untrack = function(obj, options){
        if (!options) {
            options = {
                removeAll: true
            };
        }
        else 
            if (!options.removeAll) {
                options.removeAll = true;
            }
        return tent.changes.track(obj, options);
    }
    
	/**
	 * Indicates if an Object or Array is being tracked
	 * @return {Boolean} true if the object is being change tracked, see {@link tent.changes.track}
	 * @param {Object} obj
	 */
    tent.changes.isTracked = function(obj){
        return obj.__observable__ && obj.__observable__ instanceof tent.changes.Observable;
    }
    
	/**
	 * Binds change handlers to a Javascript Object or Array (it activates change tracking, see {@link tent.changes.track})
	 * @param {Object|Array} obj an Object or Array to track changes and bind change handlers
	 * @param {Object|function()} [options] binding options or a change handler to bind, for details see {@link tent.changes.track} options, this functions fills options.bindings
	 * @return {Boolean} false if no action has been performed (ie: the binding already exists)
	 */
    tent.changes.bind = function(obj, options){
    
        var eventType;
        if (typeof options == "string") {
            var eventType = options;
            options = {
                bindings: []
            };
        }
        else 
            if (typeof options == "function") {
                options = {
                    bindings: [{
                        handler: options
                    }]
                };
            }
            else 
                if (typeof options == "object" && typeof options.handle == "function") {
                    options = {
                        bindings: [{
                            handler: options
                        }]
                    };
                }
        if (arguments.length > 2) {
            if (!options) {
                options = {
                    bindings: []
                }
            }
            else 
                if (!options.bindings) {
                    options.bindings = [];
                }
            for (var i = 2; i < arguments.length; i++) {
                options.bindings.push({
                    eventType: eventType,
                    handler: arguments[i]
                });
            }
        }
        
        return tent.changes.track(obj, options);
    }
    
	/**
	 * Unbinds change handlers from a Javascript Object or Array
	 * @param {Object|Array} obj an Object or Array to unbind change handlers
	 * @param {Object|function()} [options] unbinding options or a change handler to unbind, for details see {@link tent.changes.track} options, this functions sets options.remove=true and fills options.bindings
	 * @return {Boolean} false if no action has been performed (ie: the binding doesn't exists)
	 */
    tent.changes.unbind = function(obj, options){
    
        var eventType;
        if (typeof options == "string") {
            var eventType = options;
            options = {
                bindings: []
            };
        }
        else 
            if (typeof options == "function") {
                options = {
                    bindings: [{
                        handler: options
                    }]
                };
            }
            else 
                if (typeof options == "object" && typeof options.handle == "function") {
                    options = {
                        bindings: [{
                            handler: options
                        }]
                    };
                }
        if (arguments.length > 2) {
            if (!options) {
                options = {
                    bindings: []
                }
            }
            else 
                if (!options.bindings) {
                    options.bindings = [];
                }
            for (var i = 2; i < arguments.length; i++) {
                options.bindings.push({
                    eventType: eventType,
                    handler: arguments[i]
                });
            }
        }
        
        if (!options) {
            options = {
                remove: true
            };
        }
        else 
            if (!options.remove) {
                options.remove = true;
            }
        
        return tent.changes.track(obj, options);
    }
    
});






tent.declare('tent.changes', function(exports){

    exports.EventTypes = new tent.coreTypes.Enum('ANY,MANYCHANGES,CHANGING,CHANGED,ADDING,ADDED,REMOVING,REMOVED');
    
    exports.InterceptorTypes = new tent.coreTypes.Enum('PROPERTY,FUNCTION');
    
    exports.PropertyInterceptModes = new tent.coreTypes.Enum('NONE,DEFINESETTER,DEFINEPROPERTY,DEFINEPROPERTYONLYDOM');
    
    var _PropertyInterceptMode;
    
    exports.getPropertyInterceptMode = function(){
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
                        _PropertyInterceptMode = exports.PropertyInterceptModes.DEFINEPROPERTY;
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
                                _PropertyInterceptMode = exports.PropertyInterceptModes.DEFINEPROPERTYONLYDOM;
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
                            _PropertyInterceptMode = exports.PropertyInterceptModes.DEFINESETTER;
                        }
                    } 
                    catch (err) {
                    }
                }
            }
            if (typeof _PropertyInterceptMode == 'undefined') {
                _PropertyInterceptMode = exports.PropertyInterceptModes.NONE;
            }
        }
        return _PropertyInterceptMode;
    }
    
    exports.getPropertyInterceptModeName = function(){
        return exports.PropertyInterceptModes.getName(exports.getPropertyInterceptMode());
    }
    
    exports.Change = function Change(subject, eventType, data){
        this.subject = subject;
        this.eventType = eventType;
        this.data = data;
    }
    
    exports.ChangeStringifiers = [];
    
    exports.Change.prototype.toString = function(){
    
    
        if (typeof exports.ChangeStringifiers[this.eventType] != 'undefined') {
        
            exports.ChangeStringifiers[this.eventType](this);
            
        }
        else {
        
            // default change stringifier
            
            var change = this;
            var message = exports.EventTypes.getName(change.eventType);
            if (change.eventType == exports.EventTypes.MANYCHANGES) {
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
                        message += exports.EventTypes.getName(e) + '(' + et[e] + '),';
                    }
                }
            }
            else {
                if (change.data.propertyName) {
                    message += ' ' + change.data.propertyName;
                    if (change.eventType == exports.EventTypes.CHANGING) {
                        message += ' from ' + change.data.current + ' to ' + change.data.newValue;
                    }
                    else 
                        if (change.eventType == exports.EventTypes.CHANGED) {
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
    
    exports.Observable = function Observable(subject){
        this.subject = subject;
        this.handlers = {};
        this.interceptors = {};
        this.suspended = false;
    }
    
    var defaultBackPropertyPrefix = '_';
    
    exports.Observable.prototype.interceptFunction = function(name, override){
        if (this.interceptors[name]) {
            return;
        }
        var _name = defaultBackPropertyPrefix + name;
        var intercept = {
            name: name,
            _name: _name,
            type: exports.InterceptorTypes.FUNCTION
        };
        this.subject[_name] = this.subject[name];
        this.subject[name] = override;
        this.interceptors[name] = intercept;
    }
    
    exports.parent.pset = function(subject, propertyName, value){
        if (subject.__observable__ && subject.__observable__.interceptors &&
        subject.__observable__.interceptors[propertyName]) {
            subject.__observable__.interceptors[propertyName].newsetter.call(subject, value);
        }
        else {
            subject[propertyName] = value;
        }
    }
    
    exports.parent.pget = function(subject, propertyName){
        if (subject.__observable__ && subject.__observable__.interceptors &&
        subject.__observable__.interceptors[propertyName]) {
            return subject.__observable__.interceptors[propertyName].newgetter.call(subject);
        }
        else {
            return subject[propertyName];
        }
    }
    
    exports.Observable.prototype.interceptProperty = function(name, _name, getter, setter){
    
        if (this.interceptors[name]) {
            return;
        }
        
        var intercept = {
            name: name,
            type: exports.InterceptorTypes.PROPERTY,
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
        
        var mode = exports.getPropertyInterceptMode();
        
        if ((mode == exports.PropertyInterceptModes.DEFINEPROPERTY) ||
        ((mode == exports.PropertyInterceptModes.DEFINEPROPERTYONLYDOM) &&
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
            if (mode == exports.PropertyInterceptModes.DEFINESETTER) {
            
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
    }
    
    var buildPropertySetter = function(propName, _propName){
        return function(value){

            var current = this[_propName];
            if (current != value) {

                this.__observable__.notifyChange(exports.EventTypes.CHANGING, {
                    propertyName: propName,
                    current: current,
                    newValue: value
                });

                this[_propName] = value;

                this.__observable__.notifyChange(exports.EventTypes.CHANGED, {
                    propertyName: propName,
                    current: value,
                    oldValue: current
                });

            }
        }
    };
    
    var buildPropertyGetter = function(propName, _propName){
        return function(){
            return this[_propName];
        }
    };
    
    var defaultPropertyInterceptFilter = function(obj, propName){
        return propName.substr(0, 1) != defaultBackPropertyPrefix;
    };
    
    exports.Observable.prototype.interceptProperties = function(options){
    
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
        
    }
    
    exports.Observable.prototype.isDOMObject = function(){
        if (typeof this._isDomObject == 'undefined') {
            this._isDOMObject = tent.isDOMObject(this.subject);
        }
        return this._isDOMObject;
    }
    
    exports.Observable.prototype.interceptArrayModifiers = function(options){
    
        var array = this.subject;
        if (!array instanceof Array) {
            return false;
        }
        
        this.interceptFunction('push', function(){
            var index = this.length;
            var itemsToAdd = itemsToAdd = Array.prototype.slice.call(arguments);
            this.__observable__.notifyChange(exports.EventTypes.ADDING, {
                items: itemsToAdd,
                index: index,
                propertyName: this.__propertyName__
            });
            this._push.apply(this, arguments);
            this.__observable__.notifyChange(exports.EventTypes.ADDED, {
                items: itemsToAdd,
                index: index,
                propertyName: this.__propertyName__
            });
        });
        
        this.interceptFunction('unshift', function(){
            var itemsToAdd = itemsToAdd = Array.prototype.slice.call(arguments);
            this.__observable__.notifyChange(exports.EventTypes.ADDING, {
                items: itemsToAdd,
                index: 0,
                propertyName: this.__propertyName__
            });
            this._unshift.apply(this, arguments);
            this.__observable__.notifyChange(exports.EventTypes.ADDED, {
                items: itemsToAdd,
                index: 0,
                propertyName: this.__propertyName__
            });
        });
        
        this.interceptFunction('pop', function(){
            var index = this.length - 1;
            this.__observable__.notifyChange(exports.EventTypes.REMOVING, {
                items: [this[index]],
                index: index,
                propertyName: this.__propertyName__
            });
            var item = this._pop();
            this.__observable__.notifyChange(exports.EventTypes.REMOVED, {
                items: [item],
                index: index,
                propertyName: this.__propertyName__
            });
            return item;
        });
        
        this.interceptFunction('shift', function(){
            this.__observable__.notifyChange(exports.EventTypes.REMOVING, {
                items: [this[0]],
                index: 0,
                propertyName: this.__propertyName__
            });
            var item = this._shift();
            this.__observable__.notifyChange(exports.EventTypes.REMOVED, {
                items: [item],
                index: 0,
                propertyName: this.__propertyName__
            });
            return item;
        });
        
        this.interceptFunction('splice', function(start, deleteCnt){
        
            var itemsToAdd;
            if (deleteCnt && deleteCnt > 0) {
                this.__observable__.notifyChange(exports.EventTypes.REMOVING, {
                    items: this.slice(start, start + deleteCnt),
                    index: start,
                    propertyName: this.__propertyName__
                });
            }
            if (arguments.length > 2) {
                itemsToAdd = Array.prototype.slice.call(arguments, 2);
                this.__observable__.notifyChange(exports.EventTypes.ADDING, {
                    items: itemsToAdd,
                    index: start,
                    propertyName: this.__propertyName__
                });
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
                this.__observable__.notifyChange(exports.EventTypes.REMOVED, {
                    items: removedItems,
                    index: start,
                    propertyName: this.__propertyName__
                });
            }
            if (arguments.length > 2) {
                this.__observable__.notifyChange(exports.EventTypes.ADDED, {
                    items: itemsToAdd,
                    index: start,
                    propertyName: this.__propertyName__
                });
            }
            
            return removedItems;
        });
        
        // length setter that uses splice to trim arrays
        array.setLength = function(l){
            if (this.length > l) {
                this.splice(l, this.length - l);
            }
            else {
                this.lengh = l;
            }
        }
        
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
        
        return true;
    }
    
    exports.Observable.prototype.removeInterceptor = function(name){
        var interceptor = this.interceptors[name];
        
        if (interceptor._name) {
            if (interceptor.type != exports.InterceptorTypes.FUNCTION) {
                try {
                    delete this.subject[interceptor.name];
                } 
                catch (error) {
                    tent.log.warn('Error deleting property interceptor \'' + interceptor.name + '\': ' + error);
                }
                
                var mode = exports.getPropertyInterceptMode();
                if (mode == exports.PropertyInterceptModes.DEFINEPROPERTY ||
                (mode == exports.PropertyInterceptModes.DEFINEPROPERTYONLYDOM &&
                tent.isDOMObject(this.subject))) {
                    if (interceptor.descriptor && interceptor.descriptor.name) {
                        Object.defineProperty(this.subject, name, interceptor.descriptor);
                    }
                }
                else 
                    if (mode == exports.PropertyInterceptModes.DEFINESETTER) {
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
            if (interceptor.type != exports.InterceptorTypes.FUNCTION) {
                var val = this.subject[interceptor.name];
                delete this.subject[interceptor.name];
                this.subject[interceptor.name] = val;
            }
        }
        delete interceptor[name];
    }
    
    exports.Observable.prototype.removeInterceptors = function(){
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
    
    exports.Observable.prototype.suspend = function(){
        this.suspended = true;
    }
    
    exports.Observable.prototype.resume = function(){
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
                    this.notifyChange(exports.EventTypes.MANYCHANGES, this.changesWhileSuspended);
                }
            delete this.changesWhileSuspended;
        }
    }
    
    exports.Observable.prototype.isValidHandler = function(handler){
        if (!handler) {
            return false;
        }
        if ((typeof handler == 'function') ||
        ((typeof handler == 'object') && (typeof handler.handle == 'function'))) {
            return true;
        }
        return false;
    }
    
    exports.Observable.prototype.bind = function(eventType, handler){
        if (!handler) {
            if (this.isValidHandler(eventType)) {
                handler = eventType;
                eventType = exports.EventTypes.ANY;
            }
            else {
                throw 'must specify a handler: function (Change) or and object with a handle(Change) function';
            }
        }
        
        if (!this.isValidHandler(handler)) {
            throw 'must specify a handler: function (Change) or and object with a handle(Change) function';
        }
        
        if (!eventType) {
            eventType = exports.EventTypes.ANY;
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
    
    exports.Observable.prototype.unbind = function(eventType, handler){
        if (!handler) {
            if (this.isValidHandler(eventType)) {
                handler = eventType;
                eventType = exports.EventTypes.ANY;
            }
            else {
                throw 'must specify a handler to remove';
            }
        }
        
        if (!this.isValidHandler(handler)) {
            throw 'must specify a handler to remove';
        }
        
        if (!eventType) {
            eventType = exports.EventTypes.ANY;
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
    
    exports.Observable.prototype.unbindWhere = function(filter){
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
    
    exports.Observable.prototype.notifyHandler = function(change, handler){
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
    
    exports.Observable.prototype.notifyChange = function(eventType, data){
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
                        this[i].eventType == exports.EventTypes.CHANGED &&
                        this[i].data.propertyName == propertyName) {
                            return this[i];
                        }
                    }
                }
                this.changesWhileSuspended.findArrayChanged = function(array){
                    for (var i = 0, l = this.length; i < l; i++) {
                        if (this[i].subject == subject &&
                        (this[i].eventType == exports.EventTypes.ADDED ||
                        this[i].eventType == exports.EventTypes.REMOVED)) {
                            return this[i];
                        }
                    }
                }
            }
            this.changesWhileSuspended.push(new exports.Change(this.subject, eventType, data));
            return;
        }
        var change;
        if (eventType instanceof exports.Change) {
            change = eventType;
        }
        else {
            change = new exports.Change(this.subject, eventType, data);
        }
        var ehandlers = this.handlers[eventType];
        if (ehandlers) {
            for (var i = 0, l = ehandlers.length; i < l; i++) {
                this.notifyHandler(change, ehandlers[i]);
            }
        }
        ehandlers = this.handlers[exports.EventTypes.ANY];
        if (ehandlers) {
            for (var i = 0, l = ehandlers.length; i < l; i++) {
                this.notifyHandler(change, ehandlers[i]);
            }
        }
    }
    
    var defaultLogHandler;
    
    exports.Observable.prototype.log = function(enable){
        if (enable) {
            if (!defaultLogHandler) {
                defaultLogHandler = exports.LogHandler();
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
    
    exports.LogHandler = function(prefix){
    
        if (typeof prefix == 'undefined') {
            prefix = ''
        }
        else 
            if (prefix && prefix[prefix.length - 1] != ' ') {
                prefix += ' ';
            }
        return function(change){
            tent.log.info(prefix + change.toString());
        }
    }
    
    var buildLivePropagateHandler = function(options){
        var propagateOptions = {};
        for (opName in options) {
            if (opName != 'deepStack' && opName != 'liveHandler') {
                propagateOptions[opName] = options[opName];
            }
        }
        var f = function(change){
            if (change.eventType == exports.EventTypes.CHANGED) {
                if (typeof change.data.current == 'object') {
                    if (propagateOptions.deepOverDOM || !tent.isDOMObject(change.data.current)) {
                        propagateOptions.deepStack = [change.data.subject];
                        exports.track(change.data.current, propagateOptions);
                        delete propagateOptions.deepStack;
                    }
                }
            }
            else 
                if (change.eventType == exports.EventTypes.ADDED) {
                    for (var i = 0, l = change.data.items.length; i < l; i++) {
                        if (typeof change.data.items[i] == 'object') {
                            if (propagateOptions.deepOverDOM || !tent.isDOMObject(change.data.current)) {
                                propagateOptions.deepStack = [change.data.subject];
                                exports.track(change.data.items[i], propagateOptions);
                                delete propagateOptions.deepStack;
                            }
                        }
                    }
                }
        }
        f.isLivePropagator = true;
        return f;
    }
    
    exports.track = function(obj, options){
    
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
        
        var isArray = (obj instanceof Array);
        
        var changed = false;
        
        if (!options.remove && !options.removeAll && !obj.__observable__) {
        
            // attach a Observable
            if (options.observable && (!options.observable.subject || options.observable.subject == obj)) {
                obj.__observable__ = options.observable;
                obj.__observable__.subject = obj;
            }
            else {
                obj.__observable__ = new exports.Observable(obj);
            }
            
            changed = true;
            
            obj.getObservable = function(){
                return this.__observable__;
            }
            
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
                        if (exports.track(subObj, options)) {
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
                        if (options.deepOverDOM || !tent.isDOMObject(subject)) {
                            if (typeof subObj == "object" && options.deepStack.lastIndexOf(subObj) < 0) {
                                if (exports.track(subObj, options)) {
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
    
    exports.untrack = function(obj, options){
        if (!options) {
            options = {
                removeAll: true
            };
        }
        else 
            if (!options.removeAll) {
                options.removeAll = true;
            }
        return exports.track(obj, options);
    }
    
    exports.isTracked = function(obj){
        return obj.__observable__ && obj.__observable__ instanceof exports.Observable;
    }
    
    exports.bind = function(obj, options){
    
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
        
        return exports.track(obj, options);
    }
    
    exports.unbind = function(obj, options){
    
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
        
        return exports.track(obj, options);
    }
    
    return exports;
});


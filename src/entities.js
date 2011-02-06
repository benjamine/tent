
tent.declare('tent.entities', function(exports){

    exports.ChangeStates = new tent.coreTypes.Enum('DETACHED,UNCHANGED,ADDED,MODIFIED,DELETED');
    
    exports.Type = function Type(name, properties){
        this.name = name;
        this.properties = properties;
        if (properties instanceof tent.changes.reverseProperties.Set) {
            this.reversePropertySet = properties;
        }
        else 
            if (typeof properties == 'object') {
                this.reversePropertySet = new tent.changes.reverseProperties.Set(properties);
            }
            else {
                throw 'cannot create a Type without properties';
            }
    }
    
    exports.Type.prototype.toString = function(){
        return 'EntityType(' + this.name + ')';
    }
    
    exports.Type.prototype.applyTo = function(){
        this.reversePropertySet.applyTo.apply(this.reversePropertySet, arguments);
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i].__entityType__ != this) {
                arguments[i].__entityType__ = this;
            }
            for (var n in this.properties) {
                var prop = this.properties[n];
                if (typeof arguments[i][n] == 'undefined') {
                    if (!prop.cardinality || prop.cardinality.substr(1, 1) === '1') {
                        arguments[i][n] = null;
                    }
                    else {
                        arguments[i][n] = [];
                    }
                }
            }
        }
    }
    
    exports.Collection = function Collection(context, type, name){
    
        this.context = context;
        this.type = type;
        this.name = name || type.name;
        
        this.items = [];
        
        tent.arrays.addFunctions(this.items);
    }
    
    exports.Collection.prototype.push = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                // array, push each element in the array
                this.push.apply(this, arguments[i]);
            }
            else 
                if (arguments[i].__collection__) {
                    if (arguments[i].__collection__ != this) {
                        throw 'cannot add this object, it already belongs to another Collection';
                    }
                    // item already added to this collection
                    continue;
                }
                else {
                    if (arguments[i].__entityType__) {
                        if (arguments[i].__entityType__ != this.type) {
                            throw 'cannot add an object with EntityType "' + arguments[i].__entityType__.name + '" to this collection';
                        }
                    }
                    else {
                        if (this.type) {
                            this.type.applyTo(arguments[i]);
                        }
                    }
                    if (this.items.lastIndexOf(arguments[i]) < 0) {
                        // add item to this collection
                        arguments[i].__collection__ = this;
                        this.items.push(arguments[i]);
                        if (this.context.changeHandler) {
                            // notify the changeHandler
                            this.context.changeHandler.itemAdded(arguments[i]);
                        }
                        if (this.type) {
                            // cascade push
                            this.context.__cascadePush__(arguments[i]);
                        }
                    }
                }
        }
        return this.items.length;
    }
    
    exports.Collection.prototype.attach = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                throw 'cannot attach arrays to a Collection';
            }
            else 
                if (arguments[i].__collection__) {
                    if (arguments[i].__collection__ != this) {
                        throw 'cannot attach this object, it already belongs to another Collection';
                    }
                    // item already added to this collection
                    continue;
                }
                else {
                    if (arguments[i].__entityType__) {
                        if (arguments[i].__entityType__ != this.type) {
                            throw 'cannot add an object with EntityType "' + arguments[i].__entityType__.name + '" to this collection';
                        }
                    }
                    else {
                        if (this.type) {
                            this.type.applyTo(arguments[i]);
                        }
                    }
                    if (this.items.lastIndexOf(arguments[i]) < 0) {
                        // add item to this collection
                        arguments[i].__collection__ = this;
                        if (arguments[i].__changeState__ != exports.ChangeStates.DELETED) {
                            this.items.push(arguments[i]);
                        }
                        if (this.context.changeHandler) {
                            // notify the changeHandler
                            this.context.changeHandler.itemAttached(arguments[i]);
                        }
                        if (this.type) {
                            // cascade attach
                            this.context.__cascadeAttach__(arguments[i]);
                        }
                    }
                }
        }
        return this.items.length;
    }
    
    exports.Collection.prototype.remove = function(){
        var removed = false;
        for (var i = 0, l = arguments.length; i < l; i++) {
            var item = arguments[i];
            if (this.items.remove(item)) {
                removed = true;
                // item removed from the Context
                if (this.context.changeHandler) {
                    this.context.changeHandler.itemRemoved(arguments[i]);
                }
                
                if (this.type) {
                    // cascade remove
                    this.context.__cascadeRemove__(item);
                }
            }
        }
        return removed;
    }
    
    exports.Collection.prototype.detach = function(){
        var removed = false;
        for (var i = 0, l = arguments.length; i < l; i++) {
            var item = arguments[i];
            if (this.items.remove(item) || item.__changeState__ == exports.ChangeStates.DELETED) {
                removed = true;
                // item removed from the Context
                if (this.context.changeHandler) {
                    this.context.changeHandler.itemDetached(item);
                }
                delete item.__collection__;
                
                if (item.__entityType__) {
                    // cascade detach
                    this.context.__cascadeDetach__(item);
                }
            }
        }
        return removed;
    }
    
    exports.Collection.prototype.detachAll = function(){
        if (this.items.length < 1) {
            return false;
        }
        var item = this.items.pop();
        while (typeof item != 'undefined') {
        
            // item removed from the Context
            if (this.context.changeHandler) {
                this.context.changeHandler.itemDetached(item);
            }
            delete item.__collection__;
            
            if (item.__entityType__) {
                // cascade detach
                this.context.__cascadeDetach__(item);
            }
            
            item = this.items.pop();
        }
        this.items.length = 0;
        return true;
    }
    
    exports.Context = function Context(trackChanges){
        this.__collections__ = {};
        this.__types__ = {};
        if (trackChanges === true) {
            this.trackChanges();
        }
    }
    
    exports.MyContext = new exports.Context();
    
    exports.Context.prototype.all = function(){
        var items = [];
        for (var collname in this.__collections__) {
            items.push.apply(items, this.__collections__[collname].items);
        }
        return items;
    }
    
    exports.Context.prototype.filter = function(condition){
        var items = [];
        for (var collname in this.__collections__) {
            items.push.apply(items, this.__collections__[collname].items.filter(condition));
        }
        return items;
    }
    
    exports.Context.prototype.contains = function(){
    
        for (var ai = 0; ai < arguments.length; ai++) {
            var item = arguments[ai];
            if (!item) {
                return false;
            }
            else 
                if (item.__collection__) {
                    if (this.__collections__[item.__collection__.name] != item.__collection__) {
                        return false;
                    }
                }
                else 
                    if (item instanceof exports.Type) {
                        if (this.__types__[item.name] != item) {
                            return false;
                        }
                    }
                    else 
                        if (item instanceof exports.Collection) {
                            if (this != item.context) {
                                return false;
                            }
                        }
                        else {
                            return false;
                        }
        }
        return true;
    }
    
    exports.Context.prototype.createCollection = function(type, name){
    
        if (!name) {
            if (!type) {
                name = '_Object';
            }
            else {
                if (type instanceof exports.Type) {
                    name = type.name;
                }
                else 
                    if (typeof type == 'string') {
                        name = type;
                        type = null;
                    }
                    else {
                        throw 'provide a Type or name to create a Collection';
                    }
            }
        }
        else 
            if (type && (!type instanceof exports.Type)) {
                throw 'provided type is not a Type instance';
            }
        
        if (!this.__collections__[name]) {
            // create a new collection
            this.__collections__[name] = new exports.Collection(this, type, name);
            
            // add shortcut
            var shortcutName = name;
            while (this[shortcutName]) {
                shortcutName += '_';
            }
            this[shortcutName] = this.__collections__[name];
            
        }
        return this.__collections__[name];
    }
    
    exports.Context.prototype.pushModel = function(model){
        if (model) {
            if (model.types) {
                for (var typeName in model.types) {
                    this.push(new exports.Type(typeName, model.types[typeName]));
                }
            }
        }
    }
    
    exports.Context.prototype.push = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                throw 'cannot push arrays into a Context';
            }
            else 
                if (arguments[i].__collection__) {
                    if (arguments[i].__collection__.context == this) {
                        // object already added
                        continue;
                    }
                    else {
                        throw 'cannot push this item, it belongs to another Context';
                    }
                }
                else 
                    if (arguments[i] instanceof exports.Type) {
                        if (!arguments[i].name) {
                            throw 'cannot add an EntityType without name';
                        }
                        if (this.__types__[arguments[i].name]) {
                            if (this.__types__[arguments[i].name] == arguments[i]) {
                                continue; // Type already present, ignore
                            }
                            else {
                                throw 'EntityType "' + arguments[i].name + '" already exists';
                            }
                        }
                        this.__types__[arguments[i].name] = arguments[i];
                        this.createCollection(arguments[i]);
                    }
                    else 
                        if (arguments[i] instanceof exports.Context) {
                            throw 'cannot add an EntityContext to an EntityContext';
                        }
                        else 
                            if (typeof arguments[i] == 'object') {
                                var type = arguments[i].__entityType__;
                                if (type) {
                                    if (this.__types__[type.name]) {
                                        // the object already has entityType, check it's the same in the context
                                        if (this.__types__[type.name] != type) {
                                            throw 'cannot add, object EntityType "' + type.name + '" differs from the Context one';
                                        }
                                    }
                                    else {
                                        // add new entity type
                                        this.__types__[type.name] = type;
                                    }
                                }
                                var coll = this.createCollection(type); // create or get a collection
                                coll.push(arguments[i]);
                            }
        }
    }
    
    exports.Context.prototype.attach = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                throw 'cannot attach arrays';
            }
            else 
                if (arguments[i].__collection__ && arguments[i].__collection__.context == this) {
                    // object already attached
                    continue;
                }
                else 
                    if (arguments[i] instanceof exports.Type) {
                        throw 'cannot attach EntityTypes';
                    }
                    else 
                        if (arguments[i] instanceof exports.Context) {
                            throw 'cannot attach an EntityContext to an EntityContext';
                        }
                        else 
                            if (typeof arguments[i] == 'object') {
                                var type = arguments[i].__entityType__;
                                if (type) {
                                    if (this.__types__[type.name]) {
                                        // the object already has entityType, check it's the same in the context
                                        if (this.__types__[type.name] != type) {
                                            throw 'cannot add, object EntityType "' + type.name + '" differs from the Context one';
                                        }
                                    }
                                    else {
                                        // add new entity type
                                        this.__types__[type.name] = type;
                                    }
                                }
                                var coll = this.createCollection(type); // create or get a collection
                                coll.attach(arguments[i]);
                            }
        }
    }
    
    exports.Context.prototype.remove = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof exports.Type) {
                throw 'cannot remove EntityTypes';
            }
            else 
                if (arguments[i] instanceof exports.Context) {
                    throw 'cannot remove an EntityContext from an EntityContext';
                }
                else 
                    if (typeof arguments[i] == 'object') {
                        if (arguments[i].__collection__) {
                            arguments[i].__collection__.remove(arguments[i]);
                        }
                    }
        }
    }
    
    exports.Context.prototype.detach = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                throw 'cannot detach arrays';
            }
            if (arguments[i] instanceof exports.Type) {
                throw 'cannot detach EntityTypes';
            }
            else 
                if (arguments[i] instanceof exports.Context) {
                    throw 'cannot detach an EntityContext from an EntityContext';
                }
                else 
                    if (typeof arguments[i] == 'object') {
                        if (arguments[i].__collection__) {
                            arguments[i].__collection__.detach(arguments[i]);
                        }
                    }
        }
    }
    
    exports.Context.prototype.detachAll = function(){
        var removed = false;
        for (var i = 0; i < this.__collections__.length; i++) {
            if (this.__collections__[i].detachAll()) {
                removed = true;
            }
        }
        return removed;
    }
    
    exports.Context.prototype.touch = function(){
        if (this.changeHandler) {
            return this.changeHandler.touch.apply(this.changeHandler, arguments);
        }
    }
    
    exports.Context.prototype.__cascadePush__ = function(){
        for (var i = 0; i < arguments.length; i++) {
            // cascade push arguments[i] properties values
            var item = arguments[i];
            if (item.__entityType__) {
                for (var n in item.__entityType__.properties) {
                    if (item[n] !== null && typeof item[n] == 'object') {
                        var prop = item.__entityType__.properties[n];
                        if (prop.cascadePush) {
                            var coll = null;
                            if (prop.collection) {
                                var coll = this.__collections__[prop.collection] || this.createCollection(prop.collection);
                            }
                            if (item[n] instanceof Array) {
                                if (prop.cardinality && prop.cardinality[1] != '1') {
                                    // push all children items
                                    if (coll) {
                                        coll.push.apply(coll, item[n]);
                                    }
                                    else {
                                        this.push.apply(this, item[n]);
                                    }
                                }
                            }
                            else {
                                // push referenced item
                                if (coll) {
                                    coll.push(item[n]);
                                }
                                else {
                                    this.push(item[n]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    exports.Context.prototype.__cascadeAttach__ = function(){
        for (var i = 0; i < arguments.length; i++) {
            // cascade attach arguments[i] properties values
            var item = arguments[i];
            if (item.__entityType__) {
                for (var n in item.__entityType__.properties) {
                    if (item[n] !== null && typeof item[n] == 'object') {
                        var prop = item.__entityType__.properties[n];
                        if (prop.cascadeAttach) {
                            var coll = null;
                            if (prop.collection) {
                                var coll = this.__collections__[prop.collection] || this.createCollection(prop.collection);
                            }
                            if (item[n] instanceof Array) {
                                if (prop.cardinality && prop.cardinality[1] != '1') {
                                    // attach all children items
                                    if (coll) {
                                        coll.attach.apply(coll, item[n]);
                                    }
                                    else {
                                        this.attach.apply(this, item[n]);
                                    }
                                }
                            }
                            else {
                                // attach referenced item
                                if (coll) {
                                    coll.attach(item[n]);
                                }
                                else {
                                    this.attach(item[n]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    exports.Context.prototype.__cascadeRemove__ = function(){
        for (var i = 0; i < arguments.length; i++) {
        
            // cascade remove arguments[i] properties values
            var item = arguments[i];
            
            if (item.__entityType__) {
                for (var n in item.__entityType__.properties) {
                    if (item[n] !== null && typeof item[n] == 'object') {
                        var prop = item.__entityType__.properties[n];
                        
                        if (prop.cascadeRemove) {
                            if (item[n] instanceof Array) {
                                if (prop.cardinality && prop.cardinality[1] != '1') {
                                    // remove all children items
                                    this.remove.apply(this, item[n]);
                                }
                            }
                            else {
                                // remove referenced item
                                this.remove(item[n]);
                            }
                        }
                        
                    }
                }
            }
        }
    }
    
    exports.Context.prototype.__cascadeDetach__ = function(){
        for (var i = 0; i < arguments.length; i++) {
            // cascade detach arguments[i] properties values
            var item = arguments[i];
            if (item.__entityType__) {
                for (var n in item.__entityType__.properties) {
                    if (item[n] !== null && typeof item[n] == 'object') {
                        var prop = item.__entityType__.properties[n];
                        if (prop.cascadeDetach) {
                            if (item[n] instanceof Array) {
                                if (prop.cardinality && prop.cardinality[1] != '1') {
                                    // detach all children items
                                    this.detach.apply(this, item[n]);
                                }
                            }
                            else {
                                // detach referenced item
                                this.detach(item[n]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    exports.Context.prototype.trackChanges = function(){
        if (!this.changeHandler) {
            this.changeHandler = new exports.ContextChangeHandler(this);
            this.changeHandler.init();
        }
    }
    
    exports.Context.prototype.hasChanges = function(){
        return !!(this.changes && this.changes.items.length > 0);
    }
    
    exports.Context.prototype.acceptChanges = function(){
        if (this.changeHandler) {
            this.changeHandler.acceptChanges();
        }
    }
    
    exports.EntityLink = function EntityLink(from, to, propertyName, changeState){
        this.from = from;
        this.to = to;
        this.propertyName = propertyName;
        this.__changeState__ = changeState || exports.ChangeStates.DETACHED;
    }
    
    exports.ContextChanges = function ContextChanges(context){
        this.context = context;
        this.items = [];
        tent.arrays.addFunctions(this.items);
    }
    
    exports.ContextChanges.prototype.toString = function(){
        var count = new tent.coreTypes.NameCounter();
        for (var i = 0, l = this.items.length; i < l; i++) {
            count.add(exports.ChangeStates.getName(this.items[i].__changeState__) + "." + this.items[i].__collection__.name);
        }
        return count.toString();
    }
    
    exports.ContextChangeHandler = function ContextChangeHandler(context){
        this.context = context;
    }
    
    exports.ContextChangeHandler.prototype.isDetached = function(item){
        return (!item.__changeState__) || (item.__changeState__ == exports.ChangeStates.DETACHED);
    }
    
    exports.ContextChangeHandler.prototype.bindArrayProperties = function(item){
        // listen for changes in item array properties, to detect childrens added/removed
        if (item.__entityType__) {
            for (var n in item.__entityType__.properties) {
                var prop = item.__entityType__.properties[n];
                if (prop.cardinality && prop.cardinality[1] != '1' && item[n] instanceof Array) {
                    item[n].__parent__ = item;
                    item[n].__propertyName__ = n;
                    tent.changes.bind(item[n], this);
                }
            }
        }
    }
    
    exports.ContextChangeHandler.prototype.unbindArrayProperties = function(item){
        // stop listening for changes in item array properties
        if (item.__entityType__) {
            for (var n in item.__entityType__.properties) {
                var prop = item.__entityType__.properties[n];
                if (prop.cardinality && prop.cardinality[1] != '1' && item[n] instanceof Array) {
                    tent.changes.unbind(item[n], this);
                }
            }
        }
    }
    
    exports.ContextChangeHandler.prototype.setAdded = function(item){
        if (item.__changeState__ == exports.ChangeStates.ADDED) {
            return;
        }
        if (!item.__collection__) {
            item.__changeState__ = exports.ChangeStates.ADDED;
        }
        else {
            if (item.__collection__.context == this.context) {
                item.__changeState__ = exports.ChangeStates.ADDED;
                if (!this.context.changes) {
                    this.context.changes = new exports.ContextChanges(this.context);
                }
                this.context.changes.items.pushUnique(item);
            }
            else {
                throw 'cannot set this item as ADDED, it belongs to another Context';
            }
        }
    }
    
    exports.ContextChangeHandler.prototype.setRemoved = function(item){
        if (this.isDetached(item) || item.__changeState__ == exports.ChangeStates.DELETED) {
            return;
        }
        if (!item.__collection__) {
            item.__changeState__ = exports.ChangeStates.DELETED;
        }
        else {
            if (item.__collection__.context == this.context) {
                if ((item.__changeState__ == exports.ChangeStates.UNCHANGED) ||
                (item.__changeState__ == exports.ChangeStates.MODIFIED)) {
                    item.__changeState__ = exports.ChangeStates.DELETED;
                    if (!this.context.changes) {
                        this.context.changes = new exports.ContextChanges(this.context);
                    }
                    this.context.changes.items.pushUnique(item);
                }
                else 
                    if (item.__changeState__ == exports.ChangeStates.ADDED) {
                        item.__changeState__ = exports.ChangeStates.DETACHED;
                        delete item.__collection__;
                        if (!this.context.changes) {
                            this.context.changes = new exports.ContextChanges(this.context);
                        }
                        this.context.changes.items.remove(item);
                    }
            }
            else {
                throw 'cannot set this item as DELETED, it belongs to another Context';
            }
        }
    }
    
    exports.ContextChangeHandler.prototype.touch = function(){
        for (var i = 0, l = arguments.length; i < l; i++) {
            if (arguments[i] && arguments[i].__changeState__ == exports.ChangeStates.UNCHANGED &&
            arguments[i].__collection__ &&
            arguments[i].__collection__.context == this.context) {
                // mark item as MODIFIED
                if (!this.context.changes) {
                    this.context.changes = new exports.ContextChanges(this);
                }
                arguments[i].__changeState__ = exports.ChangeStates.MODIFIED;
                this.context.changes.items.pushUnique(arguments[i]);
            }
        }
    }
    
    exports.ContextChangeHandler.prototype.itemAdded = function(item){
        if (this.isDetached(item)) {
            this.setAdded(item);
        }
        else {
            // allow attach item with pre-established state
            if (item.__changeState__ != exports.ChangeStates.UNCHANGED) {
                if (!this.context.changes) {
                    this.context.changes = new exports.ContextChanges(this.context);
                }
                this.context.changes.items.pushUnique(item);
            }
        }
        if (item.__changeState__ != exports.ChangeStates.DELETED) {
            // listen for changes in item
            tent.changes.bind(item, this);
            // listen for changes in item array properties, to detect childrens added/removed
            this.bindArrayProperties(item);
        }
    }
    
    exports.ContextChangeHandler.prototype.itemAttached = function(item){
        if (this.isDetached(item)) {
            item.__changeState__ = exports.ChangeStates.UNCHANGED;
        }
        this.itemAdded(item);
    }
    
    exports.ContextChangeHandler.prototype.itemRemoved = function(item){
        this.setRemoved(item);
        // stop listening for changes in item
        tent.changes.unbind(item, this);
        // stop listening for changes in item array properties
        this.unbindArrayProperties(item);
    }
    
    exports.ContextChangeHandler.prototype.itemDetached = function(item){
        // item detached from context
        var changes = this.context.changes;
        if (item.__changeState__ != exports.ChangeStates.UNCHANGED) {
            if (changes) {
                changes.items.remove(item);
            }
        }
        delete item.__changeState__;
        // stop listening for changes in item
        tent.changes.unbind(item, this);
        // stop listening for changes in item array properties
        this.unbindArrayProperties(item);
    }
    
    exports.ContextChangeHandler.prototype.objectLinked = function(subject, propertyName, property, obj){
    
        // object linked to an item in the Context
        
        // check that obj can be linked to subject
        if (typeof obj != 'object') {
            return;
        }
        
        if (obj instanceof Array) {
            // array property set, bind array to this handler
            if (obj.__parent__ != subject) {
                if (obj.__parent__) {
                    throw 'this array already has another parent object';
                }
                obj.__parent__ = subject;
            }
            if (obj.__propertyName__ != propertyName) {
                obj.__propertyName__ = propertyName;
            }
            tent.changes.bind(obj, this);
            
            // push linked objects
            if (property.onLinkPush) {
                this.context.attach.push(this.context, obj);
            }
        }
        else 
            if (obj !== null && typeof obj != 'undefined') {
            
                if (obj.__changeState__ == exports.ChangeStates.DELETED) {
                    throw 'cannot link a DELETED object to property "' + property + '"';
                }
                if (obj.__collection__) {
                    if (obj.__collection__.context != this.context) {
                        throw 'cannot link this object, it belongs to another Context';
                    }
                    if (property.collection && (obj.__collection__.name != property.collection)) {
                        throw 'cannot link an object of collection ' + property.collection + ' to property "' + property + '"';
                    }
                }
                
                if (!obj.__collection__ && property.onLinkPush) {
                    // object is not in Context already
                    if (obj.__entityType__) {
                        // add EntitType if not exists
                        this.context.push(obj.__entityType__);
                    }
                    
                    // new object in this Context
                    if (property.collection) {
                        if (!this.context.__collections__[property.collection]) {
                            throw new Error('Collection "' + property.collection + '" not found in this Context');
                        }
                        this.context.__collections__[property.collection].push(obj);
                    }
                    else {
                        // push untyped object
                        this.context.push(obj);
                    }
                }
                
                if (property.trackLinks) {
                    // track new link
                    var elink = null, elinki = -1;
                    for (var i = this.context.changes.items.length - 1; i >= 0; i--) {
                        var chg = this.context.changes.items[i];
                        if ((chg instanceof exports.EntityLink) &&
                        (chg.from === subject) &&
                        (chg.to === obj) &&
                        (chg.propertyName == propertyName)) {
                            elink = chg;
                            elinki = i;
                            break;
                        }
                    }
                    if (!elink) {
                        // new link created
                        elink = new exports.EntityLink(subject, obj, propertyName, exports.ChangeStates.ADDED);
                        this.context.changes.items.push(elink);
                    }
                    else {
                        if (elink.__changeState__ == exports.ChangeStates.DELETED) {
                            // removed link is restored
                            elink.__changeState__ = exports.ChangeStates.UNCHANGED;
                        }
                    }
                }
                
            }
    }
    
    exports.ContextChangeHandler.prototype.objectUnlinked = function(subject, propertyName, property, obj){
    
        // object unlinked from an item in the Context
        
        if (typeof obj != 'object') {
            return;
        }
        
        if (obj instanceof Array) {
            // array property unset, unbind array from this handler
            delete obj.__parent__;
            delete obj.__propertyName__;
            tent.changes.unbind(obj, this);
            
            // remove unlinked objects
            if (property.onUnlinkRemove) {
                this.context.remove.apply(this.context, obj);
            }
        }
        else 
            if (obj !== null && typeof obj != 'undefined') {
                // object property unset, remove from its collection
                if (property.onUnlinkRemove) {
                    if (obj.__collection__) {
                        obj.__collection__.remove(obj);
                    }
                }
                
                if (property.trackLinks) {
                    // track removed link
                    var elink = null, elinki = -1;
                    for (var i = this.context.changes.items.length - 1; i >= 0; i--) {
                        var chg = this.context.changes.items[i];
                        if ((chg instanceof exports.EntityLink) &&
                        (chg.from === subject) &&
                        (chg.to === obj) &&
                        (chg.propertyName == propertyName)) {
                            elink = chg;
                            elinki = i;
                            break;
                        }
                    }
                    if (!elink) {
                        // unchanged link deleted
                        elink = new exports.EntityLink(subject, obj, propertyName, exports.ChangeStates.DELETED);
                        this.context.changes.items.push(elink);
                    }
                    else {
                        if (elink.__changeState__ == exports.ChangeStates.ADDED) {
                            // new link deleted, remove tracked change
                            this.context.changes.items.splice(elinki, 1);
                        }
                        else 
                            if (elink.__changeState__ != exports.ChangeStates.DELETED) {
                                // existing link deleted
                                elink.__changeState__ = exports.ChangeStates.DELETED;
                            }
                    }
                }
            }
    }
    
    exports.ContextChangeHandler.prototype.getTrackedProperty = function(subject, propertyName){
        var prop;
        if (subject.__entityType__ &&
        subject.__changeState__ &&
        subject.__changeState__ != exports.ChangeStates.DELETED &&
        subject.__changeState__ != exports.ChangeStates.DETACHED &&
        subject.__collection__ &&
        subject.__collection__.context == this.context &&
        (prop = subject.__entityType__.properties[propertyName])) {
            return prop;
        }
    }
    
    exports.ContextChangeHandler.prototype.handle = function(change){
    
        if (!change.subject) {
            return;
        }
        
        var prop;
        
        if (change.eventType == tent.changes.EventTypes.CHANGED) {

            var canBeModified;
            if (!change.subject.__entityType__) {
            
                // untyped object change
                this.context.touch(change.subject);
                
            }
            else 
                if (prop = this.getTrackedProperty(change.subject, change.data.propertyName)) {
                
                    this.context.touch(change.subject);
                    
                    this.objectUnlinked(change.subject, change.data.propertyName, prop, change.data.oldValue);
                    this.objectLinked(change.subject, change.data.propertyName, prop, change.data.current);
                    
                }
            
        }
        else 
            if (change.eventType == tent.changes.EventTypes.ADDED) {
            
                var parent = change.subject.__parent__;
                
                if (parent && (prop = this.getTrackedProperty(parent, change.data.propertyName))) {
                
                    // children added don't modify its parent
                    //this.context.touch(parent);
                    
                    for (var i = 0, l = change.data.items.length; i < l; i++) {
                        this.objectLinked(parent, change.data.propertyName, prop, change.data.items[i]);
                    }
                    
                }
                
            }
            else 
                if (change.eventType == tent.changes.EventTypes.REMOVED) {
                
                    var parent = change.subject.__parent__;
                    
                    if (parent && (prop = this.getTrackedProperty(parent, change.data.propertyName))) {
                    
                        // children removed don't modify its parent
                        //this.context.touch(parent);
                        
                        for (var i = 0, l = change.data.items.length; i < l; i++) {
                            this.objectUnlinked(parent, change.data.propertyName, prop, change.data.items[i]);
                        }
                        
                    }
                    
                }

        // keep reverse properties in sync
        tent.changes.reverseProperties.getHandler()(change);
    }
    
    exports.ContextChangeHandler.prototype.init = function(){
        if (this.context.log) {
            var rec = new tent.coreTypes.NameCounter();
        }
        for (var n in this.context.__collections__) {
            var coll = this.context.__collections__[n];
            for (var j = 0, jl = coll.items.length; j < jl; j++) {
                this.itemAttached(coll.items[j]);
            }
            if (rec) {
                rec.add(n, coll.items.length);
            }
        }
        if (this.context.log) {
            if (rec && rec.root._count > 0) {
                tent.log.debug("Context: initialized with " + rec);
            }
            else {
                tent.log.debug("Context: initialized empty");
            }
        }
    }
    
    exports.ContextChangeHandler.prototype.acceptChanges = function(){
        if (this.context.hasChanges()) {
            if (this.context.log) {
                tent.log.debug("Context: accepting changes, " + this.context.changes);
            }
            
            var items = this.context.changes.items;
            for (var i = 0, l = items.length; i < l; i++) {
                items[i].__changeState__ = exports.ChangeStates.UNCHANGED;
            }
            items.length = 0;
            if (this.context.log) {
                tent.log.debug("Context: all changes accepted");
            }
        }
    }
    
    return exports;
});

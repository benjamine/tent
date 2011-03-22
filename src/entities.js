/**
 * @requires tent.changes
 * @requires tent.changes.reverseProperties
 * @requires tent.arrays
 * @requires tent.coreTypes
 * @name tent.entities
 * @namespace Entity Data Modeling
 */
tent.declare('tent.entities', function(){

	/**
	 * Entity change states
	 * @type tent.coreTypes.Enum
	 */
    tent.entities.ChangeStates = new tent.coreTypes.Enum('DETACHED,UNCHANGED,ADDED,MODIFIED,DELETED');
    
	/**
	 * Create an entity Type
	 * 
	 * @example
	 * 
	 *  var Person = new tent.entities.Type('Person',{
	 *  	name: {}, // scalar property
	 *  	age: {}, // scalar property	
	 *  	pet: {
	 *  		reverse: 'owner', // each Person is his pet''s owner
	 *  		cardinality: '11', // one Person has one pet (optional, as '11' is the default)
	 *  		collection: 'Animal', // pets belong to the 'Animal' collection (see {@link tent.entities.Collection}
	 *  	} 
	 *  	descendants: { 
	 *  		 reverse: 'ancestor', // name of the property in 'descendants' objects
	 *  		 cardinality: '1n', // each Person has many descendants 
	 *  		 collection: 'Person', // descendants belong to the 'Person' collection (see {@link tent.entities.Collection}
	 *           cascadePush: true, // when adding a Person, add its descendants too
     *           cascadeRemove: true, // when deleting a Person, delete its descendants too
     *           onLinkPush: true, // when a Person is added as descendant, add it to the {@link tent.entities.Context} too
     *           onUnlinkRemove: true // when a Person is removed descendant, delete if from the {@link tent.entities.Context} too  
     *        }, 
	 *  	ancestor: { 
	 *  		reverse: 'descendants',
	 *  		cardinality: 'n1', // many Persons have one ancestor
	 *  		collection: 'Person' // ancestor belongs to the 'Person' collection (see {@link tent.entities.Collection}
	 *  		}, 
	 *  	friends: { 
	 *  		reverse: 'friends',
	 *  		cardinality: 'nm' // many Persons have many Person friends
	 *  		collection: 'Person' // friends belongs to the 'Person' collection (see {@link tent.entities.Collection}
	 *      } 
	 *  });
	 *  
	 * @class an entity type. Describes a set data structure type (eg: 'Person', 'Article', 'BlogEntry' or 'Country')
	 * @constructor
	 * @param {String} name Type name
	 * @param {Object|tent.changes.reverseProperties.Set} properties An object which properties are the Type's property definitions, or a {@link tent.changes.reverseProperties.Set} to include in this Type
	 */
    tent.entities.Type = function Type(name, properties){
		
		/**
		 * Type name
		 * @type String
		 * @field
		 */
        this.name = name;
		
		/**
		 * Type properties descriptor
		 * @type Object
		 * @field
		 */
        this.properties = properties;

        if (properties instanceof tent.changes.reverseProperties.Set) {
			/**
			 * Reverse properties for this Type
			 * @type tent.changes.reverseProperties.Set
			 * @field
			 */
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
    
	/**
	 * Type identifying String
	 */
    tent.entities.Type.prototype.toString = function(){
        return 'EntityType(' + this.name + ')';
    }
    
	/**
	 * Applies this Type to all the object arguments 
	 */
    tent.entities.Type.prototype.applyTo = function(){
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
    
	/**
	 * Creates a new entity Collection.
	 * This is intended for internal use, to add collections to a context use {@link tent.entities.Context#createCollection}
	 * 
	 * @class a collection of entities of a {@link tent.entities.Type} attached to a {@link tent.entities.Context}
	 * @constructor
	 * @param {tent.entities.Context} context
	 * @param {tent.entities.Type} type
	 * @param {String} name name for this collection, if not specified the type name is used
	 */
    tent.entities.Collection = function Collection(context, type, name){
    
		/**
		 * the {@link tent.entities.Context} that owns this collection
		 * @type tent.entities.Context
		 * @field
		 */
        this.context = context;
		
		/**
		 * the {@link tent.entities.Type} of objects on this collection
		 * @type tent.entities.Type
		 * @field
		 */
        this.type = type;
		
		/**
		 * Collection name
		 * @type String
		 * @field
		 */
        this.name = name || type.name;
        
		/**
		 * Objects in this collection
		 * @type Array
		 * @field
		 */
        this.items = [];
        
        tent.arrays.extend(this.items);
    }
    
	/**
	 * Adds all arguments to this collection
	 * @throws if an argument already belongs to another collection
	 * @throws if an argument has a {@link tent.entities.Type} different from this collection {@link #type}
	 * @return {Number} the number of entities in this collection
	 */
    tent.entities.Collection.prototype.push = function(){
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
    
	/**
	 * Attachs all arguments to this collection. Each object change state is preserved. If no change state is found, object are added as unchanged.
	 * @throws if an argument already belongs to another collection
	 * @throws if an argument has a {@link tent.entities.Type} different from this collection {@link #type}
	 * @return {Number} the number of entities in this collection
	 */
    tent.entities.Collection.prototype.attach = function(){
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
                        if (arguments[i].__changeState__ != tent.entities.ChangeStates.DELETED) {
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
    
	/**
	 * Removes all arguments from this collection.
	 * @return {Boolean} true if any element has been removed (ie: a change has been made)
	 */
    tent.entities.Collection.prototype.remove = function(){
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
    
	/**
	 * Detaches all arguments from this collection (and its {@link #context})
	 * @return {Boolean} true if any element has been detached (ie: a change has been made)
	 */
    tent.entities.Collection.prototype.detach = function(){
        var removed = false;
        for (var i = 0, l = arguments.length; i < l; i++) {
            var item = arguments[i];
            if (this.items.remove(item) || item.__changeState__ == tent.entities.ChangeStates.DELETED) {
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
    
	/**
	 * Detaches ({@link #detach}) all entities in this collection ({@link #items})
	 * @return {Boolean} true if any element has been detached (ie: a change has been made)
	 */
    tent.entities.Collection.prototype.detachAll = function(){
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
    	
	/**
	 * Creates a new entity Context
	 * @class a Context that contains collections ({@link tent.entities.Collection}) of entities. Tracks changes on its entities.
	 * @constructor 
	 * @param {Object} trackChanges if true change tracking is activated
	 */
    tent.entities.Context = function Context(trackChanges){
        this.__collections__ = {};
        this.__types__ = {};
        if (trackChanges === true) {
            this.trackChanges();
        }
		
		/**
		 * Changes detected on this context. Activate change tracking calling {@link #trackChanges}
		 * @type tent.entities.ContextChanges
		 * @field
		 */		
		 this.changes = null;
    }
    
	/**
	 * A global {@link tent.entities.Context} instance.
	 */
    tent.entities.MyContext = new tent.entities.Context();
    
	/**
	 * Returns all entities in this Context
	 * @return {Array} all entities in this Context
	 */
    tent.entities.Context.prototype.all = function(){
        var items = [];
        for (var collname in this.__collections__) {
            items.push.apply(items, this.__collections__[collname].items);
        }
        return items;
    }
    
	/**
	 * Filters entities in this Context
	 * @param {function()} condition a function that returns true for items that pass the filter
	 * @return {Array} all entities in this Context that passed the filter
	 */
    tent.entities.Context.prototype.filter = function(condition){
        var items = [];
        for (var collname in this.__collections__) {
            items.push.apply(items, this.__collections__[collname].items.filter(condition));
        }
        return items;
    }
    
	/**
	 * Searchs for all arguments in this Context. Arguments can be an entity object, a {@link tent.entities.Type} or a {@link tent.entities.Collection} 
	 * @return {Boolean} true if all arguments were found on this Context 
	 */
    tent.entities.Context.prototype.contains = function(){
    
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
                    if (item instanceof tent.entities.Type) {
                        if (this.__types__[item.name] != item) {
                            return false;
                        }
                    }
                    else 
                        if (item instanceof tent.entities.Collection) {
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
    
	/**
	 * Creates a new {@link tent.entities.Collection} on this Context. If the collection already exists no action is performed.
	 * @param {tent.entities.Type} [type] the type for items in this collection, if not provided an untyped collection is created
	 * @param {String} [name] a name for the collection, if not provided the type name is used (for the untyped collection name is '_Object')
	 * @return {tent.entities.Collection} the new (or previously existing) collection
	 * @throws if no name and no type were provided
	 */
    tent.entities.Context.prototype.createCollection = function(type, name){
    
        if (!name) {
            if (!type) {
                name = '_Object';
            }
            else {
                if (type instanceof tent.entities.Type) {
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
            if (type && (!type instanceof tent.entities.Type)) {
                throw 'provided type is not a Type instance';
            }
        
        if (!this.__collections__[name]) {
            // create a new collection
            this.__collections__[name] = new tent.entities.Collection(this, type, name);
            
            // add shortcut
            var shortcutName = name;
            while (this[shortcutName]) {
                shortcutName += '_';
            }
            this[shortcutName] = this.__collections__[name];
            
        }
        return this.__collections__[name];
    }
    
	/**
	 * Adds an entity model to this context. 
	 * Allows to load entity models using JSON.
	 * 
	 * @example
	 * 
	 * 	var ctx = new tent.entities.Context();
	 * 
	 *  ctx.pushModel({ 
	 *    Person: {
	 *  	name: {}, // scalar property
	 *  	age: {}, // scalar property	
	 *  	pet: {
	 *  		reverse: 'owner', // each Person is his pet''s owner
	 *  		cardinality: '11', // one Person has one pet (optional, as '11' is the default)
	 *  		collection: 'Animal', // pets belong to the 'Animal' collection (see {@link tent.entities.Collection}
	 *  	} 
	 *    },
	 *    Animal: {
	 *  	name: {}, // scalar property
	 *  	age: {}, // scalar property	
	 *  	color: {}, // scalar property	
	 *  	owner: {
	 *  		reverse: 'pet', // each Animal is his owner''s pet
	 *  		cardinality: '11', // one Animal has one owner (optional, as '11' is the default)
	 *  		collection: 'Person', // owner belong to the 'Person' collection (see {@link tent.entities.Collection}
	 *  	} 
	 *    }
	 *  );
	 *  
	 * @param {Object} model an entity model
	 * @param {Object} model.types a javascript Object with properties represent entity types ({@link tent.entities.Type})
	 */
    tent.entities.Context.prototype.pushModel = function(model){
        if (model) {
            if (model.types) {
                for (var typeName in model.types) {
                    this.push(new tent.entities.Type(typeName, model.types[typeName]));
                }
            }
        }
    }
    
	/**
	 * Adds all arguments to this Context. Arguments can be an entity object (with or without type) or a {@link tent.entities.Type}.
	 * When a type is added, a {@link tent.entities.Collection} with that type and the same name is created.
	 * @throws if an argument belongs to another context
	 */
    tent.entities.Context.prototype.push = function() {
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
                    if (arguments[i] instanceof tent.entities.Type) {
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
                        if (arguments[i] instanceof tent.entities.Context) {
                            throw 'cannot add an EntityContext to an EntityContext';
                        }
                        else 
                            if (typeof arguments[i] == 'object') {
                                var type = arguments[i].__entityType__;
                                if (type) {
                                    if (this.__types__[type.name]) {
                                        // the object already has entityType, check that it is the same in the context
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
    
	/**
	 * Attachs all arguments to this Context. Arguments can be entity objects (with or without type).
	 * Each entity change state is preserved, if no change state is found entity is added as unchanged.
	 * @throws if an argument belongs to another context
	 * @throws if an argument type name exists in this context and is different
	 */
    tent.entities.Context.prototype.attach = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                throw 'cannot attach arrays';
            }
            else 
                if (arguments[i].__collection__) {
	                if (arguments[i].__collection__.context == this) {
	                    // object already attached
                        continue;
                    }
                    else {
                        throw 'cannot attach this item, it belongs to another Context';
                    }
                }
                else 
                    if (arguments[i] instanceof tent.entities.Type) {
                        throw 'cannot attach EntityTypes';
                    }
                    else 
                        if (arguments[i] instanceof tent.entities.Context) {
                            throw 'cannot attach an EntityContext to an EntityContext';
                        }
                        else 
                            if (typeof arguments[i] == 'object') {
                                var type = arguments[i].__entityType__;
                                if (type) {
                                    if (this.__types__[type.name]) {
                                        // the object already has entityType, check that it is the same in the context
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
    
	/**
	 * Removes all arguments from this context. Arguments can be entity objects (with or without type).
	 */
    tent.entities.Context.prototype.remove = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof tent.entities.Type) {
                throw 'cannot remove EntityTypes';
            }
            else 
                if (arguments[i] instanceof tent.entities.Context) {
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
    
	/**
	 * Detaches all arguments from this context.
	 */
    tent.entities.Context.prototype.detach = function(){
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                throw 'cannot detach arrays';
            }
            if (arguments[i] instanceof tent.entities.Type) {
                throw 'cannot detach EntityTypes';
            }
            else 
                if (arguments[i] instanceof tent.entities.Context) {
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
    
	/**
	 * Detaches all entities on this Context
	 */
    tent.entities.Context.prototype.detachAll = function(){
        var removed = false;
        for (var i = 0; i < this.__collections__.length; i++) {
            if (this.__collections__[i].detachAll()) {
                removed = true;
            }
        }
        return removed;
    }
    
	/**
	 * Marks all arguments as modified
	 */
    tent.entities.Context.prototype.touch = function(){
        if (this.changeHandler) {
            return this.changeHandler.touch.apply(this.changeHandler, arguments);
        }
    }
    
	/**
	 * Cascades push on all arguments, pushing referenced objects too
	 * @private
	 */
    tent.entities.Context.prototype.__cascadePush__ = function(){
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
    
	/**
	 * Cascades attach on all arguments, attaching referenced objects too
	 * @private
	 */
    tent.entities.Context.prototype.__cascadeAttach__ = function(){
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
    
	    
	/**
	 * Cascades remove on all arguments, removing referenced objects too
	 * @private
	 */
    tent.entities.Context.prototype.__cascadeRemove__ = function(){
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
    
	/**
	 * Cascades detaches on all arguments, detaching referenced objects too
	 * @private
	 */
    tent.entities.Context.prototype.__cascadeDetach__ = function(){
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
    
	/**
	 * Activates change tracking for this context
	 */
    tent.entities.Context.prototype.trackChanges = function(){
        if (!this.changeHandler) {
			/**
			 * Change handler for this context
			 * @type tent.entities.ContextChangeHandler
			 * @field
			 */
            this.changeHandler = new tent.entities.ContextChangeHandler(this);
            this.changeHandler.init();
        }
    }
    
	/**
	 * Indicates if changes on this Context's entities has been detected
	 * @return {Boolean} true if any change has ocurred
	 */
    tent.entities.Context.prototype.hasChanges = function(){
        return !!(this.changes && this.changes.items.length > 0);
    }
    
	/**
	 * Marks items being saved by a a sync operation (this prevents concurrent modification conflicts)
	 */
	tent.entities.Context.prototype.markAsSaving = function(){
        for (var i = 0; i < arguments.length; i++) {			
			var item = arguments[i];
			if (item.__syncState__ && item.__syncState__.saving){
				throw 'cannot start saving, item already being saved';
			}
			item.__syncState__ = { saving: true };
		}
	}	
	
	/**
	 * Clears all detected changes, marking all entities as unchanged.
	 */
    tent.entities.Context.prototype.acceptAllChanges = function(){
        if (this.changeHandler) {
            this.changeHandler.acceptAllChanges();
        }
    }

	/**
	 * Clears detected changes, marking entities as unchanged. 
	 * @param {Object|Number} [change] a changed object or an index in the {@link tent.entities.ContextChanges#items} array on {@link #changes} (you can use one or more of this parameters)
	 */	    
    tent.entities.Context.prototype.acceptChanges = function(){
        if (this.changeHandler) {
            this.changeHandler.acceptChanges.apply(this.changeHandler, arguments);
        }
    }
    
	/**
	 * Creates a new entity link
	 * @class a link between to entities, specially useful when tracking many-to-many relationships
	 * @constructor
	 * @param {Object} from source entity
	 * @param {Object} to target entity
	 * @param {Object} propertyName property in source entity that point to target entity
	 * @param {Object} changeState change state of this relationship
	 */
    tent.entities.EntityLink = function EntityLink(from, to, propertyName, changeState){
		/**
		 * Source entity
		 * @field
		 */
        this.from = from;
		/**
		 * Target entity
		 * @field
		 */
        this.to = to;
		/**
		 * Property in source entity that point to target entity
		 * @type String
		 * @field
		 */
        this.propertyName = propertyName;
        this.__changeState__ = changeState || tent.entities.ChangeStates.DETACHED;
    }
    
	/**
	 * Creates a new set of context changes. Used internally when activating change tracking, see {tent.entities.Context#trackChanges}
	 * @class Changes ocurred in a {@link tent.entities.Context}
	 * @constructor  
	 * @param {tent.entities.Context} context
	 */
    tent.entities.ContextChanges = function ContextChanges(context){
		/**
		 * Context where this changes ocurred
		 * @type tent.entities.Context
		 * @field
		 */		
        this.context = context;
		/**
		 * Changed items, in the order they changed
		 * @type Array
		 * @field
		 */
        this.items = [];
        tent.arrays.extend(this.items);
    }
    
	/**
	 * @return a human-readable description of changes ocurred
	 */
    tent.entities.ContextChanges.prototype.toString = function(){
        var count = new tent.coreTypes.NameCounter();
        for (var i = 0, l = this.items.length; i < l; i++) {
            count.add(tent.entities.ChangeStates.getName(this.items[i].__changeState__) + "." + this.items[i].__collection__.name);
        }
        return count.toString();
    }
    
	/**
	 * Creates a new change handler
	 * @class Handle changes in a {@link tent.entities.Context}
	 * @param {tent.entities.Context} context
	 */
    tent.entities.ContextChangeHandler = function ContextChangeHandler(context){
		/**
		 * Context to which this handler belongs
		 * @type tent.entities.Context
		 * @field
		 */
        this.context = context;
    }
    
	/**
	 * @return {Boolean} if item is detached
	 * @param {Object} item an entity object
	 */
    tent.entities.ContextChangeHandler.prototype.isDetached = function(item){
        return (!item.__changeState__) || (item.__changeState__ == tent.entities.ChangeStates.DETACHED);
    }
    
	/**
	 * Binds this handler to all array properties (ie: cardinality '1n' or 'nm')
	 * @private
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.bindArrayProperties = function(item){
        // listen for changes in item array properties, to detect childrens added/removed
        if (item.__entityType__) {
            for (var n in item.__entityType__.properties) {
                var prop = item.__entityType__.properties[n];
                if (prop.cardinality && prop.cardinality.substr(1,1) != '1' && item[n] instanceof Array) {
                    item[n].__parent__ = item;
                    item[n].__propertyName__ = n;
                    tent.changes.bind(item[n], this);
                }
            }
        }
    }
    
	/**
	 * Unbinds this handler from all array properties (ie: cardinality '1n' or 'nm')
	 * @private
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.unbindArrayProperties = function(item){
        // stop listening for changes in item array properties
        if (item.__entityType__) {
            for (var n in item.__entityType__.properties) {
                var prop = item.__entityType__.properties[n];
                if (prop.cardinality && prop.cardinality.substr(1,1) != '1' && item[n] instanceof Array) {
                    tent.changes.unbind(item[n], this);
                }
            }
        }
    }
    
	/**
	 * Activates tracking on item complex properties
	 * @private
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.trackComplexProperties = function(item){
        
        if (item.__entityType__) {
            for (var n in item.__entityType__.properties) {
                var prop = item.__entityType__.properties[n];
                if (prop.complex) {
					if (typeof item[n] == 'object') {
						tent.changes.track(item[n], {
							deep: true,
							attachedObjects:false,
							parentObject: item,
							parentObjectPropertyName: n
						});
					}
				}
            }
        }else {
			// by default all properties in untyped objects are complex
            for (var n in item) {
				if ((n.substr(0,1)!=='_') && item.hasOwnProperty(n)) {
					if (typeof item[n] == 'object') {
						tent.changes.track(item[n], {
							deep: true,
							attachedObjects:false,
							parentObject: item,
							parentObjectPropertyName: n
						});
					}
				}			
			}
		}
    }
	
	/**
	 * Marks an entity as added
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.setAdded = function(item){
        if (item.__changeState__ == tent.entities.ChangeStates.ADDED) {
            return;
        }
        if (!item.__collection__) {
            item.__changeState__ = tent.entities.ChangeStates.ADDED;
        }
        else {
            if (item.__collection__.context == this.context) {
                item.__changeState__ = tent.entities.ChangeStates.ADDED;
                if (!this.context.changes) {
                    this.context.changes = new tent.entities.ContextChanges(this.context);
                }
                this.context.changes.items.pushUnique(item);
            }
            else {
                throw 'cannot set this item as ADDED, it belongs to another Context';
            }
        }
    }
    
	/**
	 * Marks an entity as deleted
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.setRemoved = function(item){
        if (this.isDetached(item) || item.__changeState__ == tent.entities.ChangeStates.DELETED) {
            return;
        }
        if (!item.__collection__) {
            item.__changeState__ = tent.entities.ChangeStates.DELETED;
			if (item.__syncState__ && item.__syncState__.saving){
				item.__syncState__.deletedWhileSaving = true; 
			}
        }
        else {
            if (item.__collection__.context == this.context) {
                if ((item.__changeState__ == tent.entities.ChangeStates.UNCHANGED) ||
                (item.__changeState__ == tent.entities.ChangeStates.MODIFIED)) {
                    item.__changeState__ = tent.entities.ChangeStates.DELETED;
					if (item.__syncState__ && item.__syncState__.saving){
						item.__syncState__.deletedWhileSaving = true; 
					}
                    if (!this.context.changes) {
                        this.context.changes = new tent.entities.ContextChanges(this.context);
                    }
                    this.context.changes.items.pushUnique(item);
                }
                else 
                    if (item.__changeState__ == tent.entities.ChangeStates.ADDED) {
                        this.context.changes.items.remove(item);
						if (item.__syncState__ && item.__syncState__.saving){
							item.__syncState__.deletedWhileSaving = true; 
	                        item.__changeState__ = tent.entities.ChangeStates.DELETED;
		                    this.context.changes.items.pushUnique(item);
						} else {
    	                    item.__changeState__ = tent.entities.ChangeStates.DETACHED;
	                        delete item.__collection__;
	                        if (!this.context.changes) {
	                            this.context.changes = new tent.entities.ContextChanges(this.context);
	                        }
						}
                    }
            }
            else {
                throw 'cannot set this item as DELETED, it belongs to another Context';
            }
        }
    }
    
	/**
	 * Marks all arguments as modified
	 */
    tent.entities.ContextChangeHandler.prototype.touch = function(){
        for (var i = 0, l = arguments.length; i < l; i++) {
            if (arguments[i].__collection__ && arguments[i].__collection__.context == this.context) {
				if (arguments[i].__changeState__ === tent.entities.ChangeStates.UNCHANGED){
	                // mark item as MODIFIED
	                if (!this.context.changes) {
	                    this.context.changes = new tent.entities.ContextChanges(this);
	                }
	                arguments[i].__changeState__ = tent.entities.ChangeStates.MODIFIED;
	                this.context.changes.items.pushUnique(arguments[i]);
				} else if (arguments[i].__syncState__ && arguments[i].__syncState__.saving &&
					(arguments[i].__changeState__ === tent.entities.ChangeStates.MODIFIED ||
					arguments[i].__changeState__ === tent.entities.ChangeStates.ADDED)) {
					// item is being saved
					// remember that changes ocurred while saving, keep MODIFIED when sync is complete
					arguments[i].__syncState__.changedWhileSaving = true;
				}
            }
        }
    }
    
	/**
	 * Called when an item is added
	 * @private
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.itemAdded = function(item){
        if (this.isDetached(item)) {
            this.setAdded(item);
        }
        else {
            // allow attach item with pre-established state
            if (item.__changeState__ != tent.entities.ChangeStates.UNCHANGED) {
                if (!this.context.changes) {
                    this.context.changes = new tent.entities.ContextChanges(this.context);
                }
                this.context.changes.items.pushUnique(item);
            }
        }
        if (item.__changeState__ != tent.entities.ChangeStates.DELETED) {
            // listen for changes in item
            tent.changes.bind(item, this);
            // listen for changes in item array properties, to detect childrens added/removed
            this.bindArrayProperties(item);
			
			this.trackComplexProperties(item);
        }
    }
    
	/**
	 * Called when an item is attached
	 * @private
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.itemAttached = function(item){
        if (this.isDetached(item)) {
            item.__changeState__ = tent.entities.ChangeStates.UNCHANGED;
        }
        this.itemAdded(item);
    }
    
	/**
	 * Called when an item is removed
	 * @private
	 * @param {Object} item
	 */
    tent.entities.ContextChangeHandler.prototype.itemRemoved = function(item){
        this.setRemoved(item);
        // stop listening for changes in item
        tent.changes.unbind(item, this);
        // stop listening for changes in item array properties
        this.unbindArrayProperties(item);
    }
	
	/**
	 * Called when an item is detached
	 * @private
	 * @param {Object} item
	 */    
    tent.entities.ContextChangeHandler.prototype.itemDetached = function(item){
        // item detached from context
        var changes = this.context.changes;
        if (item.__changeState__ != tent.entities.ChangeStates.UNCHANGED) {
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
    	
	/**
	 * Called when an item is linked (referenced by a property value or added to an array property)
	 * @private
	 * @param {Object} subject
	 * @param {String} propertyName
	 * @param {Object} property
	 * @param {Object} obj
	 */
    tent.entities.ContextChangeHandler.prototype.objectLinked = function(subject, propertyName, property, obj){
    
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
            
                if (obj.__changeState__ == tent.entities.ChangeStates.DELETED) {
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
                        if ((chg instanceof tent.entities.EntityLink) &&
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
                        elink = new tent.entities.EntityLink(subject, obj, propertyName, tent.entities.ChangeStates.ADDED);
                        this.context.changes.items.push(elink);
                    }
                    else {
                        if (elink.__changeState__ == tent.entities.ChangeStates.DELETED) {
                            // removed link is restored
                            elink.__changeState__ = tent.entities.ChangeStates.UNCHANGED;
                        }
                    }
                }
                
            }
    }
    
	/**
	 * Called when an item is unlinked (de-referenced by a property value or removed from an array property)
	 * @private
	 * @param {Object} subject
	 * @param {String} propertyName
	 * @param {Object} property
	 * @param {Object} obj
	 */
    tent.entities.ContextChangeHandler.prototype.objectUnlinked = function(subject, propertyName, property, obj){
    
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
                        if ((chg instanceof tent.entities.EntityLink) &&
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
                        elink = new tent.entities.EntityLink(subject, obj, propertyName, tent.entities.ChangeStates.DELETED);
                        this.context.changes.items.push(elink);
                    }
                    else {
                        if (elink.__changeState__ == tent.entities.ChangeStates.ADDED) {
                            // new link deleted, remove tracked change
                            this.context.changes.items.splice(elinki, 1);
                        }
                        else 
                            if (elink.__changeState__ != tent.entities.ChangeStates.DELETED) {
                                // existing link deleted
                                elink.__changeState__ = tent.entities.ChangeStates.DELETED;
                            }
                    }
                }
            }
    }
    
	/**
	 * Returns a change tracked property descriptor. 
	 * @param {Object} subject the change tracked object
	 * @param {String} propertyName the property being tracked
	 * @return a property descriptor if the property exists and is being tracked
	 */
    tent.entities.ContextChangeHandler.prototype.getTrackedProperty = function(subject, propertyName){
        var prop;
        if (subject.__entityType__ &&
        subject.__changeState__ &&
        subject.__changeState__ != tent.entities.ChangeStates.DELETED &&
        subject.__changeState__ != tent.entities.ChangeStates.DETACHED &&
        subject.__collection__ &&
        subject.__collection__.context == this.context &&
        (prop = subject.__entityType__.properties[propertyName])) {
            return prop;
        }
    }
    
	/**
	 * Handles a {@link tent.changes.Change} for this context
	 * @param {tent.changes.Change} change
	 */
    tent.entities.ContextChangeHandler.prototype.handle = function(change){
    
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
                
                    // children added don''t modify its parent
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
                    
                        // children removed don''t modify its parent
                        //this.context.touch(parent);
                        
                        for (var i = 0, l = change.data.items.length; i < l; i++) {
                            this.objectUnlinked(parent, change.data.propertyName, prop, change.data.items[i]);
                        }
                        
                    }
                    
                }

        // keep reverse properties in sync
        tent.changes.reverseProperties.getHandler()(change);
    }
    
	/**
	 * Initializes this change handler, binding itself to all entities in the context
	 */
    tent.entities.ContextChangeHandler.prototype.init = function(){
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
    
	/**
	 * Clears all changes detected, and marks all entities as unchanged.
	 */
    tent.entities.ContextChangeHandler.prototype.acceptAllChanges = function(){
        if (this.context.hasChanges()) {
            if (this.context.log) {
                tent.log.debug("Context: accepting changes, " + this.context.changes);
            }
            
            var items = this.context.changes.items;
            for (var i = 0, l = items.length; i < l; i++) {
                items[i].__changeState__ = tent.entities.ChangeStates.UNCHANGED;
            }
            items.length = 0;
            if (this.context.log) {
                tent.log.debug("Context: all changes accepted");
            }
        }
    }
	
	/**
	 * Clears detected changes, marking entities as unchanged. 
	 * @param {Object|Number} [change] a changed object or an index in the {@link tent.entities.ContextChanges#items} array on {@link tent.entities.Context#changes} (you can use one or more of this parameters)
	 */	    
	tent.entities.ContextChangeHandler.prototype.acceptChanges = function(){
		for (var i=0,l=arguments.length; i<l; i++){
			var change = arguments[i];
			var changeIndex ;
			 if (typeof change=='number'){
			 	changeIndex = change;
			 	if (changeIndex < 0 || this.context.changes.items.length < changeIndex - 1) {
					change = null;
					changeIndex=-1;
				}
				else {
					change = this.context.changes.items[changeIndex];
				}
			 }else{
			 	changeIndex = this.context.changes.items.lastIndexOf(change);
			 }
			 if (changeIndex >= 0 && change){
				if ((change.__changeState__ === tent.entities.ChangeStates.ADDED) ||
					(change.__changeState__ === tent.entities.ChangeStates.MODIFIED)){
				 	this.context.changes.items.splice(changeIndex,1);
					change.__changeState__ = tent.entities.ChangeStates.UNCHANGED;
					if (change.__syncState__ && change.__syncState__.changedWhileSaving) {
						delete change.__syncState__;
						this.context.touch(change);	
					}
				}else if (change.__changeState__ === tent.entities.ChangeStates.DELETED){
					if (change.__syncState__ && change.__syncState__.deletedWhileSaving) {
						delete change.__syncState__;
					} else {
					 	this.context.changes.items.splice(changeIndex,1);
						change.__changeState__ = tent.entities.ChangeStates.DETACHED;
					}
				}
				
				delete change.__syncState__;
			 }
		}
    }
    
});

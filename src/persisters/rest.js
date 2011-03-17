/**
 * @requires tent.persisters
 * @requires jQuery
 * @name tent.persisters.rest
 * @namespace HTTP RESTful Persister using jQuery.ajax
 */
tent.declare('tent.persisters.rest', function(){

    /**
     * Combines URIs (only combines for paths, query and hash combining not supported)
     * @return {String} the URI that combines all arguments
     */
    tent.persisters.rest.uriCombine = function(){
        var uri = '';
        for (var i = 0, l = arguments.length; i < l; i++) {
            var strarg = arguments[i] + '';
            if (strarg) {
            
                if (strarg.match(/^[A-Za-z]+\:\/\//)) {
                    // is absolute, replace current uri
                    uri = strarg;
                }
                else {
                    if (uri.substr(uri.length - 1, 1) == '/') {
                        if (strarg.substr(0, 1) == '/') {
                            uri += strarg.substr(1);
                        }
                        else 
                            if (strarg.substr(0, 2) == './') {
                                uri += strarg.substr(2);
                            }
                            else {
                                uri += strarg;
                            }
                    }
                    else {
                        if (strarg.substr(0, 1) == '/') {
                            uri += strarg;
                        }
                        else 
                            if (strarg.substr(0, 2) == './') {
                                uri += strarg.substr(1);
                            }
                            else {
                                uri += '/' + strarg;
                            }
                    }
                }
            }
        }
		return uri;
    }
    	    
    /**
     * 	@private
     */
    tent.persisters.rest.createItemMapper = function(defaultOptions){
    
        if (!defaultOptions) {
            defaultOptions = {};
        }
        return function(data, options, map){
            var items;
            if (data instanceof Array) {
                items = data;
            }
            else {
                if (options.multi) {
                    var multiSelector = options.multiSelector || defaultOptions.multiSelector ||
                    function(d, opt){
                        var propName = opt.multiSelectorProperty || defaultOptions.multiSelectorProperty;
                        if (propName) {
                            return d[propName];
                        }
                        else {
                            for (var prop in d) {
                                if (d[prop] instanceof Array) {
                                    return d[prop];
                                }
                            }
                        }
                    };
                    items = multiSelector(data, options);
                }
                else {
                    var singleSelector = options.singleSelector || defaultOptions.singleSelector ||
                    function(d, opt){
                        var propName = opt.singleSelectorProperty || defaultOptions.singleSelectorProperty;
                        if (propName) {
                            return [d[propName]];
                        }
                        else {
                            return [d];
                        }
                    };
                    items = singleSelector(data, options);
                }
            }
            
            if (items) {
                for (var i = 0, l = items.length; i < l; i++) {
                    var item = items[i];
                    if (options.multi) {
                        var itemSelector = options.multiItemSelector || defaultOptions.multiItemSelector ||
                        function(d, opt){
                            var propName = opt.multiItemSelectorProperty || defaultOptions.multiItemSelectorProperty;
                            if (propName) {
                                return d[propName];
                            }
                            else {
                                return d;
                            }
                        };
                        item = itemSelector(item, options);
                    }
                    
                    if (item) {
                        var itemTransformer = options.itemTransformer || defaultOptions.itemTransformer;
                        if (itemTransformer) {
                            item = itemTransformer(item, options);
                        }
                    }
                    if (item) {
                        map(item, options);
                    }
                }
            }
        }
    }
    
    /**
     * 	@private
     */
    tent.persisters.rest.createChangeSerializer = function(defaultOptions){
    
        if (!defaultOptions) {
            defaultOptions = {};
        }
        return function(items, options){
            var data, chg;
            
            var serializer = options.itemSerializer || defaultOptions.itemSerializer ||
            function(local, op){
                if (local instanceof tent.entities.EntityLink) {
                    // EntityLinks not supported
                    return null;
                }
                var rmt = tent.clone(local,{
					deep:true,
					onlyOwnProperties:true,
					attachedObjects: false,
					skipPrivates:true
				});
				
				if (local._id) {
					rmt._id = tent.pget(local, '_id');
				}
				if (local._rev) {
					rmt._rev = tent.pget(local, '_rev');
				}

                if (local.__changeState__ === tent.entities.ChangeStates.DELETED) {
                    rmt._deleted = true;
                }
				return rmt;
            };
            
            
            if (items instanceof Array) {
            
                var dataItems = [];
                
                for (var i = 0, l = items.length; i < l; i++) {
                    dataItems.push(serializer(items[i], options));
                }
                
                var wrapperProp = options.saveWrapperProperty || defaultOptions.saveWrapperProperty || 'docs';
                var wrapper = options.itemsSaveWrapper || defaultOptions.itemsSaveWrapper ||
                function(ditems, op){
                    var d = {};
                    d[wrapperProp] = ditems;
                    return d;
                };
                
                return wrapper(dataItems, options);
                
            }
            else 
                if (typeof items == 'object') {
                    return serializer(items, options);
                }
        }
    }
    
    /**
     * 	@private
     */
    tent.persisters.rest.createChangeResponseMapper = function(defaultOptions){
    
        if (!defaultOptions) {
            defaultOptions = {};
        }
        return function(data, options, map){
            var items;
            if (data instanceof Array) {
                items = data;
            }
            else {
                var resultSelector = options.resultSelector || defaultOptions.resultSelector ||
                function(d, opt){
                    var propName = opt.resultSelectorProperty || defaultOptions.resultSelectorProperty;
                    if (propName) {
                        return d[propName];
                    }
                    else {
                        items = d;
                        for (var prop in d) {
                            if (d[prop] instanceof Array) {
                                return d[prop];
                            }
                        }
                    }
                };
                items = resultSelector(data, options);
            }
            
            if (items) {
                for (var i = 0, l = items.length; i < l; i++) {
                    var item = items[i];
                    
                    var itemSelector = options.resultItemSelector || defaultOptions.resultItemSelector ||
                    function(d, opt){
                        var propName = opt.resultItemSelectorProperty || defaultOptions.resultItemSelectorProperty;
                        if (propName) {
                            return d[propName];
                        }
                        else {
                            return d;
                        }
                    };
                    item = itemSelector(item, options);
                    
                    if (item) {
                        var itemTransformer = options.resultItemTransformer || defaultOptions.resultItemTransformer;
                        if (itemTransformer) {
                            item = itemTransformer(item, options);
                        }
                    }
                    if (item) {
                    
                    
                        var localChangeFinder = options.localChangeFinder || defaultOptions.localChangeFinder ||
                        function(ctx, remote, op){
                            if (ctx.hasChanges()) {
                                for (var j = 0, l = ctx.changes.items.length; j < l; j++) {
                                    if (typeof remote.id != 'undefined' && ctx.changes.items[j]._id === remote.id) {
                                        return j;
                                    }
                                    if (typeof remote.id != 'undefined' && ctx.changes.items[j].id === remote.id) {
                                        return j;
                                    }
                                    if (typeof remote._id != 'undefined' && ctx.changes.items[j]._id === remote._id) {
                                        return j;
                                    }
                                    if (typeof remote._id != 'undefined' && ctx.changes.items[j].id === remote._id) {
                                        return j;
                                    }
                                }
                            }
                        };
                        
                        var localChangeIndex = localChangeFinder(options.context, item, options);
                        
                        if (!(typeof localChangeIndex == 'number' && localChangeIndex >= 0)) {
							if (!(options.unorderedResults || defaultOptions.unorderedResults)) {
								// if results are in order, the first change in the list, is next
								localChangeIndex = 0;
							}
						}
						
                        if (typeof localChangeIndex == 'number' && localChangeIndex >= 0) {
                            map(item, localChangeIndex, options);
                        }
                    }
                }
            }
        }
    }
    	
    /**
     * Creates a new REST persister
     * @class a REST persister
     * @constructor
     */
    tent.persisters.rest.RestPersister = function RestPersister(){
    
        /**
         * Absolute base URI for this persister
         * @field
         * @type String
         */
        this.baseUri = 'http://127.0.0.1:5984/mydb';
        
        /**
         * Indicates if this persister is saving changes
         * @field
         * @type Boolean
         */
        this.saving = false;
        
        /**
         * Errors ocurred while saving
         * @field
         * @type Array
         */
        this.savingErrors = [];
        
        /**
         * Errors ocurred while loading
         * @field
         * @type Array
         */
        this.loadingErrors = [];
        
        /**
         * function that maps items from data obtained on load
         * @field
         * @type function()
         */
        this.loadItemMapper = null;
        
        /**
         * function that finds the local version of a loaded item
         * @field
         * @type function()
         */
        this.localItemFinder = function(context, remote){
            return context.filter(function(item){
                if ((typeof remote._id != 'undefined' && item._id === remote._id) ||
                (typeof remote.id != 'undefined' && item.id === remote.id)) {
                    return true;
                }
                return false;
            })[0];
        };
        
        /**
         * function that compares a local item version with a loaded item
         * @field
         * @type function()
         */
        this.versionEquals = function(local, remote){
            return local._rev === remote._rev;
        };
        
        /**
         * function that updates local version field from a save response
         * @field
         * @type function()
         */
        this.updateLocalVersion = function(local, remote){
            local._rev = remote.rev || remote._rev;
			if (typeof remote.id != 'undefined' && remote.id !== local._id){
				local._id = remote.id;
			}
        };
        
        /**
         * function that indicates if a loaded item is deleted
         * @field
         * @type function()
         */
        this.isDeleted = function(remote){
            return remote._deleted;
        };
        
        /**
         * function that serializes a change item
         * @field
         * @type function()
         */
        this.changeSerializer = null;
        
        /**
         * function that maps change responses to local changes
         * @field
         * @type function()
         */
        this.changeResponseMapper = null;
        
        /**
         * URI for bulk save operations (or null to use individual save requests)
         * @field
         * @type String
         */
        this.bulkSaveUri = null;
    }
    
    /**
     * 	Load entities from an URL into a {@link tent.entities.Context}
     *  @param {tent.entities.Context} context
     *  @param {String} url that returns a JSON representation of entities
     *  @param {Object} [options] loading options
     *  @param {Boolean} [options.multi] indicates if the url will return a collection of entities
     *  @param {String} [options.credentials] http basic auth credentials in the form 'username:password' and base64 encoded
     *  @param {Object} [options.method] http method, default 'GET'
     *  @param {function()} [options.complete] function to call when operation is complete
     */
    tent.persisters.rest.RestPersister.prototype.load = function(context, url, options){
        try {
            if (!context) {
                throw 'a context is required for loading entities';
            }
            if (!url) {
                throw 'an url must be specified to load';
            }
            if (this.loading) {
                throw 'already loading entities';
            }
            this.loading = true;
            var persister = this;
            
            if (!options) {
                options = {};
            }
            var comp = options.complete;
			/**
			 * @ignore
			 */
            options.complete = function(r){
                persister.loading = false;
                if (r.error) {
                    persister.loadingErrors.push(r.error);
                }
                if (comp) {
                    comp(r);
                }
            };
            
            this.__load__(context, url, options);
        } 
        catch (err) {
            this.loadingErrors.push(err);
            this.loading = false;
            if (options.complete) {
                options.complete({
                    error: err
                });
            }			
		}
    }

    /**
     * 	@private
     */
    tent.persisters.rest.RestPersister.prototype.__load__ = function(context, url, options){
    
        if (typeof jQuery == 'undefined' || typeof jQuery.ajax == 'undefined') {
            throw 'jQuery.ajax is required in order to load entities';
        }
        
        url = tent.persisters.rest.uriCombine(this.baseUri, url);
        
        //options.credentials = 'YmVuamFtaW5lOnB5TGdvckNM';
        jQuery.ajax({
            context: {
                persister: this,
                context: context,
                options: options
            },
            url: url,
            beforeSend: function(req){
                if (options.credentials) {
                    req.setRequestHeader("Origin", document.location.protocol + "//" + document.location.host);
                    req.setRequestHeader("Authorization", "Basic " + options.credentials);
                }
            },
            type: options.method || 'GET',
            cache: !!options.cache,
            dataType: 'json',
            success: function(data, textStatus, req){
                var result = {
                    persister: this,
                    options: options
                };
                try {
                    this.persister.__processLoadResponse__(this.context, data, options, result);
                    result.ok = true;
                } 
                catch (err) {
                    result.error = err;
                }
                if (options.complete) {
                    options.complete(result);
                }
            },
            error: function(req, textStatus, error){
                var result = {
                    persister: this,
                    options: options,
                    error: {
                        type: textStatus,
                        errorThrown: error
                    }
                };
                if (options.complete) {
                    options.complete(result);
                }
            }
        });
    }
    
    /**
     * 	@private
     */
    tent.persisters.rest.RestPersister.prototype.__processLoadResponse__ = function(context, data, options, result){
        // load entities as unchanged
        
        if (options.context !== context) {
            options.context = context;
        }
        if (!this.loadItemMapper) {
            this.loadItemMapper = tent.persisters.rest.createItemMapper();
        }
		var persister = this;
        this.loadItemMapper(data, options, function(doc, opt){
        
            var local = persister.localItemFinder(context, doc);
            
            if (local) {
                if (local.__changeState__ === tent.entities.ChangeStates.MODIFIED ||
                local.__changeState__ === tent.entities.ChangeStates.DELETED) {
                    if (persister.versionEquals(local, doc)) {
                        // revision unchanged, local version is newer
                    }
                    else {
                        // revision changed, somebody else changed server version, conflict!
                        local.__loadErrors__.push({
                            error: 'conflict',
                            reason: 'document modified recently by another user'
                        });
                    }
                }
                else {
                    if (persister.isDeleted(doc)) {
                        // item deleted on the server
                        context.remove(local);
                        context.detach(local);
                    }
                    else {
                        // update local item with remote version
                        tent.pset(local, doc, true);
						
						// track changes in complex properties
						if (context.changeHandler){
							context.changeHandler.trackComplexProperties(local);							
						}
                    }
                    if (local.__loadErrors__) {
                        delete local.__loadErrors__;
                    }
                }
            }
            else {
                // attach new item as unchanged
                context.attach(doc);
            }
        });
    }

	/**
     * Persists all changes in a {@link tent.entities.Context}
	 * @param {tent.entities.Context} context
	 * @param {Object} [options] saving options
     *  @param {String} [options.credentials] http basic auth credentials in the form 'username:password' and base64 encoded
     *  @param {function()} [options.complete] function to call when operation is complete
	 */
    tent.persisters.rest.RestPersister.prototype.saveChanges = function(context, options){
        try {
            if (!context) {
                throw 'a context is required for saving changes';
            }
            if (!options) {
                options = {};
            }
            if (!options.context) {
                options.context = context;
            }
            if (context.hasChanges()) {
                if (this.saving) {
                    throw 'Already saving changes';
                }
                this.saving = true;
                var persister = this;
                
                var comp = options.complete;
				
				/**
				 * @ignore
				 */
                options.complete = function(r){
                    persister.saving = false;
                    if (r.error) {
                        persister.savingErrors.push(r.error);
                    }
                    else 
                        if (typeof r.ok == 'undefined') {
                            r.ok = true;
                        }
                    if (comp) {
                        comp(r);
                    }
                };
                
                this.__persist__(context, options);
            }
            else {
                if (options.complete) {
                    options.complete({
                        ok: true,
                        nochanges: true
                    });
                }
            }
        } 
        catch (err) {
            this.savingErrors.push(err);
            this.saving = false;
            if (options.complete) {
                options.complete({
                    error: err
                });
            }
        }
    }
    
    /**
     * 	@private
     */
    tent.persisters.rest.RestPersister.prototype.__persist__ = function(context, options){
    
        if (typeof jQuery == 'undefined' || typeof jQuery.ajax == 'undefined') {
            throw 'jQuery.ajax is required in order to persist changes';
        }
        
        if (this.bulkSaveUri) {
        
            // bulk save
            var url = tent.persisters.rest.uriCombine(this.baseUri, this.bulkSaveUri);
            
            var data = this.__getPersistData__(context, options);
            if (data == null) {
                var result = {
                    persister: this,
                    ok: true,
                    nochanges: true
                };
                if (options.complete) {
                    options.complete(result);
                }
            }
            else {
                jQuery.ajax({
                    context: {
                        persister: this,
                        context: context
                    },
                    url: url,
                    beforeSend: function(req){
                        if (options.credentials) {
                            req.setRequestHeader("Origin", document.location.protocol + "//" + document.location.host);
                            req.setRequestHeader("Authorization", "Basic " + options.credentials);
                        }
                    },
                    type: 'POST',
                    cache: false,
                    data: JSON.stringify(data),
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function(data, textStatus, req){
                        var result = {
                            persister: this
                        };
                        try {
                            this.persister.__processPersistResponse__(this.context, data, options, result);
                            result.ok = true;
                        } 
                        catch (err) {
                            result.error = err;
                        }
                        if (options.complete) {
                            options.complete(result);
                        }
                    },
                    error: function(req, textStatus, error){
                        var result = {
                            persister: this,
                            error: {
                                type: textStatus,
                                errorThrown: error
                            }
                        };
                        if (options.complete) {
                            options.complete(result);
                        }
                    }
                });
            }
        }
        else {
            // persist each change individually
            throw 'individual change save not implemented';
        }
    }
    
    /**
     * 	@private
     */
    tent.persisters.rest.RestPersister.prototype.__getPersistData__ = function(context, options){
        // Convert Context unsaved changes to JSON batch format
        
        if (!this.changeSerializer) {
            this.changeSerializer = tent.persisters.rest.createChangeSerializer();
        }
        
        var data = null;
        
        if (context.hasChanges()) {
            data = this.changeSerializer(context.changes.items, options);
        }
        
        return data;
    }
    
    /**
     * 	@private
     */
    tent.persisters.rest.RestPersister.prototype.__processPersistResponse__ = function(context, data, options, result){
        // mark saved entities as unchanged
        
        if (context.hasChanges()) {
        
            if (!this.changeResponseMapper) {
                this.changeResponseMapper = tent.persisters.rest.createChangeResponseMapper();
            }
            var persister = this;
            this.changeResponseMapper(data, options, function(remote, localChangeIndex, opt){
            
                var local = context.changes.items[localChangeIndex];
                if (remote.error) {
                    if (!local.__saveErrors__) {
                        local.__saveErrors__ = [];
                    }
                    local.__saveErrors__.push({
                        error: remote.error,
                        reason: remote.reason
                    });
                }
                else {
                    persister.updateLocalVersion(local, remote);
                    if (local.__saveErrors__) {
                        delete local.__saveErrors__;
                    }
                    context.acceptChanges(localChangeIndex);
                }
            });
        }
        
    }
});


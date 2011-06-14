/**
 * @requires tent.connectors
 * @requires tent.connectors.http
 * @name tent.connectors.rest
 * @namespace HTTP RESTful Connector
 */
tent.declare('tent.connectors.rest', function(){

    /**
     * Creates a new REST connector
     * @class a REST connector
     * @constructor
     */			
	tent.connectors.rest.RestConnector = function RestConnector(){
		
        /**
         * Name of the connector persistence provider, eg: db, service or storage method name
         * @field
         * @type String
         */
        this.provider = 'Custom REST';
		
        /**
         * Absolute base URI of the restful service
         * @field
         * @type String
         */
        this.baseUrl = null; // eg. 'http://127.0.0.1:5984/mydb'
        
        /**
         * Indicates if saving changes
         * @field
         * @type Boolean
         */
        this.saving = false;

        /**
         * Indicates if loading items
         * @field
         * @type Boolean
         */
        this.loading = false;
		
        /**
         * Options
         * @field Object
         */
		this.options = {
			
			entityLinkUrl: '_links',

			/**
	         * Loading options
	         * @field
			 */
			load: {
				http:{
				}
			},
			/**
	         * Saving changes options
	         * @field
			 */
			saveChanges:{
				bulk: true,
				bulkUrl: '_bulk',
				useCollectionInUrl: true,
				revisionProperty: '_rev',
				http: {
					type: 'POST'
				}
			}
			
		};
		
		/**
         * Authentication
         * @field
         */
        this.auth = {
			/**
			 * Username
			 * @field
			 * @type String
			 */
			username: '',
			/**
			 * Password
			 * @field
			 * @type String
			 */
			password: ''
		}
		
		/**
		 * Filters to apply when loading/saving items
		 */
		this.filters = {
			load: [],
			saveChanges: [],
			saveResult: []
		}
				
		/**
		 * Processor to use when receiving data (loading or receiving save results)
		 */
		this.processors = {
			load: [],
			saveResult: []
		}		
		
		// add default processors
		this.processors.load.push(
			tent.connectors.rest.processors.load.defaultLoader
		);
		this.processors.saveResult.push(
			tent.connectors.rest.processors.saveResult.saveResultReceiveByPosition
		);
		
		// add default filters
		this.filters.saveChanges.push(
			tent.connectors.rest.filters.saveChanges.packChanges,
			tent.connectors.rest.filters.saveChanges.setUrlAndMethod
		);
		
	}
			
	/**
	 * Creates the database for this connector
	 */		
	tent.connectors.rest.RestConnector.prototype.createdb = function(callback){
		tent.connectors.http.request({
			url: this.baseUrl,
			type: 'PUT'
		},callback);
	}

	/**
	 * Creates the database for this connector
	 */		
	tent.connectors.rest.RestConnector.prototype.deletedb = function(callback){
		tent.connectors.http.request({
			url: this.baseUrl,
			type: 'DELETE'
		},callback);
	}
	
	/**
     * 	@private
     */
    tent.connectors.rest.RestConnector.prototype.filterData = function(data){
		if (typeof data.action == 'string' && this.filters[data.action] && this.filters[data.action].length>0){
			var filters = this.filters[data.action];
			for (var i=0, l= filters.length; i<l; i++ ){
				data = filters[i](data);
			}
		}
		return data;
	}
	
	/**
     * 	@private
     */
    tent.connectors.rest.RestConnector.prototype.process = function(data){
		if (typeof data.action == 'string' && this.processors[data.action] && this.processors[data.action].length>0){
			var processors = this.processors[data.action];
			for (var i=0, l= processors.length; i<l; i++ ){
				processors[i](data);
			}
		}
		return data;
	}
	
    /**
     * 	Load entities from an URL into a {@link tent.entities.Context}
     *  @param {tent.entities.Context} context
     *  @param {String} url url that returns a JSON representation of entities
     *  @param {Object} [options] loading options
     *  @param {function()} [callback] function to call when operation is complete (error or success)
     */
    tent.connectors.rest.RestConnector.prototype.load = function(context, url, options, callback){
		
		var result = { action: 'load'}, connector= this;
		try {
			
			if (typeof options == 'function'){
				callback = options;
				options = null;
			}
			
			result.options = tent.combineOptions(this.options, this.options.load, options);
			
			result.options.url = url || result.options.url;
			
			if (!result.options.baseUrl){
				result.options.baseUrl = this.baseUrl;
			}
						
            if (!context) {
                throw 'a context is required for loading entities';
            }
            if (!result.options.url) {
                throw 'an url must be specified to load';
            }
			if (this.saving) {
                throw 'cannot load while saving';
            }
            if (this.loading) {
                throw 'already loading entities';
            }
			
	        this.loading = true;

			result.options.context = context;
							
			tent.connectors.http.request(tent.combineOptions(result.options, result.options.http), function (r){
				result.req = r.req;
				if (r.error){
					result.error = r.error;
					connector.loading = false;
					if (callback){
						callback(result);
					}
				}else{				
					result.data = r.data;
					result = connector.filterData(result);
					connector.process(result);
					if (!result.error){
						result.ok = true;
					}
					connector.loading = false;
					if (callback){
						callback(result);
					}
				}
			});
			
		} catch (err){
			this.loading = false;
			result.error = err;
			if (callback){
				callback(result);
			}
		}
	}

	/**
     * Persists all changes in a {@link tent.entities.Context}
	 * @param {tent.entities.Context} context
	 * @param {Object} [options] saving options
     * @param {function()} [callback] function to call when operation is complete (error or success)
	 */
    tent.connectors.rest.RestConnector.prototype.saveChanges = function(context, options, callback){
				
		var result = { action: 'saveChanges'}, connector= this;
		try {
			
			if (typeof options == 'function'){
				callback = options;
				options = null;
			}
			
			result.options = tent.combineOptions(this.options, this.options.saveChanges, options);
			
			if (!result.options.baseUrl) {
				result.options.baseUrl = this.baseUrl;
			}
			
            if (!context) {
                throw 'a context is required for saving changes';
            }
			if (this.saving) {
                throw 'already saving changes';
            }
            if (this.loading) {
                throw 'cannot save while loading';
            }
			
			if (!(context instanceof tent.entities.Context)){
				throw 'a tent.entities.Context is required';
			}
			
	        this.saving = true;

			result.options.context = context;

			result = connector.filterData(result);
			
			if (!result.data) {
				// nothing to save
				result.noop = true;
				if (!result.error) {
					result.ok = true;
				}
				if (callback) {
					callback(result);
				}
			}
			else {
				result.options.data = result.data;
				if (result.options.data === '-'){
					// no http body
					delete result.options.data;
				}
				tent.connectors.http.request(tent.combineOptions(result.options, result.options.http), function(r){
					result.req = r.req;
					if (r.error) {
						result.error = r.error;
						connector.saving = false;
						if (callback) {
							callback(result);
						}
					}
					else {
						result.qdata = result.data;
						result.data = r.data;
						result.action = 'saveResult';
						result = connector.filterData(result);
						connector.process(result);
						if (!result.error) {
							result.ok = true;
						}
						connector.saving = false;
						if (callback) {
							callback(result);
						}
					}
				});
			}
			
		} catch (err){
			this.saving = false;
			result.error = err;
			if (callback){
				callback(result);
			}
		}
	};
	
	/**
	 * @namespace processors and filters to include in rest connectors
	 */
	tent.connectors.rest.processors = {
		/**
		 * processors for loading data
		 */
		load: {
			/**
			 * attachs/updates items on local context. On conflicts no change is made (resolve on save).
			 * @param {Object} d operation data
			 */
			defaultLoader: function(d){
				if (d.action != 'load' && d.action != 'saveResult') {
					return;
				}
				var local, remote, handled, collname, collection;
				for (var i = 0, l = d.data.items.length; i < l; i++) {
					remote = d.data.items[i];
					handled = false;
					// try to select a target collection
					if (d.options.collection) {
						collname = d.options.collection;
					}
					else 
						if (d.options.discriminatorProperty) {
							collname = doc[d.options.discriminatorProperty];
						}
						else {
							collname = null;
						}
						
					collection = collname ? d.options.context.getCollection(collname) : null;
					
					// find local version
					local = (collection || d.options.context).find(remote);
					
					if (remote._deleted) {
						// item deleted on server
						if (local) {
							if (local.__changeState__ === tent.entities.ChangeStates.MODIFIED) {
							// conflict: modified local, deleted on server
							
							// keep local version (handle conflict on save)
							}
							else {
								// remove and detach local version
								(collection || d.options.context).remove(local);
								(collection || d.options.context).detach(local);
								handled = true;
							}
						}
						else {
							handled = true;
						}
					}
					else {
						// item exists on server
						if (local) {
							if (local.__changeState__ === tent.entities.ChangeStates.MODIFIED ||
							local.__changeState__ === tent.entities.ChangeStates.DELETED) {
							// item already found locally, check version
							
							// if different versions, conflict
							
							// keep local version (handle conflict on save)
							}
							else {
								// update local version
								tent.pset(local, remote, true);
								
								// track changes in complex properties
								if (d.options.context.changeHandler) {
									d.options.context.changeHandler.trackComplexProperties(local);
								}
								handled = true;
							}
						}
						else {
							// attach as local
							(collection || d.options.context).attach(remote);
							handled = true;
						}
					}
					
					if (handled) {
						// item handled, remove from list
						d.data.items.splice(i, 1);
						i--;
						l--;
					}
				}
			}			
			
		},
		
		/**
		 * processors of save results
		 * @param {Object} d
		 */
		saveResult: {
			/**
			 * process the results of sent changes match by position (server respects order and position)
			 * @param {Object} d
			 */
			saveResultReceiveByPosition: function(d){
				if (d.action != 'saveResult') {
					return;
				}
				if (!d.packedChanges || !d.packedChanges.length > 0){
					return;
				}
				
				var local, remote;
				for (var i = 0, l = d.packedChanges.length; i < l; i++) {
					
					local = d.packedChanges[i];					
					remote = d.data.items[i];
					
					if (!remote){
						// no remote response for this packed change
						local.__syncState__.saving = false;
						local.__syncState__.error = 'noresponse';
						local.__syncState__.reason = 'no response from server';
					} else {
						if (local.__changeState__ === tent.entities.ChangeStates.DELETED) {
							if (remote.deleted || remote._deleted){
								d.options.context.acceptChanges(local);
							} else {
								local.__syncState__.saving = false;
								local.__syncState__.error = remote.error || 'no delete response';
								// copy typical properties from response item
								local.__syncState__.message = remote.message;
								local.__syncState__.reason = remote.reason;
							}
						} else {
							if (!remote.error){
								d.options.context.acceptChanges(local);
								if (local.__changeState__ === tent.entities.ChangeStates.UNCHANGED) {
									// update local version (usually just .id or .rev, but other properties are accepted too)
									tent.pset(local, remote, true);
									
									// track changes in complex properties
									if (d.options.context.changeHandler) {
										d.options.context.changeHandler.trackComplexProperties(local);
									}
								}
								
							} else {
								local.__syncState__.saving = false;
								local.__syncState__.error = remote.error;
								// copy typical properties from response item
								local.__syncState__.message = remote.message;
								local.__syncState__.reason = remote.reason;
							}
						}
					}
					
				}
				
				// packed changed responses are handled
				d.data.items.splice(0,d.packedChanges.length);				
			}
		}
	};
		
		
	/**
	 * @namespace processors and filters to include in rest connectors
	 */
	tent.connectors.rest.filters = {
		/**
		 * Filters that prepare data to save
		 */
		saveChanges:{
			/**
			 * Packs (select and serialize) pending changes to be sent
			 * @param {Object} d
			 */
			packChanges:function(d){
				if (d.action != 'saveChanges'){
					return d;
				}
				if (d.options.context.hasChanges()){
					var changeIndex = -1;
					
					var serializeChange = function(local){
		                var rmt;
		                if (local instanceof tent.entities.EntityLink) {
		                    // EntityLinks not supported yet
		                    rmt = {
								_link: true, 
								from: tent.entities.getId(local.from),
								to: tent.entities.getId(local.to),
								property: local.propertyName
							};
							if (local.__changeState__ === tent.entities.ChangeStates.DELETED) {
								rmt._deleted = true;
							}
		                }
						var idProperty = tent.entities.getIdPropertyName(local);
						if (local.__changeState__ === tent.entities.ChangeStates.DELETED) {
							rmt = {_deleted: true};
						}
						else {
							rmt = tent.clone(local, {
								deep: true,
								onlyOwnProperties: true,
								attachedObjectsIds: true,
								attachedObjects: false,
								skipPrivates: true
							});
						}
						if (idProperty && local[idProperty]) {
							rmt[idProperty] = tent.pget(local, idProperty);
						}
						if (d.options.revisionProperty) {
							rmt[d.options.revisionProperty] = tent.pget(local, d.options.revisionProperty);
						}
												
						if (d.options.discriminatorProperty && local.__collection__){
							rmt[d.options.discriminatorProperty] = local.__collection__.name;
						}
						return rmt;
					}					
					
					var takeNextChange = function(){
						if (d.options.maxCount && d.data && d.data.items && d.data.items.length >= d.options.maxCount){
							// max package count reached
							return false;
						}
						if (d.options.bulk === false && d.data && d.data.items && d.data.items.length > 0){
							// no bulk update allowed, just take 1 change
							return false;
						}
						
						changeIndex++;
						if (changeIndex >= d.options.context.changes.items.length){
							// no more changes to pack
							return false;
						}
						
						// initialize items array
						if (!d.data){
							d.data = {};
						}
						if (!d.data.items){
							d.data.items = [];
						}
						
						// pack next change and mark it as "saving"
						var change = d.options.context.changes.items[changeIndex];
						
						var schange = serializeChange(change); 
						if (schange){
							d.data.items.push(schange);
							d.options.context.markAsSaving(change);
							
							// register packed changes for matching when processing results
							if (!d.packedChanges){
								d.packedChanges = [];
							}
							d.packedChanges.push(change);
						}
						return true;
					}

					while (takeNextChange()){};					
				}
				return d;
			},
			
			/**
			 * Based on data be sent, sets the url and HTTP method
			 * @param {Object} d
			 */
			setUrlAndMethod: function(d){
				if (d.action != 'saveChanges'){
					return d;
				}
				if (!d.packedChanges || !d.packedChanges.length>0){
					return d;
				}
								
				if (d.options.bulk || d.packedChanges.length > 1){
					// bulk save
					if (!(d.options.http.url || d.options.url)){
						d.options.http.url = d.options.bulkUrl;
					}
				} else if (d.packedChanges.length == 1) {
					if (!(d.options.http.url || d.options.url)){
						var item = d.packedChanges[0];
						var uri = '/';
						
						if (item instanceof tent.entities.EntityLink) {
							if (d.options.entityLinkUrl){
								uri = tent.connectors.http.uriCombine(uri, d.options.entityLinkUrl);
							}
						}
						else {
							if (d.options.useCollectionInUrl && item.__collection__) {
								uri = tent.connectors.http.uriCombine(uri, item.__collection__.name);
							}
						}

						var itemId = tent.entities.getId(item);
						if (typeof itemId != 'undefined'){
							uri = tent.connectors.http.uriCombine(uri, itemId);
							if (item.__changeState__ === tent.entities.ChangeStates.DELETED){
								d.options.http.type = 'DELETE';
							} else {
								d.options.http.type = 'PUT';
							}
						} else {
							d.options.http.type = 'POST';
						}
						
						d.options.http.url = uri;
					}
					
					// if single change, set data as the single item
					d.data = d.data.items[0];
					if (d.options.http.type === 'DELETE'){
						d.data = '-'; // no http body
					}
				}
				
				return d;
			}

		}			
	};


});


/**
 * @requires tent.persisters.rest
 * @name tent.persisters.couchdb
 * @namespace Apache CouchDB RESTful Persister
 */
tent.declare('tent.persisters.couchdb', function(){

    /**
     * Creates a new CouchDB RESTful persister
     * @class a CouchDB RESTful persister
     * @extends tent.persisters.rest.RestPersister
     * @constructor
     */
    tent.persisters.couchdb.CouchDBPersister = function CouchDBPersister(){
    
        tent.persisters.rest.RestPersister.apply(this, arguments);
        /**
         * URI for bulk save operations (or null to use individual save requests)
         * @field
         * @type String
         */
        this.bulkSaveUri = '_bulk_docs';
        
        this.loadItemMapper = tent.persisters.rest.createItemMapper({
            multiSelectorProperty: 'rows',
            multiItemSelectorProperty: 'doc'
        });
    }
    
    tent.mixin(tent.persisters.couchdb.CouchDBPersister, tent.persisters.rest.RestPersister);
    
});



module('couchdb', {

    setup: function(){
    
        var d = this.d = {};
        
        d.asyncWait = 5000;
        d.cn = new tent.connectors.couchdb.CouchDBConnector();
        d.cn.baseUrl = 'http://localhost:5984/tent_testdb';
        
        d.checkError = function(err, msg){
            if (err) {
                if (!typeof msg == 'string') {
                    msg = 'callback return with error';
                }
                equals(err, null, msg);
                start();
                throw err;
            }
        };
        
        d.stepConfig = function(step){
            step.options({
                log: true,
                onError: function(err){
                    console.log('Step: error on step #' + this.count() + ': ' + err);
                    console.trace(err);
                    equals(err, null, 'error on step #' + this.count());
                    start();
                }
            });
        };
        
        d.createDb = function(success){
            d.cn.createdb(function(r){
                if (r.error) {
                    if (r.req.status === 412 && !d.dbrecreating) {
                        console.log('db at "' + d.cn.baseUrl + '" already exists');
                        d.dbrecreating = true;
                        d.deleteDb(function(){
                            d.createDb(success);
                        });
                        return;
                    }
                    else {
                        equals(r, false, 'error creating db: ' + r.error);
                        start();
                        return;
                    }
                }
                d.dbcreated = true;
                d.dbdeleted = false;
                console.log('created couch db at "' + d.cn.baseUrl + '"');
                if (success) {
                    success(r);
                }
            });
        };
        
        d.deleteDb = function(success){
            d.dbdeleting = true;
            d.cn.deletedb(function(r){
                d.dbdeleting = false;
                if (r.error) {
                    equals(r, false, 'error deleting db: ' + r.error);
                    start();
                    return;
                }
                d.dbdeleted = true;
                console.log('deleted couch db at "' + d.cn.baseUrl + '"');
                if (success) {
                    success(r);
                }
            });
        };
        
        d.addSampleData = function(success){
        
            var data = [{
                _id: 1,
                title: 'Bares y Fondas',
                year: 1986
            }, {
                _id: 2,
                title: 'Yo te avisé',
                year: 1987
            }, {
                _id: 3,
                title: 'El Ritmo Mundial',
                year: 1987
            }, {
                _id: 14,
                title: 'Hola',
                year: 2001
            }, {
                _id: 15,
                title: 'Chau',
                year: 2001
            }];
            for (var i = 0; i < data.length; i++) {
                if (data[i]._id) {
                    data[i]._id = data[i]._id + '';
                }
            }
            d.ctx = d.ctx || new tent.entities.Context(true);
            d.ctx.push.apply(d.ctx, data);
            
            d.cn.saveChanges(d.ctx, function(r){
                d.checkError(r.error);
                console.log('sample data saved');
                if (success) {
                    success(r);
                }
            });
            
        };
        
        d.createDbWithSampleData = function(success){
            d.createDb(function(){
                d.addSampleData(success);
            });
        };
        
        d.getContextIds = function(ctx){
            var ids = [];
            for (var i = 0, l = ctx.items().length; i < l; i++) {
                ids.push(ctx.items()[i]._id);
            }
            return ids.sort();
        }
        
    },
    
    teardown: function(){
        var d = this.d;
        if (d.dbcreated && !d.dbdeleted) {
            if (d.dbdeleting) {
                console.error('teardown called while deleting db!');
                ok(false, 'teardown called while deleting')
            }
            else {
                console.log('teardown: deleting db');
                stop(d.asyncWait);
                d.deleteDb(function(){
                    start();
                });
            }
        }
    }
    
});


test("create and delete db", 2, function(){
    var d = this.d;
    stop(d.asyncWait);
    d.createDb(function(){
        ok(true, 'db created');
        d.deleteDb(function(){
            ok(true, 'db deleted');
            start();
        });
    });
});

test("create doc", 6, function(){
    var d = this.d;
    stop(d.asyncWait);
    
    Step(function(){
        d.stepConfig(this);
        d.cn.options.saveChanges.bulk = false;
        d.createDb(this);
    }, function(){
    
        d.ctx = new tent.entities.Context(true);
        d.ctx.push(d.doc = {
            firstname: 'john',
            age: 32
        });
        
        equals(d.doc.__changeState__, tent.entities.ChangeStates.ADDED, 'doc is added');
        
        d.cn.saveChanges(d.ctx, this);
    }, function(r){
        d.checkError(r.error);
        
        equals(d.doc.__changeState__, tent.entities.ChangeStates.UNCHANGED, 'doc accepted');
        
        d.cn2 = new tent.connectors.couchdb.CouchDBConnector();
        d.cn2.baseUrl = d.cn.baseUrl;
        d.ctx2 = new tent.entities.Context(true);
        
        d.cn2.load(d.ctx2, d.doc._id + '', this);
    }, function(r){
        d.checkError(r.error);
        equals(d.ctx2.items()[0].year, d.doc.year, 'doc created');
        ok(d.ctx2.items()[0] !== d.doc, 'not same object');
        equals(d.doc.firstname, d.ctx2.items()[0].firstname, 'name preserved');
        equals(d.doc._id, d.ctx2.items()[0]._id, 'id preserved');
        start();
    });
});

test("update doc", 4, function(){
    var d = this.d;
    stop(d.asyncWait);
    
    Step(function(){
        d.stepConfig(this);
        d.createDbWithSampleData(this);
    }, function(){
    
        (d.doc = d.ctx.items()[0]).year = 2021;
        d.cn.options.saveChanges.bulk = false;
        equals(d.doc.__changeState__, tent.entities.ChangeStates.MODIFIED, 'doc is modified');
        
        d.cn.saveChanges(d.ctx, this);
    }, function(r){
        d.checkError(r.error);
        
        equals(d.doc.__changeState__, tent.entities.ChangeStates.UNCHANGED, 'doc changes accepted');
        
        d.cn2 = new tent.connectors.couchdb.CouchDBConnector();
        d.cn2.baseUrl = d.cn.baseUrl;
        d.ctx2 = new tent.entities.Context(true);
        
        d.cn2.load(d.ctx2, d.doc._id + '', this);
    }, function(r){
        d.checkError(r.error);
        equals(d.ctx2.items()[0].year, d.doc.year, 'doc updated');
        ok(d.ctx2.items()[0] !== d.doc, 'not same object');
        start();
    });
});

test("delete doc", 4, function(){
    var d = this.d;
    stop(d.asyncWait);
    
    Step(function(){
        d.stepConfig(this);
        d.createDbWithSampleData(this);
    }, function(){
        d.ctx.remove(d.doc = d.ctx.items()[1]);
        d.cn.options.saveChanges.bulk = false;
        d.cn.saveChanges(d.ctx, this);
    }, function(r){
        d.checkError(r.error);
        
        ok(!d.ctx.contains(d.doc), 'doc is removed from context');
        equals(d.doc.__changeState__, tent.entities.ChangeStates.DETACHED, 'doc is detached');
        
        d.cn2 = new tent.connectors.couchdb.CouchDBConnector();
        d.cn2.baseUrl = d.cn.baseUrl;
        d.ctx2 = new tent.entities.Context(true);
        
        d.cn2.load(d.ctx2, d.doc._id + '', this);
    }, function(r){
        // should return a 404 error
        ok(r.error, 'element deleted cannot be loaded');
        equals(r.req && r.req.status, 404, '404 - doc deleted, not found');
        start();
    });
    
});

test("batch CUD", 12, function(){
    var d = this.d;
    stop(d.asyncWait);
    
    Step(function(){
        d.stepConfig(this);
        d.createDbWithSampleData(this);
    }, function(){
    
        d.ctx.remove(d.docD = d.ctx.items()[0]);
        (d.docU = d.ctx.items()[0]).year = 2041;
        (d.docU2 = d.ctx.items()[1]).title = 'Nro. 2 en tu lista';
        d.ctx.push(d.docC = {
            _id: "reyazucar",
            title: 'Rey Azúcar'
        });
        d.ctx.push(d.docC2 = {
            title: 'Fabulosos Calavera',
            year: 1997
        });
        
        d.cn.options.saveChanges.bulk = true;
        d.cn.saveChanges(d.ctx, this);
    }, function(r){
        d.checkError(r.error);
        
        ok(!d.ctx.contains(d.docD), 'docD is removed from context');
        equals(d.docD.__changeState__, tent.entities.ChangeStates.DETACHED, 'doc is detached');
        equals(d.docU.__changeState__, tent.entities.ChangeStates.UNCHANGED, 'docU change accepted');
        equals(d.docU2.__changeState__, tent.entities.ChangeStates.UNCHANGED, 'docU2 change accepted');
        equals(d.docC.__changeState__, tent.entities.ChangeStates.UNCHANGED, 'docC accepted');
        equals(d.docC2.__changeState__, tent.entities.ChangeStates.UNCHANGED, 'docC2 accepted');
        
        d.cn2 = new tent.connectors.couchdb.CouchDBConnector();
        d.cn2.baseUrl = d.cn.baseUrl;
        d.ctx2 = new tent.entities.Context(true);
        
        d.cn2.load(d.ctx2, '_all_docs?include_docs=true', this);
    }, function(r){
        d.checkError(r.error);
        
        ok(!d.ctx2.find(d.docD._id), 'docD deleted');
        equals(d.ctx2.find(d.docU._id).year, d.docU.year, 'docU updated');
        equals(d.ctx2.find(d.docU2._id).title, d.docU2.title, 'docU2 updated');
        equals(d.ctx2.find(d.docC._id)._id, d.docC._id, 'docC created');
        equals(d.ctx2.find(d.docC2._id).title, d.docC2.title, 'docC2 created');
        
        deepEqual(d.getContextIds(d.ctx2), d.getContextIds(d.ctx), 'both context with same content');
        
        start();
    });
    
});

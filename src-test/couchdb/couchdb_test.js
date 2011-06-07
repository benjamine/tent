
var baseAddress = 'http://localhost:5984'

AsyncTestCase("CouchDBTest", {

    testCreateDeleteDB: function(queue){
    
        var cn = new tent.connectors.couchdb.CouchDBConnector();
        cn.options.baseUrl = baseAddress + '/tent_testdb';
        
        queue.add('Step 1: create db', function(callbacks){
            var callback = callbacks.add(function(result){
                assertTrue(result.data.ok);
            });
            cn.createdb(callback);
        });

        queue.add('Step 2: delete db', function(callbacks){
            var callback = callbacks.add(function(result){
                assertTrue(result.data.ok);
            });
            cn.deletedb(callback);
        });
    }
    
});

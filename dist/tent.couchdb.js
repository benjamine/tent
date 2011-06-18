tent.declare("tent.connectors.couchdb", function() {
  tent.connectors.couchdb.CouchDBConnector = function CouchDBConnector() {
    var ctr = new tent.connectors.rest.RestConnector;
    ctr.couchdb = true;
    ctr.provider = "CouchDB";
    ctr.options.saveChanges.bulk = true;
    ctr.options.saveChanges.bulkUrl = "_bulk_docs";
    ctr.options.saveChanges.useCollectionInUrl = false;
    ctr.options.saveChanges.revisionProperty = "_rev";
    ctr.filters.load.unshift(function(d) {
      if(typeof d.data.rows == "object" && d.data.rows instanceof Array && typeof d.data.total_rows == "number") {
        d.data.items = [];
        for(var i = 0, l = d.data.rows.length;i < l;i++) {
          d.data.items.push(d.data.rows[i].doc)
        }
        delete d.data.rows
      }else {
        d.data = {total_rows:1, items:[d.data]}
      }
      return d
    });
    ctr.filters.saveChanges.push(function(d) {
      if(d.data && d.data.items instanceof Array) {
        for(var i = 0, l = d.data.items.length;i < l;i++) {
          var doc = d.data.items[i];
          if(d.packedChanges && d.packedChanges[i] && d.packedChanges[i].__changeState__ === tent.entities.ChangeStates.DELETED) {
            doc._deleted = true
          }
        }
        d.data.docs = d.data.items;
        delete d.data.items
      }else {
        if(d.packedChanges && d.packedChanges.length === 1) {
          if(d.options.http.type === "DELETE") {
            if(!d.options.http.headers) {
              d.options.http.headers = {}
            }
            d.packedChanges[0]._deleted = true;
            d.options.http.headers["If-Match"] = d.packedChanges[0][d.options.saveChanges.revisionProperty];
            d.options.http.url += "?rev=" + d.packedChanges[0][d.options.saveChanges.revisionProperty]
          }
        }
      }
      return d
    });
    ctr.filters.saveResult.unshift(function(d) {
      for(var i = 0, l = d.data.items.length;i < l;i++) {
        var doc = d.data.items[i];
        delete doc.ok;
        doc._id = doc.id;
        delete doc.id;
        doc._rev = doc.rev;
        delete doc.rev;
        if(!doc.error && d.packedChanges && d.packedChanges[i] && d.packedChanges[i].__changeState__ === tent.entities.ChangeStates.DELETED) {
          doc._deleted = true
        }
      }
      return d
    });
    ctr.filters.saveResult.unshift(function(d) {
      if(typeof d.data == "object" && d.data instanceof Array) {
        d.data = {items:d.data}
      }else {
        d.data = {items:[d.data]}
      }
      return d
    });
    return ctr
  }
});

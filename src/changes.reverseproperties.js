
tent.declare('tent.changes.reverseProperties', function(exports){

    exports.setReverseProperty = function(obj, name, prop){

        if (!prop) {
            prop = {};
        }
        if (!prop.cardinality) {
            prop.cardinality = '11';
        }
        else {
            prop.cardinality = prop.cardinality.toLowerCase();
        }
        if (!prop.reverse) {
            prop.reverse = name + 'Of';
        }

        var reverseProp = {
            name: prop.reverse,
            cardinality: prop.cardinality
        };
        if (prop.cardinality.substr(0, 1) === 'n' || prop.cardinality.substr(0, 1) === 'm') {
            reverseProp.isArray = true;
        }
        if (!obj.__reverseProperties__) {
            obj.__reverseProperties__ = {};
        }

        if (prop.cardinality.substr(1, 1) === 'n' || prop.cardinality.substr(1, 1) === 'm') {

            if (typeof obj[name] == 'undefined' || !(obj[name] instanceof Array)) {

                obj[name] = [];

            }

            obj.__reverseProperties__[name] = reverseProp;
            obj[name].__parent__ = obj;
            obj[name].__reverseProperty__ = reverseProp;

        }
        else {

            if (typeof obj[name] == 'undefined') {
                obj[name] = null;
            }
            obj.__reverseProperties__[name] = reverseProp;
        }
    }
    
    exports.setReverseProperties = function(obj, properties){
        if (properties) {
            for (var name in properties) {
                if (properties[name].reverse) {

                    exports.setReverseProperty(obj, name, properties[name]);

                }
            }
        }
    }
    
    exports.Set = function Set(properties){
        this.properties = properties;
    }
    
    exports.Set.prototype.create = function(){
        var obj = {};
        exports.setReverseProperties(obj, this.properties);
        return obj;
    }
    
    exports.Set.prototype.applyTo = function(){
        var result = [];
        
        // fluent bind method (eg: MySet.applyTo(elem1,elem2).bind({log:true});)
        result.bind = function(options){
        
            if (!options) {
                options = {};
            }
            
            options.reverseProperties = true;
            
            for (var i = 0; i < this.length; i++) {
                var obj = this[i];
                if (obj.__reverseProperties__) {
                
                    // bind object to reverse property handler
                    tent.changes.bind(obj, options);
                    
                    // bind also Array reverse properties (eg: father.children, user.friends)
                    var revProps = obj.__reverseProperties__;
                    for (var propName in revProps) {
                        if (revProps.hasOwnProperty(propName)) {
                            if (revProps[propName].cardinality &&
                            (revProps[propName].cardinality[1] == 'n' ||
                            revProps[propName].cardinality[1] == 'm')) {
                                if (!(obj[propName] instanceof Array)) {
                                    // something changed the Array set on applyTo, reset
                                    obj[propName] = [];
                                    obj[propName].__parent__ = obj;
                                    obj[propName].__reverseProperty__ = obj.__reverseProperties__[propName];
                                }
                                tent.changes.bind(obj[propName], options);
                            }
                        }
                    }
                }
            }
        }
        
        if (this.properties) {

            for (var i = 0; i < arguments.length; i++) {
                exports.setReverseProperties(arguments[i], this.properties);
            }
            result.push.apply(result, arguments);

        }
        
        return result;
    }
    
    exports.Set.prototype.applyToAndBind = function(){
        if (this.properties && this.properties.length > 0) {
            for (var i = 0; i < arguments.length; i++) {
                exports.setReverseProperties(arguments[i], this.properties);
                tent.changes.bind(arguments[i], {
                    deep: true,
                    reverseProperties: true
                });
            }
        }
    }
    
    var reversePropertyHandler;
    
    exports.getHandler = function(){
        if (!reversePropertyHandler) {
            reversePropertyHandler = function(change){
            
                // TODO: handle MANYCHANGES eventType
                
                if (change.eventType == tent.changes.EventTypes.ADDED) {
                    var items = change.data.items;
                    if (items && change.subject && change.subject.__reverseProperty__) {
                        var reverseProp = change.subject.__reverseProperty__;
                        var parent = change.subject.__parent__;
                        for (var i = 0, l = items.length; i < l; i++) {
                            var item = items[i];
                            if (reverseProp.isArray) {
                                if (!item[reverseProp.name]) {
                                    item[reverseProp.name] = [];
                                }
                                if (item[reverseProp.name].indexOf(parent) < 0) {
                                    item[reverseProp.name].push(parent);
                                }
                            }
                            else {
                                if (item[reverseProp.name] != parent) {
                                    if (typeof item[reverseProp.name] != 'undefined' && item[reverseProp.name] != null) {
                                        throw new Error('this.' + reverseProp.name + ' is set. Remove this from its current array before adding it to this array');
                                    }
                                    item[reverseProp.name] = parent;
                                }
                            }
                        }
                    }
                }
                else 
                    if (change.eventType == tent.changes.EventTypes.REMOVED) {
                        var items = change.data.items;
                        if (items && change.subject && change.subject.__reverseProperty__) {
                            var reverseProp = change.subject.__reverseProperty__;
                            var parent = change.subject.__parent__;
                            for (var i = 0, l = items.length; i < l; i++) {
                                var item = items[i];
                                if (reverseProp.isArray) {
                                    var reverseArray = item[reverseProp.name];
                                    if (reverseArray) {
                                        for (var ii = 0, ll = reverseArray.length; ii < ll; ii++) {
                                            if (reverseArray[ii] === parent) {
                                                reverseArray.splice(ii, 1);
                                                ii--;
                                                ll--;
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (item[reverseProp.name] === parent) {
                                        item[reverseProp.name] = null;
                                    }
                                }
                            }
                        }
                    }
                    else 
                        if (change.eventType == tent.changes.EventTypes.CHANGED) {
                            var items = change.data.items;

                            if (change.data.propertyName && change.subject && change.subject.__reverseProperties__) {
                                var reverseProp = change.subject.__reverseProperties__[change.data.propertyName];

                                if (reverseProp) {
                                    var item;

                                    if (reverseProp.isArray) {
                                        if (item = change.data.oldValue) {
                                            var reverseArray = item[reverseProp.name];
                                            if (reverseArray instanceof Array) {
                                                for (var i = 0, l = reverseArray.length; i < l; i++) {
                                                    if (reverseArray[i] === change.subject) {
                                                        reverseArray.splice(i, 1);
                                                        i--;
                                                        l--;
                                                    }
                                                }
                                            }
                                        }
                                        if (item = change.data.current) {
                                            if (!item[reverseProp.name]) {
                                                item[reverseProp.name] = [];
                                            }
                                            if (item[reverseProp.name] instanceof Array) {
                                                if (item[reverseProp.name].indexOf(change.subject) < 0) {
                                                    item[reverseProp.name].push(change.subject);
                                                }
                                            }
                                        }
                                    }
                                    else {

                                        if (item = change.data.oldValue) {
                                            if (item[reverseProp.name] == change.subject) {
                                                item[reverseProp.name] = null;
                                            }
                                        }

                                        if (item = change.data.current) {
                                            if (item[reverseProp.name] != change.subject) {

                                                item[reverseProp.name] = change.subject;
                                            }
                                        }
                                    }
                                }
                            }
                        }
            }
        }
        return reversePropertyHandler;
    }
    
    return exports;
});



tent.declare('tent.arrays', function(exports){

    exports.addFunctions = function(array, override){
        for (var fname in exports.functions) {
            if (override || !(array[fname] instanceof Function)) {
                array[fname] = exports.functions[fname];
            }
        }
        return array;
    };
    
    exports.functions = {
    
        indexOf: function(item){
            for (var i = 0, l = this.length; i < l; i++) {
                if (this[i] === item) {
                    return i;
                }
            }
            return -1;
        },
        
        lastIndexOf: function(item){
            for (var i = this.length - 1; i > 0; i--) {
                if (this[i] === item) {
                    return i;
                }
            }
            return -1;
        },
        
        filter: function(condition){
            var filtered = [];
            for (var i = 0, l = this.length; i < l; i++) {
                if (condition(this[i])) {
                    filtered.push(this[i]);
                }
            }
            return filtered;
        },
        
        // removes all references to argument items from the array, returns true if one or more items are removed
        remove: function(){
            var removed;
            for (var i = 0, l = this.length; i < l; i++) {
                for (var ai = 0, al = arguments.length; ai < al; ai++) {
                    if (this[i] == arguments[ai]) {
                        this.splice(i, 1);
                        removed = true;
                        i--;
                        l--;
                        break;
                    }
                }
            }
            if (removed) {
                return true;
            }
        },
        
        // equivalent to: this[i] = item
        set: function(i, item){
            this.splice(i, 1, item);
        },
        
        // push arguments, filtering already existing items
        pushUnique: function(){
            if (arguments.length == 1) {
                // optimized push for 1 argument only
                var found = false;
                for (var i = 0, l = this.length; i < l; i++) {
                    if (this[i] == arguments[0]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.push(arguments[0]);
                }
            }
            else {
                var exists = [];
                for (var i = 0, l = this.length; i < l; i++) {
                    for (var ai = 0, al = arguments.length; ai < al; ai++) {
                        if (this[i] == arguments[ai]) {
                            exists[ai] = true;
                        }
                    }
                }
                for (var ai = 0, al = arguments.length; ai < al; ai++) {
                    if (!exists[ai]) {
                        this.push(arguments[ai]);
                    }
                }
            }
            return this.length;
        },
        
        clone: function(){
            var cl = [];
            Array.prototype.push.apply(cl, this);
            return cl;
        },
        
        isCloneOf: function(array){
            if (!array) {
                return false;
            }
            if (this.length != array.length) {
                return false;
            }
            if (this === array) {
                return false;
            }
            
            for (var i = this.length; i >= 0; i--) {
                if (this[i] != array[i]) {
                    return false;
                }
            }
            return true;
        }
        
    };
    
    return exports;
});


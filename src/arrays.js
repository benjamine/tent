/**
 * Array utilities
 * @namespace Array utilities
 * @requires tent
 * @name tent.arrays
 * @namespace Array utilities
 */
tent.declare('tent.arrays', function(){

    /**
     * Extends an Array with all the functions defined on {@link tent.arrays.functions}
     * @param {Array} array
     * @param {Boolean} [override] override if function already exists? (false by default, native implementations are faster)
     * @return {Array} the same array extended
     */
    tent.arrays.extend = function(array, override){
        for (var fname in tent.arrays.functions) {
            if (override || !(array[fname] instanceof Function)) {
                array[fname] = tent.arrays.functions[fname];
            }
        }
        return array;
    };
    
    /**
     * Common Array functions
     * @namespace Common Array functions
     */
    tent.arrays.functions = {

		/**
		 * finds an item by a property 
		 * @param {String} propertyName
		 * @param value
		 * @return the first item with the specified value on the specified property, or null if no item is found
		 */
        findByProperty: function(propertyName, value){
            for (var i = 0, l = this.length; i < l; i++) {
                if (this[i][propertyName] === value) {
                    return this[i];
                }
            }
            return null;
        },        
    	
		/**
		 * finds an item by a property 
		 * @param {String} propertyName
		 * @param value
		 * @return {Number} the index of the first item with the specified value on the specified property, or -1 if no item is found
		 */
        indexByProperty: function(propertyName, value){
            for (var i = 0, l = this.length; i < l; i++) {
                if (this[i][propertyName] === value) {
                    return i;
                }
            }
            return -1;
        },  
		
		/**
		 * @param {Object} item an item to search for
		 * @return {Number} the first index where item is found, or -1 if item is not found
		 */
        indexOf: function(item){
            for (var i = 0, l = this.length; i < l; i++) {
                if (this[i] === item) {
                    return i;
                }
            }
            return -1;
        },
        
		/**
		 * @param {Object} item an item to search for
		 * @return {Number} the last index where item is found, or -1 if item is not found
		 */
        lastIndexOf: function(item){
            for (var i = this.length - 1; i > 0; i--) {
                if (this[i] === item) {
                    return i;
                }
            }
            return -1;
        },
        
		/**
		 * Creates a new Array filtering items of this Array
		 * @param {function()} condition a function that returns true for elements to include in results
		 * @return {Array} a new array containing items that satisfied the condition
		 */
        filter: function(condition){
            var filtered = [];
            for (var i = 0, l = this.length; i < l; i++) {
                if (condition(this[i])) {
                    filtered.push(this[i]);
                }
            }
            return filtered;
        },
        
        /**
         * removes all references to argument items from the array, returns true if one or more items are removed
         * @return {Boolean} true if any item is removed
         */
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
			return false;
        },
        
        /**
         * equivalent to: this[i] = item
         * @param {Object} i index to set
         * @param {Object} item value to set at index
         */
        set: function(i, item){
            this.splice(i, 1, item);
        },
        
        /**
         * push arguments, filtering already existing items
         * @return {Number} resulting length of this Array
         */
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
        
		/**
		 * @return {Array} a new array with the same contents
		 */
        clone: function(){
            var cl = [];
            Array.prototype.push.apply(cl, this);
            return cl;
        },
        
        /**
         * @param {Object} array an array to compare with
         * @return {Boolean} true if both arrays contains the same elements
         */
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
                if (this[i] !== array[i]) {
                    return false;
                }
            }
            return true;
        }
        
    };
    
});


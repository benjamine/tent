/**
 * Event emitting
 * @namespace Event emitting
 * @requires tent
 * @requires tent.arrays
 * @name tent.events
 */
tent.declare('tent.events', function(){


    /**
     * Extends all argument objects as event emitters. 
     * Adds all functions in {@link tent.events.extendFunctions}
     * @example
     * 
     * 		var dog = { name: 'Bobby' }, cat = {name: 'Kitty'}, status;
     * 		tent.events.extend(dog);
     * 		dog.bind({bark: function(e, at) {
     * 			status = this.name+ ' barked at '+at.name;
     * 		});
     * 		dog.trigger('bark',cat);
     * 
     * 		equals(status, "Bobby barked at Kitty", "bark event was handled");
     * 
     */
    tent.events.extend = function(){
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
	        if (typeof arg == 'object' && !arg.__events__) {
				// add private event map
	            arg.__events__ = {};
				// add functions
	            for (fname in tent.events._extendFunctions){
					arg[fname]= tent.events.extendFunctions[fname];
				}
	        }
        }
        return arguments[0];
    }
		
    /**
     * Unextends event emitters.
     */
    tent.events.unextend = function(){
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
	        if (typeof arg == 'object' && arg.__events__) {
	            delete arg.__events__;
	            for (fname in tent.events._extendFunctions){
					delete arg[fname];
				}
	        }
        }
    }
    
	/**
	 * Functions added to event emitters (see {@link tent.events.extend})
	 * @name tent.events.extendFunctions
	 * @namespace Functions added to event emitters (see {@link tent.events.extend})
	 */
    tent.events.extendFunctions = {    
    
		/**
		 * Binds functions to an event (or events)
		 * 
		 * @example
		 * 
		 * 		// bind by name
		 * 		obj.bind('click', function(e) {
		 * 			alert(this.id+' clicked at '+e.data.position);
		 * 		};
		 * 
		 * 		// bind with a map
		 * 		obj.bind({
		 * 			activate: function(e) {
		 *				console.log('activated');
		 * 		}, desactivate: function(e) {
		 * 				console.log('deactivated');
		 * 		});
		 * 
		 * 		// bind passing data
		 * 		obj.bind('load', { context: this.title }, function(e) {
		 * 			alert(e.data.context+' clicked at '+e.data.position);
		 * 		};
		 * 
		 * @param {String} eventType
		 * @param {Object} [data] data to include in eventData, if an order field is included it's used to sort handler invocations
		 * @param {Object|function()} handler
		 * @return the context object (this) for chaining
		 */
        bind: function(eventType, data, handler){
        
            if (typeof eventType == 'object') {
                // first param is a hash of events and handlers
                for (var et in eventType) {
                    if (eventType.hasOwnProperty(et)) {
                        this.bind(et, eventType[et]);
                    }
                }
                return this;
            }
            
            if (typeof handler == 'undefined') {
                handler = data;
                data = null;
            }
            
            if (!handler) {
                throw 'a handler function or object is required';
            }
            if ((typeof handler != 'function') && (typeof handler.handle != 'function')) {
                throw 'handler must be function(data) or a handler object (with a "handle(sender,data)" function)';
            }
            
            var eventTypes = eventType.split(' ');
            var order = data ? (data.order || 0) : 0;
            for (var eti = 0; eti < eventTypes.length; eti++) {
                var evType = eventTypes[eti];
                if (evType) {
                    if (!this.__events__[evType]) {
                        this.__events__[evType] = {
                            handlers: []
                        };
                    }
                    var handlers = this.__events__[evType].handlers;
                    // find position to insert handler based on order
                    var position = handlers.length;
                    for (var hi = handlers.length - 1; hi >= 0; hi--) {
                        var h = handlers[hi];
                        if ((h.order || 0) <= order) {
                            position = hi + 1;
                            break;
                        }
                    };
                    
                    handlers.splice(position, 0, {
                        order: order,
                        data: data,
                        handler: handler
                    });
                }
            }
            return this;
        },
        
        /**
         * Triggers an event notifying suscribers, aditional arguments are passed to handlers.
         * Propagation can be stopped calling by handlers using: e.stopImmediatePropagation(); 
         * @param {String} eventType an event type name
		 * @return the context object (this) for chaining
         */
        trigger: function(eventType){
            if (!this.__events__[eventType]) {
                return;
            }
            var handlers = this.__events__[eventType].handlers;

            var e = {
                target: this,
                type: eventType
            };

			/**
			 * @inner
			 */
			var stopProp = function(){
                this.immediatePropagationStopped = true;
            };
			e.stopImmediatePropagation = stopProp;
			
            var hargs = Array.prototype.slice.call(arguments, 1);
            hargs.unshift(e);
            
            for (var hi = 0, hl = handlers.length; hi < hl; hi++) {
                var h = handlers[hi];
                e.data = h.data;
                if (typeof h.handler == 'function') {
                    try {
                        e.result = h.handler.apply(this, hargs);
                    } 
                    catch (err) {
                        console.error(err);
                    }
                }
                else 
                    if (typeof h.handler.handle == 'function') {
                        try {
                            e.result = h.handler.handle.apply(h.handler, hargs);
                        } 
                        catch (err) {
                            console.error(err);
                        }
                    }
                
                if (e.immediatePropagationStopped) {
                    break;
                }
            }
            return this;
        },
        
		/**
		 * Removes an event binding.
		 * If only event type is specified all binding to that type are remove.
		 * If only a handler is specified the handler is removed from all event types
		 * If both are specified the handler is removed from the specific event type
		 * @param {String} [eventType] event type name to unbind
		 * @param {Object|function()} [handler] a handler object or function to unbind
		 * @return the context object (this) for chaining
		 */
        unbind: function(eventType, handler){
        
            if (typeof handler == 'undefined' && typeof eventType == 'function') {
                handler = eventType;
                eventType = null;
            }
            
            if (typeof handler == 'undefined') {
                if (typeof eventType == 'undefined') {
                    this.__events__ = {};
                }
                else {
                    delete this.__events__[eventType];
                }
            }
            else {
                if (eventType) {
                    if (!this.__events__[eventType]) {
                        return;
                    }
                    var handlers = this.__events__[eventType].handlers;
                    
                    for (var hi = handlers.length; hi >= 0; hi--) {
                        var h = handlers[hi];
                        if (h.handler === handler) {
                            handlers.splice(hi, 1);
                        }
                    }
                }
                else {
                    for (var et in this.__events__) {
                        var handlers = this.__events__[et].handlers;
                        
                        for (var hi = handlers.length; hi >= 0; hi--) {
                            var h = handlers[hi];
                            if (h.handler === handler) {
                                handlers.splice(hi, 1);
                            }
                        }
                    }
                }
            }
            return this;
        }
        
    };
    
});



tent.declare('tent.databinding', function(exports){

    var buildTargetUpdater = function(source, sourceProperty, target, targetProperty, options){
    
        var handler = {};
        
        handler.handle = function(change){
        
            var update = false;
            if ((change.eventType == tent.changes.EventTypes.ADDED) ||
            (change.eventType == tent.changes.EventTypes.REMOVED) ||
            (change.eventType == tent.changes.EventTypes.CHANGED)) {
                if (options.deep) {
                    update = true; // change somewhere in the object graph
                }
                else {
                    var sourceObj = source;
                    if (change.subject == source) {
                        update = true; // change in the source object
                    }
                    else {
                        var sourceProps = sourceProperty.split('.');
                        for (var i = 0; i < sourceProps.length; i++) {
                            var p = sourceProps[i];
                            sourceObj = sourceObj[p];
                            if (sourceObj == change.subject) {
                                update = true; // change in a member of the source property expression
                                break;
                            }
                        }
                    }
                }
            }
            else 
                if (change.eventType == tent.changes.EventTypes.MANYCHANGES) {
                    update = true;
                }
            
            if (update) {
            
                var currentValue = source;
                var currentValueParent = null;
                if (sourceProperty) {
                    var sourceProps = sourceProperty.split('.');
                    for (var i = 0; i < sourceProps.length; i++) {
                        var p = sourceProps[i];
                        currentValueParent = currentValue;
                        currentValue = currentValue[p];
                        if (currentValue == null || typeof currentValue == 'undefined') {
                            break;
                        }
                        else {
                            // ensure all objects in the chain are binded
                            tent.changes.bind(currentValue, {
                                live: options.live,
                                log: options.log,
                                deepStack: [currentValueParent],
                                bindings: [{
                                    eventType: tent.changes.EventTypes.CHANGED,
                                    handler: this
                                }]
                            });
                        }
                    }
                }
                
                // handle dot-expression in targetProperty
                var tgt = target;
                var tgtProp = targetProperty;
                if (targetProperty) {
                    var targetProps = targetProperty.split('.');
                    for (var i = 0; i < targetProps.length; i++) {
                        var tgtProp = targetProps[i];
                        tgtParent = tgt;
                        tgt = tgt[tgtProp];
                        if (tgt == null || typeof tgt == 'undefined') {
                            if (i < targetProps.length - 1) {
                                update = false; // target object is not set, cancel update
                            }
                            break;
                        }
                    }
                    tgt = tgtParent;
                }
                if (update) {
                    if (options.template) {
                        exports.parseTemplate(options.template, currentValue, tgt, tgtProp);
                    }
                    else {
                        if (typeof options.format == 'function') {
                            currentValue = options.format(currentValue);
                        }
                        if (tgt[tgtProp] != currentValue) {
                            tgt[tgtProp] = currentValue;
                        }
                    }
                }
            }
        }
        return handler;
    }
    
    exports.bind = function(source, sourceProperty, target, targetProperty, options){
    
        if (!options) {
            options = {};
        }
        
        var updater = buildTargetUpdater(source, sourceProperty, target, targetProperty, options);
        if (options.deep) {
            if (options.bidirectional) {
                throw 'cannot use bidirectional databinding when using a deep tracking';
            }
            tent.changes.bind(source, {
                deep: true,
                live: options.live,
                log: options.log,
                bindings: [{
                    handler: updater
                }]
            });
        }
        else {
            if (options.bidirectional) {
                if (options.template) {
                    throw 'cannot use bidirectional databinding when using a template';
                }
                var reverseUpdater = buildTargetUpdater(target, targetProperty, source, sourceProperty, options);
                tent.changes.bind(target, {
                    live: options.live,
                    log: options.log,
                    bindings: [{
                        eventType: tent.changes.EventTypes.CHANGED,
                        handler: reverseUpdater
                    }]
                });
            }
            tent.changes.bind(source, {
                live: options.live,
                log: options.log,
                bindings: [{
                    eventType: tent.changes.EventTypes.CHANGED,
                    handler: updater
                }]
            });
        }
        
        var currentValue = ((!sourceProperty) ? source : source[sourceProperty]);
        if (!options.template) {
            if (target[targetProperty] != currentValue) {
                target[targetProperty] = currentValue;
            }
        }
        else {
            exports.parseTemplate(options.template, currentValue, target, targetProperty);
        }
        
    }
    
    var _tmplCache = {};
    
    exports.parseTemplate = function(template, data, target, targetProperty){
        var str = template;
        var result;
        try {
            var func = _tmplCache[str];
            if (!func) {
                var strFunc = "var p=[],print=function (){p.push.apply(p,arguments);};" +
                "with(obj){p.push('" +
                str.replace(/[\r\t\n]/g, " ").replace(/'(?=[^#]*#>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<#=(.+?)#>/g, "',$1,'").split("<#").join("');").split("#>").join("p.push('") +
                "');}return p.join('');";
                
                //alert(strFunc);
                func = new Function("obj", strFunc);
                _tmplCache[str] = func;
            }
            result = func(data);
        } 
        catch (e) {
            result = "< # ERROR: " + e.message + " # >";
        }
        if (target) {
            if (targetProperty) {
                target[targetProperty] = result;
            }
            else {
                target.innerHTML = result;
            }
        }
        return result;
    }
    
    return exports;
});

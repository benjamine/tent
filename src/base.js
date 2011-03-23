/**
 * Tent, a tiny entity framework for JavaScript
 * @author Benjamín Eidelman twitter.com/beneidel
 */
/**
 * Tent, a tiny entity framework for JavaScript
 * 
 * @namespace
 */
var tent = tent || {};

/**
 * The global object, parent of root Namespaces, by default is window
 * @constant
 */
tent.global = typeof window == 'undefined' ? this : window;

/**
 * Creates a Namespace
 * @class a Namespace that groups classes, functions, constants and children Namespaces
 * @constructor
 * @param {Namespace} [parent] parent Namespace
 * @param {String} path a namespace path, eg 'web.ajax.json.parsing'
 */
tent.Namespace = function Namespace(parent, path){

    if (!path) {
        if (!parent) {
            throw 'must specify namespace path';
        }
        else {
            path = parent;
            parent = tent.global;
        }
    }
    
    if (path === '..') {
        if (parent === tent.global) {
            throw 'cannot use \'..\' at top level';
        }
        return parent.parent;
    }
    
    var dot1 = path.indexOf('.');
    var dot2 = (dot1 < 0 ? -1 : path.indexOf('.', dot1 + 1));
    
    var fullPath = (parent === tent.global ? '' : parent.fullname + '');
    if (fullPath) {
        fullPath += '.';
    }
    fullPath += path;
    
    if (dot1 < 0) {
        if (typeof parent[path] == 'undefined') {
            this.fullname = fullPath;
            this.name = path;
            this.parent = parent;
            parent[path] = this;
        }
        else 
            if (!parent[path] instanceof tent.Namespace) {
                throw 'error creating namespace: "' + fullPath + '" is not a Namespace object';
            }
            else {
                return parent[path];
            }
    }
    else {
        return new tent.Namespace(new tent.Namespace(parent, path.slice(0, dot1)), path.slice(dot1 + 1));
    }
    return this;
};

// replace tent object with a tent Namespace object
tent.__tentTmp = new tent.Namespace('__tentTmp');
tent.__tentTmp.Namespace = tent.Namespace;
tent.__tentTmp.fullname = 'tent';
tent.__tentTmp.name = 'tent';
tent.__tentTmp.parent = tent.global;
tent.__tentTmp.global = tent.global;
tent.global.tent = tent.__tentTmp;
delete tent.__tentTmp;
try {
    delete tent.global.__tentTmp;
} 
catch (ex) {
    // delete from window not allowed, continue	
}

/**
 * Expands this Namespace
 * @param {function()|Object} expander a function that receives this Namespace as parameter and adds members (eg: classes, constants, functions) or an Object wich properties are copied into this Namespace
 */
tent.Namespace.prototype.expand = function(expander){
    if (expander instanceof Function) {
        expander(this);
    }
    else 
        if (typeof expander == 'object') {
            for (var propName in expander) {
                if (expander.hasOwnProperty(propName)) {
                    if (typeof this[propName] != 'undefined') {
                        throw this.fullname + '.' + propName + ' already exists';
                    }
                    this[propName] = expander[propName];
                }
            }
        }
    return this;
};

/**
 * Declares Namespaces and add members to them  (Namespace paths are unique, ie: the same Namespace object is returned for the same path)
 *
 * <p>Parameters can be any sequence of:
 * 	  <ul>
 *    <li>{@link tent.Namespace}: changes the current Namespace</li>
 *    <li>{string} path: changes current Namespace to a subnamespace of the current Namespace (creating Namespaces if needed)</li>
 *    <li>{function()|Object} expander: a function that adds members to the current Namespace or an Object wich properties are copied to the current Namespace</li>
 *    </ul>
 *	</p>
 * @param {tent.Namespace} [parent] parent Namespace
 * @param {String}  [path] Namespace path, eg: 'web.ajax.json.parsing'
 * @param {function()|Object}  [expander] a function that receives the created Namespace and adds members  (eg: classes, constants, functions) or an Object wich properties are copied to the current Namespace
 * @return {tent.Namespace} the last current Namespace
 */
tent.declare = function(/*[parent], [path], [expander]*/){

    var ns;
    
    for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i];
        if (a instanceof tent.Namespace) {
            ns = a;
        }
        else 
            if (typeof a == 'string') {
                if (!ns) {
                    ns = new tent.Namespace(a);
                }
                else {
                    ns = new tent.Namespace(ns, a);
                }
            }
            else 
                if (a instanceof Function || typeof a == 'object') {
                    if (!ns) {
                        throw 'no namespace provided';
                    }
                    ns.expand(a);
                }
                else {
                    throw 'invalid argument type at index ' + i + ', expected Namespace, string, Function';
                }
    }
    
    return ns;
}

/**
 * Extends a class with another class (mixin)
 * @param {Object} target class to extend
 * @param {Object} mixin mixin class to use as source
 * @return {Object} the extended class
 */
tent.mixin = function(target, mixin){
	for (var name in mixin.prototype){
		if (mixin.prototype.hasOwnProperty(name)){
			target.prototype[name] = mixin.prototype[name];
		}
	}
	return target;
}

/**
 * @param {Object} obj an object to test
 * @return {Boolean} is obj a DOM object?
 */
tent.isDOMObject = function(obj){

    if (((typeof Node != 'undefined') && obj instanceof Node) ||
    ((typeof Element != 'undefined') && obj instanceof Element) ||
    ((typeof NodeList != 'undefined') && obj instanceof NodeList) ||
    (obj === window) ||
    (obj === document)) {
        return true;
    }
    
    if (typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string") {
        return true;
    }
    return false;
}

/**
 * DOM property names, they'll be ignored by default when tracking DOM objects.
 * To disable this behaviour use trackDomProperties=true
 * @type String[]
 */
tent.DOMPropertyNames = ['nextSibling', 'onresizeend', 'onrowenter', 'aria-haspopup', 'childNodes', 'ondragleave', 'canHaveHTML', 'onbeforepaste', 'ondragover', 'onbeforecopy', 'aria-disabled', 'onpage', 'recordNumber', 'previousSibling', 'nodeName', 'onbeforeactivate', 'accessKey', 'currentStyle', 'scrollLeft', 'onbeforeeditfocus', 'oncontrolselect', 'aria-hidden', 'onblur', 'hideFocus', 'clientHeight', 'style', 'onbeforedeactivate', 'dir', 'aria-expanded', 'onkeydown', 'nodeType', 'ondragstart', 'onscroll', 'onpropertychange', 'ondragenter', 'id', 'aria-level', 'onrowsinserted', 'scopeName', 'lang', 'onmouseup', 'aria-busy', 'oncontextmenu', 'language', 'scrollTop', 'offsetWidth', 'onbeforeupdate', 'onreadystatechange', 'onmouseenter', 'filters', 'onresize', 'isContentEditable', 'aria-checked', 'aria-readonly', 'oncopy', 'onselectstart', 'scrollHeight', 'onmove', 'ondragend', 'onrowexit', 'lastChild', 'aria-secret', 'onactivate', 'canHaveChildren', 'onfocus', 'onfocusin', 'isMultiLine', 'onmouseover', 'offsetTop', 'oncut', 'parentNode', 'tagName', 'className', 'onmousemove', 'title', 'role', 'behaviorUrns', 'onfocusout', 'onfilterchange', 'disabled', 'parentTextEdit', 'ownerDocument', 'offsetParent', 'aria-posinset', 'ondrop', 'ondblclick', 'onrowsdelete', 'tabIndex', 'onkeypress', 'aria-relevant', 'onlosecapture', 'innerText', 'aria-live', 'parentElement', 'ondeactivate', 'aria-labelledby', 'aria-pressed', 'children', 'ondatasetchanged', 'ondataavailable', 'aria-invalid', 'onafterupdate', 'nodeValue', 'onmousewheel', 'onkeyup', 'readyState', 'onmovestart', 'aria-valuenow', 'aria-selected', 'onmouseout', 'aria-owns', 'aria-valuemax', 'onmoveend', 'contentEditable', 'document', 'firstChild', 'sourceIndex', 'outerText', 'isTextEdit', 'isDisabled', 'oncellchange', 'runtimeStyle', 'scrollWidth', 'aria-valuemin', 'onlayoutcomplete', 'onhelp', 'attributes', 'offsetHeight', 'onerrorupdate', 'onmousedown', 'clientTop', 'aria-setsize', 'clientWidth', 'onpaste', 'tagUrn', 'onmouseleave', 'onclick', 'outerHTML', 'ondrag', 'aria-controls', 'onresizestart', 'aria-flowto', 'ondatasetcomplete', 'aria-required', 'clientLeft', 'aria-describedby', 'all', 'onbeforecut', 'innerHTML', 'aria-activedescendant', 'aria-multiselectable', 'offsetLeft', 'dataSrc', 'dataFld', 'dataFormatAs', 'name', 'nextSibling', 'onresizeend', 'onrowenter', 'aria-haspopup', 'childNodes', 'ondragleave', 'canHaveHTML', 'onbeforepaste', 'ondragover', 'onbeforecopy', 'aria-disabled', 'onpage', 'recordNumber', 'previousSibling', 'nodeName', 'onbeforeactivate', 'accessKey', 'currentStyle', 'scrollLeft', 'onbeforeeditfocus', 'oncontrolselect', 'aria-hidden', 'onblur', 'hideFocus', 'clientHeight', 'style', 'onbeforedeactivate', 'dir', 'aria-expanded', 'onkeydown', 'nodeType', 'ondragstart', 'onscroll', 'onpropertychange', 'ondragenter', 'id', 'aria-level', 'onrowsinserted', 'scopeName', 'lang', 'onmouseup', 'aria-busy', 'oncontextmenu', 'language', 'scrollTop', 'offsetWidth', 'onbeforeupdate', 'onreadystatechange', 'onmouseenter', 'filters', 'onresize', 'isContentEditable', 'aria-checked', 'aria-readonly', 'oncopy', 'onselectstart', 'scrollHeight', 'onmove', 'ondragend', 'onrowexit', 'lastChild', 'aria-secret', 'onactivate', 'canHaveChildren', 'onfocus', 'onfocusin', 'isMultiLine', 'onmouseover', 'offsetTop', 'oncut', 'parentNode', 'tagName', 'className', 'onmousemove', 'title', 'role', 'behaviorUrns', 'onfocusout', 'onfilterchange', 'disabled', 'parentTextEdit', 'ownerDocument', 'offsetParent', 'aria-posinset', 'ondrop', 'ondblclick', 'onrowsdelete', 'tabIndex', 'onkeypress', 'aria-relevant', 'onlosecapture', 'innerText', 'aria-live', 'parentElement', 'ondeactivate', 'aria-labelledby', 'aria-pressed', 'children', 'ondatasetchanged', 'ondataavailable', 'aria-invalid', 'onafterupdate', 'nodeValue', 'onmousewheel', 'onkeyup', 'readyState', 'onmovestart', 'aria-valuenow', 'aria-selected', 'onmouseout', 'aria-owns', 'aria-valuemax', 'onmoveend', 'contentEditable', 'document', 'firstChild', 'sourceIndex', 'outerText', 'isTextEdit', 'isDisabled', 'oncellchange', 'runtimeStyle', 'scrollWidth', 'aria-valuemin', 'onlayoutcomplete', 'onhelp', 'attributes', 'offsetHeight', 'onerrorupdate', 'onmousedown', 'clientTop', 'aria-setsize', 'clientWidth', 'onpaste', 'tagUrn', 'onmouseleave', 'onclick', 'outerHTML', 'ondrag', 'aria-controls', 'onresizestart', 'aria-flowto', 'ondatasetcomplete', 'aria-required', 'clientLeft', 'aria-describedby', 'all', 'onbeforecut', 'innerHTML', 'aria-activedescendant', 'aria-multiselectable', 'offsetLeft', 'dataSrc', 'dataFld', 'dataFormatAs', 'name'];

/** 
 * @param {String} name a property name
 * @return {Boolean} is this a DOM property name? see {@link tent.DOMPropertyNames}
 */
tent.isDOMProperty = function(name){
    if (!tent.DOMPropertyNames.indexOf) {
        tent.DOMPropertyNames.indexOf = tent.arrays.functions.indexOf;
    }
    return tent.DOMPropertyNames.indexOf(name) >= 0;
}

/**
 * Clones objects
 *
 * This is useful in browsers that only support property change tracking on DOM objects (eg: IE8)
 * @param {Object} obj object or array to clone
 * @param {Object} [options] cloning options
 * @param {Boolean} [options.onlyOwnProperties] clone only own properties (see Object.hasOwnProperty)
 * @param {Boolean} [options.dom] clone as DOM objects (eg: span elements)
 * @param {Boolean} [options.deep] clone deeply, traverse through object properties?
 * @param {Boolean} [options.clonePrivates] clone private members (properties starting with _)
 * @param {Boolean} [options.skipPrivates] skip (don't copy) private members (properties starting with _)
 * @param {Boolean} [options.attachedObjectsIds] if true objects attached to a {@link tent.entities.Context} are replaced by their ids (useful for persistence serialization)
 * @param {Boolean} [options.attachedObjects] if true objects attached to a {@link tent.entities.Context} are cloned too, by default is true (if false deep cloning stops at attached objects)
 * @param {Boolean} [options.ignoreCircularReferences] if cloning deeply, ignore circular references (otherwise error is thrown)
 * @param {Boolean} [options.onlyForTracking] only clone if the current browser only support tracking on DOM objects (eg: IE8), otherwise original obj is returned
 * @return {Object} a clone of obj (or obj if no cloning was performed)
 */
tent.clone = function(obj, options){
    if (obj === null) {
        return null;
    }
    else 
        if (typeof obj == 'undefined') {
            return undefined;
        }
        else 
            if (typeof obj == 'object') {
            
                if (options && options.onlyForTracking &&
                tent.changes.getPropertyInterceptMode() != tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM) {
                    return obj;
                }
                
                if (!options) {
                    options = {};
                }
                else 
                    if (options.deep && !options.deepStack) {
                        options.deepStack = tent.arrays.extend([]);
                    }
                
                if (obj instanceof Array) {
                    var cloneObj = [];
                    for (var i = 0; i < obj.length; i++) {
                        if (typeof obj[i]=='object' && options.deep) {
                            options.deepStack.push(obj);
                            if (options.deepStack.lastIndexOf(obj[i]) < 0) { 
				                if ((options.attachedObjectsIds) && obj[i].__collection__) {
									cloneObj.push(tent.entities.getId(obj[i]));
								}else if ((options.attachedObjects !== false) || !obj[i].__collection__) {
									cloneObj.push(tent.clone(obj[i], options));
								}
                            } else if (!options.ignoreCircularReferences) {
								throw 'Circular reference when cloning array';
							}
                            options.deepStack.pop();
                        }
                        else {
                            cloneObj.push(obj[i]);
                        }
                    }
                    return cloneObj;
                }
                else {
                    var cloneObj = options.dom ? document.createElement('span') : {};
                    for (var pname in obj) {
						if (options.onlyOwnProperties && !obj.hasOwnProperty(pname)){
							continue;
						}						
						
						var isPrivate =  pname.substr(0, 1) == '_';
                        if (options.skipPrivates && isPrivate) {
                            continue;
                        }else if ((!options.clonePrivates) && isPrivate) {
							var value = obj.__observable__ ? tent.pget(obj,pname): obj[pname];
			                if (typeof value=='object' && options.attachedObjectsIds && value.__collection__) {
	                            cloneObj[pname] = tent.entities.getId(value);
								continue;
							}
			                if (typeof value=='object' && (options.attachedObjects === false) && value.__collection__) {
								continue;
							}
                            cloneObj[pname] = value;
                        }
                        else {
                        
							var value = obj.__observable__ ? tent.pget(obj,pname): obj[pname];
						
                            if (options.deep && typeof value == 'object') {
				                if ((options.attachedObjectsIds) && value.__collection__) {
									cloneObj[pname] = tent.entities.getId(value);
									continue;
								}
				                if ((options.attachedObjects === false) && value.__collection__) {
									continue;
								}
                                options.deepStack.push(obj);
                                if (options.deepStack.indexOf(value) < 0) {
                                    cloneObj[pname] = tent.clone(value, options);
                            	} else if (!options.ignoreCircularReferences) {
									throw 'Circular reference when cloning object';
								}
                                options.deepStack.pop();
                            }
                            else {
                                cloneObj[pname] = value;
                            }
                        }
                        
                    }
                    return cloneObj;
                }
            }
    return obj;
}

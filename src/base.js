
/**
 * Base namespace for Tent. Checks to see tent is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var tent = tent || {};

tent.global = window;

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

tent.Namespace.prototype.expand = function(expander){
    expander(this);
    return this;
};

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
                if (a instanceof Function) {
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

tent.DOMPropertyNames = ['nextSibling', 'onresizeend', 'onrowenter', 'aria-haspopup', 'childNodes', 'ondragleave', 'canHaveHTML', 'onbeforepaste', 'ondragover', 'onbeforecopy', 'aria-disabled', 'onpage', 'recordNumber', 'previousSibling', 'nodeName', 'onbeforeactivate', 'accessKey', 'currentStyle', 'scrollLeft', 'onbeforeeditfocus', 'oncontrolselect', 'aria-hidden', 'onblur', 'hideFocus', 'clientHeight', 'style', 'onbeforedeactivate', 'dir', 'aria-expanded', 'onkeydown', 'nodeType', 'ondragstart', 'onscroll', 'onpropertychange', 'ondragenter', 'id', 'aria-level', 'onrowsinserted', 'scopeName', 'lang', 'onmouseup', 'aria-busy', 'oncontextmenu', 'language', 'scrollTop', 'offsetWidth', 'onbeforeupdate', 'onreadystatechange', 'onmouseenter', 'filters', 'onresize', 'isContentEditable', 'aria-checked', 'aria-readonly', 'oncopy', 'onselectstart', 'scrollHeight', 'onmove', 'ondragend', 'onrowexit', 'lastChild', 'aria-secret', 'onactivate', 'canHaveChildren', 'onfocus', 'onfocusin', 'isMultiLine', 'onmouseover', 'offsetTop', 'oncut', 'parentNode', 'tagName', 'className', 'onmousemove', 'title', 'role', 'behaviorUrns', 'onfocusout', 'onfilterchange', 'disabled', 'parentTextEdit', 'ownerDocument', 'offsetParent', 'aria-posinset', 'ondrop', 'ondblclick', 'onrowsdelete', 'tabIndex', 'onkeypress', 'aria-relevant', 'onlosecapture', 'innerText', 'aria-live', 'parentElement', 'ondeactivate', 'aria-labelledby', 'aria-pressed', 'children', 'ondatasetchanged', 'ondataavailable', 'aria-invalid', 'onafterupdate', 'nodeValue', 'onmousewheel', 'onkeyup', 'readyState', 'onmovestart', 'aria-valuenow', 'aria-selected', 'onmouseout', 'aria-owns', 'aria-valuemax', 'onmoveend', 'contentEditable', 'document', 'firstChild', 'sourceIndex', 'outerText', 'isTextEdit', 'isDisabled', 'oncellchange', 'runtimeStyle', 'scrollWidth', 'aria-valuemin', 'onlayoutcomplete', 'onhelp', 'attributes', 'offsetHeight', 'onerrorupdate', 'onmousedown', 'clientTop', 'aria-setsize', 'clientWidth', 'onpaste', 'tagUrn', 'onmouseleave', 'onclick', 'outerHTML', 'ondrag', 'aria-controls', 'onresizestart', 'aria-flowto', 'ondatasetcomplete', 'aria-required', 'clientLeft', 'aria-describedby', 'all', 'onbeforecut', 'innerHTML', 'aria-activedescendant', 'aria-multiselectable', 'offsetLeft', 'dataSrc', 'dataFld', 'dataFormatAs', 'name', 'nextSibling', 'onresizeend', 'onrowenter', 'aria-haspopup', 'childNodes', 'ondragleave', 'canHaveHTML', 'onbeforepaste', 'ondragover', 'onbeforecopy', 'aria-disabled', 'onpage', 'recordNumber', 'previousSibling', 'nodeName', 'onbeforeactivate', 'accessKey', 'currentStyle', 'scrollLeft', 'onbeforeeditfocus', 'oncontrolselect', 'aria-hidden', 'onblur', 'hideFocus', 'clientHeight', 'style', 'onbeforedeactivate', 'dir', 'aria-expanded', 'onkeydown', 'nodeType', 'ondragstart', 'onscroll', 'onpropertychange', 'ondragenter', 'id', 'aria-level', 'onrowsinserted', 'scopeName', 'lang', 'onmouseup', 'aria-busy', 'oncontextmenu', 'language', 'scrollTop', 'offsetWidth', 'onbeforeupdate', 'onreadystatechange', 'onmouseenter', 'filters', 'onresize', 'isContentEditable', 'aria-checked', 'aria-readonly', 'oncopy', 'onselectstart', 'scrollHeight', 'onmove', 'ondragend', 'onrowexit', 'lastChild', 'aria-secret', 'onactivate', 'canHaveChildren', 'onfocus', 'onfocusin', 'isMultiLine', 'onmouseover', 'offsetTop', 'oncut', 'parentNode', 'tagName', 'className', 'onmousemove', 'title', 'role', 'behaviorUrns', 'onfocusout', 'onfilterchange', 'disabled', 'parentTextEdit', 'ownerDocument', 'offsetParent', 'aria-posinset', 'ondrop', 'ondblclick', 'onrowsdelete', 'tabIndex', 'onkeypress', 'aria-relevant', 'onlosecapture', 'innerText', 'aria-live', 'parentElement', 'ondeactivate', 'aria-labelledby', 'aria-pressed', 'children', 'ondatasetchanged', 'ondataavailable', 'aria-invalid', 'onafterupdate', 'nodeValue', 'onmousewheel', 'onkeyup', 'readyState', 'onmovestart', 'aria-valuenow', 'aria-selected', 'onmouseout', 'aria-owns', 'aria-valuemax', 'onmoveend', 'contentEditable', 'document', 'firstChild', 'sourceIndex', 'outerText', 'isTextEdit', 'isDisabled', 'oncellchange', 'runtimeStyle', 'scrollWidth', 'aria-valuemin', 'onlayoutcomplete', 'onhelp', 'attributes', 'offsetHeight', 'onerrorupdate', 'onmousedown', 'clientTop', 'aria-setsize', 'clientWidth', 'onpaste', 'tagUrn', 'onmouseleave', 'onclick', 'outerHTML', 'ondrag', 'aria-controls', 'onresizestart', 'aria-flowto', 'ondatasetcomplete', 'aria-required', 'clientLeft', 'aria-describedby', 'all', 'onbeforecut', 'innerHTML', 'aria-activedescendant', 'aria-multiselectable', 'offsetLeft', 'dataSrc', 'dataFld', 'dataFormatAs', 'name'];

tent.isDOMProperty = function(name){
    if (!tent.DOMPropertyNames.indexOf) {
        tent.DOMPropertyNames.indexOf = tent.arrays.functions.indexOf;
    }
    return tent.DOMPropertyNames.indexOf(name) >= 0;
}

tent.domClone = function(obj, options){
  
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
                        options.deepStack = tent.arrays.addFunctions([]);
                    }
                
                if (obj instanceof Array) {
                    var cloneObj = [];
                    for (var i = 0; i < obj.length; i++) {
                        if (options.deep) {
                            options.deepStack.push(obj);
                            if (options.deepStack.lastIndexOf(obj[i]) < 0) {
                                
                                cloneObj.push(tent.domClone(obj[i], options));
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
                    var cloneObj = document.createElement('span');
                    for (var pname in obj) {
                        if ((!options.clonePrivates) && pname.substr(0, 1) == '_') {
                            cloneObj[pname] = obj[pname];
                        }
                        else {
                        
                            if (options.deep && typeof obj[pname] == 'object') {
                                options.deepStack.push(obj);
                                if (options.deepStack.indexOf(obj[i]) < 0) {
                                    cloneObj[pname] = tent.domClone(obj[pname], options);
                                }
                                options.deepStack.pop();
                            }
                            else {
                                cloneObj[pname] = obj[pname];
                            }
                        }
                        
                    }
                    return cloneObj;
                }
            }
    return obj;
}

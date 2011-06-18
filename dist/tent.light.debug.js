var tent = tent || {};
tent.global = typeof window == "undefined" ? this : window;
tent.Namespace = function Namespace(parent, path) {
  if(!path) {
    if(!parent) {
      throw"must specify namespace path";
    }else {
      path = parent;
      parent = tent.global
    }
  }
  if(path === "..") {
    if(parent === tent.global) {
      throw"cannot use '..' at top level";
    }
    return parent.parent
  }
  var dot1 = path.indexOf(".");
  var dot2 = dot1 < 0 ? -1 : path.indexOf(".", dot1 + 1);
  var fullPath = parent === tent.global ? "" : parent.fullname + "";
  if(fullPath) {
    fullPath += "."
  }
  fullPath += path;
  if(dot1 < 0) {
    if(typeof parent[path] == "undefined") {
      this.fullname = fullPath;
      this.name = path;
      this.parent = parent;
      parent[path] = this
    }else {
      if(!parent[path] instanceof tent.Namespace) {
        throw'error creating namespace: "' + fullPath + '" is not a Namespace object';
      }else {
        return parent[path]
      }
    }
  }else {
    return new tent.Namespace(new tent.Namespace(parent, path.slice(0, dot1)), path.slice(dot1 + 1))
  }
  return this
};
tent.__tentTmp = new tent.Namespace("__tentTmp");
tent.__tentTmp.Namespace = tent.Namespace;
tent.__tentTmp.fullname = "tent";
tent.__tentTmp.name = "tent";
tent.__tentTmp.parent = tent.global;
tent.__tentTmp.global = tent.global;
tent.global.tent = tent.__tentTmp;
delete tent.__tentTmp;
try {
  delete tent.global.__tentTmp
}catch(ex) {
}
tent.Namespace.prototype.expand = function(expander) {
  if(expander instanceof Function) {
    expander(this)
  }else {
    if(typeof expander == "object") {
      for(var propName in expander) {
        if(expander.hasOwnProperty(propName)) {
          if(typeof this[propName] != "undefined") {
            throw this.fullname + "." + propName + " already exists";
          }
          this[propName] = expander[propName]
        }
      }
    }
  }
  return this
};
tent.declare = function() {
  var ns;
  for(var i = 0;i < arguments.length;i++) {
    var a = arguments[i];
    if(a instanceof tent.Namespace) {
      ns = a
    }else {
      if(typeof a == "string") {
        if(!ns) {
          ns = new tent.Namespace(a)
        }else {
          ns = new tent.Namespace(ns, a)
        }
      }else {
        if(a instanceof Function || typeof a == "object") {
          if(!ns) {
            throw"no namespace provided";
          }
          ns.expand(a)
        }else {
          throw"invalid argument type at index " + i + ", expected Namespace, string, Function";
        }
      }
    }
  }
  return ns
};
tent.mixin = function(target, mixin) {
  for(var name in mixin.prototype) {
    if(mixin.prototype.hasOwnProperty(name)) {
      target.prototype[name] = mixin.prototype[name]
    }
  }
  return target
};
tent.combineOptions = function() {
  var options = {};
  for(var i = 0, l = arguments.length;i < l;i++) {
    var arg = arguments[i];
    for(var name in arg) {
      if(arg.hasOwnProperty(name)) {
        options[name] = tent.clone(arg[name], {deep:true, ignoreCircularReferences:true})
      }
    }
  }
  return options
};
tent.isDOMObject = function(obj) {
  if(typeof Node != "undefined" && obj instanceof Node || typeof Element != "undefined" && obj instanceof Element || typeof NodeList != "undefined" && obj instanceof NodeList || obj === window || obj === document) {
    return true
  }
  if(typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string") {
    return true
  }
  return false
};
tent.DOMPropertyNames = ["nextSibling", "onresizeend", "onrowenter", "aria-haspopup", "childNodes", "ondragleave", "canHaveHTML", "onbeforepaste", "ondragover", "onbeforecopy", "aria-disabled", "onpage", "recordNumber", "previousSibling", "nodeName", "onbeforeactivate", "accessKey", "currentStyle", "scrollLeft", "onbeforeeditfocus", "oncontrolselect", "aria-hidden", "onblur", "hideFocus", "clientHeight", "style", "onbeforedeactivate", "dir", "aria-expanded", "onkeydown", "nodeType", "ondragstart", 
"onscroll", "onpropertychange", "ondragenter", "id", "aria-level", "onrowsinserted", "scopeName", "lang", "onmouseup", "aria-busy", "oncontextmenu", "language", "scrollTop", "offsetWidth", "onbeforeupdate", "onreadystatechange", "onmouseenter", "filters", "onresize", "isContentEditable", "aria-checked", "aria-readonly", "oncopy", "onselectstart", "scrollHeight", "onmove", "ondragend", "onrowexit", "lastChild", "aria-secret", "onactivate", "canHaveChildren", "onfocus", "onfocusin", "isMultiLine", 
"onmouseover", "offsetTop", "oncut", "parentNode", "tagName", "className", "onmousemove", "title", "role", "behaviorUrns", "onfocusout", "onfilterchange", "disabled", "parentTextEdit", "ownerDocument", "offsetParent", "aria-posinset", "ondrop", "ondblclick", "onrowsdelete", "tabIndex", "onkeypress", "aria-relevant", "onlosecapture", "innerText", "aria-live", "parentElement", "ondeactivate", "aria-labelledby", "aria-pressed", "children", "ondatasetchanged", "ondataavailable", "aria-invalid", "onafterupdate", 
"nodeValue", "onmousewheel", "onkeyup", "readyState", "onmovestart", "aria-valuenow", "aria-selected", "onmouseout", "aria-owns", "aria-valuemax", "onmoveend", "contentEditable", "document", "firstChild", "sourceIndex", "outerText", "isTextEdit", "isDisabled", "oncellchange", "runtimeStyle", "scrollWidth", "aria-valuemin", "onlayoutcomplete", "onhelp", "attributes", "offsetHeight", "onerrorupdate", "onmousedown", "clientTop", "aria-setsize", "clientWidth", "onpaste", "tagUrn", "onmouseleave", "onclick", 
"outerHTML", "ondrag", "aria-controls", "onresizestart", "aria-flowto", "ondatasetcomplete", "aria-required", "clientLeft", "aria-describedby", "all", "onbeforecut", "innerHTML", "aria-activedescendant", "aria-multiselectable", "offsetLeft", "dataSrc", "dataFld", "dataFormatAs", "name", "nextSibling", "onresizeend", "onrowenter", "aria-haspopup", "childNodes", "ondragleave", "canHaveHTML", "onbeforepaste", "ondragover", "onbeforecopy", "aria-disabled", "onpage", "recordNumber", "previousSibling", 
"nodeName", "onbeforeactivate", "accessKey", "currentStyle", "scrollLeft", "onbeforeeditfocus", "oncontrolselect", "aria-hidden", "onblur", "hideFocus", "clientHeight", "style", "onbeforedeactivate", "dir", "aria-expanded", "onkeydown", "nodeType", "ondragstart", "onscroll", "onpropertychange", "ondragenter", "id", "aria-level", "onrowsinserted", "scopeName", "lang", "onmouseup", "aria-busy", "oncontextmenu", "language", "scrollTop", "offsetWidth", "onbeforeupdate", "onreadystatechange", "onmouseenter", 
"filters", "onresize", "isContentEditable", "aria-checked", "aria-readonly", "oncopy", "onselectstart", "scrollHeight", "onmove", "ondragend", "onrowexit", "lastChild", "aria-secret", "onactivate", "canHaveChildren", "onfocus", "onfocusin", "isMultiLine", "onmouseover", "offsetTop", "oncut", "parentNode", "tagName", "className", "onmousemove", "title", "role", "behaviorUrns", "onfocusout", "onfilterchange", "disabled", "parentTextEdit", "ownerDocument", "offsetParent", "aria-posinset", "ondrop", 
"ondblclick", "onrowsdelete", "tabIndex", "onkeypress", "aria-relevant", "onlosecapture", "innerText", "aria-live", "parentElement", "ondeactivate", "aria-labelledby", "aria-pressed", "children", "ondatasetchanged", "ondataavailable", "aria-invalid", "onafterupdate", "nodeValue", "onmousewheel", "onkeyup", "readyState", "onmovestart", "aria-valuenow", "aria-selected", "onmouseout", "aria-owns", "aria-valuemax", "onmoveend", "contentEditable", "document", "firstChild", "sourceIndex", "outerText", 
"isTextEdit", "isDisabled", "oncellchange", "runtimeStyle", "scrollWidth", "aria-valuemin", "onlayoutcomplete", "onhelp", "attributes", "offsetHeight", "onerrorupdate", "onmousedown", "clientTop", "aria-setsize", "clientWidth", "onpaste", "tagUrn", "onmouseleave", "onclick", "outerHTML", "ondrag", "aria-controls", "onresizestart", "aria-flowto", "ondatasetcomplete", "aria-required", "clientLeft", "aria-describedby", "all", "onbeforecut", "innerHTML", "aria-activedescendant", "aria-multiselectable", 
"offsetLeft", "dataSrc", "dataFld", "dataFormatAs", "name"];
tent.isDOMProperty = function(name) {
  if(!tent.DOMPropertyNames.indexOf) {
    tent.DOMPropertyNames.indexOf = tent.arrays.functions.indexOf
  }
  return tent.DOMPropertyNames.indexOf(name) >= 0
};
tent.clone = function(obj, options) {
  if(obj === null) {
    return null
  }else {
    if(typeof obj == "undefined") {
      return undefined
    }else {
      if(typeof obj == "object") {
        if(options && options.onlyForTracking && tent.changes.getPropertyInterceptMode() != tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM) {
          return obj
        }
        if(!options) {
          options = {}
        }else {
          if(options.deep && !options.deepStack) {
            options.deepStack = tent.arrays.extend([])
          }
        }
        if(obj instanceof Array) {
          var cloneObj = [];
          for(var i = 0;i < obj.length;i++) {
            if(typeof obj[i] == "object" && options.deep) {
              options.deepStack.push(obj);
              if(options.deepStack.lastIndexOf(obj[i]) < 0) {
                if(options.attachedObjectsIds && obj[i].__collection__) {
                  cloneObj.push(tent.entities.getId(obj[i]))
                }else {
                  if(options.attachedObjects !== false || !obj[i].__collection__) {
                    cloneObj.push(tent.clone(obj[i], options))
                  }
                }
              }else {
                if(!options.ignoreCircularReferences) {
                  throw"Circular reference when cloning array";
                }
              }
              options.deepStack.pop()
            }else {
              cloneObj.push(obj[i])
            }
          }
          return cloneObj
        }else {
          var cloneObj = options.dom ? document.createElement("span") : {};
          for(var pname in obj) {
            if(options.onlyOwnProperties && !obj.hasOwnProperty(pname)) {
              continue
            }
            var isPrivate = pname.substr(0, 1) == "_";
            if(options.skipPrivates && isPrivate) {
              continue
            }else {
              if(!options.clonePrivates && isPrivate) {
                var value = obj.__observable__ ? tent.pget(obj, pname) : obj[pname];
                if(typeof value == "object" && options.attachedObjectsIds && value.__collection__) {
                  cloneObj[pname] = tent.entities.getId(value);
                  continue
                }
                if(typeof value == "object" && options.attachedObjects === false && value.__collection__) {
                  continue
                }
                cloneObj[pname] = value
              }else {
                var value = obj.__observable__ ? tent.pget(obj, pname) : obj[pname];
                if(options.deep && typeof value == "object") {
                  if(options.attachedObjectsIds && value.__collection__) {
                    cloneObj[pname] = tent.entities.getId(value);
                    continue
                  }
                  if(options.attachedObjects === false && value.__collection__) {
                    continue
                  }
                  options.deepStack.push(obj);
                  if(options.deepStack.indexOf(value) < 0) {
                    cloneObj[pname] = tent.clone(value, options)
                  }else {
                    if(!options.ignoreCircularReferences) {
                      throw"Circular reference when cloning object";
                    }
                  }
                  options.deepStack.pop()
                }else {
                  cloneObj[pname] = value
                }
              }
            }
          }
          return cloneObj
        }
      }
    }
  }
  return obj
};tent.declare("tent.arrays", function() {
  tent.arrays.extend = function(array, override) {
    for(var fname in tent.arrays.functions) {
      if(override || !(array[fname] instanceof Function)) {
        array[fname] = tent.arrays.functions[fname]
      }
    }
    return array
  };
  tent.arrays.functions = {findByProperty:function(propertyName, value) {
    for(var i = 0, l = this.length;i < l;i++) {
      if(this[i][propertyName] === value) {
        return this[i]
      }
    }
    return null
  }, first:function(condition) {
    for(var i = 0, l = this.length;i < l;i++) {
      if(condition(this[i])) {
        return this[i]
      }
    }
    return null
  }, indexByProperty:function(propertyName, value) {
    for(var i = 0, l = this.length;i < l;i++) {
      if(this[i][propertyName] === value) {
        return i
      }
    }
    return-1
  }, indexOf:function(item) {
    for(var i = 0, l = this.length;i < l;i++) {
      if(this[i] === item) {
        return i
      }
    }
    return-1
  }, lastIndexOf:function(item) {
    for(var i = this.length - 1;i > 0;i--) {
      if(this[i] === item) {
        return i
      }
    }
    return-1
  }, filter:function(condition) {
    var filtered = [];
    for(var i = 0, l = this.length;i < l;i++) {
      if(condition(this[i])) {
        filtered.push(this[i])
      }
    }
    return filtered
  }, remove:function() {
    var removed;
    for(var i = 0, l = this.length;i < l;i++) {
      for(var ai = 0, al = arguments.length;ai < al;ai++) {
        if(this[i] == arguments[ai]) {
          this.splice(i, 1);
          removed = true;
          i--;
          l--;
          break
        }
      }
    }
    if(removed) {
      return true
    }
    return false
  }, set:function(i, item) {
    this.splice(i, 1, item)
  }, pushUnique:function() {
    if(arguments.length == 1) {
      var found = false;
      for(var i = 0, l = this.length;i < l;i++) {
        if(this[i] == arguments[0]) {
          found = true;
          break
        }
      }
      if(!found) {
        this.push(arguments[0])
      }
    }else {
      var exists = [];
      for(var i = 0, l = this.length;i < l;i++) {
        for(var ai = 0, al = arguments.length;ai < al;ai++) {
          if(this[i] == arguments[ai]) {
            exists[ai] = true
          }
        }
      }
      for(var ai = 0, al = arguments.length;ai < al;ai++) {
        if(!exists[ai]) {
          this.push(arguments[ai])
        }
      }
    }
    return this.length
  }, clone:function() {
    var cl = [];
    Array.prototype.push.apply(cl, this);
    return cl
  }, isCloneOf:function(array) {
    if(!array) {
      return false
    }
    if(this.length != array.length) {
      return false
    }
    if(this === array) {
      return false
    }
    for(var i = this.length;i >= 0;i--) {
      if(this[i] !== array[i]) {
        return false
      }
    }
    return true
  }}
});tent.declare("tent.coreTypes", function() {
  tent.coreTypes.Enum = function Enum() {
    this.__names__ = [];
    this.__values__ = {};
    this.__flags__ = false;
    this.__enum = true;
    if(arguments.length > 0) {
      this.add.apply(this, arguments)
    }
  };
  tent.coreTypes.Enum.prototype.getName = function(value) {
    if(this.__names__) {
      if(this.__names__[value]) {
        return this.__names__[value]
      }else {
        if(this.__flags__) {
          var v = value, n = "";
          for(var name in this.__values__) {
            if(this.__values__[name] && (this.__values__[name] & v) === this.__values__[name]) {
              v -= this.__values__[name];
              if(n) {
                n += "|"
              }
              n += name
            }
          }
          if(n && v === 0) {
            return n
          }else {
            if(n) {
              return n + "|" + v
            }
          }
        }
      }
    }
  };
  tent.coreTypes.Enum.prototype.__freeValue__ = function() {
    var free = typeof this.__maxValue__ == "undefined" ? 1 : this.__maxValue__ + 1;
    if(this.__values__ && typeof this.__values__[free] != "undefined") {
      for(var n in this.__values__) {
        if(this.__values__[n] >= free) {
          this.__maxValue__ = this.__values__[n];
          free = this.__values__[n] + 1
        }
      }
    }
    if(this.__flags__) {
      if(free < 1) {
        free = 1
      }else {
        free = Math.pow(2, Math.ceil(Math.log(free) / Math.log(2)))
      }
    }
    return free
  };
  tent.coreTypes.Enum.prototype.useFlags = function(uf) {
    this.__flags__ = uf;
    return this
  };
  var __setNameValue__ = function(_enum, name, value) {
    _enum[name] = value;
    _enum.__values__[name] = value;
    if(typeof _enum.__names__[value] == "undefined") {
      _enum.__names__[value] = name
    }
    if(typeof _enum.__maxValue__ == "undefined" || _enum.__maxValue__ < value) {
      _enum.__maxValue__ = value
    }
  };
  tent.coreTypes.Enum.prototype.add = function() {
    if(arguments.length < 1) {
      return this
    }
    var names, name;
    for(var argi = 0, argl = arguments.length;argi < argl;argi++) {
      var data = arguments[argi];
      if(data instanceof Array) {
        this.add.apply(this, data)
      }else {
        if(typeof data == "object") {
          for(name in data) {
            if(data.hasOwnProperty(name)) {
              var v = this.__values__[name];
              if(!v instanceof Number || typeof this.__names__[v] != "undefined") {
                v = this.__freeValue__()
              }
              __setNameValue__(this, name, v)
            }
          }
        }
      }
      if(typeof data == "string") {
        if(data) {
          names = data.split(",");
          for(var i = 0, l = names.length;i < l;i++) {
            name = names[i].replace(/^\s+/g, "").replace(/\s+$/g, "");
            if(name == "_FLAGS") {
              this.useFlags(true)
            }else {
              if(typeof this.__values__[name] != "undefined") {
                if(this.__values__[name] instanceof Number) {
                  throw"Enum duplicate name found: " + name;
                }else {
                  throw"Enum invalid name (reserved): " + name;
                }
              }
              if(i == l - 1 && argi < argl - 1 && typeof arguments[argi + 1] == "number") {
                __setNameValue__(this, name, arguments[argi + 1]);
                argi++
              }else {
                __setNameValue__(this, name, this.__freeValue__())
              }
            }
          }
        }
      }
    }
    return this
  };
  var NameCounter_NodeToString = function() {
    var s = this._name + (this._count > 1 ? "(" + this._count + ")" : "");
    if(this._childrenCount) {
      s += "{";
      var i = 0;
      for(var n in this) {
        if(n.substr(0, 1) != "_" && typeof this[n] == "object") {
          if(i > 0) {
            s += ", "
          }
          s += this[n];
          i++
        }
      }
      s += "}"
    }
    return s
  };
  tent.coreTypes.NameCounter = function NameCounter(name) {
    this.root = {_name:name || "", _count:0, toString:NameCounter_NodeToString}
  };
  tent.coreTypes.NameCounter.prototype.__nodeAdd__ = function(node, inc) {
    node._count = (node._count || 0) + inc;
    if(node._parent) {
      if(node._count == 0 && !node._childrenCount) {
        if(node._parent._childrenCount) {
          node._parent._childrenCount--
        }
        delete node._parent[node._name]
      }
      this.__nodeAdd__(node._parent, inc)
    }
  };
  tent.coreTypes.NameCounter.prototype.add = function(name, inc) {
    if(typeof inc != "number") {
      inc = 1
    }
    var namePath = name.split(".");
    var node = this.root;
    for(var i = 0;i < namePath.length;i++) {
      if(typeof node[namePath[i]] == "undefined") {
        node._childrenCount = (node._childrenCount || 0) + 1;
        node[namePath[i]] = {_parent:node, _name:namePath[i], _count:0, toString:NameCounter_NodeToString}
      }
      node = node[namePath[i]]
    }
    this.__nodeAdd__(node, inc)
  };
  tent.coreTypes.NameCounter.prototype.reset = function() {
    this.root = {_name:this.root._name, _count:0, toString:NameCounter_NodeToString}
  };
  tent.coreTypes.NameCounter.prototype.toString = function() {
    return NameCounter_NodeToString.apply(this.root)
  }
});tent.declare("tent.logging", function() {
  tent.logging.Levels = new tent.coreTypes.Enum("TRACE,DEBUG,INFO,WARN,ERROR,FATAL");
  tent.logging.Log = function Log() {
    this.listeners = []
  };
  tent.logging.Log.prototype.bindToConsole = function(level) {
    if(typeof console != "undefined") {
      this.bind(tent.logging.consoleLogger, level)
    }
    return this
  };
  tent.logging.Log.prototype.bindToAlert = function(level) {
    this.bind(tent.logging.alertLogger, level);
    return this
  };
  tent.logging.Log.prototype.bindToHtml = function(outputElement, level) {
    this.bind(tent.logging.createHtmlAppendLogger(outputElement), level);
    return this
  };
  tent.logging.Log.prototype.unbindConsole = function() {
    if(typeof console != "undefined") {
      this.unbind(tent.logging.consoleLogger)
    }
    return this
  };
  tent.logging.Log.prototype.unbindAlert = function() {
    this.unbind(tent.logging.alertLogger, level);
    return this
  };
  tent.logging.Log.prototype.unbindHtml = function(outputElement) {
    for(var i = this.listeners.length;i >= 0;i--) {
      if(this.listeners[i].callback.outputElement === outputElement) {
        this.listeners.splice(i, 1)
      }
    }
    return this
  };
  tent.logging.Log.prototype.bind = function(callback, level) {
    if(!callback instanceof Function) {
      throw"a callback Function must be provided";
    }
    var lvl = level;
    if(typeof lvl != "number") {
      if(typeof lvl == "undefined") {
        lvl = tent.logging.Levels.TRACE
      }else {
        lvl = tent.logging.Levels[lvl] || tent.logging.Levels.TRACE
      }
    }
    var found = false;
    for(var i = this.listeners.length - 1;i >= 0;i--) {
      var list = this.listeners[i];
      if(list.callback === callback) {
        list.level = lvl;
        found = true
      }
    }
    if(!found) {
      this.listeners.push({callback:callback, level:lvl})
    }
    return this
  };
  tent.logging.Log.prototype.unbind = function(callback) {
    if(!callback instanceof Function) {
      throw"a callback Function must be provided";
    }
    for(var i = this.listeners.length;i >= 0;i--) {
      if(this.listeners[i].callback === callback) {
        this.listeners.splice(i, 1)
      }
    }
    return this
  };
  tent.logging.Log.prototype.notify = function(message, level) {
    var lvl = level;
    if(typeof lvl != "number") {
      if(!lvl) {
        lvl = tent.logging.Levels.INFO
      }else {
        lvl = tent.logging.Levels[lvl] || tent.logging.Levels.INFO
      }
    }
    for(var i = 0, l = this.listeners.length;i < l;i++) {
      var lst = this.listeners[i];
      if(lst.callback) {
        if(typeof lst.level == "undefined" || lst.level <= lvl) {
          lst.callback(message, level)
        }
      }
    }
  };
  tent.logging.Log.prototype.trace = function() {
    var message = this.stringOrStringify.apply(this, arguments);
    this.notify(message, tent.logging.Levels.TRACE)
  };
  tent.logging.Log.prototype.debug = function() {
    var message = this.stringOrStringify.apply(this, arguments);
    this.notify(message, tent.logging.Levels.DEBUG)
  };
  tent.logging.Log.prototype.info = function() {
    var message = this.stringOrStringify.apply(this, arguments);
    this.notify(message, tent.logging.Levels.INFO)
  };
  tent.logging.Log.prototype.warn = function() {
    var message = this.stringOrStringify.apply(this, arguments);
    this.notify(message, tent.logging.Levels.WARN)
  };
  tent.logging.Log.prototype.error = function() {
    var message = this.stringOrStringify.apply(this, arguments);
    this.notify(message, tent.logging.Levels.ERROR)
  };
  tent.logging.Log.prototype.fatal = function() {
    var message = this.stringOrStringify.apply(this, arguments);
    this.notify(message, tent.logging.Levels.FATAL)
  };
  tent.logging.Log.prototype.stringify = function() {
    var s = "";
    try {
      var options = arguments.length > 0 && arguments[arguments.length - 1] && arguments[arguments.length - 1]._options ? arguments[arguments.length - 1] : {_options:true};
      if(!options.deepStack) {
        options.deepStack = [];
        tent.arrays.extend(options.deepStack)
      }
      for(var i = 0, l = arguments.length;i < l;i++) {
        if(arguments[i] && typeof arguments[i] == "object" && arguments[i]._options) {
          continue
        }
        if(arguments[i] instanceof Function) {
          continue
        }
        if(s) {
          s += ", "
        }
        if(options.deepStack.length > 3 || options.deepStack.lastIndexOf(arguments[i]) >= 0) {
          s += "#"
        }else {
          if(typeof arguments[i] == "undefined") {
            s += "undefined"
          }else {
            if(arguments[i] == null) {
              s += "null"
            }else {
              if(arguments[i] instanceof Array) {
                var arg = tent.arrays.functions.clone.apply(arguments[i]).filter(function(item) {
                  if(item instanceof Function) {
                    return false
                  }
                  if(options.deepStack.lastIndexOf(item >= 0)) {
                    return false
                  }
                  return true
                });
                arg.push(options);
                options.deepStack.push(arguments[i]);
                s += "[";
                if(options.deepStack.length < 4) {
                  s += this.stringify.apply(this, arg)
                }
                options.deepStack.pop();
                s += "]"
              }else {
                if(typeof arguments[i] == "string") {
                  s += '"' + arguments[i] + '"'
                }else {
                  if(arguments[i] instanceof Date) {
                    s += '"' + arguments[i] + '"'
                  }else {
                    if(typeof arguments[i] == "object") {
                      var so = "";
                      options.deepStack.push(arguments[i]);
                      if(options.deepStack.length < 4) {
                        for(var n in arguments[i]) {
                          if(arguments[i][n] instanceof Function) {
                            continue
                          }
                          if(options.deepStack.lastIndexOf(arguments[i][n]) >= 0) {
                            continue
                          }
                          if(so) {
                            so += ", "
                          }
                          so += '"' + n + '": ' + this.stringify.apply(this, [arguments[i][n], options])
                        }
                      }
                      options.deepStack.pop();
                      s += "{" + so + "}"
                    }else {
                      s += arguments[i]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }catch(err) {
      return"#err#"
    }
    return s
  };
  tent.logging.Log.prototype.stringOrStringify = function() {
    if(arguments.length == 1 && typeof arguments[0] == "string") {
      return arguments[0]
    }else {
      return this.stringify.apply(this, arguments)
    }
  };
  tent.logging.consoleLogger = function(message, level) {
    if(level == tent.logging.Levels.TRACE) {
      if(console.trace) {
        console.trace(message)
      }else {
        console.info(message)
      }
    }
    if(level == tent.logging.Levels.DEBUG) {
      if(console.debug) {
        console.debug(message)
      }else {
        console.info(message)
      }
    }
    if(level == tent.logging.Levels.INFO) {
      console.info(message)
    }
    if(level == tent.logging.Levels.WARN) {
      if(console.warn) {
        console.warn(message)
      }else {
        console.info(message)
      }
    }
    if(level == tent.logging.Levels.ERROR) {
      console.error(message)
    }
    if(level == tent.logging.Levels.FATAL) {
      console.error(message)
    }
  };
  tent.logging.alertLogger = function(message, level) {
    alert(message)
  };
  tent.logging.createHtmlAppendLogger = function(outputElement) {
    var f = null;
    if(outputElement.tagName == "INPUT") {
      f = function(message, level) {
        outputElement.value += "\n[" + tent.logging.Levels.getName(level) + "] " + message
      }
    }else {
      if(outputElement.tagName == "UL") {
        f = function(message, level) {
          var li = document.createElement("li");
          li.innerHTML = "[" + tent.logging.Levels.getName(level) + "] " + message;
          outputElement.appendChild(li)
        }
      }else {
        if(outputElement.tagName == "TABLE") {
          f = function(message, level) {
            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            td1.setAttribute("class", "eventType");
            td1.innerHTML = tent.logging.Levels.getName(level);
            tr.appendChild(td1);
            var td2 = document.createElement("td");
            td2.setAttribute("class", "eventMessage");
            td2.innerHTML = message.replace(/(\<)/g, "&lt;").replace(/(\>)/g, "&gt;").replace(/(\&)/g, "&amp;").replace(/(\s)/g, "&nbsp;");
            tr.appendChild(td2);
            var tbody = outputElement.tBodies[0];
            tbody.appendChild(tr)
          }
        }else {
          f = function(message, level) {
            outputElement.innerHTML += "<br/>[" + tent.logging.Levels.getName(level) + "] " + message
          }
        }
      }
    }
    f.outputElement = outputElement;
    return f
  };
  tent.log = (new tent.logging.Log).bindToConsole()
});tent.declare("tent.changes", function() {
  tent.changes.EventTypes = new tent.coreTypes.Enum("ANY,MANYCHANGES,CHANGING,CHANGED,ADDING,ADDED,REMOVING,REMOVED");
  tent.changes.InterceptorTypes = new tent.coreTypes.Enum("PROPERTY,FUNCTION");
  tent.changes.PropertyInterceptModes = new tent.coreTypes.Enum("NONE,DEFINESETTER,DEFINEPROPERTY,DEFINEPROPERTYONLYDOM");
  var _PropertyInterceptMode;
  tent.changes.getPropertyInterceptMode = function() {
    if(typeof _PropertyInterceptMode == "undefined") {
      var anobject = {};
      if(Object.defineProperty) {
        try {
          Object.defineProperty(anobject, "myproperty", {get:function() {
            return this._myproperty
          }, set:function(value) {
            this._myproperty = value
          }});
          anobject.myproperty = "my value";
          if(anobject.myproperty === "my value" && anobject._myproperty === "my value") {
            _PropertyInterceptMode = tent.changes.PropertyInterceptModes.DEFINEPROPERTY
          }
        }catch(err) {
          if(document && document.createElement) {
            var adomobject = document.createElement("span");
            try {
              Object.defineProperty(adomobject, "myproperty", {get:function() {
                return this._myproperty
              }, set:function(value) {
                this._myproperty = value
              }});
              adomobject.myproperty = "my value";
              if(adomobject.myproperty === "my value" && adomobject._myproperty === "my value") {
                _PropertyInterceptMode = tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM
              }
            }catch(err) {
            }
          }
        }
      }
      if(typeof _PropertyInterceptMode == "undefined") {
        anobject = {};
        if(anobject.__defineSetter__) {
          try {
            anobject.__defineGetter__("myproperty", function() {
              return this._myproperty
            });
            anobject.__defineSetter__("myproperty", function(value) {
              this._myproperty = value
            });
            anobject.myproperty = "my value";
            if(anobject.myproperty === "my value" && anobject._myproperty === "my value") {
              _PropertyInterceptMode = tent.changes.PropertyInterceptModes.DEFINESETTER
            }
          }catch(err) {
          }
        }
      }
      if(typeof _PropertyInterceptMode == "undefined") {
        _PropertyInterceptMode = tent.changes.PropertyInterceptModes.NONE
      }
    }
    return _PropertyInterceptMode
  };
  tent.changes.getPropertyInterceptModeName = function() {
    return tent.changes.PropertyInterceptModes.getName(tent.changes.getPropertyInterceptMode())
  };
  tent.changes.Change = function Change(subject, eventType, data) {
    this.subject = subject;
    this.eventType = eventType;
    this.data = data
  };
  tent.changes.ChangeStringifiers = [];
  tent.changes.Change.prototype.toString = function() {
    if(typeof tent.changes.ChangeStringifiers[this.eventType] != "undefined") {
      tent.changes.ChangeStringifiers[this.eventType](this)
    }else {
      var change = this;
      var message = tent.changes.EventTypes.getName(change.eventType);
      if(change.eventType == tent.changes.EventTypes.MANYCHANGES) {
        message += ": ";
        if(change.data.length <= 3) {
          for(var i = 0, l = change.data.length;i < l;i++) {
            message += change.data[i].toString() + ","
          }
        }else {
          var et = {};
          for(var i = 0, l = change.data.length;i < l;i++) {
            et[change.data[i].eventType] = (et[change.data[i].eventType] || 0) + 1
          }
          for(var e in et) {
            message += tent.changes.EventTypes.getName(e) + "(" + et[e] + "),"
          }
        }
      }else {
        if(change.data.propertyName) {
          message += " " + change.data.propertyName;
          if(change.eventType == tent.changes.EventTypes.CHANGING) {
            message += " from " + change.data.current + " to " + change.data.newValue
          }else {
            if(change.eventType == tent.changes.EventTypes.CHANGED) {
              message += " from " + change.data.oldValue + " to " + change.data.current
            }
          }
          message += " (on " + change.subject + ")"
        }
        if(change.data.items) {
          var items = change.data.items;
          message += " " + items.length + (items.length > 1 ? " items" : " item");
          if(typeof change.data.index != "undefined") {
            message += " at index " + change.data.index
          }
          if(change.data.propertyName) {
            message += " (" + change.subject.__parent__ + "." + change.data.propertyName + ")"
          }else {
            message += " ([" + items + "])"
          }
        }
      }
      return"[Change: " + message + "]"
    }
  };
  tent.changes.Observable = function Observable(subject) {
    this.subject = subject;
    this.handlers = {};
    this.interceptors = {};
    this.suspended = false;
    this.changesWhileSuspended = null
  };
  var defaultBackPropertyPrefix = "_";
  tent.changes.Observable.prototype.interceptFunction = function(name, override) {
    if(this.interceptors[name]) {
      return
    }
    var _name = defaultBackPropertyPrefix + name;
    var intercept = {name:name, _name:_name, type:tent.changes.InterceptorTypes.FUNCTION};
    this.subject[_name] = this.subject[name];
    this.subject[name] = override;
    this.interceptors[name] = intercept
  };
  tent.pset = function(subject, propertyName, value, skipInterceptors) {
    if(typeof propertyName == "object") {
      for(var prop in propertyName) {
        if(propertyName.hasOwnProperty(prop)) {
          tent.pset(subject, prop, propertyName[prop], value)
        }
      }
      return subject
    }else {
      if(subject.__observable__ && subject.__observable__.interceptors && subject.__observable__.interceptors[propertyName]) {
        if(skipInterceptors) {
          var storeProp = subject.__observable__.interceptors[propertyName]._name || propertyName;
          subject[storeProp] = value
        }else {
          subject.__observable__.interceptors[propertyName].newsetter.call(subject, value)
        }
      }else {
        subject[propertyName] = value
      }
      return value
    }
  };
  tent.pget = function(subject, propertyName) {
    if(subject.__observable__ && subject.__observable__.interceptors && subject.__observable__.interceptors[propertyName]) {
      return subject.__observable__.interceptors[propertyName].newgetter.call(subject)
    }else {
      return subject[propertyName]
    }
  };
  tent.changes.Observable.prototype.interceptProperty = function(name, _name, getter, setter) {
    if(this.interceptors[name]) {
      return this.interceptors[name]
    }
    var intercept = {name:name, type:tent.changes.InterceptorTypes.PROPERTY, newsetter:setter, newgetter:getter};
    if(_name) {
      _name = defaultBackPropertyPrefix + name;
      try {
        this.subject[_name] = this.subject[name]
      }catch(error) {
        this.subject[_name] = null
      }
      intercept._name = _name
    }
    var mode = tent.changes.getPropertyInterceptMode();
    if(mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTY || mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM && tent.isDOMObject(this.subject)) {
      try {
        intercept.descriptor = Object.getOwnPropertyDescriptor(this.subject, name)
      }catch(err) {
      }
      var newDescriptor = {};
      if(getter) {
        newDescriptor.get = getter
      }
      if(setter) {
        newDescriptor.set = setter
      }
      try {
        Object.defineProperty(this.subject, name, newDescriptor)
      }catch(error) {
        tent.log.warn("Object.defineProperty for property '" + name + "' failed: " + error)
      }
    }else {
      if(mode == tent.changes.PropertyInterceptModes.DEFINESETTER) {
        try {
          intercept.getter = this.subject.__lookupGetter__(name);
          intercept.setter = this.subject.__lookupSetter__(name)
        }catch(err) {
        }
        if(getter) {
          try {
            this.subject.__defineGetter__(name, getter)
          }catch(error) {
            tent.log.warn("Object.__defineGetter__ for property '" + name + "' failed: " + error)
          }
        }
        if(setter) {
          try {
            this.subject.__defineSetter__(name, setter)
          }catch(error) {
            tent.log.warn("Object.__defineSetter__ for property '" + name + "' failed: " + error)
          }
        }
      }else {
      }
    }
    if(intercept) {
      this.interceptors[name] = intercept
    }
    return intercept
  };
  tent.changes.Observable.prototype.shouldNotifyParent = function() {
    return!!(this.parentObject && this.parentObject !== this && this.parentObjectPropertyName && this.parentObject.__observable__ && this.parentObject.__observable__.interceptors && this.parentObject.__observable__.interceptors[this.parentObjectPropertyName])
  };
  tent.changes.Observable.prototype.notifyParentChanging = function(data) {
    data.subject = this.subject;
    this.parentObject.__observable__.notifyChange(tent.changes.EventTypes.CHANGING, {propertyName:this.parentObjectPropertyName, innerChange:data})
  };
  tent.changes.Observable.prototype.notifyParentChanged = function(data) {
    data.subject = this.subject;
    this.parentObject.__observable__.notifyChange(tent.changes.EventTypes.CHANGED, {propertyName:this.parentObjectPropertyName, innerChange:data})
  };
  var buildPropertySetter = function(propName, _propName) {
    return function(value) {
      var current = this[_propName];
      if(current != value) {
        this.__observable__.notifyChange(tent.changes.EventTypes.CHANGING, {propertyName:propName, current:current, newValue:value});
        var notifyParent = this.__observable__.shouldNotifyParent();
        if(notifyParent) {
          this.__observable__.notifyParentChanging({propertyName:propName, current:current, newValue:value})
        }
        this[_propName] = value;
        this.__observable__.notifyChange(tent.changes.EventTypes.CHANGED, {propertyName:propName, current:value, oldValue:current});
        if(notifyParent) {
          this.__observable__.notifyParentChanged({propertyName:propName, current:value, oldValue:current})
        }
      }
    }
  };
  var buildPropertyGetter = function(propName, _propName) {
    return function() {
      return this[_propName]
    }
  };
  var defaultPropertyInterceptFilter = function(obj, propName) {
    return propName.substr(0, 1) != defaultBackPropertyPrefix
  };
  tent.changes.Observable.prototype.interceptProperties = function(options) {
    if(!options) {
      options = {}
    }
    var filter = options.propertyFilter || defaultPropertyInterceptFilter;
    var backPropertyPrefix = options.backPropertyPrefix || defaultBackPropertyPrefix;
    var filterDomProps = !options.trackDomProperties && this.isDOMObject();
    for(var propName in this.subject) {
      if(filterDomProps && tent.isDOMProperty(propName)) {
        continue
      }
      var valueType;
      try {
        if((valueType = typeof this.subject[propName]) != "function" && filter(this.subject, propName)) {
          var _propName = backPropertyPrefix + propName;
          this.interceptProperty(propName, _propName, buildPropertyGetter(propName, _propName), buildPropertySetter(propName, _propName))
        }
      }catch(error) {
        tent.log.warn("Error intercepting property '" + propName + "': " + error)
      }
    }
    return this
  };
  tent.changes.Observable.prototype.isDOMObject = function() {
    if(typeof this._isDomObject == "undefined") {
      this._isDOMObject = tent.isDOMObject(this.subject)
    }
    return this._isDOMObject
  };
  tent.changes.Observable.prototype.interceptArrayModifiers = function(options) {
    if(!this.subject instanceof Array) {
      return this
    }
    var array = this.subject;
    this.subject.setLength = function(l) {
      if(this.length > l) {
        this.splice(l, this.length - l)
      }else {
        this.lengh = l
      }
    };
    this.interceptFunction("push", function() {
      var index = this.length;
      var itemsToAdd = Array.prototype.slice.call(arguments);
      this.__observable__.notifyChange(tent.changes.EventTypes.ADDING, {items:itemsToAdd, index:index, propertyName:this.__propertyName__});
      var notifyParent = this.__observable__.shouldNotifyParent();
      if(notifyParent) {
        this.__observable__.notifyParentChanging({type:tent.changes.EventTypes.ADDING, data:{items:itemsToAdd, index:index, propertyName:this.__propertyName__}})
      }
      this._push.apply(this, arguments);
      this.__observable__.notifyChange(tent.changes.EventTypes.ADDED, {items:itemsToAdd, index:index, propertyName:this.__propertyName__});
      if(notifyParent) {
        this.__observable__.notifyParentChanged({type:tent.changes.EventTypes.ADDED, data:{items:itemsToAdd, index:index, propertyName:this.__propertyName__}})
      }
    });
    this.interceptFunction("unshift", function() {
      var itemsToAdd = Array.prototype.slice.call(arguments);
      this.__observable__.notifyChange(tent.changes.EventTypes.ADDING, {items:itemsToAdd, index:0, propertyName:this.__propertyName__});
      var notifyParent = this.__observable__.shouldNotifyParent();
      if(notifyParent) {
        this.__observable__.notifyParentChanging({type:tent.changes.EventTypes.ADDING, data:{items:itemsToAdd, index:0, propertyName:this.__propertyName__}})
      }
      this._unshift.apply(this, arguments);
      this.__observable__.notifyChange(tent.changes.EventTypes.ADDED, {items:itemsToAdd, index:0, propertyName:this.__propertyName__});
      if(notifyParent) {
        this.__observable__.notifyParentChanged({type:tent.changes.EventTypes.ADDED, data:{items:itemsToAdd, index:0, propertyName:this.__propertyName__}})
      }
    });
    this.interceptFunction("pop", function() {
      var index = this.length - 1;
      this.__observable__.notifyChange(tent.changes.EventTypes.REMOVING, {items:[this[index]], index:index, propertyName:this.__propertyName__});
      var notifyParent = this.__observable__.shouldNotifyParent();
      if(notifyParent) {
        this.__observable__.notifyParentChanging({type:tent.changes.EventTypes.REMOVING, data:{items:[this[index]], index:index, propertyName:this.__propertyName__}})
      }
      var item = this._pop();
      this.__observable__.notifyChange(tent.changes.EventTypes.REMOVED, {items:[item], index:index, propertyName:this.__propertyName__});
      if(notifyParent) {
        this.__observable__.notifyParentChanged({type:tent.changes.EventTypes.REMOVED, data:{items:[item], index:index, propertyName:this.__propertyName__}})
      }
      return item
    });
    this.interceptFunction("shift", function() {
      this.__observable__.notifyChange(tent.changes.EventTypes.REMOVING, {items:[this[0]], index:0, propertyName:this.__propertyName__});
      var notifyParent = this.__observable__.shouldNotifyParent();
      if(notifyParent) {
        this.__observable__.notifyParentChanging({type:tent.changes.EventTypes.REMOVING, data:{items:[this[0]], index:0, propertyName:this.__propertyName__}})
      }
      var item = this._shift();
      this.__observable__.notifyChange(tent.changes.EventTypes.REMOVED, {items:[item], index:0, propertyName:this.__propertyName__});
      if(notifyParent) {
        this.__observable__.notifyParentChanged({type:tent.changes.EventTypes.REMOVED, data:{items:[item], index:0, propertyName:this.__propertyName__}})
      }
      return item
    });
    this.interceptFunction("splice", function(start, deleteCnt) {
      var itemsToAdd;
      var notifyParent = this.__observable__.shouldNotifyParent();
      if(deleteCnt && deleteCnt > 0) {
        this.__observable__.notifyChange(tent.changes.EventTypes.REMOVING, {items:this.slice(start, start + deleteCnt), index:start, propertyName:this.__propertyName__});
        if(notifyParent) {
          this.__observable__.notifyParentChanging({type:tent.changes.EventTypes.REMOVING, data:{items:this.slice(start, start + deleteCnt), index:start, propertyName:this.__propertyName__}})
        }
      }
      if(arguments.length > 2) {
        itemsToAdd = Array.prototype.slice.call(arguments, 2);
        this.__observable__.notifyChange(tent.changes.EventTypes.ADDING, {items:itemsToAdd, index:start, propertyName:this.__propertyName__});
        if(notifyParent) {
          this.__observable__.notifyParentChanging({type:tent.changes.EventTypes.ADDING, data:{items:itemsToAdd, index:start, propertyName:this.__propertyName__}})
        }
      }
      if(itemsToAdd && itemsToAdd.length > 0) {
        var spliceArgs = itemsToAdd.slice(0);
        spliceArgs.unshift(start, deleteCnt);
        var removedItems = this._splice.apply(this, spliceArgs)
      }else {
        var removedItems = this._splice(start, deleteCnt)
      }
      if(removedItems && removedItems.length > 0) {
        this.__observable__.notifyChange(tent.changes.EventTypes.REMOVED, {items:removedItems, index:start, propertyName:this.__propertyName__});
        if(notifyParent) {
          this.__observable__.notifyParentChanged({type:tent.changes.EventTypes.REMOVED, data:{items:removedItems, index:start, propertyName:this.__propertyName__}})
        }
      }
      if(arguments.length > 2) {
        this.__observable__.notifyChange(tent.changes.EventTypes.ADDED, {items:itemsToAdd, index:start, propertyName:this.__propertyName__});
        if(notifyParent) {
          this.__observable__.notifyParentChanged({type:tent.changes.EventTypes.ADDED, data:{items:itemsToAdd, index:start, propertyName:this.__propertyName__}})
        }
      }
      return removedItems
    });
    array.remove = tent.arrays.functions.remove;
    array.set = tent.arrays.functions.set;
    if(!array.indexOf) {
      array.indexOf = tent.arrays.functions.indexOf
    }
    if(!array.lastIndexOf) {
      array.lastIndexOf = tent.arrays.functions.lastIndexOf
    }
    return this
  };
  tent.changes.Observable.prototype.removeInterceptor = function(name) {
    var interceptor = this.interceptors[name];
    if(interceptor._name) {
      if(interceptor.type != tent.changes.InterceptorTypes.FUNCTION) {
        try {
          delete this.subject[interceptor.name]
        }catch(error) {
          tent.log.warn("Error deleting property interceptor '" + interceptor.name + "': " + error)
        }
        var mode = tent.changes.getPropertyInterceptMode();
        if(mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTY || mode == tent.changes.PropertyInterceptModes.DEFINEPROPERTYONLYDOM && tent.isDOMObject(this.subject)) {
          if(interceptor.descriptor && interceptor.descriptor.name) {
            Object.defineProperty(this.subject, name, interceptor.descriptor)
          }
        }else {
          if(mode == tent.changes.PropertyInterceptModes.DEFINESETTER) {
            if(interceptor.getter) {
              this.subject.__defineGetter__(name, interceptor.getter)
            }
            if(interceptor.setter) {
              this.subject.__defineSetter__(name, interceptor.setter)
            }
          }else {
          }
        }
      }
      var domObject;
      try {
        this.subject[interceptor.name] = this.subject[interceptor._name]
      }catch(error) {
        domObject = tent.isDOMObject(this.subject);
        if(!domObject) {
          tent.log.warn("Error restoring property '" + interceptor.name + "' value: " + error)
        }
      }
      try {
        delete this.subject[interceptor._name]
      }catch(error) {
        tent.log.warn("Error deleting back storage property '" + interceptor._name + "': " + error)
      }
    }else {
      if(interceptor.type != tent.changes.InterceptorTypes.FUNCTION) {
        var val = this.subject[interceptor.name];
        delete this.subject[interceptor.name];
        this.subject[interceptor.name] = val
      }
    }
    delete interceptor[name]
  };
  tent.changes.Observable.prototype.removeInterceptors = function() {
    for(var propName in this.interceptors) {
      try {
        this.removeInterceptor(propName)
      }catch(error) {
        tent.log.warn("Error removing interceptor from property '" + propName + "': " + error)
      }
    }
    this.interceptors = {}
  };
  tent.changes.Observable.prototype.suspend = function() {
    this.suspended = true
  };
  tent.changes.Observable.prototype.resume = function() {
    this.suspended = false;
    if(this.changesWhileSuspended) {
      if(this.changesWhileSuspended.length < 5) {
        for(var i = 0, l = this.changesWhileSuspended.length;i < l;i++) {
          this.notifyChange(this.changesWhileSuspended[i])
        }
      }else {
        if(this.changesWhileSuspended.length > 1) {
          this.notifyChange(tent.changes.EventTypes.MANYCHANGES, this.changesWhileSuspended)
        }
      }
      delete this.changesWhileSuspended
    }
  };
  tent.changes.Observable.prototype.isValidHandler = function(handler) {
    if(!handler) {
      return false
    }
    if(typeof handler == "function" || typeof handler == "object" && typeof handler.handle == "function") {
      return true
    }
    return false
  };
  tent.changes.Observable.prototype.bind = function(eventType, handler) {
    if(!handler) {
      if(this.isValidHandler(eventType)) {
        handler = eventType;
        eventType = tent.changes.EventTypes.ANY
      }else {
        throw"must specify a handler: function (Change) or and object with a handle(Change) function";
      }
    }
    if(!this.isValidHandler(handler)) {
      throw"must specify a handler: function (Change) or and object with a handle(Change) function";
    }
    if(!eventType) {
      eventType = tent.changes.EventTypes.ANY
    }
    var ehandlers = this.handlers[eventType];
    if(!ehandlers) {
      ehandlers = this.handlers[eventType] = []
    }
    for(var i = 0;i < ehandlers.length;i++) {
      if(ehandlers[i] == handler) {
        return false
      }
    }
    this.handlers[eventType].push(handler);
    return true
  };
  tent.changes.Observable.prototype.unbind = function(eventType, handler) {
    if(!handler) {
      if(this.isValidHandler(eventType)) {
        handler = eventType;
        eventType = tent.changes.EventTypes.ANY
      }else {
        throw"must specify a handler to remove";
      }
    }
    if(!this.isValidHandler(handler)) {
      throw"must specify a handler to remove";
    }
    if(!eventType) {
      eventType = tent.changes.EventTypes.ANY
    }
    var ehandlers = this.handlers[eventType];
    var removed = false;
    if(ehandlers) {
      for(var i = 0, l = ehandlers.length;i < l;i++) {
        if(ehandlers[i] == handler) {
          ehandlers.splice(i, 1);
          i--;
          l--;
          removed = true
        }
      }
    }
    return removed
  };
  tent.changes.Observable.prototype.unbindWhere = function(filter) {
    var changed = false;
    for(var eventType in this.handlers) {
      var ehandlers = this.handlers[eventType];
      for(var i = 0, l = ehandlers.length;i < l;i++) {
        if(filter(ehandlers[i])) {
          ehandlers.splice(i, 1);
          i--;
          l--;
          changed = true
        }
      }
    }
    return changed
  };
  tent.changes.Observable.prototype.notifyHandler = function(change, handler) {
    try {
      if(typeof handler == "function") {
        return handler.call(this.subject, change)
      }else {
        return handler.handle(change)
      }
    }catch(err) {
      var message = "";
      if(err.stack) {
        message += err.stack
      }else {
        if(err.message) {
          message += err.message
        }
      }
      tent.log.error("Change Handler Error: " + err + (message ? "\n" + message : ""));
      return err
    }
  };
  tent.changes.Observable.prototype.notifyChange = function(eventType, data) {
    if(this.suspended) {
      if(!this.changesWhileSuspended) {
        this.changesWhileSuspended = [];
        if(!this.changesWhileSuspended.filter) {
          this.changesWhileSuspended.filter = tent.arrays.functions.filter
        }
        this.changesWhileSuspended.findByEventType = function() {
          for(var i = 0, l = this.length;i < l;i++) {
            for(var ai = 0, al = arguments.length;ai < al;ai++) {
              if(this[i].eventType == arguments[ai]) {
                return this[i]
              }
            }
          }
        };
        this.changesWhileSuspended.findPropertyChanged = function(subject, propertyName) {
          for(var i = 0, l = this.length;i < l;i++) {
            if(this[i].subject == subject && this[i].eventType == tent.changes.EventTypes.CHANGED && this[i].data.propertyName == propertyName) {
              return this[i]
            }
          }
        };
        this.changesWhileSuspended.findArrayChanged = function(array) {
          for(var i = 0, l = this.length;i < l;i++) {
            if(this[i].subject == subject && (this[i].eventType == tent.changes.EventTypes.ADDED || this[i].eventType == tent.changes.EventTypes.REMOVED)) {
              return this[i]
            }
          }
        }
      }
      this.changesWhileSuspended.push(new tent.changes.Change(this.subject, eventType, data));
      return
    }
    var change;
    if(eventType instanceof tent.changes.Change) {
      change = eventType
    }else {
      change = new tent.changes.Change(this.subject, eventType, data)
    }
    var ehandlers = this.handlers[eventType];
    if(ehandlers) {
      for(var i = 0, l = ehandlers.length;i < l;i++) {
        this.notifyHandler(change, ehandlers[i])
      }
    }
    ehandlers = this.handlers[tent.changes.EventTypes.ANY];
    if(ehandlers) {
      for(var i = 0, l = ehandlers.length;i < l;i++) {
        this.notifyHandler(change, ehandlers[i])
      }
    }
  };
  var defaultLogHandler;
  tent.changes.Observable.prototype.log = function(enable) {
    if(typeof enable == "undefined") {
      enable = true
    }
    if(enable) {
      if(!defaultLogHandler) {
        defaultLogHandler = new tent.changes.LogHandler
      }
      return this.bind(defaultLogHandler)
    }else {
      if(defaultLogHandler) {
        return this.unbind(defaultLogHandler)
      }
    }
    return false
  };
  tent.changes.LogHandler = function LogHandler(prefix) {
    if(typeof prefix == "undefined") {
      prefix = ""
    }else {
      if(prefix && prefix[prefix.length - 1] != " ") {
        prefix += " "
      }
    }
    this.prefix = prefix
  };
  tent.changes.LogHandler.prototype.handle = function(change) {
    tent.log.info(this.prefix + change.toString())
  };
  var buildLivePropagateHandler = function(options) {
    var propagateOptions = {};
    for(opName in options) {
      if(opName != "deepStack" && opName != "liveHandler") {
        propagateOptions[opName] = options[opName]
      }
    }
    var f = function(change) {
      if(change.eventType == tent.changes.EventTypes.CHANGED) {
        if(typeof change.data.current == "object") {
          if(propagateOptions.deepOverDOM || !tent.isDOMObject(change.data.current)) {
            propagateOptions.deepStack = [change.data.subject];
            tent.changes.track(change.data.current, propagateOptions);
            delete propagateOptions.deepStack
          }
        }
      }else {
        if(change.eventType == tent.changes.EventTypes.ADDED) {
          for(var i = 0, l = change.data.items.length;i < l;i++) {
            if(typeof change.data.items[i] == "object") {
              if(propagateOptions.deepOverDOM || !tent.isDOMObject(change.data.current)) {
                propagateOptions.deepStack = [change.data.subject];
                tent.changes.track(change.data.items[i], propagateOptions);
                delete propagateOptions.deepStack
              }
            }
          }
        }
      }
    };
    f.isLivePropagator = true;
    return f
  };
  tent.changes.track = function(obj, options) {
    if(!options) {
      options = {}
    }
    if(typeof obj != "object") {
      if(!options.deepStack) {
        throw"Cannot track changes of " + typeof obj;
      }
      return false
    }else {
      if(obj == null) {
        if(!options.deepStack) {
          throw"Cannot track changes of null";
        }
        return false
      }
    }
    if(options.attachedObjects === false && obj.__collection__) {
      return false
    }
    var isArray = obj instanceof Array;
    var changed = false;
    if(!options.remove && !options.removeAll && !obj.__observable__) {
      if(options.observable && (!options.observable.subject || options.observable.subject == obj)) {
        obj.__observable__ = options.observable;
        obj.__observable__.subject = obj
      }else {
        obj.__observable__ = new tent.changes.Observable(obj)
      }
      changed = true;
      if(!options.interceptOptions) {
        options.interceptOptions = {}
      }
      if(isArray) {
        obj.__observable__.interceptArrayModifiers(options.interceptOptions)
      }else {
        obj.__observable__.interceptProperties(options.interceptOptions)
      }
    }
    if(options.parentObject && typeof options.parentObjectPropertyName) {
      if(obj.__observable__.parentObject !== options.parentObject) {
        obj.__observable__.parentObject = options.parentObject;
        changed = true
      }
      if(obj.__observable__.parentObjectPropertyName !== options.parentObjectPropertyName) {
        obj.__observable__.parentObjectPropertyName = options.parentObjectPropertyName;
        changed = true
      }
    }else {
      if(options.parentObject === false) {
        if(typeof obj.__observable__.parentObject != "undefined") {
          delete obj.__observable__.parentObject;
          changed = true
        }
        if(obj.__observable__.parentObjectPropertyName != "undefined") {
          delete obj.__observable__.parentObjectPropertyName;
          changed = true
        }
      }
    }
    if(options.bindings) {
      for(var i = 0, l = options.bindings.length;i < l;i++) {
        var binding = options.bindings[i];
        if(isArray && binding.bindArrays != false || !isArray && binding.bindObjects != false) {
          if(options.remove) {
            if(obj.__observable__ && obj.__observable__.unbind(binding.eventType, binding.handler)) {
              changed = true
            }
          }else {
            if(obj.__observable__.bind(binding.eventType, binding.handler)) {
              changed = true
            }
          }
        }
      }
    }
    if(options.log) {
      if(obj.__observable__ && obj.__observable__.log(!options.remove)) {
        changed = true
      }
    }
    if(options.reverseProperties) {
      if(options.remove) {
        if(obj.__observable__ && obj.__observable__.unbind(tent.changes.reverseProperties.getHandler())) {
          changed = true
        }
      }else {
        if(obj.__observable__.bind(tent.changes.reverseProperties.getHandler())) {
          changed = true
        }
      }
    }
    if(options.removeAll && obj.__observable__) {
      obj.__observable__.removeInterceptors();
      delete obj.__observable__.subject;
      delete obj.__observable__;
      changed = true
    }
    if(options.deep && options.live && !options.remove) {
      if(options.remove) {
        if(obj.__observable__.unbindWhere(function(l) {
          return l.isLivePropagator
        })) {
          changed = true
        }
      }else {
        if(!options.liveHandler) {
          options.liveHandler = buildLivePropagateHandler(options)
        }
        if(obj.__observable__.bind(options.liveHandler)) {
          changed = true
        }
      }
    }
    if(options.deep) {
      if(!options.deepStack) {
        options.deepStack = [obj];
        if(!options.deepStack.lastIndexOf) {
          options.deepStack.lastIndexOf = tent.arrays.functions.lastIndexOf
        }
      }else {
        options.deepStack.push(obj)
      }
      if(isArray) {
        for(var i = 0, l = obj.length;i < l;i++) {
          var subObj = obj[i];
          if(subObj && typeof subObj == "object" && options.deepStack.lastIndexOf(subObj) < 0) {
            if(tent.changes.track(subObj, options)) {
              changed = true
            }
          }
        }
      }else {
        var filter = options.propertyFilter || defaultPropertyInterceptFilter;
        var backPropertyPrefix = options.backPropertyPrefix || defaultBackPropertyPrefix;
        for(var propName in obj) {
          var valueType;
          if((valueType = typeof obj[propName]) != "function" && filter(obj, propName)) {
            var subObj = obj[propName];
            if(options.deepOverDOM || !tent.isDOMObject(subObj)) {
              if(typeof subObj == "object" && options.deepStack.lastIndexOf(subObj) < 0) {
                if(tent.changes.track(subObj, options)) {
                  changed = true
                }
              }
            }
          }
        }
      }
      options.deepStack.pop()
    }
    return changed
  };
  tent.changes.untrack = function(obj, options) {
    if(!options) {
      options = {removeAll:true}
    }else {
      if(!options.removeAll) {
        options.removeAll = true
      }
    }
    return tent.changes.track(obj, options)
  };
  tent.changes.isTracked = function(obj) {
    return obj.__observable__ && obj.__observable__ instanceof tent.changes.Observable
  };
  tent.changes.bind = function(obj, options) {
    var eventType;
    if(typeof options == "string") {
      var eventType = options;
      options = {bindings:[]}
    }else {
      if(typeof options == "function") {
        options = {bindings:[{handler:options}]}
      }else {
        if(typeof options == "object" && typeof options.handle == "function") {
          options = {bindings:[{handler:options}]}
        }
      }
    }
    if(arguments.length > 2) {
      if(!options) {
        options = {bindings:[]}
      }else {
        if(!options.bindings) {
          options.bindings = []
        }
      }
      for(var i = 2;i < arguments.length;i++) {
        options.bindings.push({eventType:eventType, handler:arguments[i]})
      }
    }
    return tent.changes.track(obj, options)
  };
  tent.changes.unbind = function(obj, options) {
    var eventType;
    if(typeof options == "string") {
      var eventType = options;
      options = {bindings:[]}
    }else {
      if(typeof options == "function") {
        options = {bindings:[{handler:options}]}
      }else {
        if(typeof options == "object" && typeof options.handle == "function") {
          options = {bindings:[{handler:options}]}
        }
      }
    }
    if(arguments.length > 2) {
      if(!options) {
        options = {bindings:[]}
      }else {
        if(!options.bindings) {
          options.bindings = []
        }
      }
      for(var i = 2;i < arguments.length;i++) {
        options.bindings.push({eventType:eventType, handler:arguments[i]})
      }
    }
    if(!options) {
      options = {remove:true}
    }else {
      if(!options.remove) {
        options.remove = true
      }
    }
    return tent.changes.track(obj, options)
  }
});tent.declare("tent.changes.reverseProperties", function() {
  tent.changes.reverseProperties.setReverseProperty = function(obj, name, prop) {
    if(!prop) {
      prop = {}
    }
    if(!prop.cardinality) {
      prop.cardinality = "11"
    }else {
      prop.cardinality = prop.cardinality.toLowerCase()
    }
    if(!prop.reverse) {
      prop.reverse = name + "Of"
    }
    var reverseProp = {name:prop.reverse, cardinality:prop.cardinality};
    if(prop.cardinality.substr(0, 1) === "n" || prop.cardinality.substr(0, 1) === "m") {
      reverseProp.isArray = true
    }
    if(!obj.__reverseProperties__) {
      obj.__reverseProperties__ = {}
    }
    if(prop.cardinality.substr(1, 1) === "n" || prop.cardinality.substr(1, 1) === "m") {
      if(typeof obj[name] == "undefined" || !(obj[name] instanceof Array)) {
        obj[name] = []
      }
      obj.__reverseProperties__[name] = reverseProp;
      obj[name].__parent__ = obj;
      obj[name].__reverseProperty__ = reverseProp
    }else {
      if(typeof obj[name] == "undefined") {
        obj[name] = null
      }
      obj.__reverseProperties__[name] = reverseProp
    }
  };
  tent.changes.reverseProperties.setReverseProperties = function(obj, properties) {
    if(properties) {
      for(var name in properties) {
        if(properties[name].reverse) {
          tent.changes.reverseProperties.setReverseProperty(obj, name, properties[name])
        }
      }
    }
  };
  tent.changes.reverseProperties.Set = function Set(properties) {
    this.properties = properties
  };
  tent.changes.reverseProperties.Set.prototype.create = function() {
    var obj = {};
    this.applyTo(obj);
    return obj
  };
  tent.changes.reverseProperties.Set.prototype.applyTo = function() {
    var result = [];
    result.bind = function(options) {
      if(!options) {
        options = {}
      }
      options.reverseProperties = true;
      for(var i = 0;i < this.length;i++) {
        var obj = this[i];
        if(obj.__reverseProperties__) {
          tent.changes.bind(obj, options);
          var revProps = obj.__reverseProperties__;
          for(var propName in revProps) {
            if(revProps.hasOwnProperty(propName)) {
              if(revProps[propName].cardinality && (revProps[propName].cardinality[1] == "n" || revProps[propName].cardinality[1] == "m")) {
                if(!(obj[propName] instanceof Array)) {
                  obj[propName] = [];
                  obj[propName].__parent__ = obj;
                  obj[propName].__reverseProperty__ = obj.__reverseProperties__[propName]
                }
                tent.changes.bind(obj[propName], options)
              }
            }
          }
        }
      }
    };
    if(this.properties) {
      for(var i = 0;i < arguments.length;i++) {
        tent.changes.reverseProperties.setReverseProperties(arguments[i], this.properties)
      }
      result.push.apply(result, arguments)
    }
    return result
  };
  var reversePropertyHandler;
  tent.changes.reverseProperties.getHandler = function() {
    if(!reversePropertyHandler) {
      reversePropertyHandler = function(change) {
        if(change.eventType == tent.changes.EventTypes.ADDED) {
          var items = change.data.items;
          if(items && change.subject && change.subject.__reverseProperty__) {
            var reverseProp = change.subject.__reverseProperty__;
            var parent = change.subject.__parent__;
            for(var i = 0, l = items.length;i < l;i++) {
              var item = items[i];
              if(reverseProp.isArray) {
                if(!item[reverseProp.name]) {
                  item[reverseProp.name] = []
                }
                if(item[reverseProp.name].indexOf(parent) < 0) {
                  item[reverseProp.name].push(parent)
                }
              }else {
                if(item[reverseProp.name] != parent) {
                  if(typeof item[reverseProp.name] != "undefined" && item[reverseProp.name] != null) {
                    throw new Error("this." + reverseProp.name + " is set. Remove this from its current array before adding it to this array");
                  }
                  item[reverseProp.name] = parent
                }
              }
            }
          }
        }else {
          if(change.eventType == tent.changes.EventTypes.REMOVED) {
            var items = change.data.items;
            if(items && change.subject && change.subject.__reverseProperty__) {
              var reverseProp = change.subject.__reverseProperty__;
              var parent = change.subject.__parent__;
              for(var i = 0, l = items.length;i < l;i++) {
                var item = items[i];
                if(reverseProp.isArray) {
                  var reverseArray = item[reverseProp.name];
                  if(reverseArray) {
                    for(var ii = 0, ll = reverseArray.length;ii < ll;ii++) {
                      if(reverseArray[ii] === parent) {
                        reverseArray.splice(ii, 1);
                        ii--;
                        ll--
                      }
                    }
                  }
                }else {
                  if(item[reverseProp.name] === parent) {
                    item[reverseProp.name] = null
                  }
                }
              }
            }
          }else {
            if(change.eventType == tent.changes.EventTypes.CHANGED) {
              var items = change.data.items;
              if(change.data.propertyName && change.subject && change.subject.__reverseProperties__) {
                var reverseProp = change.subject.__reverseProperties__[change.data.propertyName];
                if(reverseProp) {
                  var item;
                  if(reverseProp.isArray) {
                    if(item = change.data.oldValue) {
                      var reverseArray = item[reverseProp.name];
                      if(reverseArray instanceof Array) {
                        for(var i = 0, l = reverseArray.length;i < l;i++) {
                          if(reverseArray[i] === change.subject) {
                            reverseArray.splice(i, 1);
                            i--;
                            l--
                          }
                        }
                      }
                    }
                    if(item = change.data.current) {
                      if(!item[reverseProp.name]) {
                        item[reverseProp.name] = []
                      }
                      if(item[reverseProp.name] instanceof Array) {
                        if(item[reverseProp.name].indexOf(change.subject) < 0) {
                          item[reverseProp.name].push(change.subject)
                        }
                      }
                    }
                  }else {
                    if(item = change.data.oldValue) {
                      if(item[reverseProp.name] == change.subject) {
                        item[reverseProp.name] = null
                      }
                    }
                    if(item = change.data.current) {
                      if(item[reverseProp.name] != change.subject) {
                        item[reverseProp.name] = change.subject
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return reversePropertyHandler
  }
});

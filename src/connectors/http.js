/**
 * @requires tent.connectors
 * @name tent.connectors.http
 * @namespace HTTP utilities
 */
tent.declare('tent.connectors.http', function(){

    /**
     * Combines URIs
     * @return {String} the URI that combines all arguments
     */
    tent.connectors.http.uriCombine = function(){
        var uri = '';
        for (var i = 0, l = arguments.length; i < l; i++) {
            var strarg;
			if (typeof arguments[i] == 'undefined' || arguments[i]=== null){
				strarg = '';
			} else {
				strarg = arguments[i] + '';
			}
            if (strarg) {
            
                if (strarg.match(/^[A-Za-z]+\:\/\//)) {
                    // is absolute, replace current uri
                    uri = strarg;
                }
                else {
                    // strip base uri query and hash
                    var stripIndex = uri.indexOf('?');
                    var hashIndex = uri.indexOf('#');
                    if ((hashIndex >= 0) && (stripIndex < 0 || stripIndex > hashIndex)) {
                        stripIndex = hashIndex;
                    }
                    if (stripIndex >= 0) {
                        uri = uri.substr(0, stripIndex);
                    }
                    
                    if (uri.substr(uri.length - 1, 1) == '/') {
                        if (strarg.substr(0, 1) == '/') {
                            uri += strarg.substr(1);
                        }
                        else 
                            if (strarg.substr(0, 2) == './') {
                                uri += strarg.substr(2);
                            }
                            else {
                                uri += strarg;
                            }
                    }
                    else {
                        if (strarg.substr(0, 1) == '/') {
                            uri += strarg;
                        }
                        else 
                            if (strarg.substr(0, 2) == './') {
                                uri += strarg.substr(1);
                            }
                            else {
                                uri += '/' + strarg;
                            }
                    }
                }
            }
        }
        return uri;
    };
    
    /**
     * Default options for http requests
     */
    tent.connectors.http.requestDefaultOptions = {
        type: 'GET',
        cache: false
    };
    
    /**
     * Makes an HTTP request using node.js libraries
     * @param {Object} options
     * @param {function()} callback
     */
    tent.connectors.http.request_nodejs = function(options, callback){
        throw 'http request using node.js not implemented'
    };
    
    /**
     * Makes an HTTP request using jQuery.ajax
     * @param {Object} options
     * @param {function()} callback
     */
    tent.connectors.http.request_jquery = function(options, callback){
    
        if (typeof jQuery == 'undefined') {
            throw 'jQuery is required for ajax requests';
        }
        
        var opt = tent.combineOptions(tent.connectors.http.requestDefaultOptions, options);
        
        jQuery.ajax({
            context: {
				options: opt,
				callback: callback
			},
            url: tent.connectors.http.uriCombine(opt.baseUrl, opt.url),
            beforeSend: function(req){
                if (opt.auth) {
                    if (typeof Base64 == 'undefined') {
                        throw 'Base64 is required for http basic authentication';
                    }
                    var usrpwd64 = Base64.encode(opt.username + ':' + opt.password)
                    req.setRequestHeader("Origin", document.location.protocol + "//" + document.location.host);
                    req.setRequestHeader("Authorization", "Basic " + usrpwd64);
                }
            },
            type: opt.type,
            cache: !!opt.cache,
            dataType: 'json',
			contentType: 'application/json',
            data: JSON.stringify(opt.data),
            headers: opt.headers,
            timeout: opt.timeout,
            username: opt.username,
            password: opt.password,
            success: function(data, textStatus, req){
                if (typeof this.callback == 'function') {
                    this.callback({
						ok: true,
						data: data,
						req: req
					});
                }
            },
            error: function(req, textStatus, error){
                if (typeof this.callback == 'function') {
                    this.callback({
						error: error || 'error',
						req: req
					});
                }
            }
        });
    };
    
    /**
     * Makes an HTTP request
     * @param {Object} options
     * @param {function()} callback
     */
    tent.connectors.http.request = tent.connectors.http.request_jquery;
    
});


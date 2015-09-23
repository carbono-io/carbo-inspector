(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":5,"./lib/stringify":9}],5:[function(require,module,exports){
// http://www.w3.org/TR/CSS21/grammar.html
// https://github.com/visionmedia/css-parse/pull/49#issuecomment-30088027
var commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g

module.exports = function(css, options){
  options = options || {};

  /**
   * Positional.
   */

  var lineno = 1;
  var column = 1;

  /**
   * Update lineno and column based on `str`.
   */

  function updatePosition(str) {
    var lines = str.match(/\n/g);
    if (lines) lineno += lines.length;
    var i = str.lastIndexOf('\n');
    column = ~i ? str.length - i : column + str.length;
  }

  /**
   * Mark position and patch `node.position`.
   */

  function position() {
    var start = { line: lineno, column: column };
    return function(node){
      node.position = new Position(start);
      whitespace();
      return node;
    };
  }

  /**
   * Store position information for a node
   */

  function Position(start) {
    this.start = start;
    this.end = { line: lineno, column: column };
    this.source = options.source;
  }

  /**
   * Non-enumerable source string
   */

  Position.prototype.content = css;

  /**
   * Error `msg`.
   */

  var errorsList = [];

  function error(msg) {
    var err = new Error(options.source + ':' + lineno + ':' + column + ': ' + msg);
    err.reason = msg;
    err.filename = options.source;
    err.line = lineno;
    err.column = column;
    err.source = css;

    if (options.silent) {
      errorsList.push(err);
    } else {
      throw err;
    }
  }

  /**
   * Parse stylesheet.
   */

  function stylesheet() {
    var rulesList = rules();

    return {
      type: 'stylesheet',
      stylesheet: {
        rules: rulesList,
        parsingErrors: errorsList
      }
    };
  }

  /**
   * Opening brace.
   */

  function open() {
    return match(/^{\s*/);
  }

  /**
   * Closing brace.
   */

  function close() {
    return match(/^}/);
  }

  /**
   * Parse ruleset.
   */

  function rules() {
    var node;
    var rules = [];
    whitespace();
    comments(rules);
    while (css.length && css.charAt(0) != '}' && (node = atrule() || rule())) {
      if (node !== false) {
        rules.push(node);
        comments(rules);
      }
    }
    return rules;
  }

  /**
   * Match `re` and return captures.
   */

  function match(re) {
    var m = re.exec(css);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  }

  /**
   * Parse whitespace.
   */

  function whitespace() {
    match(/^\s*/);
  }

  /**
   * Parse comments;
   */

  function comments(rules) {
    var c;
    rules = rules || [];
    while (c = comment()) {
      if (c !== false) {
        rules.push(c);
      }
    }
    return rules;
  }

  /**
   * Parse comment.
   */

  function comment() {
    var pos = position();
    if ('/' != css.charAt(0) || '*' != css.charAt(1)) return;

    var i = 2;
    while ("" != css.charAt(i) && ('*' != css.charAt(i) || '/' != css.charAt(i + 1))) ++i;
    i += 2;

    if ("" === css.charAt(i-1)) {
      return error('End of comment missing');
    }

    var str = css.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    css = css.slice(i);
    column += 2;

    return pos({
      type: 'comment',
      comment: str
    });
  }

  /**
   * Parse selector.
   */

  function selector() {
    var m = match(/^([^{]+)/);
    if (!m) return;
    /* @fix Remove all comments from selectors
     * http://ostermiller.org/findcomment.html */
    return trim(m[0])
      .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
      .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function(m) {
        return m.replace(/,/g, '\u200C');
      })
      .split(/\s*(?![^(]*\)),\s*/)
      .map(function(s) {
        return s.replace(/\u200C/g, ',');
      });
  }

  /**
   * Parse declaration.
   */

  function declaration() {
    var pos = position();

    // prop
    var prop = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
    if (!prop) return;
    prop = trim(prop[0]);

    // :
    if (!match(/^:\s*/)) return error("property missing ':'");

    // val
    var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);

    var ret = pos({
      type: 'declaration',
      property: prop.replace(commentre, ''),
      value: val ? trim(val[0]).replace(commentre, '') : ''
    });

    // ;
    match(/^[;\s]*/);

    return ret;
  }

  /**
   * Parse declarations.
   */

  function declarations() {
    var decls = [];

    if (!open()) return error("missing '{'");
    comments(decls);

    // declarations
    var decl;
    while (decl = declaration()) {
      if (decl !== false) {
        decls.push(decl);
        comments(decls);
      }
    }

    if (!close()) return error("missing '}'");
    return decls;
  }

  /**
   * Parse keyframe.
   */

  function keyframe() {
    var m;
    var vals = [];
    var pos = position();

    while (m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/)) {
      vals.push(m[1]);
      match(/^,\s*/);
    }

    if (!vals.length) return;

    return pos({
      type: 'keyframe',
      values: vals,
      declarations: declarations()
    });
  }

  /**
   * Parse keyframes.
   */

  function atkeyframes() {
    var pos = position();
    var m = match(/^@([-\w]+)?keyframes\s*/);

    if (!m) return;
    var vendor = m[1];

    // identifier
    var m = match(/^([-\w]+)\s*/);
    if (!m) return error("@keyframes missing name");
    var name = m[1];

    if (!open()) return error("@keyframes missing '{'");

    var frame;
    var frames = comments();
    while (frame = keyframe()) {
      frames.push(frame);
      frames = frames.concat(comments());
    }

    if (!close()) return error("@keyframes missing '}'");

    return pos({
      type: 'keyframes',
      name: name,
      vendor: vendor,
      keyframes: frames
    });
  }

  /**
   * Parse supports.
   */

  function atsupports() {
    var pos = position();
    var m = match(/^@supports *([^{]+)/);

    if (!m) return;
    var supports = trim(m[1]);

    if (!open()) return error("@supports missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@supports missing '}'");

    return pos({
      type: 'supports',
      supports: supports,
      rules: style
    });
  }

  /**
   * Parse host.
   */

  function athost() {
    var pos = position();
    var m = match(/^@host\s*/);

    if (!m) return;

    if (!open()) return error("@host missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@host missing '}'");

    return pos({
      type: 'host',
      rules: style
    });
  }

  /**
   * Parse media.
   */

  function atmedia() {
    var pos = position();
    var m = match(/^@media *([^{]+)/);

    if (!m) return;
    var media = trim(m[1]);

    if (!open()) return error("@media missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@media missing '}'");

    return pos({
      type: 'media',
      media: media,
      rules: style
    });
  }


  /**
   * Parse custom-media.
   */

  function atcustommedia() {
    var pos = position();
    var m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
    if (!m) return;

    return pos({
      type: 'custom-media',
      name: trim(m[1]),
      media: trim(m[2])
    });
  }

  /**
   * Parse paged media.
   */

  function atpage() {
    var pos = position();
    var m = match(/^@page */);
    if (!m) return;

    var sel = selector() || [];

    if (!open()) return error("@page missing '{'");
    var decls = comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error("@page missing '}'");

    return pos({
      type: 'page',
      selectors: sel,
      declarations: decls
    });
  }

  /**
   * Parse document.
   */

  function atdocument() {
    var pos = position();
    var m = match(/^@([-\w]+)?document *([^{]+)/);
    if (!m) return;

    var vendor = trim(m[1]);
    var doc = trim(m[2]);

    if (!open()) return error("@document missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@document missing '}'");

    return pos({
      type: 'document',
      document: doc,
      vendor: vendor,
      rules: style
    });
  }

  /**
   * Parse font-face.
   */

  function atfontface() {
    var pos = position();
    var m = match(/^@font-face\s*/);
    if (!m) return;

    if (!open()) return error("@font-face missing '{'");
    var decls = comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error("@font-face missing '}'");

    return pos({
      type: 'font-face',
      declarations: decls
    });
  }

  /**
   * Parse import
   */

  var atimport = _compileAtrule('import');

  /**
   * Parse charset
   */

  var atcharset = _compileAtrule('charset');

  /**
   * Parse namespace
   */

  var atnamespace = _compileAtrule('namespace');

  /**
   * Parse non-block at-rules
   */


  function _compileAtrule(name) {
    var re = new RegExp('^@' + name + '\\s*([^;]+);');
    return function() {
      var pos = position();
      var m = match(re);
      if (!m) return;
      var ret = { type: name };
      ret[name] = m[1].trim();
      return pos(ret);
    }
  }

  /**
   * Parse at rule.
   */

  function atrule() {
    if (css[0] != '@') return;

    return atkeyframes()
      || atmedia()
      || atcustommedia()
      || atsupports()
      || atimport()
      || atcharset()
      || atnamespace()
      || atdocument()
      || atpage()
      || athost()
      || atfontface();
  }

  /**
   * Parse rule.
   */

  function rule() {
    var pos = position();
    var sel = selector();

    if (!sel) return error('selector missing');
    comments();

    return pos({
      type: 'rule',
      selectors: sel,
      declarations: declarations()
    });
  }

  return addParent(stylesheet());
};

/**
 * Trim `str`.
 */

function trim(str) {
  return str ? str.replace(/^\s+|\s+$/g, '') : '';
}

/**
 * Adds non-enumerable parent node reference to each node.
 */

function addParent(obj, parent) {
  var isNode = obj && typeof obj.type === 'string';
  var childParent = isNode ? obj : parent;

  for (var k in obj) {
    var value = obj[k];
    if (Array.isArray(value)) {
      value.forEach(function(v) { addParent(v, childParent); });
    } else if (value && typeof value === 'object') {
      addParent(value, childParent);
    }
  }

  if (isNode) {
    Object.defineProperty(obj, 'parent', {
      configurable: true,
      writable: true,
      enumerable: false,
      value: parent || null
    });
  }

  return obj;
}

},{}],6:[function(require,module,exports){

/**
 * Expose `Compiler`.
 */

module.exports = Compiler;

/**
 * Initialize a compiler.
 *
 * @param {Type} name
 * @return {Type}
 * @api public
 */

function Compiler(opts) {
  this.options = opts || {};
}

/**
 * Emit `str`
 */

Compiler.prototype.emit = function(str) {
  return str;
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function(node){
  return this[node.type](node);
};

/**
 * Map visit over array of `nodes`, optionally using a `delim`
 */

Compiler.prototype.mapVisit = function(nodes, delim){
  var buf = '';
  delim = delim || '';

  for (var i = 0, length = nodes.length; i < length; i++) {
    buf += this.visit(nodes[i]);
    if (delim && i < length - 1) buf += this.emit(delim);
  }

  return buf;
};

},{}],7:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Base = require('./compiler');
var inherits = require('inherits');

/**
 * Expose compiler.
 */

module.exports = Compiler;

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  Base.call(this, options);
}

/**
 * Inherit from `Base.prototype`.
 */

inherits(Compiler, Base);

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return node.stylesheet
    .rules.map(this.visit, this)
    .join('');
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node){
  return this.emit('', node.position);
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node){
  return this.emit('@import ' + node.import + ';', node.position);
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node){
  return this.emit('@media ' + node.media, node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return this.emit(doc, node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  return this.emit('@charset ' + node.charset + ';', node.position);
};

/**
 * Visit namespace node.
 */

Compiler.prototype.namespace = function(node){
  return this.emit('@namespace ' + node.namespace + ';', node.position);
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return this.emit('@supports ' + node.supports, node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return this.emit('@'
    + (node.vendor || '')
    + 'keyframes '
    + node.name, node.position)
    + this.emit('{')
    + this.mapVisit(node.keyframes)
    + this.emit('}');
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return this.emit(node.values.join(','), node.position)
    + this.emit('{')
    + this.mapVisit(decls)
    + this.emit('}');
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ')
    : '';

  return this.emit('@page ' + sel, node.position)
    + this.emit('{')
    + this.mapVisit(node.declarations)
    + this.emit('}');
};

/**
 * Visit font-face node.
 */

Compiler.prototype['font-face'] = function(node){
  return this.emit('@font-face', node.position)
    + this.emit('{')
    + this.mapVisit(node.declarations)
    + this.emit('}');
};

/**
 * Visit host node.
 */

Compiler.prototype.host = function(node){
  return this.emit('@host', node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit custom-media node.
 */

Compiler.prototype['custom-media'] = function(node){
  return this.emit('@custom-media ' + node.name + ' ' + node.media + ';', node.position);
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var decls = node.declarations;
  if (!decls.length) return '';

  return this.emit(node.selectors.join(','), node.position)
    + this.emit('{')
    + this.mapVisit(decls)
    + this.emit('}');
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return this.emit(node.property + ':' + node.value, node.position) + this.emit(';');
};


},{"./compiler":6,"inherits":11}],8:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Base = require('./compiler');
var inherits = require('inherits');

/**
 * Expose compiler.
 */

module.exports = Compiler;

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  options = options || {};
  Base.call(this, options);
  this.indentation = options.indent;
}

/**
 * Inherit from `Base.prototype`.
 */

inherits(Compiler, Base);

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return this.stylesheet(node);
};

/**
 * Visit stylesheet node.
 */

Compiler.prototype.stylesheet = function(node){
  return this.mapVisit(node.stylesheet.rules, '\n\n');
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node){
  return this.emit(this.indent() + '/*' + node.comment + '*/', node.position);
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node){
  return this.emit('@import ' + node.import + ';', node.position);
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node){
  return this.emit('@media ' + node.media, node.position)
    + this.emit(
        ' {\n'
        + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return this.emit(doc, node.position)
    + this.emit(
        ' '
      + ' {\n'
      + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  return this.emit('@charset ' + node.charset + ';', node.position);
};

/**
 * Visit namespace node.
 */

Compiler.prototype.namespace = function(node){
  return this.emit('@namespace ' + node.namespace + ';', node.position);
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return this.emit('@supports ' + node.supports, node.position)
    + this.emit(
      ' {\n'
      + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return this.emit('@' + (node.vendor || '') + 'keyframes ' + node.name, node.position)
    + this.emit(
      ' {\n'
      + this.indent(1))
    + this.mapVisit(node.keyframes, '\n')
    + this.emit(
        this.indent(-1)
        + '}');
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return this.emit(this.indent())
    + this.emit(node.values.join(', '), node.position)
    + this.emit(
      ' {\n'
      + this.indent(1))
    + this.mapVisit(decls, '\n')
    + this.emit(
      this.indent(-1)
      + '\n'
      + this.indent() + '}\n');
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ') + ' '
    : '';

  return this.emit('@page ' + sel, node.position)
    + this.emit('{\n')
    + this.emit(this.indent(1))
    + this.mapVisit(node.declarations, '\n')
    + this.emit(this.indent(-1))
    + this.emit('\n}');
};

/**
 * Visit font-face node.
 */

Compiler.prototype['font-face'] = function(node){
  return this.emit('@font-face ', node.position)
    + this.emit('{\n')
    + this.emit(this.indent(1))
    + this.mapVisit(node.declarations, '\n')
    + this.emit(this.indent(-1))
    + this.emit('\n}');
};

/**
 * Visit host node.
 */

Compiler.prototype.host = function(node){
  return this.emit('@host', node.position)
    + this.emit(
        ' {\n'
        + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit custom-media node.
 */

Compiler.prototype['custom-media'] = function(node){
  return this.emit('@custom-media ' + node.name + ' ' + node.media + ';', node.position);
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var indent = this.indent();
  var decls = node.declarations;
  if (!decls.length) return '';

  return this.emit(node.selectors.map(function(s){ return indent + s }).join(',\n'), node.position)
    + this.emit(' {\n')
    + this.emit(this.indent(1))
    + this.mapVisit(decls, '\n')
    + this.emit(this.indent(-1))
    + this.emit('\n' + this.indent() + '}');
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return this.emit(this.indent())
    + this.emit(node.property + ': ' + node.value, node.position)
    + this.emit(';');
};

/**
 * Increase, decrease or return current indentation.
 */

Compiler.prototype.indent = function(level) {
  this.level = this.level || 1;

  if (null != level) {
    this.level += level;
    return '';
  }

  return Array(this.level).join(this.indentation || '  ');
};

},{"./compiler":6,"inherits":11}],9:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Compressed = require('./compress');
var Identity = require('./identity');

/**
 * Stringfy the given AST `node`.
 *
 * Options:
 *
 *  - `compress` space-optimized output
 *  - `sourcemap` return an object with `.code` and `.map`
 *
 * @param {Object} node
 * @param {Object} [options]
 * @return {String}
 * @api public
 */

module.exports = function(node, options){
  options = options || {};

  var compiler = options.compress
    ? new Compressed(options)
    : new Identity(options);

  // source maps
  if (options.sourcemap) {
    var sourcemaps = require('./source-map-support');
    sourcemaps(compiler);

    var code = compiler.compile(node);
    compiler.applySourceMaps();

    var map = options.sourcemap === 'generator'
      ? compiler.map
      : compiler.map.toJSON();

    return { code: code, map: map };
  }

  var code = compiler.compile(node);
  return code;
};

},{"./compress":7,"./identity":8,"./source-map-support":10}],10:[function(require,module,exports){

/**
 * Module dependencies.
 */

var SourceMap = require('source-map').SourceMapGenerator;
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var sourceMapResolve = require('source-map-resolve');
var urix = require('urix');
var fs = require('fs');
var path = require('path');

/**
 * Expose `mixin()`.
 */

module.exports = mixin;

/**
 * Mixin source map support into `compiler`.
 *
 * @param {Compiler} compiler
 * @api public
 */

function mixin(compiler) {
  compiler._comment = compiler.comment;
  compiler.map = new SourceMap();
  compiler.position = { line: 1, column: 1 };
  compiler.files = {};
  for (var k in exports) compiler[k] = exports[k];
}

/**
 * Update position.
 *
 * @param {String} str
 * @api private
 */

exports.updatePosition = function(str) {
  var lines = str.match(/\n/g);
  if (lines) this.position.line += lines.length;
  var i = str.lastIndexOf('\n');
  this.position.column = ~i ? str.length - i : this.position.column + str.length;
};

/**
 * Emit `str`.
 *
 * @param {String} str
 * @param {Object} [pos]
 * @return {String}
 * @api private
 */

exports.emit = function(str, pos) {
  if (pos) {
    var sourceFile = urix(pos.source || 'source.css');

    this.map.addMapping({
      source: sourceFile,
      generated: {
        line: this.position.line,
        column: Math.max(this.position.column - 1, 0)
      },
      original: {
        line: pos.start.line,
        column: pos.start.column - 1
      }
    });

    this.addFile(sourceFile, pos);
  }

  this.updatePosition(str);

  return str;
};

/**
 * Adds a file to the source map output if it has not already been added
 * @param {String} file
 * @param {Object} pos
 */

exports.addFile = function(file, pos) {
  if (typeof pos.content !== 'string') return;
  if (Object.prototype.hasOwnProperty.call(this.files, file)) return;

  this.files[file] = pos.content;
};

/**
 * Applies any original source maps to the output and embeds the source file
 * contents in the source map.
 */

exports.applySourceMaps = function() {
  Object.keys(this.files).forEach(function(file) {
    var content = this.files[file];
    this.map.setSourceContent(file, content);

    if (this.options.inputSourcemaps !== false) {
      var originalMap = sourceMapResolve.resolveSync(
        content, file, fs.readFileSync);
      if (originalMap) {
        var map = new SourceMapConsumer(originalMap.map);
        var relativeTo = originalMap.sourcesRelativeTo;
        this.map.applySourceMap(map, file, urix(path.dirname(relativeTo)));
      }
    }
  }, this);
};

/**
 * Process comments, drops sourceMap comments.
 * @param {Object} node
 */

exports.comment = function(node) {
  if (/^# sourceMappingURL=/.test(node.comment))
    return this.emit('', node.position);
  else
    return this._comment(node);
};

},{"fs":1,"path":2,"source-map":15,"source-map-resolve":14,"urix":26}],11:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],12:[function(require,module,exports){
// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

void (function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define(factory)
  } else if (typeof exports === "object") {
    module.exports = factory()
  } else {
    root.resolveUrl = factory()
  }
}(this, function() {

  function resolveUrl(/* ...urls */) {
    var numUrls = arguments.length

    if (numUrls === 0) {
      throw new Error("resolveUrl requires at least one argument; got none.")
    }

    var base = document.createElement("base")
    base.href = arguments[0]

    if (numUrls === 1) {
      return base.href
    }

    var head = document.getElementsByTagName("head")[0]
    head.insertBefore(base, head.firstChild)

    var a = document.createElement("a")
    var resolved

    for (var index = 1; index < numUrls; index++) {
      a.href = arguments[index]
      resolved = a.href
      base.href = resolved
    }

    head.removeChild(base)

    return resolved
  }

  return resolveUrl

}));

},{}],13:[function(require,module,exports){
// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

void (function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define(factory)
  } else if (typeof exports === "object") {
    module.exports = factory()
  } else {
    root.sourceMappingURL = factory()
  }
}(this, function() {

  var innerRegex = /[#@] sourceMappingURL=([^\s'"]*)/

  var regex = RegExp(
    "(?:" +
      "/\\*" +
      "(?:\\s*\r?\n(?://)?)?" +
      "(?:" + innerRegex.source + ")" +
      "\\s*" +
      "\\*/" +
      "|" +
      "//(?:" + innerRegex.source + ")" +
    ")" +
    "\\s*$"
  )

  return {

    regex: regex,
    _innerRegex: innerRegex,

    getFrom: function(code) {
      var match = code.match(regex)
      return (match ? match[1] || match[2] || "" : null)
    },

    existsIn: function(code) {
      return regex.test(code)
    },

    removeFrom: function(code) {
      return code.replace(regex, "")
    },

    insertBefore: function(code, string) {
      var match = code.match(regex)
      if (match) {
        return code.slice(0, match.index) + string + code.slice(match.index)
      } else {
        return code + string
      }
    }
  }

}));

},{}],14:[function(require,module,exports){
// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

// Note: source-map-resolve.js is generated from source-map-resolve-node.js and
// source-map-resolve-template.js. Only edit the two latter files, _not_
// source-map-resolve.js!

void (function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define(["source-map-url", "resolve-url"], factory)
  } else if (typeof exports === "object") {
    var sourceMappingURL = require("source-map-url")
    var resolveUrl = require("resolve-url")
    module.exports = factory(sourceMappingURL, resolveUrl)
  } else {
    root.sourceMapResolve = factory(root.sourceMappingURL, root.resolveUrl)
  }
}(this, function(sourceMappingURL, resolveUrl) {

  function callbackAsync(callback, error, result) {
    setImmediate(function() { callback(error, result) })
  }

  function parseMapToJSON(string) {
    return JSON.parse(string.replace(/^\)\]\}'/, ""))
  }



  function resolveSourceMap(code, codeUrl, read, callback) {
    var mapData
    try {
      mapData = resolveSourceMapHelper(code, codeUrl)
    } catch (error) {
      return callbackAsync(callback, error)
    }
    if (!mapData || mapData.map) {
      return callbackAsync(callback, null, mapData)
    }
    read(mapData.url, function(error, result) {
      if (error) {
        return callback(error)
      }
      try {
        mapData.map = parseMapToJSON(String(result))
      } catch (error) {
        return callback(error)
      }
      callback(null, mapData)
    })
  }

  function resolveSourceMapSync(code, codeUrl, read) {
    var mapData = resolveSourceMapHelper(code, codeUrl)
    if (!mapData || mapData.map) {
      return mapData
    }
    mapData.map = parseMapToJSON(String(read(mapData.url)))
    return mapData
  }

  var dataUriRegex = /^data:([^,;]*)(;[^,;]*)*(?:,(.*))?$/
  var jsonMimeTypeRegex = /^(?:application|text)\/json$/

  function resolveSourceMapHelper(code, codeUrl) {
    var url = sourceMappingURL.getFrom(code)
    if (!url) {
      return null
    }

    var dataUri = url.match(dataUriRegex)
    if (dataUri) {
      var mimeType = dataUri[1]
      var lastParameter = dataUri[2]
      var encoded = dataUri[3]
      if (!jsonMimeTypeRegex.test(mimeType)) {
        throw new Error("Unuseful data uri mime type: " + (mimeType || "text/plain"))
      }
      return {
        sourceMappingURL: url,
        url: null,
        sourcesRelativeTo: codeUrl,
        map: parseMapToJSON(lastParameter === ";base64" ? atob(encoded) : decodeURIComponent(encoded))
      }
    }

    var mapUrl = resolveUrl(codeUrl, url)
    return {
      sourceMappingURL: url,
      url: mapUrl,
      sourcesRelativeTo: mapUrl,
      map: null
    }
  }



  function resolveSources(map, mapUrl, read, options, callback) {
    if (typeof options === "function") {
      callback = options
      options = {}
    }
    var pending = map.sources.length
    var errored = false
    var result = {
      sourcesResolved: [],
      sourcesContent:  []
    }

    var done = function(error) {
      if (errored) {
        return
      }
      if (error) {
        errored = true
        return callback(error)
      }
      pending--
      if (pending === 0) {
        callback(null, result)
      }
    }

    resolveSourcesHelper(map, mapUrl, options, function(fullUrl, sourceContent, index) {
      result.sourcesResolved[index] = fullUrl
      if (typeof sourceContent === "string") {
        result.sourcesContent[index] = sourceContent
        callbackAsync(done, null)
      } else {
        read(fullUrl, function(error, source) {
          result.sourcesContent[index] = String(source)
          done(error)
        })
      }
    })
  }

  function resolveSourcesSync(map, mapUrl, read, options) {
    var result = {
      sourcesResolved: [],
      sourcesContent:  []
    }
    resolveSourcesHelper(map, mapUrl, options, function(fullUrl, sourceContent, index) {
      result.sourcesResolved[index] = fullUrl
      if (read !== null) {
        if (typeof sourceContent === "string") {
          result.sourcesContent[index] = sourceContent
        } else {
          result.sourcesContent[index] = String(read(fullUrl))
        }
      }
    })
    return result
  }

  var endingSlash = /\/?$/

  function resolveSourcesHelper(map, mapUrl, options, fn) {
    options = options || {}
    var fullUrl
    var sourceContent
    for (var index = 0, len = map.sources.length; index < len; index++) {
      if (map.sourceRoot && !options.ignoreSourceRoot) {
        // Make sure that the sourceRoot ends with a slash, so that `/scripts/subdir` becomes
        // `/scripts/subdir/<source>`, not `/scripts/<source>`. Pointing to a file as source root
        // does not make sense.
        fullUrl = resolveUrl(mapUrl, map.sourceRoot.replace(endingSlash, "/"), map.sources[index])
      } else {
        fullUrl = resolveUrl(mapUrl, map.sources[index])
      }
      sourceContent = (map.sourcesContent || [])[index]
      fn(fullUrl, sourceContent, index)
    }
  }



  function resolve(code, codeUrl, read, options, callback) {
    if (typeof options === "function") {
      callback = options
      options = {}
    }
    resolveSourceMap(code, codeUrl, read, function(error, mapData) {
      if (error) {
        return callback(error)
      }
      if (!mapData) {
        return callback(null, null)
      }
      resolveSources(mapData.map, mapData.sourcesRelativeTo, read, options, function(error, result) {
        if (error) {
          return callback(error)
        }
        mapData.sourcesResolved = result.sourcesResolved
        mapData.sourcesContent  = result.sourcesContent
        callback(null, mapData)
      })
    })
  }

  function resolveSync(code, codeUrl, read, options) {
    var mapData = resolveSourceMapSync(code, codeUrl, read)
    if (!mapData) {
      return null
    }
    var result = resolveSourcesSync(mapData.map, mapData.sourcesRelativeTo, read, options)
    mapData.sourcesResolved = result.sourcesResolved
    mapData.sourcesContent  = result.sourcesContent
    return mapData
  }



  return {
    resolveSourceMap:     resolveSourceMap,
    resolveSourceMapSync: resolveSourceMapSync,
    resolveSources:       resolveSources,
    resolveSourcesSync:   resolveSourcesSync,
    resolve:              resolve,
    resolveSync:          resolveSync
  }

}));

},{"resolve-url":12,"source-map-url":13}],15:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./source-map/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./source-map/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./source-map/source-node').SourceNode;

},{"./source-map/source-map-consumer":21,"./source-map/source-map-generator":22,"./source-map/source-node":23}],16:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');

  /**
   * A data structure which is a combination of an array and a set. Adding a new
   * member is O(1), testing for membership is O(1), and finding the index of an
   * element is O(1). Removing elements from the set is not supported. Only
   * strings are supported for membership.
   */
  function ArraySet() {
    this._array = [];
    this._set = {};
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
    var set = new ArraySet();
    for (var i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  };

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
    var isDuplicate = this.has(aStr);
    var idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      this._set[util.toSetString(aStr)] = idx;
    }
  };

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  ArraySet.prototype.has = function ArraySet_has(aStr) {
    return Object.prototype.hasOwnProperty.call(this._set,
                                                util.toSetString(aStr));
  };

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
    if (this.has(aStr)) {
      return this._set[util.toSetString(aStr)];
    }
    throw new Error('"' + aStr + '" is not in the set.');
  };

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  ArraySet.prototype.at = function ArraySet_at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error('No element indexed by ' + aIdx);
  };

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  ArraySet.prototype.toArray = function ArraySet_toArray() {
    return this._array.slice();
  };

  exports.ArraySet = ArraySet;

});

},{"./util":24,"amdefine":25}],17:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64 = require('./base64');

  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
  // length quantities we use in the source map spec, the first bit is the sign,
  // the next four bits are the actual value, and the 6th bit is the
  // continuation bit. The continuation bit tells us whether there are more
  // digits in this value following this digit.
  //
  //   Continuation
  //   |    Sign
  //   |    |
  //   V    V
  //   101011

  var VLQ_BASE_SHIFT = 5;

  // binary: 100000
  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

  // binary: 011111
  var VLQ_BASE_MASK = VLQ_BASE - 1;

  // binary: 100000
  var VLQ_CONTINUATION_BIT = VLQ_BASE;

  /**
   * Converts from a two-complement value to a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
   */
  function toVLQSigned(aValue) {
    return aValue < 0
      ? ((-aValue) << 1) + 1
      : (aValue << 1) + 0;
  }

  /**
   * Converts to a two-complement value from a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
   */
  function fromVLQSigned(aValue) {
    var isNegative = (aValue & 1) === 1;
    var shifted = aValue >> 1;
    return isNegative
      ? -shifted
      : shifted;
  }

  /**
   * Returns the base 64 VLQ encoded value.
   */
  exports.encode = function base64VLQ_encode(aValue) {
    var encoded = "";
    var digit;

    var vlq = toVLQSigned(aValue);

    do {
      digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        // There are still more digits in this value, so we must make sure the
        // continuation bit is marked.
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += base64.encode(digit);
    } while (vlq > 0);

    return encoded;
  };

  /**
   * Decodes the next base 64 VLQ value from the given string and returns the
   * value and the rest of the string via the out parameter.
   */
  exports.decode = function base64VLQ_decode(aStr, aOutParam) {
    var i = 0;
    var strLen = aStr.length;
    var result = 0;
    var shift = 0;
    var continuation, digit;

    do {
      if (i >= strLen) {
        throw new Error("Expected more digits in base 64 VLQ value.");
      }
      digit = base64.decode(aStr.charAt(i++));
      continuation = !!(digit & VLQ_CONTINUATION_BIT);
      digit &= VLQ_BASE_MASK;
      result = result + (digit << shift);
      shift += VLQ_BASE_SHIFT;
    } while (continuation);

    aOutParam.value = fromVLQSigned(result);
    aOutParam.rest = aStr.slice(i);
  };

});

},{"./base64":18,"amdefine":25}],18:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var charToIntMap = {};
  var intToCharMap = {};

  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    .split('')
    .forEach(function (ch, index) {
      charToIntMap[ch] = index;
      intToCharMap[index] = ch;
    });

  /**
   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
   */
  exports.encode = function base64_encode(aNumber) {
    if (aNumber in intToCharMap) {
      return intToCharMap[aNumber];
    }
    throw new TypeError("Must be between 0 and 63: " + aNumber);
  };

  /**
   * Decode a single base 64 digit to an integer.
   */
  exports.decode = function base64_decode(aChar) {
    if (aChar in charToIntMap) {
      return charToIntMap[aChar];
    }
    throw new TypeError("Not a valid base 64 digit: " + aChar);
  };

});

},{"amdefine":25}],19:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * Recursive implementation of binary search.
   *
   * @param aLow Indices here and lower do not contain the needle.
   * @param aHigh Indices here and higher do not contain the needle.
   * @param aNeedle The element being searched for.
   * @param aHaystack The non-empty array being searched.
   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
   */
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
    // This function terminates when one of the following is true:
    //
    //   1. We find the exact element we are looking for.
    //
    //   2. We did not find the exact element, but we can return the index of
    //      the next closest element that is less than that element.
    //
    //   3. We did not find the exact element, and there is no next-closest
    //      element which is less than the one we are searching for, so we
    //      return -1.
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      // Found the element we are looking for.
      return mid;
    }
    else if (cmp > 0) {
      // aHaystack[mid] is greater than our needle.
      if (aHigh - mid > 1) {
        // The element is in the upper half.
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
      }
      // We did not find an exact match, return the next closest one
      // (termination case 2).
      return mid;
    }
    else {
      // aHaystack[mid] is less than our needle.
      if (mid - aLow > 1) {
        // The element is in the lower half.
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
      }
      // The exact needle element was not found in this haystack. Determine if
      // we are in termination case (2) or (3) and return the appropriate thing.
      return aLow < 0 ? -1 : aLow;
    }
  }

  /**
   * This is an implementation of binary search which will always try and return
   * the index of next lowest value checked if there is no exact hit. This is
   * because mappings between original and generated line/col pairs are single
   * points, and there is an implicit region between each of them, so a miss
   * just means that you aren't on the very start of a region.
   *
   * @param aNeedle The element you are looking for.
   * @param aHaystack The array that is being searched.
   * @param aCompare A function which takes the needle and an element in the
   *     array and returns -1, 0, or 1 depending on whether the needle is less
   *     than, equal to, or greater than the element, respectively.
   */
  exports.search = function search(aNeedle, aHaystack, aCompare) {
    if (aHaystack.length === 0) {
      return -1;
    }
    return recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
  };

});

},{"amdefine":25}],20:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');

  /**
   * Determine whether mappingB is after mappingA with respect to generated
   * position.
   */
  function generatedPositionAfter(mappingA, mappingB) {
    // Optimized for most common case
    var lineA = mappingA.generatedLine;
    var lineB = mappingB.generatedLine;
    var columnA = mappingA.generatedColumn;
    var columnB = mappingB.generatedColumn;
    return lineB > lineA || lineB == lineA && columnB >= columnA ||
           util.compareByGeneratedPositions(mappingA, mappingB) <= 0;
  }

  /**
   * A data structure to provide a sorted view of accumulated mappings in a
   * performance conscious manner. It trades a neglibable overhead in general
   * case for a large speedup in case of mappings being added in order.
   */
  function MappingList() {
    this._array = [];
    this._sorted = true;
    // Serves as infimum
    this._last = {generatedLine: -1, generatedColumn: 0};
  }

  /**
   * Iterate through internal items. This method takes the same arguments that
   * `Array.prototype.forEach` takes.
   *
   * NOTE: The order of the mappings is NOT guaranteed.
   */
  MappingList.prototype.unsortedForEach =
    function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };

  /**
   * Add the given source mapping.
   *
   * @param Object aMapping
   */
  MappingList.prototype.add = function MappingList_add(aMapping) {
    var mapping;
    if (generatedPositionAfter(this._last, aMapping)) {
      this._last = aMapping;
      this._array.push(aMapping);
    } else {
      this._sorted = false;
      this._array.push(aMapping);
    }
  };

  /**
   * Returns the flat, sorted array of mappings. The mappings are sorted by
   * generated position.
   *
   * WARNING: This method returns internal data without copying, for
   * performance. The return value must NOT be mutated, and should be treated as
   * an immutable borrow. If you want to take ownership, you must make your own
   * copy.
   */
  MappingList.prototype.toArray = function MappingList_toArray() {
    if (!this._sorted) {
      this._array.sort(util.compareByGeneratedPositions);
      this._sorted = true;
    }
    return this._array;
  };

  exports.MappingList = MappingList;

});

},{"./util":24,"amdefine":25}],21:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');
  var binarySearch = require('./binary-search');
  var ArraySet = require('./array-set').ArraySet;
  var base64VLQ = require('./base64-vlq');

  /**
   * A SourceMapConsumer instance represents a parsed source map which we can
   * query for information about the original file positions by giving it a file
   * position in the generated source.
   *
   * The only parameter is the raw source map (either as a JSON string, or
   * already parsed to an object). According to the spec, source maps have the
   * following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - sources: An array of URLs to the original source files.
   *   - names: An array of identifiers which can be referrenced by individual mappings.
   *   - sourceRoot: Optional. The URL root from which all sources are relative.
   *   - sourcesContent: Optional. An array of contents of the original source files.
   *   - mappings: A string of base64 VLQs which contain the actual mappings.
   *   - file: Optional. The generated file this source map is associated with.
   *
   * Here is an example source map, taken from the source map spec[0]:
   *
   *     {
   *       version : 3,
   *       file: "out.js",
   *       sourceRoot : "",
   *       sources: ["foo.js", "bar.js"],
   *       names: ["src", "maps", "are", "fun"],
   *       mappings: "AA,AB;;ABCDE;"
   *     }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
   */
  function SourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util.getArg(sourceMap, 'version');
    var sources = util.getArg(sourceMap, 'sources');
    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
    // requires the array) to play nice here.
    var names = util.getArg(sourceMap, 'names', []);
    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
    var mappings = util.getArg(sourceMap, 'mappings');
    var file = util.getArg(sourceMap, 'file', null);

    // Once again, Sass deviates from the spec and supplies the version as a
    // string rather than a number, so we use loose equality checking here.
    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    sources = sources.map(util.normalize);

    // Pass `true` below to allow duplicate names and sources. While source maps
    // are intended to be compressed and deduplicated, the TypeScript compiler
    // sometimes generates source maps with duplicates in them. See Github issue
    // #72 and bugzil.la/889492.
    this._names = ArraySet.fromArray(names, true);
    this._sources = ArraySet.fromArray(sources, true);

    this.sourceRoot = sourceRoot;
    this.sourcesContent = sourcesContent;
    this._mappings = mappings;
    this.file = file;
  }

  /**
   * Create a SourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @returns SourceMapConsumer
   */
  SourceMapConsumer.fromSourceMap =
    function SourceMapConsumer_fromSourceMap(aSourceMap) {
      var smc = Object.create(SourceMapConsumer.prototype);

      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                              smc.sourceRoot);
      smc.file = aSourceMap._file;

      smc.__generatedMappings = aSourceMap._mappings.toArray().slice();
      smc.__originalMappings = aSourceMap._mappings.toArray().slice()
        .sort(util.compareByOriginalPositions);

      return smc;
    };

  /**
   * The version of the source mapping spec that we are consuming.
   */
  SourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
    get: function () {
      return this._sources.toArray().map(function (s) {
        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
      }, this);
    }
  });

  // `__generatedMappings` and `__originalMappings` are arrays that hold the
  // parsed mapping coordinates from the source map's "mappings" attribute. They
  // are lazily instantiated, accessed via the `_generatedMappings` and
  // `_originalMappings` getters respectively, and we only parse the mappings
  // and create these arrays once queried for a source location. We jump through
  // these hoops because there can be many thousands of mappings, and parsing
  // them is expensive, so we only want to do it if we must.
  //
  // Each object in the arrays is of the form:
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `_generatedMappings` is ordered by the generated positions.
  //
  // `_originalMappings` is ordered by the original positions.

  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
    get: function () {
      if (!this.__generatedMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__generatedMappings;
    }
  });

  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
    get: function () {
      if (!this.__originalMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__originalMappings;
    }
  });

  SourceMapConsumer.prototype._nextCharIsMappingSeparator =
    function SourceMapConsumer_nextCharIsMappingSeparator(aStr) {
      var c = aStr.charAt(0);
      return c === ";" || c === ",";
    };

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  SourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var str = aStr;
      var temp = {};
      var mapping;

      while (str.length > 0) {
        if (str.charAt(0) === ';') {
          generatedLine++;
          str = str.slice(1);
          previousGeneratedColumn = 0;
        }
        else if (str.charAt(0) === ',') {
          str = str.slice(1);
        }
        else {
          mapping = {};
          mapping.generatedLine = generatedLine;

          // Generated column.
          base64VLQ.decode(str, temp);
          mapping.generatedColumn = previousGeneratedColumn + temp.value;
          previousGeneratedColumn = mapping.generatedColumn;
          str = temp.rest;

          if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
            // Original source.
            base64VLQ.decode(str, temp);
            mapping.source = this._sources.at(previousSource + temp.value);
            previousSource += temp.value;
            str = temp.rest;
            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
              throw new Error('Found a source, but no line and column');
            }

            // Original line.
            base64VLQ.decode(str, temp);
            mapping.originalLine = previousOriginalLine + temp.value;
            previousOriginalLine = mapping.originalLine;
            // Lines are stored 0-based
            mapping.originalLine += 1;
            str = temp.rest;
            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
              throw new Error('Found a source and line, but no column');
            }

            // Original column.
            base64VLQ.decode(str, temp);
            mapping.originalColumn = previousOriginalColumn + temp.value;
            previousOriginalColumn = mapping.originalColumn;
            str = temp.rest;

            if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
              // Original name.
              base64VLQ.decode(str, temp);
              mapping.name = this._names.at(previousName + temp.value);
              previousName += temp.value;
              str = temp.rest;
            }
          }

          this.__generatedMappings.push(mapping);
          if (typeof mapping.originalLine === 'number') {
            this.__originalMappings.push(mapping);
          }
        }
      }

      this.__generatedMappings.sort(util.compareByGeneratedPositions);
      this.__originalMappings.sort(util.compareByOriginalPositions);
    };

  /**
   * Find the mapping that best matches the hypothetical "needle" mapping that
   * we are searching for in the given "haystack" of mappings.
   */
  SourceMapConsumer.prototype._findMapping =
    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                           aColumnName, aComparator) {
      // To return the position we are searching for, we must first find the
      // mapping for the given position and then return the opposite position it
      // points to. Because the mappings are sorted, we can use binary search to
      // find the best mapping.

      if (aNeedle[aLineName] <= 0) {
        throw new TypeError('Line must be greater than or equal to 1, got '
                            + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError('Column must be greater than or equal to 0, got '
                            + aNeedle[aColumnName]);
      }

      return binarySearch.search(aNeedle, aMappings, aComparator);
    };

  /**
   * Compute the last column for each generated mapping. The last column is
   * inclusive.
   */
  SourceMapConsumer.prototype.computeColumnSpans =
    function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];

        // Mappings do not contain a field for the last generated columnt. We
        // can come up with an optimistic estimate, however, by assuming that
        // mappings are contiguous (i.e. given two consecutive mappings, the
        // first mapping ends where the second one starts).
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];

          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }

        // The last mapping for each line spans the entire line.
        mapping.lastGeneratedColumn = Infinity;
      }
    };

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  SourceMapConsumer.prototype.originalPositionFor =
    function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, 'line'),
        generatedColumn: util.getArg(aArgs, 'column')
      };

      var index = this._findMapping(needle,
                                    this._generatedMappings,
                                    "generatedLine",
                                    "generatedColumn",
                                    util.compareByGeneratedPositions);

      if (index >= 0) {
        var mapping = this._generatedMappings[index];

        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, 'source', null);
          if (source != null && this.sourceRoot != null) {
            source = util.join(this.sourceRoot, source);
          }
          return {
            source: source,
            line: util.getArg(mapping, 'originalLine', null),
            column: util.getArg(mapping, 'originalColumn', null),
            name: util.getArg(mapping, 'name', null)
          };
        }
      }

      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * availible.
   */
  SourceMapConsumer.prototype.sourceContentFor =
    function SourceMapConsumer_sourceContentFor(aSource) {
      if (!this.sourcesContent) {
        return null;
      }

      if (this.sourceRoot != null) {
        aSource = util.relative(this.sourceRoot, aSource);
      }

      if (this._sources.has(aSource)) {
        return this.sourcesContent[this._sources.indexOf(aSource)];
      }

      var url;
      if (this.sourceRoot != null
          && (url = util.urlParse(this.sourceRoot))) {
        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
        // many users. We can help them out when they expect file:// URIs to
        // behave like it would if they were running a local HTTP server. See
        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
        if (url.scheme == "file"
            && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
        }

        if ((!url.path || url.path == "/")
            && this._sources.has("/" + aSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
        }
      }

      throw new Error('"' + aSource + '" is not in the SourceMap.');
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.generatedPositionFor =
    function SourceMapConsumer_generatedPositionFor(aArgs) {
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: util.getArg(aArgs, 'column')
      };

      if (this.sourceRoot != null) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }

      var index = this._findMapping(needle,
                                    this._originalMappings,
                                    "originalLine",
                                    "originalColumn",
                                    util.compareByOriginalPositions);

      if (index >= 0) {
        var mapping = this._originalMappings[index];

        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }

      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };

  /**
   * Returns all generated line and column information for the original source
   * and line provided. The only argument is an object with the following
   * properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *
   * and an array of objects is returned, each with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.allGeneratedPositionsFor =
    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      // When there is no exact match, SourceMapConsumer.prototype._findMapping
      // returns the index of the closest mapping less than the needle. By
      // setting needle.originalColumn to Infinity, we thus find the last
      // mapping for the given line, provided such a mapping exists.
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: Infinity
      };

      if (this.sourceRoot != null) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }

      var mappings = [];

      var index = this._findMapping(needle,
                                    this._originalMappings,
                                    "originalLine",
                                    "originalColumn",
                                    util.compareByOriginalPositions);
      if (index >= 0) {
        var mapping = this._originalMappings[index];

        while (mapping && mapping.originalLine === needle.originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[--index];
        }
      }

      return mappings.reverse();
    };

  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  SourceMapConsumer.prototype.eachMapping =
    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

      var mappings;
      switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
      }

      var sourceRoot = this.sourceRoot;
      mappings.map(function (mapping) {
        var source = mapping.source;
        if (source != null && sourceRoot != null) {
          source = util.join(sourceRoot, source);
        }
        return {
          source: source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name
        };
      }).forEach(aCallback, context);
    };

  exports.SourceMapConsumer = SourceMapConsumer;

});

},{"./array-set":16,"./base64-vlq":17,"./binary-search":19,"./util":24,"amdefine":25}],22:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64VLQ = require('./base64-vlq');
  var util = require('./util');
  var ArraySet = require('./array-set').ArraySet;
  var MappingList = require('./mapping-list').MappingList;

  /**
   * An instance of the SourceMapGenerator represents a source map which is
   * being built incrementally. You may pass an object with the following
   * properties:
   *
   *   - file: The filename of the generated source.
   *   - sourceRoot: A root for all relative URLs in this source map.
   */
  function SourceMapGenerator(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util.getArg(aArgs, 'file', null);
    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
    this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
    this._sources = new ArraySet();
    this._names = new ArraySet();
    this._mappings = new MappingList();
    this._sourcesContents = null;
  }

  SourceMapGenerator.prototype._version = 3;

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  SourceMapGenerator.fromSourceMap =
    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot: sourceRoot
      });
      aSourceMapConsumer.eachMapping(function (mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };

        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }

          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };

          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }

        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  SourceMapGenerator.prototype.addMapping =
    function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, 'generated');
      var original = util.getArg(aArgs, 'original', null);
      var source = util.getArg(aArgs, 'source', null);
      var name = util.getArg(aArgs, 'name', null);

      if (!this._skipValidation) {
        this._validateMapping(generated, original, source, name);
      }

      if (source != null && !this._sources.has(source)) {
        this._sources.add(source);
      }

      if (name != null && !this._names.has(name)) {
        this._names.add(name);
      }

      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source: source,
        name: name
      });
    };

  /**
   * Set the source content for a source file.
   */
  SourceMapGenerator.prototype.setSourceContent =
    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }

      if (aSourceContent != null) {
        // Add the source content to the _sourcesContents map.
        // Create a new _sourcesContents map if the property is null.
        if (!this._sourcesContents) {
          this._sourcesContents = {};
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        // Remove the source file from the _sourcesContents map.
        // If the _sourcesContents map is empty, set the property to null.
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   * @param aSourceMapPath Optional. The dirname of the path to the source map
   *        to be applied. If relative, it is relative to the SourceMapConsumer.
   *        This parameter is needed when the two source maps aren't in the same
   *        directory, and the source map to be applied contains relative source
   *        paths. If so, those relative source paths need to be rewritten
   *        relative to the SourceMapGenerator.
   */
  SourceMapGenerator.prototype.applySourceMap =
    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      // If aSourceFile is omitted, we will use the file property of the SourceMap
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
            'or the source map\'s "file" property. Both were omitted.'
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      // Make "sourceFile" relative if an absolute Url is passed.
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      // Applying the SourceMap can add and remove items from the sources and
      // the names array.
      var newSources = new ArraySet();
      var newNames = new ArraySet();

      // Find mappings for the "sourceFile"
      this._mappings.unsortedForEach(function (mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          // Check if it can be mapped by the source map, then update the mapping.
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            // Copy mapping
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source)
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }

        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }

        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }

      }, this);
      this._sources = newSources;
      this._names = newNames;

      // Copy sourcesContents of applied map.
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile = util.join(aSourceMapPath, sourceFile);
          }
          if (sourceRoot != null) {
            sourceFile = util.relative(sourceRoot, sourceFile);
          }
          this.setSourceContent(sourceFile, content);
        }
      }, this);
    };

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  SourceMapGenerator.prototype._validateMapping =
    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                aName) {
      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
          && aGenerated.line > 0 && aGenerated.column >= 0
          && !aOriginal && !aSource && !aName) {
        // Case 1.
        return;
      }
      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
               && aGenerated.line > 0 && aGenerated.column >= 0
               && aOriginal.line > 0 && aOriginal.column >= 0
               && aSource) {
        // Cases 2 and 3.
        return;
      }
      else {
        throw new Error('Invalid mapping: ' + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    };

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  SourceMapGenerator.prototype._serializeMappings =
    function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = '';
      var mapping;

      var mappings = this._mappings.toArray();

      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];

        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            result += ';';
            previousGeneratedLine++;
          }
        }
        else {
          if (i > 0) {
            if (!util.compareByGeneratedPositions(mapping, mappings[i - 1])) {
              continue;
            }
            result += ',';
          }
        }

        result += base64VLQ.encode(mapping.generatedColumn
                                   - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;

        if (mapping.source != null) {
          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
                                     - previousSource);
          previousSource = this._sources.indexOf(mapping.source);

          // lines are stored 0-based in SourceMap spec version 3
          result += base64VLQ.encode(mapping.originalLine - 1
                                     - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;

          result += base64VLQ.encode(mapping.originalColumn
                                     - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;

          if (mapping.name != null) {
            result += base64VLQ.encode(this._names.indexOf(mapping.name)
                                       - previousName);
            previousName = this._names.indexOf(mapping.name);
          }
        }
      }

      return result;
    };

  SourceMapGenerator.prototype._generateSourcesContent =
    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function (source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
                                                    key)
          ? this._sourcesContents[key]
          : null;
      }, this);
    };

  /**
   * Externalize the source map.
   */
  SourceMapGenerator.prototype.toJSON =
    function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }

      return map;
    };

  /**
   * Render the source map being generated to a string.
   */
  SourceMapGenerator.prototype.toString =
    function SourceMapGenerator_toString() {
      return JSON.stringify(this);
    };

  exports.SourceMapGenerator = SourceMapGenerator;

});

},{"./array-set":16,"./base64-vlq":17,"./mapping-list":20,"./util":24,"amdefine":25}],23:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
  var util = require('./util');

  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
  // operating systems these days (capturing the result).
  var REGEX_NEWLINE = /(\r?\n)/;

  // Newline character code for charCodeAt() comparisons
  var NEWLINE_CODE = 10;

  // Private symbol for identifying `SourceNode`s when multiple versions of
  // the source-map library are loaded. This MUST NOT CHANGE across
  // versions!
  var isSourceNode = "$$$isSourceNode$$$";

  /**
   * SourceNodes provide a way to abstract over interpolating/concatenating
   * snippets of generated JavaScript source code while maintaining the line and
   * column information associated with the original source code.
   *
   * @param aLine The original line number.
   * @param aColumn The original column number.
   * @param aSource The original source's filename.
   * @param aChunks Optional. An array of strings which are snippets of
   *        generated JS, or other SourceNodes.
   * @param aName The original identifier.
   */
  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine == null ? null : aLine;
    this.column = aColumn == null ? null : aColumn;
    this.source = aSource == null ? null : aSource;
    this.name = aName == null ? null : aName;
    this[isSourceNode] = true;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   * @param aRelativePath Optional. The path that relative sources in the
   *        SourceMapConsumer should be relative to.
   */
  SourceNode.fromStringWithSourceMap =
    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      // The SourceNode we want to fill with the generated code
      // and the SourceMap
      var node = new SourceNode();

      // All even indices of this array are one line of the generated code,
      // while all odd indices are the newlines between two adjacent lines
      // (since `REGEX_NEWLINE` captures its match).
      // Processed fragments are removed from this array, by calling `shiftNextLine`.
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var shiftNextLine = function() {
        var lineContents = remainingLines.shift();
        // The last line of a file might not have a newline.
        var newLine = remainingLines.shift() || "";
        return lineContents + newLine;
      };

      // We need to remember the position of "remainingLines"
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

      // The generate SourceNodes we need a code range.
      // To extract it current and last mapping is used.
      // Here we store the last mapping.
      var lastMapping = null;

      aSourceMapConsumer.eachMapping(function (mapping) {
        if (lastMapping !== null) {
          // We add the code from "lastMapping" to "mapping":
          // First check if there is a new line in between.
          if (lastGeneratedLine < mapping.generatedLine) {
            var code = "";
            // Associate first line with "lastMapping"
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
            // The remaining code is added without mapping
          } else {
            // There is no new line in between.
            // Associate the code between "lastGeneratedColumn" and
            // "mapping.generatedColumn" with "lastMapping"
            var nextLine = remainingLines[0];
            var code = nextLine.substr(0, mapping.generatedColumn -
                                          lastGeneratedColumn);
            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
                                                lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            // No more remaining code, continue
            lastMapping = mapping;
            return;
          }
        }
        // We add the generated code until the first mapping
        // to the SourceNode without any mapping.
        // Each line is added as separate string.
        while (lastGeneratedLine < mapping.generatedLine) {
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[0];
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      // We have processed all mappings.
      if (remainingLines.length > 0) {
        if (lastMapping) {
          // Associate the remaining code in the current line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        // and add the remaining lines without any mapping
        node.add(remainingLines.join(""));
      }

      // Copy sourcesContent into SourceNode
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });

      return node;

      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === undefined) {
          node.add(code);
        } else {
          var source = aRelativePath
            ? util.join(aRelativePath, mapping.source)
            : mapping.source;
          node.add(new SourceNode(mapping.originalLine,
                                  mapping.originalColumn,
                                  source,
                                  code,
                                  mapping.name));
        }
      }
    };

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.add = function SourceNode_add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function (chunk) {
        this.add(chunk);
      }, this);
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (var i = aChunk.length-1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
    var chunk;
    for (var i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk[isSourceNode]) {
        chunk.walk(aFn);
      }
      else {
        if (chunk !== '') {
          aFn(chunk, { source: this.source,
                       line: this.line,
                       column: this.column,
                       name: this.name });
        }
      }
    }
  };

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  SourceNode.prototype.join = function SourceNode_join(aSep) {
    var newChildren;
    var i;
    var len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len-1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  };

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
    var lastChild = this.children[this.children.length - 1];
    if (lastChild[isSourceNode]) {
      lastChild.replaceRight(aPattern, aReplacement);
    }
    else if (typeof lastChild === 'string') {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    }
    else {
      this.children.push(''.replace(aPattern, aReplacement));
    }
    return this;
  };

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  SourceNode.prototype.setSourceContent =
    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walkSourceContents =
    function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }

      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  SourceNode.prototype.toString = function SourceNode_toString() {
    var str = "";
    this.walk(function (chunk) {
      str += chunk;
    });
    return str;
  };

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
    var generated = {
      code: "",
      line: 1,
      column: 0
    };
    var map = new SourceMapGenerator(aArgs);
    var sourceMappingActive = false;
    var lastOriginalSource = null;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastOriginalName = null;
    this.walk(function (chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if(lastOriginalSource !== original.source
           || lastOriginalLine !== original.line
           || lastOriginalColumn !== original.column
           || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      for (var idx = 0, length = chunk.length; idx < length; idx++) {
        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
          generated.line++;
          generated.column = 0;
          // Mappings end at eol
          if (idx + 1 === length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      }
    });
    this.walkSourceContents(function (sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map: map };
  };

  exports.SourceNode = SourceNode;

});

},{"./source-map-generator":22,"./util":24,"amdefine":25}],24:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * This is a helper function for getting values from parameter/options
   * objects.
   *
   * @param args The object we are extracting values from
   * @param name The name of the property we are getting.
   * @param defaultValue An optional value to return if the property is missing
   * from the object. If this is not specified and the property is missing, an
   * error will be thrown.
   */
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;

  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
  var dataUrlRegexp = /^data:.+\,.+$/;

  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[2],
      host: match[3],
      port: match[4],
      path: match[5]
    };
  }
  exports.urlParse = urlParse;

  function urlGenerate(aParsedUrl) {
    var url = '';
    if (aParsedUrl.scheme) {
      url += aParsedUrl.scheme + ':';
    }
    url += '//';
    if (aParsedUrl.auth) {
      url += aParsedUrl.auth + '@';
    }
    if (aParsedUrl.host) {
      url += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url += ":" + aParsedUrl.port
    }
    if (aParsedUrl.path) {
      url += aParsedUrl.path;
    }
    return url;
  }
  exports.urlGenerate = urlGenerate;

  /**
   * Normalizes a path, or the path portion of a URL:
   *
   * - Replaces consequtive slashes with one slash.
   * - Removes unnecessary '.' parts.
   * - Removes unnecessary '<dir>/..' parts.
   *
   * Based on code in the Node.js 'path' core module.
   *
   * @param aPath The path or url to normalize.
   */
  function normalize(aPath) {
    var path = aPath;
    var url = urlParse(aPath);
    if (url) {
      if (!url.path) {
        return aPath;
      }
      path = url.path;
    }
    var isAbsolute = (path.charAt(0) === '/');

    var parts = path.split(/\/+/);
    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
      part = parts[i];
      if (part === '.') {
        parts.splice(i, 1);
      } else if (part === '..') {
        up++;
      } else if (up > 0) {
        if (part === '') {
          // The first part is blank if the path is absolute. Trying to go
          // above the root is a no-op. Therefore we can remove all '..' parts
          // directly after the root.
          parts.splice(i + 1, up);
          up = 0;
        } else {
          parts.splice(i, 2);
          up--;
        }
      }
    }
    path = parts.join('/');

    if (path === '') {
      path = isAbsolute ? '/' : '.';
    }

    if (url) {
      url.path = path;
      return urlGenerate(url);
    }
    return path;
  }
  exports.normalize = normalize;

  /**
   * Joins two paths/URLs.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be joined with the root.
   *
   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
   *   first.
   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
   *   is updated with the result and aRoot is returned. Otherwise the result
   *   is returned.
   *   - If aPath is absolute, the result is aPath.
   *   - Otherwise the two paths are joined with a slash.
   * - Joining for example 'http://' and 'www.example.com' is also supported.
   */
  function join(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    if (aPath === "") {
      aPath = ".";
    }
    var aPathUrl = urlParse(aPath);
    var aRootUrl = urlParse(aRoot);
    if (aRootUrl) {
      aRoot = aRootUrl.path || '/';
    }

    // `join(foo, '//www.example.org')`
    if (aPathUrl && !aPathUrl.scheme) {
      if (aRootUrl) {
        aPathUrl.scheme = aRootUrl.scheme;
      }
      return urlGenerate(aPathUrl);
    }

    if (aPathUrl || aPath.match(dataUrlRegexp)) {
      return aPath;
    }

    // `join('http://', 'www.example.com')`
    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
      aRootUrl.host = aPath;
      return urlGenerate(aRootUrl);
    }

    var joined = aPath.charAt(0) === '/'
      ? aPath
      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

    if (aRootUrl) {
      aRootUrl.path = joined;
      return urlGenerate(aRootUrl);
    }
    return joined;
  }
  exports.join = join;

  /**
   * Make a path relative to a URL or another path.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be made relative to aRoot.
   */
  function relative(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }

    aRoot = aRoot.replace(/\/$/, '');

    // XXX: It is possible to remove this block, and the tests still pass!
    var url = urlParse(aRoot);
    if (aPath.charAt(0) == "/" && url && url.path == "/") {
      return aPath.slice(1);
    }

    return aPath.indexOf(aRoot + '/') === 0
      ? aPath.substr(aRoot.length + 1)
      : aPath;
  }
  exports.relative = relative;

  /**
   * Because behavior goes wacky when you set `__proto__` on objects, we
   * have to prefix all the strings in our set with an arbitrary character.
   *
   * See https://github.com/mozilla/source-map/pull/31 and
   * https://github.com/mozilla/source-map/issues/30
   *
   * @param String aStr
   */
  function toSetString(aStr) {
    return '$' + aStr;
  }
  exports.toSetString = toSetString;

  function fromSetString(aStr) {
    return aStr.substr(1);
  }
  exports.fromSetString = fromSetString;

  function strcmp(aStr1, aStr2) {
    var s1 = aStr1 || "";
    var s2 = aStr2 || "";
    return (s1 > s2) - (s1 < s2);
  }

  /**
   * Comparator between two mappings where the original positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same original source/line/column, but different generated
   * line and column the same. Useful when searching for a mapping with a
   * stubbed out mapping.
   */
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp;

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp || onlyCompareOriginal) {
      return cmp;
    }

    cmp = strcmp(mappingA.name, mappingB.name);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    return mappingA.generatedColumn - mappingB.generatedColumn;
  };
  exports.compareByOriginalPositions = compareByOriginalPositions;

  /**
   * Comparator between two mappings where the generated positions are
   * compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same generated line and column, but different
   * source/name/original line and column the same. Useful when searching for a
   * mapping with a stubbed out mapping.
   */
  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
    var cmp;

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp || onlyCompareGenerated) {
      return cmp;
    }

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp) {
      return cmp;
    }

    return strcmp(mappingA.name, mappingB.name);
  };
  exports.compareByGeneratedPositions = compareByGeneratedPositions;

});

},{"amdefine":25}],25:[function(require,module,exports){
(function (process,__filename){
/** vim: et:ts=4:sw=4:sts=4
 * @license amdefine 1.0.0 Copyright (c) 2011-2015, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/amdefine for details
 */

/*jslint node: true */
/*global module, process */
'use strict';

/**
 * Creates a define for node.
 * @param {Object} module the "module" object that is defined by Node for the
 * current module.
 * @param {Function} [requireFn]. Node's require function for the current module.
 * It only needs to be passed in Node versions before 0.5, when module.require
 * did not exist.
 * @returns {Function} a define function that is usable for the current node
 * module.
 */
function amdefine(module, requireFn) {
    'use strict';
    var defineCache = {},
        loaderCache = {},
        alreadyCalled = false,
        path = require('path'),
        makeRequire, stringRequire;

    /**
     * Trims the . and .. from an array of path segments.
     * It will keep a leading path segment if a .. will become
     * the first path segment, to help with module name lookups,
     * which act like paths, but can be remapped. But the end result,
     * all paths that use this function should look normalized.
     * NOTE: this method MODIFIES the input array.
     * @param {Array} ary the array of path segments.
     */
    function trimDots(ary) {
        var i, part;
        for (i = 0; ary[i]; i+= 1) {
            part = ary[i];
            if (part === '.') {
                ary.splice(i, 1);
                i -= 1;
            } else if (part === '..') {
                if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                    //End of the line. Keep at least one non-dot
                    //path segment at the front so it can be mapped
                    //correctly to disk. Otherwise, there is likely
                    //no path mapping for a path starting with '..'.
                    //This can still fail, but catches the most reasonable
                    //uses of ..
                    break;
                } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                }
            }
        }
    }

    function normalize(name, baseName) {
        var baseParts;

        //Adjust any relative paths.
        if (name && name.charAt(0) === '.') {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                baseParts = baseName.split('/');
                baseParts = baseParts.slice(0, baseParts.length - 1);
                baseParts = baseParts.concat(name.split('/'));
                trimDots(baseParts);
                name = baseParts.join('/');
            }
        }

        return name;
    }

    /**
     * Create the normalize() function passed to a loader plugin's
     * normalize method.
     */
    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(id) {
        function load(value) {
            loaderCache[id] = value;
        }

        load.fromText = function (id, text) {
            //This one is difficult because the text can/probably uses
            //define, and any relative paths and requires should be relative
            //to that id was it would be found on disk. But this would require
            //bootstrapping a module/require fairly deeply from node core.
            //Not sure how best to go about that yet.
            throw new Error('amdefine does not implement load.fromText');
        };

        return load;
    }

    makeRequire = function (systemRequire, exports, module, relId) {
        function amdRequire(deps, callback) {
            if (typeof deps === 'string') {
                //Synchronous, single module require('')
                return stringRequire(systemRequire, exports, module, deps, relId);
            } else {
                //Array of dependencies with a callback.

                //Convert the dependencies to modules.
                deps = deps.map(function (depName) {
                    return stringRequire(systemRequire, exports, module, depName, relId);
                });

                //Wait for next tick to call back the require call.
                if (callback) {
                    process.nextTick(function () {
                        callback.apply(null, deps);
                    });
                }
            }
        }

        amdRequire.toUrl = function (filePath) {
            if (filePath.indexOf('.') === 0) {
                return normalize(filePath, path.dirname(module.filename));
            } else {
                return filePath;
            }
        };

        return amdRequire;
    };

    //Favor explicit value, passed in if the module wants to support Node 0.4.
    requireFn = requireFn || function req() {
        return module.require.apply(module, arguments);
    };

    function runFactory(id, deps, factory) {
        var r, e, m, result;

        if (id) {
            e = loaderCache[id] = {};
            m = {
                id: id,
                uri: __filename,
                exports: e
            };
            r = makeRequire(requireFn, e, m, id);
        } else {
            //Only support one define call per file
            if (alreadyCalled) {
                throw new Error('amdefine with no module ID cannot be called more than once per file.');
            }
            alreadyCalled = true;

            //Use the real variables from node
            //Use module.exports for exports, since
            //the exports in here is amdefine exports.
            e = module.exports;
            m = module;
            r = makeRequire(requireFn, e, m, module.id);
        }

        //If there are dependencies, they are strings, so need
        //to convert them to dependency values.
        if (deps) {
            deps = deps.map(function (depName) {
                return r(depName);
            });
        }

        //Call the factory with the right dependencies.
        if (typeof factory === 'function') {
            result = factory.apply(m.exports, deps);
        } else {
            result = factory;
        }

        if (result !== undefined) {
            m.exports = result;
            if (id) {
                loaderCache[id] = m.exports;
            }
        }
    }

    stringRequire = function (systemRequire, exports, module, id, relId) {
        //Split the ID by a ! so that
        var index = id.indexOf('!'),
            originalId = id,
            prefix, plugin;

        if (index === -1) {
            id = normalize(id, relId);

            //Straight module lookup. If it is one of the special dependencies,
            //deal with it, otherwise, delegate to node.
            if (id === 'require') {
                return makeRequire(systemRequire, exports, module, relId);
            } else if (id === 'exports') {
                return exports;
            } else if (id === 'module') {
                return module;
            } else if (loaderCache.hasOwnProperty(id)) {
                return loaderCache[id];
            } else if (defineCache[id]) {
                runFactory.apply(null, defineCache[id]);
                return loaderCache[id];
            } else {
                if(systemRequire) {
                    return systemRequire(originalId);
                } else {
                    throw new Error('No module with ID: ' + id);
                }
            }
        } else {
            //There is a plugin in play.
            prefix = id.substring(0, index);
            id = id.substring(index + 1, id.length);

            plugin = stringRequire(systemRequire, exports, module, prefix, relId);

            if (plugin.normalize) {
                id = plugin.normalize(id, makeNormalize(relId));
            } else {
                //Normalize the ID normally.
                id = normalize(id, relId);
            }

            if (loaderCache[id]) {
                return loaderCache[id];
            } else {
                plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});

                return loaderCache[id];
            }
        }
    };

    //Create a define function specific to the module asking for amdefine.
    function define(id, deps, factory) {
        if (Array.isArray(id)) {
            factory = deps;
            deps = id;
            id = undefined;
        } else if (typeof id !== 'string') {
            factory = id;
            id = deps = undefined;
        }

        if (deps && !Array.isArray(deps)) {
            factory = deps;
            deps = undefined;
        }

        if (!deps) {
            deps = ['require', 'exports', 'module'];
        }

        //Set up properties for this module. If an ID, then use
        //internal cache. If no ID, then use the external variables
        //for this node module.
        if (id) {
            //Put the module in deep freeze until there is a
            //require call for it.
            defineCache[id] = [id, deps, factory];
        } else {
            runFactory(id, deps, factory);
        }
    }

    //define.require, which has access to all the values in the
    //cache. Useful for AMD modules that all have IDs in the file,
    //but need to finally export a value to node based on one of those
    //IDs.
    define.require = function (id) {
        if (loaderCache[id]) {
            return loaderCache[id];
        }

        if (defineCache[id]) {
            runFactory.apply(null, defineCache[id]);
            return loaderCache[id];
        }
    };

    define.amd = {};

    return define;
}

module.exports = amdefine;

}).call(this,require('_process'),"/node_modules/css/node_modules/source-map/node_modules/amdefine/amdefine.js")

},{"_process":3,"path":2}],26:[function(require,module,exports){
// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

var path = require("path")

"use strict"

function urix(aPath) {
  if (path.sep === "\\") {
    return aPath
      .replace(/\\/g, "/")
      .replace(/^[a-z]:\/?/i, "/")
  }
  return aPath
}

module.exports = urix

},{"path":2}],27:[function(require,module,exports){
/**
 * This component is responsible for highlighting the
 * components inside the application and communicating with the external 
 * world by means of the `window.postMessage` and 
 * `window.addEventListener('message')` methods.
 *
 * It has and implementation of a request-response model through that channel, 
 * for more information, see handleFrameRequestMessage
 * 
 * @author Simon Fan, Pat Jenny, Lu Heuko
 */

/**
 * Constants used throughout the component code.
 * @type {Object}
 */
var CONSTANTS = require('./scripts/constants');

/**
 * The class that defines a scope for the highlighters
 * @type {Function}
 */
var HighlighterScope = require('./scripts/classes/highlighter-scope');

/**
 * Behaviors
 */
var FrameMessagingBehavior = require('./scripts/behaviors/frame-messaging');
var AnalysisBehavior       = require('./scripts/behaviors/analysis');
var CanvasBehavior         = require('./scripts/behaviors/canvas');

/**
 * Register the carbo-inspector element
 */
Polymer({
    is: 'carbo-inspector',

    behaviors: [FrameMessagingBehavior, AnalysisBehavior, CanvasBehavior],

    /**
     * Method called whenever the component is ready
     */
    ready: function () {
        /**
         * Array to store the highlighters created
         * for the inspector instance.
         * @type {Array}
         */
        this[CONSTANTS.highlightersNs] = [];
    },

    /**
     * Creates an instance of carbo-highlighter
     * given the options.
     * @param  {Object} options Passed to carbo-highlighter. Also will be
     *                          set on the highlighter data object.
     * @return {CarboHighlighter}         [description]
     */
    createHighlighter: function (options) {

        // Highlighter object
        var _highlighter = new HighlighterScope(options, this);

        // Using this mechanism of creation because Polymer
        // still does not support dinamic data-binding
        // We are using dom-repeat to create
        // the _highlighter instances.
        this.push(CONSTANTS.highlightersNs, _highlighter);

        // Do not forget to flush modifications
        // so that we can safely retrieve
        // the element immediately.
        Polymer.dom.flush();

        // Select the highlighter element just created and
        // save reference at the _highlighter data object
        _highlighter.element = this.$$('#' + _highlighter.id);

        // Return the virtual highlighter object
        return _highlighter;
    },

    /**
     * Retrieves an highlighter object
     * @param  {String} highlighterId 
     *     Identification of the highlighter
     * @return {HighlighterScope}
     *     Representation of the highlighter object
     */
    getHighlighter: function (highlighterId) {
        return _.find(this[CONSTANTS.highlightersNs], function (hlt) {
            return hlt.id === highlighterId;
        });
    },
    
    /**
     * Scrolls the window
     * @param  {Number} deltaX
     * @param  {Number} deltaY
     */
    scrollBy: function (deltaX, deltaY) {
        // console.log('scroll x: %s, y: %s', deltaX, deltaY);
        window.scrollBy(deltaX, deltaY);
    },
});
},{"./scripts/behaviors/analysis":29,"./scripts/behaviors/canvas":30,"./scripts/behaviors/frame-messaging":31,"./scripts/classes/highlighter-scope":33,"./scripts/constants":34}],28:[function(require,module,exports){
/**
 * Helper methods for manipulating DOMNodes
 */

/**
 * Retrieves the computed style of an given element
 * @param  {DOMNode} element The element from which to read computedSytles
 * @return {Object}          Object with the computed styles
 */
exports.getComputedStyle = function (element) {

    if (!element) {
        throw new Error('No element for getComputedStyle(element)');
    }

    var cs = {};

    // Get the computed cs of the element
    var _cs = window.getComputedStyle(element);

    for (var i = _cs.length - 1; i >=0; i--) {
        var prop = _cs[i];

        cs[prop] = _cs.getPropertyValue(prop);
    }

    return cs;
};

/**
 * Retrieves the attributes of a given element
 * @param  {DOMNode} element The element from which to read attributes
 * @return {Object}          Object with all attributes
 */
exports.getAttributes = function (element) {

    if (!element) {
        throw new Error('No element for getAttributes(element)');
    }

    // Object on which to store attributes
    var attributes = {};

    var _attrs = element.attributes;

    for (var i = _attrs.length - 1; i >= 0; i--) {
        attributes[_attrs[i].name] = _attrs[i].value;
    }

    return attributes;
};
},{}],29:[function(require,module,exports){
var DOMHelpers = require('../aux/dom');

exports.getElementAtPoint = function (point) {

}
},{"../aux/dom":28}],30:[function(require,module,exports){
/**
 * Implements behaviors only valid for canvas usage.
 */

exports.attached = function () {


    this._canvas = {

        highlighters: {
            hover: this.createHighlighter({
                surfaceStyle: {
                    border: '3px dashed green'
                }
            }),

            focus: this.createHighlighter({
                surfaceStyle: {
                    border: '3px solid green'
                }
            }),

            loading: this.createHighlighter({
                surfaceStyle: {
                    backgroundColor: 'green',
                    opacity: '0.3',
                }
            }),
        }
    };
};

/**
 * Highlights the element at a given point
 * @param {Object{ x: Number, y: Number}} 
 *         point The point at which the element to be highlighted is
 * @param {Boolean} force
 */
exports.highlightElementAtPoint = function (highlighter, point, force) {
    // get hovered component (Element under that position)
    var element = document.elementFromPoint(point.x, point.y);

    var hlt = this._canvas.highlighters[highlighter];

    hlt.highlight(element);
};

/**
 * Unhighlights
 */
exports.unHighlight = function (highlighter) {
    var hlt = this._canvas.highlighters[highlighter];

    hlt.hide();
};

/**
 * Retrieves information about the active element.
 * @return {{tagName: String, attributes: Object, computedStyle: Object }Object} 
 *         Data on the current active element.
 */
exports.getActiveElementData = function (highlighter) {

    var hlt = this._canvas.highlighters[highlighter];

    return hlt.getTargetData();
};


exports.areFocusAndHoverTogether = function () {

    var focus = this._canvas.highlighters.focus;
    var hover = this._canvas.highlighters.hover;

    return focus.target === hover.target;
};

exports.activateLoading = function () {

    var hlt = this._canvas.highlighters.focus;

    this.$.loading.highlight(hlt.target);
};

exports.deactivateLoading = function () {
    this.$.loading.hide();
};

var WHITELISTED_HIGHLIGHTER_OPERATIONS = {
    getCSSRules: true,
    getCSSSelectors: true,
    getCSSProperties: true,
    getCSSSelectorSpecificity: true
};

/**
 * Executes an operation on a given highlighter
 * @param  {String} highlighterId 
 *     Identifier of the highlighter onto which the operation should be
 *     executed
 * @param  {String} operation
 *     Name of the operation to be executed
 * @param  {Array|*} args
 *     Set of arguments to be passed to the operation
 * @return {*}
 *     Results of the operation. Whatever the operation returns.
 */
exports.executeHighlighterOperation = function (highlighterId, operation, args) {

    // retrieve the highlighter object
    var highlighter = this.getHighlighter(highlighterId) || this._canvas.highlighters.focus;

    if (WHITELISTED_HIGHLIGHTER_OPERATIONS[operation]) {
        return highlighter[operation].apply(highlighter, args);
    } else {
        throw new Error('Too bad: highlighter operation `' + operation + '` not whitelisted. :(')
    }
};
},{}],31:[function(require,module,exports){
/**
 * Enables messaging between frames
 */

var CONSTANTS = require('../constants');

/**
 * Method called whenever the component is ready
 */
exports.ready = function () {
    // Listen to `message` events on the window object.
    // The window is the object that contains the whole application,
    // in the case of the edited application (inside which is the inspector component)
    // it is the `iframe`. 
    // 
    // Only the window receives messages.
    window.addEventListener('message', this.handleFrameRequestMessage.bind(this), false);
};

/**
 * Handles messages from the parent frame.
 * @param  {Event} event the event object
 */
exports.handleFrameRequestMessage = function (event) {
    // método JSON.parse() converte string para JSON
    var request = JSON.parse(event.data);

    // Check if the operationName is whitelisted
    // Not all methods on the inspector object should be
    // available for outside use for security reasons.
    // Thus we should whitelist the available methods
    var operationWhitelisted = CONSTANTS.operationWhitelist[request.operation]; 

    if (operationWhitelisted) {
        // Execute the operation and store the result
        var res = this[request.operation].apply(this, request.args);

        // If the result is a promise, wait for the promise to be 
        // done before returning results
        Q.when(res)
            .then(function (finalRes) {

                // Send message to parent frame passing the request.id
                // so that the parent may resolve to the correct inquiry.
                parent.postMessage(JSON.stringify({
                    id: request.id,

                    // If there is a method to convert the object into 
                    // plain JSON object, do so.
                    res: (finalRes !== undefined && finalRes.toPlainObject) ? finalRes.toPlainObject() : finalRes
                }), '*');

            }.bind(this))
            // terminate promise chain
            .done();

    } else {
        throw new Error('Operation %s is not available at inspector', request.operation);
    }
};
},{"../constants":34}],32:[function(require,module,exports){
/**
 * @class CSSInspector
 *
 * Defines a class for inspecting css rules and stylesheets
 * and their effects on target elements.
 *
 * For the time being, does not perform any intelligence,
 * it delegates to CSSUtilities (by brothercake).
 * 
 * For docs on CSSUtilities:
 * // http://www.brothercake.com/site/resources/scripts/cssutilities/functions
 */

var css = require('css');
var DOMHelpers = require('../aux/dom');

/**
 * Class that proxies methods to CSSUtilities
 * @param {Node} element The element the inspector should work upon
 */
function CSSInspector(defaultOptions, element) {

    // Save the default options
    this.defaultOptions = defaultOptions;

    this.setTarget(element);
}

/**
 * Sets the target element
 * @param {[type]} element [description]
 */
CSSInspector.prototype.setTarget = function (element) {
    this.target = element;
};

/**
 * Default options for `getCSSRules`
 * @type {Object}
 */
var GET_CSS_RULES_DEFAULTS = {
    media: 'screen',
    properties: ['properties', 'selector', 'css'],
    altstates: true,
};

/**
 * Retrieves the rules that apply to the element
 * @param  {[type]} options [description]
 * @return {Promise -> Array}         [description]
 */
CSSInspector.prototype.getCSSRules = function (options) {
    if (!this.target) {
        throw new Error('No target for `getCSSRules`');
    }
    
    // Default setting
    options = _.assign({}, GET_CSS_RULES_DEFAULTS, options);
    // create a defer object
    var defer = Q.defer();
    
    // properties option must be String
    var properties = _.isArray(options.properties) ? 
        options.properties.join(',') : 
        options.properties;

    try {
        // CSSUtilities.getCSSRules(element [, media] [, properties] [, altstates] [, oncomplete])
        CSSUtilities.getCSSRules(
            this.target, 
            options.media, 
            properties,
            options.altstates,
            function (rules) {
                defer.resolve(rules.map(function (r) {
                    return {
                        selector: r.selector,
                        css: r.css,
                        properties: r.properties,
                    };
                }));
            }
        );
    } catch (e) {
        defer.reject(e);
    }

    // return the promise
    return defer.promise;
};

/**
 * Default options for `getCSSProperties`
 * @type {Object}
 */
var GET_CSS_PROPERTIES_DEFAULTS = {
    media: 'screen',
};

/**
 * Retrieves css properties related to the target element
 * @param  {Object} options [description]
 * @return {Promise -> Array}
 */
CSSInspector.prototype.getCSSProperties = function (options) {
    if (!this.target) {
        throw new Error('No target for `getCSSProperties`');
    }

    // Default setting
    options = _.assign({}, GET_CSS_PROPERTIES_DEFAULTS, options);
    // create a defer object
    var defer = Q.defer();

    try {
        // CSSUtilities.getCSSProperties(element [, media] [, oncomplete])
        CSSUtilities.getCSSProperties(
            this.target, 
            options.media, 
            defer.resolve
        );
    } catch (e) {
        defer.reject(e);
    }

    // return the promise
    return defer.promise;
};

/**
 * Default options for getCSSSelectors
 * @type {Object}
 */
var GET_CSS_SELECTORS_DEFAULTS = {
    media: 'screen',
    directonly: true,
};

/**
 * Retrieves css selectors that apply to the target element.
 * @param  {Object} options 
 * @return {Promise -> Array}
 *     Taken from CSSUtilities docs
 *     "The method returns an array of zero or more selectors,
 *     each of which is a String CSS selector,
 *     trimmed of leading or trailing whitespace."
 */
// CSSInspector.prototype.getCSSSelectors = function (options) {
//     if (!this.target) {
//         throw new Error('[CSSInspector] No target for `getCSSSelectors`');
//     }

//     // Default setting
//     options = _.assign({}, GET_CSS_SELECTORS_DEFAULTS, options);

//     var defer = Q.defer();
//     // CSSUtilities.getCSSSelectors(element [, media] [, directonly] [, oncomplete])
    
//     // TODO: study error handling with CSSUtilities
//     // Its asynchronous api should not be dealt with try-catch
//     // but instead some way of error handling on the callback.
//     // But the correct error handling mode was not found until now 
//     // (just starting experiment)
//     try {
//         CSSUtilities.getCSSSelectors(
//             this.target, 
//             options.media, 
//             options.directonly,
//             function (selectors) {
//                 defer.resolve(selectors);
//             }
//         );
//     } catch (e) {
//         defer.reject(e);
//     }

//     return defer.promise;
// };

function getAllStyleRules() {
        
}

CSSInspector.prototype.getCSSSelectors = function (options) {

    var targetRules = [];
    
    var stylesheetRules = Array.prototype.slice.call(document.styleSheets[0], 0);

    stylesheetRules.forEach(function (rule) {
        // Check if rule applies to the target
        var selector = rule.selector;

    }.bind(this));
};


/**
 * Retrieves selector specificity for a given element
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
CSSInspector.prototype.getCSSSelectorSpecificity = function (options) {
    if (!this.target) {
        throw new Error('[CSSInspector] No target for `getCSSSelectorSpecificity`');
    }
    // CSSUtilities.getCSSSelectorSpecificity(selector [, element] [, oncomplete])
};

/**
 * Static methods
 */

CSSInspector.getCSSSelectorSpecificity = function (options) {
    // CSSUtilities.getCSSSelectorSpecificity(selector [, element] [, oncomplete])
};
CSSInspector.getCSSStyleSheetRules = function (options) {
    // CSSUtilities.getCSSStyleSheetRules([media] [, accept] [, ssid] [, oncomplete])
};
CSSInspector.getCSSStyleSheets = function () {
    // CSSUtilities.getCSSStyleSheets([oncomplete])
};

/**
 * Initializes CSSUtilities
 * @return {[type]} [description]
 */
function initializeCSSUtilities() {
    // CSSUtilities is available as a global
    // as it was imported via `script` tag
    
    // set config and initialize
    // Use author mode because we need to access the actual 
    // stylesheets.
    // 
    // This incurs in one extra ajax get request 
    // for each stylesheet in the inspected application.
    // 
    // Also, some methods will run in asynchronous mode, 
    // with callbacks.
    // 
    // docs:
    // http://www.brothercake.com/site/resources/scripts/cssutilities/config/#config-mode
    CSSUtilities.define('mode', 'browser');
    CSSUtilities.define('async', true);
    // Do not take into account inline styles
    CSSUtilities.define('attributes', false);
    CSSUtilities.init();
}

// invoke CSSUtilities initialization immediately
initializeCSSUtilities();

// export
module.exports = CSSInspector;
},{"../aux/dom":28,"css":4}],33:[function(require,module,exports){
/**
 * Class that is responsible for encapsulating scope 
 * for each of the highlighter elements within.
 */

var CONSTANTS      = require('../constants');
var highlightersNs = CONSTANTS.highlightersNs;

var DOMHelpers = require('../aux/dom');


// Load internal dependencies
var CSSInspector = require('./css-inspector');

/**
 * Class that represents the carbo-highlighter element
 * virtually.
 * @param {Object} [data] Data to be set on the scope
 * @param {<carbo-inspector>} [inspector] The inspector instance
 *                                        the highlighter is owned by.
 */
function HighlighterScope(data, inspector) {

    this.id = _.uniqueId('highlighter_');

    // keep reference to the inspector instance
    this.inspector = inspector;

    // Get all data
    _.assign(this, data);

    // instantiate a CSSInspector
    this._cssInspector = new CSSInspector();
}

/**
 * Proxies <carbo-highlighter>.highlight method
 * @param  {Node} element Node to be highlighted
 * @param  {Object} options 
 */
HighlighterScope.prototype.highlight = function (element, options) {

    if (!this.element) {
        throw new Error('No element for HighlighterScope');
    }

    this.set('elementLabel', element.tagName);

    this.element.highlight(element, options);
};

/**
 * Proxies the <carbo-highlighter>.hide method
 */
HighlighterScope.prototype.hide = function () {
    if (!this.element) {
        throw new Error('No element for HighlighterScope');
    }

    this.element.hide();
};

/**
 * Helper method to set data using polymer stuff
 */
HighlighterScope.prototype.set = function (property, value) {

    var path = highlightersNs + '.' + this.index + '.' + property;

    this.inspector.set(path, value);
};

/**
 * Retrieves data about the elemtn
 * @return {Object} [description]
 */
HighlighterScope.prototype.getTargetData = function () {

    var target = this.element.target;
    var data;

    if (target) {

        var boundingRect = target.getBoundingClientRect();

        data = {
            tagName: target.tagName,
            attributes: DOMHelpers.getAttributes(target),
            computedStyle: DOMHelpers.getComputedStyle(target),
            rect: {
                top: boundingRect.top,
                left: boundingRect.left,
                width: boundingRect.width,
                height: boundingRect.height,
            },
        };
    }

    return data;
};

/**
 * Converts the scope data into a plain object ready for 
 * JSON stringification
 * @return {Object}
 */
HighlighterScope.prototype.toPlainObject = function () {

    var obj = {
        id: this.id
    };
    
    return obj;
};

/**
 * Define the index property
 * which will just point to the index at which the highlighter scope
 * is stored at the inspector object.
 */
Object.defineProperty(HighlighterScope.prototype, 'index', {
    get: function () {

        var _highlighters = this.inspector[CONSTANTS.highlightersNs]; 

        return _.indexOf(_highlighters, this);
    },
});



/**
 * CSSInspector proxy methods
 */
var CSS_INSPECTOR_PROXY_METHODS = [
    'getCSSRules',
    'getCSSSelectors',
    'getCSSProperties',
    'getCSSSelectorSpecificity',
];

CSS_INSPECTOR_PROXY_METHODS.forEach(function (methodName) {
    HighlighterScope.prototype[methodName] = function (options) {
        // set the target of the _cssInspector
        this._cssInspector.setTarget(this.element.target);
        return this._cssInspector[methodName](options);
    };
});

module.exports = HighlighterScope;
},{"../aux/dom":28,"../constants":34,"./css-inspector":32}],34:[function(require,module,exports){
/**
 * List of operations that can be called via window.postMessage
 * from the outer world.
 * @type {Object}
 */
exports.operationWhitelist = {
    'highlightElementAtPoint': true,
    'unHighlight': true,
    'getActiveElementData': true,
    'scrollBy': true,
    'areFocusAndHoverTogether': true,
    'activateLoading': true,
    'deactivateLoading': true,
    'executeHighlighterOperation': true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

},{}]},{},[27])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvY3NzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nzcy9saWIvcGFyc2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY3NzL2xpYi9zdHJpbmdpZnkvY29tcGlsZXIuanMiLCJub2RlX21vZHVsZXMvY3NzL2xpYi9zdHJpbmdpZnkvY29tcHJlc3MuanMiLCJub2RlX21vZHVsZXMvY3NzL2xpYi9zdHJpbmdpZnkvaWRlbnRpdHkuanMiLCJub2RlX21vZHVsZXMvY3NzL2xpYi9zdHJpbmdpZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY3NzL2xpYi9zdHJpbmdpZnkvc291cmNlLW1hcC1zdXBwb3J0LmpzIiwibm9kZV9tb2R1bGVzL2Nzcy9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9jc3Mvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAtcmVzb2x2ZS9ub2RlX21vZHVsZXMvcmVzb2x2ZS11cmwvcmVzb2x2ZS11cmwuanMiLCJub2RlX21vZHVsZXMvY3NzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwLXJlc29sdmUvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAtdXJsL3NvdXJjZS1tYXAtdXJsLmpzIiwibm9kZV9tb2R1bGVzL2Nzcy9ub2RlX21vZHVsZXMvc291cmNlLW1hcC1yZXNvbHZlL3NvdXJjZS1tYXAtcmVzb2x2ZS5qcyIsIm5vZGVfbW9kdWxlcy9jc3Mvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL3NvdXJjZS1tYXAuanMiLCJub2RlX21vZHVsZXMvY3NzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwL2FycmF5LXNldC5qcyIsIm5vZGVfbW9kdWxlcy9jc3Mvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL3NvdXJjZS1tYXAvYmFzZTY0LXZscS5qcyIsIm5vZGVfbW9kdWxlcy9jc3Mvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL3NvdXJjZS1tYXAvYmFzZTY0LmpzIiwibm9kZV9tb2R1bGVzL2Nzcy9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW1hcC9iaW5hcnktc2VhcmNoLmpzIiwibm9kZV9tb2R1bGVzL2Nzcy9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW1hcC9tYXBwaW5nLWxpc3QuanMiLCJub2RlX21vZHVsZXMvY3NzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwL3NvdXJjZS1tYXAtY29uc3VtZXIuanMiLCJub2RlX21vZHVsZXMvY3NzL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwL3NvdXJjZS1tYXAtZ2VuZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2Nzcy9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW1hcC9zb3VyY2Utbm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9jc3Mvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL3NvdXJjZS1tYXAvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9jc3Mvbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbm9kZV9tb2R1bGVzL2FtZGVmaW5lL2FtZGVmaW5lLmpzIiwibm9kZV9tb2R1bGVzL2Nzcy9ub2RlX21vZHVsZXMvdXJpeC9pbmRleC5qcyIsInNyYy9jYXJiby1pbnNwZWN0b3IuanMiLCJzcmMvc2NyaXB0cy9hdXgvZG9tLmpzIiwic3JjL3NjcmlwdHMvYmVoYXZpb3JzL2FuYWx5c2lzLmpzIiwic3JjL3NjcmlwdHMvYmVoYXZpb3JzL2NhbnZhcy5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9mcmFtZS1tZXNzYWdpbmcuanMiLCJzcmMvc2NyaXB0cy9jbGFzc2VzL2Nzcy1pbnNwZWN0b3IuanMiLCJzcmMvc2NyaXB0cy9jbGFzc2VzL2hpZ2hsaWdodGVyLXNjb3BlLmpzIiwic3JjL3NjcmlwdHMvY29uc3RhbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9qQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2xpYi9wYXJzZScpO1xuZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2xpYi9zdHJpbmdpZnknKTtcbiIsIi8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL2dyYW1tYXIuaHRtbFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3Zpc2lvbm1lZGlhL2Nzcy1wYXJzZS9wdWxsLzQ5I2lzc3VlY29tbWVudC0zMDA4ODAyN1xudmFyIGNvbW1lbnRyZSA9IC9cXC9cXCpbXipdKlxcKisoW14vKl1bXipdKlxcKispKlxcLy9nXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY3NzLCBvcHRpb25zKXtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgLyoqXG4gICAqIFBvc2l0aW9uYWwuXG4gICAqL1xuXG4gIHZhciBsaW5lbm8gPSAxO1xuICB2YXIgY29sdW1uID0gMTtcblxuICAvKipcbiAgICogVXBkYXRlIGxpbmVubyBhbmQgY29sdW1uIGJhc2VkIG9uIGBzdHJgLlxuICAgKi9cblxuICBmdW5jdGlvbiB1cGRhdGVQb3NpdGlvbihzdHIpIHtcbiAgICB2YXIgbGluZXMgPSBzdHIubWF0Y2goL1xcbi9nKTtcbiAgICBpZiAobGluZXMpIGxpbmVubyArPSBsaW5lcy5sZW5ndGg7XG4gICAgdmFyIGkgPSBzdHIubGFzdEluZGV4T2YoJ1xcbicpO1xuICAgIGNvbHVtbiA9IH5pID8gc3RyLmxlbmd0aCAtIGkgOiBjb2x1bW4gKyBzdHIubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmsgcG9zaXRpb24gYW5kIHBhdGNoIGBub2RlLnBvc2l0aW9uYC5cbiAgICovXG5cbiAgZnVuY3Rpb24gcG9zaXRpb24oKSB7XG4gICAgdmFyIHN0YXJ0ID0geyBsaW5lOiBsaW5lbm8sIGNvbHVtbjogY29sdW1uIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUpe1xuICAgICAgbm9kZS5wb3NpdGlvbiA9IG5ldyBQb3NpdGlvbihzdGFydCk7XG4gICAgICB3aGl0ZXNwYWNlKCk7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3JlIHBvc2l0aW9uIGluZm9ybWF0aW9uIGZvciBhIG5vZGVcbiAgICovXG5cbiAgZnVuY3Rpb24gUG9zaXRpb24oc3RhcnQpIHtcbiAgICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gICAgdGhpcy5lbmQgPSB7IGxpbmU6IGxpbmVubywgY29sdW1uOiBjb2x1bW4gfTtcbiAgICB0aGlzLnNvdXJjZSA9IG9wdGlvbnMuc291cmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vbi1lbnVtZXJhYmxlIHNvdXJjZSBzdHJpbmdcbiAgICovXG5cbiAgUG9zaXRpb24ucHJvdG90eXBlLmNvbnRlbnQgPSBjc3M7XG5cbiAgLyoqXG4gICAqIEVycm9yIGBtc2dgLlxuICAgKi9cblxuICB2YXIgZXJyb3JzTGlzdCA9IFtdO1xuXG4gIGZ1bmN0aW9uIGVycm9yKG1zZykge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3Iob3B0aW9ucy5zb3VyY2UgKyAnOicgKyBsaW5lbm8gKyAnOicgKyBjb2x1bW4gKyAnOiAnICsgbXNnKTtcbiAgICBlcnIucmVhc29uID0gbXNnO1xuICAgIGVyci5maWxlbmFtZSA9IG9wdGlvbnMuc291cmNlO1xuICAgIGVyci5saW5lID0gbGluZW5vO1xuICAgIGVyci5jb2x1bW4gPSBjb2x1bW47XG4gICAgZXJyLnNvdXJjZSA9IGNzcztcblxuICAgIGlmIChvcHRpb25zLnNpbGVudCkge1xuICAgICAgZXJyb3JzTGlzdC5wdXNoKGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2Ugc3R5bGVzaGVldC5cbiAgICovXG5cbiAgZnVuY3Rpb24gc3R5bGVzaGVldCgpIHtcbiAgICB2YXIgcnVsZXNMaXN0ID0gcnVsZXMoKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnc3R5bGVzaGVldCcsXG4gICAgICBzdHlsZXNoZWV0OiB7XG4gICAgICAgIHJ1bGVzOiBydWxlc0xpc3QsXG4gICAgICAgIHBhcnNpbmdFcnJvcnM6IGVycm9yc0xpc3RcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5pbmcgYnJhY2UuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9wZW4oKSB7XG4gICAgcmV0dXJuIG1hdGNoKC9ee1xccyovKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zaW5nIGJyYWNlLlxuICAgKi9cblxuICBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICByZXR1cm4gbWF0Y2goL159Lyk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgcnVsZXNldC5cbiAgICovXG5cbiAgZnVuY3Rpb24gcnVsZXMoKSB7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIHJ1bGVzID0gW107XG4gICAgd2hpdGVzcGFjZSgpO1xuICAgIGNvbW1lbnRzKHJ1bGVzKTtcbiAgICB3aGlsZSAoY3NzLmxlbmd0aCAmJiBjc3MuY2hhckF0KDApICE9ICd9JyAmJiAobm9kZSA9IGF0cnVsZSgpIHx8IHJ1bGUoKSkpIHtcbiAgICAgIGlmIChub2RlICE9PSBmYWxzZSkge1xuICAgICAgICBydWxlcy5wdXNoKG5vZGUpO1xuICAgICAgICBjb21tZW50cyhydWxlcyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBydWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXRjaCBgcmVgIGFuZCByZXR1cm4gY2FwdHVyZXMuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG1hdGNoKHJlKSB7XG4gICAgdmFyIG0gPSByZS5leGVjKGNzcyk7XG4gICAgaWYgKCFtKSByZXR1cm47XG4gICAgdmFyIHN0ciA9IG1bMF07XG4gICAgdXBkYXRlUG9zaXRpb24oc3RyKTtcbiAgICBjc3MgPSBjc3Muc2xpY2Uoc3RyLmxlbmd0aCk7XG4gICAgcmV0dXJuIG07XG4gIH1cblxuICAvKipcbiAgICogUGFyc2Ugd2hpdGVzcGFjZS5cbiAgICovXG5cbiAgZnVuY3Rpb24gd2hpdGVzcGFjZSgpIHtcbiAgICBtYXRjaCgvXlxccyovKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBjb21tZW50cztcbiAgICovXG5cbiAgZnVuY3Rpb24gY29tbWVudHMocnVsZXMpIHtcbiAgICB2YXIgYztcbiAgICBydWxlcyA9IHJ1bGVzIHx8IFtdO1xuICAgIHdoaWxlIChjID0gY29tbWVudCgpKSB7XG4gICAgICBpZiAoYyAhPT0gZmFsc2UpIHtcbiAgICAgICAgcnVsZXMucHVzaChjKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJ1bGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGNvbW1lbnQuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGNvbW1lbnQoKSB7XG4gICAgdmFyIHBvcyA9IHBvc2l0aW9uKCk7XG4gICAgaWYgKCcvJyAhPSBjc3MuY2hhckF0KDApIHx8ICcqJyAhPSBjc3MuY2hhckF0KDEpKSByZXR1cm47XG5cbiAgICB2YXIgaSA9IDI7XG4gICAgd2hpbGUgKFwiXCIgIT0gY3NzLmNoYXJBdChpKSAmJiAoJyonICE9IGNzcy5jaGFyQXQoaSkgfHwgJy8nICE9IGNzcy5jaGFyQXQoaSArIDEpKSkgKytpO1xuICAgIGkgKz0gMjtcblxuICAgIGlmIChcIlwiID09PSBjc3MuY2hhckF0KGktMSkpIHtcbiAgICAgIHJldHVybiBlcnJvcignRW5kIG9mIGNvbW1lbnQgbWlzc2luZycpO1xuICAgIH1cblxuICAgIHZhciBzdHIgPSBjc3Muc2xpY2UoMiwgaSAtIDIpO1xuICAgIGNvbHVtbiArPSAyO1xuICAgIHVwZGF0ZVBvc2l0aW9uKHN0cik7XG4gICAgY3NzID0gY3NzLnNsaWNlKGkpO1xuICAgIGNvbHVtbiArPSAyO1xuXG4gICAgcmV0dXJuIHBvcyh7XG4gICAgICB0eXBlOiAnY29tbWVudCcsXG4gICAgICBjb21tZW50OiBzdHJcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBzZWxlY3Rvci5cbiAgICovXG5cbiAgZnVuY3Rpb24gc2VsZWN0b3IoKSB7XG4gICAgdmFyIG0gPSBtYXRjaCgvXihbXntdKykvKTtcbiAgICBpZiAoIW0pIHJldHVybjtcbiAgICAvKiBAZml4IFJlbW92ZSBhbGwgY29tbWVudHMgZnJvbSBzZWxlY3RvcnNcbiAgICAgKiBodHRwOi8vb3N0ZXJtaWxsZXIub3JnL2ZpbmRjb21tZW50Lmh0bWwgKi9cbiAgICByZXR1cm4gdHJpbShtWzBdKVxuICAgICAgLnJlcGxhY2UoL1xcL1xcKihbXipdfFtcXHJcXG5dfChcXCorKFteKi9dfFtcXHJcXG5dKSkpKlxcKlxcLysvZywgJycpXG4gICAgICAucmVwbGFjZSgvXCIoPzpcXFxcXCJ8W15cIl0pKlwifCcoPzpcXFxcJ3xbXiddKSonL2csIGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgcmV0dXJuIG0ucmVwbGFjZSgvLC9nLCAnXFx1MjAwQycpO1xuICAgICAgfSlcbiAgICAgIC5zcGxpdCgvXFxzKig/IVteKF0qXFwpKSxcXHMqLylcbiAgICAgIC5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXHUyMDBDL2csICcsJyk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBkZWNsYXJhdGlvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gZGVjbGFyYXRpb24oKSB7XG4gICAgdmFyIHBvcyA9IHBvc2l0aW9uKCk7XG5cbiAgICAvLyBwcm9wXG4gICAgdmFyIHByb3AgPSBtYXRjaCgvXihcXCo/Wy0jXFwvXFwqXFxcXFxcd10rKFxcW1swLTlhLXpfLV0rXFxdKT8pXFxzKi8pO1xuICAgIGlmICghcHJvcCkgcmV0dXJuO1xuICAgIHByb3AgPSB0cmltKHByb3BbMF0pO1xuXG4gICAgLy8gOlxuICAgIGlmICghbWF0Y2goL146XFxzKi8pKSByZXR1cm4gZXJyb3IoXCJwcm9wZXJ0eSBtaXNzaW5nICc6J1wiKTtcblxuICAgIC8vIHZhbFxuICAgIHZhciB2YWwgPSBtYXRjaCgvXigoPzonKD86XFxcXCd8LikqPyd8XCIoPzpcXFxcXCJ8LikqP1wifFxcKFteXFwpXSo/XFwpfFtefTtdKSspLyk7XG5cbiAgICB2YXIgcmV0ID0gcG9zKHtcbiAgICAgIHR5cGU6ICdkZWNsYXJhdGlvbicsXG4gICAgICBwcm9wZXJ0eTogcHJvcC5yZXBsYWNlKGNvbW1lbnRyZSwgJycpLFxuICAgICAgdmFsdWU6IHZhbCA/IHRyaW0odmFsWzBdKS5yZXBsYWNlKGNvbW1lbnRyZSwgJycpIDogJydcbiAgICB9KTtcblxuICAgIC8vIDtcbiAgICBtYXRjaCgvXls7XFxzXSovKTtcblxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgZGVjbGFyYXRpb25zLlxuICAgKi9cblxuICBmdW5jdGlvbiBkZWNsYXJhdGlvbnMoKSB7XG4gICAgdmFyIGRlY2xzID0gW107XG5cbiAgICBpZiAoIW9wZW4oKSkgcmV0dXJuIGVycm9yKFwibWlzc2luZyAneydcIik7XG4gICAgY29tbWVudHMoZGVjbHMpO1xuXG4gICAgLy8gZGVjbGFyYXRpb25zXG4gICAgdmFyIGRlY2w7XG4gICAgd2hpbGUgKGRlY2wgPSBkZWNsYXJhdGlvbigpKSB7XG4gICAgICBpZiAoZGVjbCAhPT0gZmFsc2UpIHtcbiAgICAgICAgZGVjbHMucHVzaChkZWNsKTtcbiAgICAgICAgY29tbWVudHMoZGVjbHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghY2xvc2UoKSkgcmV0dXJuIGVycm9yKFwibWlzc2luZyAnfSdcIik7XG4gICAgcmV0dXJuIGRlY2xzO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGtleWZyYW1lLlxuICAgKi9cblxuICBmdW5jdGlvbiBrZXlmcmFtZSgpIHtcbiAgICB2YXIgbTtcbiAgICB2YXIgdmFscyA9IFtdO1xuICAgIHZhciBwb3MgPSBwb3NpdGlvbigpO1xuXG4gICAgd2hpbGUgKG0gPSBtYXRjaCgvXigoXFxkK1xcLlxcZCt8XFwuXFxkK3xcXGQrKSU/fFthLXpdKylcXHMqLykpIHtcbiAgICAgIHZhbHMucHVzaChtWzFdKTtcbiAgICAgIG1hdGNoKC9eLFxccyovKTtcbiAgICB9XG5cbiAgICBpZiAoIXZhbHMubGVuZ3RoKSByZXR1cm47XG5cbiAgICByZXR1cm4gcG9zKHtcbiAgICAgIHR5cGU6ICdrZXlmcmFtZScsXG4gICAgICB2YWx1ZXM6IHZhbHMsXG4gICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucygpXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2Uga2V5ZnJhbWVzLlxuICAgKi9cblxuICBmdW5jdGlvbiBhdGtleWZyYW1lcygpIHtcbiAgICB2YXIgcG9zID0gcG9zaXRpb24oKTtcbiAgICB2YXIgbSA9IG1hdGNoKC9eQChbLVxcd10rKT9rZXlmcmFtZXNcXHMqLyk7XG5cbiAgICBpZiAoIW0pIHJldHVybjtcbiAgICB2YXIgdmVuZG9yID0gbVsxXTtcblxuICAgIC8vIGlkZW50aWZpZXJcbiAgICB2YXIgbSA9IG1hdGNoKC9eKFstXFx3XSspXFxzKi8pO1xuICAgIGlmICghbSkgcmV0dXJuIGVycm9yKFwiQGtleWZyYW1lcyBtaXNzaW5nIG5hbWVcIik7XG4gICAgdmFyIG5hbWUgPSBtWzFdO1xuXG4gICAgaWYgKCFvcGVuKCkpIHJldHVybiBlcnJvcihcIkBrZXlmcmFtZXMgbWlzc2luZyAneydcIik7XG5cbiAgICB2YXIgZnJhbWU7XG4gICAgdmFyIGZyYW1lcyA9IGNvbW1lbnRzKCk7XG4gICAgd2hpbGUgKGZyYW1lID0ga2V5ZnJhbWUoKSkge1xuICAgICAgZnJhbWVzLnB1c2goZnJhbWUpO1xuICAgICAgZnJhbWVzID0gZnJhbWVzLmNvbmNhdChjb21tZW50cygpKTtcbiAgICB9XG5cbiAgICBpZiAoIWNsb3NlKCkpIHJldHVybiBlcnJvcihcIkBrZXlmcmFtZXMgbWlzc2luZyAnfSdcIik7XG5cbiAgICByZXR1cm4gcG9zKHtcbiAgICAgIHR5cGU6ICdrZXlmcmFtZXMnLFxuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIHZlbmRvcjogdmVuZG9yLFxuICAgICAga2V5ZnJhbWVzOiBmcmFtZXNcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBzdXBwb3J0cy5cbiAgICovXG5cbiAgZnVuY3Rpb24gYXRzdXBwb3J0cygpIHtcbiAgICB2YXIgcG9zID0gcG9zaXRpb24oKTtcbiAgICB2YXIgbSA9IG1hdGNoKC9eQHN1cHBvcnRzICooW157XSspLyk7XG5cbiAgICBpZiAoIW0pIHJldHVybjtcbiAgICB2YXIgc3VwcG9ydHMgPSB0cmltKG1bMV0pO1xuXG4gICAgaWYgKCFvcGVuKCkpIHJldHVybiBlcnJvcihcIkBzdXBwb3J0cyBtaXNzaW5nICd7J1wiKTtcblxuICAgIHZhciBzdHlsZSA9IGNvbW1lbnRzKCkuY29uY2F0KHJ1bGVzKCkpO1xuXG4gICAgaWYgKCFjbG9zZSgpKSByZXR1cm4gZXJyb3IoXCJAc3VwcG9ydHMgbWlzc2luZyAnfSdcIik7XG5cbiAgICByZXR1cm4gcG9zKHtcbiAgICAgIHR5cGU6ICdzdXBwb3J0cycsXG4gICAgICBzdXBwb3J0czogc3VwcG9ydHMsXG4gICAgICBydWxlczogc3R5bGVcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBob3N0LlxuICAgKi9cblxuICBmdW5jdGlvbiBhdGhvc3QoKSB7XG4gICAgdmFyIHBvcyA9IHBvc2l0aW9uKCk7XG4gICAgdmFyIG0gPSBtYXRjaCgvXkBob3N0XFxzKi8pO1xuXG4gICAgaWYgKCFtKSByZXR1cm47XG5cbiAgICBpZiAoIW9wZW4oKSkgcmV0dXJuIGVycm9yKFwiQGhvc3QgbWlzc2luZyAneydcIik7XG5cbiAgICB2YXIgc3R5bGUgPSBjb21tZW50cygpLmNvbmNhdChydWxlcygpKTtcblxuICAgIGlmICghY2xvc2UoKSkgcmV0dXJuIGVycm9yKFwiQGhvc3QgbWlzc2luZyAnfSdcIik7XG5cbiAgICByZXR1cm4gcG9zKHtcbiAgICAgIHR5cGU6ICdob3N0JyxcbiAgICAgIHJ1bGVzOiBzdHlsZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIG1lZGlhLlxuICAgKi9cblxuICBmdW5jdGlvbiBhdG1lZGlhKCkge1xuICAgIHZhciBwb3MgPSBwb3NpdGlvbigpO1xuICAgIHZhciBtID0gbWF0Y2goL15AbWVkaWEgKihbXntdKykvKTtcblxuICAgIGlmICghbSkgcmV0dXJuO1xuICAgIHZhciBtZWRpYSA9IHRyaW0obVsxXSk7XG5cbiAgICBpZiAoIW9wZW4oKSkgcmV0dXJuIGVycm9yKFwiQG1lZGlhIG1pc3NpbmcgJ3snXCIpO1xuXG4gICAgdmFyIHN0eWxlID0gY29tbWVudHMoKS5jb25jYXQocnVsZXMoKSk7XG5cbiAgICBpZiAoIWNsb3NlKCkpIHJldHVybiBlcnJvcihcIkBtZWRpYSBtaXNzaW5nICd9J1wiKTtcblxuICAgIHJldHVybiBwb3Moe1xuICAgICAgdHlwZTogJ21lZGlhJyxcbiAgICAgIG1lZGlhOiBtZWRpYSxcbiAgICAgIHJ1bGVzOiBzdHlsZVxuICAgIH0pO1xuICB9XG5cblxuICAvKipcbiAgICogUGFyc2UgY3VzdG9tLW1lZGlhLlxuICAgKi9cblxuICBmdW5jdGlvbiBhdGN1c3RvbW1lZGlhKCkge1xuICAgIHZhciBwb3MgPSBwb3NpdGlvbigpO1xuICAgIHZhciBtID0gbWF0Y2goL15AY3VzdG9tLW1lZGlhXFxzKygtLVteXFxzXSspXFxzKihbXns7XSspOy8pO1xuICAgIGlmICghbSkgcmV0dXJuO1xuXG4gICAgcmV0dXJuIHBvcyh7XG4gICAgICB0eXBlOiAnY3VzdG9tLW1lZGlhJyxcbiAgICAgIG5hbWU6IHRyaW0obVsxXSksXG4gICAgICBtZWRpYTogdHJpbShtWzJdKVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHBhZ2VkIG1lZGlhLlxuICAgKi9cblxuICBmdW5jdGlvbiBhdHBhZ2UoKSB7XG4gICAgdmFyIHBvcyA9IHBvc2l0aW9uKCk7XG4gICAgdmFyIG0gPSBtYXRjaCgvXkBwYWdlICovKTtcbiAgICBpZiAoIW0pIHJldHVybjtcblxuICAgIHZhciBzZWwgPSBzZWxlY3RvcigpIHx8IFtdO1xuXG4gICAgaWYgKCFvcGVuKCkpIHJldHVybiBlcnJvcihcIkBwYWdlIG1pc3NpbmcgJ3snXCIpO1xuICAgIHZhciBkZWNscyA9IGNvbW1lbnRzKCk7XG5cbiAgICAvLyBkZWNsYXJhdGlvbnNcbiAgICB2YXIgZGVjbDtcbiAgICB3aGlsZSAoZGVjbCA9IGRlY2xhcmF0aW9uKCkpIHtcbiAgICAgIGRlY2xzLnB1c2goZGVjbCk7XG4gICAgICBkZWNscyA9IGRlY2xzLmNvbmNhdChjb21tZW50cygpKTtcbiAgICB9XG5cbiAgICBpZiAoIWNsb3NlKCkpIHJldHVybiBlcnJvcihcIkBwYWdlIG1pc3NpbmcgJ30nXCIpO1xuXG4gICAgcmV0dXJuIHBvcyh7XG4gICAgICB0eXBlOiAncGFnZScsXG4gICAgICBzZWxlY3RvcnM6IHNlbCxcbiAgICAgIGRlY2xhcmF0aW9uczogZGVjbHNcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBkb2N1bWVudC5cbiAgICovXG5cbiAgZnVuY3Rpb24gYXRkb2N1bWVudCgpIHtcbiAgICB2YXIgcG9zID0gcG9zaXRpb24oKTtcbiAgICB2YXIgbSA9IG1hdGNoKC9eQChbLVxcd10rKT9kb2N1bWVudCAqKFtee10rKS8pO1xuICAgIGlmICghbSkgcmV0dXJuO1xuXG4gICAgdmFyIHZlbmRvciA9IHRyaW0obVsxXSk7XG4gICAgdmFyIGRvYyA9IHRyaW0obVsyXSk7XG5cbiAgICBpZiAoIW9wZW4oKSkgcmV0dXJuIGVycm9yKFwiQGRvY3VtZW50IG1pc3NpbmcgJ3snXCIpO1xuXG4gICAgdmFyIHN0eWxlID0gY29tbWVudHMoKS5jb25jYXQocnVsZXMoKSk7XG5cbiAgICBpZiAoIWNsb3NlKCkpIHJldHVybiBlcnJvcihcIkBkb2N1bWVudCBtaXNzaW5nICd9J1wiKTtcblxuICAgIHJldHVybiBwb3Moe1xuICAgICAgdHlwZTogJ2RvY3VtZW50JyxcbiAgICAgIGRvY3VtZW50OiBkb2MsXG4gICAgICB2ZW5kb3I6IHZlbmRvcixcbiAgICAgIHJ1bGVzOiBzdHlsZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGZvbnQtZmFjZS5cbiAgICovXG5cbiAgZnVuY3Rpb24gYXRmb250ZmFjZSgpIHtcbiAgICB2YXIgcG9zID0gcG9zaXRpb24oKTtcbiAgICB2YXIgbSA9IG1hdGNoKC9eQGZvbnQtZmFjZVxccyovKTtcbiAgICBpZiAoIW0pIHJldHVybjtcblxuICAgIGlmICghb3BlbigpKSByZXR1cm4gZXJyb3IoXCJAZm9udC1mYWNlIG1pc3NpbmcgJ3snXCIpO1xuICAgIHZhciBkZWNscyA9IGNvbW1lbnRzKCk7XG5cbiAgICAvLyBkZWNsYXJhdGlvbnNcbiAgICB2YXIgZGVjbDtcbiAgICB3aGlsZSAoZGVjbCA9IGRlY2xhcmF0aW9uKCkpIHtcbiAgICAgIGRlY2xzLnB1c2goZGVjbCk7XG4gICAgICBkZWNscyA9IGRlY2xzLmNvbmNhdChjb21tZW50cygpKTtcbiAgICB9XG5cbiAgICBpZiAoIWNsb3NlKCkpIHJldHVybiBlcnJvcihcIkBmb250LWZhY2UgbWlzc2luZyAnfSdcIik7XG5cbiAgICByZXR1cm4gcG9zKHtcbiAgICAgIHR5cGU6ICdmb250LWZhY2UnLFxuICAgICAgZGVjbGFyYXRpb25zOiBkZWNsc1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGltcG9ydFxuICAgKi9cblxuICB2YXIgYXRpbXBvcnQgPSBfY29tcGlsZUF0cnVsZSgnaW1wb3J0Jyk7XG5cbiAgLyoqXG4gICAqIFBhcnNlIGNoYXJzZXRcbiAgICovXG5cbiAgdmFyIGF0Y2hhcnNldCA9IF9jb21waWxlQXRydWxlKCdjaGFyc2V0Jyk7XG5cbiAgLyoqXG4gICAqIFBhcnNlIG5hbWVzcGFjZVxuICAgKi9cblxuICB2YXIgYXRuYW1lc3BhY2UgPSBfY29tcGlsZUF0cnVsZSgnbmFtZXNwYWNlJyk7XG5cbiAgLyoqXG4gICAqIFBhcnNlIG5vbi1ibG9jayBhdC1ydWxlc1xuICAgKi9cblxuXG4gIGZ1bmN0aW9uIF9jb21waWxlQXRydWxlKG5hbWUpIHtcbiAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKCdeQCcgKyBuYW1lICsgJ1xcXFxzKihbXjtdKyk7Jyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBvcyA9IHBvc2l0aW9uKCk7XG4gICAgICB2YXIgbSA9IG1hdGNoKHJlKTtcbiAgICAgIGlmICghbSkgcmV0dXJuO1xuICAgICAgdmFyIHJldCA9IHsgdHlwZTogbmFtZSB9O1xuICAgICAgcmV0W25hbWVdID0gbVsxXS50cmltKCk7XG4gICAgICByZXR1cm4gcG9zKHJldCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGF0IHJ1bGUuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGF0cnVsZSgpIHtcbiAgICBpZiAoY3NzWzBdICE9ICdAJykgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGF0a2V5ZnJhbWVzKClcbiAgICAgIHx8IGF0bWVkaWEoKVxuICAgICAgfHwgYXRjdXN0b21tZWRpYSgpXG4gICAgICB8fCBhdHN1cHBvcnRzKClcbiAgICAgIHx8IGF0aW1wb3J0KClcbiAgICAgIHx8IGF0Y2hhcnNldCgpXG4gICAgICB8fCBhdG5hbWVzcGFjZSgpXG4gICAgICB8fCBhdGRvY3VtZW50KClcbiAgICAgIHx8IGF0cGFnZSgpXG4gICAgICB8fCBhdGhvc3QoKVxuICAgICAgfHwgYXRmb250ZmFjZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHJ1bGUuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHJ1bGUoKSB7XG4gICAgdmFyIHBvcyA9IHBvc2l0aW9uKCk7XG4gICAgdmFyIHNlbCA9IHNlbGVjdG9yKCk7XG5cbiAgICBpZiAoIXNlbCkgcmV0dXJuIGVycm9yKCdzZWxlY3RvciBtaXNzaW5nJyk7XG4gICAgY29tbWVudHMoKTtcblxuICAgIHJldHVybiBwb3Moe1xuICAgICAgdHlwZTogJ3J1bGUnLFxuICAgICAgc2VsZWN0b3JzOiBzZWwsXG4gICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucygpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYWRkUGFyZW50KHN0eWxlc2hlZXQoKSk7XG59O1xuXG4vKipcbiAqIFRyaW0gYHN0cmAuXG4gKi9cblxuZnVuY3Rpb24gdHJpbShzdHIpIHtcbiAgcmV0dXJuIHN0ciA/IHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJykgOiAnJztcbn1cblxuLyoqXG4gKiBBZGRzIG5vbi1lbnVtZXJhYmxlIHBhcmVudCBub2RlIHJlZmVyZW5jZSB0byBlYWNoIG5vZGUuXG4gKi9cblxuZnVuY3Rpb24gYWRkUGFyZW50KG9iaiwgcGFyZW50KSB7XG4gIHZhciBpc05vZGUgPSBvYmogJiYgdHlwZW9mIG9iai50eXBlID09PSAnc3RyaW5nJztcbiAgdmFyIGNoaWxkUGFyZW50ID0gaXNOb2RlID8gb2JqIDogcGFyZW50O1xuXG4gIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgdmFyIHZhbHVlID0gb2JqW2tdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgdmFsdWUuZm9yRWFjaChmdW5jdGlvbih2KSB7IGFkZFBhcmVudCh2LCBjaGlsZFBhcmVudCk7IH0pO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgYWRkUGFyZW50KHZhbHVlLCBjaGlsZFBhcmVudCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzTm9kZSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosICdwYXJlbnQnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgdmFsdWU6IHBhcmVudCB8fCBudWxsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuIiwiXG4vKipcbiAqIEV4cG9zZSBgQ29tcGlsZXJgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGlsZXI7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIGNvbXBpbGVyLlxuICpcbiAqIEBwYXJhbSB7VHlwZX0gbmFtZVxuICogQHJldHVybiB7VHlwZX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gQ29tcGlsZXIob3B0cykge1xuICB0aGlzLm9wdGlvbnMgPSBvcHRzIHx8IHt9O1xufVxuXG4vKipcbiAqIEVtaXQgYHN0cmBcbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHN0cikge1xuICByZXR1cm4gc3RyO1xufTtcblxuLyoqXG4gKiBWaXNpdCBgbm9kZWAuXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlLnZpc2l0ID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzW25vZGUudHlwZV0obm9kZSk7XG59O1xuXG4vKipcbiAqIE1hcCB2aXNpdCBvdmVyIGFycmF5IG9mIGBub2Rlc2AsIG9wdGlvbmFsbHkgdXNpbmcgYSBgZGVsaW1gXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlLm1hcFZpc2l0ID0gZnVuY3Rpb24obm9kZXMsIGRlbGltKXtcbiAgdmFyIGJ1ZiA9ICcnO1xuICBkZWxpbSA9IGRlbGltIHx8ICcnO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBub2Rlcy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGJ1ZiArPSB0aGlzLnZpc2l0KG5vZGVzW2ldKTtcbiAgICBpZiAoZGVsaW0gJiYgaSA8IGxlbmd0aCAtIDEpIGJ1ZiArPSB0aGlzLmVtaXQoZGVsaW0pO1xuICB9XG5cbiAgcmV0dXJuIGJ1Zjtcbn07XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vY29tcGlsZXInKTtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbi8qKlxuICogRXhwb3NlIGNvbXBpbGVyLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGlsZXI7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgQ29tcGlsZXJgLlxuICovXG5cbmZ1bmN0aW9uIENvbXBpbGVyKG9wdGlvbnMpIHtcbiAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgQmFzZS5wcm90b3R5cGVgLlxuICovXG5cbmluaGVyaXRzKENvbXBpbGVyLCBCYXNlKTtcblxuLyoqXG4gKiBDb21waWxlIGBub2RlYC5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKG5vZGUpe1xuICByZXR1cm4gbm9kZS5zdHlsZXNoZWV0XG4gICAgLnJ1bGVzLm1hcCh0aGlzLnZpc2l0LCB0aGlzKVxuICAgIC5qb2luKCcnKTtcbn07XG5cbi8qKlxuICogVmlzaXQgY29tbWVudCBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5jb21tZW50ID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJycsIG5vZGUucG9zaXRpb24pO1xufTtcblxuLyoqXG4gKiBWaXNpdCBpbXBvcnQgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuaW1wb3J0ID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0BpbXBvcnQgJyArIG5vZGUuaW1wb3J0ICsgJzsnLCBub2RlLnBvc2l0aW9uKTtcbn07XG5cbi8qKlxuICogVmlzaXQgbWVkaWEgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUubWVkaWEgPSBmdW5jdGlvbihub2RlKXtcbiAgcmV0dXJuIHRoaXMuZW1pdCgnQG1lZGlhICcgKyBub2RlLm1lZGlhLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KCd7JylcbiAgICArIHRoaXMubWFwVmlzaXQobm9kZS5ydWxlcylcbiAgICArIHRoaXMuZW1pdCgnfScpO1xufTtcblxuLyoqXG4gKiBWaXNpdCBkb2N1bWVudCBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5kb2N1bWVudCA9IGZ1bmN0aW9uKG5vZGUpe1xuICB2YXIgZG9jID0gJ0AnICsgKG5vZGUudmVuZG9yIHx8ICcnKSArICdkb2N1bWVudCAnICsgbm9kZS5kb2N1bWVudDtcblxuICByZXR1cm4gdGhpcy5lbWl0KGRvYywgbm9kZS5wb3NpdGlvbilcbiAgICArIHRoaXMuZW1pdCgneycpXG4gICAgKyB0aGlzLm1hcFZpc2l0KG5vZGUucnVsZXMpXG4gICAgKyB0aGlzLmVtaXQoJ30nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgY2hhcnNldCBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5jaGFyc2V0ID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0BjaGFyc2V0ICcgKyBub2RlLmNoYXJzZXQgKyAnOycsIG5vZGUucG9zaXRpb24pO1xufTtcblxuLyoqXG4gKiBWaXNpdCBuYW1lc3BhY2Ugbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUubmFtZXNwYWNlID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0BuYW1lc3BhY2UgJyArIG5vZGUubmFtZXNwYWNlICsgJzsnLCBub2RlLnBvc2l0aW9uKTtcbn07XG5cbi8qKlxuICogVmlzaXQgc3VwcG9ydHMgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuc3VwcG9ydHMgPSBmdW5jdGlvbihub2RlKXtcbiAgcmV0dXJuIHRoaXMuZW1pdCgnQHN1cHBvcnRzICcgKyBub2RlLnN1cHBvcnRzLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KCd7JylcbiAgICArIHRoaXMubWFwVmlzaXQobm9kZS5ydWxlcylcbiAgICArIHRoaXMuZW1pdCgnfScpO1xufTtcblxuLyoqXG4gKiBWaXNpdCBrZXlmcmFtZXMgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUua2V5ZnJhbWVzID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0AnXG4gICAgKyAobm9kZS52ZW5kb3IgfHwgJycpXG4gICAgKyAna2V5ZnJhbWVzICdcbiAgICArIG5vZGUubmFtZSwgbm9kZS5wb3NpdGlvbilcbiAgICArIHRoaXMuZW1pdCgneycpXG4gICAgKyB0aGlzLm1hcFZpc2l0KG5vZGUua2V5ZnJhbWVzKVxuICAgICsgdGhpcy5lbWl0KCd9Jyk7XG59O1xuXG4vKipcbiAqIFZpc2l0IGtleWZyYW1lIG5vZGUuXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlLmtleWZyYW1lID0gZnVuY3Rpb24obm9kZSl7XG4gIHZhciBkZWNscyA9IG5vZGUuZGVjbGFyYXRpb25zO1xuXG4gIHJldHVybiB0aGlzLmVtaXQobm9kZS52YWx1ZXMuam9pbignLCcpLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KCd7JylcbiAgICArIHRoaXMubWFwVmlzaXQoZGVjbHMpXG4gICAgKyB0aGlzLmVtaXQoJ30nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgcGFnZSBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5wYWdlID0gZnVuY3Rpb24obm9kZSl7XG4gIHZhciBzZWwgPSBub2RlLnNlbGVjdG9ycy5sZW5ndGhcbiAgICA/IG5vZGUuc2VsZWN0b3JzLmpvaW4oJywgJylcbiAgICA6ICcnO1xuXG4gIHJldHVybiB0aGlzLmVtaXQoJ0BwYWdlICcgKyBzZWwsIG5vZGUucG9zaXRpb24pXG4gICAgKyB0aGlzLmVtaXQoJ3snKVxuICAgICsgdGhpcy5tYXBWaXNpdChub2RlLmRlY2xhcmF0aW9ucylcbiAgICArIHRoaXMuZW1pdCgnfScpO1xufTtcblxuLyoqXG4gKiBWaXNpdCBmb250LWZhY2Ugbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGVbJ2ZvbnQtZmFjZSddID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0Bmb250LWZhY2UnLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KCd7JylcbiAgICArIHRoaXMubWFwVmlzaXQobm9kZS5kZWNsYXJhdGlvbnMpXG4gICAgKyB0aGlzLmVtaXQoJ30nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgaG9zdCBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5ob3N0ID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0Bob3N0Jywgbm9kZS5wb3NpdGlvbilcbiAgICArIHRoaXMuZW1pdCgneycpXG4gICAgKyB0aGlzLm1hcFZpc2l0KG5vZGUucnVsZXMpXG4gICAgKyB0aGlzLmVtaXQoJ30nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgY3VzdG9tLW1lZGlhIG5vZGUuXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlWydjdXN0b20tbWVkaWEnXSA9IGZ1bmN0aW9uKG5vZGUpe1xuICByZXR1cm4gdGhpcy5lbWl0KCdAY3VzdG9tLW1lZGlhICcgKyBub2RlLm5hbWUgKyAnICcgKyBub2RlLm1lZGlhICsgJzsnLCBub2RlLnBvc2l0aW9uKTtcbn07XG5cbi8qKlxuICogVmlzaXQgcnVsZSBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5ydWxlID0gZnVuY3Rpb24obm9kZSl7XG4gIHZhciBkZWNscyA9IG5vZGUuZGVjbGFyYXRpb25zO1xuICBpZiAoIWRlY2xzLmxlbmd0aCkgcmV0dXJuICcnO1xuXG4gIHJldHVybiB0aGlzLmVtaXQobm9kZS5zZWxlY3RvcnMuam9pbignLCcpLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KCd7JylcbiAgICArIHRoaXMubWFwVmlzaXQoZGVjbHMpXG4gICAgKyB0aGlzLmVtaXQoJ30nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgZGVjbGFyYXRpb24gbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuZGVjbGFyYXRpb24gPSBmdW5jdGlvbihub2RlKXtcbiAgcmV0dXJuIHRoaXMuZW1pdChub2RlLnByb3BlcnR5ICsgJzonICsgbm9kZS52YWx1ZSwgbm9kZS5wb3NpdGlvbikgKyB0aGlzLmVtaXQoJzsnKTtcbn07XG5cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9jb21waWxlcicpO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuLyoqXG4gKiBFeHBvc2UgY29tcGlsZXIuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb21waWxlcjtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBDb21waWxlcmAuXG4gKi9cblxuZnVuY3Rpb24gQ29tcGlsZXIob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgQmFzZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICB0aGlzLmluZGVudGF0aW9uID0gb3B0aW9ucy5pbmRlbnQ7XG59XG5cbi8qKlxuICogSW5oZXJpdCBmcm9tIGBCYXNlLnByb3RvdHlwZWAuXG4gKi9cblxuaW5oZXJpdHMoQ29tcGlsZXIsIEJhc2UpO1xuXG4vKipcbiAqIENvbXBpbGUgYG5vZGVgLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLnN0eWxlc2hlZXQobm9kZSk7XG59O1xuXG4vKipcbiAqIFZpc2l0IHN0eWxlc2hlZXQgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuc3R5bGVzaGVldCA9IGZ1bmN0aW9uKG5vZGUpe1xuICByZXR1cm4gdGhpcy5tYXBWaXNpdChub2RlLnN0eWxlc2hlZXQucnVsZXMsICdcXG5cXG4nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgY29tbWVudCBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5jb21tZW50ID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQodGhpcy5pbmRlbnQoKSArICcvKicgKyBub2RlLmNvbW1lbnQgKyAnKi8nLCBub2RlLnBvc2l0aW9uKTtcbn07XG5cbi8qKlxuICogVmlzaXQgaW1wb3J0IG5vZGUuXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlLmltcG9ydCA9IGZ1bmN0aW9uKG5vZGUpe1xuICByZXR1cm4gdGhpcy5lbWl0KCdAaW1wb3J0ICcgKyBub2RlLmltcG9ydCArICc7Jywgbm9kZS5wb3NpdGlvbik7XG59O1xuXG4vKipcbiAqIFZpc2l0IG1lZGlhIG5vZGUuXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlLm1lZGlhID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0BtZWRpYSAnICsgbm9kZS5tZWRpYSwgbm9kZS5wb3NpdGlvbilcbiAgICArIHRoaXMuZW1pdChcbiAgICAgICAgJyB7XFxuJ1xuICAgICAgICArIHRoaXMuaW5kZW50KDEpKVxuICAgICsgdGhpcy5tYXBWaXNpdChub2RlLnJ1bGVzLCAnXFxuXFxuJylcbiAgICArIHRoaXMuZW1pdChcbiAgICAgICAgdGhpcy5pbmRlbnQoLTEpXG4gICAgICAgICsgJ1xcbn0nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgZG9jdW1lbnQgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuZG9jdW1lbnQgPSBmdW5jdGlvbihub2RlKXtcbiAgdmFyIGRvYyA9ICdAJyArIChub2RlLnZlbmRvciB8fCAnJykgKyAnZG9jdW1lbnQgJyArIG5vZGUuZG9jdW1lbnQ7XG5cbiAgcmV0dXJuIHRoaXMuZW1pdChkb2MsIG5vZGUucG9zaXRpb24pXG4gICAgKyB0aGlzLmVtaXQoXG4gICAgICAgICcgJ1xuICAgICAgKyAnIHtcXG4nXG4gICAgICArIHRoaXMuaW5kZW50KDEpKVxuICAgICsgdGhpcy5tYXBWaXNpdChub2RlLnJ1bGVzLCAnXFxuXFxuJylcbiAgICArIHRoaXMuZW1pdChcbiAgICAgICAgdGhpcy5pbmRlbnQoLTEpXG4gICAgICAgICsgJ1xcbn0nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgY2hhcnNldCBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5jaGFyc2V0ID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0BjaGFyc2V0ICcgKyBub2RlLmNoYXJzZXQgKyAnOycsIG5vZGUucG9zaXRpb24pO1xufTtcblxuLyoqXG4gKiBWaXNpdCBuYW1lc3BhY2Ugbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUubmFtZXNwYWNlID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0BuYW1lc3BhY2UgJyArIG5vZGUubmFtZXNwYWNlICsgJzsnLCBub2RlLnBvc2l0aW9uKTtcbn07XG5cbi8qKlxuICogVmlzaXQgc3VwcG9ydHMgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuc3VwcG9ydHMgPSBmdW5jdGlvbihub2RlKXtcbiAgcmV0dXJuIHRoaXMuZW1pdCgnQHN1cHBvcnRzICcgKyBub2RlLnN1cHBvcnRzLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KFxuICAgICAgJyB7XFxuJ1xuICAgICAgKyB0aGlzLmluZGVudCgxKSlcbiAgICArIHRoaXMubWFwVmlzaXQobm9kZS5ydWxlcywgJ1xcblxcbicpXG4gICAgKyB0aGlzLmVtaXQoXG4gICAgICAgIHRoaXMuaW5kZW50KC0xKVxuICAgICAgICArICdcXG59Jyk7XG59O1xuXG4vKipcbiAqIFZpc2l0IGtleWZyYW1lcyBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5rZXlmcmFtZXMgPSBmdW5jdGlvbihub2RlKXtcbiAgcmV0dXJuIHRoaXMuZW1pdCgnQCcgKyAobm9kZS52ZW5kb3IgfHwgJycpICsgJ2tleWZyYW1lcyAnICsgbm9kZS5uYW1lLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KFxuICAgICAgJyB7XFxuJ1xuICAgICAgKyB0aGlzLmluZGVudCgxKSlcbiAgICArIHRoaXMubWFwVmlzaXQobm9kZS5rZXlmcmFtZXMsICdcXG4nKVxuICAgICsgdGhpcy5lbWl0KFxuICAgICAgICB0aGlzLmluZGVudCgtMSlcbiAgICAgICAgKyAnfScpO1xufTtcblxuLyoqXG4gKiBWaXNpdCBrZXlmcmFtZSBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5rZXlmcmFtZSA9IGZ1bmN0aW9uKG5vZGUpe1xuICB2YXIgZGVjbHMgPSBub2RlLmRlY2xhcmF0aW9ucztcblxuICByZXR1cm4gdGhpcy5lbWl0KHRoaXMuaW5kZW50KCkpXG4gICAgKyB0aGlzLmVtaXQobm9kZS52YWx1ZXMuam9pbignLCAnKSwgbm9kZS5wb3NpdGlvbilcbiAgICArIHRoaXMuZW1pdChcbiAgICAgICcge1xcbidcbiAgICAgICsgdGhpcy5pbmRlbnQoMSkpXG4gICAgKyB0aGlzLm1hcFZpc2l0KGRlY2xzLCAnXFxuJylcbiAgICArIHRoaXMuZW1pdChcbiAgICAgIHRoaXMuaW5kZW50KC0xKVxuICAgICAgKyAnXFxuJ1xuICAgICAgKyB0aGlzLmluZGVudCgpICsgJ31cXG4nKTtcbn07XG5cbi8qKlxuICogVmlzaXQgcGFnZSBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5wYWdlID0gZnVuY3Rpb24obm9kZSl7XG4gIHZhciBzZWwgPSBub2RlLnNlbGVjdG9ycy5sZW5ndGhcbiAgICA/IG5vZGUuc2VsZWN0b3JzLmpvaW4oJywgJykgKyAnICdcbiAgICA6ICcnO1xuXG4gIHJldHVybiB0aGlzLmVtaXQoJ0BwYWdlICcgKyBzZWwsIG5vZGUucG9zaXRpb24pXG4gICAgKyB0aGlzLmVtaXQoJ3tcXG4nKVxuICAgICsgdGhpcy5lbWl0KHRoaXMuaW5kZW50KDEpKVxuICAgICsgdGhpcy5tYXBWaXNpdChub2RlLmRlY2xhcmF0aW9ucywgJ1xcbicpXG4gICAgKyB0aGlzLmVtaXQodGhpcy5pbmRlbnQoLTEpKVxuICAgICsgdGhpcy5lbWl0KCdcXG59Jyk7XG59O1xuXG4vKipcbiAqIFZpc2l0IGZvbnQtZmFjZSBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZVsnZm9udC1mYWNlJ10gPSBmdW5jdGlvbihub2RlKXtcbiAgcmV0dXJuIHRoaXMuZW1pdCgnQGZvbnQtZmFjZSAnLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KCd7XFxuJylcbiAgICArIHRoaXMuZW1pdCh0aGlzLmluZGVudCgxKSlcbiAgICArIHRoaXMubWFwVmlzaXQobm9kZS5kZWNsYXJhdGlvbnMsICdcXG4nKVxuICAgICsgdGhpcy5lbWl0KHRoaXMuaW5kZW50KC0xKSlcbiAgICArIHRoaXMuZW1pdCgnXFxufScpO1xufTtcblxuLyoqXG4gKiBWaXNpdCBob3N0IG5vZGUuXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlLmhvc3QgPSBmdW5jdGlvbihub2RlKXtcbiAgcmV0dXJuIHRoaXMuZW1pdCgnQGhvc3QnLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KFxuICAgICAgICAnIHtcXG4nXG4gICAgICAgICsgdGhpcy5pbmRlbnQoMSkpXG4gICAgKyB0aGlzLm1hcFZpc2l0KG5vZGUucnVsZXMsICdcXG5cXG4nKVxuICAgICsgdGhpcy5lbWl0KFxuICAgICAgICB0aGlzLmluZGVudCgtMSlcbiAgICAgICAgKyAnXFxufScpO1xufTtcblxuLyoqXG4gKiBWaXNpdCBjdXN0b20tbWVkaWEgbm9kZS5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGVbJ2N1c3RvbS1tZWRpYSddID0gZnVuY3Rpb24obm9kZSl7XG4gIHJldHVybiB0aGlzLmVtaXQoJ0BjdXN0b20tbWVkaWEgJyArIG5vZGUubmFtZSArICcgJyArIG5vZGUubWVkaWEgKyAnOycsIG5vZGUucG9zaXRpb24pO1xufTtcblxuLyoqXG4gKiBWaXNpdCBydWxlIG5vZGUuXG4gKi9cblxuQ29tcGlsZXIucHJvdG90eXBlLnJ1bGUgPSBmdW5jdGlvbihub2RlKXtcbiAgdmFyIGluZGVudCA9IHRoaXMuaW5kZW50KCk7XG4gIHZhciBkZWNscyA9IG5vZGUuZGVjbGFyYXRpb25zO1xuICBpZiAoIWRlY2xzLmxlbmd0aCkgcmV0dXJuICcnO1xuXG4gIHJldHVybiB0aGlzLmVtaXQobm9kZS5zZWxlY3RvcnMubWFwKGZ1bmN0aW9uKHMpeyByZXR1cm4gaW5kZW50ICsgcyB9KS5qb2luKCcsXFxuJyksIG5vZGUucG9zaXRpb24pXG4gICAgKyB0aGlzLmVtaXQoJyB7XFxuJylcbiAgICArIHRoaXMuZW1pdCh0aGlzLmluZGVudCgxKSlcbiAgICArIHRoaXMubWFwVmlzaXQoZGVjbHMsICdcXG4nKVxuICAgICsgdGhpcy5lbWl0KHRoaXMuaW5kZW50KC0xKSlcbiAgICArIHRoaXMuZW1pdCgnXFxuJyArIHRoaXMuaW5kZW50KCkgKyAnfScpO1xufTtcblxuLyoqXG4gKiBWaXNpdCBkZWNsYXJhdGlvbiBub2RlLlxuICovXG5cbkNvbXBpbGVyLnByb3RvdHlwZS5kZWNsYXJhdGlvbiA9IGZ1bmN0aW9uKG5vZGUpe1xuICByZXR1cm4gdGhpcy5lbWl0KHRoaXMuaW5kZW50KCkpXG4gICAgKyB0aGlzLmVtaXQobm9kZS5wcm9wZXJ0eSArICc6ICcgKyBub2RlLnZhbHVlLCBub2RlLnBvc2l0aW9uKVxuICAgICsgdGhpcy5lbWl0KCc7Jyk7XG59O1xuXG4vKipcbiAqIEluY3JlYXNlLCBkZWNyZWFzZSBvciByZXR1cm4gY3VycmVudCBpbmRlbnRhdGlvbi5cbiAqL1xuXG5Db21waWxlci5wcm90b3R5cGUuaW5kZW50ID0gZnVuY3Rpb24obGV2ZWwpIHtcbiAgdGhpcy5sZXZlbCA9IHRoaXMubGV2ZWwgfHwgMTtcblxuICBpZiAobnVsbCAhPSBsZXZlbCkge1xuICAgIHRoaXMubGV2ZWwgKz0gbGV2ZWw7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgcmV0dXJuIEFycmF5KHRoaXMubGV2ZWwpLmpvaW4odGhpcy5pbmRlbnRhdGlvbiB8fCAnICAnKTtcbn07XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgQ29tcHJlc3NlZCA9IHJlcXVpcmUoJy4vY29tcHJlc3MnKTtcbnZhciBJZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcblxuLyoqXG4gKiBTdHJpbmdmeSB0aGUgZ2l2ZW4gQVNUIGBub2RlYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBjb21wcmVzc2Agc3BhY2Utb3B0aW1pemVkIG91dHB1dFxuICogIC0gYHNvdXJjZW1hcGAgcmV0dXJuIGFuIG9iamVjdCB3aXRoIGAuY29kZWAgYW5kIGAubWFwYFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBub2RlXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obm9kZSwgb3B0aW9ucyl7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjb21waWxlciA9IG9wdGlvbnMuY29tcHJlc3NcbiAgICA/IG5ldyBDb21wcmVzc2VkKG9wdGlvbnMpXG4gICAgOiBuZXcgSWRlbnRpdHkob3B0aW9ucyk7XG5cbiAgLy8gc291cmNlIG1hcHNcbiAgaWYgKG9wdGlvbnMuc291cmNlbWFwKSB7XG4gICAgdmFyIHNvdXJjZW1hcHMgPSByZXF1aXJlKCcuL3NvdXJjZS1tYXAtc3VwcG9ydCcpO1xuICAgIHNvdXJjZW1hcHMoY29tcGlsZXIpO1xuXG4gICAgdmFyIGNvZGUgPSBjb21waWxlci5jb21waWxlKG5vZGUpO1xuICAgIGNvbXBpbGVyLmFwcGx5U291cmNlTWFwcygpO1xuXG4gICAgdmFyIG1hcCA9IG9wdGlvbnMuc291cmNlbWFwID09PSAnZ2VuZXJhdG9yJ1xuICAgICAgPyBjb21waWxlci5tYXBcbiAgICAgIDogY29tcGlsZXIubWFwLnRvSlNPTigpO1xuXG4gICAgcmV0dXJuIHsgY29kZTogY29kZSwgbWFwOiBtYXAgfTtcbiAgfVxuXG4gIHZhciBjb2RlID0gY29tcGlsZXIuY29tcGlsZShub2RlKTtcbiAgcmV0dXJuIGNvZGU7XG59O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIFNvdXJjZU1hcCA9IHJlcXVpcmUoJ3NvdXJjZS1tYXAnKS5Tb3VyY2VNYXBHZW5lcmF0b3I7XG52YXIgU291cmNlTWFwQ29uc3VtZXIgPSByZXF1aXJlKCdzb3VyY2UtbWFwJykuU291cmNlTWFwQ29uc3VtZXI7XG52YXIgc291cmNlTWFwUmVzb2x2ZSA9IHJlcXVpcmUoJ3NvdXJjZS1tYXAtcmVzb2x2ZScpO1xudmFyIHVyaXggPSByZXF1aXJlKCd1cml4Jyk7XG52YXIgZnMgPSByZXF1aXJlKCdmcycpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbi8qKlxuICogRXhwb3NlIGBtaXhpbigpYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1peGluO1xuXG4vKipcbiAqIE1peGluIHNvdXJjZSBtYXAgc3VwcG9ydCBpbnRvIGBjb21waWxlcmAuXG4gKlxuICogQHBhcmFtIHtDb21waWxlcn0gY29tcGlsZXJcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4oY29tcGlsZXIpIHtcbiAgY29tcGlsZXIuX2NvbW1lbnQgPSBjb21waWxlci5jb21tZW50O1xuICBjb21waWxlci5tYXAgPSBuZXcgU291cmNlTWFwKCk7XG4gIGNvbXBpbGVyLnBvc2l0aW9uID0geyBsaW5lOiAxLCBjb2x1bW46IDEgfTtcbiAgY29tcGlsZXIuZmlsZXMgPSB7fTtcbiAgZm9yICh2YXIgayBpbiBleHBvcnRzKSBjb21waWxlcltrXSA9IGV4cG9ydHNba107XG59XG5cbi8qKlxuICogVXBkYXRlIHBvc2l0aW9uLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMudXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbihzdHIpIHtcbiAgdmFyIGxpbmVzID0gc3RyLm1hdGNoKC9cXG4vZyk7XG4gIGlmIChsaW5lcykgdGhpcy5wb3NpdGlvbi5saW5lICs9IGxpbmVzLmxlbmd0aDtcbiAgdmFyIGkgPSBzdHIubGFzdEluZGV4T2YoJ1xcbicpO1xuICB0aGlzLnBvc2l0aW9uLmNvbHVtbiA9IH5pID8gc3RyLmxlbmd0aCAtIGkgOiB0aGlzLnBvc2l0aW9uLmNvbHVtbiArIHN0ci5sZW5ndGg7XG59O1xuXG4vKipcbiAqIEVtaXQgYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtPYmplY3R9IFtwb3NdXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLmVtaXQgPSBmdW5jdGlvbihzdHIsIHBvcykge1xuICBpZiAocG9zKSB7XG4gICAgdmFyIHNvdXJjZUZpbGUgPSB1cml4KHBvcy5zb3VyY2UgfHwgJ3NvdXJjZS5jc3MnKTtcblxuICAgIHRoaXMubWFwLmFkZE1hcHBpbmcoe1xuICAgICAgc291cmNlOiBzb3VyY2VGaWxlLFxuICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgIGxpbmU6IHRoaXMucG9zaXRpb24ubGluZSxcbiAgICAgICAgY29sdW1uOiBNYXRoLm1heCh0aGlzLnBvc2l0aW9uLmNvbHVtbiAtIDEsIDApXG4gICAgICB9LFxuICAgICAgb3JpZ2luYWw6IHtcbiAgICAgICAgbGluZTogcG9zLnN0YXJ0LmxpbmUsXG4gICAgICAgIGNvbHVtbjogcG9zLnN0YXJ0LmNvbHVtbiAtIDFcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkRmlsZShzb3VyY2VGaWxlLCBwb3MpO1xuICB9XG5cbiAgdGhpcy51cGRhdGVQb3NpdGlvbihzdHIpO1xuXG4gIHJldHVybiBzdHI7XG59O1xuXG4vKipcbiAqIEFkZHMgYSBmaWxlIHRvIHRoZSBzb3VyY2UgbWFwIG91dHB1dCBpZiBpdCBoYXMgbm90IGFscmVhZHkgYmVlbiBhZGRlZFxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBwb3NcbiAqL1xuXG5leHBvcnRzLmFkZEZpbGUgPSBmdW5jdGlvbihmaWxlLCBwb3MpIHtcbiAgaWYgKHR5cGVvZiBwb3MuY29udGVudCAhPT0gJ3N0cmluZycpIHJldHVybjtcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmZpbGVzLCBmaWxlKSkgcmV0dXJuO1xuXG4gIHRoaXMuZmlsZXNbZmlsZV0gPSBwb3MuY29udGVudDtcbn07XG5cbi8qKlxuICogQXBwbGllcyBhbnkgb3JpZ2luYWwgc291cmNlIG1hcHMgdG8gdGhlIG91dHB1dCBhbmQgZW1iZWRzIHRoZSBzb3VyY2UgZmlsZVxuICogY29udGVudHMgaW4gdGhlIHNvdXJjZSBtYXAuXG4gKi9cblxuZXhwb3J0cy5hcHBseVNvdXJjZU1hcHMgPSBmdW5jdGlvbigpIHtcbiAgT2JqZWN0LmtleXModGhpcy5maWxlcykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLmZpbGVzW2ZpbGVdO1xuICAgIHRoaXMubWFwLnNldFNvdXJjZUNvbnRlbnQoZmlsZSwgY29udGVudCk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmlucHV0U291cmNlbWFwcyAhPT0gZmFsc2UpIHtcbiAgICAgIHZhciBvcmlnaW5hbE1hcCA9IHNvdXJjZU1hcFJlc29sdmUucmVzb2x2ZVN5bmMoXG4gICAgICAgIGNvbnRlbnQsIGZpbGUsIGZzLnJlYWRGaWxlU3luYyk7XG4gICAgICBpZiAob3JpZ2luYWxNYXApIHtcbiAgICAgICAgdmFyIG1hcCA9IG5ldyBTb3VyY2VNYXBDb25zdW1lcihvcmlnaW5hbE1hcC5tYXApO1xuICAgICAgICB2YXIgcmVsYXRpdmVUbyA9IG9yaWdpbmFsTWFwLnNvdXJjZXNSZWxhdGl2ZVRvO1xuICAgICAgICB0aGlzLm1hcC5hcHBseVNvdXJjZU1hcChtYXAsIGZpbGUsIHVyaXgocGF0aC5kaXJuYW1lKHJlbGF0aXZlVG8pKSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB0aGlzKTtcbn07XG5cbi8qKlxuICogUHJvY2VzcyBjb21tZW50cywgZHJvcHMgc291cmNlTWFwIGNvbW1lbnRzLlxuICogQHBhcmFtIHtPYmplY3R9IG5vZGVcbiAqL1xuXG5leHBvcnRzLmNvbW1lbnQgPSBmdW5jdGlvbihub2RlKSB7XG4gIGlmICgvXiMgc291cmNlTWFwcGluZ1VSTD0vLnRlc3Qobm9kZS5jb21tZW50KSlcbiAgICByZXR1cm4gdGhpcy5lbWl0KCcnLCBub2RlLnBvc2l0aW9uKTtcbiAgZWxzZVxuICAgIHJldHVybiB0aGlzLl9jb21tZW50KG5vZGUpO1xufTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IDIwMTQgU2ltb24gTHlkZWxsXHJcbi8vIFgxMSAo4oCcTUlU4oCdKSBMaWNlbnNlZC4gKFNlZSBMSUNFTlNFLilcclxuXHJcbnZvaWQgKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZShmYWN0b3J5KVxyXG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpXHJcbiAgfSBlbHNlIHtcclxuICAgIHJvb3QucmVzb2x2ZVVybCA9IGZhY3RvcnkoKVxyXG4gIH1cclxufSh0aGlzLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgZnVuY3Rpb24gcmVzb2x2ZVVybCgvKiAuLi51cmxzICovKSB7XHJcbiAgICB2YXIgbnVtVXJscyA9IGFyZ3VtZW50cy5sZW5ndGhcclxuXHJcbiAgICBpZiAobnVtVXJscyA9PT0gMCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJyZXNvbHZlVXJsIHJlcXVpcmVzIGF0IGxlYXN0IG9uZSBhcmd1bWVudDsgZ290IG5vbmUuXCIpXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGJhc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYmFzZVwiKVxyXG4gICAgYmFzZS5ocmVmID0gYXJndW1lbnRzWzBdXHJcblxyXG4gICAgaWYgKG51bVVybHMgPT09IDEpIHtcclxuICAgICAgcmV0dXJuIGJhc2UuaHJlZlxyXG4gICAgfVxyXG5cclxuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdXHJcbiAgICBoZWFkLmluc2VydEJlZm9yZShiYXNlLCBoZWFkLmZpcnN0Q2hpbGQpXHJcblxyXG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKVxyXG4gICAgdmFyIHJlc29sdmVkXHJcblxyXG4gICAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IG51bVVybHM7IGluZGV4KyspIHtcclxuICAgICAgYS5ocmVmID0gYXJndW1lbnRzW2luZGV4XVxyXG4gICAgICByZXNvbHZlZCA9IGEuaHJlZlxyXG4gICAgICBiYXNlLmhyZWYgPSByZXNvbHZlZFxyXG4gICAgfVxyXG5cclxuICAgIGhlYWQucmVtb3ZlQ2hpbGQoYmFzZSlcclxuXHJcbiAgICByZXR1cm4gcmVzb2x2ZWRcclxuICB9XHJcblxyXG4gIHJldHVybiByZXNvbHZlVXJsXHJcblxyXG59KSk7XHJcbiIsIi8vIENvcHlyaWdodCAyMDE0IFNpbW9uIEx5ZGVsbFxuLy8gWDExICjigJxNSVTigJ0pIExpY2Vuc2VkLiAoU2VlIExJQ0VOU0UuKVxuXG52b2lkIChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KVxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KClcbiAgfSBlbHNlIHtcbiAgICByb290LnNvdXJjZU1hcHBpbmdVUkwgPSBmYWN0b3J5KClcbiAgfVxufSh0aGlzLCBmdW5jdGlvbigpIHtcblxuICB2YXIgaW5uZXJSZWdleCA9IC9bI0BdIHNvdXJjZU1hcHBpbmdVUkw9KFteXFxzJ1wiXSopL1xuXG4gIHZhciByZWdleCA9IFJlZ0V4cChcbiAgICBcIig/OlwiICtcbiAgICAgIFwiL1xcXFwqXCIgK1xuICAgICAgXCIoPzpcXFxccypcXHI/XFxuKD86Ly8pPyk/XCIgK1xuICAgICAgXCIoPzpcIiArIGlubmVyUmVnZXguc291cmNlICsgXCIpXCIgK1xuICAgICAgXCJcXFxccypcIiArXG4gICAgICBcIlxcXFwqL1wiICtcbiAgICAgIFwifFwiICtcbiAgICAgIFwiLy8oPzpcIiArIGlubmVyUmVnZXguc291cmNlICsgXCIpXCIgK1xuICAgIFwiKVwiICtcbiAgICBcIlxcXFxzKiRcIlxuICApXG5cbiAgcmV0dXJuIHtcblxuICAgIHJlZ2V4OiByZWdleCxcbiAgICBfaW5uZXJSZWdleDogaW5uZXJSZWdleCxcblxuICAgIGdldEZyb206IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgIHZhciBtYXRjaCA9IGNvZGUubWF0Y2gocmVnZXgpXG4gICAgICByZXR1cm4gKG1hdGNoID8gbWF0Y2hbMV0gfHwgbWF0Y2hbMl0gfHwgXCJcIiA6IG51bGwpXG4gICAgfSxcblxuICAgIGV4aXN0c0luOiBmdW5jdGlvbihjb2RlKSB7XG4gICAgICByZXR1cm4gcmVnZXgudGVzdChjb2RlKVxuICAgIH0sXG5cbiAgICByZW1vdmVGcm9tOiBmdW5jdGlvbihjb2RlKSB7XG4gICAgICByZXR1cm4gY29kZS5yZXBsYWNlKHJlZ2V4LCBcIlwiKVxuICAgIH0sXG5cbiAgICBpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKGNvZGUsIHN0cmluZykge1xuICAgICAgdmFyIG1hdGNoID0gY29kZS5tYXRjaChyZWdleClcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gY29kZS5zbGljZSgwLCBtYXRjaC5pbmRleCkgKyBzdHJpbmcgKyBjb2RlLnNsaWNlKG1hdGNoLmluZGV4KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvZGUgKyBzdHJpbmdcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgU2ltb24gTHlkZWxsXG4vLyBYMTEgKOKAnE1JVOKAnSkgTGljZW5zZWQuIChTZWUgTElDRU5TRS4pXG5cbi8vIE5vdGU6IHNvdXJjZS1tYXAtcmVzb2x2ZS5qcyBpcyBnZW5lcmF0ZWQgZnJvbSBzb3VyY2UtbWFwLXJlc29sdmUtbm9kZS5qcyBhbmRcbi8vIHNvdXJjZS1tYXAtcmVzb2x2ZS10ZW1wbGF0ZS5qcy4gT25seSBlZGl0IHRoZSB0d28gbGF0dGVyIGZpbGVzLCBfbm90X1xuLy8gc291cmNlLW1hcC1yZXNvbHZlLmpzIVxuXG52b2lkIChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbXCJzb3VyY2UtbWFwLXVybFwiLCBcInJlc29sdmUtdXJsXCJdLCBmYWN0b3J5KVxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgdmFyIHNvdXJjZU1hcHBpbmdVUkwgPSByZXF1aXJlKFwic291cmNlLW1hcC11cmxcIilcbiAgICB2YXIgcmVzb2x2ZVVybCA9IHJlcXVpcmUoXCJyZXNvbHZlLXVybFwiKVxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShzb3VyY2VNYXBwaW5nVVJMLCByZXNvbHZlVXJsKVxuICB9IGVsc2Uge1xuICAgIHJvb3Quc291cmNlTWFwUmVzb2x2ZSA9IGZhY3Rvcnkocm9vdC5zb3VyY2VNYXBwaW5nVVJMLCByb290LnJlc29sdmVVcmwpXG4gIH1cbn0odGhpcywgZnVuY3Rpb24oc291cmNlTWFwcGluZ1VSTCwgcmVzb2x2ZVVybCkge1xuXG4gIGZ1bmN0aW9uIGNhbGxiYWNrQXN5bmMoY2FsbGJhY2ssIGVycm9yLCByZXN1bHQpIHtcbiAgICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGVycm9yLCByZXN1bHQpIH0pXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZU1hcFRvSlNPTihzdHJpbmcpIHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzdHJpbmcucmVwbGFjZSgvXlxcKVxcXVxcfScvLCBcIlwiKSlcbiAgfVxuXG5cblxuICBmdW5jdGlvbiByZXNvbHZlU291cmNlTWFwKGNvZGUsIGNvZGVVcmwsIHJlYWQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIG1hcERhdGFcbiAgICB0cnkge1xuICAgICAgbWFwRGF0YSA9IHJlc29sdmVTb3VyY2VNYXBIZWxwZXIoY29kZSwgY29kZVVybClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrQXN5bmMoY2FsbGJhY2ssIGVycm9yKVxuICAgIH1cbiAgICBpZiAoIW1hcERhdGEgfHwgbWFwRGF0YS5tYXApIHtcbiAgICAgIHJldHVybiBjYWxsYmFja0FzeW5jKGNhbGxiYWNrLCBudWxsLCBtYXBEYXRhKVxuICAgIH1cbiAgICByZWFkKG1hcERhdGEudXJsLCBmdW5jdGlvbihlcnJvciwgcmVzdWx0KSB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKVxuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgbWFwRGF0YS5tYXAgPSBwYXJzZU1hcFRvSlNPTihTdHJpbmcocmVzdWx0KSlcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcilcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIG1hcERhdGEpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmVTb3VyY2VNYXBTeW5jKGNvZGUsIGNvZGVVcmwsIHJlYWQpIHtcbiAgICB2YXIgbWFwRGF0YSA9IHJlc29sdmVTb3VyY2VNYXBIZWxwZXIoY29kZSwgY29kZVVybClcbiAgICBpZiAoIW1hcERhdGEgfHwgbWFwRGF0YS5tYXApIHtcbiAgICAgIHJldHVybiBtYXBEYXRhXG4gICAgfVxuICAgIG1hcERhdGEubWFwID0gcGFyc2VNYXBUb0pTT04oU3RyaW5nKHJlYWQobWFwRGF0YS51cmwpKSlcbiAgICByZXR1cm4gbWFwRGF0YVxuICB9XG5cbiAgdmFyIGRhdGFVcmlSZWdleCA9IC9eZGF0YTooW14sO10qKSg7W14sO10qKSooPzosKC4qKSk/JC9cbiAgdmFyIGpzb25NaW1lVHlwZVJlZ2V4ID0gL14oPzphcHBsaWNhdGlvbnx0ZXh0KVxcL2pzb24kL1xuXG4gIGZ1bmN0aW9uIHJlc29sdmVTb3VyY2VNYXBIZWxwZXIoY29kZSwgY29kZVVybCkge1xuICAgIHZhciB1cmwgPSBzb3VyY2VNYXBwaW5nVVJMLmdldEZyb20oY29kZSlcbiAgICBpZiAoIXVybCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICB2YXIgZGF0YVVyaSA9IHVybC5tYXRjaChkYXRhVXJpUmVnZXgpXG4gICAgaWYgKGRhdGFVcmkpIHtcbiAgICAgIHZhciBtaW1lVHlwZSA9IGRhdGFVcmlbMV1cbiAgICAgIHZhciBsYXN0UGFyYW1ldGVyID0gZGF0YVVyaVsyXVxuICAgICAgdmFyIGVuY29kZWQgPSBkYXRhVXJpWzNdXG4gICAgICBpZiAoIWpzb25NaW1lVHlwZVJlZ2V4LnRlc3QobWltZVR5cGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVudXNlZnVsIGRhdGEgdXJpIG1pbWUgdHlwZTogXCIgKyAobWltZVR5cGUgfHwgXCJ0ZXh0L3BsYWluXCIpKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlTWFwcGluZ1VSTDogdXJsLFxuICAgICAgICB1cmw6IG51bGwsXG4gICAgICAgIHNvdXJjZXNSZWxhdGl2ZVRvOiBjb2RlVXJsLFxuICAgICAgICBtYXA6IHBhcnNlTWFwVG9KU09OKGxhc3RQYXJhbWV0ZXIgPT09IFwiO2Jhc2U2NFwiID8gYXRvYihlbmNvZGVkKSA6IGRlY29kZVVSSUNvbXBvbmVudChlbmNvZGVkKSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbWFwVXJsID0gcmVzb2x2ZVVybChjb2RlVXJsLCB1cmwpXG4gICAgcmV0dXJuIHtcbiAgICAgIHNvdXJjZU1hcHBpbmdVUkw6IHVybCxcbiAgICAgIHVybDogbWFwVXJsLFxuICAgICAgc291cmNlc1JlbGF0aXZlVG86IG1hcFVybCxcbiAgICAgIG1hcDogbnVsbFxuICAgIH1cbiAgfVxuXG5cblxuICBmdW5jdGlvbiByZXNvbHZlU291cmNlcyhtYXAsIG1hcFVybCwgcmVhZCwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY2FsbGJhY2sgPSBvcHRpb25zXG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG4gICAgdmFyIHBlbmRpbmcgPSBtYXAuc291cmNlcy5sZW5ndGhcbiAgICB2YXIgZXJyb3JlZCA9IGZhbHNlXG4gICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgIHNvdXJjZXNSZXNvbHZlZDogW10sXG4gICAgICBzb3VyY2VzQ29udGVudDogIFtdXG4gICAgfVxuXG4gICAgdmFyIGRvbmUgPSBmdW5jdGlvbihlcnJvcikge1xuICAgICAgaWYgKGVycm9yZWQpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JlZCA9IHRydWVcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKVxuICAgICAgfVxuICAgICAgcGVuZGluZy0tXG4gICAgICBpZiAocGVuZGluZyA9PT0gMCkge1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVzb2x2ZVNvdXJjZXNIZWxwZXIobWFwLCBtYXBVcmwsIG9wdGlvbnMsIGZ1bmN0aW9uKGZ1bGxVcmwsIHNvdXJjZUNvbnRlbnQsIGluZGV4KSB7XG4gICAgICByZXN1bHQuc291cmNlc1Jlc29sdmVkW2luZGV4XSA9IGZ1bGxVcmxcbiAgICAgIGlmICh0eXBlb2Ygc291cmNlQ29udGVudCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXN1bHQuc291cmNlc0NvbnRlbnRbaW5kZXhdID0gc291cmNlQ29udGVudFxuICAgICAgICBjYWxsYmFja0FzeW5jKGRvbmUsIG51bGwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWFkKGZ1bGxVcmwsIGZ1bmN0aW9uKGVycm9yLCBzb3VyY2UpIHtcbiAgICAgICAgICByZXN1bHQuc291cmNlc0NvbnRlbnRbaW5kZXhdID0gU3RyaW5nKHNvdXJjZSlcbiAgICAgICAgICBkb25lKGVycm9yKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlU291cmNlc1N5bmMobWFwLCBtYXBVcmwsIHJlYWQsIG9wdGlvbnMpIHtcbiAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgc291cmNlc1Jlc29sdmVkOiBbXSxcbiAgICAgIHNvdXJjZXNDb250ZW50OiAgW11cbiAgICB9XG4gICAgcmVzb2x2ZVNvdXJjZXNIZWxwZXIobWFwLCBtYXBVcmwsIG9wdGlvbnMsIGZ1bmN0aW9uKGZ1bGxVcmwsIHNvdXJjZUNvbnRlbnQsIGluZGV4KSB7XG4gICAgICByZXN1bHQuc291cmNlc1Jlc29sdmVkW2luZGV4XSA9IGZ1bGxVcmxcbiAgICAgIGlmIChyZWFkICE9PSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc291cmNlQ29udGVudCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHJlc3VsdC5zb3VyY2VzQ29udGVudFtpbmRleF0gPSBzb3VyY2VDb250ZW50XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0LnNvdXJjZXNDb250ZW50W2luZGV4XSA9IFN0cmluZyhyZWFkKGZ1bGxVcmwpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICB2YXIgZW5kaW5nU2xhc2ggPSAvXFwvPyQvXG5cbiAgZnVuY3Rpb24gcmVzb2x2ZVNvdXJjZXNIZWxwZXIobWFwLCBtYXBVcmwsIG9wdGlvbnMsIGZuKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICB2YXIgZnVsbFVybFxuICAgIHZhciBzb3VyY2VDb250ZW50XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW4gPSBtYXAuc291cmNlcy5sZW5ndGg7IGluZGV4IDwgbGVuOyBpbmRleCsrKSB7XG4gICAgICBpZiAobWFwLnNvdXJjZVJvb3QgJiYgIW9wdGlvbnMuaWdub3JlU291cmNlUm9vdCkge1xuICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgc291cmNlUm9vdCBlbmRzIHdpdGggYSBzbGFzaCwgc28gdGhhdCBgL3NjcmlwdHMvc3ViZGlyYCBiZWNvbWVzXG4gICAgICAgIC8vIGAvc2NyaXB0cy9zdWJkaXIvPHNvdXJjZT5gLCBub3QgYC9zY3JpcHRzLzxzb3VyY2U+YC4gUG9pbnRpbmcgdG8gYSBmaWxlIGFzIHNvdXJjZSByb290XG4gICAgICAgIC8vIGRvZXMgbm90IG1ha2Ugc2Vuc2UuXG4gICAgICAgIGZ1bGxVcmwgPSByZXNvbHZlVXJsKG1hcFVybCwgbWFwLnNvdXJjZVJvb3QucmVwbGFjZShlbmRpbmdTbGFzaCwgXCIvXCIpLCBtYXAuc291cmNlc1tpbmRleF0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmdWxsVXJsID0gcmVzb2x2ZVVybChtYXBVcmwsIG1hcC5zb3VyY2VzW2luZGV4XSlcbiAgICAgIH1cbiAgICAgIHNvdXJjZUNvbnRlbnQgPSAobWFwLnNvdXJjZXNDb250ZW50IHx8IFtdKVtpbmRleF1cbiAgICAgIGZuKGZ1bGxVcmwsIHNvdXJjZUNvbnRlbnQsIGluZGV4KVxuICAgIH1cbiAgfVxuXG5cblxuICBmdW5jdGlvbiByZXNvbHZlKGNvZGUsIGNvZGVVcmwsIHJlYWQsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9uc1xuICAgICAgb3B0aW9ucyA9IHt9XG4gICAgfVxuICAgIHJlc29sdmVTb3VyY2VNYXAoY29kZSwgY29kZVVybCwgcmVhZCwgZnVuY3Rpb24oZXJyb3IsIG1hcERhdGEpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpXG4gICAgICB9XG4gICAgICBpZiAoIW1hcERhdGEpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIG51bGwpXG4gICAgICB9XG4gICAgICByZXNvbHZlU291cmNlcyhtYXBEYXRhLm1hcCwgbWFwRGF0YS5zb3VyY2VzUmVsYXRpdmVUbywgcmVhZCwgb3B0aW9ucywgZnVuY3Rpb24oZXJyb3IsIHJlc3VsdCkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpXG4gICAgICAgIH1cbiAgICAgICAgbWFwRGF0YS5zb3VyY2VzUmVzb2x2ZWQgPSByZXN1bHQuc291cmNlc1Jlc29sdmVkXG4gICAgICAgIG1hcERhdGEuc291cmNlc0NvbnRlbnQgID0gcmVzdWx0LnNvdXJjZXNDb250ZW50XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIG1hcERhdGEpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlU3luYyhjb2RlLCBjb2RlVXJsLCByZWFkLCBvcHRpb25zKSB7XG4gICAgdmFyIG1hcERhdGEgPSByZXNvbHZlU291cmNlTWFwU3luYyhjb2RlLCBjb2RlVXJsLCByZWFkKVxuICAgIGlmICghbWFwRGF0YSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IHJlc29sdmVTb3VyY2VzU3luYyhtYXBEYXRhLm1hcCwgbWFwRGF0YS5zb3VyY2VzUmVsYXRpdmVUbywgcmVhZCwgb3B0aW9ucylcbiAgICBtYXBEYXRhLnNvdXJjZXNSZXNvbHZlZCA9IHJlc3VsdC5zb3VyY2VzUmVzb2x2ZWRcbiAgICBtYXBEYXRhLnNvdXJjZXNDb250ZW50ICA9IHJlc3VsdC5zb3VyY2VzQ29udGVudFxuICAgIHJldHVybiBtYXBEYXRhXG4gIH1cblxuXG5cbiAgcmV0dXJuIHtcbiAgICByZXNvbHZlU291cmNlTWFwOiAgICAgcmVzb2x2ZVNvdXJjZU1hcCxcbiAgICByZXNvbHZlU291cmNlTWFwU3luYzogcmVzb2x2ZVNvdXJjZU1hcFN5bmMsXG4gICAgcmVzb2x2ZVNvdXJjZXM6ICAgICAgIHJlc29sdmVTb3VyY2VzLFxuICAgIHJlc29sdmVTb3VyY2VzU3luYzogICByZXNvbHZlU291cmNlc1N5bmMsXG4gICAgcmVzb2x2ZTogICAgICAgICAgICAgIHJlc29sdmUsXG4gICAgcmVzb2x2ZVN5bmM6ICAgICAgICAgIHJlc29sdmVTeW5jXG4gIH1cblxufSkpO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDA5LTIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFLnR4dCBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuZXhwb3J0cy5Tb3VyY2VNYXBHZW5lcmF0b3IgPSByZXF1aXJlKCcuL3NvdXJjZS1tYXAvc291cmNlLW1hcC1nZW5lcmF0b3InKS5Tb3VyY2VNYXBHZW5lcmF0b3I7XG5leHBvcnRzLlNvdXJjZU1hcENvbnN1bWVyID0gcmVxdWlyZSgnLi9zb3VyY2UtbWFwL3NvdXJjZS1tYXAtY29uc3VtZXInKS5Tb3VyY2VNYXBDb25zdW1lcjtcbmV4cG9ydHMuU291cmNlTm9kZSA9IHJlcXVpcmUoJy4vc291cmNlLW1hcC9zb3VyY2Utbm9kZScpLlNvdXJjZU5vZGU7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSwgcmVxdWlyZSk7XG59XG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4gIHZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgLyoqXG4gICAqIEEgZGF0YSBzdHJ1Y3R1cmUgd2hpY2ggaXMgYSBjb21iaW5hdGlvbiBvZiBhbiBhcnJheSBhbmQgYSBzZXQuIEFkZGluZyBhIG5ld1xuICAgKiBtZW1iZXIgaXMgTygxKSwgdGVzdGluZyBmb3IgbWVtYmVyc2hpcCBpcyBPKDEpLCBhbmQgZmluZGluZyB0aGUgaW5kZXggb2YgYW5cbiAgICogZWxlbWVudCBpcyBPKDEpLiBSZW1vdmluZyBlbGVtZW50cyBmcm9tIHRoZSBzZXQgaXMgbm90IHN1cHBvcnRlZC4gT25seVxuICAgKiBzdHJpbmdzIGFyZSBzdXBwb3J0ZWQgZm9yIG1lbWJlcnNoaXAuXG4gICAqL1xuICBmdW5jdGlvbiBBcnJheVNldCgpIHtcbiAgICB0aGlzLl9hcnJheSA9IFtdO1xuICAgIHRoaXMuX3NldCA9IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXRpYyBtZXRob2QgZm9yIGNyZWF0aW5nIEFycmF5U2V0IGluc3RhbmNlcyBmcm9tIGFuIGV4aXN0aW5nIGFycmF5LlxuICAgKi9cbiAgQXJyYXlTZXQuZnJvbUFycmF5ID0gZnVuY3Rpb24gQXJyYXlTZXRfZnJvbUFycmF5KGFBcnJheSwgYUFsbG93RHVwbGljYXRlcykge1xuICAgIHZhciBzZXQgPSBuZXcgQXJyYXlTZXQoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYUFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBzZXQuYWRkKGFBcnJheVtpXSwgYUFsbG93RHVwbGljYXRlcyk7XG4gICAgfVxuICAgIHJldHVybiBzZXQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFkZCB0aGUgZ2l2ZW4gc3RyaW5nIHRvIHRoaXMgc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gU3RyaW5nIGFTdHJcbiAgICovXG4gIEFycmF5U2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBBcnJheVNldF9hZGQoYVN0ciwgYUFsbG93RHVwbGljYXRlcykge1xuICAgIHZhciBpc0R1cGxpY2F0ZSA9IHRoaXMuaGFzKGFTdHIpO1xuICAgIHZhciBpZHggPSB0aGlzLl9hcnJheS5sZW5ndGg7XG4gICAgaWYgKCFpc0R1cGxpY2F0ZSB8fCBhQWxsb3dEdXBsaWNhdGVzKSB7XG4gICAgICB0aGlzLl9hcnJheS5wdXNoKGFTdHIpO1xuICAgIH1cbiAgICBpZiAoIWlzRHVwbGljYXRlKSB7XG4gICAgICB0aGlzLl9zZXRbdXRpbC50b1NldFN0cmluZyhhU3RyKV0gPSBpZHg7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBJcyB0aGUgZ2l2ZW4gc3RyaW5nIGEgbWVtYmVyIG9mIHRoaXMgc2V0P1xuICAgKlxuICAgKiBAcGFyYW0gU3RyaW5nIGFTdHJcbiAgICovXG4gIEFycmF5U2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiBBcnJheVNldF9oYXMoYVN0cikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5fc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC50b1NldFN0cmluZyhhU3RyKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFdoYXQgaXMgdGhlIGluZGV4IG9mIHRoZSBnaXZlbiBzdHJpbmcgaW4gdGhlIGFycmF5P1xuICAgKlxuICAgKiBAcGFyYW0gU3RyaW5nIGFTdHJcbiAgICovXG4gIEFycmF5U2V0LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gQXJyYXlTZXRfaW5kZXhPZihhU3RyKSB7XG4gICAgaWYgKHRoaXMuaGFzKGFTdHIpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2V0W3V0aWwudG9TZXRTdHJpbmcoYVN0cildO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiJyArIGFTdHIgKyAnXCIgaXMgbm90IGluIHRoZSBzZXQuJyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFdoYXQgaXMgdGhlIGVsZW1lbnQgYXQgdGhlIGdpdmVuIGluZGV4P1xuICAgKlxuICAgKiBAcGFyYW0gTnVtYmVyIGFJZHhcbiAgICovXG4gIEFycmF5U2V0LnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIEFycmF5U2V0X2F0KGFJZHgpIHtcbiAgICBpZiAoYUlkeCA+PSAwICYmIGFJZHggPCB0aGlzLl9hcnJheS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hcnJheVthSWR4XTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IGluZGV4ZWQgYnkgJyArIGFJZHgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHNldCAod2hpY2ggaGFzIHRoZSBwcm9wZXIgaW5kaWNlc1xuICAgKiBpbmRpY2F0ZWQgYnkgaW5kZXhPZikuIE5vdGUgdGhhdCB0aGlzIGlzIGEgY29weSBvZiB0aGUgaW50ZXJuYWwgYXJyYXkgdXNlZFxuICAgKiBmb3Igc3RvcmluZyB0aGUgbWVtYmVycyBzbyB0aGF0IG5vIG9uZSBjYW4gbWVzcyB3aXRoIGludGVybmFsIHN0YXRlLlxuICAgKi9cbiAgQXJyYXlTZXQucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiBBcnJheVNldF90b0FycmF5KCkge1xuICAgIHJldHVybiB0aGlzLl9hcnJheS5zbGljZSgpO1xuICB9O1xuXG4gIGV4cG9ydHMuQXJyYXlTZXQgPSBBcnJheVNldDtcblxufSk7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICpcbiAqIEJhc2VkIG9uIHRoZSBCYXNlIDY0IFZMUSBpbXBsZW1lbnRhdGlvbiBpbiBDbG9zdXJlIENvbXBpbGVyOlxuICogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jbG9zdXJlLWNvbXBpbGVyL3NvdXJjZS9icm93c2UvdHJ1bmsvc3JjL2NvbS9nb29nbGUvZGVidWdnaW5nL3NvdXJjZW1hcC9CYXNlNjRWTFEuamF2YVxuICpcbiAqIENvcHlyaWdodCAyMDExIFRoZSBDbG9zdXJlIENvbXBpbGVyIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmVcbiAqIG1ldDpcbiAqXG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZVxuICogICAgY29weXJpZ2h0IG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmdcbiAqICAgIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZFxuICogICAgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogICogTmVpdGhlciB0aGUgbmFtZSBvZiBHb29nbGUgSW5jLiBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogICAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkXG4gKiAgICBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SU1xuICogXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVFxuICogTElNSVRFRCBUTywgVEhFIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SXG4gKiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVFxuICogT1dORVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsXG4gKiBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UXG4gKiBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSxcbiAqIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWVxuICogVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICogKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSwgcmVxdWlyZSk7XG59XG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4gIHZhciBiYXNlNjQgPSByZXF1aXJlKCcuL2Jhc2U2NCcpO1xuXG4gIC8vIEEgc2luZ2xlIGJhc2UgNjQgZGlnaXQgY2FuIGNvbnRhaW4gNiBiaXRzIG9mIGRhdGEuIEZvciB0aGUgYmFzZSA2NCB2YXJpYWJsZVxuICAvLyBsZW5ndGggcXVhbnRpdGllcyB3ZSB1c2UgaW4gdGhlIHNvdXJjZSBtYXAgc3BlYywgdGhlIGZpcnN0IGJpdCBpcyB0aGUgc2lnbixcbiAgLy8gdGhlIG5leHQgZm91ciBiaXRzIGFyZSB0aGUgYWN0dWFsIHZhbHVlLCBhbmQgdGhlIDZ0aCBiaXQgaXMgdGhlXG4gIC8vIGNvbnRpbnVhdGlvbiBiaXQuIFRoZSBjb250aW51YXRpb24gYml0IHRlbGxzIHVzIHdoZXRoZXIgdGhlcmUgYXJlIG1vcmVcbiAgLy8gZGlnaXRzIGluIHRoaXMgdmFsdWUgZm9sbG93aW5nIHRoaXMgZGlnaXQuXG4gIC8vXG4gIC8vICAgQ29udGludWF0aW9uXG4gIC8vICAgfCAgICBTaWduXG4gIC8vICAgfCAgICB8XG4gIC8vICAgViAgICBWXG4gIC8vICAgMTAxMDExXG5cbiAgdmFyIFZMUV9CQVNFX1NISUZUID0gNTtcblxuICAvLyBiaW5hcnk6IDEwMDAwMFxuICB2YXIgVkxRX0JBU0UgPSAxIDw8IFZMUV9CQVNFX1NISUZUO1xuXG4gIC8vIGJpbmFyeTogMDExMTExXG4gIHZhciBWTFFfQkFTRV9NQVNLID0gVkxRX0JBU0UgLSAxO1xuXG4gIC8vIGJpbmFyeTogMTAwMDAwXG4gIHZhciBWTFFfQ09OVElOVUFUSU9OX0JJVCA9IFZMUV9CQVNFO1xuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBmcm9tIGEgdHdvLWNvbXBsZW1lbnQgdmFsdWUgdG8gYSB2YWx1ZSB3aGVyZSB0aGUgc2lnbiBiaXQgaXNcbiAgICogcGxhY2VkIGluIHRoZSBsZWFzdCBzaWduaWZpY2FudCBiaXQuICBGb3IgZXhhbXBsZSwgYXMgZGVjaW1hbHM6XG4gICAqICAgMSBiZWNvbWVzIDIgKDEwIGJpbmFyeSksIC0xIGJlY29tZXMgMyAoMTEgYmluYXJ5KVxuICAgKiAgIDIgYmVjb21lcyA0ICgxMDAgYmluYXJ5KSwgLTIgYmVjb21lcyA1ICgxMDEgYmluYXJ5KVxuICAgKi9cbiAgZnVuY3Rpb24gdG9WTFFTaWduZWQoYVZhbHVlKSB7XG4gICAgcmV0dXJuIGFWYWx1ZSA8IDBcbiAgICAgID8gKCgtYVZhbHVlKSA8PCAxKSArIDFcbiAgICAgIDogKGFWYWx1ZSA8PCAxKSArIDA7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdG8gYSB0d28tY29tcGxlbWVudCB2YWx1ZSBmcm9tIGEgdmFsdWUgd2hlcmUgdGhlIHNpZ24gYml0IGlzXG4gICAqIHBsYWNlZCBpbiB0aGUgbGVhc3Qgc2lnbmlmaWNhbnQgYml0LiAgRm9yIGV4YW1wbGUsIGFzIGRlY2ltYWxzOlxuICAgKiAgIDIgKDEwIGJpbmFyeSkgYmVjb21lcyAxLCAzICgxMSBiaW5hcnkpIGJlY29tZXMgLTFcbiAgICogICA0ICgxMDAgYmluYXJ5KSBiZWNvbWVzIDIsIDUgKDEwMSBiaW5hcnkpIGJlY29tZXMgLTJcbiAgICovXG4gIGZ1bmN0aW9uIGZyb21WTFFTaWduZWQoYVZhbHVlKSB7XG4gICAgdmFyIGlzTmVnYXRpdmUgPSAoYVZhbHVlICYgMSkgPT09IDE7XG4gICAgdmFyIHNoaWZ0ZWQgPSBhVmFsdWUgPj4gMTtcbiAgICByZXR1cm4gaXNOZWdhdGl2ZVxuICAgICAgPyAtc2hpZnRlZFxuICAgICAgOiBzaGlmdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJhc2UgNjQgVkxRIGVuY29kZWQgdmFsdWUuXG4gICAqL1xuICBleHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uIGJhc2U2NFZMUV9lbmNvZGUoYVZhbHVlKSB7XG4gICAgdmFyIGVuY29kZWQgPSBcIlwiO1xuICAgIHZhciBkaWdpdDtcblxuICAgIHZhciB2bHEgPSB0b1ZMUVNpZ25lZChhVmFsdWUpO1xuXG4gICAgZG8ge1xuICAgICAgZGlnaXQgPSB2bHEgJiBWTFFfQkFTRV9NQVNLO1xuICAgICAgdmxxID4+Pj0gVkxRX0JBU0VfU0hJRlQ7XG4gICAgICBpZiAodmxxID4gMCkge1xuICAgICAgICAvLyBUaGVyZSBhcmUgc3RpbGwgbW9yZSBkaWdpdHMgaW4gdGhpcyB2YWx1ZSwgc28gd2UgbXVzdCBtYWtlIHN1cmUgdGhlXG4gICAgICAgIC8vIGNvbnRpbnVhdGlvbiBiaXQgaXMgbWFya2VkLlxuICAgICAgICBkaWdpdCB8PSBWTFFfQ09OVElOVUFUSU9OX0JJVDtcbiAgICAgIH1cbiAgICAgIGVuY29kZWQgKz0gYmFzZTY0LmVuY29kZShkaWdpdCk7XG4gICAgfSB3aGlsZSAodmxxID4gMCk7XG5cbiAgICByZXR1cm4gZW5jb2RlZDtcbiAgfTtcblxuICAvKipcbiAgICogRGVjb2RlcyB0aGUgbmV4dCBiYXNlIDY0IFZMUSB2YWx1ZSBmcm9tIHRoZSBnaXZlbiBzdHJpbmcgYW5kIHJldHVybnMgdGhlXG4gICAqIHZhbHVlIGFuZCB0aGUgcmVzdCBvZiB0aGUgc3RyaW5nIHZpYSB0aGUgb3V0IHBhcmFtZXRlci5cbiAgICovXG4gIGV4cG9ydHMuZGVjb2RlID0gZnVuY3Rpb24gYmFzZTY0VkxRX2RlY29kZShhU3RyLCBhT3V0UGFyYW0pIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIHN0ckxlbiA9IGFTdHIubGVuZ3RoO1xuICAgIHZhciByZXN1bHQgPSAwO1xuICAgIHZhciBzaGlmdCA9IDA7XG4gICAgdmFyIGNvbnRpbnVhdGlvbiwgZGlnaXQ7XG5cbiAgICBkbyB7XG4gICAgICBpZiAoaSA+PSBzdHJMZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgbW9yZSBkaWdpdHMgaW4gYmFzZSA2NCBWTFEgdmFsdWUuXCIpO1xuICAgICAgfVxuICAgICAgZGlnaXQgPSBiYXNlNjQuZGVjb2RlKGFTdHIuY2hhckF0KGkrKykpO1xuICAgICAgY29udGludWF0aW9uID0gISEoZGlnaXQgJiBWTFFfQ09OVElOVUFUSU9OX0JJVCk7XG4gICAgICBkaWdpdCAmPSBWTFFfQkFTRV9NQVNLO1xuICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgKGRpZ2l0IDw8IHNoaWZ0KTtcbiAgICAgIHNoaWZ0ICs9IFZMUV9CQVNFX1NISUZUO1xuICAgIH0gd2hpbGUgKGNvbnRpbnVhdGlvbik7XG5cbiAgICBhT3V0UGFyYW0udmFsdWUgPSBmcm9tVkxRU2lnbmVkKHJlc3VsdCk7XG4gICAgYU91dFBhcmFtLnJlc3QgPSBhU3RyLnNsaWNlKGkpO1xuICB9O1xuXG59KTtcbiIsIi8qIC0qLSBNb2RlOiBqczsganMtaW5kZW50LWxldmVsOiAyOyAtKi0gKi9cbi8qXG4gKiBDb3B5cmlnaHQgMjAxMSBNb3ppbGxhIEZvdW5kYXRpb24gYW5kIGNvbnRyaWJ1dG9yc1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgbGljZW5zZS4gU2VlIExJQ0VOU0Ugb3I6XG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKi9cbmlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlLCByZXF1aXJlKTtcbn1cbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cbiAgdmFyIGNoYXJUb0ludE1hcCA9IHt9O1xuICB2YXIgaW50VG9DaGFyTWFwID0ge307XG5cbiAgJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG4gICAgLnNwbGl0KCcnKVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChjaCwgaW5kZXgpIHtcbiAgICAgIGNoYXJUb0ludE1hcFtjaF0gPSBpbmRleDtcbiAgICAgIGludFRvQ2hhck1hcFtpbmRleF0gPSBjaDtcbiAgICB9KTtcblxuICAvKipcbiAgICogRW5jb2RlIGFuIGludGVnZXIgaW4gdGhlIHJhbmdlIG9mIDAgdG8gNjMgdG8gYSBzaW5nbGUgYmFzZSA2NCBkaWdpdC5cbiAgICovXG4gIGV4cG9ydHMuZW5jb2RlID0gZnVuY3Rpb24gYmFzZTY0X2VuY29kZShhTnVtYmVyKSB7XG4gICAgaWYgKGFOdW1iZXIgaW4gaW50VG9DaGFyTWFwKSB7XG4gICAgICByZXR1cm4gaW50VG9DaGFyTWFwW2FOdW1iZXJdO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDYzOiBcIiArIGFOdW1iZXIpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNvZGUgYSBzaW5nbGUgYmFzZSA2NCBkaWdpdCB0byBhbiBpbnRlZ2VyLlxuICAgKi9cbiAgZXhwb3J0cy5kZWNvZGUgPSBmdW5jdGlvbiBiYXNlNjRfZGVjb2RlKGFDaGFyKSB7XG4gICAgaWYgKGFDaGFyIGluIGNoYXJUb0ludE1hcCkge1xuICAgICAgcmV0dXJuIGNoYXJUb0ludE1hcFthQ2hhcl07XG4gICAgfVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJOb3QgYSB2YWxpZCBiYXNlIDY0IGRpZ2l0OiBcIiArIGFDaGFyKTtcbiAgfTtcblxufSk7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSwgcmVxdWlyZSk7XG59XG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmUgaW1wbGVtZW50YXRpb24gb2YgYmluYXJ5IHNlYXJjaC5cbiAgICpcbiAgICogQHBhcmFtIGFMb3cgSW5kaWNlcyBoZXJlIGFuZCBsb3dlciBkbyBub3QgY29udGFpbiB0aGUgbmVlZGxlLlxuICAgKiBAcGFyYW0gYUhpZ2ggSW5kaWNlcyBoZXJlIGFuZCBoaWdoZXIgZG8gbm90IGNvbnRhaW4gdGhlIG5lZWRsZS5cbiAgICogQHBhcmFtIGFOZWVkbGUgVGhlIGVsZW1lbnQgYmVpbmcgc2VhcmNoZWQgZm9yLlxuICAgKiBAcGFyYW0gYUhheXN0YWNrIFRoZSBub24tZW1wdHkgYXJyYXkgYmVpbmcgc2VhcmNoZWQuXG4gICAqIEBwYXJhbSBhQ29tcGFyZSBGdW5jdGlvbiB3aGljaCB0YWtlcyB0d28gZWxlbWVudHMgYW5kIHJldHVybnMgLTEsIDAsIG9yIDEuXG4gICAqL1xuICBmdW5jdGlvbiByZWN1cnNpdmVTZWFyY2goYUxvdywgYUhpZ2gsIGFOZWVkbGUsIGFIYXlzdGFjaywgYUNvbXBhcmUpIHtcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHRlcm1pbmF0ZXMgd2hlbiBvbmUgb2YgdGhlIGZvbGxvd2luZyBpcyB0cnVlOlxuICAgIC8vXG4gICAgLy8gICAxLiBXZSBmaW5kIHRoZSBleGFjdCBlbGVtZW50IHdlIGFyZSBsb29raW5nIGZvci5cbiAgICAvL1xuICAgIC8vICAgMi4gV2UgZGlkIG5vdCBmaW5kIHRoZSBleGFjdCBlbGVtZW50LCBidXQgd2UgY2FuIHJldHVybiB0aGUgaW5kZXggb2ZcbiAgICAvLyAgICAgIHRoZSBuZXh0IGNsb3Nlc3QgZWxlbWVudCB0aGF0IGlzIGxlc3MgdGhhbiB0aGF0IGVsZW1lbnQuXG4gICAgLy9cbiAgICAvLyAgIDMuIFdlIGRpZCBub3QgZmluZCB0aGUgZXhhY3QgZWxlbWVudCwgYW5kIHRoZXJlIGlzIG5vIG5leHQtY2xvc2VzdFxuICAgIC8vICAgICAgZWxlbWVudCB3aGljaCBpcyBsZXNzIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvciwgc28gd2VcbiAgICAvLyAgICAgIHJldHVybiAtMS5cbiAgICB2YXIgbWlkID0gTWF0aC5mbG9vcigoYUhpZ2ggLSBhTG93KSAvIDIpICsgYUxvdztcbiAgICB2YXIgY21wID0gYUNvbXBhcmUoYU5lZWRsZSwgYUhheXN0YWNrW21pZF0sIHRydWUpO1xuICAgIGlmIChjbXAgPT09IDApIHtcbiAgICAgIC8vIEZvdW5kIHRoZSBlbGVtZW50IHdlIGFyZSBsb29raW5nIGZvci5cbiAgICAgIHJldHVybiBtaWQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNtcCA+IDApIHtcbiAgICAgIC8vIGFIYXlzdGFja1ttaWRdIGlzIGdyZWF0ZXIgdGhhbiBvdXIgbmVlZGxlLlxuICAgICAgaWYgKGFIaWdoIC0gbWlkID4gMSkge1xuICAgICAgICAvLyBUaGUgZWxlbWVudCBpcyBpbiB0aGUgdXBwZXIgaGFsZi5cbiAgICAgICAgcmV0dXJuIHJlY3Vyc2l2ZVNlYXJjaChtaWQsIGFIaWdoLCBhTmVlZGxlLCBhSGF5c3RhY2ssIGFDb21wYXJlKTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIGRpZCBub3QgZmluZCBhbiBleGFjdCBtYXRjaCwgcmV0dXJuIHRoZSBuZXh0IGNsb3Nlc3Qgb25lXG4gICAgICAvLyAodGVybWluYXRpb24gY2FzZSAyKS5cbiAgICAgIHJldHVybiBtaWQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gYUhheXN0YWNrW21pZF0gaXMgbGVzcyB0aGFuIG91ciBuZWVkbGUuXG4gICAgICBpZiAobWlkIC0gYUxvdyA+IDEpIHtcbiAgICAgICAgLy8gVGhlIGVsZW1lbnQgaXMgaW4gdGhlIGxvd2VyIGhhbGYuXG4gICAgICAgIHJldHVybiByZWN1cnNpdmVTZWFyY2goYUxvdywgbWlkLCBhTmVlZGxlLCBhSGF5c3RhY2ssIGFDb21wYXJlKTtcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBleGFjdCBuZWVkbGUgZWxlbWVudCB3YXMgbm90IGZvdW5kIGluIHRoaXMgaGF5c3RhY2suIERldGVybWluZSBpZlxuICAgICAgLy8gd2UgYXJlIGluIHRlcm1pbmF0aW9uIGNhc2UgKDIpIG9yICgzKSBhbmQgcmV0dXJuIHRoZSBhcHByb3ByaWF0ZSB0aGluZy5cbiAgICAgIHJldHVybiBhTG93IDwgMCA/IC0xIDogYUxvdztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiBiaW5hcnkgc2VhcmNoIHdoaWNoIHdpbGwgYWx3YXlzIHRyeSBhbmQgcmV0dXJuXG4gICAqIHRoZSBpbmRleCBvZiBuZXh0IGxvd2VzdCB2YWx1ZSBjaGVja2VkIGlmIHRoZXJlIGlzIG5vIGV4YWN0IGhpdC4gVGhpcyBpc1xuICAgKiBiZWNhdXNlIG1hcHBpbmdzIGJldHdlZW4gb3JpZ2luYWwgYW5kIGdlbmVyYXRlZCBsaW5lL2NvbCBwYWlycyBhcmUgc2luZ2xlXG4gICAqIHBvaW50cywgYW5kIHRoZXJlIGlzIGFuIGltcGxpY2l0IHJlZ2lvbiBiZXR3ZWVuIGVhY2ggb2YgdGhlbSwgc28gYSBtaXNzXG4gICAqIGp1c3QgbWVhbnMgdGhhdCB5b3UgYXJlbid0IG9uIHRoZSB2ZXJ5IHN0YXJ0IG9mIGEgcmVnaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gYU5lZWRsZSBUaGUgZWxlbWVudCB5b3UgYXJlIGxvb2tpbmcgZm9yLlxuICAgKiBAcGFyYW0gYUhheXN0YWNrIFRoZSBhcnJheSB0aGF0IGlzIGJlaW5nIHNlYXJjaGVkLlxuICAgKiBAcGFyYW0gYUNvbXBhcmUgQSBmdW5jdGlvbiB3aGljaCB0YWtlcyB0aGUgbmVlZGxlIGFuZCBhbiBlbGVtZW50IGluIHRoZVxuICAgKiAgICAgYXJyYXkgYW5kIHJldHVybnMgLTEsIDAsIG9yIDEgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIG5lZWRsZSBpcyBsZXNzXG4gICAqICAgICB0aGFuLCBlcXVhbCB0bywgb3IgZ3JlYXRlciB0aGFuIHRoZSBlbGVtZW50LCByZXNwZWN0aXZlbHkuXG4gICAqL1xuICBleHBvcnRzLnNlYXJjaCA9IGZ1bmN0aW9uIHNlYXJjaChhTmVlZGxlLCBhSGF5c3RhY2ssIGFDb21wYXJlKSB7XG4gICAgaWYgKGFIYXlzdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY3Vyc2l2ZVNlYXJjaCgtMSwgYUhheXN0YWNrLmxlbmd0aCwgYU5lZWRsZSwgYUhheXN0YWNrLCBhQ29tcGFyZSlcbiAgfTtcblxufSk7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTQgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSwgcmVxdWlyZSk7XG59XG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4gIHZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgLyoqXG4gICAqIERldGVybWluZSB3aGV0aGVyIG1hcHBpbmdCIGlzIGFmdGVyIG1hcHBpbmdBIHdpdGggcmVzcGVjdCB0byBnZW5lcmF0ZWRcbiAgICogcG9zaXRpb24uXG4gICAqL1xuICBmdW5jdGlvbiBnZW5lcmF0ZWRQb3NpdGlvbkFmdGVyKG1hcHBpbmdBLCBtYXBwaW5nQikge1xuICAgIC8vIE9wdGltaXplZCBmb3IgbW9zdCBjb21tb24gY2FzZVxuICAgIHZhciBsaW5lQSA9IG1hcHBpbmdBLmdlbmVyYXRlZExpbmU7XG4gICAgdmFyIGxpbmVCID0gbWFwcGluZ0IuZ2VuZXJhdGVkTGluZTtcbiAgICB2YXIgY29sdW1uQSA9IG1hcHBpbmdBLmdlbmVyYXRlZENvbHVtbjtcbiAgICB2YXIgY29sdW1uQiA9IG1hcHBpbmdCLmdlbmVyYXRlZENvbHVtbjtcbiAgICByZXR1cm4gbGluZUIgPiBsaW5lQSB8fCBsaW5lQiA9PSBsaW5lQSAmJiBjb2x1bW5CID49IGNvbHVtbkEgfHxcbiAgICAgICAgICAgdXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnMobWFwcGluZ0EsIG1hcHBpbmdCKSA8PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgZGF0YSBzdHJ1Y3R1cmUgdG8gcHJvdmlkZSBhIHNvcnRlZCB2aWV3IG9mIGFjY3VtdWxhdGVkIG1hcHBpbmdzIGluIGFcbiAgICogcGVyZm9ybWFuY2UgY29uc2Npb3VzIG1hbm5lci4gSXQgdHJhZGVzIGEgbmVnbGliYWJsZSBvdmVyaGVhZCBpbiBnZW5lcmFsXG4gICAqIGNhc2UgZm9yIGEgbGFyZ2Ugc3BlZWR1cCBpbiBjYXNlIG9mIG1hcHBpbmdzIGJlaW5nIGFkZGVkIGluIG9yZGVyLlxuICAgKi9cbiAgZnVuY3Rpb24gTWFwcGluZ0xpc3QoKSB7XG4gICAgdGhpcy5fYXJyYXkgPSBbXTtcbiAgICB0aGlzLl9zb3J0ZWQgPSB0cnVlO1xuICAgIC8vIFNlcnZlcyBhcyBpbmZpbXVtXG4gICAgdGhpcy5fbGFzdCA9IHtnZW5lcmF0ZWRMaW5lOiAtMSwgZ2VuZXJhdGVkQ29sdW1uOiAwfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIHRocm91Z2ggaW50ZXJuYWwgaXRlbXMuIFRoaXMgbWV0aG9kIHRha2VzIHRoZSBzYW1lIGFyZ3VtZW50cyB0aGF0XG4gICAqIGBBcnJheS5wcm90b3R5cGUuZm9yRWFjaGAgdGFrZXMuXG4gICAqXG4gICAqIE5PVEU6IFRoZSBvcmRlciBvZiB0aGUgbWFwcGluZ3MgaXMgTk9UIGd1YXJhbnRlZWQuXG4gICAqL1xuICBNYXBwaW5nTGlzdC5wcm90b3R5cGUudW5zb3J0ZWRGb3JFYWNoID1cbiAgICBmdW5jdGlvbiBNYXBwaW5nTGlzdF9mb3JFYWNoKGFDYWxsYmFjaywgYVRoaXNBcmcpIHtcbiAgICAgIHRoaXMuX2FycmF5LmZvckVhY2goYUNhbGxiYWNrLCBhVGhpc0FyZyk7XG4gICAgfTtcblxuICAvKipcbiAgICogQWRkIHRoZSBnaXZlbiBzb3VyY2UgbWFwcGluZy5cbiAgICpcbiAgICogQHBhcmFtIE9iamVjdCBhTWFwcGluZ1xuICAgKi9cbiAgTWFwcGluZ0xpc3QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIE1hcHBpbmdMaXN0X2FkZChhTWFwcGluZykge1xuICAgIHZhciBtYXBwaW5nO1xuICAgIGlmIChnZW5lcmF0ZWRQb3NpdGlvbkFmdGVyKHRoaXMuX2xhc3QsIGFNYXBwaW5nKSkge1xuICAgICAgdGhpcy5fbGFzdCA9IGFNYXBwaW5nO1xuICAgICAgdGhpcy5fYXJyYXkucHVzaChhTWFwcGluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NvcnRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fYXJyYXkucHVzaChhTWFwcGluZyk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmbGF0LCBzb3J0ZWQgYXJyYXkgb2YgbWFwcGluZ3MuIFRoZSBtYXBwaW5ncyBhcmUgc29ydGVkIGJ5XG4gICAqIGdlbmVyYXRlZCBwb3NpdGlvbi5cbiAgICpcbiAgICogV0FSTklORzogVGhpcyBtZXRob2QgcmV0dXJucyBpbnRlcm5hbCBkYXRhIHdpdGhvdXQgY29weWluZywgZm9yXG4gICAqIHBlcmZvcm1hbmNlLiBUaGUgcmV0dXJuIHZhbHVlIG11c3QgTk9UIGJlIG11dGF0ZWQsIGFuZCBzaG91bGQgYmUgdHJlYXRlZCBhc1xuICAgKiBhbiBpbW11dGFibGUgYm9ycm93LiBJZiB5b3Ugd2FudCB0byB0YWtlIG93bmVyc2hpcCwgeW91IG11c3QgbWFrZSB5b3VyIG93blxuICAgKiBjb3B5LlxuICAgKi9cbiAgTWFwcGluZ0xpc3QucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiBNYXBwaW5nTGlzdF90b0FycmF5KCkge1xuICAgIGlmICghdGhpcy5fc29ydGVkKSB7XG4gICAgICB0aGlzLl9hcnJheS5zb3J0KHV0aWwuY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zKTtcbiAgICAgIHRoaXMuX3NvcnRlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hcnJheTtcbiAgfTtcblxuICBleHBvcnRzLk1hcHBpbmdMaXN0ID0gTWFwcGluZ0xpc3Q7XG5cbn0pO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuICB2YXIgYmluYXJ5U2VhcmNoID0gcmVxdWlyZSgnLi9iaW5hcnktc2VhcmNoJyk7XG4gIHZhciBBcnJheVNldCA9IHJlcXVpcmUoJy4vYXJyYXktc2V0JykuQXJyYXlTZXQ7XG4gIHZhciBiYXNlNjRWTFEgPSByZXF1aXJlKCcuL2Jhc2U2NC12bHEnKTtcblxuICAvKipcbiAgICogQSBTb3VyY2VNYXBDb25zdW1lciBpbnN0YW5jZSByZXByZXNlbnRzIGEgcGFyc2VkIHNvdXJjZSBtYXAgd2hpY2ggd2UgY2FuXG4gICAqIHF1ZXJ5IGZvciBpbmZvcm1hdGlvbiBhYm91dCB0aGUgb3JpZ2luYWwgZmlsZSBwb3NpdGlvbnMgYnkgZ2l2aW5nIGl0IGEgZmlsZVxuICAgKiBwb3NpdGlvbiBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZS5cbiAgICpcbiAgICogVGhlIG9ubHkgcGFyYW1ldGVyIGlzIHRoZSByYXcgc291cmNlIG1hcCAoZWl0aGVyIGFzIGEgSlNPTiBzdHJpbmcsIG9yXG4gICAqIGFscmVhZHkgcGFyc2VkIHRvIGFuIG9iamVjdCkuIEFjY29yZGluZyB0byB0aGUgc3BlYywgc291cmNlIG1hcHMgaGF2ZSB0aGVcbiAgICogZm9sbG93aW5nIGF0dHJpYnV0ZXM6XG4gICAqXG4gICAqICAgLSB2ZXJzaW9uOiBXaGljaCB2ZXJzaW9uIG9mIHRoZSBzb3VyY2UgbWFwIHNwZWMgdGhpcyBtYXAgaXMgZm9sbG93aW5nLlxuICAgKiAgIC0gc291cmNlczogQW4gYXJyYXkgb2YgVVJMcyB0byB0aGUgb3JpZ2luYWwgc291cmNlIGZpbGVzLlxuICAgKiAgIC0gbmFtZXM6IEFuIGFycmF5IG9mIGlkZW50aWZpZXJzIHdoaWNoIGNhbiBiZSByZWZlcnJlbmNlZCBieSBpbmRpdmlkdWFsIG1hcHBpbmdzLlxuICAgKiAgIC0gc291cmNlUm9vdDogT3B0aW9uYWwuIFRoZSBVUkwgcm9vdCBmcm9tIHdoaWNoIGFsbCBzb3VyY2VzIGFyZSByZWxhdGl2ZS5cbiAgICogICAtIHNvdXJjZXNDb250ZW50OiBPcHRpb25hbC4gQW4gYXJyYXkgb2YgY29udGVudHMgb2YgdGhlIG9yaWdpbmFsIHNvdXJjZSBmaWxlcy5cbiAgICogICAtIG1hcHBpbmdzOiBBIHN0cmluZyBvZiBiYXNlNjQgVkxRcyB3aGljaCBjb250YWluIHRoZSBhY3R1YWwgbWFwcGluZ3MuXG4gICAqICAgLSBmaWxlOiBPcHRpb25hbC4gVGhlIGdlbmVyYXRlZCBmaWxlIHRoaXMgc291cmNlIG1hcCBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqXG4gICAqIEhlcmUgaXMgYW4gZXhhbXBsZSBzb3VyY2UgbWFwLCB0YWtlbiBmcm9tIHRoZSBzb3VyY2UgbWFwIHNwZWNbMF06XG4gICAqXG4gICAqICAgICB7XG4gICAqICAgICAgIHZlcnNpb24gOiAzLFxuICAgKiAgICAgICBmaWxlOiBcIm91dC5qc1wiLFxuICAgKiAgICAgICBzb3VyY2VSb290IDogXCJcIixcbiAgICogICAgICAgc291cmNlczogW1wiZm9vLmpzXCIsIFwiYmFyLmpzXCJdLFxuICAgKiAgICAgICBuYW1lczogW1wic3JjXCIsIFwibWFwc1wiLCBcImFyZVwiLCBcImZ1blwiXSxcbiAgICogICAgICAgbWFwcGluZ3M6IFwiQUEsQUI7O0FCQ0RFO1wiXG4gICAqICAgICB9XG4gICAqXG4gICAqIFswXTogaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZG9jdW1lbnQvZC8xVTFSR0FlaFF3UnlwVVRvdkYxS1JscGlPRnplMGItXzJnYzZmQUgwS1kway9lZGl0P3BsaT0xI1xuICAgKi9cbiAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXIoYVNvdXJjZU1hcCkge1xuICAgIHZhciBzb3VyY2VNYXAgPSBhU291cmNlTWFwO1xuICAgIGlmICh0eXBlb2YgYVNvdXJjZU1hcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNvdXJjZU1hcCA9IEpTT04ucGFyc2UoYVNvdXJjZU1hcC5yZXBsYWNlKC9eXFwpXFxdXFx9Jy8sICcnKSk7XG4gICAgfVxuXG4gICAgdmFyIHZlcnNpb24gPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICd2ZXJzaW9uJyk7XG4gICAgdmFyIHNvdXJjZXMgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdzb3VyY2VzJyk7XG4gICAgLy8gU2FzcyAzLjMgbGVhdmVzIG91dCB0aGUgJ25hbWVzJyBhcnJheSwgc28gd2UgZGV2aWF0ZSBmcm9tIHRoZSBzcGVjICh3aGljaFxuICAgIC8vIHJlcXVpcmVzIHRoZSBhcnJheSkgdG8gcGxheSBuaWNlIGhlcmUuXG4gICAgdmFyIG5hbWVzID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnbmFtZXMnLCBbXSk7XG4gICAgdmFyIHNvdXJjZVJvb3QgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdzb3VyY2VSb290JywgbnVsbCk7XG4gICAgdmFyIHNvdXJjZXNDb250ZW50ID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnc291cmNlc0NvbnRlbnQnLCBudWxsKTtcbiAgICB2YXIgbWFwcGluZ3MgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdtYXBwaW5ncycpO1xuICAgIHZhciBmaWxlID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnZmlsZScsIG51bGwpO1xuXG4gICAgLy8gT25jZSBhZ2FpbiwgU2FzcyBkZXZpYXRlcyBmcm9tIHRoZSBzcGVjIGFuZCBzdXBwbGllcyB0aGUgdmVyc2lvbiBhcyBhXG4gICAgLy8gc3RyaW5nIHJhdGhlciB0aGFuIGEgbnVtYmVyLCBzbyB3ZSB1c2UgbG9vc2UgZXF1YWxpdHkgY2hlY2tpbmcgaGVyZS5cbiAgICBpZiAodmVyc2lvbiAhPSB0aGlzLl92ZXJzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIHZlcnNpb246ICcgKyB2ZXJzaW9uKTtcbiAgICB9XG5cbiAgICAvLyBTb21lIHNvdXJjZSBtYXBzIHByb2R1Y2UgcmVsYXRpdmUgc291cmNlIHBhdGhzIGxpa2UgXCIuL2Zvby5qc1wiIGluc3RlYWQgb2ZcbiAgICAvLyBcImZvby5qc1wiLiAgTm9ybWFsaXplIHRoZXNlIGZpcnN0IHNvIHRoYXQgZnV0dXJlIGNvbXBhcmlzb25zIHdpbGwgc3VjY2VlZC5cbiAgICAvLyBTZWUgYnVnemlsLmxhLzEwOTA3NjguXG4gICAgc291cmNlcyA9IHNvdXJjZXMubWFwKHV0aWwubm9ybWFsaXplKTtcblxuICAgIC8vIFBhc3MgYHRydWVgIGJlbG93IHRvIGFsbG93IGR1cGxpY2F0ZSBuYW1lcyBhbmQgc291cmNlcy4gV2hpbGUgc291cmNlIG1hcHNcbiAgICAvLyBhcmUgaW50ZW5kZWQgdG8gYmUgY29tcHJlc3NlZCBhbmQgZGVkdXBsaWNhdGVkLCB0aGUgVHlwZVNjcmlwdCBjb21waWxlclxuICAgIC8vIHNvbWV0aW1lcyBnZW5lcmF0ZXMgc291cmNlIG1hcHMgd2l0aCBkdXBsaWNhdGVzIGluIHRoZW0uIFNlZSBHaXRodWIgaXNzdWVcbiAgICAvLyAjNzIgYW5kIGJ1Z3ppbC5sYS84ODk0OTIuXG4gICAgdGhpcy5fbmFtZXMgPSBBcnJheVNldC5mcm9tQXJyYXkobmFtZXMsIHRydWUpO1xuICAgIHRoaXMuX3NvdXJjZXMgPSBBcnJheVNldC5mcm9tQXJyYXkoc291cmNlcywgdHJ1ZSk7XG5cbiAgICB0aGlzLnNvdXJjZVJvb3QgPSBzb3VyY2VSb290O1xuICAgIHRoaXMuc291cmNlc0NvbnRlbnQgPSBzb3VyY2VzQ29udGVudDtcbiAgICB0aGlzLl9tYXBwaW5ncyA9IG1hcHBpbmdzO1xuICAgIHRoaXMuZmlsZSA9IGZpbGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgU291cmNlTWFwQ29uc3VtZXIgZnJvbSBhIFNvdXJjZU1hcEdlbmVyYXRvci5cbiAgICpcbiAgICogQHBhcmFtIFNvdXJjZU1hcEdlbmVyYXRvciBhU291cmNlTWFwXG4gICAqICAgICAgICBUaGUgc291cmNlIG1hcCB0aGF0IHdpbGwgYmUgY29uc3VtZWQuXG4gICAqIEByZXR1cm5zIFNvdXJjZU1hcENvbnN1bWVyXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5mcm9tU291cmNlTWFwID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9mcm9tU291cmNlTWFwKGFTb3VyY2VNYXApIHtcbiAgICAgIHZhciBzbWMgPSBPYmplY3QuY3JlYXRlKFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZSk7XG5cbiAgICAgIHNtYy5fbmFtZXMgPSBBcnJheVNldC5mcm9tQXJyYXkoYVNvdXJjZU1hcC5fbmFtZXMudG9BcnJheSgpLCB0cnVlKTtcbiAgICAgIHNtYy5fc291cmNlcyA9IEFycmF5U2V0LmZyb21BcnJheShhU291cmNlTWFwLl9zb3VyY2VzLnRvQXJyYXkoKSwgdHJ1ZSk7XG4gICAgICBzbWMuc291cmNlUm9vdCA9IGFTb3VyY2VNYXAuX3NvdXJjZVJvb3Q7XG4gICAgICBzbWMuc291cmNlc0NvbnRlbnQgPSBhU291cmNlTWFwLl9nZW5lcmF0ZVNvdXJjZXNDb250ZW50KHNtYy5fc291cmNlcy50b0FycmF5KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYy5zb3VyY2VSb290KTtcbiAgICAgIHNtYy5maWxlID0gYVNvdXJjZU1hcC5fZmlsZTtcblxuICAgICAgc21jLl9fZ2VuZXJhdGVkTWFwcGluZ3MgPSBhU291cmNlTWFwLl9tYXBwaW5ncy50b0FycmF5KCkuc2xpY2UoKTtcbiAgICAgIHNtYy5fX29yaWdpbmFsTWFwcGluZ3MgPSBhU291cmNlTWFwLl9tYXBwaW5ncy50b0FycmF5KCkuc2xpY2UoKVxuICAgICAgICAuc29ydCh1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcblxuICAgICAgcmV0dXJuIHNtYztcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBUaGUgdmVyc2lvbiBvZiB0aGUgc291cmNlIG1hcHBpbmcgc3BlYyB0aGF0IHdlIGFyZSBjb25zdW1pbmcuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3ZlcnNpb24gPSAzO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBvcmlnaW5hbCBzb3VyY2VzLlxuICAgKi9cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZSwgJ3NvdXJjZXMnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc291cmNlcy50b0FycmF5KCkubWFwKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNvdXJjZVJvb3QgIT0gbnVsbCA/IHV0aWwuam9pbih0aGlzLnNvdXJjZVJvb3QsIHMpIDogcztcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gYF9fZ2VuZXJhdGVkTWFwcGluZ3NgIGFuZCBgX19vcmlnaW5hbE1hcHBpbmdzYCBhcmUgYXJyYXlzIHRoYXQgaG9sZCB0aGVcbiAgLy8gcGFyc2VkIG1hcHBpbmcgY29vcmRpbmF0ZXMgZnJvbSB0aGUgc291cmNlIG1hcCdzIFwibWFwcGluZ3NcIiBhdHRyaWJ1dGUuIFRoZXlcbiAgLy8gYXJlIGxhemlseSBpbnN0YW50aWF0ZWQsIGFjY2Vzc2VkIHZpYSB0aGUgYF9nZW5lcmF0ZWRNYXBwaW5nc2AgYW5kXG4gIC8vIGBfb3JpZ2luYWxNYXBwaW5nc2AgZ2V0dGVycyByZXNwZWN0aXZlbHksIGFuZCB3ZSBvbmx5IHBhcnNlIHRoZSBtYXBwaW5nc1xuICAvLyBhbmQgY3JlYXRlIHRoZXNlIGFycmF5cyBvbmNlIHF1ZXJpZWQgZm9yIGEgc291cmNlIGxvY2F0aW9uLiBXZSBqdW1wIHRocm91Z2hcbiAgLy8gdGhlc2UgaG9vcHMgYmVjYXVzZSB0aGVyZSBjYW4gYmUgbWFueSB0aG91c2FuZHMgb2YgbWFwcGluZ3MsIGFuZCBwYXJzaW5nXG4gIC8vIHRoZW0gaXMgZXhwZW5zaXZlLCBzbyB3ZSBvbmx5IHdhbnQgdG8gZG8gaXQgaWYgd2UgbXVzdC5cbiAgLy9cbiAgLy8gRWFjaCBvYmplY3QgaW4gdGhlIGFycmF5cyBpcyBvZiB0aGUgZm9ybTpcbiAgLy9cbiAgLy8gICAgIHtcbiAgLy8gICAgICAgZ2VuZXJhdGVkTGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgY29kZSxcbiAgLy8gICAgICAgZ2VuZXJhdGVkQ29sdW1uOiBUaGUgY29sdW1uIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIGNvZGUsXG4gIC8vICAgICAgIHNvdXJjZTogVGhlIHBhdGggdG8gdGhlIG9yaWdpbmFsIHNvdXJjZSBmaWxlIHRoYXQgZ2VuZXJhdGVkIHRoaXNcbiAgLy8gICAgICAgICAgICAgICBjaHVuayBvZiBjb2RlLFxuICAvLyAgICAgICBvcmlnaW5hbExpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgb3JpZ2luYWwgc291cmNlIHRoYXRcbiAgLy8gICAgICAgICAgICAgICAgICAgICBjb3JyZXNwb25kcyB0byB0aGlzIGNodW5rIG9mIGdlbmVyYXRlZCBjb2RlLFxuICAvLyAgICAgICBvcmlnaW5hbENvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZSB0aGF0XG4gIC8vICAgICAgICAgICAgICAgICAgICAgICBjb3JyZXNwb25kcyB0byB0aGlzIGNodW5rIG9mIGdlbmVyYXRlZCBjb2RlLFxuICAvLyAgICAgICBuYW1lOiBUaGUgbmFtZSBvZiB0aGUgb3JpZ2luYWwgc3ltYm9sIHdoaWNoIGdlbmVyYXRlZCB0aGlzIGNodW5rIG9mXG4gIC8vICAgICAgICAgICAgIGNvZGUuXG4gIC8vICAgICB9XG4gIC8vXG4gIC8vIEFsbCBwcm9wZXJ0aWVzIGV4Y2VwdCBmb3IgYGdlbmVyYXRlZExpbmVgIGFuZCBgZ2VuZXJhdGVkQ29sdW1uYCBjYW4gYmVcbiAgLy8gYG51bGxgLlxuICAvL1xuICAvLyBgX2dlbmVyYXRlZE1hcHBpbmdzYCBpcyBvcmRlcmVkIGJ5IHRoZSBnZW5lcmF0ZWQgcG9zaXRpb25zLlxuICAvL1xuICAvLyBgX29yaWdpbmFsTWFwcGluZ3NgIGlzIG9yZGVyZWQgYnkgdGhlIG9yaWdpbmFsIHBvc2l0aW9ucy5cblxuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX19nZW5lcmF0ZWRNYXBwaW5ncyA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUsICdfZ2VuZXJhdGVkTWFwcGluZ3MnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIXRoaXMuX19nZW5lcmF0ZWRNYXBwaW5ncykge1xuICAgICAgICB0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5fX29yaWdpbmFsTWFwcGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5fcGFyc2VNYXBwaW5ncyh0aGlzLl9tYXBwaW5ncywgdGhpcy5zb3VyY2VSb290KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5ncztcbiAgICB9XG4gIH0pO1xuXG4gIFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fX29yaWdpbmFsTWFwcGluZ3MgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLCAnX29yaWdpbmFsTWFwcGluZ3MnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoIXRoaXMuX19vcmlnaW5hbE1hcHBpbmdzKSB7XG4gICAgICAgIHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5ncyA9IFtdO1xuICAgICAgICB0aGlzLl9fb3JpZ2luYWxNYXBwaW5ncyA9IFtdO1xuICAgICAgICB0aGlzLl9wYXJzZU1hcHBpbmdzKHRoaXMuX21hcHBpbmdzLCB0aGlzLnNvdXJjZVJvb3QpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fX29yaWdpbmFsTWFwcGluZ3M7XG4gICAgfVxuICB9KTtcblxuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX25leHRDaGFySXNNYXBwaW5nU2VwYXJhdG9yID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9uZXh0Q2hhcklzTWFwcGluZ1NlcGFyYXRvcihhU3RyKSB7XG4gICAgICB2YXIgYyA9IGFTdHIuY2hhckF0KDApO1xuICAgICAgcmV0dXJuIGMgPT09IFwiO1wiIHx8IGMgPT09IFwiLFwiO1xuICAgIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBtYXBwaW5ncyBpbiBhIHN0cmluZyBpbiB0byBhIGRhdGEgc3RydWN0dXJlIHdoaWNoIHdlIGNhbiBlYXNpbHlcbiAgICogcXVlcnkgKHRoZSBvcmRlcmVkIGFycmF5cyBpbiB0aGUgYHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5nc2AgYW5kXG4gICAqIGB0aGlzLl9fb3JpZ2luYWxNYXBwaW5nc2AgcHJvcGVydGllcykuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3BhcnNlTWFwcGluZ3MgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX3BhcnNlTWFwcGluZ3MoYVN0ciwgYVNvdXJjZVJvb3QpIHtcbiAgICAgIHZhciBnZW5lcmF0ZWRMaW5lID0gMTtcbiAgICAgIHZhciBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgICB2YXIgcHJldmlvdXNPcmlnaW5hbExpbmUgPSAwO1xuICAgICAgdmFyIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4gPSAwO1xuICAgICAgdmFyIHByZXZpb3VzU291cmNlID0gMDtcbiAgICAgIHZhciBwcmV2aW91c05hbWUgPSAwO1xuICAgICAgdmFyIHN0ciA9IGFTdHI7XG4gICAgICB2YXIgdGVtcCA9IHt9O1xuICAgICAgdmFyIG1hcHBpbmc7XG5cbiAgICAgIHdoaWxlIChzdHIubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAoc3RyLmNoYXJBdCgwKSA9PT0gJzsnKSB7XG4gICAgICAgICAgZ2VuZXJhdGVkTGluZSsrO1xuICAgICAgICAgIHN0ciA9IHN0ci5zbGljZSgxKTtcbiAgICAgICAgICBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3RyLmNoYXJBdCgwKSA9PT0gJywnKSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNsaWNlKDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIG1hcHBpbmcgPSB7fTtcbiAgICAgICAgICBtYXBwaW5nLmdlbmVyYXRlZExpbmUgPSBnZW5lcmF0ZWRMaW5lO1xuXG4gICAgICAgICAgLy8gR2VuZXJhdGVkIGNvbHVtbi5cbiAgICAgICAgICBiYXNlNjRWTFEuZGVjb2RlKHN0ciwgdGVtcCk7XG4gICAgICAgICAgbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4gPSBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiArIHRlbXAudmFsdWU7XG4gICAgICAgICAgcHJldmlvdXNHZW5lcmF0ZWRDb2x1bW4gPSBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbjtcbiAgICAgICAgICBzdHIgPSB0ZW1wLnJlc3Q7XG5cbiAgICAgICAgICBpZiAoc3RyLmxlbmd0aCA+IDAgJiYgIXRoaXMuX25leHRDaGFySXNNYXBwaW5nU2VwYXJhdG9yKHN0cikpIHtcbiAgICAgICAgICAgIC8vIE9yaWdpbmFsIHNvdXJjZS5cbiAgICAgICAgICAgIGJhc2U2NFZMUS5kZWNvZGUoc3RyLCB0ZW1wKTtcbiAgICAgICAgICAgIG1hcHBpbmcuc291cmNlID0gdGhpcy5fc291cmNlcy5hdChwcmV2aW91c1NvdXJjZSArIHRlbXAudmFsdWUpO1xuICAgICAgICAgICAgcHJldmlvdXNTb3VyY2UgKz0gdGVtcC52YWx1ZTtcbiAgICAgICAgICAgIHN0ciA9IHRlbXAucmVzdDtcbiAgICAgICAgICAgIGlmIChzdHIubGVuZ3RoID09PSAwIHx8IHRoaXMuX25leHRDaGFySXNNYXBwaW5nU2VwYXJhdG9yKHN0cikpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCBhIHNvdXJjZSwgYnV0IG5vIGxpbmUgYW5kIGNvbHVtbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPcmlnaW5hbCBsaW5lLlxuICAgICAgICAgICAgYmFzZTY0VkxRLmRlY29kZShzdHIsIHRlbXApO1xuICAgICAgICAgICAgbWFwcGluZy5vcmlnaW5hbExpbmUgPSBwcmV2aW91c09yaWdpbmFsTGluZSArIHRlbXAudmFsdWU7XG4gICAgICAgICAgICBwcmV2aW91c09yaWdpbmFsTGluZSA9IG1hcHBpbmcub3JpZ2luYWxMaW5lO1xuICAgICAgICAgICAgLy8gTGluZXMgYXJlIHN0b3JlZCAwLWJhc2VkXG4gICAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsTGluZSArPSAxO1xuICAgICAgICAgICAgc3RyID0gdGVtcC5yZXN0O1xuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGggPT09IDAgfHwgdGhpcy5fbmV4dENoYXJJc01hcHBpbmdTZXBhcmF0b3Ioc3RyKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIGEgc291cmNlIGFuZCBsaW5lLCBidXQgbm8gY29sdW1uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE9yaWdpbmFsIGNvbHVtbi5cbiAgICAgICAgICAgIGJhc2U2NFZMUS5kZWNvZGUoc3RyLCB0ZW1wKTtcbiAgICAgICAgICAgIG1hcHBpbmcub3JpZ2luYWxDb2x1bW4gPSBwcmV2aW91c09yaWdpbmFsQ29sdW1uICsgdGVtcC52YWx1ZTtcbiAgICAgICAgICAgIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4gPSBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uO1xuICAgICAgICAgICAgc3RyID0gdGVtcC5yZXN0O1xuXG4gICAgICAgICAgICBpZiAoc3RyLmxlbmd0aCA+IDAgJiYgIXRoaXMuX25leHRDaGFySXNNYXBwaW5nU2VwYXJhdG9yKHN0cikpIHtcbiAgICAgICAgICAgICAgLy8gT3JpZ2luYWwgbmFtZS5cbiAgICAgICAgICAgICAgYmFzZTY0VkxRLmRlY29kZShzdHIsIHRlbXApO1xuICAgICAgICAgICAgICBtYXBwaW5nLm5hbWUgPSB0aGlzLl9uYW1lcy5hdChwcmV2aW91c05hbWUgKyB0ZW1wLnZhbHVlKTtcbiAgICAgICAgICAgICAgcHJldmlvdXNOYW1lICs9IHRlbXAudmFsdWU7XG4gICAgICAgICAgICAgIHN0ciA9IHRlbXAucmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3MucHVzaChtYXBwaW5nKTtcbiAgICAgICAgICBpZiAodHlwZW9mIG1hcHBpbmcub3JpZ2luYWxMaW5lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGhpcy5fX29yaWdpbmFsTWFwcGluZ3MucHVzaChtYXBwaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2dlbmVyYXRlZE1hcHBpbmdzLnNvcnQodXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnMpO1xuICAgICAgdGhpcy5fX29yaWdpbmFsTWFwcGluZ3Muc29ydCh1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSBtYXBwaW5nIHRoYXQgYmVzdCBtYXRjaGVzIHRoZSBoeXBvdGhldGljYWwgXCJuZWVkbGVcIiBtYXBwaW5nIHRoYXRcbiAgICogd2UgYXJlIHNlYXJjaGluZyBmb3IgaW4gdGhlIGdpdmVuIFwiaGF5c3RhY2tcIiBvZiBtYXBwaW5ncy5cbiAgICovXG4gIFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fZmluZE1hcHBpbmcgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX2ZpbmRNYXBwaW5nKGFOZWVkbGUsIGFNYXBwaW5ncywgYUxpbmVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFDb2x1bW5OYW1lLCBhQ29tcGFyYXRvcikge1xuICAgICAgLy8gVG8gcmV0dXJuIHRoZSBwb3NpdGlvbiB3ZSBhcmUgc2VhcmNoaW5nIGZvciwgd2UgbXVzdCBmaXJzdCBmaW5kIHRoZVxuICAgICAgLy8gbWFwcGluZyBmb3IgdGhlIGdpdmVuIHBvc2l0aW9uIGFuZCB0aGVuIHJldHVybiB0aGUgb3Bwb3NpdGUgcG9zaXRpb24gaXRcbiAgICAgIC8vIHBvaW50cyB0by4gQmVjYXVzZSB0aGUgbWFwcGluZ3MgYXJlIHNvcnRlZCwgd2UgY2FuIHVzZSBiaW5hcnkgc2VhcmNoIHRvXG4gICAgICAvLyBmaW5kIHRoZSBiZXN0IG1hcHBpbmcuXG5cbiAgICAgIGlmIChhTmVlZGxlW2FMaW5lTmFtZV0gPD0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdMaW5lIG11c3QgYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIDEsIGdvdCAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBhTmVlZGxlW2FMaW5lTmFtZV0pO1xuICAgICAgfVxuICAgICAgaWYgKGFOZWVkbGVbYUNvbHVtbk5hbWVdIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb2x1bW4gbXVzdCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gMCwgZ290ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGFOZWVkbGVbYUNvbHVtbk5hbWVdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJpbmFyeVNlYXJjaC5zZWFyY2goYU5lZWRsZSwgYU1hcHBpbmdzLCBhQ29tcGFyYXRvcik7XG4gICAgfTtcblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgbGFzdCBjb2x1bW4gZm9yIGVhY2ggZ2VuZXJhdGVkIG1hcHBpbmcuIFRoZSBsYXN0IGNvbHVtbiBpc1xuICAgKiBpbmNsdXNpdmUuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuY29tcHV0ZUNvbHVtblNwYW5zID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9jb21wdXRlQ29sdW1uU3BhbnMoKSB7XG4gICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5fZ2VuZXJhdGVkTWFwcGluZ3MubGVuZ3RoOyArK2luZGV4KSB7XG4gICAgICAgIHZhciBtYXBwaW5nID0gdGhpcy5fZ2VuZXJhdGVkTWFwcGluZ3NbaW5kZXhdO1xuXG4gICAgICAgIC8vIE1hcHBpbmdzIGRvIG5vdCBjb250YWluIGEgZmllbGQgZm9yIHRoZSBsYXN0IGdlbmVyYXRlZCBjb2x1bW50LiBXZVxuICAgICAgICAvLyBjYW4gY29tZSB1cCB3aXRoIGFuIG9wdGltaXN0aWMgZXN0aW1hdGUsIGhvd2V2ZXIsIGJ5IGFzc3VtaW5nIHRoYXRcbiAgICAgICAgLy8gbWFwcGluZ3MgYXJlIGNvbnRpZ3VvdXMgKGkuZS4gZ2l2ZW4gdHdvIGNvbnNlY3V0aXZlIG1hcHBpbmdzLCB0aGVcbiAgICAgICAgLy8gZmlyc3QgbWFwcGluZyBlbmRzIHdoZXJlIHRoZSBzZWNvbmQgb25lIHN0YXJ0cykuXG4gICAgICAgIGlmIChpbmRleCArIDEgPCB0aGlzLl9nZW5lcmF0ZWRNYXBwaW5ncy5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgbmV4dE1hcHBpbmcgPSB0aGlzLl9nZW5lcmF0ZWRNYXBwaW5nc1tpbmRleCArIDFdO1xuXG4gICAgICAgICAgaWYgKG1hcHBpbmcuZ2VuZXJhdGVkTGluZSA9PT0gbmV4dE1hcHBpbmcuZ2VuZXJhdGVkTGluZSkge1xuICAgICAgICAgICAgbWFwcGluZy5sYXN0R2VuZXJhdGVkQ29sdW1uID0gbmV4dE1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uIC0gMTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBsYXN0IG1hcHBpbmcgZm9yIGVhY2ggbGluZSBzcGFucyB0aGUgZW50aXJlIGxpbmUuXG4gICAgICAgIG1hcHBpbmcubGFzdEdlbmVyYXRlZENvbHVtbiA9IEluZmluaXR5O1xuICAgICAgfVxuICAgIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9yaWdpbmFsIHNvdXJjZSwgbGluZSwgYW5kIGNvbHVtbiBpbmZvcm1hdGlvbiBmb3IgdGhlIGdlbmVyYXRlZFxuICAgKiBzb3VyY2UncyBsaW5lIGFuZCBjb2x1bW4gcG9zaXRpb25zIHByb3ZpZGVkLiBUaGUgb25seSBhcmd1bWVudCBpcyBhbiBvYmplY3RcbiAgICogd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqXG4gICAqICAgLSBsaW5lOiBUaGUgbGluZSBudW1iZXIgaW4gdGhlIGdlbmVyYXRlZCBzb3VyY2UuXG4gICAqICAgLSBjb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLlxuICAgKlxuICAgKiBhbmQgYW4gb2JqZWN0IGlzIHJldHVybmVkIHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAgIC0gc291cmNlOiBUaGUgb3JpZ2luYWwgc291cmNlIGZpbGUsIG9yIG51bGwuXG4gICAqICAgLSBsaW5lOiBUaGUgbGluZSBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZSwgb3IgbnVsbC5cbiAgICogICAtIGNvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZSwgb3IgbnVsbC5cbiAgICogICAtIG5hbWU6IFRoZSBvcmlnaW5hbCBpZGVudGlmaWVyLCBvciBudWxsLlxuICAgKi9cbiAgU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLm9yaWdpbmFsUG9zaXRpb25Gb3IgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX29yaWdpbmFsUG9zaXRpb25Gb3IoYUFyZ3MpIHtcbiAgICAgIHZhciBuZWVkbGUgPSB7XG4gICAgICAgIGdlbmVyYXRlZExpbmU6IHV0aWwuZ2V0QXJnKGFBcmdzLCAnbGluZScpLFxuICAgICAgICBnZW5lcmF0ZWRDb2x1bW46IHV0aWwuZ2V0QXJnKGFBcmdzLCAnY29sdW1uJylcbiAgICAgIH07XG5cbiAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmRNYXBwaW5nKG5lZWRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dlbmVyYXRlZE1hcHBpbmdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJnZW5lcmF0ZWRMaW5lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdlbmVyYXRlZENvbHVtblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnMpO1xuXG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB2YXIgbWFwcGluZyA9IHRoaXMuX2dlbmVyYXRlZE1hcHBpbmdzW2luZGV4XTtcblxuICAgICAgICBpZiAobWFwcGluZy5nZW5lcmF0ZWRMaW5lID09PSBuZWVkbGUuZ2VuZXJhdGVkTGluZSkge1xuICAgICAgICAgIHZhciBzb3VyY2UgPSB1dGlsLmdldEFyZyhtYXBwaW5nLCAnc291cmNlJywgbnVsbCk7XG4gICAgICAgICAgaWYgKHNvdXJjZSAhPSBudWxsICYmIHRoaXMuc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBzb3VyY2UgPSB1dGlsLmpvaW4odGhpcy5zb3VyY2VSb290LCBzb3VyY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgICBsaW5lOiB1dGlsLmdldEFyZyhtYXBwaW5nLCAnb3JpZ2luYWxMaW5lJywgbnVsbCksXG4gICAgICAgICAgICBjb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdvcmlnaW5hbENvbHVtbicsIG51bGwpLFxuICAgICAgICAgICAgbmFtZTogdXRpbC5nZXRBcmcobWFwcGluZywgJ25hbWUnLCBudWxsKVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlOiBudWxsLFxuICAgICAgICBsaW5lOiBudWxsLFxuICAgICAgICBjb2x1bW46IG51bGwsXG4gICAgICAgIG5hbWU6IG51bGxcbiAgICAgIH07XG4gICAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3JpZ2luYWwgc291cmNlIGNvbnRlbnQuIFRoZSBvbmx5IGFyZ3VtZW50IGlzIHRoZSB1cmwgb2YgdGhlXG4gICAqIG9yaWdpbmFsIHNvdXJjZSBmaWxlLiBSZXR1cm5zIG51bGwgaWYgbm8gb3JpZ2luYWwgc291cmNlIGNvbnRlbnQgaXNcbiAgICogYXZhaWxpYmxlLlxuICAgKi9cbiAgU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLnNvdXJjZUNvbnRlbnRGb3IgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX3NvdXJjZUNvbnRlbnRGb3IoYVNvdXJjZSkge1xuICAgICAgaWYgKCF0aGlzLnNvdXJjZXNDb250ZW50KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zb3VyY2VSb290ICE9IG51bGwpIHtcbiAgICAgICAgYVNvdXJjZSA9IHV0aWwucmVsYXRpdmUodGhpcy5zb3VyY2VSb290LCBhU291cmNlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3NvdXJjZXMuaGFzKGFTb3VyY2UpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNvdXJjZXNDb250ZW50W3RoaXMuX3NvdXJjZXMuaW5kZXhPZihhU291cmNlKV07XG4gICAgICB9XG5cbiAgICAgIHZhciB1cmw7XG4gICAgICBpZiAodGhpcy5zb3VyY2VSb290ICE9IG51bGxcbiAgICAgICAgICAmJiAodXJsID0gdXRpbC51cmxQYXJzZSh0aGlzLnNvdXJjZVJvb3QpKSkge1xuICAgICAgICAvLyBYWFg6IGZpbGU6Ly8gVVJJcyBhbmQgYWJzb2x1dGUgcGF0aHMgbGVhZCB0byB1bmV4cGVjdGVkIGJlaGF2aW9yIGZvclxuICAgICAgICAvLyBtYW55IHVzZXJzLiBXZSBjYW4gaGVscCB0aGVtIG91dCB3aGVuIHRoZXkgZXhwZWN0IGZpbGU6Ly8gVVJJcyB0b1xuICAgICAgICAvLyBiZWhhdmUgbGlrZSBpdCB3b3VsZCBpZiB0aGV5IHdlcmUgcnVubmluZyBhIGxvY2FsIEhUVFAgc2VydmVyLiBTZWVcbiAgICAgICAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODg1NTk3LlxuICAgICAgICB2YXIgZmlsZVVyaUFic1BhdGggPSBhU291cmNlLnJlcGxhY2UoL15maWxlOlxcL1xcLy8sIFwiXCIpO1xuICAgICAgICBpZiAodXJsLnNjaGVtZSA9PSBcImZpbGVcIlxuICAgICAgICAgICAgJiYgdGhpcy5fc291cmNlcy5oYXMoZmlsZVVyaUFic1BhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlc0NvbnRlbnRbdGhpcy5fc291cmNlcy5pbmRleE9mKGZpbGVVcmlBYnNQYXRoKV1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoIXVybC5wYXRoIHx8IHVybC5wYXRoID09IFwiL1wiKVxuICAgICAgICAgICAgJiYgdGhpcy5fc291cmNlcy5oYXMoXCIvXCIgKyBhU291cmNlKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNvdXJjZXNDb250ZW50W3RoaXMuX3NvdXJjZXMuaW5kZXhPZihcIi9cIiArIGFTb3VyY2UpXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiJyArIGFTb3VyY2UgKyAnXCIgaXMgbm90IGluIHRoZSBTb3VyY2VNYXAuJyk7XG4gICAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZ2VuZXJhdGVkIGxpbmUgYW5kIGNvbHVtbiBpbmZvcm1hdGlvbiBmb3IgdGhlIG9yaWdpbmFsIHNvdXJjZSxcbiAgICogbGluZSwgYW5kIGNvbHVtbiBwb3NpdGlvbnMgcHJvdmlkZWQuIFRoZSBvbmx5IGFyZ3VtZW50IGlzIGFuIG9iamVjdCB3aXRoXG4gICAqIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogICAtIHNvdXJjZTogVGhlIGZpbGVuYW1lIG9mIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gICAqICAgLSBsaW5lOiBUaGUgbGluZSBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZS5cbiAgICogICAtIGNvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZS5cbiAgICpcbiAgICogYW5kIGFuIG9iamVjdCBpcyByZXR1cm5lZCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogICAtIGxpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZSwgb3IgbnVsbC5cbiAgICogICAtIGNvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIGdlbmVyYXRlZCBzb3VyY2UsIG9yIG51bGwuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuZ2VuZXJhdGVkUG9zaXRpb25Gb3IgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX2dlbmVyYXRlZFBvc2l0aW9uRm9yKGFBcmdzKSB7XG4gICAgICB2YXIgbmVlZGxlID0ge1xuICAgICAgICBzb3VyY2U6IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlJyksXG4gICAgICAgIG9yaWdpbmFsTGluZTogdXRpbC5nZXRBcmcoYUFyZ3MsICdsaW5lJyksXG4gICAgICAgIG9yaWdpbmFsQ29sdW1uOiB1dGlsLmdldEFyZyhhQXJncywgJ2NvbHVtbicpXG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5zb3VyY2VSb290ICE9IG51bGwpIHtcbiAgICAgICAgbmVlZGxlLnNvdXJjZSA9IHV0aWwucmVsYXRpdmUodGhpcy5zb3VyY2VSb290LCBuZWVkbGUuc291cmNlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZE1hcHBpbmcobmVlZGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3JpZ2luYWxNYXBwaW5ncyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3JpZ2luYWxMaW5lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9yaWdpbmFsQ29sdW1uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcblxuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgdmFyIG1hcHBpbmcgPSB0aGlzLl9vcmlnaW5hbE1hcHBpbmdzW2luZGV4XTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxpbmU6IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdnZW5lcmF0ZWRMaW5lJywgbnVsbCksXG4gICAgICAgICAgY29sdW1uOiB1dGlsLmdldEFyZyhtYXBwaW5nLCAnZ2VuZXJhdGVkQ29sdW1uJywgbnVsbCksXG4gICAgICAgICAgbGFzdENvbHVtbjogdXRpbC5nZXRBcmcobWFwcGluZywgJ2xhc3RHZW5lcmF0ZWRDb2x1bW4nLCBudWxsKVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBsaW5lOiBudWxsLFxuICAgICAgICBjb2x1bW46IG51bGwsXG4gICAgICAgIGxhc3RDb2x1bW46IG51bGxcbiAgICAgIH07XG4gICAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgZ2VuZXJhdGVkIGxpbmUgYW5kIGNvbHVtbiBpbmZvcm1hdGlvbiBmb3IgdGhlIG9yaWdpbmFsIHNvdXJjZVxuICAgKiBhbmQgbGluZSBwcm92aWRlZC4gVGhlIG9ubHkgYXJndW1lbnQgaXMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZ1xuICAgKiBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAgIC0gc291cmNlOiBUaGUgZmlsZW5hbWUgb2YgdGhlIG9yaWdpbmFsIHNvdXJjZS5cbiAgICogICAtIGxpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgb3JpZ2luYWwgc291cmNlLlxuICAgKlxuICAgKiBhbmQgYW4gYXJyYXkgb2Ygb2JqZWN0cyBpcyByZXR1cm5lZCwgZWFjaCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogICAtIGxpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZSwgb3IgbnVsbC5cbiAgICogICAtIGNvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIGdlbmVyYXRlZCBzb3VyY2UsIG9yIG51bGwuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuYWxsR2VuZXJhdGVkUG9zaXRpb25zRm9yID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9hbGxHZW5lcmF0ZWRQb3NpdGlvbnNGb3IoYUFyZ3MpIHtcbiAgICAgIC8vIFdoZW4gdGhlcmUgaXMgbm8gZXhhY3QgbWF0Y2gsIFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5fZmluZE1hcHBpbmdcbiAgICAgIC8vIHJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjbG9zZXN0IG1hcHBpbmcgbGVzcyB0aGFuIHRoZSBuZWVkbGUuIEJ5XG4gICAgICAvLyBzZXR0aW5nIG5lZWRsZS5vcmlnaW5hbENvbHVtbiB0byBJbmZpbml0eSwgd2UgdGh1cyBmaW5kIHRoZSBsYXN0XG4gICAgICAvLyBtYXBwaW5nIGZvciB0aGUgZ2l2ZW4gbGluZSwgcHJvdmlkZWQgc3VjaCBhIG1hcHBpbmcgZXhpc3RzLlxuICAgICAgdmFyIG5lZWRsZSA9IHtcbiAgICAgICAgc291cmNlOiB1dGlsLmdldEFyZyhhQXJncywgJ3NvdXJjZScpLFxuICAgICAgICBvcmlnaW5hbExpbmU6IHV0aWwuZ2V0QXJnKGFBcmdzLCAnbGluZScpLFxuICAgICAgICBvcmlnaW5hbENvbHVtbjogSW5maW5pdHlcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLnNvdXJjZVJvb3QgIT0gbnVsbCkge1xuICAgICAgICBuZWVkbGUuc291cmNlID0gdXRpbC5yZWxhdGl2ZSh0aGlzLnNvdXJjZVJvb3QsIG5lZWRsZS5zb3VyY2UpO1xuICAgICAgfVxuXG4gICAgICB2YXIgbWFwcGluZ3MgPSBbXTtcblxuICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZE1hcHBpbmcobmVlZGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3JpZ2luYWxNYXBwaW5ncyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3JpZ2luYWxMaW5lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9yaWdpbmFsQ29sdW1uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHZhciBtYXBwaW5nID0gdGhpcy5fb3JpZ2luYWxNYXBwaW5nc1tpbmRleF07XG5cbiAgICAgICAgd2hpbGUgKG1hcHBpbmcgJiYgbWFwcGluZy5vcmlnaW5hbExpbmUgPT09IG5lZWRsZS5vcmlnaW5hbExpbmUpIHtcbiAgICAgICAgICBtYXBwaW5ncy5wdXNoKHtcbiAgICAgICAgICAgIGxpbmU6IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdnZW5lcmF0ZWRMaW5lJywgbnVsbCksXG4gICAgICAgICAgICBjb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdnZW5lcmF0ZWRDb2x1bW4nLCBudWxsKSxcbiAgICAgICAgICAgIGxhc3RDb2x1bW46IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdsYXN0R2VuZXJhdGVkQ29sdW1uJywgbnVsbClcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG1hcHBpbmcgPSB0aGlzLl9vcmlnaW5hbE1hcHBpbmdzWy0taW5kZXhdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXBwaW5ncy5yZXZlcnNlKCk7XG4gICAgfTtcblxuICBTb3VyY2VNYXBDb25zdW1lci5HRU5FUkFURURfT1JERVIgPSAxO1xuICBTb3VyY2VNYXBDb25zdW1lci5PUklHSU5BTF9PUkRFUiA9IDI7XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBlYWNoIG1hcHBpbmcgYmV0d2VlbiBhbiBvcmlnaW5hbCBzb3VyY2UvbGluZS9jb2x1bW4gYW5kIGFcbiAgICogZ2VuZXJhdGVkIGxpbmUvY29sdW1uIGluIHRoaXMgc291cmNlIG1hcC5cbiAgICpcbiAgICogQHBhcmFtIEZ1bmN0aW9uIGFDYWxsYmFja1xuICAgKiAgICAgICAgVGhlIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggZWFjaCBtYXBwaW5nLlxuICAgKiBAcGFyYW0gT2JqZWN0IGFDb250ZXh0XG4gICAqICAgICAgICBPcHRpb25hbC4gSWYgc3BlY2lmaWVkLCB0aGlzIG9iamVjdCB3aWxsIGJlIHRoZSB2YWx1ZSBvZiBgdGhpc2AgZXZlcnlcbiAgICogICAgICAgIHRpbWUgdGhhdCBgYUNhbGxiYWNrYCBpcyBjYWxsZWQuXG4gICAqIEBwYXJhbSBhT3JkZXJcbiAgICogICAgICAgIEVpdGhlciBgU291cmNlTWFwQ29uc3VtZXIuR0VORVJBVEVEX09SREVSYCBvclxuICAgKiAgICAgICAgYFNvdXJjZU1hcENvbnN1bWVyLk9SSUdJTkFMX09SREVSYC4gU3BlY2lmaWVzIHdoZXRoZXIgeW91IHdhbnQgdG9cbiAgICogICAgICAgIGl0ZXJhdGUgb3ZlciB0aGUgbWFwcGluZ3Mgc29ydGVkIGJ5IHRoZSBnZW5lcmF0ZWQgZmlsZSdzIGxpbmUvY29sdW1uXG4gICAqICAgICAgICBvcmRlciBvciB0aGUgb3JpZ2luYWwncyBzb3VyY2UvbGluZS9jb2x1bW4gb3JkZXIsIHJlc3BlY3RpdmVseS4gRGVmYXVsdHMgdG9cbiAgICogICAgICAgIGBTb3VyY2VNYXBDb25zdW1lci5HRU5FUkFURURfT1JERVJgLlxuICAgKi9cbiAgU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLmVhY2hNYXBwaW5nID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9lYWNoTWFwcGluZyhhQ2FsbGJhY2ssIGFDb250ZXh0LCBhT3JkZXIpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gYUNvbnRleHQgfHwgbnVsbDtcbiAgICAgIHZhciBvcmRlciA9IGFPcmRlciB8fCBTb3VyY2VNYXBDb25zdW1lci5HRU5FUkFURURfT1JERVI7XG5cbiAgICAgIHZhciBtYXBwaW5ncztcbiAgICAgIHN3aXRjaCAob3JkZXIpIHtcbiAgICAgIGNhc2UgU291cmNlTWFwQ29uc3VtZXIuR0VORVJBVEVEX09SREVSOlxuICAgICAgICBtYXBwaW5ncyA9IHRoaXMuX2dlbmVyYXRlZE1hcHBpbmdzO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgU291cmNlTWFwQ29uc3VtZXIuT1JJR0lOQUxfT1JERVI6XG4gICAgICAgIG1hcHBpbmdzID0gdGhpcy5fb3JpZ2luYWxNYXBwaW5ncztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIG9yZGVyIG9mIGl0ZXJhdGlvbi5cIik7XG4gICAgICB9XG5cbiAgICAgIHZhciBzb3VyY2VSb290ID0gdGhpcy5zb3VyY2VSb290O1xuICAgICAgbWFwcGluZ3MubWFwKGZ1bmN0aW9uIChtYXBwaW5nKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBtYXBwaW5nLnNvdXJjZTtcbiAgICAgICAgaWYgKHNvdXJjZSAhPSBudWxsICYmIHNvdXJjZVJvb3QgIT0gbnVsbCkge1xuICAgICAgICAgIHNvdXJjZSA9IHV0aWwuam9pbihzb3VyY2VSb290LCBzb3VyY2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgZ2VuZXJhdGVkTGluZTogbWFwcGluZy5nZW5lcmF0ZWRMaW5lLFxuICAgICAgICAgIGdlbmVyYXRlZENvbHVtbjogbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4sXG4gICAgICAgICAgb3JpZ2luYWxMaW5lOiBtYXBwaW5nLm9yaWdpbmFsTGluZSxcbiAgICAgICAgICBvcmlnaW5hbENvbHVtbjogbWFwcGluZy5vcmlnaW5hbENvbHVtbixcbiAgICAgICAgICBuYW1lOiBtYXBwaW5nLm5hbWVcbiAgICAgICAgfTtcbiAgICAgIH0pLmZvckVhY2goYUNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICB9O1xuXG4gIGV4cG9ydHMuU291cmNlTWFwQ29uc3VtZXIgPSBTb3VyY2VNYXBDb25zdW1lcjtcblxufSk7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSwgcmVxdWlyZSk7XG59XG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4gIHZhciBiYXNlNjRWTFEgPSByZXF1aXJlKCcuL2Jhc2U2NC12bHEnKTtcbiAgdmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbiAgdmFyIEFycmF5U2V0ID0gcmVxdWlyZSgnLi9hcnJheS1zZXQnKS5BcnJheVNldDtcbiAgdmFyIE1hcHBpbmdMaXN0ID0gcmVxdWlyZSgnLi9tYXBwaW5nLWxpc3QnKS5NYXBwaW5nTGlzdDtcblxuICAvKipcbiAgICogQW4gaW5zdGFuY2Ugb2YgdGhlIFNvdXJjZU1hcEdlbmVyYXRvciByZXByZXNlbnRzIGEgc291cmNlIG1hcCB3aGljaCBpc1xuICAgKiBiZWluZyBidWlsdCBpbmNyZW1lbnRhbGx5LiBZb3UgbWF5IHBhc3MgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZ1xuICAgKiBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAgIC0gZmlsZTogVGhlIGZpbGVuYW1lIG9mIHRoZSBnZW5lcmF0ZWQgc291cmNlLlxuICAgKiAgIC0gc291cmNlUm9vdDogQSByb290IGZvciBhbGwgcmVsYXRpdmUgVVJMcyBpbiB0aGlzIHNvdXJjZSBtYXAuXG4gICAqL1xuICBmdW5jdGlvbiBTb3VyY2VNYXBHZW5lcmF0b3IoYUFyZ3MpIHtcbiAgICBpZiAoIWFBcmdzKSB7XG4gICAgICBhQXJncyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLl9maWxlID0gdXRpbC5nZXRBcmcoYUFyZ3MsICdmaWxlJywgbnVsbCk7XG4gICAgdGhpcy5fc291cmNlUm9vdCA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlUm9vdCcsIG51bGwpO1xuICAgIHRoaXMuX3NraXBWYWxpZGF0aW9uID0gdXRpbC5nZXRBcmcoYUFyZ3MsICdza2lwVmFsaWRhdGlvbicsIGZhbHNlKTtcbiAgICB0aGlzLl9zb3VyY2VzID0gbmV3IEFycmF5U2V0KCk7XG4gICAgdGhpcy5fbmFtZXMgPSBuZXcgQXJyYXlTZXQoKTtcbiAgICB0aGlzLl9tYXBwaW5ncyA9IG5ldyBNYXBwaW5nTGlzdCgpO1xuICAgIHRoaXMuX3NvdXJjZXNDb250ZW50cyA9IG51bGw7XG4gIH1cblxuICBTb3VyY2VNYXBHZW5lcmF0b3IucHJvdG90eXBlLl92ZXJzaW9uID0gMztcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBTb3VyY2VNYXBHZW5lcmF0b3IgYmFzZWQgb24gYSBTb3VyY2VNYXBDb25zdW1lclxuICAgKlxuICAgKiBAcGFyYW0gYVNvdXJjZU1hcENvbnN1bWVyIFRoZSBTb3VyY2VNYXAuXG4gICAqL1xuICBTb3VyY2VNYXBHZW5lcmF0b3IuZnJvbVNvdXJjZU1hcCA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX2Zyb21Tb3VyY2VNYXAoYVNvdXJjZU1hcENvbnN1bWVyKSB7XG4gICAgICB2YXIgc291cmNlUm9vdCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VSb290O1xuICAgICAgdmFyIGdlbmVyYXRvciA9IG5ldyBTb3VyY2VNYXBHZW5lcmF0b3Ioe1xuICAgICAgICBmaWxlOiBhU291cmNlTWFwQ29uc3VtZXIuZmlsZSxcbiAgICAgICAgc291cmNlUm9vdDogc291cmNlUm9vdFxuICAgICAgfSk7XG4gICAgICBhU291cmNlTWFwQ29uc3VtZXIuZWFjaE1hcHBpbmcoZnVuY3Rpb24gKG1hcHBpbmcpIHtcbiAgICAgICAgdmFyIG5ld01hcHBpbmcgPSB7XG4gICAgICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgICAgICBsaW5lOiBtYXBwaW5nLmdlbmVyYXRlZExpbmUsXG4gICAgICAgICAgICBjb2x1bW46IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChtYXBwaW5nLnNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgICAgbmV3TWFwcGluZy5zb3VyY2UgPSBtYXBwaW5nLnNvdXJjZTtcbiAgICAgICAgICBpZiAoc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBuZXdNYXBwaW5nLnNvdXJjZSA9IHV0aWwucmVsYXRpdmUoc291cmNlUm9vdCwgbmV3TWFwcGluZy5zb3VyY2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5ld01hcHBpbmcub3JpZ2luYWwgPSB7XG4gICAgICAgICAgICBsaW5lOiBtYXBwaW5nLm9yaWdpbmFsTGluZSxcbiAgICAgICAgICAgIGNvbHVtbjogbWFwcGluZy5vcmlnaW5hbENvbHVtblxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAobWFwcGluZy5uYW1lICE9IG51bGwpIHtcbiAgICAgICAgICAgIG5ld01hcHBpbmcubmFtZSA9IG1hcHBpbmcubmFtZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZW5lcmF0b3IuYWRkTWFwcGluZyhuZXdNYXBwaW5nKTtcbiAgICAgIH0pO1xuICAgICAgYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlRmlsZSkge1xuICAgICAgICB2YXIgY29udGVudCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VDb250ZW50Rm9yKHNvdXJjZUZpbGUpO1xuICAgICAgICBpZiAoY29udGVudCAhPSBudWxsKSB7XG4gICAgICAgICAgZ2VuZXJhdG9yLnNldFNvdXJjZUNvbnRlbnQoc291cmNlRmlsZSwgY29udGVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgYSBzaW5nbGUgbWFwcGluZyBmcm9tIG9yaWdpbmFsIHNvdXJjZSBsaW5lIGFuZCBjb2x1bW4gdG8gdGhlIGdlbmVyYXRlZFxuICAgKiBzb3VyY2UncyBsaW5lIGFuZCBjb2x1bW4gZm9yIHRoaXMgc291cmNlIG1hcCBiZWluZyBjcmVhdGVkLiBUaGUgbWFwcGluZ1xuICAgKiBvYmplY3Qgc2hvdWxkIGhhdmUgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAgIC0gZ2VuZXJhdGVkOiBBbiBvYmplY3Qgd2l0aCB0aGUgZ2VuZXJhdGVkIGxpbmUgYW5kIGNvbHVtbiBwb3NpdGlvbnMuXG4gICAqICAgLSBvcmlnaW5hbDogQW4gb2JqZWN0IHdpdGggdGhlIG9yaWdpbmFsIGxpbmUgYW5kIGNvbHVtbiBwb3NpdGlvbnMuXG4gICAqICAgLSBzb3VyY2U6IFRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZSAocmVsYXRpdmUgdG8gdGhlIHNvdXJjZVJvb3QpLlxuICAgKiAgIC0gbmFtZTogQW4gb3B0aW9uYWwgb3JpZ2luYWwgdG9rZW4gbmFtZSBmb3IgdGhpcyBtYXBwaW5nLlxuICAgKi9cbiAgU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5hZGRNYXBwaW5nID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBHZW5lcmF0b3JfYWRkTWFwcGluZyhhQXJncykge1xuICAgICAgdmFyIGdlbmVyYXRlZCA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnZ2VuZXJhdGVkJyk7XG4gICAgICB2YXIgb3JpZ2luYWwgPSB1dGlsLmdldEFyZyhhQXJncywgJ29yaWdpbmFsJywgbnVsbCk7XG4gICAgICB2YXIgc291cmNlID0gdXRpbC5nZXRBcmcoYUFyZ3MsICdzb3VyY2UnLCBudWxsKTtcbiAgICAgIHZhciBuYW1lID0gdXRpbC5nZXRBcmcoYUFyZ3MsICduYW1lJywgbnVsbCk7XG5cbiAgICAgIGlmICghdGhpcy5fc2tpcFZhbGlkYXRpb24pIHtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVNYXBwaW5nKGdlbmVyYXRlZCwgb3JpZ2luYWwsIHNvdXJjZSwgbmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzb3VyY2UgIT0gbnVsbCAmJiAhdGhpcy5fc291cmNlcy5oYXMoc291cmNlKSkge1xuICAgICAgICB0aGlzLl9zb3VyY2VzLmFkZChzb3VyY2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSAhPSBudWxsICYmICF0aGlzLl9uYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgdGhpcy5fbmFtZXMuYWRkKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9tYXBwaW5ncy5hZGQoe1xuICAgICAgICBnZW5lcmF0ZWRMaW5lOiBnZW5lcmF0ZWQubGluZSxcbiAgICAgICAgZ2VuZXJhdGVkQ29sdW1uOiBnZW5lcmF0ZWQuY29sdW1uLFxuICAgICAgICBvcmlnaW5hbExpbmU6IG9yaWdpbmFsICE9IG51bGwgJiYgb3JpZ2luYWwubGluZSxcbiAgICAgICAgb3JpZ2luYWxDb2x1bW46IG9yaWdpbmFsICE9IG51bGwgJiYgb3JpZ2luYWwuY29sdW1uLFxuICAgICAgICBzb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgbmFtZTogbmFtZVxuICAgICAgfSk7XG4gICAgfTtcblxuICAvKipcbiAgICogU2V0IHRoZSBzb3VyY2UgY29udGVudCBmb3IgYSBzb3VyY2UgZmlsZS5cbiAgICovXG4gIFNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUuc2V0U291cmNlQ29udGVudCA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX3NldFNvdXJjZUNvbnRlbnQoYVNvdXJjZUZpbGUsIGFTb3VyY2VDb250ZW50KSB7XG4gICAgICB2YXIgc291cmNlID0gYVNvdXJjZUZpbGU7XG4gICAgICBpZiAodGhpcy5fc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgIHNvdXJjZSA9IHV0aWwucmVsYXRpdmUodGhpcy5fc291cmNlUm9vdCwgc291cmNlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFTb3VyY2VDb250ZW50ICE9IG51bGwpIHtcbiAgICAgICAgLy8gQWRkIHRoZSBzb3VyY2UgY29udGVudCB0byB0aGUgX3NvdXJjZXNDb250ZW50cyBtYXAuXG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyBfc291cmNlc0NvbnRlbnRzIG1hcCBpZiB0aGUgcHJvcGVydHkgaXMgbnVsbC5cbiAgICAgICAgaWYgKCF0aGlzLl9zb3VyY2VzQ29udGVudHMpIHtcbiAgICAgICAgICB0aGlzLl9zb3VyY2VzQ29udGVudHMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zb3VyY2VzQ29udGVudHNbdXRpbC50b1NldFN0cmluZyhzb3VyY2UpXSA9IGFTb3VyY2VDb250ZW50O1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9zb3VyY2VzQ29udGVudHMpIHtcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzb3VyY2UgZmlsZSBmcm9tIHRoZSBfc291cmNlc0NvbnRlbnRzIG1hcC5cbiAgICAgICAgLy8gSWYgdGhlIF9zb3VyY2VzQ29udGVudHMgbWFwIGlzIGVtcHR5LCBzZXQgdGhlIHByb3BlcnR5IHRvIG51bGwuXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9zb3VyY2VzQ29udGVudHNbdXRpbC50b1NldFN0cmluZyhzb3VyY2UpXTtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuX3NvdXJjZXNDb250ZW50cykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fc291cmNlc0NvbnRlbnRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgdGhlIG1hcHBpbmdzIG9mIGEgc3ViLXNvdXJjZS1tYXAgZm9yIGEgc3BlY2lmaWMgc291cmNlIGZpbGUgdG8gdGhlXG4gICAqIHNvdXJjZSBtYXAgYmVpbmcgZ2VuZXJhdGVkLiBFYWNoIG1hcHBpbmcgdG8gdGhlIHN1cHBsaWVkIHNvdXJjZSBmaWxlIGlzXG4gICAqIHJld3JpdHRlbiB1c2luZyB0aGUgc3VwcGxpZWQgc291cmNlIG1hcC4gTm90ZTogVGhlIHJlc29sdXRpb24gZm9yIHRoZVxuICAgKiByZXN1bHRpbmcgbWFwcGluZ3MgaXMgdGhlIG1pbmltaXVtIG9mIHRoaXMgbWFwIGFuZCB0aGUgc3VwcGxpZWQgbWFwLlxuICAgKlxuICAgKiBAcGFyYW0gYVNvdXJjZU1hcENvbnN1bWVyIFRoZSBzb3VyY2UgbWFwIHRvIGJlIGFwcGxpZWQuXG4gICAqIEBwYXJhbSBhU291cmNlRmlsZSBPcHRpb25hbC4gVGhlIGZpbGVuYW1lIG9mIHRoZSBzb3VyY2UgZmlsZS5cbiAgICogICAgICAgIElmIG9taXR0ZWQsIFNvdXJjZU1hcENvbnN1bWVyJ3MgZmlsZSBwcm9wZXJ0eSB3aWxsIGJlIHVzZWQuXG4gICAqIEBwYXJhbSBhU291cmNlTWFwUGF0aCBPcHRpb25hbC4gVGhlIGRpcm5hbWUgb2YgdGhlIHBhdGggdG8gdGhlIHNvdXJjZSBtYXBcbiAgICogICAgICAgIHRvIGJlIGFwcGxpZWQuIElmIHJlbGF0aXZlLCBpdCBpcyByZWxhdGl2ZSB0byB0aGUgU291cmNlTWFwQ29uc3VtZXIuXG4gICAqICAgICAgICBUaGlzIHBhcmFtZXRlciBpcyBuZWVkZWQgd2hlbiB0aGUgdHdvIHNvdXJjZSBtYXBzIGFyZW4ndCBpbiB0aGUgc2FtZVxuICAgKiAgICAgICAgZGlyZWN0b3J5LCBhbmQgdGhlIHNvdXJjZSBtYXAgdG8gYmUgYXBwbGllZCBjb250YWlucyByZWxhdGl2ZSBzb3VyY2VcbiAgICogICAgICAgIHBhdGhzLiBJZiBzbywgdGhvc2UgcmVsYXRpdmUgc291cmNlIHBhdGhzIG5lZWQgdG8gYmUgcmV3cml0dGVuXG4gICAqICAgICAgICByZWxhdGl2ZSB0byB0aGUgU291cmNlTWFwR2VuZXJhdG9yLlxuICAgKi9cbiAgU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5hcHBseVNvdXJjZU1hcCA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX2FwcGx5U291cmNlTWFwKGFTb3VyY2VNYXBDb25zdW1lciwgYVNvdXJjZUZpbGUsIGFTb3VyY2VNYXBQYXRoKSB7XG4gICAgICB2YXIgc291cmNlRmlsZSA9IGFTb3VyY2VGaWxlO1xuICAgICAgLy8gSWYgYVNvdXJjZUZpbGUgaXMgb21pdHRlZCwgd2Ugd2lsbCB1c2UgdGhlIGZpbGUgcHJvcGVydHkgb2YgdGhlIFNvdXJjZU1hcFxuICAgICAgaWYgKGFTb3VyY2VGaWxlID09IG51bGwpIHtcbiAgICAgICAgaWYgKGFTb3VyY2VNYXBDb25zdW1lci5maWxlID09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5hcHBseVNvdXJjZU1hcCByZXF1aXJlcyBlaXRoZXIgYW4gZXhwbGljaXQgc291cmNlIGZpbGUsICcgK1xuICAgICAgICAgICAgJ29yIHRoZSBzb3VyY2UgbWFwXFwncyBcImZpbGVcIiBwcm9wZXJ0eS4gQm90aCB3ZXJlIG9taXR0ZWQuJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlRmlsZSA9IGFTb3VyY2VNYXBDb25zdW1lci5maWxlO1xuICAgICAgfVxuICAgICAgdmFyIHNvdXJjZVJvb3QgPSB0aGlzLl9zb3VyY2VSb290O1xuICAgICAgLy8gTWFrZSBcInNvdXJjZUZpbGVcIiByZWxhdGl2ZSBpZiBhbiBhYnNvbHV0ZSBVcmwgaXMgcGFzc2VkLlxuICAgICAgaWYgKHNvdXJjZVJvb3QgIT0gbnVsbCkge1xuICAgICAgICBzb3VyY2VGaWxlID0gdXRpbC5yZWxhdGl2ZShzb3VyY2VSb290LCBzb3VyY2VGaWxlKTtcbiAgICAgIH1cbiAgICAgIC8vIEFwcGx5aW5nIHRoZSBTb3VyY2VNYXAgY2FuIGFkZCBhbmQgcmVtb3ZlIGl0ZW1zIGZyb20gdGhlIHNvdXJjZXMgYW5kXG4gICAgICAvLyB0aGUgbmFtZXMgYXJyYXkuXG4gICAgICB2YXIgbmV3U291cmNlcyA9IG5ldyBBcnJheVNldCgpO1xuICAgICAgdmFyIG5ld05hbWVzID0gbmV3IEFycmF5U2V0KCk7XG5cbiAgICAgIC8vIEZpbmQgbWFwcGluZ3MgZm9yIHRoZSBcInNvdXJjZUZpbGVcIlxuICAgICAgdGhpcy5fbWFwcGluZ3MudW5zb3J0ZWRGb3JFYWNoKGZ1bmN0aW9uIChtYXBwaW5nKSB7XG4gICAgICAgIGlmIChtYXBwaW5nLnNvdXJjZSA9PT0gc291cmNlRmlsZSAmJiBtYXBwaW5nLm9yaWdpbmFsTGluZSAhPSBudWxsKSB7XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgaXQgY2FuIGJlIG1hcHBlZCBieSB0aGUgc291cmNlIG1hcCwgdGhlbiB1cGRhdGUgdGhlIG1hcHBpbmcuXG4gICAgICAgICAgdmFyIG9yaWdpbmFsID0gYVNvdXJjZU1hcENvbnN1bWVyLm9yaWdpbmFsUG9zaXRpb25Gb3Ioe1xuICAgICAgICAgICAgbGluZTogbWFwcGluZy5vcmlnaW5hbExpbmUsXG4gICAgICAgICAgICBjb2x1bW46IG1hcHBpbmcub3JpZ2luYWxDb2x1bW5cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAob3JpZ2luYWwuc291cmNlICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIENvcHkgbWFwcGluZ1xuICAgICAgICAgICAgbWFwcGluZy5zb3VyY2UgPSBvcmlnaW5hbC5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoYVNvdXJjZU1hcFBhdGggIT0gbnVsbCkge1xuICAgICAgICAgICAgICBtYXBwaW5nLnNvdXJjZSA9IHV0aWwuam9pbihhU291cmNlTWFwUGF0aCwgbWFwcGluZy5zb3VyY2UpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIG1hcHBpbmcuc291cmNlID0gdXRpbC5yZWxhdGl2ZShzb3VyY2VSb290LCBtYXBwaW5nLnNvdXJjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsTGluZSA9IG9yaWdpbmFsLmxpbmU7XG4gICAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uID0gb3JpZ2luYWwuY29sdW1uO1xuICAgICAgICAgICAgaWYgKG9yaWdpbmFsLm5hbWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBtYXBwaW5nLm5hbWUgPSBvcmlnaW5hbC5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzb3VyY2UgPSBtYXBwaW5nLnNvdXJjZTtcbiAgICAgICAgaWYgKHNvdXJjZSAhPSBudWxsICYmICFuZXdTb3VyY2VzLmhhcyhzb3VyY2UpKSB7XG4gICAgICAgICAgbmV3U291cmNlcy5hZGQoc291cmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBuYW1lID0gbWFwcGluZy5uYW1lO1xuICAgICAgICBpZiAobmFtZSAhPSBudWxsICYmICFuZXdOYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICBuZXdOYW1lcy5hZGQobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgfSwgdGhpcyk7XG4gICAgICB0aGlzLl9zb3VyY2VzID0gbmV3U291cmNlcztcbiAgICAgIHRoaXMuX25hbWVzID0gbmV3TmFtZXM7XG5cbiAgICAgIC8vIENvcHkgc291cmNlc0NvbnRlbnRzIG9mIGFwcGxpZWQgbWFwLlxuICAgICAgYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlRmlsZSkge1xuICAgICAgICB2YXIgY29udGVudCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VDb250ZW50Rm9yKHNvdXJjZUZpbGUpO1xuICAgICAgICBpZiAoY29udGVudCAhPSBudWxsKSB7XG4gICAgICAgICAgaWYgKGFTb3VyY2VNYXBQYXRoICE9IG51bGwpIHtcbiAgICAgICAgICAgIHNvdXJjZUZpbGUgPSB1dGlsLmpvaW4oYVNvdXJjZU1hcFBhdGgsIHNvdXJjZUZpbGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc291cmNlUm9vdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBzb3VyY2VGaWxlID0gdXRpbC5yZWxhdGl2ZShzb3VyY2VSb290LCBzb3VyY2VGaWxlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zZXRTb3VyY2VDb250ZW50KHNvdXJjZUZpbGUsIGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICB9LCB0aGlzKTtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBBIG1hcHBpbmcgY2FuIGhhdmUgb25lIG9mIHRoZSB0aHJlZSBsZXZlbHMgb2YgZGF0YTpcbiAgICpcbiAgICogICAxLiBKdXN0IHRoZSBnZW5lcmF0ZWQgcG9zaXRpb24uXG4gICAqICAgMi4gVGhlIEdlbmVyYXRlZCBwb3NpdGlvbiwgb3JpZ2luYWwgcG9zaXRpb24sIGFuZCBvcmlnaW5hbCBzb3VyY2UuXG4gICAqICAgMy4gR2VuZXJhdGVkIGFuZCBvcmlnaW5hbCBwb3NpdGlvbiwgb3JpZ2luYWwgc291cmNlLCBhcyB3ZWxsIGFzIGEgbmFtZVxuICAgKiAgICAgIHRva2VuLlxuICAgKlxuICAgKiBUbyBtYWludGFpbiBjb25zaXN0ZW5jeSwgd2UgdmFsaWRhdGUgdGhhdCBhbnkgbmV3IG1hcHBpbmcgYmVpbmcgYWRkZWQgZmFsbHNcbiAgICogaW4gdG8gb25lIG9mIHRoZXNlIGNhdGVnb3JpZXMuXG4gICAqL1xuICBTb3VyY2VNYXBHZW5lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0ZU1hcHBpbmcgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl92YWxpZGF0ZU1hcHBpbmcoYUdlbmVyYXRlZCwgYU9yaWdpbmFsLCBhU291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYU5hbWUpIHtcbiAgICAgIGlmIChhR2VuZXJhdGVkICYmICdsaW5lJyBpbiBhR2VuZXJhdGVkICYmICdjb2x1bW4nIGluIGFHZW5lcmF0ZWRcbiAgICAgICAgICAmJiBhR2VuZXJhdGVkLmxpbmUgPiAwICYmIGFHZW5lcmF0ZWQuY29sdW1uID49IDBcbiAgICAgICAgICAmJiAhYU9yaWdpbmFsICYmICFhU291cmNlICYmICFhTmFtZSkge1xuICAgICAgICAvLyBDYXNlIDEuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGFHZW5lcmF0ZWQgJiYgJ2xpbmUnIGluIGFHZW5lcmF0ZWQgJiYgJ2NvbHVtbicgaW4gYUdlbmVyYXRlZFxuICAgICAgICAgICAgICAgJiYgYU9yaWdpbmFsICYmICdsaW5lJyBpbiBhT3JpZ2luYWwgJiYgJ2NvbHVtbicgaW4gYU9yaWdpbmFsXG4gICAgICAgICAgICAgICAmJiBhR2VuZXJhdGVkLmxpbmUgPiAwICYmIGFHZW5lcmF0ZWQuY29sdW1uID49IDBcbiAgICAgICAgICAgICAgICYmIGFPcmlnaW5hbC5saW5lID4gMCAmJiBhT3JpZ2luYWwuY29sdW1uID49IDBcbiAgICAgICAgICAgICAgICYmIGFTb3VyY2UpIHtcbiAgICAgICAgLy8gQ2FzZXMgMiBhbmQgMy5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBtYXBwaW5nOiAnICsgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIGdlbmVyYXRlZDogYUdlbmVyYXRlZCxcbiAgICAgICAgICBzb3VyY2U6IGFTb3VyY2UsXG4gICAgICAgICAgb3JpZ2luYWw6IGFPcmlnaW5hbCxcbiAgICAgICAgICBuYW1lOiBhTmFtZVxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfTtcblxuICAvKipcbiAgICogU2VyaWFsaXplIHRoZSBhY2N1bXVsYXRlZCBtYXBwaW5ncyBpbiB0byB0aGUgc3RyZWFtIG9mIGJhc2UgNjQgVkxRc1xuICAgKiBzcGVjaWZpZWQgYnkgdGhlIHNvdXJjZSBtYXAgZm9ybWF0LlxuICAgKi9cbiAgU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5fc2VyaWFsaXplTWFwcGluZ3MgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl9zZXJpYWxpemVNYXBwaW5ncygpIHtcbiAgICAgIHZhciBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgICB2YXIgcHJldmlvdXNHZW5lcmF0ZWRMaW5lID0gMTtcbiAgICAgIHZhciBwcmV2aW91c09yaWdpbmFsQ29sdW1uID0gMDtcbiAgICAgIHZhciBwcmV2aW91c09yaWdpbmFsTGluZSA9IDA7XG4gICAgICB2YXIgcHJldmlvdXNOYW1lID0gMDtcbiAgICAgIHZhciBwcmV2aW91c1NvdXJjZSA9IDA7XG4gICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICB2YXIgbWFwcGluZztcblxuICAgICAgdmFyIG1hcHBpbmdzID0gdGhpcy5fbWFwcGluZ3MudG9BcnJheSgpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbWFwcGluZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgbWFwcGluZyA9IG1hcHBpbmdzW2ldO1xuXG4gICAgICAgIGlmIChtYXBwaW5nLmdlbmVyYXRlZExpbmUgIT09IHByZXZpb3VzR2VuZXJhdGVkTGluZSkge1xuICAgICAgICAgIHByZXZpb3VzR2VuZXJhdGVkQ29sdW1uID0gMDtcbiAgICAgICAgICB3aGlsZSAobWFwcGluZy5nZW5lcmF0ZWRMaW5lICE9PSBwcmV2aW91c0dlbmVyYXRlZExpbmUpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnOyc7XG4gICAgICAgICAgICBwcmV2aW91c0dlbmVyYXRlZExpbmUrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICBpZiAoIXV0aWwuY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zKG1hcHBpbmcsIG1hcHBpbmdzW2kgLSAxXSkpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgKz0gJywnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdCArPSBiYXNlNjRWTFEuZW5jb2RlKG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gcHJldmlvdXNHZW5lcmF0ZWRDb2x1bW4pO1xuICAgICAgICBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uO1xuXG4gICAgICAgIGlmIChtYXBwaW5nLnNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IGJhc2U2NFZMUS5lbmNvZGUodGhpcy5fc291cmNlcy5pbmRleE9mKG1hcHBpbmcuc291cmNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gcHJldmlvdXNTb3VyY2UpO1xuICAgICAgICAgIHByZXZpb3VzU291cmNlID0gdGhpcy5fc291cmNlcy5pbmRleE9mKG1hcHBpbmcuc291cmNlKTtcblxuICAgICAgICAgIC8vIGxpbmVzIGFyZSBzdG9yZWQgMC1iYXNlZCBpbiBTb3VyY2VNYXAgc3BlYyB2ZXJzaW9uIDNcbiAgICAgICAgICByZXN1bHQgKz0gYmFzZTY0VkxRLmVuY29kZShtYXBwaW5nLm9yaWdpbmFsTGluZSAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHByZXZpb3VzT3JpZ2luYWxMaW5lKTtcbiAgICAgICAgICBwcmV2aW91c09yaWdpbmFsTGluZSA9IG1hcHBpbmcub3JpZ2luYWxMaW5lIC0gMTtcblxuICAgICAgICAgIHJlc3VsdCArPSBiYXNlNjRWTFEuZW5jb2RlKG1hcHBpbmcub3JpZ2luYWxDb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4pO1xuICAgICAgICAgIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4gPSBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uO1xuXG4gICAgICAgICAgaWYgKG1hcHBpbmcubmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gYmFzZTY0VkxRLmVuY29kZSh0aGlzLl9uYW1lcy5pbmRleE9mKG1hcHBpbmcubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gcHJldmlvdXNOYW1lKTtcbiAgICAgICAgICAgIHByZXZpb3VzTmFtZSA9IHRoaXMuX25hbWVzLmluZGV4T2YobWFwcGluZy5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gIFNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUuX2dlbmVyYXRlU291cmNlc0NvbnRlbnQgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl9nZW5lcmF0ZVNvdXJjZXNDb250ZW50KGFTb3VyY2VzLCBhU291cmNlUm9vdCkge1xuICAgICAgcmV0dXJuIGFTb3VyY2VzLm1hcChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICAgIGlmICghdGhpcy5fc291cmNlc0NvbnRlbnRzKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFTb3VyY2VSb290ICE9IG51bGwpIHtcbiAgICAgICAgICBzb3VyY2UgPSB1dGlsLnJlbGF0aXZlKGFTb3VyY2VSb290LCBzb3VyY2UpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXkgPSB1dGlsLnRvU2V0U3RyaW5nKHNvdXJjZSk7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5fc291cmNlc0NvbnRlbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSlcbiAgICAgICAgICA/IHRoaXMuX3NvdXJjZXNDb250ZW50c1trZXldXG4gICAgICAgICAgOiBudWxsO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfTtcblxuICAvKipcbiAgICogRXh0ZXJuYWxpemUgdGhlIHNvdXJjZSBtYXAuXG4gICAqL1xuICBTb3VyY2VNYXBHZW5lcmF0b3IucHJvdG90eXBlLnRvSlNPTiA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX3RvSlNPTigpIHtcbiAgICAgIHZhciBtYXAgPSB7XG4gICAgICAgIHZlcnNpb246IHRoaXMuX3ZlcnNpb24sXG4gICAgICAgIHNvdXJjZXM6IHRoaXMuX3NvdXJjZXMudG9BcnJheSgpLFxuICAgICAgICBuYW1lczogdGhpcy5fbmFtZXMudG9BcnJheSgpLFxuICAgICAgICBtYXBwaW5nczogdGhpcy5fc2VyaWFsaXplTWFwcGluZ3MoKVxuICAgICAgfTtcbiAgICAgIGlmICh0aGlzLl9maWxlICE9IG51bGwpIHtcbiAgICAgICAgbWFwLmZpbGUgPSB0aGlzLl9maWxlO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX3NvdXJjZVJvb3QgIT0gbnVsbCkge1xuICAgICAgICBtYXAuc291cmNlUm9vdCA9IHRoaXMuX3NvdXJjZVJvb3Q7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fc291cmNlc0NvbnRlbnRzKSB7XG4gICAgICAgIG1hcC5zb3VyY2VzQ29udGVudCA9IHRoaXMuX2dlbmVyYXRlU291cmNlc0NvbnRlbnQobWFwLnNvdXJjZXMsIG1hcC5zb3VyY2VSb290KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1hcDtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBSZW5kZXIgdGhlIHNvdXJjZSBtYXAgYmVpbmcgZ2VuZXJhdGVkIHRvIGEgc3RyaW5nLlxuICAgKi9cbiAgU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS50b1N0cmluZyA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX3RvU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMpO1xuICAgIH07XG5cbiAgZXhwb3J0cy5Tb3VyY2VNYXBHZW5lcmF0b3IgPSBTb3VyY2VNYXBHZW5lcmF0b3I7XG5cbn0pO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICB2YXIgU291cmNlTWFwR2VuZXJhdG9yID0gcmVxdWlyZSgnLi9zb3VyY2UtbWFwLWdlbmVyYXRvcicpLlNvdXJjZU1hcEdlbmVyYXRvcjtcbiAgdmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICAvLyBNYXRjaGVzIGEgV2luZG93cy1zdHlsZSBgXFxyXFxuYCBuZXdsaW5lIG9yIGEgYFxcbmAgbmV3bGluZSB1c2VkIGJ5IGFsbCBvdGhlclxuICAvLyBvcGVyYXRpbmcgc3lzdGVtcyB0aGVzZSBkYXlzIChjYXB0dXJpbmcgdGhlIHJlc3VsdCkuXG4gIHZhciBSRUdFWF9ORVdMSU5FID0gLyhcXHI/XFxuKS87XG5cbiAgLy8gTmV3bGluZSBjaGFyYWN0ZXIgY29kZSBmb3IgY2hhckNvZGVBdCgpIGNvbXBhcmlzb25zXG4gIHZhciBORVdMSU5FX0NPREUgPSAxMDtcblxuICAvLyBQcml2YXRlIHN5bWJvbCBmb3IgaWRlbnRpZnlpbmcgYFNvdXJjZU5vZGVgcyB3aGVuIG11bHRpcGxlIHZlcnNpb25zIG9mXG4gIC8vIHRoZSBzb3VyY2UtbWFwIGxpYnJhcnkgYXJlIGxvYWRlZC4gVGhpcyBNVVNUIE5PVCBDSEFOR0UgYWNyb3NzXG4gIC8vIHZlcnNpb25zIVxuICB2YXIgaXNTb3VyY2VOb2RlID0gXCIkJCRpc1NvdXJjZU5vZGUkJCRcIjtcblxuICAvKipcbiAgICogU291cmNlTm9kZXMgcHJvdmlkZSBhIHdheSB0byBhYnN0cmFjdCBvdmVyIGludGVycG9sYXRpbmcvY29uY2F0ZW5hdGluZ1xuICAgKiBzbmlwcGV0cyBvZiBnZW5lcmF0ZWQgSmF2YVNjcmlwdCBzb3VyY2UgY29kZSB3aGlsZSBtYWludGFpbmluZyB0aGUgbGluZSBhbmRcbiAgICogY29sdW1uIGluZm9ybWF0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgb3JpZ2luYWwgc291cmNlIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSBhTGluZSBUaGUgb3JpZ2luYWwgbGluZSBudW1iZXIuXG4gICAqIEBwYXJhbSBhQ29sdW1uIFRoZSBvcmlnaW5hbCBjb2x1bW4gbnVtYmVyLlxuICAgKiBAcGFyYW0gYVNvdXJjZSBUaGUgb3JpZ2luYWwgc291cmNlJ3MgZmlsZW5hbWUuXG4gICAqIEBwYXJhbSBhQ2h1bmtzIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBzdHJpbmdzIHdoaWNoIGFyZSBzbmlwcGV0cyBvZlxuICAgKiAgICAgICAgZ2VuZXJhdGVkIEpTLCBvciBvdGhlciBTb3VyY2VOb2Rlcy5cbiAgICogQHBhcmFtIGFOYW1lIFRoZSBvcmlnaW5hbCBpZGVudGlmaWVyLlxuICAgKi9cbiAgZnVuY3Rpb24gU291cmNlTm9kZShhTGluZSwgYUNvbHVtbiwgYVNvdXJjZSwgYUNodW5rcywgYU5hbWUpIHtcbiAgICB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgdGhpcy5zb3VyY2VDb250ZW50cyA9IHt9O1xuICAgIHRoaXMubGluZSA9IGFMaW5lID09IG51bGwgPyBudWxsIDogYUxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBhQ29sdW1uID09IG51bGwgPyBudWxsIDogYUNvbHVtbjtcbiAgICB0aGlzLnNvdXJjZSA9IGFTb3VyY2UgPT0gbnVsbCA/IG51bGwgOiBhU291cmNlO1xuICAgIHRoaXMubmFtZSA9IGFOYW1lID09IG51bGwgPyBudWxsIDogYU5hbWU7XG4gICAgdGhpc1tpc1NvdXJjZU5vZGVdID0gdHJ1ZTtcbiAgICBpZiAoYUNodW5rcyAhPSBudWxsKSB0aGlzLmFkZChhQ2h1bmtzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU291cmNlTm9kZSBmcm9tIGdlbmVyYXRlZCBjb2RlIGFuZCBhIFNvdXJjZU1hcENvbnN1bWVyLlxuICAgKlxuICAgKiBAcGFyYW0gYUdlbmVyYXRlZENvZGUgVGhlIGdlbmVyYXRlZCBjb2RlXG4gICAqIEBwYXJhbSBhU291cmNlTWFwQ29uc3VtZXIgVGhlIFNvdXJjZU1hcCBmb3IgdGhlIGdlbmVyYXRlZCBjb2RlXG4gICAqIEBwYXJhbSBhUmVsYXRpdmVQYXRoIE9wdGlvbmFsLiBUaGUgcGF0aCB0aGF0IHJlbGF0aXZlIHNvdXJjZXMgaW4gdGhlXG4gICAqICAgICAgICBTb3VyY2VNYXBDb25zdW1lciBzaG91bGQgYmUgcmVsYXRpdmUgdG8uXG4gICAqL1xuICBTb3VyY2VOb2RlLmZyb21TdHJpbmdXaXRoU291cmNlTWFwID1cbiAgICBmdW5jdGlvbiBTb3VyY2VOb2RlX2Zyb21TdHJpbmdXaXRoU291cmNlTWFwKGFHZW5lcmF0ZWRDb2RlLCBhU291cmNlTWFwQ29uc3VtZXIsIGFSZWxhdGl2ZVBhdGgpIHtcbiAgICAgIC8vIFRoZSBTb3VyY2VOb2RlIHdlIHdhbnQgdG8gZmlsbCB3aXRoIHRoZSBnZW5lcmF0ZWQgY29kZVxuICAgICAgLy8gYW5kIHRoZSBTb3VyY2VNYXBcbiAgICAgIHZhciBub2RlID0gbmV3IFNvdXJjZU5vZGUoKTtcblxuICAgICAgLy8gQWxsIGV2ZW4gaW5kaWNlcyBvZiB0aGlzIGFycmF5IGFyZSBvbmUgbGluZSBvZiB0aGUgZ2VuZXJhdGVkIGNvZGUsXG4gICAgICAvLyB3aGlsZSBhbGwgb2RkIGluZGljZXMgYXJlIHRoZSBuZXdsaW5lcyBiZXR3ZWVuIHR3byBhZGphY2VudCBsaW5lc1xuICAgICAgLy8gKHNpbmNlIGBSRUdFWF9ORVdMSU5FYCBjYXB0dXJlcyBpdHMgbWF0Y2gpLlxuICAgICAgLy8gUHJvY2Vzc2VkIGZyYWdtZW50cyBhcmUgcmVtb3ZlZCBmcm9tIHRoaXMgYXJyYXksIGJ5IGNhbGxpbmcgYHNoaWZ0TmV4dExpbmVgLlxuICAgICAgdmFyIHJlbWFpbmluZ0xpbmVzID0gYUdlbmVyYXRlZENvZGUuc3BsaXQoUkVHRVhfTkVXTElORSk7XG4gICAgICB2YXIgc2hpZnROZXh0TGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbGluZUNvbnRlbnRzID0gcmVtYWluaW5nTGluZXMuc2hpZnQoKTtcbiAgICAgICAgLy8gVGhlIGxhc3QgbGluZSBvZiBhIGZpbGUgbWlnaHQgbm90IGhhdmUgYSBuZXdsaW5lLlxuICAgICAgICB2YXIgbmV3TGluZSA9IHJlbWFpbmluZ0xpbmVzLnNoaWZ0KCkgfHwgXCJcIjtcbiAgICAgICAgcmV0dXJuIGxpbmVDb250ZW50cyArIG5ld0xpbmU7XG4gICAgICB9O1xuXG4gICAgICAvLyBXZSBuZWVkIHRvIHJlbWVtYmVyIHRoZSBwb3NpdGlvbiBvZiBcInJlbWFpbmluZ0xpbmVzXCJcbiAgICAgIHZhciBsYXN0R2VuZXJhdGVkTGluZSA9IDEsIGxhc3RHZW5lcmF0ZWRDb2x1bW4gPSAwO1xuXG4gICAgICAvLyBUaGUgZ2VuZXJhdGUgU291cmNlTm9kZXMgd2UgbmVlZCBhIGNvZGUgcmFuZ2UuXG4gICAgICAvLyBUbyBleHRyYWN0IGl0IGN1cnJlbnQgYW5kIGxhc3QgbWFwcGluZyBpcyB1c2VkLlxuICAgICAgLy8gSGVyZSB3ZSBzdG9yZSB0aGUgbGFzdCBtYXBwaW5nLlxuICAgICAgdmFyIGxhc3RNYXBwaW5nID0gbnVsbDtcblxuICAgICAgYVNvdXJjZU1hcENvbnN1bWVyLmVhY2hNYXBwaW5nKGZ1bmN0aW9uIChtYXBwaW5nKSB7XG4gICAgICAgIGlmIChsYXN0TWFwcGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgIC8vIFdlIGFkZCB0aGUgY29kZSBmcm9tIFwibGFzdE1hcHBpbmdcIiB0byBcIm1hcHBpbmdcIjpcbiAgICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGVyZSBpcyBhIG5ldyBsaW5lIGluIGJldHdlZW4uXG4gICAgICAgICAgaWYgKGxhc3RHZW5lcmF0ZWRMaW5lIDwgbWFwcGluZy5nZW5lcmF0ZWRMaW5lKSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IFwiXCI7XG4gICAgICAgICAgICAvLyBBc3NvY2lhdGUgZmlyc3QgbGluZSB3aXRoIFwibGFzdE1hcHBpbmdcIlxuICAgICAgICAgICAgYWRkTWFwcGluZ1dpdGhDb2RlKGxhc3RNYXBwaW5nLCBzaGlmdE5leHRMaW5lKCkpO1xuICAgICAgICAgICAgbGFzdEdlbmVyYXRlZExpbmUrKztcbiAgICAgICAgICAgIGxhc3RHZW5lcmF0ZWRDb2x1bW4gPSAwO1xuICAgICAgICAgICAgLy8gVGhlIHJlbWFpbmluZyBjb2RlIGlzIGFkZGVkIHdpdGhvdXQgbWFwcGluZ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBuZXcgbGluZSBpbiBiZXR3ZWVuLlxuICAgICAgICAgICAgLy8gQXNzb2NpYXRlIHRoZSBjb2RlIGJldHdlZW4gXCJsYXN0R2VuZXJhdGVkQ29sdW1uXCIgYW5kXG4gICAgICAgICAgICAvLyBcIm1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uXCIgd2l0aCBcImxhc3RNYXBwaW5nXCJcbiAgICAgICAgICAgIHZhciBuZXh0TGluZSA9IHJlbWFpbmluZ0xpbmVzWzBdO1xuICAgICAgICAgICAgdmFyIGNvZGUgPSBuZXh0TGluZS5zdWJzdHIoMCwgbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4gLVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEdlbmVyYXRlZENvbHVtbik7XG4gICAgICAgICAgICByZW1haW5pbmdMaW5lc1swXSA9IG5leHRMaW5lLnN1YnN0cihtYXBwaW5nLmdlbmVyYXRlZENvbHVtbiAtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0R2VuZXJhdGVkQ29sdW1uKTtcbiAgICAgICAgICAgIGxhc3RHZW5lcmF0ZWRDb2x1bW4gPSBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbjtcbiAgICAgICAgICAgIGFkZE1hcHBpbmdXaXRoQ29kZShsYXN0TWFwcGluZywgY29kZSk7XG4gICAgICAgICAgICAvLyBObyBtb3JlIHJlbWFpbmluZyBjb2RlLCBjb250aW51ZVxuICAgICAgICAgICAgbGFzdE1hcHBpbmcgPSBtYXBwaW5nO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBXZSBhZGQgdGhlIGdlbmVyYXRlZCBjb2RlIHVudGlsIHRoZSBmaXJzdCBtYXBwaW5nXG4gICAgICAgIC8vIHRvIHRoZSBTb3VyY2VOb2RlIHdpdGhvdXQgYW55IG1hcHBpbmcuXG4gICAgICAgIC8vIEVhY2ggbGluZSBpcyBhZGRlZCBhcyBzZXBhcmF0ZSBzdHJpbmcuXG4gICAgICAgIHdoaWxlIChsYXN0R2VuZXJhdGVkTGluZSA8IG1hcHBpbmcuZ2VuZXJhdGVkTGluZSkge1xuICAgICAgICAgIG5vZGUuYWRkKHNoaWZ0TmV4dExpbmUoKSk7XG4gICAgICAgICAgbGFzdEdlbmVyYXRlZExpbmUrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGFzdEdlbmVyYXRlZENvbHVtbiA8IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uKSB7XG4gICAgICAgICAgdmFyIG5leHRMaW5lID0gcmVtYWluaW5nTGluZXNbMF07XG4gICAgICAgICAgbm9kZS5hZGQobmV4dExpbmUuc3Vic3RyKDAsIG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uKSk7XG4gICAgICAgICAgcmVtYWluaW5nTGluZXNbMF0gPSBuZXh0TGluZS5zdWJzdHIobWFwcGluZy5nZW5lcmF0ZWRDb2x1bW4pO1xuICAgICAgICAgIGxhc3RHZW5lcmF0ZWRDb2x1bW4gPSBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0TWFwcGluZyA9IG1hcHBpbmc7XG4gICAgICB9LCB0aGlzKTtcbiAgICAgIC8vIFdlIGhhdmUgcHJvY2Vzc2VkIGFsbCBtYXBwaW5ncy5cbiAgICAgIGlmIChyZW1haW5pbmdMaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChsYXN0TWFwcGluZykge1xuICAgICAgICAgIC8vIEFzc29jaWF0ZSB0aGUgcmVtYWluaW5nIGNvZGUgaW4gdGhlIGN1cnJlbnQgbGluZSB3aXRoIFwibGFzdE1hcHBpbmdcIlxuICAgICAgICAgIGFkZE1hcHBpbmdXaXRoQ29kZShsYXN0TWFwcGluZywgc2hpZnROZXh0TGluZSgpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhbmQgYWRkIHRoZSByZW1haW5pbmcgbGluZXMgd2l0aG91dCBhbnkgbWFwcGluZ1xuICAgICAgICBub2RlLmFkZChyZW1haW5pbmdMaW5lcy5qb2luKFwiXCIpKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29weSBzb3VyY2VzQ29udGVudCBpbnRvIFNvdXJjZU5vZGVcbiAgICAgIGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKHNvdXJjZUZpbGUpIHtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBhU291cmNlTWFwQ29uc3VtZXIuc291cmNlQ29udGVudEZvcihzb3VyY2VGaWxlKTtcbiAgICAgICAgaWYgKGNvbnRlbnQgIT0gbnVsbCkge1xuICAgICAgICAgIGlmIChhUmVsYXRpdmVQYXRoICE9IG51bGwpIHtcbiAgICAgICAgICAgIHNvdXJjZUZpbGUgPSB1dGlsLmpvaW4oYVJlbGF0aXZlUGF0aCwgc291cmNlRmlsZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGUuc2V0U291cmNlQ29udGVudChzb3VyY2VGaWxlLCBjb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBub2RlO1xuXG4gICAgICBmdW5jdGlvbiBhZGRNYXBwaW5nV2l0aENvZGUobWFwcGluZywgY29kZSkge1xuICAgICAgICBpZiAobWFwcGluZyA9PT0gbnVsbCB8fCBtYXBwaW5nLnNvdXJjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbm9kZS5hZGQoY29kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IGFSZWxhdGl2ZVBhdGhcbiAgICAgICAgICAgID8gdXRpbC5qb2luKGFSZWxhdGl2ZVBhdGgsIG1hcHBpbmcuc291cmNlKVxuICAgICAgICAgICAgOiBtYXBwaW5nLnNvdXJjZTtcbiAgICAgICAgICBub2RlLmFkZChuZXcgU291cmNlTm9kZShtYXBwaW5nLm9yaWdpbmFsTGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcHBpbmcubmFtZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAvKipcbiAgICogQWRkIGEgY2h1bmsgb2YgZ2VuZXJhdGVkIEpTIHRvIHRoaXMgc291cmNlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBhQ2h1bmsgQSBzdHJpbmcgc25pcHBldCBvZiBnZW5lcmF0ZWQgSlMgY29kZSwgYW5vdGhlciBpbnN0YW5jZSBvZlxuICAgKiAgICAgICAgU291cmNlTm9kZSwgb3IgYW4gYXJyYXkgd2hlcmUgZWFjaCBtZW1iZXIgaXMgb25lIG9mIHRob3NlIHRoaW5ncy5cbiAgICovXG4gIFNvdXJjZU5vZGUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIFNvdXJjZU5vZGVfYWRkKGFDaHVuaykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFDaHVuaykpIHtcbiAgICAgIGFDaHVuay5mb3JFYWNoKGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICB0aGlzLmFkZChjaHVuayk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYUNodW5rW2lzU291cmNlTm9kZV0gfHwgdHlwZW9mIGFDaHVuayA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgaWYgKGFDaHVuaykge1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goYUNodW5rKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBcIkV4cGVjdGVkIGEgU291cmNlTm9kZSwgc3RyaW5nLCBvciBhbiBhcnJheSBvZiBTb3VyY2VOb2RlcyBhbmQgc3RyaW5ncy4gR290IFwiICsgYUNodW5rXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQWRkIGEgY2h1bmsgb2YgZ2VuZXJhdGVkIEpTIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhpcyBzb3VyY2Ugbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIGFDaHVuayBBIHN0cmluZyBzbmlwcGV0IG9mIGdlbmVyYXRlZCBKUyBjb2RlLCBhbm90aGVyIGluc3RhbmNlIG9mXG4gICAqICAgICAgICBTb3VyY2VOb2RlLCBvciBhbiBhcnJheSB3aGVyZSBlYWNoIG1lbWJlciBpcyBvbmUgb2YgdGhvc2UgdGhpbmdzLlxuICAgKi9cbiAgU291cmNlTm9kZS5wcm90b3R5cGUucHJlcGVuZCA9IGZ1bmN0aW9uIFNvdXJjZU5vZGVfcHJlcGVuZChhQ2h1bmspIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhQ2h1bmspKSB7XG4gICAgICBmb3IgKHZhciBpID0gYUNodW5rLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xuICAgICAgICB0aGlzLnByZXBlbmQoYUNodW5rW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoYUNodW5rW2lzU291cmNlTm9kZV0gfHwgdHlwZW9mIGFDaHVuayA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5jaGlsZHJlbi51bnNoaWZ0KGFDaHVuayk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgXCJFeHBlY3RlZCBhIFNvdXJjZU5vZGUsIHN0cmluZywgb3IgYW4gYXJyYXkgb2YgU291cmNlTm9kZXMgYW5kIHN0cmluZ3MuIEdvdCBcIiArIGFDaHVua1xuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFdhbGsgb3ZlciB0aGUgdHJlZSBvZiBKUyBzbmlwcGV0cyBpbiB0aGlzIG5vZGUgYW5kIGl0cyBjaGlsZHJlbi4gVGhlXG4gICAqIHdhbGtpbmcgZnVuY3Rpb24gaXMgY2FsbGVkIG9uY2UgZm9yIGVhY2ggc25pcHBldCBvZiBKUyBhbmQgaXMgcGFzc2VkIHRoYXRcbiAgICogc25pcHBldCBhbmQgdGhlIGl0cyBvcmlnaW5hbCBhc3NvY2lhdGVkIHNvdXJjZSdzIGxpbmUvY29sdW1uIGxvY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gYUZuIFRoZSB0cmF2ZXJzYWwgZnVuY3Rpb24uXG4gICAqL1xuICBTb3VyY2VOb2RlLnByb3RvdHlwZS53YWxrID0gZnVuY3Rpb24gU291cmNlTm9kZV93YWxrKGFGbikge1xuICAgIHZhciBjaHVuaztcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgY2h1bmsgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGNodW5rW2lzU291cmNlTm9kZV0pIHtcbiAgICAgICAgY2h1bmsud2FsayhhRm4pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmIChjaHVuayAhPT0gJycpIHtcbiAgICAgICAgICBhRm4oY2h1bmssIHsgc291cmNlOiB0aGlzLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgbGluZTogdGhpcy5saW5lLFxuICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IHRoaXMuY29sdW1uLFxuICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIExpa2UgYFN0cmluZy5wcm90b3R5cGUuam9pbmAgZXhjZXB0IGZvciBTb3VyY2VOb2Rlcy4gSW5zZXJ0cyBgYVN0cmAgYmV0d2VlblxuICAgKiBlYWNoIG9mIGB0aGlzLmNoaWxkcmVuYC5cbiAgICpcbiAgICogQHBhcmFtIGFTZXAgVGhlIHNlcGFyYXRvci5cbiAgICovXG4gIFNvdXJjZU5vZGUucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiBTb3VyY2VOb2RlX2pvaW4oYVNlcCkge1xuICAgIHZhciBuZXdDaGlsZHJlbjtcbiAgICB2YXIgaTtcbiAgICB2YXIgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7XG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgIG5ld0NoaWxkcmVuID0gW107XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuLTE7IGkrKykge1xuICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKHRoaXMuY2hpbGRyZW5baV0pO1xuICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGFTZXApO1xuICAgICAgfVxuICAgICAgbmV3Q2hpbGRyZW4ucHVzaCh0aGlzLmNoaWxkcmVuW2ldKTtcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSBuZXdDaGlsZHJlbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGwgU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlIG9uIHRoZSB2ZXJ5IHJpZ2h0LW1vc3Qgc291cmNlIHNuaXBwZXQuIFVzZWZ1bFxuICAgKiBmb3IgdHJpbW1pbmcgd2hpdGVzcGFjZSBmcm9tIHRoZSBlbmQgb2YgYSBzb3VyY2Ugbm9kZSwgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0gYVBhdHRlcm4gVGhlIHBhdHRlcm4gdG8gcmVwbGFjZS5cbiAgICogQHBhcmFtIGFSZXBsYWNlbWVudCBUaGUgdGhpbmcgdG8gcmVwbGFjZSB0aGUgcGF0dGVybiB3aXRoLlxuICAgKi9cbiAgU291cmNlTm9kZS5wcm90b3R5cGUucmVwbGFjZVJpZ2h0ID0gZnVuY3Rpb24gU291cmNlTm9kZV9yZXBsYWNlUmlnaHQoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCkge1xuICAgIHZhciBsYXN0Q2hpbGQgPSB0aGlzLmNoaWxkcmVuW3RoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMV07XG4gICAgaWYgKGxhc3RDaGlsZFtpc1NvdXJjZU5vZGVdKSB7XG4gICAgICBsYXN0Q2hpbGQucmVwbGFjZVJpZ2h0KGFQYXR0ZXJuLCBhUmVwbGFjZW1lbnQpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgbGFzdENoaWxkID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5jaGlsZHJlblt0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDFdID0gbGFzdENoaWxkLnJlcGxhY2UoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKCcnLnJlcGxhY2UoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogU2V0IHRoZSBzb3VyY2UgY29udGVudCBmb3IgYSBzb3VyY2UgZmlsZS4gVGhpcyB3aWxsIGJlIGFkZGVkIHRvIHRoZSBTb3VyY2VNYXBHZW5lcmF0b3JcbiAgICogaW4gdGhlIHNvdXJjZXNDb250ZW50IGZpZWxkLlxuICAgKlxuICAgKiBAcGFyYW0gYVNvdXJjZUZpbGUgVGhlIGZpbGVuYW1lIG9mIHRoZSBzb3VyY2UgZmlsZVxuICAgKiBAcGFyYW0gYVNvdXJjZUNvbnRlbnQgVGhlIGNvbnRlbnQgb2YgdGhlIHNvdXJjZSBmaWxlXG4gICAqL1xuICBTb3VyY2VOb2RlLnByb3RvdHlwZS5zZXRTb3VyY2VDb250ZW50ID1cbiAgICBmdW5jdGlvbiBTb3VyY2VOb2RlX3NldFNvdXJjZUNvbnRlbnQoYVNvdXJjZUZpbGUsIGFTb3VyY2VDb250ZW50KSB7XG4gICAgICB0aGlzLnNvdXJjZUNvbnRlbnRzW3V0aWwudG9TZXRTdHJpbmcoYVNvdXJjZUZpbGUpXSA9IGFTb3VyY2VDb250ZW50O1xuICAgIH07XG5cbiAgLyoqXG4gICAqIFdhbGsgb3ZlciB0aGUgdHJlZSBvZiBTb3VyY2VOb2Rlcy4gVGhlIHdhbGtpbmcgZnVuY3Rpb24gaXMgY2FsbGVkIGZvciBlYWNoXG4gICAqIHNvdXJjZSBmaWxlIGNvbnRlbnQgYW5kIGlzIHBhc3NlZCB0aGUgZmlsZW5hbWUgYW5kIHNvdXJjZSBjb250ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gYUZuIFRoZSB0cmF2ZXJzYWwgZnVuY3Rpb24uXG4gICAqL1xuICBTb3VyY2VOb2RlLnByb3RvdHlwZS53YWxrU291cmNlQ29udGVudHMgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU5vZGVfd2Fsa1NvdXJjZUNvbnRlbnRzKGFGbikge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW5baV1baXNTb3VyY2VOb2RlXSkge1xuICAgICAgICAgIHRoaXMuY2hpbGRyZW5baV0ud2Fsa1NvdXJjZUNvbnRlbnRzKGFGbik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHNvdXJjZXMgPSBPYmplY3Qua2V5cyh0aGlzLnNvdXJjZUNvbnRlbnRzKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBzb3VyY2VzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGFGbih1dGlsLmZyb21TZXRTdHJpbmcoc291cmNlc1tpXSksIHRoaXMuc291cmNlQ29udGVudHNbc291cmNlc1tpXV0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgc291cmNlIG5vZGUuIFdhbGtzIG92ZXIgdGhlIHRyZWVcbiAgICogYW5kIGNvbmNhdGVuYXRlcyBhbGwgdGhlIHZhcmlvdXMgc25pcHBldHMgdG9nZXRoZXIgdG8gb25lIHN0cmluZy5cbiAgICovXG4gIFNvdXJjZU5vZGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gU291cmNlTm9kZV90b1N0cmluZygpIHtcbiAgICB2YXIgc3RyID0gXCJcIjtcbiAgICB0aGlzLndhbGsoZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgICBzdHIgKz0gY2h1bms7XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgc291cmNlIG5vZGUgYWxvbmcgd2l0aCBhIHNvdXJjZVxuICAgKiBtYXAuXG4gICAqL1xuICBTb3VyY2VOb2RlLnByb3RvdHlwZS50b1N0cmluZ1dpdGhTb3VyY2VNYXAgPSBmdW5jdGlvbiBTb3VyY2VOb2RlX3RvU3RyaW5nV2l0aFNvdXJjZU1hcChhQXJncykge1xuICAgIHZhciBnZW5lcmF0ZWQgPSB7XG4gICAgICBjb2RlOiBcIlwiLFxuICAgICAgbGluZTogMSxcbiAgICAgIGNvbHVtbjogMFxuICAgIH07XG4gICAgdmFyIG1hcCA9IG5ldyBTb3VyY2VNYXBHZW5lcmF0b3IoYUFyZ3MpO1xuICAgIHZhciBzb3VyY2VNYXBwaW5nQWN0aXZlID0gZmFsc2U7XG4gICAgdmFyIGxhc3RPcmlnaW5hbFNvdXJjZSA9IG51bGw7XG4gICAgdmFyIGxhc3RPcmlnaW5hbExpbmUgPSBudWxsO1xuICAgIHZhciBsYXN0T3JpZ2luYWxDb2x1bW4gPSBudWxsO1xuICAgIHZhciBsYXN0T3JpZ2luYWxOYW1lID0gbnVsbDtcbiAgICB0aGlzLndhbGsoZnVuY3Rpb24gKGNodW5rLCBvcmlnaW5hbCkge1xuICAgICAgZ2VuZXJhdGVkLmNvZGUgKz0gY2h1bms7XG4gICAgICBpZiAob3JpZ2luYWwuc291cmNlICE9PSBudWxsXG4gICAgICAgICAgJiYgb3JpZ2luYWwubGluZSAhPT0gbnVsbFxuICAgICAgICAgICYmIG9yaWdpbmFsLmNvbHVtbiAhPT0gbnVsbCkge1xuICAgICAgICBpZihsYXN0T3JpZ2luYWxTb3VyY2UgIT09IG9yaWdpbmFsLnNvdXJjZVxuICAgICAgICAgICB8fCBsYXN0T3JpZ2luYWxMaW5lICE9PSBvcmlnaW5hbC5saW5lXG4gICAgICAgICAgIHx8IGxhc3RPcmlnaW5hbENvbHVtbiAhPT0gb3JpZ2luYWwuY29sdW1uXG4gICAgICAgICAgIHx8IGxhc3RPcmlnaW5hbE5hbWUgIT09IG9yaWdpbmFsLm5hbWUpIHtcbiAgICAgICAgICBtYXAuYWRkTWFwcGluZyh7XG4gICAgICAgICAgICBzb3VyY2U6IG9yaWdpbmFsLnNvdXJjZSxcbiAgICAgICAgICAgIG9yaWdpbmFsOiB7XG4gICAgICAgICAgICAgIGxpbmU6IG9yaWdpbmFsLmxpbmUsXG4gICAgICAgICAgICAgIGNvbHVtbjogb3JpZ2luYWwuY29sdW1uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgICAgICAgIGxpbmU6IGdlbmVyYXRlZC5saW5lLFxuICAgICAgICAgICAgICBjb2x1bW46IGdlbmVyYXRlZC5jb2x1bW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYW1lOiBvcmlnaW5hbC5uYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdE9yaWdpbmFsU291cmNlID0gb3JpZ2luYWwuc291cmNlO1xuICAgICAgICBsYXN0T3JpZ2luYWxMaW5lID0gb3JpZ2luYWwubGluZTtcbiAgICAgICAgbGFzdE9yaWdpbmFsQ29sdW1uID0gb3JpZ2luYWwuY29sdW1uO1xuICAgICAgICBsYXN0T3JpZ2luYWxOYW1lID0gb3JpZ2luYWwubmFtZTtcbiAgICAgICAgc291cmNlTWFwcGluZ0FjdGl2ZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHNvdXJjZU1hcHBpbmdBY3RpdmUpIHtcbiAgICAgICAgbWFwLmFkZE1hcHBpbmcoe1xuICAgICAgICAgIGdlbmVyYXRlZDoge1xuICAgICAgICAgICAgbGluZTogZ2VuZXJhdGVkLmxpbmUsXG4gICAgICAgICAgICBjb2x1bW46IGdlbmVyYXRlZC5jb2x1bW5cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBsYXN0T3JpZ2luYWxTb3VyY2UgPSBudWxsO1xuICAgICAgICBzb3VyY2VNYXBwaW5nQWN0aXZlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpZHggPSAwLCBsZW5ndGggPSBjaHVuay5sZW5ndGg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgaWYgKGNodW5rLmNoYXJDb2RlQXQoaWR4KSA9PT0gTkVXTElORV9DT0RFKSB7XG4gICAgICAgICAgZ2VuZXJhdGVkLmxpbmUrKztcbiAgICAgICAgICBnZW5lcmF0ZWQuY29sdW1uID0gMDtcbiAgICAgICAgICAvLyBNYXBwaW5ncyBlbmQgYXQgZW9sXG4gICAgICAgICAgaWYgKGlkeCArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgICAgbGFzdE9yaWdpbmFsU291cmNlID0gbnVsbDtcbiAgICAgICAgICAgIHNvdXJjZU1hcHBpbmdBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZU1hcHBpbmdBY3RpdmUpIHtcbiAgICAgICAgICAgIG1hcC5hZGRNYXBwaW5nKHtcbiAgICAgICAgICAgICAgc291cmNlOiBvcmlnaW5hbC5zb3VyY2UsXG4gICAgICAgICAgICAgIG9yaWdpbmFsOiB7XG4gICAgICAgICAgICAgICAgbGluZTogb3JpZ2luYWwubGluZSxcbiAgICAgICAgICAgICAgICBjb2x1bW46IG9yaWdpbmFsLmNvbHVtblxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBnZW5lcmF0ZWQ6IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBnZW5lcmF0ZWQubGluZSxcbiAgICAgICAgICAgICAgICBjb2x1bW46IGdlbmVyYXRlZC5jb2x1bW5cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbmFtZTogb3JpZ2luYWwubmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdlbmVyYXRlZC5jb2x1bW4rKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMud2Fsa1NvdXJjZUNvbnRlbnRzKGZ1bmN0aW9uIChzb3VyY2VGaWxlLCBzb3VyY2VDb250ZW50KSB7XG4gICAgICBtYXAuc2V0U291cmNlQ29udGVudChzb3VyY2VGaWxlLCBzb3VyY2VDb250ZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7IGNvZGU6IGdlbmVyYXRlZC5jb2RlLCBtYXA6IG1hcCB9O1xuICB9O1xuXG4gIGV4cG9ydHMuU291cmNlTm9kZSA9IFNvdXJjZU5vZGU7XG5cbn0pO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICAvKipcbiAgICogVGhpcyBpcyBhIGhlbHBlciBmdW5jdGlvbiBmb3IgZ2V0dGluZyB2YWx1ZXMgZnJvbSBwYXJhbWV0ZXIvb3B0aW9uc1xuICAgKiBvYmplY3RzLlxuICAgKlxuICAgKiBAcGFyYW0gYXJncyBUaGUgb2JqZWN0IHdlIGFyZSBleHRyYWN0aW5nIHZhbHVlcyBmcm9tXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB3ZSBhcmUgZ2V0dGluZy5cbiAgICogQHBhcmFtIGRlZmF1bHRWYWx1ZSBBbiBvcHRpb25hbCB2YWx1ZSB0byByZXR1cm4gaWYgdGhlIHByb3BlcnR5IGlzIG1pc3NpbmdcbiAgICogZnJvbSB0aGUgb2JqZWN0LiBJZiB0aGlzIGlzIG5vdCBzcGVjaWZpZWQgYW5kIHRoZSBwcm9wZXJ0eSBpcyBtaXNzaW5nLCBhblxuICAgKiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAgICovXG4gIGZ1bmN0aW9uIGdldEFyZyhhQXJncywgYU5hbWUsIGFEZWZhdWx0VmFsdWUpIHtcbiAgICBpZiAoYU5hbWUgaW4gYUFyZ3MpIHtcbiAgICAgIHJldHVybiBhQXJnc1thTmFtZV07XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICByZXR1cm4gYURlZmF1bHRWYWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBhTmFtZSArICdcIiBpcyBhIHJlcXVpcmVkIGFyZ3VtZW50LicpO1xuICAgIH1cbiAgfVxuICBleHBvcnRzLmdldEFyZyA9IGdldEFyZztcblxuICB2YXIgdXJsUmVnZXhwID0gL14oPzooW1xcdytcXC0uXSspOik/XFwvXFwvKD86KFxcdys6XFx3KylAKT8oW1xcdy5dKikoPzo6KFxcZCspKT8oXFxTKikkLztcbiAgdmFyIGRhdGFVcmxSZWdleHAgPSAvXmRhdGE6LitcXCwuKyQvO1xuXG4gIGZ1bmN0aW9uIHVybFBhcnNlKGFVcmwpIHtcbiAgICB2YXIgbWF0Y2ggPSBhVXJsLm1hdGNoKHVybFJlZ2V4cCk7XG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBzY2hlbWU6IG1hdGNoWzFdLFxuICAgICAgYXV0aDogbWF0Y2hbMl0sXG4gICAgICBob3N0OiBtYXRjaFszXSxcbiAgICAgIHBvcnQ6IG1hdGNoWzRdLFxuICAgICAgcGF0aDogbWF0Y2hbNV1cbiAgICB9O1xuICB9XG4gIGV4cG9ydHMudXJsUGFyc2UgPSB1cmxQYXJzZTtcblxuICBmdW5jdGlvbiB1cmxHZW5lcmF0ZShhUGFyc2VkVXJsKSB7XG4gICAgdmFyIHVybCA9ICcnO1xuICAgIGlmIChhUGFyc2VkVXJsLnNjaGVtZSkge1xuICAgICAgdXJsICs9IGFQYXJzZWRVcmwuc2NoZW1lICsgJzonO1xuICAgIH1cbiAgICB1cmwgKz0gJy8vJztcbiAgICBpZiAoYVBhcnNlZFVybC5hdXRoKSB7XG4gICAgICB1cmwgKz0gYVBhcnNlZFVybC5hdXRoICsgJ0AnO1xuICAgIH1cbiAgICBpZiAoYVBhcnNlZFVybC5ob3N0KSB7XG4gICAgICB1cmwgKz0gYVBhcnNlZFVybC5ob3N0O1xuICAgIH1cbiAgICBpZiAoYVBhcnNlZFVybC5wb3J0KSB7XG4gICAgICB1cmwgKz0gXCI6XCIgKyBhUGFyc2VkVXJsLnBvcnRcbiAgICB9XG4gICAgaWYgKGFQYXJzZWRVcmwucGF0aCkge1xuICAgICAgdXJsICs9IGFQYXJzZWRVcmwucGF0aDtcbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuICBleHBvcnRzLnVybEdlbmVyYXRlID0gdXJsR2VuZXJhdGU7XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZXMgYSBwYXRoLCBvciB0aGUgcGF0aCBwb3J0aW9uIG9mIGEgVVJMOlxuICAgKlxuICAgKiAtIFJlcGxhY2VzIGNvbnNlcXV0aXZlIHNsYXNoZXMgd2l0aCBvbmUgc2xhc2guXG4gICAqIC0gUmVtb3ZlcyB1bm5lY2Vzc2FyeSAnLicgcGFydHMuXG4gICAqIC0gUmVtb3ZlcyB1bm5lY2Vzc2FyeSAnPGRpcj4vLi4nIHBhcnRzLlxuICAgKlxuICAgKiBCYXNlZCBvbiBjb2RlIGluIHRoZSBOb2RlLmpzICdwYXRoJyBjb3JlIG1vZHVsZS5cbiAgICpcbiAgICogQHBhcmFtIGFQYXRoIFRoZSBwYXRoIG9yIHVybCB0byBub3JtYWxpemUuXG4gICAqL1xuICBmdW5jdGlvbiBub3JtYWxpemUoYVBhdGgpIHtcbiAgICB2YXIgcGF0aCA9IGFQYXRoO1xuICAgIHZhciB1cmwgPSB1cmxQYXJzZShhUGF0aCk7XG4gICAgaWYgKHVybCkge1xuICAgICAgaWYgKCF1cmwucGF0aCkge1xuICAgICAgICByZXR1cm4gYVBhdGg7XG4gICAgICB9XG4gICAgICBwYXRoID0gdXJsLnBhdGg7XG4gICAgfVxuICAgIHZhciBpc0Fic29sdXRlID0gKHBhdGguY2hhckF0KDApID09PSAnLycpO1xuXG4gICAgdmFyIHBhcnRzID0gcGF0aC5zcGxpdCgvXFwvKy8pO1xuICAgIGZvciAodmFyIHBhcnQsIHVwID0gMCwgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBwYXJ0ID0gcGFydHNbaV07XG4gICAgICBpZiAocGFydCA9PT0gJy4nKSB7XG4gICAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIH0gZWxzZSBpZiAocGFydCA9PT0gJy4uJykge1xuICAgICAgICB1cCsrO1xuICAgICAgfSBlbHNlIGlmICh1cCA+IDApIHtcbiAgICAgICAgaWYgKHBhcnQgPT09ICcnKSB7XG4gICAgICAgICAgLy8gVGhlIGZpcnN0IHBhcnQgaXMgYmxhbmsgaWYgdGhlIHBhdGggaXMgYWJzb2x1dGUuIFRyeWluZyB0byBnb1xuICAgICAgICAgIC8vIGFib3ZlIHRoZSByb290IGlzIGEgbm8tb3AuIFRoZXJlZm9yZSB3ZSBjYW4gcmVtb3ZlIGFsbCAnLi4nIHBhcnRzXG4gICAgICAgICAgLy8gZGlyZWN0bHkgYWZ0ZXIgdGhlIHJvb3QuXG4gICAgICAgICAgcGFydHMuc3BsaWNlKGkgKyAxLCB1cCk7XG4gICAgICAgICAgdXAgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcnRzLnNwbGljZShpLCAyKTtcbiAgICAgICAgICB1cC0tO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHBhdGggPSBwYXJ0cy5qb2luKCcvJyk7XG5cbiAgICBpZiAocGF0aCA9PT0gJycpIHtcbiAgICAgIHBhdGggPSBpc0Fic29sdXRlID8gJy8nIDogJy4nO1xuICAgIH1cblxuICAgIGlmICh1cmwpIHtcbiAgICAgIHVybC5wYXRoID0gcGF0aDtcbiAgICAgIHJldHVybiB1cmxHZW5lcmF0ZSh1cmwpO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuICBleHBvcnRzLm5vcm1hbGl6ZSA9IG5vcm1hbGl6ZTtcblxuICAvKipcbiAgICogSm9pbnMgdHdvIHBhdGhzL1VSTHMuXG4gICAqXG4gICAqIEBwYXJhbSBhUm9vdCBUaGUgcm9vdCBwYXRoIG9yIFVSTC5cbiAgICogQHBhcmFtIGFQYXRoIFRoZSBwYXRoIG9yIFVSTCB0byBiZSBqb2luZWQgd2l0aCB0aGUgcm9vdC5cbiAgICpcbiAgICogLSBJZiBhUGF0aCBpcyBhIFVSTCBvciBhIGRhdGEgVVJJLCBhUGF0aCBpcyByZXR1cm5lZCwgdW5sZXNzIGFQYXRoIGlzIGFcbiAgICogICBzY2hlbWUtcmVsYXRpdmUgVVJMOiBUaGVuIHRoZSBzY2hlbWUgb2YgYVJvb3QsIGlmIGFueSwgaXMgcHJlcGVuZGVkXG4gICAqICAgZmlyc3QuXG4gICAqIC0gT3RoZXJ3aXNlIGFQYXRoIGlzIGEgcGF0aC4gSWYgYVJvb3QgaXMgYSBVUkwsIHRoZW4gaXRzIHBhdGggcG9ydGlvblxuICAgKiAgIGlzIHVwZGF0ZWQgd2l0aCB0aGUgcmVzdWx0IGFuZCBhUm9vdCBpcyByZXR1cm5lZC4gT3RoZXJ3aXNlIHRoZSByZXN1bHRcbiAgICogICBpcyByZXR1cm5lZC5cbiAgICogICAtIElmIGFQYXRoIGlzIGFic29sdXRlLCB0aGUgcmVzdWx0IGlzIGFQYXRoLlxuICAgKiAgIC0gT3RoZXJ3aXNlIHRoZSB0d28gcGF0aHMgYXJlIGpvaW5lZCB3aXRoIGEgc2xhc2guXG4gICAqIC0gSm9pbmluZyBmb3IgZXhhbXBsZSAnaHR0cDovLycgYW5kICd3d3cuZXhhbXBsZS5jb20nIGlzIGFsc28gc3VwcG9ydGVkLlxuICAgKi9cbiAgZnVuY3Rpb24gam9pbihhUm9vdCwgYVBhdGgpIHtcbiAgICBpZiAoYVJvb3QgPT09IFwiXCIpIHtcbiAgICAgIGFSb290ID0gXCIuXCI7XG4gICAgfVxuICAgIGlmIChhUGF0aCA9PT0gXCJcIikge1xuICAgICAgYVBhdGggPSBcIi5cIjtcbiAgICB9XG4gICAgdmFyIGFQYXRoVXJsID0gdXJsUGFyc2UoYVBhdGgpO1xuICAgIHZhciBhUm9vdFVybCA9IHVybFBhcnNlKGFSb290KTtcbiAgICBpZiAoYVJvb3RVcmwpIHtcbiAgICAgIGFSb290ID0gYVJvb3RVcmwucGF0aCB8fCAnLyc7XG4gICAgfVxuXG4gICAgLy8gYGpvaW4oZm9vLCAnLy93d3cuZXhhbXBsZS5vcmcnKWBcbiAgICBpZiAoYVBhdGhVcmwgJiYgIWFQYXRoVXJsLnNjaGVtZSkge1xuICAgICAgaWYgKGFSb290VXJsKSB7XG4gICAgICAgIGFQYXRoVXJsLnNjaGVtZSA9IGFSb290VXJsLnNjaGVtZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1cmxHZW5lcmF0ZShhUGF0aFVybCk7XG4gICAgfVxuXG4gICAgaWYgKGFQYXRoVXJsIHx8IGFQYXRoLm1hdGNoKGRhdGFVcmxSZWdleHApKSB7XG4gICAgICByZXR1cm4gYVBhdGg7XG4gICAgfVxuXG4gICAgLy8gYGpvaW4oJ2h0dHA6Ly8nLCAnd3d3LmV4YW1wbGUuY29tJylgXG4gICAgaWYgKGFSb290VXJsICYmICFhUm9vdFVybC5ob3N0ICYmICFhUm9vdFVybC5wYXRoKSB7XG4gICAgICBhUm9vdFVybC5ob3N0ID0gYVBhdGg7XG4gICAgICByZXR1cm4gdXJsR2VuZXJhdGUoYVJvb3RVcmwpO1xuICAgIH1cblxuICAgIHZhciBqb2luZWQgPSBhUGF0aC5jaGFyQXQoMCkgPT09ICcvJ1xuICAgICAgPyBhUGF0aFxuICAgICAgOiBub3JtYWxpemUoYVJvb3QucmVwbGFjZSgvXFwvKyQvLCAnJykgKyAnLycgKyBhUGF0aCk7XG5cbiAgICBpZiAoYVJvb3RVcmwpIHtcbiAgICAgIGFSb290VXJsLnBhdGggPSBqb2luZWQ7XG4gICAgICByZXR1cm4gdXJsR2VuZXJhdGUoYVJvb3RVcmwpO1xuICAgIH1cbiAgICByZXR1cm4gam9pbmVkO1xuICB9XG4gIGV4cG9ydHMuam9pbiA9IGpvaW47XG5cbiAgLyoqXG4gICAqIE1ha2UgYSBwYXRoIHJlbGF0aXZlIHRvIGEgVVJMIG9yIGFub3RoZXIgcGF0aC5cbiAgICpcbiAgICogQHBhcmFtIGFSb290IFRoZSByb290IHBhdGggb3IgVVJMLlxuICAgKiBAcGFyYW0gYVBhdGggVGhlIHBhdGggb3IgVVJMIHRvIGJlIG1hZGUgcmVsYXRpdmUgdG8gYVJvb3QuXG4gICAqL1xuICBmdW5jdGlvbiByZWxhdGl2ZShhUm9vdCwgYVBhdGgpIHtcbiAgICBpZiAoYVJvb3QgPT09IFwiXCIpIHtcbiAgICAgIGFSb290ID0gXCIuXCI7XG4gICAgfVxuXG4gICAgYVJvb3QgPSBhUm9vdC5yZXBsYWNlKC9cXC8kLywgJycpO1xuXG4gICAgLy8gWFhYOiBJdCBpcyBwb3NzaWJsZSB0byByZW1vdmUgdGhpcyBibG9jaywgYW5kIHRoZSB0ZXN0cyBzdGlsbCBwYXNzIVxuICAgIHZhciB1cmwgPSB1cmxQYXJzZShhUm9vdCk7XG4gICAgaWYgKGFQYXRoLmNoYXJBdCgwKSA9PSBcIi9cIiAmJiB1cmwgJiYgdXJsLnBhdGggPT0gXCIvXCIpIHtcbiAgICAgIHJldHVybiBhUGF0aC5zbGljZSgxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYVBhdGguaW5kZXhPZihhUm9vdCArICcvJykgPT09IDBcbiAgICAgID8gYVBhdGguc3Vic3RyKGFSb290Lmxlbmd0aCArIDEpXG4gICAgICA6IGFQYXRoO1xuICB9XG4gIGV4cG9ydHMucmVsYXRpdmUgPSByZWxhdGl2ZTtcblxuICAvKipcbiAgICogQmVjYXVzZSBiZWhhdmlvciBnb2VzIHdhY2t5IHdoZW4geW91IHNldCBgX19wcm90b19fYCBvbiBvYmplY3RzLCB3ZVxuICAgKiBoYXZlIHRvIHByZWZpeCBhbGwgdGhlIHN0cmluZ3MgaW4gb3VyIHNldCB3aXRoIGFuIGFyYml0cmFyeSBjaGFyYWN0ZXIuXG4gICAqXG4gICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS9zb3VyY2UtbWFwL3B1bGwvMzEgYW5kXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3NvdXJjZS1tYXAvaXNzdWVzLzMwXG4gICAqXG4gICAqIEBwYXJhbSBTdHJpbmcgYVN0clxuICAgKi9cbiAgZnVuY3Rpb24gdG9TZXRTdHJpbmcoYVN0cikge1xuICAgIHJldHVybiAnJCcgKyBhU3RyO1xuICB9XG4gIGV4cG9ydHMudG9TZXRTdHJpbmcgPSB0b1NldFN0cmluZztcblxuICBmdW5jdGlvbiBmcm9tU2V0U3RyaW5nKGFTdHIpIHtcbiAgICByZXR1cm4gYVN0ci5zdWJzdHIoMSk7XG4gIH1cbiAgZXhwb3J0cy5mcm9tU2V0U3RyaW5nID0gZnJvbVNldFN0cmluZztcblxuICBmdW5jdGlvbiBzdHJjbXAoYVN0cjEsIGFTdHIyKSB7XG4gICAgdmFyIHMxID0gYVN0cjEgfHwgXCJcIjtcbiAgICB2YXIgczIgPSBhU3RyMiB8fCBcIlwiO1xuICAgIHJldHVybiAoczEgPiBzMikgLSAoczEgPCBzMik7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGFyYXRvciBiZXR3ZWVuIHR3byBtYXBwaW5ncyB3aGVyZSB0aGUgb3JpZ2luYWwgcG9zaXRpb25zIGFyZSBjb21wYXJlZC5cbiAgICpcbiAgICogT3B0aW9uYWxseSBwYXNzIGluIGB0cnVlYCBhcyBgb25seUNvbXBhcmVHZW5lcmF0ZWRgIHRvIGNvbnNpZGVyIHR3b1xuICAgKiBtYXBwaW5ncyB3aXRoIHRoZSBzYW1lIG9yaWdpbmFsIHNvdXJjZS9saW5lL2NvbHVtbiwgYnV0IGRpZmZlcmVudCBnZW5lcmF0ZWRcbiAgICogbGluZSBhbmQgY29sdW1uIHRoZSBzYW1lLiBVc2VmdWwgd2hlbiBzZWFyY2hpbmcgZm9yIGEgbWFwcGluZyB3aXRoIGFcbiAgICogc3R1YmJlZCBvdXQgbWFwcGluZy5cbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKG1hcHBpbmdBLCBtYXBwaW5nQiwgb25seUNvbXBhcmVPcmlnaW5hbCkge1xuICAgIHZhciBjbXA7XG5cbiAgICBjbXAgPSBzdHJjbXAobWFwcGluZ0Euc291cmNlLCBtYXBwaW5nQi5zb3VyY2UpO1xuICAgIGlmIChjbXApIHtcbiAgICAgIHJldHVybiBjbXA7XG4gICAgfVxuXG4gICAgY21wID0gbWFwcGluZ0Eub3JpZ2luYWxMaW5lIC0gbWFwcGluZ0Iub3JpZ2luYWxMaW5lO1xuICAgIGlmIChjbXApIHtcbiAgICAgIHJldHVybiBjbXA7XG4gICAgfVxuXG4gICAgY21wID0gbWFwcGluZ0Eub3JpZ2luYWxDb2x1bW4gLSBtYXBwaW5nQi5vcmlnaW5hbENvbHVtbjtcbiAgICBpZiAoY21wIHx8IG9ubHlDb21wYXJlT3JpZ2luYWwpIHtcbiAgICAgIHJldHVybiBjbXA7XG4gICAgfVxuXG4gICAgY21wID0gc3RyY21wKG1hcHBpbmdBLm5hbWUsIG1hcHBpbmdCLm5hbWUpO1xuICAgIGlmIChjbXApIHtcbiAgICAgIHJldHVybiBjbXA7XG4gICAgfVxuXG4gICAgY21wID0gbWFwcGluZ0EuZ2VuZXJhdGVkTGluZSAtIG1hcHBpbmdCLmdlbmVyYXRlZExpbmU7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICByZXR1cm4gbWFwcGluZ0EuZ2VuZXJhdGVkQ29sdW1uIC0gbWFwcGluZ0IuZ2VuZXJhdGVkQ29sdW1uO1xuICB9O1xuICBleHBvcnRzLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zID0gY29tcGFyZUJ5T3JpZ2luYWxQb3NpdGlvbnM7XG5cbiAgLyoqXG4gICAqIENvbXBhcmF0b3IgYmV0d2VlbiB0d28gbWFwcGluZ3Mgd2hlcmUgdGhlIGdlbmVyYXRlZCBwb3NpdGlvbnMgYXJlXG4gICAqIGNvbXBhcmVkLlxuICAgKlxuICAgKiBPcHRpb25hbGx5IHBhc3MgaW4gYHRydWVgIGFzIGBvbmx5Q29tcGFyZUdlbmVyYXRlZGAgdG8gY29uc2lkZXIgdHdvXG4gICAqIG1hcHBpbmdzIHdpdGggdGhlIHNhbWUgZ2VuZXJhdGVkIGxpbmUgYW5kIGNvbHVtbiwgYnV0IGRpZmZlcmVudFxuICAgKiBzb3VyY2UvbmFtZS9vcmlnaW5hbCBsaW5lIGFuZCBjb2x1bW4gdGhlIHNhbWUuIFVzZWZ1bCB3aGVuIHNlYXJjaGluZyBmb3IgYVxuICAgKiBtYXBwaW5nIHdpdGggYSBzdHViYmVkIG91dCBtYXBwaW5nLlxuICAgKi9cbiAgZnVuY3Rpb24gY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zKG1hcHBpbmdBLCBtYXBwaW5nQiwgb25seUNvbXBhcmVHZW5lcmF0ZWQpIHtcbiAgICB2YXIgY21wO1xuXG4gICAgY21wID0gbWFwcGluZ0EuZ2VuZXJhdGVkTGluZSAtIG1hcHBpbmdCLmdlbmVyYXRlZExpbmU7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBtYXBwaW5nQS5nZW5lcmF0ZWRDb2x1bW4gLSBtYXBwaW5nQi5nZW5lcmF0ZWRDb2x1bW47XG4gICAgaWYgKGNtcCB8fCBvbmx5Q29tcGFyZUdlbmVyYXRlZCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBzdHJjbXAobWFwcGluZ0Euc291cmNlLCBtYXBwaW5nQi5zb3VyY2UpO1xuICAgIGlmIChjbXApIHtcbiAgICAgIHJldHVybiBjbXA7XG4gICAgfVxuXG4gICAgY21wID0gbWFwcGluZ0Eub3JpZ2luYWxMaW5lIC0gbWFwcGluZ0Iub3JpZ2luYWxMaW5lO1xuICAgIGlmIChjbXApIHtcbiAgICAgIHJldHVybiBjbXA7XG4gICAgfVxuXG4gICAgY21wID0gbWFwcGluZ0Eub3JpZ2luYWxDb2x1bW4gLSBtYXBwaW5nQi5vcmlnaW5hbENvbHVtbjtcbiAgICBpZiAoY21wKSB7XG4gICAgICByZXR1cm4gY21wO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJjbXAobWFwcGluZ0EubmFtZSwgbWFwcGluZ0IubmFtZSk7XG4gIH07XG4gIGV4cG9ydHMuY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zID0gY29tcGFyZUJ5R2VuZXJhdGVkUG9zaXRpb25zO1xuXG59KTtcbiIsIi8qKiB2aW06IGV0OnRzPTQ6c3c9NDpzdHM9NFxuICogQGxpY2Vuc2UgYW1kZWZpbmUgMS4wLjAgQ29weXJpZ2h0IChjKSAyMDExLTIwMTUsIFRoZSBEb2pvIEZvdW5kYXRpb24gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIEF2YWlsYWJsZSB2aWEgdGhlIE1JVCBvciBuZXcgQlNEIGxpY2Vuc2UuXG4gKiBzZWU6IGh0dHA6Ly9naXRodWIuY29tL2pyYnVya2UvYW1kZWZpbmUgZm9yIGRldGFpbHNcbiAqL1xuXG4vKmpzbGludCBub2RlOiB0cnVlICovXG4vKmdsb2JhbCBtb2R1bGUsIHByb2Nlc3MgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVmaW5lIGZvciBub2RlLlxuICogQHBhcmFtIHtPYmplY3R9IG1vZHVsZSB0aGUgXCJtb2R1bGVcIiBvYmplY3QgdGhhdCBpcyBkZWZpbmVkIGJ5IE5vZGUgZm9yIHRoZVxuICogY3VycmVudCBtb2R1bGUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbcmVxdWlyZUZuXS4gTm9kZSdzIHJlcXVpcmUgZnVuY3Rpb24gZm9yIHRoZSBjdXJyZW50IG1vZHVsZS5cbiAqIEl0IG9ubHkgbmVlZHMgdG8gYmUgcGFzc2VkIGluIE5vZGUgdmVyc2lvbnMgYmVmb3JlIDAuNSwgd2hlbiBtb2R1bGUucmVxdWlyZVxuICogZGlkIG5vdCBleGlzdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gYSBkZWZpbmUgZnVuY3Rpb24gdGhhdCBpcyB1c2FibGUgZm9yIHRoZSBjdXJyZW50IG5vZGVcbiAqIG1vZHVsZS5cbiAqL1xuZnVuY3Rpb24gYW1kZWZpbmUobW9kdWxlLCByZXF1aXJlRm4pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGRlZmluZUNhY2hlID0ge30sXG4gICAgICAgIGxvYWRlckNhY2hlID0ge30sXG4gICAgICAgIGFscmVhZHlDYWxsZWQgPSBmYWxzZSxcbiAgICAgICAgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKSxcbiAgICAgICAgbWFrZVJlcXVpcmUsIHN0cmluZ1JlcXVpcmU7XG5cbiAgICAvKipcbiAgICAgKiBUcmltcyB0aGUgLiBhbmQgLi4gZnJvbSBhbiBhcnJheSBvZiBwYXRoIHNlZ21lbnRzLlxuICAgICAqIEl0IHdpbGwga2VlcCBhIGxlYWRpbmcgcGF0aCBzZWdtZW50IGlmIGEgLi4gd2lsbCBiZWNvbWVcbiAgICAgKiB0aGUgZmlyc3QgcGF0aCBzZWdtZW50LCB0byBoZWxwIHdpdGggbW9kdWxlIG5hbWUgbG9va3VwcyxcbiAgICAgKiB3aGljaCBhY3QgbGlrZSBwYXRocywgYnV0IGNhbiBiZSByZW1hcHBlZC4gQnV0IHRoZSBlbmQgcmVzdWx0LFxuICAgICAqIGFsbCBwYXRocyB0aGF0IHVzZSB0aGlzIGZ1bmN0aW9uIHNob3VsZCBsb29rIG5vcm1hbGl6ZWQuXG4gICAgICogTk9URTogdGhpcyBtZXRob2QgTU9ESUZJRVMgdGhlIGlucHV0IGFycmF5LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFyeSB0aGUgYXJyYXkgb2YgcGF0aCBzZWdtZW50cy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0cmltRG90cyhhcnkpIHtcbiAgICAgICAgdmFyIGksIHBhcnQ7XG4gICAgICAgIGZvciAoaSA9IDA7IGFyeVtpXTsgaSs9IDEpIHtcbiAgICAgICAgICAgIHBhcnQgPSBhcnlbaV07XG4gICAgICAgICAgICBpZiAocGFydCA9PT0gJy4nKSB7XG4gICAgICAgICAgICAgICAgYXJ5LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnQgPT09ICcuLicpIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMSAmJiAoYXJ5WzJdID09PSAnLi4nIHx8IGFyeVswXSA9PT0gJy4uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9FbmQgb2YgdGhlIGxpbmUuIEtlZXAgYXQgbGVhc3Qgb25lIG5vbi1kb3RcbiAgICAgICAgICAgICAgICAgICAgLy9wYXRoIHNlZ21lbnQgYXQgdGhlIGZyb250IHNvIGl0IGNhbiBiZSBtYXBwZWRcbiAgICAgICAgICAgICAgICAgICAgLy9jb3JyZWN0bHkgdG8gZGlzay4gT3RoZXJ3aXNlLCB0aGVyZSBpcyBsaWtlbHlcbiAgICAgICAgICAgICAgICAgICAgLy9ubyBwYXRoIG1hcHBpbmcgZm9yIGEgcGF0aCBzdGFydGluZyB3aXRoICcuLicuXG4gICAgICAgICAgICAgICAgICAgIC8vVGhpcyBjYW4gc3RpbGwgZmFpbCwgYnV0IGNhdGNoZXMgdGhlIG1vc3QgcmVhc29uYWJsZVxuICAgICAgICAgICAgICAgICAgICAvL3VzZXMgb2YgLi5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBhcnkuc3BsaWNlKGkgLSAxLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgaSAtPSAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lLCBiYXNlTmFtZSkge1xuICAgICAgICB2YXIgYmFzZVBhcnRzO1xuXG4gICAgICAgIC8vQWRqdXN0IGFueSByZWxhdGl2ZSBwYXRocy5cbiAgICAgICAgaWYgKG5hbWUgJiYgbmFtZS5jaGFyQXQoMCkgPT09ICcuJykge1xuICAgICAgICAgICAgLy9JZiBoYXZlIGEgYmFzZSBuYW1lLCB0cnkgdG8gbm9ybWFsaXplIGFnYWluc3QgaXQsXG4gICAgICAgICAgICAvL290aGVyd2lzZSwgYXNzdW1lIGl0IGlzIGEgdG9wLWxldmVsIHJlcXVpcmUgdGhhdCB3aWxsXG4gICAgICAgICAgICAvL2JlIHJlbGF0aXZlIHRvIGJhc2VVcmwgaW4gdGhlIGVuZC5cbiAgICAgICAgICAgIGlmIChiYXNlTmFtZSkge1xuICAgICAgICAgICAgICAgIGJhc2VQYXJ0cyA9IGJhc2VOYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgYmFzZVBhcnRzID0gYmFzZVBhcnRzLnNsaWNlKDAsIGJhc2VQYXJ0cy5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgICBiYXNlUGFydHMgPSBiYXNlUGFydHMuY29uY2F0KG5hbWUuc3BsaXQoJy8nKSk7XG4gICAgICAgICAgICAgICAgdHJpbURvdHMoYmFzZVBhcnRzKTtcbiAgICAgICAgICAgICAgICBuYW1lID0gYmFzZVBhcnRzLmpvaW4oJy8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgbm9ybWFsaXplKCkgZnVuY3Rpb24gcGFzc2VkIHRvIGEgbG9hZGVyIHBsdWdpbidzXG4gICAgICogbm9ybWFsaXplIG1ldGhvZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtYWtlTm9ybWFsaXplKHJlbE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplKG5hbWUsIHJlbE5hbWUpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VMb2FkKGlkKSB7XG4gICAgICAgIGZ1bmN0aW9uIGxvYWQodmFsdWUpIHtcbiAgICAgICAgICAgIGxvYWRlckNhY2hlW2lkXSA9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9hZC5mcm9tVGV4dCA9IGZ1bmN0aW9uIChpZCwgdGV4dCkge1xuICAgICAgICAgICAgLy9UaGlzIG9uZSBpcyBkaWZmaWN1bHQgYmVjYXVzZSB0aGUgdGV4dCBjYW4vcHJvYmFibHkgdXNlc1xuICAgICAgICAgICAgLy9kZWZpbmUsIGFuZCBhbnkgcmVsYXRpdmUgcGF0aHMgYW5kIHJlcXVpcmVzIHNob3VsZCBiZSByZWxhdGl2ZVxuICAgICAgICAgICAgLy90byB0aGF0IGlkIHdhcyBpdCB3b3VsZCBiZSBmb3VuZCBvbiBkaXNrLiBCdXQgdGhpcyB3b3VsZCByZXF1aXJlXG4gICAgICAgICAgICAvL2Jvb3RzdHJhcHBpbmcgYSBtb2R1bGUvcmVxdWlyZSBmYWlybHkgZGVlcGx5IGZyb20gbm9kZSBjb3JlLlxuICAgICAgICAgICAgLy9Ob3Qgc3VyZSBob3cgYmVzdCB0byBnbyBhYm91dCB0aGF0IHlldC5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYW1kZWZpbmUgZG9lcyBub3QgaW1wbGVtZW50IGxvYWQuZnJvbVRleHQnKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbG9hZDtcbiAgICB9XG5cbiAgICBtYWtlUmVxdWlyZSA9IGZ1bmN0aW9uIChzeXN0ZW1SZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUsIHJlbElkKSB7XG4gICAgICAgIGZ1bmN0aW9uIGFtZFJlcXVpcmUoZGVwcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVwcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvL1N5bmNocm9ub3VzLCBzaW5nbGUgbW9kdWxlIHJlcXVpcmUoJycpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cmluZ1JlcXVpcmUoc3lzdGVtUmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlLCBkZXBzLCByZWxJZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vQXJyYXkgb2YgZGVwZW5kZW5jaWVzIHdpdGggYSBjYWxsYmFjay5cblxuICAgICAgICAgICAgICAgIC8vQ29udmVydCB0aGUgZGVwZW5kZW5jaWVzIHRvIG1vZHVsZXMuXG4gICAgICAgICAgICAgICAgZGVwcyA9IGRlcHMubWFwKGZ1bmN0aW9uIChkZXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHJpbmdSZXF1aXJlKHN5c3RlbVJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSwgZGVwTmFtZSwgcmVsSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy9XYWl0IGZvciBuZXh0IHRpY2sgdG8gY2FsbCBiYWNrIHRoZSByZXF1aXJlIGNhbGwuXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgZGVwcyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFtZFJlcXVpcmUudG9VcmwgPSBmdW5jdGlvbiAoZmlsZVBhdGgpIHtcbiAgICAgICAgICAgIGlmIChmaWxlUGF0aC5pbmRleE9mKCcuJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplKGZpbGVQYXRoLCBwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlUGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYW1kUmVxdWlyZTtcbiAgICB9O1xuXG4gICAgLy9GYXZvciBleHBsaWNpdCB2YWx1ZSwgcGFzc2VkIGluIGlmIHRoZSBtb2R1bGUgd2FudHMgdG8gc3VwcG9ydCBOb2RlIDAuNC5cbiAgICByZXF1aXJlRm4gPSByZXF1aXJlRm4gfHwgZnVuY3Rpb24gcmVxKCkge1xuICAgICAgICByZXR1cm4gbW9kdWxlLnJlcXVpcmUuYXBwbHkobW9kdWxlLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBydW5GYWN0b3J5KGlkLCBkZXBzLCBmYWN0b3J5KSB7XG4gICAgICAgIHZhciByLCBlLCBtLCByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICBlID0gbG9hZGVyQ2FjaGVbaWRdID0ge307XG4gICAgICAgICAgICBtID0ge1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICB1cmk6IF9fZmlsZW5hbWUsXG4gICAgICAgICAgICAgICAgZXhwb3J0czogZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHIgPSBtYWtlUmVxdWlyZShyZXF1aXJlRm4sIGUsIG0sIGlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vT25seSBzdXBwb3J0IG9uZSBkZWZpbmUgY2FsbCBwZXIgZmlsZVxuICAgICAgICAgICAgaWYgKGFscmVhZHlDYWxsZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FtZGVmaW5lIHdpdGggbm8gbW9kdWxlIElEIGNhbm5vdCBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgcGVyIGZpbGUuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhbHJlYWR5Q2FsbGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy9Vc2UgdGhlIHJlYWwgdmFyaWFibGVzIGZyb20gbm9kZVxuICAgICAgICAgICAgLy9Vc2UgbW9kdWxlLmV4cG9ydHMgZm9yIGV4cG9ydHMsIHNpbmNlXG4gICAgICAgICAgICAvL3RoZSBleHBvcnRzIGluIGhlcmUgaXMgYW1kZWZpbmUgZXhwb3J0cy5cbiAgICAgICAgICAgIGUgPSBtb2R1bGUuZXhwb3J0cztcbiAgICAgICAgICAgIG0gPSBtb2R1bGU7XG4gICAgICAgICAgICByID0gbWFrZVJlcXVpcmUocmVxdWlyZUZuLCBlLCBtLCBtb2R1bGUuaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9JZiB0aGVyZSBhcmUgZGVwZW5kZW5jaWVzLCB0aGV5IGFyZSBzdHJpbmdzLCBzbyBuZWVkXG4gICAgICAgIC8vdG8gY29udmVydCB0aGVtIHRvIGRlcGVuZGVuY3kgdmFsdWVzLlxuICAgICAgICBpZiAoZGVwcykge1xuICAgICAgICAgICAgZGVwcyA9IGRlcHMubWFwKGZ1bmN0aW9uIChkZXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHIoZGVwTmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vQ2FsbCB0aGUgZmFjdG9yeSB3aXRoIHRoZSByaWdodCBkZXBlbmRlbmNpZXMuXG4gICAgICAgIGlmICh0eXBlb2YgZmFjdG9yeSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmVzdWx0ID0gZmFjdG9yeS5hcHBseShtLmV4cG9ydHMsIGRlcHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gZmFjdG9yeTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbS5leHBvcnRzID0gcmVzdWx0O1xuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVyQ2FjaGVbaWRdID0gbS5leHBvcnRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RyaW5nUmVxdWlyZSA9IGZ1bmN0aW9uIChzeXN0ZW1SZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUsIGlkLCByZWxJZCkge1xuICAgICAgICAvL1NwbGl0IHRoZSBJRCBieSBhICEgc28gdGhhdFxuICAgICAgICB2YXIgaW5kZXggPSBpZC5pbmRleE9mKCchJyksXG4gICAgICAgICAgICBvcmlnaW5hbElkID0gaWQsXG4gICAgICAgICAgICBwcmVmaXgsIHBsdWdpbjtcblxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBpZCA9IG5vcm1hbGl6ZShpZCwgcmVsSWQpO1xuXG4gICAgICAgICAgICAvL1N0cmFpZ2h0IG1vZHVsZSBsb29rdXAuIElmIGl0IGlzIG9uZSBvZiB0aGUgc3BlY2lhbCBkZXBlbmRlbmNpZXMsXG4gICAgICAgICAgICAvL2RlYWwgd2l0aCBpdCwgb3RoZXJ3aXNlLCBkZWxlZ2F0ZSB0byBub2RlLlxuICAgICAgICAgICAgaWYgKGlkID09PSAncmVxdWlyZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFrZVJlcXVpcmUoc3lzdGVtUmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlLCByZWxJZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlkID09PSAnZXhwb3J0cycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwb3J0cztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaWQgPT09ICdtb2R1bGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobG9hZGVyQ2FjaGUuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRlckNhY2hlW2lkXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVmaW5lQ2FjaGVbaWRdKSB7XG4gICAgICAgICAgICAgICAgcnVuRmFjdG9yeS5hcHBseShudWxsLCBkZWZpbmVDYWNoZVtpZF0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2FkZXJDYWNoZVtpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmKHN5c3RlbVJlcXVpcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN5c3RlbVJlcXVpcmUob3JpZ2luYWxJZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBtb2R1bGUgd2l0aCBJRDogJyArIGlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL1RoZXJlIGlzIGEgcGx1Z2luIGluIHBsYXkuXG4gICAgICAgICAgICBwcmVmaXggPSBpZC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgaWQgPSBpZC5zdWJzdHJpbmcoaW5kZXggKyAxLCBpZC5sZW5ndGgpO1xuXG4gICAgICAgICAgICBwbHVnaW4gPSBzdHJpbmdSZXF1aXJlKHN5c3RlbVJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSwgcHJlZml4LCByZWxJZCk7XG5cbiAgICAgICAgICAgIGlmIChwbHVnaW4ubm9ybWFsaXplKSB7XG4gICAgICAgICAgICAgICAgaWQgPSBwbHVnaW4ubm9ybWFsaXplKGlkLCBtYWtlTm9ybWFsaXplKHJlbElkKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vTm9ybWFsaXplIHRoZSBJRCBub3JtYWxseS5cbiAgICAgICAgICAgICAgICBpZCA9IG5vcm1hbGl6ZShpZCwgcmVsSWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobG9hZGVyQ2FjaGVbaWRdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRlckNhY2hlW2lkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGx1Z2luLmxvYWQoaWQsIG1ha2VSZXF1aXJlKHN5c3RlbVJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSwgcmVsSWQpLCBtYWtlTG9hZChpZCksIHt9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBsb2FkZXJDYWNoZVtpZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy9DcmVhdGUgYSBkZWZpbmUgZnVuY3Rpb24gc3BlY2lmaWMgdG8gdGhlIG1vZHVsZSBhc2tpbmcgZm9yIGFtZGVmaW5lLlxuICAgIGZ1bmN0aW9uIGRlZmluZShpZCwgZGVwcywgZmFjdG9yeSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpZCkpIHtcbiAgICAgICAgICAgIGZhY3RvcnkgPSBkZXBzO1xuICAgICAgICAgICAgZGVwcyA9IGlkO1xuICAgICAgICAgICAgaWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZmFjdG9yeSA9IGlkO1xuICAgICAgICAgICAgaWQgPSBkZXBzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlcHMgJiYgIUFycmF5LmlzQXJyYXkoZGVwcykpIHtcbiAgICAgICAgICAgIGZhY3RvcnkgPSBkZXBzO1xuICAgICAgICAgICAgZGVwcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZGVwcykge1xuICAgICAgICAgICAgZGVwcyA9IFsncmVxdWlyZScsICdleHBvcnRzJywgJ21vZHVsZSddO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9TZXQgdXAgcHJvcGVydGllcyBmb3IgdGhpcyBtb2R1bGUuIElmIGFuIElELCB0aGVuIHVzZVxuICAgICAgICAvL2ludGVybmFsIGNhY2hlLiBJZiBubyBJRCwgdGhlbiB1c2UgdGhlIGV4dGVybmFsIHZhcmlhYmxlc1xuICAgICAgICAvL2ZvciB0aGlzIG5vZGUgbW9kdWxlLlxuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgIC8vUHV0IHRoZSBtb2R1bGUgaW4gZGVlcCBmcmVlemUgdW50aWwgdGhlcmUgaXMgYVxuICAgICAgICAgICAgLy9yZXF1aXJlIGNhbGwgZm9yIGl0LlxuICAgICAgICAgICAgZGVmaW5lQ2FjaGVbaWRdID0gW2lkLCBkZXBzLCBmYWN0b3J5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJ1bkZhY3RvcnkoaWQsIGRlcHMsIGZhY3RvcnkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy9kZWZpbmUucmVxdWlyZSwgd2hpY2ggaGFzIGFjY2VzcyB0byBhbGwgdGhlIHZhbHVlcyBpbiB0aGVcbiAgICAvL2NhY2hlLiBVc2VmdWwgZm9yIEFNRCBtb2R1bGVzIHRoYXQgYWxsIGhhdmUgSURzIGluIHRoZSBmaWxlLFxuICAgIC8vYnV0IG5lZWQgdG8gZmluYWxseSBleHBvcnQgYSB2YWx1ZSB0byBub2RlIGJhc2VkIG9uIG9uZSBvZiB0aG9zZVxuICAgIC8vSURzLlxuICAgIGRlZmluZS5yZXF1aXJlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGlmIChsb2FkZXJDYWNoZVtpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBsb2FkZXJDYWNoZVtpZF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVmaW5lQ2FjaGVbaWRdKSB7XG4gICAgICAgICAgICBydW5GYWN0b3J5LmFwcGx5KG51bGwsIGRlZmluZUNhY2hlW2lkXSk7XG4gICAgICAgICAgICByZXR1cm4gbG9hZGVyQ2FjaGVbaWRdO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGRlZmluZS5hbWQgPSB7fTtcblxuICAgIHJldHVybiBkZWZpbmU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYW1kZWZpbmU7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBTaW1vbiBMeWRlbGxcclxuLy8gWDExICjigJxNSVTigJ0pIExpY2Vuc2VkLiAoU2VlIExJQ0VOU0UuKVxyXG5cclxudmFyIHBhdGggPSByZXF1aXJlKFwicGF0aFwiKVxyXG5cclxuXCJ1c2Ugc3RyaWN0XCJcclxuXHJcbmZ1bmN0aW9uIHVyaXgoYVBhdGgpIHtcclxuICBpZiAocGF0aC5zZXAgPT09IFwiXFxcXFwiKSB7XHJcbiAgICByZXR1cm4gYVBhdGhcclxuICAgICAgLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpXHJcbiAgICAgIC5yZXBsYWNlKC9eW2Etel06XFwvPy9pLCBcIi9cIilcclxuICB9XHJcbiAgcmV0dXJuIGFQYXRoXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdXJpeFxyXG4iLCIvKipcbiAqIFRoaXMgY29tcG9uZW50IGlzIHJlc3BvbnNpYmxlIGZvciBoaWdobGlnaHRpbmcgdGhlXG4gKiBjb21wb25lbnRzIGluc2lkZSB0aGUgYXBwbGljYXRpb24gYW5kIGNvbW11bmljYXRpbmcgd2l0aCB0aGUgZXh0ZXJuYWwgXG4gKiB3b3JsZCBieSBtZWFucyBvZiB0aGUgYHdpbmRvdy5wb3N0TWVzc2FnZWAgYW5kIFxuICogYHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJylgIG1ldGhvZHMuXG4gKlxuICogSXQgaGFzIGFuZCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlcXVlc3QtcmVzcG9uc2UgbW9kZWwgdGhyb3VnaCB0aGF0IGNoYW5uZWwsIFxuICogZm9yIG1vcmUgaW5mb3JtYXRpb24sIHNlZSBoYW5kbGVGcmFtZVJlcXVlc3RNZXNzYWdlXG4gKiBcbiAqIEBhdXRob3IgU2ltb24gRmFuLCBQYXQgSmVubnksIEx1IEhldWtvXG4gKi9cblxuLyoqXG4gKiBDb25zdGFudHMgdXNlZCB0aHJvdWdob3V0IHRoZSBjb21wb25lbnQgY29kZS5cbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBDT05TVEFOVFMgPSByZXF1aXJlKCcuL3NjcmlwdHMvY29uc3RhbnRzJyk7XG5cbi8qKlxuICogVGhlIGNsYXNzIHRoYXQgZGVmaW5lcyBhIHNjb3BlIGZvciB0aGUgaGlnaGxpZ2h0ZXJzXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKi9cbnZhciBIaWdobGlnaHRlclNjb3BlID0gcmVxdWlyZSgnLi9zY3JpcHRzL2NsYXNzZXMvaGlnaGxpZ2h0ZXItc2NvcGUnKTtcblxuLyoqXG4gKiBCZWhhdmlvcnNcbiAqL1xudmFyIEZyYW1lTWVzc2FnaW5nQmVoYXZpb3IgPSByZXF1aXJlKCcuL3NjcmlwdHMvYmVoYXZpb3JzL2ZyYW1lLW1lc3NhZ2luZycpO1xudmFyIEFuYWx5c2lzQmVoYXZpb3IgICAgICAgPSByZXF1aXJlKCcuL3NjcmlwdHMvYmVoYXZpb3JzL2FuYWx5c2lzJyk7XG52YXIgQ2FudmFzQmVoYXZpb3IgICAgICAgICA9IHJlcXVpcmUoJy4vc2NyaXB0cy9iZWhhdmlvcnMvY2FudmFzJyk7XG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIGNhcmJvLWluc3BlY3RvciBlbGVtZW50XG4gKi9cblBvbHltZXIoe1xuICAgIGlzOiAnY2FyYm8taW5zcGVjdG9yJyxcblxuICAgIGJlaGF2aW9yczogW0ZyYW1lTWVzc2FnaW5nQmVoYXZpb3IsIEFuYWx5c2lzQmVoYXZpb3IsIENhbnZhc0JlaGF2aW9yXSxcblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCBjYWxsZWQgd2hlbmV2ZXIgdGhlIGNvbXBvbmVudCBpcyByZWFkeVxuICAgICAqL1xuICAgIHJlYWR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBcnJheSB0byBzdG9yZSB0aGUgaGlnaGxpZ2h0ZXJzIGNyZWF0ZWRcbiAgICAgICAgICogZm9yIHRoZSBpbnNwZWN0b3IgaW5zdGFuY2UuXG4gICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXNbQ09OU1RBTlRTLmhpZ2hsaWdodGVyc05zXSA9IFtdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGNhcmJvLWhpZ2hsaWdodGVyXG4gICAgICogZ2l2ZW4gdGhlIG9wdGlvbnMuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIFBhc3NlZCB0byBjYXJiby1oaWdobGlnaHRlci4gQWxzbyB3aWxsIGJlXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgIHNldCBvbiB0aGUgaGlnaGxpZ2h0ZXIgZGF0YSBvYmplY3QuXG4gICAgICogQHJldHVybiB7Q2FyYm9IaWdobGlnaHRlcn0gICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgY3JlYXRlSGlnaGxpZ2h0ZXI6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICAgICAgLy8gSGlnaGxpZ2h0ZXIgb2JqZWN0XG4gICAgICAgIHZhciBfaGlnaGxpZ2h0ZXIgPSBuZXcgSGlnaGxpZ2h0ZXJTY29wZShvcHRpb25zLCB0aGlzKTtcblxuICAgICAgICAvLyBVc2luZyB0aGlzIG1lY2hhbmlzbSBvZiBjcmVhdGlvbiBiZWNhdXNlIFBvbHltZXJcbiAgICAgICAgLy8gc3RpbGwgZG9lcyBub3Qgc3VwcG9ydCBkaW5hbWljIGRhdGEtYmluZGluZ1xuICAgICAgICAvLyBXZSBhcmUgdXNpbmcgZG9tLXJlcGVhdCB0byBjcmVhdGVcbiAgICAgICAgLy8gdGhlIF9oaWdobGlnaHRlciBpbnN0YW5jZXMuXG4gICAgICAgIHRoaXMucHVzaChDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnMsIF9oaWdobGlnaHRlcik7XG5cbiAgICAgICAgLy8gRG8gbm90IGZvcmdldCB0byBmbHVzaCBtb2RpZmljYXRpb25zXG4gICAgICAgIC8vIHNvIHRoYXQgd2UgY2FuIHNhZmVseSByZXRyaWV2ZVxuICAgICAgICAvLyB0aGUgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAgICAgICAgUG9seW1lci5kb20uZmx1c2goKTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGhpZ2hsaWdodGVyIGVsZW1lbnQganVzdCBjcmVhdGVkIGFuZFxuICAgICAgICAvLyBzYXZlIHJlZmVyZW5jZSBhdCB0aGUgX2hpZ2hsaWdodGVyIGRhdGEgb2JqZWN0XG4gICAgICAgIF9oaWdobGlnaHRlci5lbGVtZW50ID0gdGhpcy4kJCgnIycgKyBfaGlnaGxpZ2h0ZXIuaWQpO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgdmlydHVhbCBoaWdobGlnaHRlciBvYmplY3RcbiAgICAgICAgcmV0dXJuIF9oaWdobGlnaHRlcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIGFuIGhpZ2hsaWdodGVyIG9iamVjdFxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gaGlnaGxpZ2h0ZXJJZCBcbiAgICAgKiAgICAgSWRlbnRpZmljYXRpb24gb2YgdGhlIGhpZ2hsaWdodGVyXG4gICAgICogQHJldHVybiB7SGlnaGxpZ2h0ZXJTY29wZX1cbiAgICAgKiAgICAgUmVwcmVzZW50YXRpb24gb2YgdGhlIGhpZ2hsaWdodGVyIG9iamVjdFxuICAgICAqL1xuICAgIGdldEhpZ2hsaWdodGVyOiBmdW5jdGlvbiAoaGlnaGxpZ2h0ZXJJZCkge1xuICAgICAgICByZXR1cm4gXy5maW5kKHRoaXNbQ09OU1RBTlRTLmhpZ2hsaWdodGVyc05zXSwgZnVuY3Rpb24gKGhsdCkge1xuICAgICAgICAgICAgcmV0dXJuIGhsdC5pZCA9PT0gaGlnaGxpZ2h0ZXJJZDtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiBTY3JvbGxzIHRoZSB3aW5kb3dcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGRlbHRhWFxuICAgICAqIEBwYXJhbSAge051bWJlcn0gZGVsdGFZXG4gICAgICovXG4gICAgc2Nyb2xsQnk6IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnc2Nyb2xsIHg6ICVzLCB5OiAlcycsIGRlbHRhWCwgZGVsdGFZKTtcbiAgICAgICAgd2luZG93LnNjcm9sbEJ5KGRlbHRhWCwgZGVsdGFZKTtcbiAgICB9LFxufSk7IiwiLyoqXG4gKiBIZWxwZXIgbWV0aG9kcyBmb3IgbWFuaXB1bGF0aW5nIERPTU5vZGVzXG4gKi9cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGNvbXB1dGVkIHN0eWxlIG9mIGFuIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSAge0RPTU5vZGV9IGVsZW1lbnQgVGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0byByZWFkIGNvbXB1dGVkU3l0bGVzXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgIE9iamVjdCB3aXRoIHRoZSBjb21wdXRlZCBzdHlsZXNcbiAqL1xuZXhwb3J0cy5nZXRDb21wdXRlZFN0eWxlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCknKTtcbiAgICB9XG5cbiAgICB2YXIgY3MgPSB7fTtcblxuICAgIC8vIEdldCB0aGUgY29tcHV0ZWQgY3Mgb2YgdGhlIGVsZW1lbnRcbiAgICB2YXIgX2NzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG5cbiAgICBmb3IgKHZhciBpID0gX2NzLmxlbmd0aCAtIDE7IGkgPj0wOyBpLS0pIHtcbiAgICAgICAgdmFyIHByb3AgPSBfY3NbaV07XG5cbiAgICAgICAgY3NbcHJvcF0gPSBfY3MuZ2V0UHJvcGVydHlWYWx1ZShwcm9wKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3M7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgYXR0cmlidXRlcyBvZiBhIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSAge0RPTU5vZGV9IGVsZW1lbnQgVGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0byByZWFkIGF0dHJpYnV0ZXNcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgT2JqZWN0IHdpdGggYWxsIGF0dHJpYnV0ZXNcbiAqL1xuZXhwb3J0cy5nZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIGdldEF0dHJpYnV0ZXMoZWxlbWVudCknKTtcbiAgICB9XG5cbiAgICAvLyBPYmplY3Qgb24gd2hpY2ggdG8gc3RvcmUgYXR0cmlidXRlc1xuICAgIHZhciBhdHRyaWJ1dGVzID0ge307XG5cbiAgICB2YXIgX2F0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuXG4gICAgZm9yICh2YXIgaSA9IF9hdHRycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhdHRyaWJ1dGVzW19hdHRyc1tpXS5uYW1lXSA9IF9hdHRyc1tpXS52YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlcztcbn07IiwidmFyIERPTUhlbHBlcnMgPSByZXF1aXJlKCcuLi9hdXgvZG9tJyk7XG5cbmV4cG9ydHMuZ2V0RWxlbWVudEF0UG9pbnQgPSBmdW5jdGlvbiAocG9pbnQpIHtcblxufSIsIi8qKlxuICogSW1wbGVtZW50cyBiZWhhdmlvcnMgb25seSB2YWxpZCBmb3IgY2FudmFzIHVzYWdlLlxuICovXG5cbmV4cG9ydHMuYXR0YWNoZWQgPSBmdW5jdGlvbiAoKSB7XG5cblxuICAgIHRoaXMuX2NhbnZhcyA9IHtcblxuICAgICAgICBoaWdobGlnaHRlcnM6IHtcbiAgICAgICAgICAgIGhvdmVyOiB0aGlzLmNyZWF0ZUhpZ2hsaWdodGVyKHtcbiAgICAgICAgICAgICAgICBzdXJmYWNlU3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnM3B4IGRhc2hlZCBncmVlbidcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgZm9jdXM6IHRoaXMuY3JlYXRlSGlnaGxpZ2h0ZXIoe1xuICAgICAgICAgICAgICAgIHN1cmZhY2VTdHlsZToge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICczcHggc29saWQgZ3JlZW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgIGxvYWRpbmc6IHRoaXMuY3JlYXRlSGlnaGxpZ2h0ZXIoe1xuICAgICAgICAgICAgICAgIHN1cmZhY2VTdHlsZToge1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdncmVlbicsXG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6ICcwLjMnLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogSGlnaGxpZ2h0cyB0aGUgZWxlbWVudCBhdCBhIGdpdmVuIHBvaW50XG4gKiBAcGFyYW0ge09iamVjdHsgeDogTnVtYmVyLCB5OiBOdW1iZXJ9fSBcbiAqICAgICAgICAgcG9pbnQgVGhlIHBvaW50IGF0IHdoaWNoIHRoZSBlbGVtZW50IHRvIGJlIGhpZ2hsaWdodGVkIGlzXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGZvcmNlXG4gKi9cbmV4cG9ydHMuaGlnaGxpZ2h0RWxlbWVudEF0UG9pbnQgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0ZXIsIHBvaW50LCBmb3JjZSkge1xuICAgIC8vIGdldCBob3ZlcmVkIGNvbXBvbmVudCAoRWxlbWVudCB1bmRlciB0aGF0IHBvc2l0aW9uKVxuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChwb2ludC54LCBwb2ludC55KTtcblxuICAgIHZhciBobHQgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzW2hpZ2hsaWdodGVyXTtcblxuICAgIGhsdC5oaWdobGlnaHQoZWxlbWVudCk7XG59O1xuXG4vKipcbiAqIFVuaGlnaGxpZ2h0c1xuICovXG5leHBvcnRzLnVuSGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGhpZ2hsaWdodGVyKSB7XG4gICAgdmFyIGhsdCA9IHRoaXMuX2NhbnZhcy5oaWdobGlnaHRlcnNbaGlnaGxpZ2h0ZXJdO1xuXG4gICAgaGx0LmhpZGUoKTtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhY3RpdmUgZWxlbWVudC5cbiAqIEByZXR1cm4ge3t0YWdOYW1lOiBTdHJpbmcsIGF0dHJpYnV0ZXM6IE9iamVjdCwgY29tcHV0ZWRTdHlsZTogT2JqZWN0IH1PYmplY3R9IFxuICogICAgICAgICBEYXRhIG9uIHRoZSBjdXJyZW50IGFjdGl2ZSBlbGVtZW50LlxuICovXG5leHBvcnRzLmdldEFjdGl2ZUVsZW1lbnREYXRhID0gZnVuY3Rpb24gKGhpZ2hsaWdodGVyKSB7XG5cbiAgICB2YXIgaGx0ID0gdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVyc1toaWdobGlnaHRlcl07XG5cbiAgICByZXR1cm4gaGx0LmdldFRhcmdldERhdGEoKTtcbn07XG5cblxuZXhwb3J0cy5hcmVGb2N1c0FuZEhvdmVyVG9nZXRoZXIgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZm9jdXMgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzLmZvY3VzO1xuICAgIHZhciBob3ZlciA9IHRoaXMuX2NhbnZhcy5oaWdobGlnaHRlcnMuaG92ZXI7XG5cbiAgICByZXR1cm4gZm9jdXMudGFyZ2V0ID09PSBob3Zlci50YXJnZXQ7XG59O1xuXG5leHBvcnRzLmFjdGl2YXRlTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBobHQgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzLmZvY3VzO1xuXG4gICAgdGhpcy4kLmxvYWRpbmcuaGlnaGxpZ2h0KGhsdC50YXJnZXQpO1xufTtcblxuZXhwb3J0cy5kZWFjdGl2YXRlTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiQubG9hZGluZy5oaWRlKCk7XG59O1xuXG52YXIgV0hJVEVMSVNURURfSElHSExJR0hURVJfT1BFUkFUSU9OUyA9IHtcbiAgICBnZXRDU1NSdWxlczogdHJ1ZSxcbiAgICBnZXRDU1NTZWxlY3RvcnM6IHRydWUsXG4gICAgZ2V0Q1NTUHJvcGVydGllczogdHJ1ZSxcbiAgICBnZXRDU1NTZWxlY3RvclNwZWNpZmljaXR5OiB0cnVlXG59O1xuXG4vKipcbiAqIEV4ZWN1dGVzIGFuIG9wZXJhdGlvbiBvbiBhIGdpdmVuIGhpZ2hsaWdodGVyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGhpZ2hsaWdodGVySWQgXG4gKiAgICAgSWRlbnRpZmllciBvZiB0aGUgaGlnaGxpZ2h0ZXIgb250byB3aGljaCB0aGUgb3BlcmF0aW9uIHNob3VsZCBiZVxuICogICAgIGV4ZWN1dGVkXG4gKiBAcGFyYW0gIHtTdHJpbmd9IG9wZXJhdGlvblxuICogICAgIE5hbWUgb2YgdGhlIG9wZXJhdGlvbiB0byBiZSBleGVjdXRlZFxuICogQHBhcmFtICB7QXJyYXl8Kn0gYXJnc1xuICogICAgIFNldCBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIHRoZSBvcGVyYXRpb25cbiAqIEByZXR1cm4geyp9XG4gKiAgICAgUmVzdWx0cyBvZiB0aGUgb3BlcmF0aW9uLiBXaGF0ZXZlciB0aGUgb3BlcmF0aW9uIHJldHVybnMuXG4gKi9cbmV4cG9ydHMuZXhlY3V0ZUhpZ2hsaWdodGVyT3BlcmF0aW9uID0gZnVuY3Rpb24gKGhpZ2hsaWdodGVySWQsIG9wZXJhdGlvbiwgYXJncykge1xuXG4gICAgLy8gcmV0cmlldmUgdGhlIGhpZ2hsaWdodGVyIG9iamVjdFxuICAgIHZhciBoaWdobGlnaHRlciA9IHRoaXMuZ2V0SGlnaGxpZ2h0ZXIoaGlnaGxpZ2h0ZXJJZCkgfHwgdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVycy5mb2N1cztcblxuICAgIGlmIChXSElURUxJU1RFRF9ISUdITElHSFRFUl9PUEVSQVRJT05TW29wZXJhdGlvbl0pIHtcbiAgICAgICAgcmV0dXJuIGhpZ2hsaWdodGVyW29wZXJhdGlvbl0uYXBwbHkoaGlnaGxpZ2h0ZXIsIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVG9vIGJhZDogaGlnaGxpZ2h0ZXIgb3BlcmF0aW9uIGAnICsgb3BlcmF0aW9uICsgJ2Agbm90IHdoaXRlbGlzdGVkLiA6KCcpXG4gICAgfVxufTsiLCIvKipcbiAqIEVuYWJsZXMgbWVzc2FnaW5nIGJldHdlZW4gZnJhbWVzXG4gKi9cblxudmFyIENPTlNUQU5UUyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cycpO1xuXG4vKipcbiAqIE1ldGhvZCBjYWxsZWQgd2hlbmV2ZXIgdGhlIGNvbXBvbmVudCBpcyByZWFkeVxuICovXG5leHBvcnRzLnJlYWR5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIExpc3RlbiB0byBgbWVzc2FnZWAgZXZlbnRzIG9uIHRoZSB3aW5kb3cgb2JqZWN0LlxuICAgIC8vIFRoZSB3aW5kb3cgaXMgdGhlIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSB3aG9sZSBhcHBsaWNhdGlvbixcbiAgICAvLyBpbiB0aGUgY2FzZSBvZiB0aGUgZWRpdGVkIGFwcGxpY2F0aW9uIChpbnNpZGUgd2hpY2ggaXMgdGhlIGluc3BlY3RvciBjb21wb25lbnQpXG4gICAgLy8gaXQgaXMgdGhlIGBpZnJhbWVgLiBcbiAgICAvLyBcbiAgICAvLyBPbmx5IHRoZSB3aW5kb3cgcmVjZWl2ZXMgbWVzc2FnZXMuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmhhbmRsZUZyYW1lUmVxdWVzdE1lc3NhZ2UuYmluZCh0aGlzKSwgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBIYW5kbGVzIG1lc3NhZ2VzIGZyb20gdGhlIHBhcmVudCBmcmFtZS5cbiAqIEBwYXJhbSAge0V2ZW50fSBldmVudCB0aGUgZXZlbnQgb2JqZWN0XG4gKi9cbmV4cG9ydHMuaGFuZGxlRnJhbWVSZXF1ZXN0TWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIC8vIG3DqXRvZG8gSlNPTi5wYXJzZSgpIGNvbnZlcnRlIHN0cmluZyBwYXJhIEpTT05cbiAgICB2YXIgcmVxdWVzdCA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgb3BlcmF0aW9uTmFtZSBpcyB3aGl0ZWxpc3RlZFxuICAgIC8vIE5vdCBhbGwgbWV0aG9kcyBvbiB0aGUgaW5zcGVjdG9yIG9iamVjdCBzaG91bGQgYmVcbiAgICAvLyBhdmFpbGFibGUgZm9yIG91dHNpZGUgdXNlIGZvciBzZWN1cml0eSByZWFzb25zLlxuICAgIC8vIFRodXMgd2Ugc2hvdWxkIHdoaXRlbGlzdCB0aGUgYXZhaWxhYmxlIG1ldGhvZHNcbiAgICB2YXIgb3BlcmF0aW9uV2hpdGVsaXN0ZWQgPSBDT05TVEFOVFMub3BlcmF0aW9uV2hpdGVsaXN0W3JlcXVlc3Qub3BlcmF0aW9uXTsgXG5cbiAgICBpZiAob3BlcmF0aW9uV2hpdGVsaXN0ZWQpIHtcbiAgICAgICAgLy8gRXhlY3V0ZSB0aGUgb3BlcmF0aW9uIGFuZCBzdG9yZSB0aGUgcmVzdWx0XG4gICAgICAgIHZhciByZXMgPSB0aGlzW3JlcXVlc3Qub3BlcmF0aW9uXS5hcHBseSh0aGlzLCByZXF1ZXN0LmFyZ3MpO1xuXG4gICAgICAgIC8vIElmIHRoZSByZXN1bHQgaXMgYSBwcm9taXNlLCB3YWl0IGZvciB0aGUgcHJvbWlzZSB0byBiZSBcbiAgICAgICAgLy8gZG9uZSBiZWZvcmUgcmV0dXJuaW5nIHJlc3VsdHNcbiAgICAgICAgUS53aGVuKHJlcylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChmaW5hbFJlcykge1xuXG4gICAgICAgICAgICAgICAgLy8gU2VuZCBtZXNzYWdlIHRvIHBhcmVudCBmcmFtZSBwYXNzaW5nIHRoZSByZXF1ZXN0LmlkXG4gICAgICAgICAgICAgICAgLy8gc28gdGhhdCB0aGUgcGFyZW50IG1heSByZXNvbHZlIHRvIHRoZSBjb3JyZWN0IGlucXVpcnkuXG4gICAgICAgICAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJlcXVlc3QuaWQsXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBtZXRob2QgdG8gY29udmVydCB0aGUgb2JqZWN0IGludG8gXG4gICAgICAgICAgICAgICAgICAgIC8vIHBsYWluIEpTT04gb2JqZWN0LCBkbyBzby5cbiAgICAgICAgICAgICAgICAgICAgcmVzOiAoZmluYWxSZXMgIT09IHVuZGVmaW5lZCAmJiBmaW5hbFJlcy50b1BsYWluT2JqZWN0KSA/IGZpbmFsUmVzLnRvUGxhaW5PYmplY3QoKSA6IGZpbmFsUmVzXG4gICAgICAgICAgICAgICAgfSksICcqJyk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC8vIHRlcm1pbmF0ZSBwcm9taXNlIGNoYWluXG4gICAgICAgICAgICAuZG9uZSgpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcGVyYXRpb24gJXMgaXMgbm90IGF2YWlsYWJsZSBhdCBpbnNwZWN0b3InLCByZXF1ZXN0Lm9wZXJhdGlvbik7XG4gICAgfVxufTsiLCIvKipcbiAqIEBjbGFzcyBDU1NJbnNwZWN0b3JcbiAqXG4gKiBEZWZpbmVzIGEgY2xhc3MgZm9yIGluc3BlY3RpbmcgY3NzIHJ1bGVzIGFuZCBzdHlsZXNoZWV0c1xuICogYW5kIHRoZWlyIGVmZmVjdHMgb24gdGFyZ2V0IGVsZW1lbnRzLlxuICpcbiAqIEZvciB0aGUgdGltZSBiZWluZywgZG9lcyBub3QgcGVyZm9ybSBhbnkgaW50ZWxsaWdlbmNlLFxuICogaXQgZGVsZWdhdGVzIHRvIENTU1V0aWxpdGllcyAoYnkgYnJvdGhlcmNha2UpLlxuICogXG4gKiBGb3IgZG9jcyBvbiBDU1NVdGlsaXRpZXM6XG4gKiAvLyBodHRwOi8vd3d3LmJyb3RoZXJjYWtlLmNvbS9zaXRlL3Jlc291cmNlcy9zY3JpcHRzL2Nzc3V0aWxpdGllcy9mdW5jdGlvbnNcbiAqL1xuXG52YXIgY3NzID0gcmVxdWlyZSgnY3NzJyk7XG52YXIgRE9NSGVscGVycyA9IHJlcXVpcmUoJy4uL2F1eC9kb20nKTtcblxuLyoqXG4gKiBDbGFzcyB0aGF0IHByb3hpZXMgbWV0aG9kcyB0byBDU1NVdGlsaXRpZXNcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbWVudCBUaGUgZWxlbWVudCB0aGUgaW5zcGVjdG9yIHNob3VsZCB3b3JrIHVwb25cbiAqL1xuZnVuY3Rpb24gQ1NTSW5zcGVjdG9yKGRlZmF1bHRPcHRpb25zLCBlbGVtZW50KSB7XG5cbiAgICAvLyBTYXZlIHRoZSBkZWZhdWx0IG9wdGlvbnNcbiAgICB0aGlzLmRlZmF1bHRPcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG5cbiAgICB0aGlzLnNldFRhcmdldChlbGVtZW50KTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSB0YXJnZXQgZWxlbWVudFxuICogQHBhcmFtIHtbdHlwZV19IGVsZW1lbnQgW2Rlc2NyaXB0aW9uXVxuICovXG5DU1NJbnNwZWN0b3IucHJvdG90eXBlLnNldFRhcmdldCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgdGhpcy50YXJnZXQgPSBlbGVtZW50O1xufTtcblxuLyoqXG4gKiBEZWZhdWx0IG9wdGlvbnMgZm9yIGBnZXRDU1NSdWxlc2BcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBHRVRfQ1NTX1JVTEVTX0RFRkFVTFRTID0ge1xuICAgIG1lZGlhOiAnc2NyZWVuJyxcbiAgICBwcm9wZXJ0aWVzOiBbJ3Byb3BlcnRpZXMnLCAnc2VsZWN0b3InLCAnY3NzJ10sXG4gICAgYWx0c3RhdGVzOiB0cnVlLFxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHJ1bGVzIHRoYXQgYXBwbHkgdG8gdGhlIGVsZW1lbnRcbiAqIEBwYXJhbSAge1t0eXBlXX0gb3B0aW9ucyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtQcm9taXNlIC0+IEFycmF5fSAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xuQ1NTSW5zcGVjdG9yLnByb3RvdHlwZS5nZXRDU1NSdWxlcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKCF0aGlzLnRhcmdldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHRhcmdldCBmb3IgYGdldENTU1J1bGVzYCcpO1xuICAgIH1cbiAgICBcbiAgICAvLyBEZWZhdWx0IHNldHRpbmdcbiAgICBvcHRpb25zID0gXy5hc3NpZ24oe30sIEdFVF9DU1NfUlVMRVNfREVGQVVMVFMsIG9wdGlvbnMpO1xuICAgIC8vIGNyZWF0ZSBhIGRlZmVyIG9iamVjdFxuICAgIHZhciBkZWZlciA9IFEuZGVmZXIoKTtcbiAgICBcbiAgICAvLyBwcm9wZXJ0aWVzIG9wdGlvbiBtdXN0IGJlIFN0cmluZ1xuICAgIHZhciBwcm9wZXJ0aWVzID0gXy5pc0FycmF5KG9wdGlvbnMucHJvcGVydGllcykgPyBcbiAgICAgICAgb3B0aW9ucy5wcm9wZXJ0aWVzLmpvaW4oJywnKSA6IFxuICAgICAgICBvcHRpb25zLnByb3BlcnRpZXM7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBDU1NVdGlsaXRpZXMuZ2V0Q1NTUnVsZXMoZWxlbWVudCBbLCBtZWRpYV0gWywgcHJvcGVydGllc10gWywgYWx0c3RhdGVzXSBbLCBvbmNvbXBsZXRlXSlcbiAgICAgICAgQ1NTVXRpbGl0aWVzLmdldENTU1J1bGVzKFxuICAgICAgICAgICAgdGhpcy50YXJnZXQsIFxuICAgICAgICAgICAgb3B0aW9ucy5tZWRpYSwgXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLFxuICAgICAgICAgICAgb3B0aW9ucy5hbHRzdGF0ZXMsXG4gICAgICAgICAgICBmdW5jdGlvbiAocnVsZXMpIHtcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKHJ1bGVzLm1hcChmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3I6IHIuc2VsZWN0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBjc3M6IHIuY3NzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogci5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGRlZmVyLnJlamVjdChlKTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm4gdGhlIHByb21pc2VcbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbn07XG5cbi8qKlxuICogRGVmYXVsdCBvcHRpb25zIGZvciBgZ2V0Q1NTUHJvcGVydGllc2BcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBHRVRfQ1NTX1BST1BFUlRJRVNfREVGQVVMVFMgPSB7XG4gICAgbWVkaWE6ICdzY3JlZW4nLFxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgY3NzIHByb3BlcnRpZXMgcmVsYXRlZCB0byB0aGUgdGFyZ2V0IGVsZW1lbnRcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtQcm9taXNlIC0+IEFycmF5fVxuICovXG5DU1NJbnNwZWN0b3IucHJvdG90eXBlLmdldENTU1Byb3BlcnRpZXMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGlmICghdGhpcy50YXJnZXQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB0YXJnZXQgZm9yIGBnZXRDU1NQcm9wZXJ0aWVzYCcpO1xuICAgIH1cblxuICAgIC8vIERlZmF1bHQgc2V0dGluZ1xuICAgIG9wdGlvbnMgPSBfLmFzc2lnbih7fSwgR0VUX0NTU19QUk9QRVJUSUVTX0RFRkFVTFRTLCBvcHRpb25zKTtcbiAgICAvLyBjcmVhdGUgYSBkZWZlciBvYmplY3RcbiAgICB2YXIgZGVmZXIgPSBRLmRlZmVyKCk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBDU1NVdGlsaXRpZXMuZ2V0Q1NTUHJvcGVydGllcyhlbGVtZW50IFssIG1lZGlhXSBbLCBvbmNvbXBsZXRlXSlcbiAgICAgICAgQ1NTVXRpbGl0aWVzLmdldENTU1Byb3BlcnRpZXMoXG4gICAgICAgICAgICB0aGlzLnRhcmdldCwgXG4gICAgICAgICAgICBvcHRpb25zLm1lZGlhLCBcbiAgICAgICAgICAgIGRlZmVyLnJlc29sdmVcbiAgICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGRlZmVyLnJlamVjdChlKTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm4gdGhlIHByb21pc2VcbiAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbn07XG5cbi8qKlxuICogRGVmYXVsdCBvcHRpb25zIGZvciBnZXRDU1NTZWxlY3RvcnNcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBHRVRfQ1NTX1NFTEVDVE9SU19ERUZBVUxUUyA9IHtcbiAgICBtZWRpYTogJ3NjcmVlbicsXG4gICAgZGlyZWN0b25seTogdHJ1ZSxcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGNzcyBzZWxlY3RvcnMgdGhhdCBhcHBseSB0byB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgXG4gKiBAcmV0dXJuIHtQcm9taXNlIC0+IEFycmF5fVxuICogICAgIFRha2VuIGZyb20gQ1NTVXRpbGl0aWVzIGRvY3NcbiAqICAgICBcIlRoZSBtZXRob2QgcmV0dXJucyBhbiBhcnJheSBvZiB6ZXJvIG9yIG1vcmUgc2VsZWN0b3JzLFxuICogICAgIGVhY2ggb2Ygd2hpY2ggaXMgYSBTdHJpbmcgQ1NTIHNlbGVjdG9yLFxuICogICAgIHRyaW1tZWQgb2YgbGVhZGluZyBvciB0cmFpbGluZyB3aGl0ZXNwYWNlLlwiXG4gKi9cbi8vIENTU0luc3BlY3Rvci5wcm90b3R5cGUuZ2V0Q1NTU2VsZWN0b3JzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbi8vICAgICBpZiAoIXRoaXMudGFyZ2V0KSB7XG4vLyAgICAgICAgIHRocm93IG5ldyBFcnJvcignW0NTU0luc3BlY3Rvcl0gTm8gdGFyZ2V0IGZvciBgZ2V0Q1NTU2VsZWN0b3JzYCcpO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIERlZmF1bHQgc2V0dGluZ1xuLy8gICAgIG9wdGlvbnMgPSBfLmFzc2lnbih7fSwgR0VUX0NTU19TRUxFQ1RPUlNfREVGQVVMVFMsIG9wdGlvbnMpO1xuXG4vLyAgICAgdmFyIGRlZmVyID0gUS5kZWZlcigpO1xuLy8gICAgIC8vIENTU1V0aWxpdGllcy5nZXRDU1NTZWxlY3RvcnMoZWxlbWVudCBbLCBtZWRpYV0gWywgZGlyZWN0b25seV0gWywgb25jb21wbGV0ZV0pXG4gICAgXG4vLyAgICAgLy8gVE9ETzogc3R1ZHkgZXJyb3IgaGFuZGxpbmcgd2l0aCBDU1NVdGlsaXRpZXNcbi8vICAgICAvLyBJdHMgYXN5bmNocm9ub3VzIGFwaSBzaG91bGQgbm90IGJlIGRlYWx0IHdpdGggdHJ5LWNhdGNoXG4vLyAgICAgLy8gYnV0IGluc3RlYWQgc29tZSB3YXkgb2YgZXJyb3IgaGFuZGxpbmcgb24gdGhlIGNhbGxiYWNrLlxuLy8gICAgIC8vIEJ1dCB0aGUgY29ycmVjdCBlcnJvciBoYW5kbGluZyBtb2RlIHdhcyBub3QgZm91bmQgdW50aWwgbm93IFxuLy8gICAgIC8vIChqdXN0IHN0YXJ0aW5nIGV4cGVyaW1lbnQpXG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgQ1NTVXRpbGl0aWVzLmdldENTU1NlbGVjdG9ycyhcbi8vICAgICAgICAgICAgIHRoaXMudGFyZ2V0LCBcbi8vICAgICAgICAgICAgIG9wdGlvbnMubWVkaWEsIFxuLy8gICAgICAgICAgICAgb3B0aW9ucy5kaXJlY3Rvbmx5LFxuLy8gICAgICAgICAgICAgZnVuY3Rpb24gKHNlbGVjdG9ycykge1xuLy8gICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUoc2VsZWN0b3JzKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgKTtcbi8vICAgICB9IGNhdGNoIChlKSB7XG4vLyAgICAgICAgIGRlZmVyLnJlamVjdChlKTtcbi8vICAgICB9XG5cbi8vICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbi8vIH07XG5cbmZ1bmN0aW9uIGdldEFsbFN0eWxlUnVsZXMoKSB7XG4gICAgICAgIFxufVxuXG5DU1NJbnNwZWN0b3IucHJvdG90eXBlLmdldENTU1NlbGVjdG9ycyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICB2YXIgdGFyZ2V0UnVsZXMgPSBbXTtcbiAgICBcbiAgICB2YXIgc3R5bGVzaGVldFJ1bGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0sIDApO1xuXG4gICAgc3R5bGVzaGVldFJ1bGVzLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgcnVsZSBhcHBsaWVzIHRvIHRoZSB0YXJnZXRcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gcnVsZS5zZWxlY3RvcjtcblxuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5cbi8qKlxuICogUmV0cmlldmVzIHNlbGVjdG9yIHNwZWNpZmljaXR5IGZvciBhIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSAge1t0eXBlXX0gb3B0aW9ucyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5DU1NJbnNwZWN0b3IucHJvdG90eXBlLmdldENTU1NlbGVjdG9yU3BlY2lmaWNpdHkgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGlmICghdGhpcy50YXJnZXQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbQ1NTSW5zcGVjdG9yXSBObyB0YXJnZXQgZm9yIGBnZXRDU1NTZWxlY3RvclNwZWNpZmljaXR5YCcpO1xuICAgIH1cbiAgICAvLyBDU1NVdGlsaXRpZXMuZ2V0Q1NTU2VsZWN0b3JTcGVjaWZpY2l0eShzZWxlY3RvciBbLCBlbGVtZW50XSBbLCBvbmNvbXBsZXRlXSlcbn07XG5cbi8qKlxuICogU3RhdGljIG1ldGhvZHNcbiAqL1xuXG5DU1NJbnNwZWN0b3IuZ2V0Q1NTU2VsZWN0b3JTcGVjaWZpY2l0eSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgLy8gQ1NTVXRpbGl0aWVzLmdldENTU1NlbGVjdG9yU3BlY2lmaWNpdHkoc2VsZWN0b3IgWywgZWxlbWVudF0gWywgb25jb21wbGV0ZV0pXG59O1xuQ1NTSW5zcGVjdG9yLmdldENTU1N0eWxlU2hlZXRSdWxlcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgLy8gQ1NTVXRpbGl0aWVzLmdldENTU1N0eWxlU2hlZXRSdWxlcyhbbWVkaWFdIFssIGFjY2VwdF0gWywgc3NpZF0gWywgb25jb21wbGV0ZV0pXG59O1xuQ1NTSW5zcGVjdG9yLmdldENTU1N0eWxlU2hlZXRzID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIENTU1V0aWxpdGllcy5nZXRDU1NTdHlsZVNoZWV0cyhbb25jb21wbGV0ZV0pXG59O1xuXG4vKipcbiAqIEluaXRpYWxpemVzIENTU1V0aWxpdGllc1xuICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGluaXRpYWxpemVDU1NVdGlsaXRpZXMoKSB7XG4gICAgLy8gQ1NTVXRpbGl0aWVzIGlzIGF2YWlsYWJsZSBhcyBhIGdsb2JhbFxuICAgIC8vIGFzIGl0IHdhcyBpbXBvcnRlZCB2aWEgYHNjcmlwdGAgdGFnXG4gICAgXG4gICAgLy8gc2V0IGNvbmZpZyBhbmQgaW5pdGlhbGl6ZVxuICAgIC8vIFVzZSBhdXRob3IgbW9kZSBiZWNhdXNlIHdlIG5lZWQgdG8gYWNjZXNzIHRoZSBhY3R1YWwgXG4gICAgLy8gc3R5bGVzaGVldHMuXG4gICAgLy8gXG4gICAgLy8gVGhpcyBpbmN1cnMgaW4gb25lIGV4dHJhIGFqYXggZ2V0IHJlcXVlc3QgXG4gICAgLy8gZm9yIGVhY2ggc3R5bGVzaGVldCBpbiB0aGUgaW5zcGVjdGVkIGFwcGxpY2F0aW9uLlxuICAgIC8vIFxuICAgIC8vIEFsc28sIHNvbWUgbWV0aG9kcyB3aWxsIHJ1biBpbiBhc3luY2hyb25vdXMgbW9kZSwgXG4gICAgLy8gd2l0aCBjYWxsYmFja3MuXG4gICAgLy8gXG4gICAgLy8gZG9jczpcbiAgICAvLyBodHRwOi8vd3d3LmJyb3RoZXJjYWtlLmNvbS9zaXRlL3Jlc291cmNlcy9zY3JpcHRzL2Nzc3V0aWxpdGllcy9jb25maWcvI2NvbmZpZy1tb2RlXG4gICAgQ1NTVXRpbGl0aWVzLmRlZmluZSgnbW9kZScsICdicm93c2VyJyk7XG4gICAgQ1NTVXRpbGl0aWVzLmRlZmluZSgnYXN5bmMnLCB0cnVlKTtcbiAgICAvLyBEbyBub3QgdGFrZSBpbnRvIGFjY291bnQgaW5saW5lIHN0eWxlc1xuICAgIENTU1V0aWxpdGllcy5kZWZpbmUoJ2F0dHJpYnV0ZXMnLCBmYWxzZSk7XG4gICAgQ1NTVXRpbGl0aWVzLmluaXQoKTtcbn1cblxuLy8gaW52b2tlIENTU1V0aWxpdGllcyBpbml0aWFsaXphdGlvbiBpbW1lZGlhdGVseVxuaW5pdGlhbGl6ZUNTU1V0aWxpdGllcygpO1xuXG4vLyBleHBvcnRcbm1vZHVsZS5leHBvcnRzID0gQ1NTSW5zcGVjdG9yOyIsIi8qKlxuICogQ2xhc3MgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgZW5jYXBzdWxhdGluZyBzY29wZSBcbiAqIGZvciBlYWNoIG9mIHRoZSBoaWdobGlnaHRlciBlbGVtZW50cyB3aXRoaW4uXG4gKi9cblxudmFyIENPTlNUQU5UUyAgICAgID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzJyk7XG52YXIgaGlnaGxpZ2h0ZXJzTnMgPSBDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnM7XG5cbnZhciBET01IZWxwZXJzID0gcmVxdWlyZSgnLi4vYXV4L2RvbScpO1xuXG5cbi8vIExvYWQgaW50ZXJuYWwgZGVwZW5kZW5jaWVzXG52YXIgQ1NTSW5zcGVjdG9yID0gcmVxdWlyZSgnLi9jc3MtaW5zcGVjdG9yJyk7XG5cbi8qKlxuICogQ2xhc3MgdGhhdCByZXByZXNlbnRzIHRoZSBjYXJiby1oaWdobGlnaHRlciBlbGVtZW50XG4gKiB2aXJ0dWFsbHkuXG4gKiBAcGFyYW0ge09iamVjdH0gW2RhdGFdIERhdGEgdG8gYmUgc2V0IG9uIHRoZSBzY29wZVxuICogQHBhcmFtIHs8Y2FyYm8taW5zcGVjdG9yPn0gW2luc3BlY3Rvcl0gVGhlIGluc3BlY3RvciBpbnN0YW5jZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGhpZ2hsaWdodGVyIGlzIG93bmVkIGJ5LlxuICovXG5mdW5jdGlvbiBIaWdobGlnaHRlclNjb3BlKGRhdGEsIGluc3BlY3Rvcikge1xuXG4gICAgdGhpcy5pZCA9IF8udW5pcXVlSWQoJ2hpZ2hsaWdodGVyXycpO1xuXG4gICAgLy8ga2VlcCByZWZlcmVuY2UgdG8gdGhlIGluc3BlY3RvciBpbnN0YW5jZVxuICAgIHRoaXMuaW5zcGVjdG9yID0gaW5zcGVjdG9yO1xuXG4gICAgLy8gR2V0IGFsbCBkYXRhXG4gICAgXy5hc3NpZ24odGhpcywgZGF0YSk7XG5cbiAgICAvLyBpbnN0YW50aWF0ZSBhIENTU0luc3BlY3RvclxuICAgIHRoaXMuX2Nzc0luc3BlY3RvciA9IG5ldyBDU1NJbnNwZWN0b3IoKTtcbn1cblxuLyoqXG4gKiBQcm94aWVzIDxjYXJiby1oaWdobGlnaHRlcj4uaGlnaGxpZ2h0IG1ldGhvZFxuICogQHBhcmFtICB7Tm9kZX0gZWxlbWVudCBOb2RlIHRvIGJlIGhpZ2hsaWdodGVkXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgXG4gKi9cbkhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG5cbiAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIEhpZ2hsaWdodGVyU2NvcGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldCgnZWxlbWVudExhYmVsJywgZWxlbWVudC50YWdOYW1lKTtcblxuICAgIHRoaXMuZWxlbWVudC5oaWdobGlnaHQoZWxlbWVudCwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIFByb3hpZXMgdGhlIDxjYXJiby1oaWdobGlnaHRlcj4uaGlkZSBtZXRob2RcbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIEhpZ2hsaWdodGVyU2NvcGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQuaGlkZSgpO1xufTtcblxuLyoqXG4gKiBIZWxwZXIgbWV0aG9kIHRvIHNldCBkYXRhIHVzaW5nIHBvbHltZXIgc3R1ZmZcbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHByb3BlcnR5LCB2YWx1ZSkge1xuXG4gICAgdmFyIHBhdGggPSBoaWdobGlnaHRlcnNOcyArICcuJyArIHRoaXMuaW5kZXggKyAnLicgKyBwcm9wZXJ0eTtcblxuICAgIHRoaXMuaW5zcGVjdG9yLnNldChwYXRoLCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBkYXRhIGFib3V0IHRoZSBlbGVtdG5cbiAqIEByZXR1cm4ge09iamVjdH0gW2Rlc2NyaXB0aW9uXVxuICovXG5IaWdobGlnaHRlclNjb3BlLnByb3RvdHlwZS5nZXRUYXJnZXREYXRhID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIHRhcmdldCA9IHRoaXMuZWxlbWVudC50YXJnZXQ7XG4gICAgdmFyIGRhdGE7XG5cbiAgICBpZiAodGFyZ2V0KSB7XG5cbiAgICAgICAgdmFyIGJvdW5kaW5nUmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgdGFnTmFtZTogdGFyZ2V0LnRhZ05hbWUsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBET01IZWxwZXJzLmdldEF0dHJpYnV0ZXModGFyZ2V0KSxcbiAgICAgICAgICAgIGNvbXB1dGVkU3R5bGU6IERPTUhlbHBlcnMuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpLFxuICAgICAgICAgICAgcmVjdDoge1xuICAgICAgICAgICAgICAgIHRvcDogYm91bmRpbmdSZWN0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBib3VuZGluZ1JlY3QubGVmdCxcbiAgICAgICAgICAgICAgICB3aWR0aDogYm91bmRpbmdSZWN0LndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYm91bmRpbmdSZWN0LmhlaWdodCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBzY29wZSBkYXRhIGludG8gYSBwbGFpbiBvYmplY3QgcmVhZHkgZm9yIFxuICogSlNPTiBzdHJpbmdpZmljYXRpb25cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUudG9QbGFpbk9iamVjdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBvYmogPSB7XG4gICAgICAgIGlkOiB0aGlzLmlkXG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gb2JqO1xufTtcblxuLyoqXG4gKiBEZWZpbmUgdGhlIGluZGV4IHByb3BlcnR5XG4gKiB3aGljaCB3aWxsIGp1c3QgcG9pbnQgdG8gdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBoaWdobGlnaHRlciBzY29wZVxuICogaXMgc3RvcmVkIGF0IHRoZSBpbnNwZWN0b3Igb2JqZWN0LlxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUsICdpbmRleCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgX2hpZ2hsaWdodGVycyA9IHRoaXMuaW5zcGVjdG9yW0NPTlNUQU5UUy5oaWdobGlnaHRlcnNOc107IFxuXG4gICAgICAgIHJldHVybiBfLmluZGV4T2YoX2hpZ2hsaWdodGVycywgdGhpcyk7XG4gICAgfSxcbn0pO1xuXG5cblxuLyoqXG4gKiBDU1NJbnNwZWN0b3IgcHJveHkgbWV0aG9kc1xuICovXG52YXIgQ1NTX0lOU1BFQ1RPUl9QUk9YWV9NRVRIT0RTID0gW1xuICAgICdnZXRDU1NSdWxlcycsXG4gICAgJ2dldENTU1NlbGVjdG9ycycsXG4gICAgJ2dldENTU1Byb3BlcnRpZXMnLFxuICAgICdnZXRDU1NTZWxlY3RvclNwZWNpZmljaXR5Jyxcbl07XG5cbkNTU19JTlNQRUNUT1JfUFJPWFlfTUVUSE9EUy5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2ROYW1lKSB7XG4gICAgSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAvLyBzZXQgdGhlIHRhcmdldCBvZiB0aGUgX2Nzc0luc3BlY3RvclxuICAgICAgICB0aGlzLl9jc3NJbnNwZWN0b3Iuc2V0VGFyZ2V0KHRoaXMuZWxlbWVudC50YXJnZXQpO1xuICAgICAgICByZXR1cm4gdGhpcy5fY3NzSW5zcGVjdG9yW21ldGhvZE5hbWVdKG9wdGlvbnMpO1xuICAgIH07XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlclNjb3BlOyIsIi8qKlxuICogTGlzdCBvZiBvcGVyYXRpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCB2aWEgd2luZG93LnBvc3RNZXNzYWdlXG4gKiBmcm9tIHRoZSBvdXRlciB3b3JsZC5cbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmV4cG9ydHMub3BlcmF0aW9uV2hpdGVsaXN0ID0ge1xuICAgICdoaWdobGlnaHRFbGVtZW50QXRQb2ludCc6IHRydWUsXG4gICAgJ3VuSGlnaGxpZ2h0JzogdHJ1ZSxcbiAgICAnZ2V0QWN0aXZlRWxlbWVudERhdGEnOiB0cnVlLFxuICAgICdzY3JvbGxCeSc6IHRydWUsXG4gICAgJ2FyZUZvY3VzQW5kSG92ZXJUb2dldGhlcic6IHRydWUsXG4gICAgJ2FjdGl2YXRlTG9hZGluZyc6IHRydWUsXG4gICAgJ2RlYWN0aXZhdGVMb2FkaW5nJzogdHJ1ZSxcbiAgICAnZXhlY3V0ZUhpZ2hsaWdodGVyT3BlcmF0aW9uJzogdHJ1ZVxufTtcblxuLyoqXG4gKiBOYW1lIG9mIHRoZSBwcm9wZXJ0eSBhdCB3aGljaCBoaWdobGlnaGVycyB3aWxsIGJlIHN0b3JlZC5cbiAqIEB0eXBlIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuaGlnaGxpZ2h0ZXJzTnMgPSAnX2hpZ2hsaWdodGVycyc7XG4iXX0=

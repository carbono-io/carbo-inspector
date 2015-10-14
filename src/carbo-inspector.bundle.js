(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
var ManipulationBehavior   = require('./scripts/behaviors/manipulation');
var HighlightingBehavior   = require('./scripts/behaviors/highlighting');
var CanvasBehavior         = require('./scripts/behaviors/canvas');

/**
 * Register the carbo-inspector element
 */
Polymer({
    is: 'carbo-inspector',

    behaviors: [
        FrameMessagingBehavior,
        AnalysisBehavior,
        ManipulationBehavior,
        HighlightingBehavior,
        CanvasBehavior,
    ],

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
        var hlt = _.find(this[CONSTANTS.highlightersNs], function (hlt) {
            return hlt.id === highlighterId;
        });

        if (!hlt) {
            throw new Error('Could not find `' + highlighterId + '` highlighter.');
        }

        return hlt;
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
},{"./scripts/behaviors/analysis":3,"./scripts/behaviors/canvas":4,"./scripts/behaviors/frame-messaging":5,"./scripts/behaviors/highlighting":6,"./scripts/behaviors/manipulation":7,"./scripts/classes/highlighter-scope":8,"./scripts/constants":9}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
'use strict';

/**
 * Implements analysis related methods
 */

var DOMHelpers = require('../aux/dom');

/**
 * Auxiliary function that retrieves data for a given element
 * @param  {DOMElementNode} element Element from which data should be read
 * @return {POJO}           data object
 */
function _getElementData(element) {

    var data = {
        tagName: element.tagName,
        attributes: DOMHelpers.getAttributes(element),
    };

    if (element.getBoundingClientRect) {
        // get the boundingRect
        var boundingRect = element.getBoundingClientRect();

        data.rect = {
            top: boundingRect.top,
            bottom: boundingRect.bottom,
            left: boundingRect.left,
            right: boundingRect.right,
            width: boundingRect.width,
            height: boundingRect.height,
        };
    }

    // computedStyle: DOMHelpers.getComputedStyle(element),

    return data;
}

/**
 * Retrieves data for an array of elements
 * @param  {CSSSelector|DOMElementNodeList|Array} elements
 *         Either a css selector or an list of elements
 * @return {Array -> ElementData}
 *         Array of element data objects
 */
exports.getElementsData = function (elements) {

    // convert elements into an elements array
    if (typeof elements === 'string') {
        // elements is a CSSSelector
        elements = document.querySelectorAll(elements);

        // convert into array
        elements = Array.prototype.slice.call(elements, 0);

    } else if (!_.isArray(elements)) {
        // probably NodeList
        // https://developer.mozilla.org/en/docs/Web/API/NodeList
        elements = Array.prototype.slice.call(elements, 0);
    }

    // loop through elements and return array of data
    return elements.map(_getElementData);
};

// https://developer.mozilla.org/en/docs/Web/API/Node
var NODE_TYPES = {
    '1': 'ELEMENT_NODE',
    '2': 'ATTRIBUTE_NODE',
    '3': 'TEXT_NODE',
    '4': 'CDATA_SECTION_NODE',
    '5': 'ENTITY_REFERENCE_NODE',
    '6': 'ENTITY_NODE',
    '7': 'PROCESSING_INSTRUCTION_NODE',
    '8': 'COMMENT_NODE',
    '9': 'DOCUMENT_NODE',
    '10': 'DOCUMENT_TYPE_NODE',
    '11': 'DOCUMENT_FRAGMENT_NODE',
    '12': 'NOTATION_NODE'
};

var ELEMENT_NODE_TYPES = [1];

/**
 * Auxiliary function
 */
function _getElementTreeData(node, filterFn) {

    if (node.nodeType === 1) {
        // If node is not an element, return null
        return null;
    }

    var elementData = _getElementData(node);

    // children
    elementData.childNodes = [];

    // Use Polymer.dom API to normalize shady/shadow dom.
    Polymer.dom(node).childNodes.forEach(function (child) {

        var childNodeData = _getElementTreeData(child, filterFn);

        if (childNodeData) {
            // only push to childNodes if is not null
            
            // check if there is a filter function
            // pass the node to the filterFn
            if (!filterFn || filterFn(child)) {
                elementData.childNodes.push(childNodeData);
            } 
        }

    });

    return elementData;
}

/**
 * Retrieves the nodes tree for a given root and a tree node selector
 * @param  {CSSSelector|Node} root   The root at which start looking for nodes
 * @param  {CSSSelector} filterFn 
 *     A CSS selector string to check if a node
 *     should be in the tree or not.
 * @return {POJO}                  The tree in a plain js object (may be JSON.stringified)
 */
exports.getElementTreeData = function (root, filterFn) {

    root = _.isString(root) ? document.querySelector(root) : root;

    return _getElementTreeData(root, filterFn);

};
},{"../aux/dom":2}],4:[function(require,module,exports){
'use strict';

/**
 * Implements behaviors only valid for canvas usage.
 */

/**
 * Activates the loading highlighter
 */
exports.activateLoading = function (targetSelector) {
    var element = document.querySelector(targetSelector);
    this.$.loading.highlight(element);
};

/**
 * Deactivates the loading highlighter
 */
exports.deactivateLoading = function () {
    this.$.loading.hide();
};

},{}],5:[function(require,module,exports){
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
        throw new Error('Operation `' + request.operation + '` is not available at inspector');
    }
};
},{"../constants":9}],6:[function(require,module,exports){
'use strict';

/**
 * Implements highlighting related methods
 */

/**
 * Highlights the element at a given point
 * @param {String} highlighterId
 * @param {Object{ x: Number, y: Number}} 
 *         point The point at which the element to be highlighted is
 */
exports.highlightElementAtPoint = function (highlighterId, point) {
    // get element to be highlighted
    var element = document.elementFromPoint(point.x, point.y);

    var hlt = this.getHighlighter(highlighterId);

    hlt.highlight(element);
};

/**
 * Highlights the element for a given selector.
 * If the selector retrieves multiple elements, considers only the 
 * first, as the `document.querySelector` implements.
 * 
 * @param  {String} highlighterId Identifier of the highlighter to be used
 * @param  {String} selector      CSS Selector
 */
exports.highlightElementForSelector = function (highlighterId, selector) {
    var element = document.querySelector(selector);

    var hlt = this.getHighlighter(highlighterId);

    hlt.highlight(element);
};

/**
 * Unhighlights
 */
exports.unHighlight = function (highlighterId) {

    console.warn('<carbo-inspector>.unHighlight deprecated');

    var hlt = this.getHighlighter(highlighterId);

    hlt.hide();
};

/**
 * Hides a given highlighter
 * @param  {String} highlighterId Identifier for the highlighter
 */
exports.hideHighlighter = function (highlighterId) {
    var hlt = this.getHighlighter(highlighterId);

    hlt.hide();
};

/**
 * Shows a given highlighter
 * @param  {String} highlighterId Identifier for the highlighter
 */
exports.showHighlighter = function (highlighterId) {
    var hlt = this.getHighlighter(highlighterId);

    hlt.show();
};

/**
 * Retrieves information about the active element.
 * @param {String} highlighterId 
 *        the id of the highlighter
 * @return {{tagName: String, attributes: Object, computedStyle: Object }Object} 
 *         Data on the current active element.
 */
exports.getHighlighterTargetData = function (highlighterId) {
    var hlt = this.getHighlighter(highlighterId);

    if (!hlt.target) {
        return false;
    }

    return this.getElementsData([hlt.target])[0];
};

/**
 * Retrieves data for children of the highlighter target
 * @param  {String} highlighterId
 *         Identifier of the highlighter
 * @param  {CSSSelector} childrenSelector
 *         CSS Selector for the child tags
 * @return {Array -> POJO}
 *         Array of data objects
 */
exports.getHighlighterTargetChildrenData = function (highlighterId, childrenSelector) {
    var hlt = this.getHighlighter(highlighterId);

    if (!hlt.target) {
        return [];
    }

    var children = hlt.target.querySelectorAll(childrenSelector);

    return this.getElementsData(children);
};

},{}],7:[function(require,module,exports){
'use strict';

/**
 * Implements application manipulation methods
 */

/**
 * Replaces the innerHTML of an element selected by CSSSelector
 * @param  {CSSSelector|DOMElementNode} element 
 * @param  {HTMLString} contents 
 */
exports.replaceInnerHTML = function (element, contents) {

    // convert element into an element
    element = (typeof element === 'string') ? document.querySelector(element) : element;

    Polymer.dom(element).innerHTML = contents;
};

},{}],8:[function(require,module,exports){
/**
 * Class that is responsible for encapsulating scope 
 * for each of the highlighter elements within.
 */

var CONSTANTS      = require('../constants');
var highlightersNs = CONSTANTS.highlightersNs;

var DOMHelpers = require('../aux/dom');


// Load internal dependencies
// var CSSInspector = require('./css-inspector');

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
    // this._cssInspector = new CSSInspector();
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
 * Proxies the <carbo-highlighter>.show method
 */
HighlighterScope.prototype.show = function () {
    if (!this.element) {
        throw new Error('No element for HighlighterScope');
    }

    this.element.show();
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
            // computedStyle: DOMHelpers.getComputedStyle(target),
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
 * Returns the data on 
 * @return {Boolean} Whether the targetElement matches a given selector
 */
HighlighterScope.prototype.doesTargetMatchSelector = function (selector) {
    return this.elements.target.matches(selector);
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
// var CSS_INSPECTOR_PROXY_METHODS = [
//     'getCSSRules',
//     'getCSSSelectors',
//     'getCSSProperties',
//     'getCSSSelectorSpecificity',
// ];

// CSS_INSPECTOR_PROXY_METHODS.forEach(function (methodName) {
//     HighlighterScope.prototype[methodName] = function (options) {
//         // set the target of the _cssInspector
//         this._cssInspector.setTarget(this.element.target);
//         return this._cssInspector[methodName](options);
//     };
// });

module.exports = HighlighterScope;
},{"../aux/dom":2,"../constants":9}],9:[function(require,module,exports){
'use strict';

/**
 * List of operations that can be called via window.postMessage
 * from the outer world.
 * @type {Object}
 */
exports.operationWhitelist = {
    // general
    createHighlighter: true,

    // highlighting
    highlightElementAtPoint: true,
    highlightElementForSelector: true,
    unHighlight: true,
    hideHighlighter: true,
    showHighlighter: true,
    getHighlighterTargetData: true,
    getHighlighterTargetChildrenData: true,

    // manipulation
    replaceInnerHTML: true,

    // analysis
    getElementsData: true,
    getElementTreeData: true,

    // 
    getActiveElementData: true,
    scrollBy: true,
    areFocusAndHoverTogether: true,
    activateLoading: true,
    deactivateLoading: true,
    executeHighlighterOperation: true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

},{}]},{},[1]);

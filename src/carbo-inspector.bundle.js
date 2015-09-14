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
     * Scrolls the window
     * @param  {Number} deltaX
     * @param  {Number} deltaY
     */
    scrollBy: function (deltaX, deltaY) {
        // console.log('scroll x: %s, y: %s', deltaX, deltaY);
        window.scrollBy(deltaX, deltaY);
    },
});
},{"./scripts/behaviors/analysis":3,"./scripts/behaviors/canvas":4,"./scripts/behaviors/frame-messaging":5,"./scripts/classes/highlighter-scope":6,"./scripts/constants":7}],2:[function(require,module,exports){
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
var DOMHelpers = require('../aux/dom');

exports.getElementAtPoint = function (point) {

}
},{"../aux/dom":2}],4:[function(require,module,exports){
/**
 * Implements behaviors only valid for canvas usage.
 *
 * Kind of emergency :)
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
},{}],5:[function(require,module,exports){
/**
 * Enables messaging between frames
 */

var CONSTANTS = require('../constants');

var FrameMessagingBehavior = {
    /**
     * Method called whenever the component is ready
     */
    ready: function () {
        // Listen to `message` events on the window object.
        // The window is the object that contains the whole application,
        // in the case of the edited application (inside which is the inspector component)
        // it is the `iframe`. 
        // 
        // Only the window receives messages.
        window.addEventListener('message', this.handleFrameRequestMessage.bind(this), false);
    },
    
    /**
     * Handles messages from the parent frame.
     * @param  {Event} event the event object
     */
    handleFrameRequestMessage: function (event) {

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

            // Send message to parent frame passing the request.id
            // so that the parent may resolve to the correct inquiry.
            parent.postMessage(JSON.stringify({
                id: request.id,

                // If there is a method to convert the object into 
                // plain JSON object, do so.
                res: (res !== undefined && res.toPlainObject) ? res.toPlainObject() : res
            }), '*');

        } else {
            throw new Error('Operation %s is not available at inspector', request.operation);
        }
    },
};

module.exports = FrameMessagingBehavior;
},{"../constants":7}],6:[function(require,module,exports){
/**
 * Class that is responsible for encapsulating scope 
 * for each of the highlighter elements within.
 */

var CONSTANTS      = require('../constants');
var highlightersNs = CONSTANTS.highlightersNs;

var DOMHelpers = require('../aux/dom');

/**
 * Class that represents the carbo-highlighter element
 * virtually.
 * @param {Object} [data] Data to be set on the scope
 * @param {<carbo-inspector>} [inspector] The inspector instance
 *                                        the highlighter is owned by.
 */
function HighlighterScope(data, inspector) {

    this.id = _.uniqueId('highlighter_');

    this.inspector = inspector;

    // Get all data
    _.assign(this, data);
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

    return {
        id: this.id
    };
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

module.exports = HighlighterScope;
},{"../aux/dom":2,"../constants":7}],7:[function(require,module,exports){
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
    'deactivateLoading': true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FyYm8taW5zcGVjdG9yLmpzIiwic3JjL3NjcmlwdHMvYXV4L2RvbS5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9hbmFseXNpcy5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9jYW52YXMuanMiLCJzcmMvc2NyaXB0cy9iZWhhdmlvcnMvZnJhbWUtbWVzc2FnaW5nLmpzIiwic3JjL3NjcmlwdHMvY2xhc3Nlcy9oaWdobGlnaHRlci1zY29wZS5qcyIsInNyYy9zY3JpcHRzL2NvbnN0YW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFRoaXMgY29tcG9uZW50IGlzIHJlc3BvbnNpYmxlIGZvciBoaWdobGlnaHRpbmcgdGhlXG4gKiBjb21wb25lbnRzIGluc2lkZSB0aGUgYXBwbGljYXRpb24gYW5kIGNvbW11bmljYXRpbmcgd2l0aCB0aGUgZXh0ZXJuYWwgXG4gKiB3b3JsZCBieSBtZWFucyBvZiB0aGUgYHdpbmRvdy5wb3N0TWVzc2FnZWAgYW5kIFxuICogYHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJylgIG1ldGhvZHMuXG4gKlxuICogSXQgaGFzIGFuZCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlcXVlc3QtcmVzcG9uc2UgbW9kZWwgdGhyb3VnaCB0aGF0IGNoYW5uZWwsIFxuICogZm9yIG1vcmUgaW5mb3JtYXRpb24sIHNlZSBoYW5kbGVGcmFtZVJlcXVlc3RNZXNzYWdlXG4gKiBcbiAqIEBhdXRob3IgU2ltb24gRmFuLCBQYXQgSmVubnksIEx1IEhldWtvXG4gKi9cblxuLyoqXG4gKiBDb25zdGFudHMgdXNlZCB0aHJvdWdob3V0IHRoZSBjb21wb25lbnQgY29kZS5cbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBDT05TVEFOVFMgPSByZXF1aXJlKCcuL3NjcmlwdHMvY29uc3RhbnRzJyk7XG5cbi8qKlxuICogVGhlIGNsYXNzIHRoYXQgZGVmaW5lcyBhIHNjb3BlIGZvciB0aGUgaGlnaGxpZ2h0ZXJzXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKi9cbnZhciBIaWdobGlnaHRlclNjb3BlID0gcmVxdWlyZSgnLi9zY3JpcHRzL2NsYXNzZXMvaGlnaGxpZ2h0ZXItc2NvcGUnKTtcblxuLyoqXG4gKiBCZWhhdmlvcnNcbiAqL1xudmFyIEZyYW1lTWVzc2FnaW5nQmVoYXZpb3IgPSByZXF1aXJlKCcuL3NjcmlwdHMvYmVoYXZpb3JzL2ZyYW1lLW1lc3NhZ2luZycpO1xudmFyIEFuYWx5c2lzQmVoYXZpb3IgICAgICAgPSByZXF1aXJlKCcuL3NjcmlwdHMvYmVoYXZpb3JzL2FuYWx5c2lzJyk7XG52YXIgQ2FudmFzQmVoYXZpb3IgICAgICAgICA9IHJlcXVpcmUoJy4vc2NyaXB0cy9iZWhhdmlvcnMvY2FudmFzJyk7XG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIGNhcmJvLWluc3BlY3RvciBlbGVtZW50XG4gKi9cblBvbHltZXIoe1xuICAgIGlzOiAnY2FyYm8taW5zcGVjdG9yJyxcblxuICAgIGJlaGF2aW9yczogW0ZyYW1lTWVzc2FnaW5nQmVoYXZpb3IsIEFuYWx5c2lzQmVoYXZpb3IsIENhbnZhc0JlaGF2aW9yXSxcblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCBjYWxsZWQgd2hlbmV2ZXIgdGhlIGNvbXBvbmVudCBpcyByZWFkeVxuICAgICAqL1xuICAgIHJlYWR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBcnJheSB0byBzdG9yZSB0aGUgaGlnaGxpZ2h0ZXJzIGNyZWF0ZWRcbiAgICAgICAgICogZm9yIHRoZSBpbnNwZWN0b3IgaW5zdGFuY2UuXG4gICAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXNbQ09OU1RBTlRTLmhpZ2hsaWdodGVyc05zXSA9IFtdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGNhcmJvLWhpZ2hsaWdodGVyXG4gICAgICogZ2l2ZW4gdGhlIG9wdGlvbnMuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIFBhc3NlZCB0byBjYXJiby1oaWdobGlnaHRlci4gQWxzbyB3aWxsIGJlXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgIHNldCBvbiB0aGUgaGlnaGxpZ2h0ZXIgZGF0YSBvYmplY3QuXG4gICAgICogQHJldHVybiB7Q2FyYm9IaWdobGlnaHRlcn0gICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgY3JlYXRlSGlnaGxpZ2h0ZXI6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cbiAgICAgICAgLy8gSGlnaGxpZ2h0ZXIgb2JqZWN0XG4gICAgICAgIHZhciBfaGlnaGxpZ2h0ZXIgPSBuZXcgSGlnaGxpZ2h0ZXJTY29wZShvcHRpb25zLCB0aGlzKTtcblxuICAgICAgICAvLyBVc2luZyB0aGlzIG1lY2hhbmlzbSBvZiBjcmVhdGlvbiBiZWNhdXNlIFBvbHltZXJcbiAgICAgICAgLy8gc3RpbGwgZG9lcyBub3Qgc3VwcG9ydCBkaW5hbWljIGRhdGEtYmluZGluZ1xuICAgICAgICAvLyBXZSBhcmUgdXNpbmcgZG9tLXJlcGVhdCB0byBjcmVhdGVcbiAgICAgICAgLy8gdGhlIF9oaWdobGlnaHRlciBpbnN0YW5jZXMuXG4gICAgICAgIHRoaXMucHVzaChDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnMsIF9oaWdobGlnaHRlcik7XG5cbiAgICAgICAgLy8gRG8gbm90IGZvcmdldCB0byBmbHVzaCBtb2RpZmljYXRpb25zXG4gICAgICAgIC8vIHNvIHRoYXQgd2UgY2FuIHNhZmVseSByZXRyaWV2ZVxuICAgICAgICAvLyB0aGUgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAgICAgICAgUG9seW1lci5kb20uZmx1c2goKTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGhpZ2hsaWdodGVyIGVsZW1lbnQganVzdCBjcmVhdGVkIGFuZFxuICAgICAgICAvLyBzYXZlIHJlZmVyZW5jZSBhdCB0aGUgX2hpZ2hsaWdodGVyIGRhdGEgb2JqZWN0XG4gICAgICAgIF9oaWdobGlnaHRlci5lbGVtZW50ID0gdGhpcy4kJCgnIycgKyBfaGlnaGxpZ2h0ZXIuaWQpO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgdmlydHVhbCBoaWdobGlnaHRlciBvYmplY3RcbiAgICAgICAgcmV0dXJuIF9oaWdobGlnaHRlcjtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIFNjcm9sbHMgdGhlIHdpbmRvd1xuICAgICAqIEBwYXJhbSAge051bWJlcn0gZGVsdGFYXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBkZWx0YVlcbiAgICAgKi9cbiAgICBzY3JvbGxCeTogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdzY3JvbGwgeDogJXMsIHk6ICVzJywgZGVsdGFYLCBkZWx0YVkpO1xuICAgICAgICB3aW5kb3cuc2Nyb2xsQnkoZGVsdGFYLCBkZWx0YVkpO1xuICAgIH0sXG59KTsiLCIvKipcbiAqIEhlbHBlciBtZXRob2RzIGZvciBtYW5pcHVsYXRpbmcgRE9NTm9kZXNcbiAqL1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgY29tcHV0ZWQgc3R5bGUgb2YgYW4gZ2l2ZW4gZWxlbWVudFxuICogQHBhcmFtICB7RE9NTm9kZX0gZWxlbWVudCBUaGUgZWxlbWVudCBmcm9tIHdoaWNoIHRvIHJlYWQgY29tcHV0ZWRTeXRsZXNcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgT2JqZWN0IHdpdGggdGhlIGNvbXB1dGVkIHN0eWxlc1xuICovXG5leHBvcnRzLmdldENvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZWxlbWVudCBmb3IgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KScpO1xuICAgIH1cblxuICAgIHZhciBjcyA9IHt9O1xuXG4gICAgLy8gR2V0IHRoZSBjb21wdXRlZCBjcyBvZiB0aGUgZWxlbWVudFxuICAgIHZhciBfY3MgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcblxuICAgIGZvciAodmFyIGkgPSBfY3MubGVuZ3RoIC0gMTsgaSA+PTA7IGktLSkge1xuICAgICAgICB2YXIgcHJvcCA9IF9jc1tpXTtcblxuICAgICAgICBjc1twcm9wXSA9IF9jcy5nZXRQcm9wZXJ0eVZhbHVlKHByb3ApO1xuICAgIH1cblxuICAgIHJldHVybiBjcztcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBhdHRyaWJ1dGVzIG9mIGEgZ2l2ZW4gZWxlbWVudFxuICogQHBhcmFtICB7RE9NTm9kZX0gZWxlbWVudCBUaGUgZWxlbWVudCBmcm9tIHdoaWNoIHRvIHJlYWQgYXR0cmlidXRlc1xuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICBPYmplY3Qgd2l0aCBhbGwgYXR0cmlidXRlc1xuICovXG5leHBvcnRzLmdldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZWxlbWVudCBmb3IgZ2V0QXR0cmlidXRlcyhlbGVtZW50KScpO1xuICAgIH1cblxuICAgIC8vIE9iamVjdCBvbiB3aGljaCB0byBzdG9yZSBhdHRyaWJ1dGVzXG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcblxuICAgIHZhciBfYXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG5cbiAgICBmb3IgKHZhciBpID0gX2F0dHJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNbX2F0dHJzW2ldLm5hbWVdID0gX2F0dHJzW2ldLnZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xufTsiLCJ2YXIgRE9NSGVscGVycyA9IHJlcXVpcmUoJy4uL2F1eC9kb20nKTtcblxuZXhwb3J0cy5nZXRFbGVtZW50QXRQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXG59IiwiLyoqXG4gKiBJbXBsZW1lbnRzIGJlaGF2aW9ycyBvbmx5IHZhbGlkIGZvciBjYW52YXMgdXNhZ2UuXG4gKlxuICogS2luZCBvZiBlbWVyZ2VuY3kgOilcbiAqL1xuXG5leHBvcnRzLmF0dGFjaGVkID0gZnVuY3Rpb24gKCkge1xuXG5cbiAgICB0aGlzLl9jYW52YXMgPSB7XG5cbiAgICAgICAgaGlnaGxpZ2h0ZXJzOiB7XG4gICAgICAgICAgICBob3ZlcjogdGhpcy5jcmVhdGVIaWdobGlnaHRlcih7XG4gICAgICAgICAgICAgICAgc3VyZmFjZVN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzNweCBkYXNoZWQgZ3JlZW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgIGZvY3VzOiB0aGlzLmNyZWF0ZUhpZ2hsaWdodGVyKHtcbiAgICAgICAgICAgICAgICBzdXJmYWNlU3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnM3B4IHNvbGlkIGdyZWVuJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuXG4gICAgICAgICAgICBsb2FkaW5nOiB0aGlzLmNyZWF0ZUhpZ2hsaWdodGVyKHtcbiAgICAgICAgICAgICAgICBzdXJmYWNlU3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnZ3JlZW4nLFxuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAnMC4zJyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEhpZ2hsaWdodHMgdGhlIGVsZW1lbnQgYXQgYSBnaXZlbiBwb2ludFxuICogQHBhcmFtIHtPYmplY3R7IHg6IE51bWJlciwgeTogTnVtYmVyfX0gXG4gKiAgICAgICAgIHBvaW50IFRoZSBwb2ludCBhdCB3aGljaCB0aGUgZWxlbWVudCB0byBiZSBoaWdobGlnaHRlZCBpc1xuICogQHBhcmFtIHtCb29sZWFufSBmb3JjZVxuICovXG5leHBvcnRzLmhpZ2hsaWdodEVsZW1lbnRBdFBvaW50ID0gZnVuY3Rpb24gKGhpZ2hsaWdodGVyLCBwb2ludCwgZm9yY2UpIHtcbiAgICAvLyBnZXQgaG92ZXJlZCBjb21wb25lbnQgKEVsZW1lbnQgdW5kZXIgdGhhdCBwb3NpdGlvbilcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQocG9pbnQueCwgcG9pbnQueSk7XG5cbiAgICB2YXIgaGx0ID0gdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVyc1toaWdobGlnaHRlcl07XG5cbiAgICBobHQuaGlnaGxpZ2h0KGVsZW1lbnQpO1xufTtcblxuLyoqXG4gKiBVbmhpZ2hsaWdodHNcbiAqL1xuZXhwb3J0cy51bkhpZ2hsaWdodCA9IGZ1bmN0aW9uIChoaWdobGlnaHRlcikge1xuICAgIHZhciBobHQgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzW2hpZ2hsaWdodGVyXTtcblxuICAgIGhsdC5oaWRlKCk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWN0aXZlIGVsZW1lbnQuXG4gKiBAcmV0dXJuIHt7dGFnTmFtZTogU3RyaW5nLCBhdHRyaWJ1dGVzOiBPYmplY3QsIGNvbXB1dGVkU3R5bGU6IE9iamVjdCB9T2JqZWN0fSBcbiAqICAgICAgICAgRGF0YSBvbiB0aGUgY3VycmVudCBhY3RpdmUgZWxlbWVudC5cbiAqL1xuZXhwb3J0cy5nZXRBY3RpdmVFbGVtZW50RGF0YSA9IGZ1bmN0aW9uIChoaWdobGlnaHRlcikge1xuXG4gICAgdmFyIGhsdCA9IHRoaXMuX2NhbnZhcy5oaWdobGlnaHRlcnNbaGlnaGxpZ2h0ZXJdO1xuXG4gICAgcmV0dXJuIGhsdC5nZXRUYXJnZXREYXRhKCk7XG59O1xuXG5cbmV4cG9ydHMuYXJlRm9jdXNBbmRIb3ZlclRvZ2V0aGVyID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGZvY3VzID0gdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVycy5mb2N1cztcbiAgICB2YXIgaG92ZXIgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzLmhvdmVyO1xuXG4gICAgcmV0dXJuIGZvY3VzLnRhcmdldCA9PT0gaG92ZXIudGFyZ2V0O1xufTtcblxuZXhwb3J0cy5hY3RpdmF0ZUxvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgaGx0ID0gdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVycy5mb2N1cztcblxuICAgIHRoaXMuJC5sb2FkaW5nLmhpZ2hsaWdodChobHQudGFyZ2V0KTtcbn07XG5cbmV4cG9ydHMuZGVhY3RpdmF0ZUxvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy4kLmxvYWRpbmcuaGlkZSgpO1xufTsiLCIvKipcbiAqIEVuYWJsZXMgbWVzc2FnaW5nIGJldHdlZW4gZnJhbWVzXG4gKi9cblxudmFyIENPTlNUQU5UUyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cycpO1xuXG52YXIgRnJhbWVNZXNzYWdpbmdCZWhhdmlvciA9IHtcbiAgICAvKipcbiAgICAgKiBNZXRob2QgY2FsbGVkIHdoZW5ldmVyIHRoZSBjb21wb25lbnQgaXMgcmVhZHlcbiAgICAgKi9cbiAgICByZWFkeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBMaXN0ZW4gdG8gYG1lc3NhZ2VgIGV2ZW50cyBvbiB0aGUgd2luZG93IG9iamVjdC5cbiAgICAgICAgLy8gVGhlIHdpbmRvdyBpcyB0aGUgb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIHdob2xlIGFwcGxpY2F0aW9uLFxuICAgICAgICAvLyBpbiB0aGUgY2FzZSBvZiB0aGUgZWRpdGVkIGFwcGxpY2F0aW9uIChpbnNpZGUgd2hpY2ggaXMgdGhlIGluc3BlY3RvciBjb21wb25lbnQpXG4gICAgICAgIC8vIGl0IGlzIHRoZSBgaWZyYW1lYC4gXG4gICAgICAgIC8vIFxuICAgICAgICAvLyBPbmx5IHRoZSB3aW5kb3cgcmVjZWl2ZXMgbWVzc2FnZXMuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5oYW5kbGVGcmFtZVJlcXVlc3RNZXNzYWdlLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgbWVzc2FnZXMgZnJvbSB0aGUgcGFyZW50IGZyYW1lLlxuICAgICAqIEBwYXJhbSAge0V2ZW50fSBldmVudCB0aGUgZXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgaGFuZGxlRnJhbWVSZXF1ZXN0TWVzc2FnZTogZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgLy8gbcOpdG9kbyBKU09OLnBhcnNlKCkgY29udmVydGUgc3RyaW5nIHBhcmEgSlNPTlxuICAgICAgICB2YXIgcmVxdWVzdCA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIG9wZXJhdGlvbk5hbWUgaXMgd2hpdGVsaXN0ZWRcbiAgICAgICAgLy8gTm90IGFsbCBtZXRob2RzIG9uIHRoZSBpbnNwZWN0b3Igb2JqZWN0IHNob3VsZCBiZVxuICAgICAgICAvLyBhdmFpbGFibGUgZm9yIG91dHNpZGUgdXNlIGZvciBzZWN1cml0eSByZWFzb25zLlxuICAgICAgICAvLyBUaHVzIHdlIHNob3VsZCB3aGl0ZWxpc3QgdGhlIGF2YWlsYWJsZSBtZXRob2RzXG4gICAgICAgIHZhciBvcGVyYXRpb25XaGl0ZWxpc3RlZCA9IENPTlNUQU5UUy5vcGVyYXRpb25XaGl0ZWxpc3RbcmVxdWVzdC5vcGVyYXRpb25dOyBcblxuICAgICAgICBpZiAob3BlcmF0aW9uV2hpdGVsaXN0ZWQpIHtcbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIG9wZXJhdGlvbiBhbmQgc3RvcmUgdGhlIHJlc3VsdFxuICAgICAgICAgICAgdmFyIHJlcyA9IHRoaXNbcmVxdWVzdC5vcGVyYXRpb25dLmFwcGx5KHRoaXMsIHJlcXVlc3QuYXJncyk7XG5cbiAgICAgICAgICAgIC8vIFNlbmQgbWVzc2FnZSB0byBwYXJlbnQgZnJhbWUgcGFzc2luZyB0aGUgcmVxdWVzdC5pZFxuICAgICAgICAgICAgLy8gc28gdGhhdCB0aGUgcGFyZW50IG1heSByZXNvbHZlIHRvIHRoZSBjb3JyZWN0IGlucXVpcnkuXG4gICAgICAgICAgICBwYXJlbnQucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGlkOiByZXF1ZXN0LmlkLFxuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBtZXRob2QgdG8gY29udmVydCB0aGUgb2JqZWN0IGludG8gXG4gICAgICAgICAgICAgICAgLy8gcGxhaW4gSlNPTiBvYmplY3QsIGRvIHNvLlxuICAgICAgICAgICAgICAgIHJlczogKHJlcyAhPT0gdW5kZWZpbmVkICYmIHJlcy50b1BsYWluT2JqZWN0KSA/IHJlcy50b1BsYWluT2JqZWN0KCkgOiByZXNcbiAgICAgICAgICAgIH0pLCAnKicpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09wZXJhdGlvbiAlcyBpcyBub3QgYXZhaWxhYmxlIGF0IGluc3BlY3RvcicsIHJlcXVlc3Qub3BlcmF0aW9uKTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lTWVzc2FnaW5nQmVoYXZpb3I7IiwiLyoqXG4gKiBDbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBlbmNhcHN1bGF0aW5nIHNjb3BlIFxuICogZm9yIGVhY2ggb2YgdGhlIGhpZ2hsaWdodGVyIGVsZW1lbnRzIHdpdGhpbi5cbiAqL1xuXG52YXIgQ09OU1RBTlRTICAgICAgPSByZXF1aXJlKCcuLi9jb25zdGFudHMnKTtcbnZhciBoaWdobGlnaHRlcnNOcyA9IENPTlNUQU5UUy5oaWdobGlnaHRlcnNOcztcblxudmFyIERPTUhlbHBlcnMgPSByZXF1aXJlKCcuLi9hdXgvZG9tJyk7XG5cbi8qKlxuICogQ2xhc3MgdGhhdCByZXByZXNlbnRzIHRoZSBjYXJiby1oaWdobGlnaHRlciBlbGVtZW50XG4gKiB2aXJ0dWFsbHkuXG4gKiBAcGFyYW0ge09iamVjdH0gW2RhdGFdIERhdGEgdG8gYmUgc2V0IG9uIHRoZSBzY29wZVxuICogQHBhcmFtIHs8Y2FyYm8taW5zcGVjdG9yPn0gW2luc3BlY3Rvcl0gVGhlIGluc3BlY3RvciBpbnN0YW5jZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGhpZ2hsaWdodGVyIGlzIG93bmVkIGJ5LlxuICovXG5mdW5jdGlvbiBIaWdobGlnaHRlclNjb3BlKGRhdGEsIGluc3BlY3Rvcikge1xuXG4gICAgdGhpcy5pZCA9IF8udW5pcXVlSWQoJ2hpZ2hsaWdodGVyXycpO1xuXG4gICAgdGhpcy5pbnNwZWN0b3IgPSBpbnNwZWN0b3I7XG5cbiAgICAvLyBHZXQgYWxsIGRhdGFcbiAgICBfLmFzc2lnbih0aGlzLCBkYXRhKTtcbn1cblxuLyoqXG4gKiBQcm94aWVzIDxjYXJiby1oaWdobGlnaHRlcj4uaGlnaGxpZ2h0IG1ldGhvZFxuICogQHBhcmFtICB7Tm9kZX0gZWxlbWVudCBOb2RlIHRvIGJlIGhpZ2hsaWdodGVkXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgXG4gKi9cbkhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG5cbiAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIEhpZ2hsaWdodGVyU2NvcGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldCgnZWxlbWVudExhYmVsJywgZWxlbWVudC50YWdOYW1lKTtcblxuICAgIHRoaXMuZWxlbWVudC5oaWdobGlnaHQoZWxlbWVudCwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIFByb3hpZXMgdGhlIDxjYXJiby1oaWdobGlnaHRlcj4uaGlkZSBtZXRob2RcbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIEhpZ2hsaWdodGVyU2NvcGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQuaGlkZSgpO1xufTtcblxuLyoqXG4gKiBIZWxwZXIgbWV0aG9kIHRvIHNldCBkYXRhIHVzaW5nIHBvbHltZXIgc3R1ZmZcbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHByb3BlcnR5LCB2YWx1ZSkge1xuXG4gICAgdmFyIHBhdGggPSBoaWdobGlnaHRlcnNOcyArICcuJyArIHRoaXMuaW5kZXggKyAnLicgKyBwcm9wZXJ0eTtcblxuICAgIHRoaXMuaW5zcGVjdG9yLnNldChwYXRoLCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBkYXRhIGFib3V0IHRoZSBlbGVtdG5cbiAqIEByZXR1cm4ge09iamVjdH0gW2Rlc2NyaXB0aW9uXVxuICovXG5IaWdobGlnaHRlclNjb3BlLnByb3RvdHlwZS5nZXRUYXJnZXREYXRhID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIHRhcmdldCA9IHRoaXMuZWxlbWVudC50YXJnZXQ7XG4gICAgdmFyIGRhdGE7XG5cbiAgICBpZiAodGFyZ2V0KSB7XG5cbiAgICAgICAgdmFyIGJvdW5kaW5nUmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgdGFnTmFtZTogdGFyZ2V0LnRhZ05hbWUsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBET01IZWxwZXJzLmdldEF0dHJpYnV0ZXModGFyZ2V0KSxcbiAgICAgICAgICAgIGNvbXB1dGVkU3R5bGU6IERPTUhlbHBlcnMuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpLFxuICAgICAgICAgICAgcmVjdDoge1xuICAgICAgICAgICAgICAgIHRvcDogYm91bmRpbmdSZWN0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBib3VuZGluZ1JlY3QubGVmdCxcbiAgICAgICAgICAgICAgICB3aWR0aDogYm91bmRpbmdSZWN0LndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYm91bmRpbmdSZWN0LmhlaWdodCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBzY29wZSBkYXRhIGludG8gYSBwbGFpbiBvYmplY3QgcmVhZHkgZm9yIFxuICogSlNPTiBzdHJpbmdpZmljYXRpb25cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUudG9QbGFpbk9iamVjdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiB0aGlzLmlkXG4gICAgfTtcbn07XG5cbi8qKlxuICogRGVmaW5lIHRoZSBpbmRleCBwcm9wZXJ0eVxuICogd2hpY2ggd2lsbCBqdXN0IHBvaW50IHRvIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgaGlnaGxpZ2h0ZXIgc2NvcGVcbiAqIGlzIHN0b3JlZCBhdCB0aGUgaW5zcGVjdG9yIG9iamVjdC5cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLCAnaW5kZXgnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIF9oaWdobGlnaHRlcnMgPSB0aGlzLmluc3BlY3RvcltDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnNdOyBcblxuICAgICAgICByZXR1cm4gXy5pbmRleE9mKF9oaWdobGlnaHRlcnMsIHRoaXMpO1xuICAgIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlclNjb3BlOyIsIi8qKlxuICogTGlzdCBvZiBvcGVyYXRpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCB2aWEgd2luZG93LnBvc3RNZXNzYWdlXG4gKiBmcm9tIHRoZSBvdXRlciB3b3JsZC5cbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmV4cG9ydHMub3BlcmF0aW9uV2hpdGVsaXN0ID0ge1xuICAgICdoaWdobGlnaHRFbGVtZW50QXRQb2ludCc6IHRydWUsXG4gICAgJ3VuSGlnaGxpZ2h0JzogdHJ1ZSxcbiAgICAnZ2V0QWN0aXZlRWxlbWVudERhdGEnOiB0cnVlLFxuICAgICdzY3JvbGxCeSc6IHRydWUsXG4gICAgJ2FyZUZvY3VzQW5kSG92ZXJUb2dldGhlcic6IHRydWUsXG4gICAgJ2FjdGl2YXRlTG9hZGluZyc6IHRydWUsXG4gICAgJ2RlYWN0aXZhdGVMb2FkaW5nJzogdHJ1ZVxufTtcblxuLyoqXG4gKiBOYW1lIG9mIHRoZSBwcm9wZXJ0eSBhdCB3aGljaCBoaWdobGlnaGVycyB3aWxsIGJlIHN0b3JlZC5cbiAqIEB0eXBlIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuaGlnaGxpZ2h0ZXJzTnMgPSAnX2hpZ2hsaWdodGVycyc7XG4iXX0=

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
            })
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
    'areFocusAndHoverTogether': true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FyYm8taW5zcGVjdG9yLmpzIiwic3JjL3NjcmlwdHMvYXV4L2RvbS5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9hbmFseXNpcy5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9jYW52YXMuanMiLCJzcmMvc2NyaXB0cy9iZWhhdmlvcnMvZnJhbWUtbWVzc2FnaW5nLmpzIiwic3JjL3NjcmlwdHMvY2xhc3Nlcy9oaWdobGlnaHRlci1zY29wZS5qcyIsInNyYy9zY3JpcHRzL2NvbnN0YW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogVGhpcyBjb21wb25lbnQgaXMgcmVzcG9uc2libGUgZm9yIGhpZ2hsaWdodGluZyB0aGVcbiAqIGNvbXBvbmVudHMgaW5zaWRlIHRoZSBhcHBsaWNhdGlvbiBhbmQgY29tbXVuaWNhdGluZyB3aXRoIHRoZSBleHRlcm5hbCBcbiAqIHdvcmxkIGJ5IG1lYW5zIG9mIHRoZSBgd2luZG93LnBvc3RNZXNzYWdlYCBhbmQgXG4gKiBgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnKWAgbWV0aG9kcy5cbiAqXG4gKiBJdCBoYXMgYW5kIGltcGxlbWVudGF0aW9uIG9mIGEgcmVxdWVzdC1yZXNwb25zZSBtb2RlbCB0aHJvdWdoIHRoYXQgY2hhbm5lbCwgXG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlIGhhbmRsZUZyYW1lUmVxdWVzdE1lc3NhZ2VcbiAqIFxuICogQGF1dGhvciBTaW1vbiBGYW4sIFBhdCBKZW5ueSwgTHUgSGV1a29cbiAqL1xuXG4vKipcbiAqIENvbnN0YW50cyB1c2VkIHRocm91Z2hvdXQgdGhlIGNvbXBvbmVudCBjb2RlLlxuICogQHR5cGUge09iamVjdH1cbiAqL1xudmFyIENPTlNUQU5UUyA9IHJlcXVpcmUoJy4vc2NyaXB0cy9jb25zdGFudHMnKTtcblxuLyoqXG4gKiBUaGUgY2xhc3MgdGhhdCBkZWZpbmVzIGEgc2NvcGUgZm9yIHRoZSBoaWdobGlnaHRlcnNcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqL1xudmFyIEhpZ2hsaWdodGVyU2NvcGUgPSByZXF1aXJlKCcuL3NjcmlwdHMvY2xhc3Nlcy9oaWdobGlnaHRlci1zY29wZScpO1xuXG4vKipcbiAqIEJlaGF2aW9yc1xuICovXG52YXIgRnJhbWVNZXNzYWdpbmdCZWhhdmlvciA9IHJlcXVpcmUoJy4vc2NyaXB0cy9iZWhhdmlvcnMvZnJhbWUtbWVzc2FnaW5nJyk7XG52YXIgQW5hbHlzaXNCZWhhdmlvciAgICAgICA9IHJlcXVpcmUoJy4vc2NyaXB0cy9iZWhhdmlvcnMvYW5hbHlzaXMnKTtcbnZhciBDYW52YXNCZWhhdmlvciAgICAgICAgID0gcmVxdWlyZSgnLi9zY3JpcHRzL2JlaGF2aW9ycy9jYW52YXMnKTtcblxuLyoqXG4gKiBSZWdpc3RlciB0aGUgY2FyYm8taW5zcGVjdG9yIGVsZW1lbnRcbiAqL1xuUG9seW1lcih7XG4gICAgaXM6ICdjYXJiby1pbnNwZWN0b3InLFxuXG4gICAgYmVoYXZpb3JzOiBbRnJhbWVNZXNzYWdpbmdCZWhhdmlvciwgQW5hbHlzaXNCZWhhdmlvciwgQ2FudmFzQmVoYXZpb3JdLFxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIGNhbGxlZCB3aGVuZXZlciB0aGUgY29tcG9uZW50IGlzIHJlYWR5XG4gICAgICovXG4gICAgcmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFycmF5IHRvIHN0b3JlIHRoZSBoaWdobGlnaHRlcnMgY3JlYXRlZFxuICAgICAgICAgKiBmb3IgdGhlIGluc3BlY3RvciBpbnN0YW5jZS5cbiAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpc1tDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnNdID0gW107XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgY2FyYm8taGlnaGxpZ2h0ZXJcbiAgICAgKiBnaXZlbiB0aGUgb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgUGFzc2VkIHRvIGNhcmJvLWhpZ2hsaWdodGVyLiBBbHNvIHdpbGwgYmVcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0IG9uIHRoZSBoaWdobGlnaHRlciBkYXRhIG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtDYXJib0hpZ2hsaWdodGVyfSAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBjcmVhdGVIaWdobGlnaHRlcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgICAgICAvLyBIaWdobGlnaHRlciBvYmplY3RcbiAgICAgICAgdmFyIF9oaWdobGlnaHRlciA9IG5ldyBIaWdobGlnaHRlclNjb3BlKG9wdGlvbnMsIHRoaXMpO1xuXG4gICAgICAgIC8vIFVzaW5nIHRoaXMgbWVjaGFuaXNtIG9mIGNyZWF0aW9uIGJlY2F1c2UgUG9seW1lclxuICAgICAgICAvLyBzdGlsbCBkb2VzIG5vdCBzdXBwb3J0IGRpbmFtaWMgZGF0YS1iaW5kaW5nXG4gICAgICAgIC8vIFdlIGFyZSB1c2luZyBkb20tcmVwZWF0IHRvIGNyZWF0ZVxuICAgICAgICAvLyB0aGUgX2hpZ2hsaWdodGVyIGluc3RhbmNlcy5cbiAgICAgICAgdGhpcy5wdXNoKENPTlNUQU5UUy5oaWdobGlnaHRlcnNOcywgX2hpZ2hsaWdodGVyKTtcblxuICAgICAgICAvLyBEbyBub3QgZm9yZ2V0IHRvIGZsdXNoIG1vZGlmaWNhdGlvbnNcbiAgICAgICAgLy8gc28gdGhhdCB3ZSBjYW4gc2FmZWx5IHJldHJpZXZlXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICAgICAgICBQb2x5bWVyLmRvbS5mbHVzaCgpO1xuXG4gICAgICAgIC8vIFNlbGVjdCB0aGUgaGlnaGxpZ2h0ZXIgZWxlbWVudCBqdXN0IGNyZWF0ZWQgYW5kXG4gICAgICAgIC8vIHNhdmUgcmVmZXJlbmNlIGF0IHRoZSBfaGlnaGxpZ2h0ZXIgZGF0YSBvYmplY3RcbiAgICAgICAgX2hpZ2hsaWdodGVyLmVsZW1lbnQgPSB0aGlzLiQkKCcjJyArIF9oaWdobGlnaHRlci5pZCk7XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2aXJ0dWFsIGhpZ2hsaWdodGVyIG9iamVjdFxuICAgICAgICByZXR1cm4gX2hpZ2hsaWdodGVyO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICogU2Nyb2xscyB0aGUgd2luZG93XG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBkZWx0YVhcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGRlbHRhWVxuICAgICAqL1xuICAgIHNjcm9sbEJ5OiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Njcm9sbCB4OiAlcywgeTogJXMnLCBkZWx0YVgsIGRlbHRhWSk7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxCeShkZWx0YVgsIGRlbHRhWSk7XG4gICAgfSxcbn0pOyIsIi8qKlxuICogSGVscGVyIG1ldGhvZHMgZm9yIG1hbmlwdWxhdGluZyBET01Ob2Rlc1xuICovXG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBjb21wdXRlZCBzdHlsZSBvZiBhbiBnaXZlbiBlbGVtZW50XG4gKiBAcGFyYW0gIHtET01Ob2RlfSBlbGVtZW50IFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmVhZCBjb21wdXRlZFN5dGxlc1xuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICBPYmplY3Qgd2l0aCB0aGUgY29tcHV0ZWQgc3R5bGVzXG4gKi9cbmV4cG9ydHMuZ2V0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IGZvciBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpJyk7XG4gICAgfVxuXG4gICAgdmFyIGNzID0ge307XG5cbiAgICAvLyBHZXQgdGhlIGNvbXB1dGVkIGNzIG9mIHRoZSBlbGVtZW50XG4gICAgdmFyIF9jcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuXG4gICAgZm9yICh2YXIgaSA9IF9jcy5sZW5ndGggLSAxOyBpID49MDsgaS0tKSB7XG4gICAgICAgIHZhciBwcm9wID0gX2NzW2ldO1xuXG4gICAgICAgIGNzW3Byb3BdID0gX2NzLmdldFByb3BlcnR5VmFsdWUocHJvcCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNzO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGF0dHJpYnV0ZXMgb2YgYSBnaXZlbiBlbGVtZW50XG4gKiBAcGFyYW0gIHtET01Ob2RlfSBlbGVtZW50IFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmVhZCBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgIE9iamVjdCB3aXRoIGFsbCBhdHRyaWJ1dGVzXG4gKi9cbmV4cG9ydHMuZ2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IGZvciBnZXRBdHRyaWJ1dGVzKGVsZW1lbnQpJyk7XG4gICAgfVxuXG4gICAgLy8gT2JqZWN0IG9uIHdoaWNoIHRvIHN0b3JlIGF0dHJpYnV0ZXNcbiAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgdmFyIF9hdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcblxuICAgIGZvciAodmFyIGkgPSBfYXR0cnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXR0cmlidXRlc1tfYXR0cnNbaV0ubmFtZV0gPSBfYXR0cnNbaV0udmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59OyIsInZhciBET01IZWxwZXJzID0gcmVxdWlyZSgnLi4vYXV4L2RvbScpO1xuXG5leHBvcnRzLmdldEVsZW1lbnRBdFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cbn0iLCIvKipcbiAqIEltcGxlbWVudHMgYmVoYXZpb3JzIG9ubHkgdmFsaWQgZm9yIGNhbnZhcyB1c2FnZS5cbiAqXG4gKiBLaW5kIG9mIGVtZXJnZW5jeSA6KVxuICovXG5cbmV4cG9ydHMuYXR0YWNoZWQgPSBmdW5jdGlvbiAoKSB7XG5cblxuICAgIHRoaXMuX2NhbnZhcyA9IHtcblxuICAgICAgICBoaWdobGlnaHRlcnM6IHtcbiAgICAgICAgICAgIGhvdmVyOiB0aGlzLmNyZWF0ZUhpZ2hsaWdodGVyKHtcbiAgICAgICAgICAgICAgICBzdXJmYWNlU3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnM3B4IGRhc2hlZCBncmVlbidcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgZm9jdXM6IHRoaXMuY3JlYXRlSGlnaGxpZ2h0ZXIoe1xuICAgICAgICAgICAgICAgIHN1cmZhY2VTdHlsZToge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICczcHggc29saWQgZ3JlZW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEhpZ2hsaWdodHMgdGhlIGVsZW1lbnQgYXQgYSBnaXZlbiBwb2ludFxuICogQHBhcmFtIHtPYmplY3R7IHg6IE51bWJlciwgeTogTnVtYmVyfX0gXG4gKiAgICAgICAgIHBvaW50IFRoZSBwb2ludCBhdCB3aGljaCB0aGUgZWxlbWVudCB0byBiZSBoaWdobGlnaHRlZCBpc1xuICogQHBhcmFtIHtCb29sZWFufSBmb3JjZVxuICovXG5leHBvcnRzLmhpZ2hsaWdodEVsZW1lbnRBdFBvaW50ID0gZnVuY3Rpb24gKGhpZ2hsaWdodGVyLCBwb2ludCwgZm9yY2UpIHtcbiAgICAvLyBnZXQgaG92ZXJlZCBjb21wb25lbnQgKEVsZW1lbnQgdW5kZXIgdGhhdCBwb3NpdGlvbilcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQocG9pbnQueCwgcG9pbnQueSk7XG5cbiAgICB2YXIgaGx0ID0gdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVyc1toaWdobGlnaHRlcl07XG5cbiAgICBobHQuaGlnaGxpZ2h0KGVsZW1lbnQpO1xufTtcblxuLyoqXG4gKiBVbmhpZ2hsaWdodHNcbiAqL1xuZXhwb3J0cy51bkhpZ2hsaWdodCA9IGZ1bmN0aW9uIChoaWdobGlnaHRlcikge1xuICAgIHZhciBobHQgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzW2hpZ2hsaWdodGVyXTtcblxuICAgIGhsdC5oaWRlKCk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWN0aXZlIGVsZW1lbnQuXG4gKiBAcmV0dXJuIHt7dGFnTmFtZTogU3RyaW5nLCBhdHRyaWJ1dGVzOiBPYmplY3QsIGNvbXB1dGVkU3R5bGU6IE9iamVjdCB9T2JqZWN0fSBcbiAqICAgICAgICAgRGF0YSBvbiB0aGUgY3VycmVudCBhY3RpdmUgZWxlbWVudC5cbiAqL1xuZXhwb3J0cy5nZXRBY3RpdmVFbGVtZW50RGF0YSA9IGZ1bmN0aW9uIChoaWdobGlnaHRlcikge1xuXG4gICAgdmFyIGhsdCA9IHRoaXMuX2NhbnZhcy5oaWdobGlnaHRlcnNbaGlnaGxpZ2h0ZXJdO1xuXG4gICAgcmV0dXJuIGhsdC5nZXRUYXJnZXREYXRhKCk7XG59O1xuXG5cbmV4cG9ydHMuYXJlRm9jdXNBbmRIb3ZlclRvZ2V0aGVyID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGZvY3VzID0gdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVycy5mb2N1cztcbiAgICB2YXIgaG92ZXIgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzLmhvdmVyO1xuXG4gICAgcmV0dXJuIGZvY3VzLnRhcmdldCA9PT0gaG92ZXIudGFyZ2V0O1xufTsiLCIvKipcbiAqIEVuYWJsZXMgbWVzc2FnaW5nIGJldHdlZW4gZnJhbWVzXG4gKi9cblxudmFyIENPTlNUQU5UUyA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cycpO1xuXG52YXIgRnJhbWVNZXNzYWdpbmdCZWhhdmlvciA9IHtcbiAgICAvKipcbiAgICAgKiBNZXRob2QgY2FsbGVkIHdoZW5ldmVyIHRoZSBjb21wb25lbnQgaXMgcmVhZHlcbiAgICAgKi9cbiAgICByZWFkeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBMaXN0ZW4gdG8gYG1lc3NhZ2VgIGV2ZW50cyBvbiB0aGUgd2luZG93IG9iamVjdC5cbiAgICAgICAgLy8gVGhlIHdpbmRvdyBpcyB0aGUgb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIHdob2xlIGFwcGxpY2F0aW9uLFxuICAgICAgICAvLyBpbiB0aGUgY2FzZSBvZiB0aGUgZWRpdGVkIGFwcGxpY2F0aW9uIChpbnNpZGUgd2hpY2ggaXMgdGhlIGluc3BlY3RvciBjb21wb25lbnQpXG4gICAgICAgIC8vIGl0IGlzIHRoZSBgaWZyYW1lYC4gXG4gICAgICAgIC8vIFxuICAgICAgICAvLyBPbmx5IHRoZSB3aW5kb3cgcmVjZWl2ZXMgbWVzc2FnZXMuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5oYW5kbGVGcmFtZVJlcXVlc3RNZXNzYWdlLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgbWVzc2FnZXMgZnJvbSB0aGUgcGFyZW50IGZyYW1lLlxuICAgICAqIEBwYXJhbSAge0V2ZW50fSBldmVudCB0aGUgZXZlbnQgb2JqZWN0XG4gICAgICovXG4gICAgaGFuZGxlRnJhbWVSZXF1ZXN0TWVzc2FnZTogZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgLy8gbcOpdG9kbyBKU09OLnBhcnNlKCkgY29udmVydGUgc3RyaW5nIHBhcmEgSlNPTlxuICAgICAgICB2YXIgcmVxdWVzdCA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIG9wZXJhdGlvbk5hbWUgaXMgd2hpdGVsaXN0ZWRcbiAgICAgICAgLy8gTm90IGFsbCBtZXRob2RzIG9uIHRoZSBpbnNwZWN0b3Igb2JqZWN0IHNob3VsZCBiZVxuICAgICAgICAvLyBhdmFpbGFibGUgZm9yIG91dHNpZGUgdXNlIGZvciBzZWN1cml0eSByZWFzb25zLlxuICAgICAgICAvLyBUaHVzIHdlIHNob3VsZCB3aGl0ZWxpc3QgdGhlIGF2YWlsYWJsZSBtZXRob2RzXG4gICAgICAgIHZhciBvcGVyYXRpb25XaGl0ZWxpc3RlZCA9IENPTlNUQU5UUy5vcGVyYXRpb25XaGl0ZWxpc3RbcmVxdWVzdC5vcGVyYXRpb25dOyBcblxuICAgICAgICBpZiAob3BlcmF0aW9uV2hpdGVsaXN0ZWQpIHtcbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIG9wZXJhdGlvbiBhbmQgc3RvcmUgdGhlIHJlc3VsdFxuICAgICAgICAgICAgdmFyIHJlcyA9IHRoaXNbcmVxdWVzdC5vcGVyYXRpb25dLmFwcGx5KHRoaXMsIHJlcXVlc3QuYXJncyk7XG5cbiAgICAgICAgICAgIC8vIFNlbmQgbWVzc2FnZSB0byBwYXJlbnQgZnJhbWUgcGFzc2luZyB0aGUgcmVxdWVzdC5pZFxuICAgICAgICAgICAgLy8gc28gdGhhdCB0aGUgcGFyZW50IG1heSByZXNvbHZlIHRvIHRoZSBjb3JyZWN0IGlucXVpcnkuXG4gICAgICAgICAgICBwYXJlbnQucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGlkOiByZXF1ZXN0LmlkLFxuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBtZXRob2QgdG8gY29udmVydCB0aGUgb2JqZWN0IGludG8gXG4gICAgICAgICAgICAgICAgLy8gcGxhaW4gSlNPTiBvYmplY3QsIGRvIHNvLlxuICAgICAgICAgICAgICAgIHJlczogKHJlcyAhPT0gdW5kZWZpbmVkICYmIHJlcy50b1BsYWluT2JqZWN0KSA/IHJlcy50b1BsYWluT2JqZWN0KCkgOiByZXNcbiAgICAgICAgICAgIH0pLCAnKicpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09wZXJhdGlvbiAlcyBpcyBub3QgYXZhaWxhYmxlIGF0IGluc3BlY3RvcicsIHJlcXVlc3Qub3BlcmF0aW9uKTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lTWVzc2FnaW5nQmVoYXZpb3I7IiwiLyoqXG4gKiBDbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBlbmNhcHN1bGF0aW5nIHNjb3BlIFxuICogZm9yIGVhY2ggb2YgdGhlIGhpZ2hsaWdodGVyIGVsZW1lbnRzIHdpdGhpbi5cbiAqL1xuXG52YXIgQ09OU1RBTlRTICAgICAgPSByZXF1aXJlKCcuLi9jb25zdGFudHMnKTtcbnZhciBoaWdobGlnaHRlcnNOcyA9IENPTlNUQU5UUy5oaWdobGlnaHRlcnNOcztcblxudmFyIERPTUhlbHBlcnMgPSByZXF1aXJlKCcuLi9hdXgvZG9tJyk7XG5cbi8qKlxuICogQ2xhc3MgdGhhdCByZXByZXNlbnRzIHRoZSBjYXJiby1oaWdobGlnaHRlciBlbGVtZW50XG4gKiB2aXJ0dWFsbHkuXG4gKiBAcGFyYW0ge09iamVjdH0gW2RhdGFdIERhdGEgdG8gYmUgc2V0IG9uIHRoZSBzY29wZVxuICogQHBhcmFtIHs8Y2FyYm8taW5zcGVjdG9yPn0gW2luc3BlY3Rvcl0gVGhlIGluc3BlY3RvciBpbnN0YW5jZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGhpZ2hsaWdodGVyIGlzIG93bmVkIGJ5LlxuICovXG5mdW5jdGlvbiBIaWdobGlnaHRlclNjb3BlKGRhdGEsIGluc3BlY3Rvcikge1xuXG4gICAgdGhpcy5pZCA9IF8udW5pcXVlSWQoJ2hpZ2hsaWdodGVyXycpO1xuXG4gICAgdGhpcy5pbnNwZWN0b3IgPSBpbnNwZWN0b3I7XG5cbiAgICAvLyBHZXQgYWxsIGRhdGFcbiAgICBfLmFzc2lnbih0aGlzLCBkYXRhKTtcbn1cblxuLyoqXG4gKiBQcm94aWVzIDxjYXJiby1oaWdobGlnaHRlcj4uaGlnaGxpZ2h0IG1ldGhvZFxuICogQHBhcmFtICB7Tm9kZX0gZWxlbWVudCBOb2RlIHRvIGJlIGhpZ2hsaWdodGVkXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgXG4gKi9cbkhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG5cbiAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIEhpZ2hsaWdodGVyU2NvcGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldCgnZWxlbWVudExhYmVsJywgZWxlbWVudC50YWdOYW1lKTtcblxuICAgIHRoaXMuZWxlbWVudC5oaWdobGlnaHQoZWxlbWVudCwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIFByb3hpZXMgdGhlIDxjYXJiby1oaWdobGlnaHRlcj4uaGlkZSBtZXRob2RcbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgZm9yIEhpZ2hsaWdodGVyU2NvcGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQuaGlkZSgpO1xufTtcblxuLyoqXG4gKiBIZWxwZXIgbWV0aG9kIHRvIHNldCBkYXRhIHVzaW5nIHBvbHltZXIgc3R1ZmZcbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHByb3BlcnR5LCB2YWx1ZSkge1xuXG4gICAgdmFyIHBhdGggPSBoaWdobGlnaHRlcnNOcyArICcuJyArIHRoaXMuaW5kZXggKyAnLicgKyBwcm9wZXJ0eTtcblxuICAgIHRoaXMuaW5zcGVjdG9yLnNldChwYXRoLCB2YWx1ZSk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBkYXRhIGFib3V0IHRoZSBlbGVtdG5cbiAqIEByZXR1cm4ge09iamVjdH0gW2Rlc2NyaXB0aW9uXVxuICovXG5IaWdobGlnaHRlclNjb3BlLnByb3RvdHlwZS5nZXRUYXJnZXREYXRhID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIHRhcmdldCA9IHRoaXMuZWxlbWVudC50YXJnZXQ7XG4gICAgdmFyIGRhdGE7XG5cbiAgICBpZiAodGFyZ2V0KSB7XG5cbiAgICAgICAgdmFyIGJvdW5kaW5nUmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICBkYXRhID0ge1xuICAgICAgICAgICAgdGFnTmFtZTogdGFyZ2V0LnRhZ05hbWUsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBET01IZWxwZXJzLmdldEF0dHJpYnV0ZXModGFyZ2V0KSxcbiAgICAgICAgICAgIGNvbXB1dGVkU3R5bGU6IERPTUhlbHBlcnMuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpLFxuICAgICAgICAgICAgcmVjdDoge1xuICAgICAgICAgICAgICAgIHRvcDogYm91bmRpbmdSZWN0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBib3VuZGluZ1JlY3QubGVmdCxcbiAgICAgICAgICAgICAgICB3aWR0aDogYm91bmRpbmdSZWN0LndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYm91bmRpbmdSZWN0LmhlaWdodCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBzY29wZSBkYXRhIGludG8gYSBwbGFpbiBvYmplY3QgcmVhZHkgZm9yIFxuICogSlNPTiBzdHJpbmdpZmljYXRpb25cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUudG9QbGFpbk9iamVjdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiB0aGlzLmlkXG4gICAgfTtcbn07XG5cbi8qKlxuICogRGVmaW5lIHRoZSBpbmRleCBwcm9wZXJ0eVxuICogd2hpY2ggd2lsbCBqdXN0IHBvaW50IHRvIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgaGlnaGxpZ2h0ZXIgc2NvcGVcbiAqIGlzIHN0b3JlZCBhdCB0aGUgaW5zcGVjdG9yIG9iamVjdC5cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLCAnaW5kZXgnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIF9oaWdobGlnaHRlcnMgPSB0aGlzLmluc3BlY3RvcltDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnNdOyBcblxuICAgICAgICByZXR1cm4gXy5pbmRleE9mKF9oaWdobGlnaHRlcnMsIHRoaXMpO1xuICAgIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlclNjb3BlOyIsIi8qKlxuICogTGlzdCBvZiBvcGVyYXRpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCB2aWEgd2luZG93LnBvc3RNZXNzYWdlXG4gKiBmcm9tIHRoZSBvdXRlciB3b3JsZC5cbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmV4cG9ydHMub3BlcmF0aW9uV2hpdGVsaXN0ID0ge1xuICAgICdoaWdobGlnaHRFbGVtZW50QXRQb2ludCc6IHRydWUsXG4gICAgJ3VuSGlnaGxpZ2h0JzogdHJ1ZSxcbiAgICAnZ2V0QWN0aXZlRWxlbWVudERhdGEnOiB0cnVlLFxuICAgICdzY3JvbGxCeSc6IHRydWUsXG4gICAgJ2FyZUZvY3VzQW5kSG92ZXJUb2dldGhlcic6IHRydWVcbn07XG5cbi8qKlxuICogTmFtZSBvZiB0aGUgcHJvcGVydHkgYXQgd2hpY2ggaGlnaGxpZ2hlcnMgd2lsbCBiZSBzdG9yZWQuXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG5leHBvcnRzLmhpZ2hsaWdodGVyc05zID0gJ19oaWdobGlnaHRlcnMnO1xuIl19

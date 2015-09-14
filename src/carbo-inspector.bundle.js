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
    'areFocusAndHoverTogether': true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FyYm8taW5zcGVjdG9yLmpzIiwic3JjL3NjcmlwdHMvYXV4L2RvbS5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9hbmFseXNpcy5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9jYW52YXMuanMiLCJzcmMvc2NyaXB0cy9iZWhhdmlvcnMvZnJhbWUtbWVzc2FnaW5nLmpzIiwic3JjL3NjcmlwdHMvY2xhc3Nlcy9oaWdobGlnaHRlci1zY29wZS5qcyIsInNyYy9zY3JpcHRzL2NvbnN0YW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogVGhpcyBjb21wb25lbnQgaXMgcmVzcG9uc2libGUgZm9yIGhpZ2hsaWdodGluZyB0aGVcbiAqIGNvbXBvbmVudHMgaW5zaWRlIHRoZSBhcHBsaWNhdGlvbiBhbmQgY29tbXVuaWNhdGluZyB3aXRoIHRoZSBleHRlcm5hbCBcbiAqIHdvcmxkIGJ5IG1lYW5zIG9mIHRoZSBgd2luZG93LnBvc3RNZXNzYWdlYCBhbmQgXG4gKiBgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnKWAgbWV0aG9kcy5cbiAqXG4gKiBJdCBoYXMgYW5kIGltcGxlbWVudGF0aW9uIG9mIGEgcmVxdWVzdC1yZXNwb25zZSBtb2RlbCB0aHJvdWdoIHRoYXQgY2hhbm5lbCwgXG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlIGhhbmRsZUZyYW1lUmVxdWVzdE1lc3NhZ2VcbiAqIFxuICogQGF1dGhvciBTaW1vbiBGYW4sIFBhdCBKZW5ueSwgTHUgSGV1a29cbiAqL1xuXG4vKipcbiAqIENvbnN0YW50cyB1c2VkIHRocm91Z2hvdXQgdGhlIGNvbXBvbmVudCBjb2RlLlxuICogQHR5cGUge09iamVjdH1cbiAqL1xudmFyIENPTlNUQU5UUyA9IHJlcXVpcmUoJy4vc2NyaXB0cy9jb25zdGFudHMnKTtcblxuLyoqXG4gKiBUaGUgY2xhc3MgdGhhdCBkZWZpbmVzIGEgc2NvcGUgZm9yIHRoZSBoaWdobGlnaHRlcnNcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqL1xudmFyIEhpZ2hsaWdodGVyU2NvcGUgPSByZXF1aXJlKCcuL3NjcmlwdHMvY2xhc3Nlcy9oaWdobGlnaHRlci1zY29wZScpO1xuXG4vKipcbiAqIEJlaGF2aW9yc1xuICovXG52YXIgRnJhbWVNZXNzYWdpbmdCZWhhdmlvciA9IHJlcXVpcmUoJy4vc2NyaXB0cy9iZWhhdmlvcnMvZnJhbWUtbWVzc2FnaW5nJyk7XG52YXIgQW5hbHlzaXNCZWhhdmlvciAgICAgICA9IHJlcXVpcmUoJy4vc2NyaXB0cy9iZWhhdmlvcnMvYW5hbHlzaXMnKTtcbnZhciBDYW52YXNCZWhhdmlvciAgICAgICAgID0gcmVxdWlyZSgnLi9zY3JpcHRzL2JlaGF2aW9ycy9jYW52YXMnKTtcblxuLyoqXG4gKiBSZWdpc3RlciB0aGUgY2FyYm8taW5zcGVjdG9yIGVsZW1lbnRcbiAqL1xuUG9seW1lcih7XG4gICAgaXM6ICdjYXJiby1pbnNwZWN0b3InLFxuXG4gICAgYmVoYXZpb3JzOiBbRnJhbWVNZXNzYWdpbmdCZWhhdmlvciwgQW5hbHlzaXNCZWhhdmlvciwgQ2FudmFzQmVoYXZpb3JdLFxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIGNhbGxlZCB3aGVuZXZlciB0aGUgY29tcG9uZW50IGlzIHJlYWR5XG4gICAgICovXG4gICAgcmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFycmF5IHRvIHN0b3JlIHRoZSBoaWdobGlnaHRlcnMgY3JlYXRlZFxuICAgICAgICAgKiBmb3IgdGhlIGluc3BlY3RvciBpbnN0YW5jZS5cbiAgICAgICAgICogQHR5cGUge0FycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpc1tDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnNdID0gW107XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgY2FyYm8taGlnaGxpZ2h0ZXJcbiAgICAgKiBnaXZlbiB0aGUgb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgUGFzc2VkIHRvIGNhcmJvLWhpZ2hsaWdodGVyLiBBbHNvIHdpbGwgYmVcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0IG9uIHRoZSBoaWdobGlnaHRlciBkYXRhIG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtDYXJib0hpZ2hsaWdodGVyfSAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBjcmVhdGVIaWdobGlnaHRlcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgICAgICAvLyBIaWdobGlnaHRlciBvYmplY3RcbiAgICAgICAgdmFyIF9oaWdobGlnaHRlciA9IG5ldyBIaWdobGlnaHRlclNjb3BlKG9wdGlvbnMsIHRoaXMpO1xuXG4gICAgICAgIC8vIFVzaW5nIHRoaXMgbWVjaGFuaXNtIG9mIGNyZWF0aW9uIGJlY2F1c2UgUG9seW1lclxuICAgICAgICAvLyBzdGlsbCBkb2VzIG5vdCBzdXBwb3J0IGRpbmFtaWMgZGF0YS1iaW5kaW5nXG4gICAgICAgIC8vIFdlIGFyZSB1c2luZyBkb20tcmVwZWF0IHRvIGNyZWF0ZVxuICAgICAgICAvLyB0aGUgX2hpZ2hsaWdodGVyIGluc3RhbmNlcy5cbiAgICAgICAgdGhpcy5wdXNoKENPTlNUQU5UUy5oaWdobGlnaHRlcnNOcywgX2hpZ2hsaWdodGVyKTtcblxuICAgICAgICAvLyBEbyBub3QgZm9yZ2V0IHRvIGZsdXNoIG1vZGlmaWNhdGlvbnNcbiAgICAgICAgLy8gc28gdGhhdCB3ZSBjYW4gc2FmZWx5IHJldHJpZXZlXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICAgICAgICBQb2x5bWVyLmRvbS5mbHVzaCgpO1xuXG4gICAgICAgIC8vIFNlbGVjdCB0aGUgaGlnaGxpZ2h0ZXIgZWxlbWVudCBqdXN0IGNyZWF0ZWQgYW5kXG4gICAgICAgIC8vIHNhdmUgcmVmZXJlbmNlIGF0IHRoZSBfaGlnaGxpZ2h0ZXIgZGF0YSBvYmplY3RcbiAgICAgICAgX2hpZ2hsaWdodGVyLmVsZW1lbnQgPSB0aGlzLiQkKCcjJyArIF9oaWdobGlnaHRlci5pZCk7XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2aXJ0dWFsIGhpZ2hsaWdodGVyIG9iamVjdFxuICAgICAgICByZXR1cm4gX2hpZ2hsaWdodGVyO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICogU2Nyb2xscyB0aGUgd2luZG93XG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBkZWx0YVhcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGRlbHRhWVxuICAgICAqL1xuICAgIHNjcm9sbEJ5OiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Njcm9sbCB4OiAlcywgeTogJXMnLCBkZWx0YVgsIGRlbHRhWSk7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxCeShkZWx0YVgsIGRlbHRhWSk7XG4gICAgfSxcbn0pOyIsIi8qKlxuICogSGVscGVyIG1ldGhvZHMgZm9yIG1hbmlwdWxhdGluZyBET01Ob2Rlc1xuICovXG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBjb21wdXRlZCBzdHlsZSBvZiBhbiBnaXZlbiBlbGVtZW50XG4gKiBAcGFyYW0gIHtET01Ob2RlfSBlbGVtZW50IFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmVhZCBjb21wdXRlZFN5dGxlc1xuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICBPYmplY3Qgd2l0aCB0aGUgY29tcHV0ZWQgc3R5bGVzXG4gKi9cbmV4cG9ydHMuZ2V0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IGZvciBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpJyk7XG4gICAgfVxuXG4gICAgdmFyIGNzID0ge307XG5cbiAgICAvLyBHZXQgdGhlIGNvbXB1dGVkIGNzIG9mIHRoZSBlbGVtZW50XG4gICAgdmFyIF9jcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuXG4gICAgZm9yICh2YXIgaSA9IF9jcy5sZW5ndGggLSAxOyBpID49MDsgaS0tKSB7XG4gICAgICAgIHZhciBwcm9wID0gX2NzW2ldO1xuXG4gICAgICAgIGNzW3Byb3BdID0gX2NzLmdldFByb3BlcnR5VmFsdWUocHJvcCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNzO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGF0dHJpYnV0ZXMgb2YgYSBnaXZlbiBlbGVtZW50XG4gKiBAcGFyYW0gIHtET01Ob2RlfSBlbGVtZW50IFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmVhZCBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgIE9iamVjdCB3aXRoIGFsbCBhdHRyaWJ1dGVzXG4gKi9cbmV4cG9ydHMuZ2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IGZvciBnZXRBdHRyaWJ1dGVzKGVsZW1lbnQpJyk7XG4gICAgfVxuXG4gICAgLy8gT2JqZWN0IG9uIHdoaWNoIHRvIHN0b3JlIGF0dHJpYnV0ZXNcbiAgICB2YXIgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgdmFyIF9hdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcblxuICAgIGZvciAodmFyIGkgPSBfYXR0cnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXR0cmlidXRlc1tfYXR0cnNbaV0ubmFtZV0gPSBfYXR0cnNbaV0udmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG59OyIsInZhciBET01IZWxwZXJzID0gcmVxdWlyZSgnLi4vYXV4L2RvbScpO1xuXG5leHBvcnRzLmdldEVsZW1lbnRBdFBvaW50ID0gZnVuY3Rpb24gKHBvaW50KSB7XG5cbn0iLCIvKipcbiAqIEltcGxlbWVudHMgYmVoYXZpb3JzIG9ubHkgdmFsaWQgZm9yIGNhbnZhcyB1c2FnZS5cbiAqXG4gKiBLaW5kIG9mIGVtZXJnZW5jeSA6KVxuICovXG5cbmV4cG9ydHMuYXR0YWNoZWQgPSBmdW5jdGlvbiAoKSB7XG5cblxuICAgIHRoaXMuX2NhbnZhcyA9IHtcblxuICAgICAgICBoaWdobGlnaHRlcnM6IHtcbiAgICAgICAgICAgIGhvdmVyOiB0aGlzLmNyZWF0ZUhpZ2hsaWdodGVyKHtcbiAgICAgICAgICAgICAgICBzdXJmYWNlU3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnM3B4IGRhc2hlZCBncmVlbidcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgZm9jdXM6IHRoaXMuY3JlYXRlSGlnaGxpZ2h0ZXIoe1xuICAgICAgICAgICAgICAgIHN1cmZhY2VTdHlsZToge1xuICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICczcHggc29saWQgZ3JlZW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgIGxvYWRpbmc6IHRoaXMuY3JlYXRlSGlnaGxpZ2h0ZXIoe1xuICAgICAgICAgICAgICAgIHN1cmZhY2VTdHlsZToge1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdncmVlbicsXG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6ICcwLjMnLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogSGlnaGxpZ2h0cyB0aGUgZWxlbWVudCBhdCBhIGdpdmVuIHBvaW50XG4gKiBAcGFyYW0ge09iamVjdHsgeDogTnVtYmVyLCB5OiBOdW1iZXJ9fSBcbiAqICAgICAgICAgcG9pbnQgVGhlIHBvaW50IGF0IHdoaWNoIHRoZSBlbGVtZW50IHRvIGJlIGhpZ2hsaWdodGVkIGlzXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGZvcmNlXG4gKi9cbmV4cG9ydHMuaGlnaGxpZ2h0RWxlbWVudEF0UG9pbnQgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0ZXIsIHBvaW50LCBmb3JjZSkge1xuICAgIC8vIGdldCBob3ZlcmVkIGNvbXBvbmVudCAoRWxlbWVudCB1bmRlciB0aGF0IHBvc2l0aW9uKVxuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChwb2ludC54LCBwb2ludC55KTtcblxuICAgIHZhciBobHQgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzW2hpZ2hsaWdodGVyXTtcblxuICAgIGhsdC5oaWdobGlnaHQoZWxlbWVudCk7XG59O1xuXG4vKipcbiAqIFVuaGlnaGxpZ2h0c1xuICovXG5leHBvcnRzLnVuSGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGhpZ2hsaWdodGVyKSB7XG4gICAgdmFyIGhsdCA9IHRoaXMuX2NhbnZhcy5oaWdobGlnaHRlcnNbaGlnaGxpZ2h0ZXJdO1xuXG4gICAgaGx0LmhpZGUoKTtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhY3RpdmUgZWxlbWVudC5cbiAqIEByZXR1cm4ge3t0YWdOYW1lOiBTdHJpbmcsIGF0dHJpYnV0ZXM6IE9iamVjdCwgY29tcHV0ZWRTdHlsZTogT2JqZWN0IH1PYmplY3R9IFxuICogICAgICAgICBEYXRhIG9uIHRoZSBjdXJyZW50IGFjdGl2ZSBlbGVtZW50LlxuICovXG5leHBvcnRzLmdldEFjdGl2ZUVsZW1lbnREYXRhID0gZnVuY3Rpb24gKGhpZ2hsaWdodGVyKSB7XG5cbiAgICB2YXIgaGx0ID0gdGhpcy5fY2FudmFzLmhpZ2hsaWdodGVyc1toaWdobGlnaHRlcl07XG5cbiAgICByZXR1cm4gaGx0LmdldFRhcmdldERhdGEoKTtcbn07XG5cblxuZXhwb3J0cy5hcmVGb2N1c0FuZEhvdmVyVG9nZXRoZXIgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZm9jdXMgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzLmZvY3VzO1xuICAgIHZhciBob3ZlciA9IHRoaXMuX2NhbnZhcy5oaWdobGlnaHRlcnMuaG92ZXI7XG5cbiAgICByZXR1cm4gZm9jdXMudGFyZ2V0ID09PSBob3Zlci50YXJnZXQ7XG59O1xuXG5leHBvcnRzLmFjdGl2YXRlTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBobHQgPSB0aGlzLl9jYW52YXMuaGlnaGxpZ2h0ZXJzLmZvY3VzO1xuXG4gICAgdGhpcy4kLmxvYWRpbmcuaGlnaGxpZ2h0KGhsdC50YXJnZXQpO1xufTtcblxuZXhwb3J0cy5kZWFjdGl2YXRlTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLiQubG9hZGluZy5oaWRlKCk7XG59OyIsIi8qKlxuICogRW5hYmxlcyBtZXNzYWdpbmcgYmV0d2VlbiBmcmFtZXNcbiAqL1xuXG52YXIgQ09OU1RBTlRTID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzJyk7XG5cbnZhciBGcmFtZU1lc3NhZ2luZ0JlaGF2aW9yID0ge1xuICAgIC8qKlxuICAgICAqIE1ldGhvZCBjYWxsZWQgd2hlbmV2ZXIgdGhlIGNvbXBvbmVudCBpcyByZWFkeVxuICAgICAqL1xuICAgIHJlYWR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIExpc3RlbiB0byBgbWVzc2FnZWAgZXZlbnRzIG9uIHRoZSB3aW5kb3cgb2JqZWN0LlxuICAgICAgICAvLyBUaGUgd2luZG93IGlzIHRoZSBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgd2hvbGUgYXBwbGljYXRpb24sXG4gICAgICAgIC8vIGluIHRoZSBjYXNlIG9mIHRoZSBlZGl0ZWQgYXBwbGljYXRpb24gKGluc2lkZSB3aGljaCBpcyB0aGUgaW5zcGVjdG9yIGNvbXBvbmVudClcbiAgICAgICAgLy8gaXQgaXMgdGhlIGBpZnJhbWVgLiBcbiAgICAgICAgLy8gXG4gICAgICAgIC8vIE9ubHkgdGhlIHdpbmRvdyByZWNlaXZlcyBtZXNzYWdlcy5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmhhbmRsZUZyYW1lUmVxdWVzdE1lc3NhZ2UuYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBtZXNzYWdlcyBmcm9tIHRoZSBwYXJlbnQgZnJhbWUuXG4gICAgICogQHBhcmFtICB7RXZlbnR9IGV2ZW50IHRoZSBldmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBoYW5kbGVGcmFtZVJlcXVlc3RNZXNzYWdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICAgICAvLyBtw6l0b2RvIEpTT04ucGFyc2UoKSBjb252ZXJ0ZSBzdHJpbmcgcGFyYSBKU09OXG4gICAgICAgIHZhciByZXF1ZXN0ID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgb3BlcmF0aW9uTmFtZSBpcyB3aGl0ZWxpc3RlZFxuICAgICAgICAvLyBOb3QgYWxsIG1ldGhvZHMgb24gdGhlIGluc3BlY3RvciBvYmplY3Qgc2hvdWxkIGJlXG4gICAgICAgIC8vIGF2YWlsYWJsZSBmb3Igb3V0c2lkZSB1c2UgZm9yIHNlY3VyaXR5IHJlYXNvbnMuXG4gICAgICAgIC8vIFRodXMgd2Ugc2hvdWxkIHdoaXRlbGlzdCB0aGUgYXZhaWxhYmxlIG1ldGhvZHNcbiAgICAgICAgdmFyIG9wZXJhdGlvbldoaXRlbGlzdGVkID0gQ09OU1RBTlRTLm9wZXJhdGlvbldoaXRlbGlzdFtyZXF1ZXN0Lm9wZXJhdGlvbl07IFxuXG4gICAgICAgIGlmIChvcGVyYXRpb25XaGl0ZWxpc3RlZCkge1xuICAgICAgICAgICAgLy8gRXhlY3V0ZSB0aGUgb3BlcmF0aW9uIGFuZCBzdG9yZSB0aGUgcmVzdWx0XG4gICAgICAgICAgICB2YXIgcmVzID0gdGhpc1tyZXF1ZXN0Lm9wZXJhdGlvbl0uYXBwbHkodGhpcywgcmVxdWVzdC5hcmdzKTtcblxuICAgICAgICAgICAgLy8gU2VuZCBtZXNzYWdlIHRvIHBhcmVudCBmcmFtZSBwYXNzaW5nIHRoZSByZXF1ZXN0LmlkXG4gICAgICAgICAgICAvLyBzbyB0aGF0IHRoZSBwYXJlbnQgbWF5IHJlc29sdmUgdG8gdGhlIGNvcnJlY3QgaW5xdWlyeS5cbiAgICAgICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgaWQ6IHJlcXVlc3QuaWQsXG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG1ldGhvZCB0byBjb252ZXJ0IHRoZSBvYmplY3QgaW50byBcbiAgICAgICAgICAgICAgICAvLyBwbGFpbiBKU09OIG9iamVjdCwgZG8gc28uXG4gICAgICAgICAgICAgICAgcmVzOiAocmVzICE9PSB1bmRlZmluZWQgJiYgcmVzLnRvUGxhaW5PYmplY3QpID8gcmVzLnRvUGxhaW5PYmplY3QoKSA6IHJlc1xuICAgICAgICAgICAgfSksICcqJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT3BlcmF0aW9uICVzIGlzIG5vdCBhdmFpbGFibGUgYXQgaW5zcGVjdG9yJywgcmVxdWVzdC5vcGVyYXRpb24pO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVNZXNzYWdpbmdCZWhhdmlvcjsiLCIvKipcbiAqIENsYXNzIHRoYXQgaXMgcmVzcG9uc2libGUgZm9yIGVuY2Fwc3VsYXRpbmcgc2NvcGUgXG4gKiBmb3IgZWFjaCBvZiB0aGUgaGlnaGxpZ2h0ZXIgZWxlbWVudHMgd2l0aGluLlxuICovXG5cbnZhciBDT05TVEFOVFMgICAgICA9IHJlcXVpcmUoJy4uL2NvbnN0YW50cycpO1xudmFyIGhpZ2hsaWdodGVyc05zID0gQ09OU1RBTlRTLmhpZ2hsaWdodGVyc05zO1xuXG52YXIgRE9NSGVscGVycyA9IHJlcXVpcmUoJy4uL2F1eC9kb20nKTtcblxuLyoqXG4gKiBDbGFzcyB0aGF0IHJlcHJlc2VudHMgdGhlIGNhcmJvLWhpZ2hsaWdodGVyIGVsZW1lbnRcbiAqIHZpcnR1YWxseS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZGF0YV0gRGF0YSB0byBiZSBzZXQgb24gdGhlIHNjb3BlXG4gKiBAcGFyYW0gezxjYXJiby1pbnNwZWN0b3I+fSBbaW5zcGVjdG9yXSBUaGUgaW5zcGVjdG9yIGluc3RhbmNlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgaGlnaGxpZ2h0ZXIgaXMgb3duZWQgYnkuXG4gKi9cbmZ1bmN0aW9uIEhpZ2hsaWdodGVyU2NvcGUoZGF0YSwgaW5zcGVjdG9yKSB7XG5cbiAgICB0aGlzLmlkID0gXy51bmlxdWVJZCgnaGlnaGxpZ2h0ZXJfJyk7XG5cbiAgICB0aGlzLmluc3BlY3RvciA9IGluc3BlY3RvcjtcblxuICAgIC8vIEdldCBhbGwgZGF0YVxuICAgIF8uYXNzaWduKHRoaXMsIGRhdGEpO1xufVxuXG4vKipcbiAqIFByb3hpZXMgPGNhcmJvLWhpZ2hsaWdodGVyPi5oaWdobGlnaHQgbWV0aG9kXG4gKiBAcGFyYW0gIHtOb2RlfSBlbGVtZW50IE5vZGUgdG8gYmUgaGlnaGxpZ2h0ZWRcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBcbiAqL1xuSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUuaGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcblxuICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZWxlbWVudCBmb3IgSGlnaGxpZ2h0ZXJTY29wZScpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0KCdlbGVtZW50TGFiZWwnLCBlbGVtZW50LnRhZ05hbWUpO1xuXG4gICAgdGhpcy5lbGVtZW50LmhpZ2hsaWdodChlbGVtZW50LCBvcHRpb25zKTtcbn07XG5cbi8qKlxuICogUHJveGllcyB0aGUgPGNhcmJvLWhpZ2hsaWdodGVyPi5oaWRlIG1ldGhvZFxuICovXG5IaWdobGlnaHRlclNjb3BlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZWxlbWVudCBmb3IgSGlnaGxpZ2h0ZXJTY29wZScpO1xuICAgIH1cblxuICAgIHRoaXMuZWxlbWVudC5oaWRlKCk7XG59O1xuXG4vKipcbiAqIEhlbHBlciBtZXRob2QgdG8gc2V0IGRhdGEgdXNpbmcgcG9seW1lciBzdHVmZlxuICovXG5IaWdobGlnaHRlclNjb3BlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAocHJvcGVydHksIHZhbHVlKSB7XG5cbiAgICB2YXIgcGF0aCA9IGhpZ2hsaWdodGVyc05zICsgJy4nICsgdGhpcy5pbmRleCArICcuJyArIHByb3BlcnR5O1xuXG4gICAgdGhpcy5pbnNwZWN0b3Iuc2V0KHBhdGgsIHZhbHVlKTtcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGRhdGEgYWJvdXQgdGhlIGVsZW10blxuICogQHJldHVybiB7T2JqZWN0fSBbZGVzY3JpcHRpb25dXG4gKi9cbkhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLmdldFRhcmdldERhdGEgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5lbGVtZW50LnRhcmdldDtcbiAgICB2YXIgZGF0YTtcblxuICAgIGlmICh0YXJnZXQpIHtcblxuICAgICAgICB2YXIgYm91bmRpbmdSZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWdOYW1lOiB0YXJnZXQudGFnTmFtZSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IERPTUhlbHBlcnMuZ2V0QXR0cmlidXRlcyh0YXJnZXQpLFxuICAgICAgICAgICAgY29tcHV0ZWRTdHlsZTogRE9NSGVscGVycy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCksXG4gICAgICAgICAgICByZWN0OiB7XG4gICAgICAgICAgICAgICAgdG9wOiBib3VuZGluZ1JlY3QudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGJvdW5kaW5nUmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgIHdpZHRoOiBib3VuZGluZ1JlY3Qud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBib3VuZGluZ1JlY3QuaGVpZ2h0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgdGhlIHNjb3BlIGRhdGEgaW50byBhIHBsYWluIG9iamVjdCByZWFkeSBmb3IgXG4gKiBKU09OIHN0cmluZ2lmaWNhdGlvblxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5IaWdobGlnaHRlclNjb3BlLnByb3RvdHlwZS50b1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IHRoaXMuaWRcbiAgICB9O1xufTtcblxuLyoqXG4gKiBEZWZpbmUgdGhlIGluZGV4IHByb3BlcnR5XG4gKiB3aGljaCB3aWxsIGp1c3QgcG9pbnQgdG8gdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBoaWdobGlnaHRlciBzY29wZVxuICogaXMgc3RvcmVkIGF0IHRoZSBpbnNwZWN0b3Igb2JqZWN0LlxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSGlnaGxpZ2h0ZXJTY29wZS5wcm90b3R5cGUsICdpbmRleCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgX2hpZ2hsaWdodGVycyA9IHRoaXMuaW5zcGVjdG9yW0NPTlNUQU5UUy5oaWdobGlnaHRlcnNOc107IFxuXG4gICAgICAgIHJldHVybiBfLmluZGV4T2YoX2hpZ2hsaWdodGVycywgdGhpcyk7XG4gICAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhpZ2hsaWdodGVyU2NvcGU7IiwiLyoqXG4gKiBMaXN0IG9mIG9wZXJhdGlvbnMgdGhhdCBjYW4gYmUgY2FsbGVkIHZpYSB3aW5kb3cucG9zdE1lc3NhZ2VcbiAqIGZyb20gdGhlIG91dGVyIHdvcmxkLlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuZXhwb3J0cy5vcGVyYXRpb25XaGl0ZWxpc3QgPSB7XG4gICAgJ2hpZ2hsaWdodEVsZW1lbnRBdFBvaW50JzogdHJ1ZSxcbiAgICAndW5IaWdobGlnaHQnOiB0cnVlLFxuICAgICdnZXRBY3RpdmVFbGVtZW50RGF0YSc6IHRydWUsXG4gICAgJ3Njcm9sbEJ5JzogdHJ1ZSxcbiAgICAnYXJlRm9jdXNBbmRIb3ZlclRvZ2V0aGVyJzogdHJ1ZVxufTtcblxuLyoqXG4gKiBOYW1lIG9mIHRoZSBwcm9wZXJ0eSBhdCB3aGljaCBoaWdobGlnaGVycyB3aWxsIGJlIHN0b3JlZC5cbiAqIEB0eXBlIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuaGlnaGxpZ2h0ZXJzTnMgPSAnX2hpZ2hsaWdodGVycyc7XG4iXX0=

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

/**
 * Register the carbo-inspector element
 */
Polymer({
    is: 'carbo-inspector',

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
     * Highlights the element at a given point
     * @param {Object{ x: Number, y: Number}} 
     *         point The point at which the element to be highlighted is
     * @param {Boolean} force
     */
    highlightElementAtPoint: function (point, force) {
        // get hovered component (Element under that position)
        var element = document.elementFromPoint(point.x, point.y);
        
        if (element === this) {
            this.unHighlight();
        }
        
        this.highlight(element, force);
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

    behaviors: [FrameMessagingBehavior, AnalysisBehavior]
});
},{"./scripts/behaviors/analysis":3,"./scripts/behaviors/frame-messaging":4,"./scripts/classes/highlighter-scope":5,"./scripts/constants":6}],2:[function(require,module,exports){
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
                res: res.toPlainObject ? res.toPlainObject() : res
            }), '*');

        } else {
            throw new Error('Operation %s is not available at inspector', operationName);
        }
    },
};

module.exports = FrameMessagingBehavior;
},{"../constants":6}],5:[function(require,module,exports){
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
 * Converts the scope data into a plain object ready for 
 * JSON stringification
 * @return {Object}
 */
HighlighterScope.property.toPlainObject = function () {

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
},{"../aux/dom":2,"../constants":6}],6:[function(require,module,exports){
/**
 * List of operations that can be called via window.postMessage
 * from the outer world.
 * @type {Object}
 */
exports.operationWhitelist = {
    'highlightElementAtPoint': true,
    'unHighlight': true,
    'getActiveElementData': true,
    'scrollBy': true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FyYm8taW5zcGVjdG9yLmpzIiwic3JjL3NjcmlwdHMvYXV4L2RvbS5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9hbmFseXNpcy5qcyIsInNyYy9zY3JpcHRzL2JlaGF2aW9ycy9mcmFtZS1tZXNzYWdpbmcuanMiLCJzcmMvc2NyaXB0cy9jbGFzc2VzL2hpZ2hsaWdodGVyLXNjb3BlLmpzIiwic3JjL3NjcmlwdHMvY29uc3RhbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBUaGlzIGNvbXBvbmVudCBpcyByZXNwb25zaWJsZSBmb3IgaGlnaGxpZ2h0aW5nIHRoZVxuICogY29tcG9uZW50cyBpbnNpZGUgdGhlIGFwcGxpY2F0aW9uIGFuZCBjb21tdW5pY2F0aW5nIHdpdGggdGhlIGV4dGVybmFsIFxuICogd29ybGQgYnkgbWVhbnMgb2YgdGhlIGB3aW5kb3cucG9zdE1lc3NhZ2VgIGFuZCBcbiAqIGB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScpYCBtZXRob2RzLlxuICpcbiAqIEl0IGhhcyBhbmQgaW1wbGVtZW50YXRpb24gb2YgYSByZXF1ZXN0LXJlc3BvbnNlIG1vZGVsIHRocm91Z2ggdGhhdCBjaGFubmVsLCBcbiAqIGZvciBtb3JlIGluZm9ybWF0aW9uLCBzZWUgaGFuZGxlRnJhbWVSZXF1ZXN0TWVzc2FnZVxuICogXG4gKiBAYXV0aG9yIFNpbW9uIEZhbiwgUGF0IEplbm55LCBMdSBIZXVrb1xuICovXG5cbi8qKlxuICogQ29uc3RhbnRzIHVzZWQgdGhyb3VnaG91dCB0aGUgY29tcG9uZW50IGNvZGUuXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG52YXIgQ09OU1RBTlRTID0gcmVxdWlyZSgnLi9zY3JpcHRzL2NvbnN0YW50cycpO1xuXG4vKipcbiAqIFRoZSBjbGFzcyB0aGF0IGRlZmluZXMgYSBzY29wZSBmb3IgdGhlIGhpZ2hsaWdodGVyc1xuICogQHR5cGUge0Z1bmN0aW9ufVxuICovXG52YXIgSGlnaGxpZ2h0ZXJTY29wZSA9IHJlcXVpcmUoJy4vc2NyaXB0cy9jbGFzc2VzL2hpZ2hsaWdodGVyLXNjb3BlJyk7XG5cbi8qKlxuICogQmVoYXZpb3JzXG4gKi9cbnZhciBGcmFtZU1lc3NhZ2luZ0JlaGF2aW9yID0gcmVxdWlyZSgnLi9zY3JpcHRzL2JlaGF2aW9ycy9mcmFtZS1tZXNzYWdpbmcnKTtcbnZhciBBbmFseXNpc0JlaGF2aW9yICAgICAgID0gcmVxdWlyZSgnLi9zY3JpcHRzL2JlaGF2aW9ycy9hbmFseXNpcycpO1xuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBjYXJiby1pbnNwZWN0b3IgZWxlbWVudFxuICovXG5Qb2x5bWVyKHtcbiAgICBpczogJ2NhcmJvLWluc3BlY3RvcicsXG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgY2FsbGVkIHdoZW5ldmVyIHRoZSBjb21wb25lbnQgaXMgcmVhZHlcbiAgICAgKi9cbiAgICByZWFkeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQXJyYXkgdG8gc3RvcmUgdGhlIGhpZ2hsaWdodGVycyBjcmVhdGVkXG4gICAgICAgICAqIGZvciB0aGUgaW5zcGVjdG9yIGluc3RhbmNlLlxuICAgICAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzW0NPTlNUQU5UUy5oaWdobGlnaHRlcnNOc10gPSBbXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBjYXJiby1oaWdobGlnaHRlclxuICAgICAqIGdpdmVuIHRoZSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBQYXNzZWQgdG8gY2FyYm8taGlnaGxpZ2h0ZXIuIEFsc28gd2lsbCBiZVxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQgb24gdGhlIGhpZ2hsaWdodGVyIGRhdGEgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge0NhcmJvSGlnaGxpZ2h0ZXJ9ICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgICAqL1xuICAgIGNyZWF0ZUhpZ2hsaWdodGVyOiBmdW5jdGlvbiAob3B0aW9ucykge1xuXG4gICAgICAgIC8vIEhpZ2hsaWdodGVyIG9iamVjdFxuICAgICAgICB2YXIgX2hpZ2hsaWdodGVyID0gbmV3IEhpZ2hsaWdodGVyU2NvcGUob3B0aW9ucywgdGhpcyk7XG5cbiAgICAgICAgLy8gVXNpbmcgdGhpcyBtZWNoYW5pc20gb2YgY3JlYXRpb24gYmVjYXVzZSBQb2x5bWVyXG4gICAgICAgIC8vIHN0aWxsIGRvZXMgbm90IHN1cHBvcnQgZGluYW1pYyBkYXRhLWJpbmRpbmdcbiAgICAgICAgLy8gV2UgYXJlIHVzaW5nIGRvbS1yZXBlYXQgdG8gY3JlYXRlXG4gICAgICAgIC8vIHRoZSBfaGlnaGxpZ2h0ZXIgaW5zdGFuY2VzLlxuICAgICAgICB0aGlzLnB1c2goQ09OU1RBTlRTLmhpZ2hsaWdodGVyc05zLCBfaGlnaGxpZ2h0ZXIpO1xuXG4gICAgICAgIC8vIERvIG5vdCBmb3JnZXQgdG8gZmx1c2ggbW9kaWZpY2F0aW9uc1xuICAgICAgICAvLyBzbyB0aGF0IHdlIGNhbiBzYWZlbHkgcmV0cmlldmVcbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gICAgICAgIFBvbHltZXIuZG9tLmZsdXNoKCk7XG5cbiAgICAgICAgLy8gU2VsZWN0IHRoZSBoaWdobGlnaHRlciBlbGVtZW50IGp1c3QgY3JlYXRlZCBhbmRcbiAgICAgICAgLy8gc2F2ZSByZWZlcmVuY2UgYXQgdGhlIF9oaWdobGlnaHRlciBkYXRhIG9iamVjdFxuICAgICAgICBfaGlnaGxpZ2h0ZXIuZWxlbWVudCA9IHRoaXMuJCQoJyMnICsgX2hpZ2hsaWdodGVyLmlkKTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIHZpcnR1YWwgaGlnaGxpZ2h0ZXIgb2JqZWN0XG4gICAgICAgIHJldHVybiBfaGlnaGxpZ2h0ZXI7XG4gICAgfSxcblxuXG5cbiAgICAvKipcbiAgICAgKiBIaWdobGlnaHRzIHRoZSBlbGVtZW50IGF0IGEgZ2l2ZW4gcG9pbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdHsgeDogTnVtYmVyLCB5OiBOdW1iZXJ9fSBcbiAgICAgKiAgICAgICAgIHBvaW50IFRoZSBwb2ludCBhdCB3aGljaCB0aGUgZWxlbWVudCB0byBiZSBoaWdobGlnaHRlZCBpc1xuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2VcbiAgICAgKi9cbiAgICBoaWdobGlnaHRFbGVtZW50QXRQb2ludDogZnVuY3Rpb24gKHBvaW50LCBmb3JjZSkge1xuICAgICAgICAvLyBnZXQgaG92ZXJlZCBjb21wb25lbnQgKEVsZW1lbnQgdW5kZXIgdGhhdCBwb3NpdGlvbilcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHBvaW50LngsIHBvaW50LnkpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGVsZW1lbnQgPT09IHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXMudW5IaWdobGlnaHQoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5oaWdobGlnaHQoZWxlbWVudCwgZm9yY2UpO1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICogU2Nyb2xscyB0aGUgd2luZG93XG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBkZWx0YVhcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGRlbHRhWVxuICAgICAqL1xuICAgIHNjcm9sbEJ5OiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Njcm9sbCB4OiAlcywgeTogJXMnLCBkZWx0YVgsIGRlbHRhWSk7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxCeShkZWx0YVgsIGRlbHRhWSk7XG4gICAgfSxcblxuICAgIGJlaGF2aW9yczogW0ZyYW1lTWVzc2FnaW5nQmVoYXZpb3IsIEFuYWx5c2lzQmVoYXZpb3JdXG59KTsiLCIvKipcbiAqIEhlbHBlciBtZXRob2RzIGZvciBtYW5pcHVsYXRpbmcgRE9NTm9kZXNcbiAqL1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgY29tcHV0ZWQgc3R5bGUgb2YgYW4gZ2l2ZW4gZWxlbWVudFxuICogQHBhcmFtICB7RE9NTm9kZX0gZWxlbWVudCBUaGUgZWxlbWVudCBmcm9tIHdoaWNoIHRvIHJlYWQgY29tcHV0ZWRTeXRsZXNcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgT2JqZWN0IHdpdGggdGhlIGNvbXB1dGVkIHN0eWxlc1xuICovXG5leHBvcnRzLmdldENvbXB1dGVkU3R5bGUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZWxlbWVudCBmb3IgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KScpO1xuICAgIH1cblxuICAgIHZhciBjcyA9IHt9O1xuXG4gICAgLy8gR2V0IHRoZSBjb21wdXRlZCBjcyBvZiB0aGUgZWxlbWVudFxuICAgIHZhciBfY3MgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcblxuICAgIGZvciAodmFyIGkgPSBfY3MubGVuZ3RoIC0gMTsgaSA+PTA7IGktLSkge1xuICAgICAgICB2YXIgcHJvcCA9IF9jc1tpXTtcblxuICAgICAgICBjc1twcm9wXSA9IF9jcy5nZXRQcm9wZXJ0eVZhbHVlKHByb3ApO1xuICAgIH1cblxuICAgIHJldHVybiBjcztcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBhdHRyaWJ1dGVzIG9mIGEgZ2l2ZW4gZWxlbWVudFxuICogQHBhcmFtICB7RE9NTm9kZX0gZWxlbWVudCBUaGUgZWxlbWVudCBmcm9tIHdoaWNoIHRvIHJlYWQgYXR0cmlidXRlc1xuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICBPYmplY3Qgd2l0aCBhbGwgYXR0cmlidXRlc1xuICovXG5leHBvcnRzLmdldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZWxlbWVudCBmb3IgZ2V0QXR0cmlidXRlcyhlbGVtZW50KScpO1xuICAgIH1cblxuICAgIC8vIE9iamVjdCBvbiB3aGljaCB0byBzdG9yZSBhdHRyaWJ1dGVzXG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcblxuICAgIHZhciBfYXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG5cbiAgICBmb3IgKHZhciBpID0gX2F0dHJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNbX2F0dHJzW2ldLm5hbWVdID0gX2F0dHJzW2ldLnZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xufTsiLCJ2YXIgRE9NSGVscGVycyA9IHJlcXVpcmUoJy4uL2F1eC9kb20nKTtcblxuZXhwb3J0cy5nZXRFbGVtZW50QXRQb2ludCA9IGZ1bmN0aW9uIChwb2ludCkge1xuXG59IiwiLyoqXG4gKiBFbmFibGVzIG1lc3NhZ2luZyBiZXR3ZWVuIGZyYW1lc1xuICovXG5cbnZhciBDT05TVEFOVFMgPSByZXF1aXJlKCcuLi9jb25zdGFudHMnKTtcblxudmFyIEZyYW1lTWVzc2FnaW5nQmVoYXZpb3IgPSB7XG4gICAgLyoqXG4gICAgICogTWV0aG9kIGNhbGxlZCB3aGVuZXZlciB0aGUgY29tcG9uZW50IGlzIHJlYWR5XG4gICAgICovXG4gICAgcmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gTGlzdGVuIHRvIGBtZXNzYWdlYCBldmVudHMgb24gdGhlIHdpbmRvdyBvYmplY3QuXG4gICAgICAgIC8vIFRoZSB3aW5kb3cgaXMgdGhlIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSB3aG9sZSBhcHBsaWNhdGlvbixcbiAgICAgICAgLy8gaW4gdGhlIGNhc2Ugb2YgdGhlIGVkaXRlZCBhcHBsaWNhdGlvbiAoaW5zaWRlIHdoaWNoIGlzIHRoZSBpbnNwZWN0b3IgY29tcG9uZW50KVxuICAgICAgICAvLyBpdCBpcyB0aGUgYGlmcmFtZWAuIFxuICAgICAgICAvLyBcbiAgICAgICAgLy8gT25seSB0aGUgd2luZG93IHJlY2VpdmVzIG1lc3NhZ2VzLlxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuaGFuZGxlRnJhbWVSZXF1ZXN0TWVzc2FnZS5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIG1lc3NhZ2VzIGZyb20gdGhlIHBhcmVudCBmcmFtZS5cbiAgICAgKiBAcGFyYW0gIHtFdmVudH0gZXZlbnQgdGhlIGV2ZW50IG9iamVjdFxuICAgICAqL1xuICAgIGhhbmRsZUZyYW1lUmVxdWVzdE1lc3NhZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgIC8vIG3DqXRvZG8gSlNPTi5wYXJzZSgpIGNvbnZlcnRlIHN0cmluZyBwYXJhIEpTT05cbiAgICAgICAgdmFyIHJlcXVlc3QgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBvcGVyYXRpb25OYW1lIGlzIHdoaXRlbGlzdGVkXG4gICAgICAgIC8vIE5vdCBhbGwgbWV0aG9kcyBvbiB0aGUgaW5zcGVjdG9yIG9iamVjdCBzaG91bGQgYmVcbiAgICAgICAgLy8gYXZhaWxhYmxlIGZvciBvdXRzaWRlIHVzZSBmb3Igc2VjdXJpdHkgcmVhc29ucy5cbiAgICAgICAgLy8gVGh1cyB3ZSBzaG91bGQgd2hpdGVsaXN0IHRoZSBhdmFpbGFibGUgbWV0aG9kc1xuICAgICAgICB2YXIgb3BlcmF0aW9uV2hpdGVsaXN0ZWQgPSBDT05TVEFOVFMub3BlcmF0aW9uV2hpdGVsaXN0W3JlcXVlc3Qub3BlcmF0aW9uXTsgXG5cbiAgICAgICAgaWYgKG9wZXJhdGlvbldoaXRlbGlzdGVkKSB7XG4gICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBvcGVyYXRpb24gYW5kIHN0b3JlIHRoZSByZXN1bHRcbiAgICAgICAgICAgIHZhciByZXMgPSB0aGlzW3JlcXVlc3Qub3BlcmF0aW9uXS5hcHBseSh0aGlzLCByZXF1ZXN0LmFyZ3MpO1xuXG4gICAgICAgICAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gcGFyZW50IGZyYW1lIHBhc3NpbmcgdGhlIHJlcXVlc3QuaWRcbiAgICAgICAgICAgIC8vIHNvIHRoYXQgdGhlIHBhcmVudCBtYXkgcmVzb2x2ZSB0byB0aGUgY29ycmVjdCBpbnF1aXJ5LlxuICAgICAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBpZDogcmVxdWVzdC5pZCxcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbWV0aG9kIHRvIGNvbnZlcnQgdGhlIG9iamVjdCBpbnRvIFxuICAgICAgICAgICAgICAgIC8vIHBsYWluIEpTT04gb2JqZWN0LCBkbyBzby5cbiAgICAgICAgICAgICAgICByZXM6IHJlcy50b1BsYWluT2JqZWN0ID8gcmVzLnRvUGxhaW5PYmplY3QoKSA6IHJlc1xuICAgICAgICAgICAgfSksICcqJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT3BlcmF0aW9uICVzIGlzIG5vdCBhdmFpbGFibGUgYXQgaW5zcGVjdG9yJywgb3BlcmF0aW9uTmFtZSk7XG4gICAgICAgIH1cbiAgICB9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZU1lc3NhZ2luZ0JlaGF2aW9yOyIsIi8qKlxuICogQ2xhc3MgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgZW5jYXBzdWxhdGluZyBzY29wZSBcbiAqIGZvciBlYWNoIG9mIHRoZSBoaWdobGlnaHRlciBlbGVtZW50cyB3aXRoaW4uXG4gKi9cblxudmFyIENPTlNUQU5UUyAgICAgID0gcmVxdWlyZSgnLi4vY29uc3RhbnRzJyk7XG52YXIgaGlnaGxpZ2h0ZXJzTnMgPSBDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnM7XG5cbnZhciBET01IZWxwZXJzID0gcmVxdWlyZSgnLi4vYXV4L2RvbScpO1xuXG4vKipcbiAqIENsYXNzIHRoYXQgcmVwcmVzZW50cyB0aGUgY2FyYm8taGlnaGxpZ2h0ZXIgZWxlbWVudFxuICogdmlydHVhbGx5LlxuICogQHBhcmFtIHtPYmplY3R9IFtkYXRhXSBEYXRhIHRvIGJlIHNldCBvbiB0aGUgc2NvcGVcbiAqIEBwYXJhbSB7PGNhcmJvLWluc3BlY3Rvcj59IFtpbnNwZWN0b3JdIFRoZSBpbnNwZWN0b3IgaW5zdGFuY2VcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBoaWdobGlnaHRlciBpcyBvd25lZCBieS5cbiAqL1xuZnVuY3Rpb24gSGlnaGxpZ2h0ZXJTY29wZShkYXRhLCBpbnNwZWN0b3IpIHtcblxuICAgIHRoaXMuaWQgPSBfLnVuaXF1ZUlkKCdoaWdobGlnaHRlcl8nKTtcblxuICAgIHRoaXMuaW5zcGVjdG9yID0gaW5zcGVjdG9yO1xuXG4gICAgLy8gR2V0IGFsbCBkYXRhXG4gICAgXy5hc3NpZ24odGhpcywgZGF0YSk7XG59XG5cbi8qKlxuICogUHJveGllcyA8Y2FyYm8taGlnaGxpZ2h0ZXI+LmhpZ2hsaWdodCBtZXRob2RcbiAqIEBwYXJhbSAge05vZGV9IGVsZW1lbnQgTm9kZSB0byBiZSBoaWdobGlnaHRlZFxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIFxuICovXG5IaWdobGlnaHRlclNjb3BlLnByb3RvdHlwZS5oaWdobGlnaHQgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuXG4gICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IGZvciBIaWdobGlnaHRlclNjb3BlJyk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXQoJ2VsZW1lbnRMYWJlbCcsIGVsZW1lbnQudGFnTmFtZSk7XG5cbiAgICB0aGlzLmVsZW1lbnQuaGlnaGxpZ2h0KGVsZW1lbnQsIG9wdGlvbnMpO1xufTtcblxuLyoqXG4gKiBQcm94aWVzIHRoZSA8Y2FyYm8taGlnaGxpZ2h0ZXI+LmhpZGUgbWV0aG9kXG4gKi9cbkhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IGZvciBIaWdobGlnaHRlclNjb3BlJyk7XG4gICAgfVxuXG4gICAgdGhpcy5lbGVtZW50LmhpZGUoKTtcbn07XG5cbi8qKlxuICogSGVscGVyIG1ldGhvZCB0byBzZXQgZGF0YSB1c2luZyBwb2x5bWVyIHN0dWZmXG4gKi9cbkhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChwcm9wZXJ0eSwgdmFsdWUpIHtcblxuICAgIHZhciBwYXRoID0gaGlnaGxpZ2h0ZXJzTnMgKyAnLicgKyB0aGlzLmluZGV4ICsgJy4nICsgcHJvcGVydHk7XG5cbiAgICB0aGlzLmluc3BlY3Rvci5zZXQocGF0aCwgdmFsdWUpO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgc2NvcGUgZGF0YSBpbnRvIGEgcGxhaW4gb2JqZWN0IHJlYWR5IGZvciBcbiAqIEpTT04gc3RyaW5naWZpY2F0aW9uXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbkhpZ2hsaWdodGVyU2NvcGUucHJvcGVydHkudG9QbGFpbk9iamVjdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiB0aGlzLmlkXG4gICAgfTtcbn07XG5cbi8qKlxuICogRGVmaW5lIHRoZSBpbmRleCBwcm9wZXJ0eVxuICogd2hpY2ggd2lsbCBqdXN0IHBvaW50IHRvIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgaGlnaGxpZ2h0ZXIgc2NvcGVcbiAqIGlzIHN0b3JlZCBhdCB0aGUgaW5zcGVjdG9yIG9iamVjdC5cbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEhpZ2hsaWdodGVyU2NvcGUucHJvdG90eXBlLCAnaW5kZXgnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIF9oaWdobGlnaHRlcnMgPSB0aGlzLmluc3BlY3RvcltDT05TVEFOVFMuaGlnaGxpZ2h0ZXJzTnNdOyBcblxuICAgICAgICByZXR1cm4gXy5pbmRleE9mKF9oaWdobGlnaHRlcnMsIHRoaXMpO1xuICAgIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIaWdobGlnaHRlclNjb3BlOyIsIi8qKlxuICogTGlzdCBvZiBvcGVyYXRpb25zIHRoYXQgY2FuIGJlIGNhbGxlZCB2aWEgd2luZG93LnBvc3RNZXNzYWdlXG4gKiBmcm9tIHRoZSBvdXRlciB3b3JsZC5cbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmV4cG9ydHMub3BlcmF0aW9uV2hpdGVsaXN0ID0ge1xuICAgICdoaWdobGlnaHRFbGVtZW50QXRQb2ludCc6IHRydWUsXG4gICAgJ3VuSGlnaGxpZ2h0JzogdHJ1ZSxcbiAgICAnZ2V0QWN0aXZlRWxlbWVudERhdGEnOiB0cnVlLFxuICAgICdzY3JvbGxCeSc6IHRydWVcbn07XG5cbi8qKlxuICogTmFtZSBvZiB0aGUgcHJvcGVydHkgYXQgd2hpY2ggaGlnaGxpZ2hlcnMgd2lsbCBiZSBzdG9yZWQuXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG5leHBvcnRzLmhpZ2hsaWdodGVyc05zID0gJ19oaWdobGlnaHRlcnMnO1xuIl19

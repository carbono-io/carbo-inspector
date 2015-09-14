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
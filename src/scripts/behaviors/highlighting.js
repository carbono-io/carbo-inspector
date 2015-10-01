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
 * @return {{tagName: String, attributes: Object, computedStyle: Object }Object} 
 *         Data on the current active element.
 */
exports.getHighlighterTargetData = function (highlighterId) {
    var hlt = this.getHighlighter(highlighterId);

    return this.getElementData(hlt.target);
};

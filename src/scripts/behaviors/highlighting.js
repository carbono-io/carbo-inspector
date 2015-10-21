/**
 * The MIT License (MIT)
 * Copyright (c) 2015 Fabrica de Aplicativos S/A
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 */
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

    if (!element) {
        return;
    }

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

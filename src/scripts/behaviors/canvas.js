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
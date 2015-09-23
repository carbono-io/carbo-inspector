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
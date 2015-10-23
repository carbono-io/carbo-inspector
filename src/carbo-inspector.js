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


        //add a vent listener when dom of  #app element changes;
        var app = document.querySelector('#app');
         app.addEventListener('dom-change', function () {
              this.executeParentOperation("domChange");
         }.bind(this));

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
        //set label color
        if(options.surfaceStyle.labelColor){
          var labelElement = _highlighter.element.querySelector(".element-label");
          labelElement.style["background-color"] = options.surfaceStyle.labelColor;
        }
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
        console.log('scroll x: %s, y: %s', deltaX, deltaY);
        window.scrollBy(deltaX, deltaY);
    },
});

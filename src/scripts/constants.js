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
 * List of operations that can be called via window.postMessage
 * from the outer world.
 * @type {Object}
 */
exports.operationWhitelist = {
    // general
    createHighlighter: true,

    // highlighting
    highlightElementAtPoint: true,
    highlightElementForSelector: true,
    unHighlight: true,
    hideHighlighter: true,
    showHighlighter: true,
    getHighlighterTargetData: true,
    getHighlighterTargetChildrenData: true,

    // manipulation
    replaceInnerHTML: true,
    applyStyle: true,

    // analysis
    getElementsData: true,
    getElementTreeData: true,
    elementMatches: true,

    //
    getActiveElementData: true,
    getBodySize: true,
    scrollBy: true,
    areFocusAndHoverTogether: true,
    activateLoading: true,
    deactivateLoading: true,
    executeHighlighterOperation: true,
    changeRoute:true,
    reloadFrame:true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

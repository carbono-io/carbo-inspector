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

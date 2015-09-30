/**
 * List of operations that can be called via window.postMessage
 * from the outer world.
 * @type {Object}
 */
exports.operationWhitelist = {
    // highlighter related
    createHighlighter: true,
    unHighlight: true,
    getHighlighterTargetData: true,
    highlightElementAtPoint: true,
    highlightElementForSelector: true,
    replaceInnerHTML: true,
    getElementData: true,

    getActiveElementData: true,
    scrollBy: true,
    areFocusAndHoverTogether: true,
    activateLoading: true,
    deactivateLoading: true,
    executeHighlighterOperation: true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';

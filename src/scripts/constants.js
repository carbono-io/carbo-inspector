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

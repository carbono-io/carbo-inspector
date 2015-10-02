'use strict';

/**
 * Implements analysis related methods
 */

var DOMHelpers = require('../aux/dom');

/**
 * Auxiliary function that retrieves data for a given element
 * @param  {DOMElementNode} element Element from which data should be read
 * @return {POJO}           data object
 */
function _getElementData(element) {

    // get the boundingRect
    var boundingRect = element.getBoundingClientRect();

    var data = {
        tagName: element.tagName,
        attributes: DOMHelpers.getAttributes(element),
        // computedStyle: DOMHelpers.getComputedStyle(element),
        rect: {
            top: boundingRect.top,
            left: boundingRect.left,
            width: boundingRect.width,
            height: boundingRect.height,
        },
    };

    return data;
}

/**
 * Retrieves data for an array of elements
 * @param  {CSSSelector|DOMElementNodeList|Array} elements
 *         Either a css selector or an list of elements
 * @return {Array -> ElementData}
 *         Array of element data objects
 */
exports.getElementsData = function (elements) {

    // convert elements into an elements array
    if (typeof elements === 'string') {
        // elements is a CSSSelector
        elements = document.querySelectorAll(elements);

        // convert into array
        elements = Array.prototype.slice.call(elements, 0);

    } else if (!_.isArray(elements)) {
        // probably NodeList
        // https://developer.mozilla.org/en/docs/Web/API/NodeList
        elements = Array.prototype.slice.call(elements, 0);
    }

    // loop through elements and return array of data
    return elements.map(_getElementData);
};

// https://developer.mozilla.org/en/docs/Web/API/Node
var NODE_TYPES = {
    '1': 'ELEMENT_NODE',
    '2': 'ATTRIBUTE_NODE',
    '3': 'TEXT_NODE',
    '4': 'CDATA_SECTION_NODE',
    '5': 'ENTITY_REFERENCE_NODE',
    '6': 'ENTITY_NODE',
    '7': 'PROCESSING_INSTRUCTION_NODE',
    '8': 'COMMENT_NODE',
    '9': 'DOCUMENT_NODE',
    '10': 'DOCUMENT_TYPE_NODE',
    '11': 'DOCUMENT_FRAGMENT_NODE',
    '12': 'NOTATION_NODE'
};

/**
 * Auxiliary function
 */
function _getElementNodeTreeData(node, filterFn) {

    if (node.nodeType !== 1) {
        // If node is not an element, return null
        return null;
    }

    var nodeData = {
        nodeType: node.nodeType,
        tagName: node.tagName,
        childNodes: []
    };

    // Use Polymer.dom API to normalize shady/shadow dom.
    Polymer.dom(node).childNodes.forEach(function (child) {

        var childNodeData = _getElementNodeTreeData(child, filterFn);

        if (childNodeData) {
            // only push to childNodes if is not null
            
            // check if there is a filter function
            // pass the node to the filterFn
            if (!filterFn || filterFn(child)) {
                nodeData.childNodes.push(childNodeData);
            } 
        }

    });

    return nodeData;
}

/**
 * Retrieves the nodes tree for a given root and a tree node selector
 * @param  {CSSSelector|Node} root   The root at which start looking for nodes
 * @param  {CSSSelector} filterFn 
 *     A CSS selector string to check if a node
 *     should be in the tree or not.
 * @return {POJO}                  The tree in a plain js object (may be JSON.stringified)
 */
exports.getElementNodeTreeData = function (root, filterFn) {

    return _getElementNodeTreeData(root, filterFn);

};
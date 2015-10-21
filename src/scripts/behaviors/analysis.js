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
 * Implements analysis related methods
 */

var DOMHelpers = require('../aux/dom');

/**
 * Auxiliary function that retrieves data for a given element
 * @param  {DOMElementNode} element Element from which data should be read
 * @return {POJO}           data object
 */
function _getElementData(element) {

    var data = {
        tagName: element.tagName,
        attributes: DOMHelpers.getAttributes(element),
    };

    if (element.getBoundingClientRect) {
        // get the boundingRect
        var boundingRect = element.getBoundingClientRect();

        data.rect = {
            top: boundingRect.top,
            bottom: boundingRect.bottom,
            left: boundingRect.left,
            right: boundingRect.right,
            width: boundingRect.width,
            height: boundingRect.height,
        };
    }

    // computedStyle: DOMHelpers.getComputedStyle(element),

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

var ELEMENT_NODE_TYPES = [1];

/**
 * Auxiliary function
 */
function _getElementTreeData(node, filterFn) {

    if (node.nodeType !== 1) {
        // If node is not an element, return null
        return null;
    }

    var elementData = _getElementData(node);

    // children
    elementData.childNodes = [];

    // Use Polymer.dom API to normalize shady/shadow dom.
    Polymer.dom(node).childNodes.forEach(function (child) {

        var childNodeData = _getElementTreeData(child, filterFn);

        if (childNodeData) {
            // only push to childNodes if is not null
            
            // check if there is a filter function
            // pass the node to the filterFn
            if (!filterFn || filterFn(child)) {
                elementData.childNodes.push(childNodeData);
            } 
        }

    });

    return elementData;
}

/**
 * Retrieves the nodes tree for a given root and a tree node selector
 * @param  {CSSSelector|Node} root   The root at which start looking for nodes
 * @param  {CSSSelector} filterFn 
 *     A CSS selector string to check if a node
 *     should be in the tree or not.
 * @return {POJO}                  The tree in a plain js object (may be JSON.stringified)
 */
exports.getElementTreeData = function (root, filterFn) {

    root = _.isString(root) ? document.querySelector(root) : root;

    return _getElementTreeData(root, filterFn);

};

exports.elementMatches = function (element, selector) {
    element = _.isString(element) ? document.querySelector(element) : element;

    return element.matches(selector);
};
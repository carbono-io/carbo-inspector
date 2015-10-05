'use strict';

/**
 * Implements application manipulation methods
 */

/**
 * Replaces the innerHTML of an element selected by CSSSelector
 * @param  {CSSSelector|DOMElementNode} element 
 * @param  {HTMLString} contents 
 */
exports.replaceInnerHTML = function (element, contents) {

    // convert element into an element
    element = (typeof element === 'string') ? document.querySelector(element) : element;

    Polymer.dom(element).innerHTML = contents;
};

exports.applyStyle = function (elements, property, value) {

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

    elements.forEach(function (el) {
        el.style[property] = value;
    });
};
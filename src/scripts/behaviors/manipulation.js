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

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
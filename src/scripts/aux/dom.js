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
 * Helper methods for manipulating DOMNodes
 */

/**
 * Retrieves the computed style of an given element
 * @param  {DOMNode} element The element from which to read computedSytles
 * @return {Object}          Object with the computed styles
 */
exports.getComputedStyle = function (element) {

    if (!element) {
        throw new Error('No element for getComputedStyle(element)');
    }

    var cs = {};

    // Get the computed cs of the element
    var _cs = window.getComputedStyle(element);

    for (var i = _cs.length - 1; i >=0; i--) {
        var prop = _cs[i];

        cs[prop] = _cs.getPropertyValue(prop);
    }

    return cs;
};

/**
 * Retrieves the attributes of a given element
 * @param  {DOMNode} element The element from which to read attributes
 * @return {Object}          Object with all attributes
 */
exports.getAttributes = function (element) {

    if (!element) {
        throw new Error('No element for getAttributes(element)');
    }

    // Object on which to store attributes
    var attributes = {};

    var _attrs = element.attributes;

    for (var i = _attrs.length - 1; i >= 0; i--) {
        attributes[_attrs[i].name] = _attrs[i].value;
    }

    return attributes;
};
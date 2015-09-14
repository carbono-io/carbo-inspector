

/**
 * Retrieves information about the active element.
 * @return {{tagName: String, attributes: Object, computedStyle: Object }Object} 
 *         Data on the current active element.
 */
getActiveElementData: function () {
    var element = this.activeElement;

    var boundingRect = element.getBoundingClientRect();

    //PEGA AS INFOS DO ELEMENTO CLICADO ENVIADAS PELO CANVAS
    var data = {
        tagName: element.tagName,
        attributes: DOMHelpers.getAttributes(element),
        computedStyle: DOMHelpers.getComputedStyle(element),
        rect: {
            top: boundingRect.top,
            left: boundingRect.left,
            width: boundingRect.width,
            height: boundingRect.height,
        },
    };

    return data;
},

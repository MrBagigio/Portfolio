// HTML Sanitization Utility
// Prevents XSS attacks by removing dangerous HTML elements and attributes

class HTMLSanitizer {
    static sanitize(dirtyHTML) {
        if (!dirtyHTML || typeof dirtyHTML !== 'string') {
            return '';
        }

        // Create a temporary DOM element to parse HTML safely
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = dirtyHTML;

        // Recursively sanitize all elements
        const sanitizeElement = (element) => {
            // Remove dangerous elements entirely
            const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta'];
            if (dangerousTags.includes(element.tagName.toLowerCase())) {
                element.remove();
                return;
            }

            // Remove dangerous attributes
            const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onkeypress', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onblur', 'onfocus', 'onabort', 'onbeforeunload', 'onhashchange', 'onloadstart', 'onprogress', 'onerror', 'onabort', 'onload', 'onemptied', 'onstalled', 'onsuspend', 'oncanplay', 'oncanplaythrough', 'onplaying', 'onpause', 'onseeked', 'onseeking', 'ontimeupdate', 'onended', 'onvolumechange', 'onwaiting', 'onshow', 'ontoggle', 'onbeforeprint', 'onafterprint', 'onbeforeunload', 'onunload', 'onpageshow', 'onpagehide', 'onpopstate', 'onstorage', 'ononline', 'onoffline', 'onmessage', 'onopen', 'onmessage', 'onerror', 'onclose', 'src', 'href'];

            for (let attr of Array.from(element.attributes)) {
                if (dangerousAttrs.some(dangerous => attr.name.toLowerCase().includes(dangerous))) {
                    element.removeAttribute(attr.name);
                }
            }

            // Sanitize children recursively
            for (let child of Array.from(element.children)) {
                sanitizeElement(child);
            }
        };

        // Sanitize all top-level elements
        for (let child of Array.from(tempDiv.children)) {
            sanitizeElement(child);
        }

        return tempDiv.innerHTML;
    }
}

// Export for use in other modules
window.HTMLSanitizer = HTMLSanitizer;
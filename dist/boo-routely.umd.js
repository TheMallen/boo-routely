(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global['boo-routely'] = {}));
}(this, function (exports) { 'use strict';

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const directives = new WeakMap();
    /**
     * Brands a function as a directive so that lit-html will call the function
     * during template rendering, rather than passing as a value.
     *
     * @param f The directive factory function. Must be a function that returns a
     * function of the signature `(part: Part) => void`. The returned function will
     * be called with the part object
     *
     * @example
     *
     * ```
     * import {directive, html} from 'lit-html';
     *
     * const immutable = directive((v) => (part) => {
     *   if (part.value !== v) {
     *     part.setValue(v)
     *   }
     * });
     * ```
     */
    // tslint:disable-next-line:no-any
    const directive = (f) => ((...args) => {
        const d = f(...args);
        directives.set(d, true);
        return d;
    });
    const isDirective = (o) => {
        return typeof o === 'function' && directives.has(o);
    };
    //# sourceMappingURL=directive.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * True if the custom elements polyfill is in use.
     */
    const isCEPolyfill = window.customElements !== undefined &&
        window.customElements.polyfillWrapFlushCallback !==
            undefined;
    /**
     * Removes nodes, starting from `startNode` (inclusive) to `endNode`
     * (exclusive), from `container`.
     */
    const removeNodes = (container, startNode, endNode = null) => {
        let node = startNode;
        while (node !== endNode) {
            const n = node.nextSibling;
            container.removeChild(node);
            node = n;
        }
    };
    //# sourceMappingURL=dom.js.map

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * A sentinel value that signals that a value was handled by a directive and
     * should not be written to the DOM.
     */
    const noChange = {};
    /**
     * A sentinel value that signals a NodePart to fully clear its content.
     */
    const nothing = {};
    //# sourceMappingURL=part.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An expression marker with embedded unique key to avoid collision with
     * possible text in templates.
     */
    const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
    /**
     * An expression marker used text-positions, multi-binding attributes, and
     * attributes with markup-like text values.
     */
    const nodeMarker = `<!--${marker}-->`;
    const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
    /**
     * Suffix appended to all bound attribute names.
     */
    const boundAttributeSuffix = '$lit$';
    /**
     * An updateable Template that tracks the location of dynamic parts.
     */
    class Template {
        constructor(result, element) {
            this.parts = [];
            this.element = element;
            let index = -1;
            let partIndex = 0;
            const nodesToRemove = [];
            const _prepareTemplate = (template) => {
                const content = template.content;
                // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
                // null
                const walker = document.createTreeWalker(content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
                // Keeps track of the last index associated with a part. We try to delete
                // unnecessary nodes, but we never want to associate two different parts
                // to the same index. They must have a constant node between.
                let lastPartIndex = 0;
                while (walker.nextNode()) {
                    index++;
                    const node = walker.currentNode;
                    if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                        if (node.hasAttributes()) {
                            const attributes = node.attributes;
                            // Per
                            // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                            // attributes are not guaranteed to be returned in document order.
                            // In particular, Edge/IE can return them out of order, so we cannot
                            // assume a correspondance between part index and attribute index.
                            let count = 0;
                            for (let i = 0; i < attributes.length; i++) {
                                if (attributes[i].value.indexOf(marker) >= 0) {
                                    count++;
                                }
                            }
                            while (count-- > 0) {
                                // Get the template literal section leading up to the first
                                // expression in this attribute
                                const stringForPart = result.strings[partIndex];
                                // Find the attribute name
                                const name = lastAttributeNameRegex.exec(stringForPart)[2];
                                // Find the corresponding attribute
                                // All bound attributes have had a suffix added in
                                // TemplateResult#getHTML to opt out of special attribute
                                // handling. To look up the attribute value we also need to add
                                // the suffix.
                                const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                                const attributeValue = node.getAttribute(attributeLookupName);
                                const strings = attributeValue.split(markerRegex);
                                this.parts.push({ type: 'attribute', index, name, strings });
                                node.removeAttribute(attributeLookupName);
                                partIndex += strings.length - 1;
                            }
                        }
                        if (node.tagName === 'TEMPLATE') {
                            _prepareTemplate(node);
                        }
                    }
                    else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                        const data = node.data;
                        if (data.indexOf(marker) >= 0) {
                            const parent = node.parentNode;
                            const strings = data.split(markerRegex);
                            const lastIndex = strings.length - 1;
                            // Generate a new text node for each literal section
                            // These nodes are also used as the markers for node parts
                            for (let i = 0; i < lastIndex; i++) {
                                parent.insertBefore((strings[i] === '') ? createMarker() :
                                    document.createTextNode(strings[i]), node);
                                this.parts.push({ type: 'node', index: ++index });
                            }
                            // If there's no text, we must insert a comment to mark our place.
                            // Else, we can trust it will stick around after cloning.
                            if (strings[lastIndex] === '') {
                                parent.insertBefore(createMarker(), node);
                                nodesToRemove.push(node);
                            }
                            else {
                                node.data = strings[lastIndex];
                            }
                            // We have a part for each match found
                            partIndex += lastIndex;
                        }
                    }
                    else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                        if (node.data === marker) {
                            const parent = node.parentNode;
                            // Add a new marker node to be the startNode of the Part if any of
                            // the following are true:
                            //  * We don't have a previousSibling
                            //  * The previousSibling is already the start of a previous part
                            if (node.previousSibling === null || index === lastPartIndex) {
                                index++;
                                parent.insertBefore(createMarker(), node);
                            }
                            lastPartIndex = index;
                            this.parts.push({ type: 'node', index });
                            // If we don't have a nextSibling, keep this node so we have an end.
                            // Else, we can remove it to save future costs.
                            if (node.nextSibling === null) {
                                node.data = '';
                            }
                            else {
                                nodesToRemove.push(node);
                                index--;
                            }
                            partIndex++;
                        }
                        else {
                            let i = -1;
                            while ((i = node.data.indexOf(marker, i + 1)) !==
                                -1) {
                                // Comment node has a binding marker inside, make an inactive part
                                // The binding won't work, but subsequent bindings will
                                // TODO (justinfagnani): consider whether it's even worth it to
                                // make bindings in comments work
                                this.parts.push({ type: 'node', index: -1 });
                            }
                        }
                    }
                }
            };
            _prepareTemplate(element);
            // Remove text binding nodes after the walk to not disturb the TreeWalker
            for (const n of nodesToRemove) {
                n.parentNode.removeChild(n);
            }
        }
    }
    const isTemplatePartActive = (part) => part.index !== -1;
    // Allows `document.createComment('')` to be renamed for a
    // small manual size-savings.
    const createMarker = () => document.createComment('');
    /**
     * This regex extracts the attribute name preceding an attribute-position
     * expression. It does this by matching the syntax allowed for attributes
     * against the string literal directly preceding the expression, assuming that
     * the expression is in an attribute-value position.
     *
     * See attributes in the HTML spec:
     * https://www.w3.org/TR/html5/syntax.html#attributes-0
     *
     * "\0-\x1F\x7F-\x9F" are Unicode control characters
     *
     * " \x09\x0a\x0c\x0d" are HTML space characters:
     * https://www.w3.org/TR/html5/infrastructure.html#space-character
     *
     * So an attribute is:
     *  * The name: any character except a control character, space character, ('),
     *    ("), ">", "=", or "/"
     *  * Followed by zero or more space characters
     *  * Followed by "="
     *  * Followed by zero or more space characters
     *  * Followed by:
     *    * Any character except space, ('), ("), "<", ">", "=", (`), or
     *    * (") then any non-("), or
     *    * (') then any non-(')
     */
    const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;
    //# sourceMappingURL=template.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An instance of a `Template` that can be attached to the DOM and updated
     * with new values.
     */
    class TemplateInstance {
        constructor(template, processor, options) {
            this._parts = [];
            this.template = template;
            this.processor = processor;
            this.options = options;
        }
        update(values) {
            let i = 0;
            for (const part of this._parts) {
                if (part !== undefined) {
                    part.setValue(values[i]);
                }
                i++;
            }
            for (const part of this._parts) {
                if (part !== undefined) {
                    part.commit();
                }
            }
        }
        _clone() {
            // When using the Custom Elements polyfill, clone the node, rather than
            // importing it, to keep the fragment in the template's document. This
            // leaves the fragment inert so custom elements won't upgrade and
            // potentially modify their contents by creating a polyfilled ShadowRoot
            // while we traverse the tree.
            const fragment = isCEPolyfill ?
                this.template.element.content.cloneNode(true) :
                document.importNode(this.template.element.content, true);
            const parts = this.template.parts;
            let partIndex = 0;
            let nodeIndex = 0;
            const _prepareInstance = (fragment) => {
                // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
                // null
                const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
                let node = walker.nextNode();
                // Loop through all the nodes and parts of a template
                while (partIndex < parts.length && node !== null) {
                    const part = parts[partIndex];
                    // Consecutive Parts may have the same node index, in the case of
                    // multiple bound attributes on an element. So each iteration we either
                    // increment the nodeIndex, if we aren't on a node with a part, or the
                    // partIndex if we are. By not incrementing the nodeIndex when we find a
                    // part, we allow for the next part to be associated with the current
                    // node if neccessasry.
                    if (!isTemplatePartActive(part)) {
                        this._parts.push(undefined);
                        partIndex++;
                    }
                    else if (nodeIndex === part.index) {
                        if (part.type === 'node') {
                            const part = this.processor.handleTextExpression(this.options);
                            part.insertAfterNode(node.previousSibling);
                            this._parts.push(part);
                        }
                        else {
                            this._parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                        }
                        partIndex++;
                    }
                    else {
                        nodeIndex++;
                        if (node.nodeName === 'TEMPLATE') {
                            _prepareInstance(node.content);
                        }
                        node = walker.nextNode();
                    }
                }
            };
            _prepareInstance(fragment);
            if (isCEPolyfill) {
                document.adoptNode(fragment);
                customElements.upgrade(fragment);
            }
            return fragment;
        }
    }
    //# sourceMappingURL=template-instance.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The return type of `html`, which holds a Template and the values from
     * interpolated expressions.
     */
    class TemplateResult {
        constructor(strings, values, type, processor) {
            this.strings = strings;
            this.values = values;
            this.type = type;
            this.processor = processor;
        }
        /**
         * Returns a string of HTML used to create a `<template>` element.
         */
        getHTML() {
            const endIndex = this.strings.length - 1;
            let html = '';
            for (let i = 0; i < endIndex; i++) {
                const s = this.strings[i];
                // This exec() call does two things:
                // 1) Appends a suffix to the bound attribute name to opt out of special
                // attribute value parsing that IE11 and Edge do, like for style and
                // many SVG attributes. The Template class also appends the same suffix
                // when looking up attributes to create Parts.
                // 2) Adds an unquoted-attribute-safe marker for the first expression in
                // an attribute. Subsequent attribute expressions will use node markers,
                // and this is safe since attributes with multiple expressions are
                // guaranteed to be quoted.
                const match = lastAttributeNameRegex.exec(s);
                if (match) {
                    // We're starting a new bound attribute.
                    // Add the safe attribute suffix, and use unquoted-attribute-safe
                    // marker.
                    html += s.substr(0, match.index) + match[1] + match[2] +
                        boundAttributeSuffix + match[3] + marker;
                }
                else {
                    // We're either in a bound node, or trailing bound attribute.
                    // Either way, nodeMarker is safe to use.
                    html += s + nodeMarker;
                }
            }
            return html + this.strings[endIndex];
        }
        getTemplateElement() {
            const template = document.createElement('template');
            template.innerHTML = this.getHTML();
            return template;
        }
    }
    //# sourceMappingURL=template-result.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const isPrimitive = (value) => {
        return (value === null ||
            !(typeof value === 'object' || typeof value === 'function'));
    };
    /**
     * Sets attribute values for AttributeParts, so that the value is only set once
     * even if there are multiple parts for an attribute.
     */
    class AttributeCommitter {
        constructor(element, name, strings) {
            this.dirty = true;
            this.element = element;
            this.name = name;
            this.strings = strings;
            this.parts = [];
            for (let i = 0; i < strings.length - 1; i++) {
                this.parts[i] = this._createPart();
            }
        }
        /**
         * Creates a single part. Override this to create a differnt type of part.
         */
        _createPart() {
            return new AttributePart(this);
        }
        _getValue() {
            const strings = this.strings;
            const l = strings.length - 1;
            let text = '';
            for (let i = 0; i < l; i++) {
                text += strings[i];
                const part = this.parts[i];
                if (part !== undefined) {
                    const v = part.value;
                    if (v != null &&
                        (Array.isArray(v) ||
                            // tslint:disable-next-line:no-any
                            typeof v !== 'string' && v[Symbol.iterator])) {
                        for (const t of v) {
                            text += typeof t === 'string' ? t : String(t);
                        }
                    }
                    else {
                        text += typeof v === 'string' ? v : String(v);
                    }
                }
            }
            text += strings[l];
            return text;
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                this.element.setAttribute(this.name, this._getValue());
            }
        }
    }
    class AttributePart {
        constructor(comitter) {
            this.value = undefined;
            this.committer = comitter;
        }
        setValue(value) {
            if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
                this.value = value;
                // If the value is a not a directive, dirty the committer so that it'll
                // call setAttribute. If the value is a directive, it'll dirty the
                // committer if it calls setValue().
                if (!isDirective(value)) {
                    this.committer.dirty = true;
                }
            }
        }
        commit() {
            while (isDirective(this.value)) {
                const directive$$1 = this.value;
                this.value = noChange;
                directive$$1(this);
            }
            if (this.value === noChange) {
                return;
            }
            this.committer.commit();
        }
    }
    class NodePart {
        constructor(options) {
            this.value = undefined;
            this._pendingValue = undefined;
            this.options = options;
        }
        /**
         * Inserts this part into a container.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendInto(container) {
            this.startNode = container.appendChild(createMarker());
            this.endNode = container.appendChild(createMarker());
        }
        /**
         * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
         * its next sibling must be static, unchanging nodes such as those that appear
         * in a literal section of a template.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterNode(ref) {
            this.startNode = ref;
            this.endNode = ref.nextSibling;
        }
        /**
         * Appends this part into a parent part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendIntoPart(part) {
            part._insert(this.startNode = createMarker());
            part._insert(this.endNode = createMarker());
        }
        /**
         * Appends this part after `ref`
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterPart(ref) {
            ref._insert(this.startNode = createMarker());
            this.endNode = ref.endNode;
            ref.endNode = this.startNode;
        }
        setValue(value) {
            this._pendingValue = value;
        }
        commit() {
            while (isDirective(this._pendingValue)) {
                const directive$$1 = this._pendingValue;
                this._pendingValue = noChange;
                directive$$1(this);
            }
            const value = this._pendingValue;
            if (value === noChange) {
                return;
            }
            if (isPrimitive(value)) {
                if (value !== this.value) {
                    this._commitText(value);
                }
            }
            else if (value instanceof TemplateResult) {
                this._commitTemplateResult(value);
            }
            else if (value instanceof Node) {
                this._commitNode(value);
            }
            else if (Array.isArray(value) ||
                // tslint:disable-next-line:no-any
                value[Symbol.iterator]) {
                this._commitIterable(value);
            }
            else if (value === nothing) {
                this.value = nothing;
                this.clear();
            }
            else {
                // Fallback, will render the string representation
                this._commitText(value);
            }
        }
        _insert(node) {
            this.endNode.parentNode.insertBefore(node, this.endNode);
        }
        _commitNode(value) {
            if (this.value === value) {
                return;
            }
            this.clear();
            this._insert(value);
            this.value = value;
        }
        _commitText(value) {
            const node = this.startNode.nextSibling;
            value = value == null ? '' : value;
            if (node === this.endNode.previousSibling &&
                node.nodeType === 3 /* Node.TEXT_NODE */) {
                // If we only have a single text node between the markers, we can just
                // set its value, rather than replacing it.
                // TODO(justinfagnani): Can we just check if this.value is primitive?
                node.data = value;
            }
            else {
                this._commitNode(document.createTextNode(typeof value === 'string' ? value : String(value)));
            }
            this.value = value;
        }
        _commitTemplateResult(value) {
            const template = this.options.templateFactory(value);
            if (this.value instanceof TemplateInstance &&
                this.value.template === template) {
                this.value.update(value.values);
            }
            else {
                // Make sure we propagate the template processor from the TemplateResult
                // so that we use its syntax extension, etc. The template factory comes
                // from the render function options so that it can control template
                // caching and preprocessing.
                const instance = new TemplateInstance(template, value.processor, this.options);
                const fragment = instance._clone();
                instance.update(value.values);
                this._commitNode(fragment);
                this.value = instance;
            }
        }
        _commitIterable(value) {
            // For an Iterable, we create a new InstancePart per item, then set its
            // value to the item. This is a little bit of overhead for every item in
            // an Iterable, but it lets us recurse easily and efficiently update Arrays
            // of TemplateResults that will be commonly returned from expressions like:
            // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
            // If _value is an array, then the previous render was of an
            // iterable and _value will contain the NodeParts from the previous
            // render. If _value is not an array, clear this part and make a new
            // array for NodeParts.
            if (!Array.isArray(this.value)) {
                this.value = [];
                this.clear();
            }
            // Lets us keep track of how many items we stamped so we can clear leftover
            // items from a previous render
            const itemParts = this.value;
            let partIndex = 0;
            let itemPart;
            for (const item of value) {
                // Try to reuse an existing part
                itemPart = itemParts[partIndex];
                // If no existing part, create a new one
                if (itemPart === undefined) {
                    itemPart = new NodePart(this.options);
                    itemParts.push(itemPart);
                    if (partIndex === 0) {
                        itemPart.appendIntoPart(this);
                    }
                    else {
                        itemPart.insertAfterPart(itemParts[partIndex - 1]);
                    }
                }
                itemPart.setValue(item);
                itemPart.commit();
                partIndex++;
            }
            if (partIndex < itemParts.length) {
                // Truncate the parts array so _value reflects the current state
                itemParts.length = partIndex;
                this.clear(itemPart && itemPart.endNode);
            }
        }
        clear(startNode = this.startNode) {
            removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
        }
    }
    /**
     * Implements a boolean attribute, roughly as defined in the HTML
     * specification.
     *
     * If the value is truthy, then the attribute is present with a value of
     * ''. If the value is falsey, the attribute is removed.
     */
    class BooleanAttributePart {
        constructor(element, name, strings) {
            this.value = undefined;
            this._pendingValue = undefined;
            if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
                throw new Error('Boolean attributes can only contain a single expression');
            }
            this.element = element;
            this.name = name;
            this.strings = strings;
        }
        setValue(value) {
            this._pendingValue = value;
        }
        commit() {
            while (isDirective(this._pendingValue)) {
                const directive$$1 = this._pendingValue;
                this._pendingValue = noChange;
                directive$$1(this);
            }
            if (this._pendingValue === noChange) {
                return;
            }
            const value = !!this._pendingValue;
            if (this.value !== value) {
                if (value) {
                    this.element.setAttribute(this.name, '');
                }
                else {
                    this.element.removeAttribute(this.name);
                }
            }
            this.value = value;
            this._pendingValue = noChange;
        }
    }
    /**
     * Sets attribute values for PropertyParts, so that the value is only set once
     * even if there are multiple parts for a property.
     *
     * If an expression controls the whole property value, then the value is simply
     * assigned to the property under control. If there are string literals or
     * multiple expressions, then the strings are expressions are interpolated into
     * a string first.
     */
    class PropertyCommitter extends AttributeCommitter {
        constructor(element, name, strings) {
            super(element, name, strings);
            this.single =
                (strings.length === 2 && strings[0] === '' && strings[1] === '');
        }
        _createPart() {
            return new PropertyPart(this);
        }
        _getValue() {
            if (this.single) {
                return this.parts[0].value;
            }
            return super._getValue();
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                // tslint:disable-next-line:no-any
                this.element[this.name] = this._getValue();
            }
        }
    }
    class PropertyPart extends AttributePart {
    }
    // Detect event listener options support. If the `capture` property is read
    // from the options object, then options are supported. If not, then the thrid
    // argument to add/removeEventListener is interpreted as the boolean capture
    // value so we should only pass the `capture` property.
    let eventOptionsSupported = false;
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // tslint:disable-next-line:no-any
        window.addEventListener('test', options, options);
        // tslint:disable-next-line:no-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
    }
    class EventPart {
        constructor(element, eventName, eventContext) {
            this.value = undefined;
            this._pendingValue = undefined;
            this.element = element;
            this.eventName = eventName;
            this.eventContext = eventContext;
            this._boundHandleEvent = (e) => this.handleEvent(e);
        }
        setValue(value) {
            this._pendingValue = value;
        }
        commit() {
            while (isDirective(this._pendingValue)) {
                const directive$$1 = this._pendingValue;
                this._pendingValue = noChange;
                directive$$1(this);
            }
            if (this._pendingValue === noChange) {
                return;
            }
            const newListener = this._pendingValue;
            const oldListener = this.value;
            const shouldRemoveListener = newListener == null ||
                oldListener != null &&
                    (newListener.capture !== oldListener.capture ||
                        newListener.once !== oldListener.once ||
                        newListener.passive !== oldListener.passive);
            const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
            if (shouldRemoveListener) {
                this.element.removeEventListener(this.eventName, this._boundHandleEvent, this._options);
            }
            if (shouldAddListener) {
                this._options = getOptions(newListener);
                this.element.addEventListener(this.eventName, this._boundHandleEvent, this._options);
            }
            this.value = newListener;
            this._pendingValue = noChange;
        }
        handleEvent(event) {
            if (typeof this.value === 'function') {
                this.value.call(this.eventContext || this.element, event);
            }
            else {
                this.value.handleEvent(event);
            }
        }
    }
    // We copy options because of the inconsistent behavior of browsers when reading
    // the third argument of add/removeEventListener. IE11 doesn't support options
    // at all. Chrome 41 only reads `capture` if the argument is an object.
    const getOptions = (o) => o &&
        (eventOptionsSupported ?
            { capture: o.capture, passive: o.passive, once: o.once } :
            o.capture);
    //# sourceMappingURL=parts.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * Creates Parts when a template is instantiated.
     */
    class DefaultTemplateProcessor {
        /**
         * Create parts for an attribute-position binding, given the event, attribute
         * name, and string literals.
         *
         * @param element The element containing the binding
         * @param name  The attribute name
         * @param strings The string literals. There are always at least two strings,
         *   event for fully-controlled bindings with a single expression.
         */
        handleAttributeExpressions(element, name, strings, options) {
            const prefix = name[0];
            if (prefix === '.') {
                const comitter = new PropertyCommitter(element, name.slice(1), strings);
                return comitter.parts;
            }
            if (prefix === '@') {
                return [new EventPart(element, name.slice(1), options.eventContext)];
            }
            if (prefix === '?') {
                return [new BooleanAttributePart(element, name.slice(1), strings)];
            }
            const comitter = new AttributeCommitter(element, name, strings);
            return comitter.parts;
        }
        /**
         * Create parts for a text-position binding.
         * @param templateFactory
         */
        handleTextExpression(options) {
            return new NodePart(options);
        }
    }
    const defaultTemplateProcessor = new DefaultTemplateProcessor();
    //# sourceMappingURL=default-template-processor.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The default TemplateFactory which caches Templates keyed on
     * result.type and result.strings.
     */
    function templateFactory(result) {
        let templateCache = templateCaches.get(result.type);
        if (templateCache === undefined) {
            templateCache = {
                stringsArray: new WeakMap(),
                keyString: new Map()
            };
            templateCaches.set(result.type, templateCache);
        }
        let template = templateCache.stringsArray.get(result.strings);
        if (template !== undefined) {
            return template;
        }
        // If the TemplateStringsArray is new, generate a key from the strings
        // This key is shared between all templates with identical content
        const key = result.strings.join(marker);
        // Check if we already have a Template for this key
        template = templateCache.keyString.get(key);
        if (template === undefined) {
            // If we have not seen this key before, create a new Template
            template = new Template(result, result.getTemplateElement());
            // Cache the Template for this key
            templateCache.keyString.set(key, template);
        }
        // Cache all future queries for this TemplateStringsArray
        templateCache.stringsArray.set(result.strings, template);
        return template;
    }
    const templateCaches = new Map();
    //# sourceMappingURL=template-factory.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const parts = new WeakMap();
    /**
     * Renders a template to a container.
     *
     * To update a container with new values, reevaluate the template literal and
     * call `render` with the new result.
     *
     * @param result a TemplateResult created by evaluating a template tag like
     *     `html` or `svg`.
     * @param container A DOM parent to render to. The entire contents are either
     *     replaced, or efficiently updated if the same result type was previous
     *     rendered there.
     * @param options RenderOptions for the entire render tree rendered to this
     *     container. Render options must *not* change between renders to the same
     *     container, as those changes will not effect previously rendered DOM.
     */
    const render = (result, container, options) => {
        let part = parts.get(container);
        if (part === undefined) {
            removeNodes(container, container.firstChild);
            parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
            part.appendInto(container);
        }
        part.setValue(result);
        part.commit();
    };
    //# sourceMappingURL=render.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IMPORTANT: do not change the property name or the assignment expression.
    // This line will be used in regexes to search for lit-html usage.
    // TODO(justinfagnani): inject version number at build time
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');
    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     */
    const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);
    //# sourceMappingURL=lit-html.js.map

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // For each part, remember the value that was last rendered to the part by the
    // unsafeHTML directive, and the DocumentFragment that was last set as a value.
    // The DocumentFragment is used as a unique key to check if the last value
    // rendered to the part was with unsafeHTML. If not, we'll always re-render the
    // value passed to unsafeHTML.
    const previousValues = new WeakMap();
    /**
     * Renders the result as HTML, rather than text.
     *
     * Note, this is unsafe to use with any user-provided input that hasn't been
     * sanitized or escaped, as it may lead to cross-site-scripting
     * vulnerabilities.
     */
    const unsafeHTML = directive((value) => (part) => {
        if (!(part instanceof NodePart)) {
            throw new Error('unsafeHTML can only be used in text bindings');
        }
        const previousValue = previousValues.get(part);
        if (previousValue !== undefined && isPrimitive(value) &&
            value === previousValue.value && part.value === previousValue.fragment) {
            return;
        }
        const template = document.createElement('template');
        template.innerHTML = value; // innerHTML casts to string internally
        const fragment = document.importNode(template.content, true);
        part.setValue(fragment);
        previousValues.set(part, { value, fragment });
    });
    //# sourceMappingURL=unsafe-html.js.map

    const symbolFor = typeof Symbol === 'function' ? Symbol.for : str => str;

    const phaseSymbol = symbolFor('haunted.phase');
    const hookSymbol = symbolFor('haunted.hook');

    const updateSymbol = symbolFor('haunted.update');
    const commitSymbol = symbolFor('haunted.commit');
    const effectsSymbol = symbolFor('haunted.effects');
    const contextSymbol = symbolFor('haunted.context');

    const contextEvent = 'haunted.context';

    let current;
    let currentId = 0;

    function setCurrent(element) {
      current = element;
    }

    function clear() {
      current = null;
      currentId = 0;
    }

    function notify() {
      let id = currentId;
      currentId++;
      return id;
    }

    const defer = Promise.resolve().then.bind(Promise.resolve());

    function scheduler() {
      let tasks = [];
      let id;

      function runTasks() {
        id = null;
        let t = tasks;
        tasks = [];
        for(var i = 0, len = t.length; i < len; i++) {
          t[i]();
        }
      }

      return function(task) {
        tasks.push(task);
        if(id == null) {
          id = defer(runTasks);
        }
      };
    }

    const read = scheduler();
    const write = scheduler();

    class Container {
      constructor(renderer, frag, host) {
        this.renderer = renderer;
        this.frag = frag;
        this.host = host || frag;
        this[hookSymbol] = new Map();
        this[phaseSymbol] = null;
        this._updateQueued = false;
      }

      update() {
        if(this._updateQueued) return;
        read(() => {
          let result = this.handlePhase(updateSymbol);
          write(() => {
            this.handlePhase(commitSymbol, result);

            if(this[effectsSymbol]) {
              write(() => {
                this.handlePhase(effectsSymbol);
              });
            }
          });
          this._updateQueued = false;
        });
        this._updateQueued = true;
      }

      handlePhase(phase, arg) {
        this[phaseSymbol] = phase;
        switch(phase) {
          case commitSymbol: return this.commit(arg);
          case updateSymbol: return this.render();
          case effectsSymbol: return this.runEffects(effectsSymbol);
        }
        this[phaseSymbol] = null;
      }

      commit(result) {
        render(result, this.frag);
        this.runEffects(commitSymbol);
      }

      render() {
        setCurrent(this);
        let result = this.args ?
          this.renderer.apply(this.host, this.args) :
          this.renderer.call(this.host, this.host);
        clear();
        return result;
      }

      runEffects(symbol) {
        let effects = this[symbol];
        if(effects) {
          setCurrent(this);
          for(let effect of effects) {
            effect.call(this);
          }
          clear();
        }
      }

      teardown() {
        let hooks = this[hookSymbol];
        hooks.forEach((hook) => {
          if (typeof hook.teardown === 'function') {
            hook.teardown();
          }
        });
      }
    }

    function toCamelCase(val = '') {
      return val.indexOf('-') === -1 ? val.toLowerCase() : val.toLowerCase().split('-').reduce((out, part) => {
        return out ? out + part.charAt(0).toUpperCase() + part.slice(1) : part;
      },'') 
    }

    function component(renderer, BaseElement = HTMLElement, options = {useShadowDOM: true}) {
      class Element extends BaseElement {
        static get observedAttributes() {
          return renderer.observedAttributes || [];
        }

        constructor() {
          super();
          if (options.useShadowDOM === false) {
            this._container = new Container(renderer, this);
          } else {
            this.attachShadow({ mode: 'open' });
            this._container = new Container(renderer, this.shadowRoot, this);        
          }
        }

        connectedCallback() {
          this._container.update();
        }

        disconnectedCallback() {
          this._container.teardown();
        }

        attributeChangedCallback(name, _, newValue) {
          let val = newValue === '' ? true : newValue;
          Reflect.set(this, toCamelCase(name), val);
        }
      }
      function reflectiveProp(initialValue) {
        let value = initialValue;
        return Object.freeze({
          enumerable: true,
          configurable: true,
          get() {
            return value;
          },
          set(newValue) {
            value = newValue;
            this._container.update();
          }
        })
      }

      const proto = new Proxy(BaseElement.prototype, {
        set(target, key, value, receiver) {
          if(key in target) {
            Reflect.set(target, key, value);
          }
          let desc;
          if(typeof key === 'symbol' || key[0] === '_') {
            desc = {
              enumerable: true,
              configurable: true,
              writable: true,
              value
            }; 
          } else {
            desc = reflectiveProp(value);
          }
          Object.defineProperty(receiver, key, desc);

          if(desc.set) {
            desc.set.call(receiver, value);
          }

          return true;
        }
      });

      Object.setPrototypeOf(Element.prototype, proto);


      return Element;
    }

    class Hook {
      constructor(id, el) {
        this.id = id;
        this.el = el;
      }
    }

    function use(Hook, ...args) {
      let id = notify();
      let hooks = current[hookSymbol];
      
      let hook = hooks.get(id);
      if(!hook) {
        hook = new Hook(id, current, ...args);
        hooks.set(id, hook);
      }

      return hook.update(...args);
    }

    function hook(Hook) {
      return use.bind(null, Hook);
    }

    const useMemo = hook(class extends Hook {
      constructor(id, el, fn, values) {
        super(id, el);
        this.value = fn();
        this.values = values;
      }

      update(fn, values) {
        if(this.hasChanged(values)) {
          this.values = values;
          this.value = fn();
        }
        return this.value;
      }

      hasChanged(values) {
        return values.some((value, i) => this.values[i] !== value);
      }
    });

    const useCallback = (fn, inputs) => useMemo(() => fn, inputs);

    function setEffects(el, cb) {
      if(!(effectsSymbol in el)) {
        el[effectsSymbol] = [];
      }
      el[effectsSymbol].push(cb);
    }

    const useEffect = hook(class extends Hook {
      constructor(id, el) {
        super(id, el);
        this.values = false;
        setEffects(el, this);
      }

      update(callback, values) {
        this.callback = callback;
        this.lastValues = this.values;
        this.values = values;
      }

      call() {
        if(this.values) {
          if(this.hasChanged()) {
            this.run();
          }
        } else {
          this.run();
        }
      }

      run() {
        this.teardown();
        this._teardown = this.callback.call(this.el);
      }

      teardown() {
        if(this._teardown) {
          this._teardown();
        }
      }

      hasChanged() {
        return this.lastValues === false || this.values.some((value, i) => this.lastValues[i] !== value);
      }
    });

    const useState = hook(class extends Hook {
      constructor(id, el, initialValue) {
        super(id, el);
        this.updater = this.updater.bind(this);
        this.makeArgs(initialValue);
      }

      update() {
        return this.args;
      }

      updater(value) {
        if (typeof value === "function") {
          const updaterFn = value;
          const [previousValue] = this.args;
          value = updaterFn(previousValue);
        }

        this.makeArgs(value);
        this.el.update();
      }

      makeArgs(value) {
        this.args = Object.freeze([value, this.updater]);
      }
    });

    const useReducer = hook(class extends Hook {
      constructor(id, el, _, initialState) {
        super(id, el);
        this.dispatch = this.dispatch.bind(this);
        this.state = initialState;
      }

      update(reducer) {
        this.reducer = reducer;
        return [this.state, this.dispatch];
      }

      dispatch(action) {
        this.state = this.reducer(this.state, action);
        this.el.update();
      }
    });

    function setContexts(el, consumer) {
      if(!(contextSymbol in el)) {
        el[contextSymbol] = [];
      }
      el[contextSymbol].push(consumer);
    }

    const useContext = hook(class extends Hook {
      constructor(id, el) {
        super(id, el);
        setContexts(el, this);
        this._updater = this._updater.bind(this);
      }

      update(Context) {
        if (this.el.virtual) {
          throw new Error('can\'t be used with virtual components');
        }

        if (this.Context !== Context) {
          this._subscribe(Context);
          this.Context = Context;
        }

        return this.value;
      }

      _updater(value) {
        this.value = value;
        this.el.update();
      }

      _subscribe(Context) {
        const detail = { Context, callback: this._updater };

        this.el.host.dispatchEvent(new CustomEvent(contextEvent, {
          detail, // carrier
          bubbles: true, // to bubble up in tree
          cancelable: true, // to be able to cancel
          composed: true, // to pass ShadowDOM boundaries
        }));

        const { unsubscribe, value } = detail;

        this.value = unsubscribe ? value : Context.defaultValue;

        this._unsubscribe = unsubscribe;
      }

      teardown() {
        if (this._unsubscribe) {
          this._unsubscribe();
        }
      }
    });

    const createContext = (defaultValue) => {
      const Context = {};
      
      Context.Provider = class extends HTMLElement {
        constructor() {
          super();
          this.listeners = [];
      
          this.eventHandler = (event) => {
            const { detail } = event;
          
            if (detail.Context === Context) {
              detail.value = this.value;
          
              detail.unsubscribe = () => {
                const index = this.listeners.indexOf(detail.callback);

                if (index > -1) {
                  this.listeners.splice(index, 1);
                }
              };

              this.listeners.push(detail.callback);
      
              event.stopPropagation();
            }
          };
      
          this.addEventListener(contextEvent, this.eventHandler);
        }
      
        disconnectedCallback() {
          this.removeEventListener(contextEvent, this.eventHandler);
        }

        set value(value) {
          this._value = value;
          this.listeners.forEach(callback => callback(value));
        }

        get value() {
          return this._value;
        }
      };

      Context.Consumer = component(function ({ render: render$$1 }) {
        const context = useContext(Context);

        return render$$1(context);
      });

      Context.defaultValue = defaultValue;

      return Context;
    };

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    function isPushStateAvailable() {
      return !!(typeof window !== 'undefined' && window.history && window.history.pushState);
    }

    function Navigo(r, useHash, hash) {
      this.root = null;
      this._routes = [];
      this._useHash = useHash;
      this._hash = typeof hash === 'undefined' ? '#' : hash;
      this._paused = false;
      this._destroyed = false;
      this._lastRouteResolved = null;
      this._notFoundHandler = null;
      this._defaultHandler = null;
      this._usePushState = !useHash && isPushStateAvailable();
      this._onLocationChange = this._onLocationChange.bind(this);
      this._genericHooks = null;
      this._historyAPIUpdateMethod = 'pushState';

      if (r) {
        this.root = useHash ? r.replace(/\/$/, '/' + this._hash) : r.replace(/\/$/, '');
      } else if (useHash) {
        this.root = this._cLoc().split(this._hash)[0].replace(/\/$/, '/' + this._hash);
      }

      this._listen();
      this.updatePageLinks();
    }

    function clean(s) {
      if (s instanceof RegExp) return s;
      return s.replace(/\/+$/, '').replace(/^\/+/, '^/');
    }

    function regExpResultToParams(match, names) {
      if (names.length === 0) return null;
      if (!match) return null;
      return match.slice(1, match.length).reduce(function (params, value, index) {
        if (params === null) params = {};
        params[names[index]] = decodeURIComponent(value);
        return params;
      }, null);
    }

    function replaceDynamicURLParts(route) {
      var paramNames = [],
          regexp;

      if (route instanceof RegExp) {
        regexp = route;
      } else {
        regexp = new RegExp(route.replace(Navigo.PARAMETER_REGEXP, function (full, dots, name) {
          paramNames.push(name);
          return Navigo.REPLACE_VARIABLE_REGEXP;
        }).replace(Navigo.WILDCARD_REGEXP, Navigo.REPLACE_WILDCARD) + Navigo.FOLLOWED_BY_SLASH_REGEXP, Navigo.MATCH_REGEXP_FLAGS);
      }
      return { regexp: regexp, paramNames: paramNames };
    }

    function getUrlDepth(url) {
      return url.replace(/\/$/, '').split('/').length;
    }

    function compareUrlDepth(urlA, urlB) {
      return getUrlDepth(urlB) - getUrlDepth(urlA);
    }

    function findMatchedRoutes(url) {
      var routes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      return routes.map(function (route) {
        var _replaceDynamicURLPar = replaceDynamicURLParts(clean(route.route)),
            regexp = _replaceDynamicURLPar.regexp,
            paramNames = _replaceDynamicURLPar.paramNames;

        var match = url.replace(/^\/+/, '/').match(regexp);
        var params = regExpResultToParams(match, paramNames);

        return match ? { match: match, route: route, params: params } : false;
      }).filter(function (m) {
        return m;
      });
    }

    function match(url, routes) {
      return findMatchedRoutes(url, routes)[0] || false;
    }

    function root(url, routes) {
      var matched = routes.map(function (route) {
        return route.route === '' || route.route === '*' ? url : url.split(new RegExp(route.route + '($|\/)'))[0];
      });
      var fallbackURL = clean(url);

      if (matched.length > 1) {
        return matched.reduce(function (result, url) {
          if (result.length > url.length) result = url;
          return result;
        }, matched[0]);
      } else if (matched.length === 1) {
        return matched[0];
      }
      return fallbackURL;
    }

    function isHashChangeAPIAvailable() {
      return typeof window !== 'undefined' && 'onhashchange' in window;
    }

    function extractGETParameters(url) {
      return url.split(/\?(.*)?$/).slice(1).join('');
    }

    function getOnlyURL(url, useHash, hash) {
      var onlyURL = url,
          split;
      var cleanGETParam = function cleanGETParam(str) {
        return str.split(/\?(.*)?$/)[0];
      };

      if (typeof hash === 'undefined') {
        // To preserve BC
        hash = '#';
      }

      if (isPushStateAvailable() && !useHash) {
        onlyURL = cleanGETParam(url).split(hash)[0];
      } else {
        split = url.split(hash);
        onlyURL = split.length > 1 ? cleanGETParam(split[1]) : cleanGETParam(split[0]);
      }

      return onlyURL;
    }

    function manageHooks(handler, hooks, params) {
      if (hooks && (typeof hooks === 'undefined' ? 'undefined' : _typeof(hooks)) === 'object') {
        if (hooks.before) {
          hooks.before(function () {
            var shouldRoute = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (!shouldRoute) return;
            handler();
            hooks.after && hooks.after(params);
          }, params);
          return;
        } else if (hooks.after) {
          handler();
          hooks.after && hooks.after(params);
          return;
        }
      }
      handler();
    }

    function isHashedRoot(url, useHash, hash) {
      if (isPushStateAvailable() && !useHash) {
        return false;
      }

      if (!url.match(hash)) {
        return false;
      }

      var split = url.split(hash);

      return split.length < 2 || split[1] === '';
    }

    Navigo.prototype = {
      helpers: {
        match: match,
        root: root,
        clean: clean,
        getOnlyURL: getOnlyURL
      },
      navigate: function navigate(path, absolute) {
        var to;

        path = path || '';
        if (this._usePushState) {
          to = (!absolute ? this._getRoot() + '/' : '') + path.replace(/^\/+/, '/');
          to = to.replace(/([^:])(\/{2,})/g, '$1/');
          history[this._historyAPIUpdateMethod]({}, '', to);
          this.resolve();
        } else if (typeof window !== 'undefined') {
          path = path.replace(new RegExp('^' + this._hash), '');
          window.location.href = window.location.href.replace(/#$/, '').replace(new RegExp(this._hash + '.*$'), '') + this._hash + path;
        }
        return this;
      },
      on: function on() {
        var _this = this;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (typeof args[0] === 'function') {
          this._defaultHandler = { handler: args[0], hooks: args[1] };
        } else if (args.length >= 2) {
          if (args[0] === '/') {
            var func = args[1];

            if (_typeof(args[1]) === 'object') {
              func = args[1].uses;
            }

            this._defaultHandler = { handler: func, hooks: args[2] };
          } else {
            this._add(args[0], args[1], args[2]);
          }
        } else if (_typeof(args[0]) === 'object') {
          var orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

          orderedRoutes.forEach(function (route) {
            _this.on(route, args[0][route]);
          });
        }
        return this;
      },
      off: function off(handler) {
        if (this._defaultHandler !== null && handler === this._defaultHandler.handler) {
          this._defaultHandler = null;
        } else if (this._notFoundHandler !== null && handler === this._notFoundHandler.handler) {
          this._notFoundHandler = null;
        }
        this._routes = this._routes.reduce(function (result, r) {
          if (r.handler !== handler) result.push(r);
          return result;
        }, []);
        return this;
      },
      notFound: function notFound(handler, hooks) {
        this._notFoundHandler = { handler: handler, hooks: hooks };
        return this;
      },
      resolve: function resolve(current) {
        var _this2 = this;

        var handler, m;
        var url = (current || this._cLoc()).replace(this._getRoot(), '');

        if (this._useHash) {
          url = url.replace(new RegExp('^\/' + this._hash), '/');
        }

        var GETParameters = extractGETParameters(current || this._cLoc());
        var onlyURL = getOnlyURL(url, this._useHash, this._hash);

        if (this._paused) return false;

        if (this._lastRouteResolved && onlyURL === this._lastRouteResolved.url && GETParameters === this._lastRouteResolved.query) {
          if (this._lastRouteResolved.hooks && this._lastRouteResolved.hooks.already) {
            this._lastRouteResolved.hooks.already(this._lastRouteResolved.params);
          }
          return false;
        }

        m = match(onlyURL, this._routes);

        if (m) {
          this._callLeave();
          this._lastRouteResolved = {
            url: onlyURL,
            query: GETParameters,
            hooks: m.route.hooks,
            params: m.params,
            name: m.route.name
          };
          handler = m.route.handler;
          manageHooks(function () {
            manageHooks(function () {
              m.route.route instanceof RegExp ? handler.apply(undefined, m.match.slice(1, m.match.length)) : handler(m.params, GETParameters);
            }, m.route.hooks, m.params, _this2._genericHooks);
          }, this._genericHooks, m.params);
          return m;
        } else if (this._defaultHandler && (onlyURL === '' || onlyURL === '/' || onlyURL === this._hash || isHashedRoot(onlyURL, this._useHash, this._hash))) {
          manageHooks(function () {
            manageHooks(function () {
              _this2._callLeave();
              _this2._lastRouteResolved = { url: onlyURL, query: GETParameters, hooks: _this2._defaultHandler.hooks };
              _this2._defaultHandler.handler(GETParameters);
            }, _this2._defaultHandler.hooks);
          }, this._genericHooks);
          return true;
        } else if (this._notFoundHandler) {
          manageHooks(function () {
            manageHooks(function () {
              _this2._callLeave();
              _this2._lastRouteResolved = { url: onlyURL, query: GETParameters, hooks: _this2._notFoundHandler.hooks };
              _this2._notFoundHandler.handler(GETParameters);
            }, _this2._notFoundHandler.hooks);
          }, this._genericHooks);
        }
        return false;
      },
      destroy: function destroy() {
        this._routes = [];
        this._destroyed = true;
        this._lastRouteResolved = null;
        this._genericHooks = null;
        clearTimeout(this._listeningInterval);
        if (typeof window !== 'undefined') {
          window.removeEventListener('popstate', this._onLocationChange);
          window.removeEventListener('hashchange', this._onLocationChange);
        }
      },
      updatePageLinks: function updatePageLinks() {
        var self = this;

        if (typeof document === 'undefined') return;

        this._findLinks().forEach(function (link) {
          if (!link.hasListenerAttached) {
            link.addEventListener('click', function (e) {
              if ((e.ctrlKey || e.metaKey) && e.target.tagName.toLowerCase() == 'a') {
                return false;
              }
              var location = self.getLinkPath(link);

              if (!self._destroyed) {
                e.preventDefault();
                self.navigate(location.replace(/\/+$/, '').replace(/^\/+/, '/'));
              }
            });
            link.hasListenerAttached = true;
          }
        });
      },
      generate: function generate(name) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var result = this._routes.reduce(function (result, route) {
          var key;

          if (route.name === name) {
            result = route.route;
            for (key in data) {
              result = result.toString().replace(':' + key, data[key]);
            }
          }
          return result;
        }, '');

        return this._useHash ? this._hash + result : result;
      },
      link: function link(path) {
        return this._getRoot() + path;
      },
      pause: function pause() {
        var status = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

        this._paused = status;
        if (status) {
          this._historyAPIUpdateMethod = 'replaceState';
        } else {
          this._historyAPIUpdateMethod = 'pushState';
        }
      },
      resume: function resume() {
        this.pause(false);
      },
      historyAPIUpdateMethod: function historyAPIUpdateMethod(value) {
        if (typeof value === 'undefined') return this._historyAPIUpdateMethod;
        this._historyAPIUpdateMethod = value;
        return value;
      },
      disableIfAPINotAvailable: function disableIfAPINotAvailable() {
        if (!isPushStateAvailable()) {
          this.destroy();
        }
      },
      lastRouteResolved: function lastRouteResolved() {
        return this._lastRouteResolved;
      },
      getLinkPath: function getLinkPath(link) {
        return link.getAttribute('href');
      },
      hooks: function hooks(_hooks) {
        this._genericHooks = _hooks;
      },

      _add: function _add(route) {
        var handler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var hooks = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        if (typeof route === 'string') {
          route = encodeURI(route);
        }
        this._routes.push((typeof handler === 'undefined' ? 'undefined' : _typeof(handler)) === 'object' ? {
          route: route,
          handler: handler.uses,
          name: handler.as,
          hooks: hooks || handler.hooks
        } : { route: route, handler: handler, hooks: hooks });

        return this._add;
      },
      _getRoot: function _getRoot() {
        if (this.root !== null) return this.root;
        this.root = root(this._cLoc().split('?')[0], this._routes);
        return this.root;
      },
      _listen: function _listen() {
        var _this3 = this;

        if (this._usePushState) {
          window.addEventListener('popstate', this._onLocationChange);
        } else if (isHashChangeAPIAvailable()) {
          window.addEventListener('hashchange', this._onLocationChange);
        } else {
          var cached = this._cLoc(),
              current = void 0,
              _check = void 0;

          _check = function check() {
            current = _this3._cLoc();
            if (cached !== current) {
              cached = current;
              _this3.resolve();
            }
            _this3._listeningInterval = setTimeout(_check, 200);
          };
          _check();
        }
      },
      _cLoc: function _cLoc() {
        if (typeof window !== 'undefined') {
          if (typeof window.__NAVIGO_WINDOW_LOCATION_MOCK__ !== 'undefined') {
            return window.__NAVIGO_WINDOW_LOCATION_MOCK__;
          }
          return clean(window.location.href);
        }
        return '';
      },
      _findLinks: function _findLinks() {
        return [].slice.call(document.querySelectorAll('[data-navigo]'));
      },
      _onLocationChange: function _onLocationChange() {
        this.resolve();
      },
      _callLeave: function _callLeave() {
        var lastRouteResolved = this._lastRouteResolved;

        if (lastRouteResolved && lastRouteResolved.hooks && lastRouteResolved.hooks.leave) {
          lastRouteResolved.hooks.leave(lastRouteResolved.params);
        }
      }
    };

    Navigo.PARAMETER_REGEXP = /([:*])(\w+)/g;
    Navigo.WILDCARD_REGEXP = /\*/g;
    Navigo.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
    Navigo.REPLACE_WILDCARD = '(?:.*)';
    Navigo.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
    Navigo.MATCH_REGEXP_FLAGS = '';

    const RouterContext = createContext();

    customElements.define("boo-routely-provider", RouterContext.Provider);
    customElements.define("boo-routely-consumer", RouterContext.Consumer);

    function _Router(el) {
      const routes = useMemo(
        () =>
          Array.from(el.children)
            .filter(child => child.nodeName === "TEMPLATE")
            .map(child => ({
              route: child.getAttribute("route"),
              template: child.innerHTML
            })),
        [el.children]
      );

      const [matched, setMatched] = useState(false);
      const navigo = useMemo(() => new Navigo(window.location.origin), []);

      useEffect(() => {
        routes.forEach(({ route, template }) => {
          if (route) {
            navigo.on(route, (params, query) =>
              setMatched({ route, template, params, query })
            );
          } else {
            navigo.notFound(() => setMatched({ route, template }));
          }
        });
        navigo.resolve();
      }, [navigo, routes]);

      const router = useMemo(
        () => ({
          matched: {
            route: matched.route,
            params: matched.params,
            query: matched.query
          },
          link: navigo.link.bind(navigo),
          pause: navigo.pause.bind(navigo),
          resume: navigo.resume.bind(navigo),
          navigate: navigo.navigate.bind(navigo)
        }),
        [navigo, matched]
      );

      return html`
    <boo-routely-provider .value="${router}">
      ${unsafeHTML(matched.template)}
    </boo-routely-provider>
  `;
    }
    const Router = component(_Router);

    function _Link({ to, cssClass }) {
      const router = useContext(RouterContext);
      const navigate = useCallback(
        event => {
          event.preventDefault();
          router.navigate(to);
        },
        [router, to]
      );

      return html`
    <a href="" @click="${navigate}" class="${cssClass}"><slot></slot></a>
  `;
    }
    _Link.observedAttributes = ["to", "css-class"];

    const Link = component(_Link);

    customElements.define("boo-link", Link);
    customElements.define("boo-routely", Router);

    exports.RouterContext = RouterContext;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

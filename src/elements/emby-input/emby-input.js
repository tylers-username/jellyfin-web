import browser from '../../scripts/browser';
import dom from '../../utils/dom';
import globalize from '../../lib/globalize';
import './emby-input.scss';
import 'webcomponents.js/webcomponents-lite';
import '../emby-button/paper-icon-button-light';

const EmbyInputPrototype = Object.create(HTMLInputElement.prototype);

let inputId = 0;
let supportsFloatingLabel = false;

if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    // descriptor returning null in webos
    if (descriptor?.configurable) {
        const baseSetMethod = descriptor.set;
        descriptor.set = function (value) {
            baseSetMethod.call(this, value);

            this.dispatchEvent(new CustomEvent('valueset', {
                bubbles: false,
                cancelable: false
            }));
        };

        Object.defineProperty(HTMLInputElement.prototype, 'value', descriptor);
        supportsFloatingLabel = true;
    }
}

EmbyInputPrototype.createdCallback = function () {
    if (!this.id) {
        this.id = 'embyinput' + inputId;
        inputId++;
    }

    if (this.classList.contains('emby-input')) {
        return;
    }

    this.classList.add('emby-input');

    const parentNode = this.parentNode;
    const document = this.ownerDocument;
    const label = document.createElement('label');
    label.innerText = this.getAttribute('label') || '';
    label.classList.add('inputLabel');
    label.classList.add('inputLabelUnfocused');

    label.htmlFor = this.id;
    parentNode.insertBefore(label, this);
    this.labelElement = label;

    if (this.type === 'password') {
        const wrapper = document.createElement('div');
        wrapper.classList.add('emby-password-input-wrapper');

        const toggleBtn = document.createElement('button');
        toggleBtn.setAttribute('type', 'button');
        toggleBtn.setAttribute('is', 'paper-icon-button-light');
        toggleBtn.classList.add('emby-input-iconbutton');
        toggleBtn.setAttribute('aria-controls', this.id);

        parentNode.insertBefore(wrapper, this);
        wrapper.appendChild(this);
        wrapper.appendChild(toggleBtn);

        const iconSpan = document.createElement('span');
        iconSpan.classList.add('material-icons');
        iconSpan.setAttribute('aria-hidden', 'true');
        toggleBtn.appendChild(iconSpan);

        this.setPasswordVisible = visible => {
            this.setAttribute('type', visible ? 'text' : 'password');
            iconSpan.textContent = visible ? 'visibility' : 'visibility_off';
            toggleBtn.setAttribute('aria-label', globalize.translate(visible ? 'HidePassword' : 'ShowPassword'));
        };
        this.setPasswordVisible(false);

        dom.addEventListener(toggleBtn, 'click', () => {
            this.setPasswordVisible(this.type === 'password');
        }, {
            passive: true
        });
    }

    dom.addEventListener(this, 'focus', function () {
        onChange.call(this);

        // For Samsung orsay devices
        if (document.attachIME) {
            document.attachIME(this);
        }

        label.classList.add('inputLabelFocused');
        label.classList.remove('inputLabelUnfocused');
    }, {
        passive: true
    });

    dom.addEventListener(this, 'blur', function () {
        onChange.call(this);
        label.classList.remove('inputLabelFocused');
        label.classList.add('inputLabelUnfocused');
    }, {
        passive: true
    });

    dom.addEventListener(this, 'change', onChange, {
        passive: true
    });
    dom.addEventListener(this, 'input', onChange, {
        passive: true
    });
    dom.addEventListener(this, 'valueset', onChange, {
        passive: true
    });

    //Make sure the IME pops up if this is the first/default element on the page
    if (browser.orsay && this === document.activeElement && document.attachIME) {
        document.attachIME(this);
    }
};

function onChange() {
    const label = this.labelElement;
    if (this.value) {
        label.classList.remove('inputLabel-float');
    } else {
        const instanceSupportsFloat = supportsFloatingLabel && this.type !== 'date' && this.type !== 'time';

        if (instanceSupportsFloat) {
            label.classList.add('inputLabel-float');
        }
    }
}

EmbyInputPrototype.attachedCallback = function () {
    this.labelElement.htmlFor = this.id;
    onChange.call(this);
};

EmbyInputPrototype.label = function (text) {
    this.labelElement.innerText = text;
};

document.registerElement('emby-input', {
    prototype: EmbyInputPrototype,
    extends: 'input'
});

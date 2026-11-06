/**
 * Custom Styled Dropdown Component
 * Replaces browser native <select> elements with an accessible, keyboard-friendly custom UI.
 */

export class CustomSelect {
    constructor({ container, options = [], value = null, placeholder = 'Select an option...', onChange = null, className = '' }) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = options;
        this.value = value;
        this.placeholder = placeholder;
        this.onChange = onChange;
        this.className = className;
        this.isOpen = false;

        this.element = null;
        this.trigger = null;
        this.dropdown = null;
        this.optionsContainer = null;
        this.selectedLabel = null;
        this.selectedIcon = null;

        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.element = document.createElement('div');
        this.element.className = `custom-select ${this.className || ''}`.trim();

        // Trigger button
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'custom-select-trigger';
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        const triggerContent = document.createElement('div');
        triggerContent.className = 'custom-select-trigger-content';

        this.selectedIcon = document.createElement('span');
        this.selectedIcon.className = 'custom-select-icon';
        this.selectedIcon.style.display = 'none';

        this.selectedLabel = document.createElement('span');
        this.selectedLabel.className = 'custom-select-label';
        this.selectedLabel.textContent = this.placeholder;

        triggerContent.appendChild(this.selectedIcon);
        triggerContent.appendChild(this.selectedLabel);

        const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrowSvg.setAttribute('class', 'custom-select-arrow');
        arrowSvg.setAttribute('viewBox', '0 0 20 20');
        arrowSvg.setAttribute('fill', 'currentColor');
        arrowSvg.innerHTML = '<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>';

        this.trigger.appendChild(triggerContent);
        this.trigger.appendChild(arrowSvg);

        // Dropdown menu
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'custom-select-dropdown hidden';
        this.dropdown.setAttribute('role', 'listbox');

        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'custom-select-options';
        this.dropdown.appendChild(this.optionsContainer);

        this.element.appendChild(this.trigger);
        this.element.appendChild(this.dropdown);
        this.container.appendChild(this.element);

        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.trigger.addEventListener('keydown', this.handleKeyDown);

        this.renderOptions();
        if (this.value !== null) {
            this.setValue(this.value, false);
        }
    }

    renderOptions() {
        if (!this.optionsContainer) return;
        this.optionsContainer.innerHTML = '';

        if (this.options.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'custom-select-empty';
            emptyEl.textContent = 'No options available';
            this.optionsContainer.appendChild(emptyEl);
            return;
        }

        this.options.forEach((opt) => {
            const optEl = document.createElement('div');
            optEl.className = 'custom-select-option';
            optEl.setAttribute('role', 'option');
            optEl.dataset.value = String(opt.value);

            if (String(opt.value) === String(this.value)) {
                optEl.classList.add('is-selected');
                optEl.setAttribute('aria-selected', 'true');
            }

            if (opt.icon) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'custom-option-icon';
                iconSpan.textContent = opt.icon;
                optEl.appendChild(iconSpan);
            }

            const labelSpan = document.createElement('span');
            labelSpan.className = 'custom-option-label';
            labelSpan.textContent = opt.label;
            optEl.appendChild(labelSpan);

            if (opt.secondary) {
                const secSpan = document.createElement('span');
                secSpan.className = 'custom-option-secondary';
                secSpan.textContent = opt.secondary;
                optEl.appendChild(secSpan);
            }

            optEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setValue(opt.value, true);
                this.close();
            });

            this.optionsContainer.appendChild(optEl);
        });
    }

    setOptions(newOptions, preserveValue = true) {
        this.options = newOptions;
        if (!preserveValue || !this.options.some(o => String(o.value) === String(this.value))) {
            this.value = this.options.length > 0 ? this.options[0].value : null;
        }
        this.renderOptions();
        this.updateTrigger();
    }

    setValue(newValue, triggerChange = true) {
        this.value = newValue;
        this.updateTrigger();

        // Update selected state in DOM
        if (this.optionsContainer) {
            const allOpts = this.optionsContainer.querySelectorAll('.custom-select-option');
            allOpts.forEach(el => {
                const isSelected = el.dataset.value === String(newValue);
                el.classList.toggle('is-selected', isSelected);
                el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            });
        }

        if (triggerChange && typeof this.onChange === 'function') {
            this.onChange(this.value);
        }
    }

    getValue() {
        return this.value;
    }

    updateTrigger() {
        const found = this.options.find(o => String(o.value) === String(this.value));
        if (found) {
            this.selectedLabel.textContent = found.label;
            if (found.icon) {
                this.selectedIcon.textContent = found.icon;
                this.selectedIcon.style.display = 'inline-block';
            } else {
                this.selectedIcon.style.display = 'none';
            }
        } else {
            this.selectedLabel.textContent = this.placeholder;
            this.selectedIcon.style.display = 'none';
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        // Close any other open select
        document.querySelectorAll('.custom-select-dropdown:not(.hidden)').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.custom-select-trigger[aria-expanded="true"]').forEach(t => t.setAttribute('aria-expanded', 'false'));

        this.dropdown.classList.remove('hidden');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.isOpen = true;

        if (this.element) {
            const rect = this.element.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 200 && rect.top > 200) {
                this.dropdown.classList.add('position-above');
            } else {
                this.dropdown.classList.remove('position-above');
            }
        }

        document.addEventListener('click', this.handleDocumentClick);
    }

    close() {
        if (!this.isOpen) return;
        this.dropdown.classList.add('hidden');
        this.dropdown.classList.remove('position-above');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.isOpen = false;
        document.removeEventListener('click', this.handleDocumentClick);
    }

    handleDocumentClick(e) {
        if (!this.element.contains(e.target)) {
            this.close();
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggle();
        } else if (e.key === 'Escape') {
            this.close();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!this.isOpen) {
                this.open();
            } else {
                const currentIndex = this.options.findIndex(o => String(o.value) === String(this.value));
                let nextIndex = currentIndex;
                if (e.key === 'ArrowDown') {
                    nextIndex = Math.min(currentIndex + 1, this.options.length - 1);
                } else {
                    nextIndex = Math.max(currentIndex - 1, 0);
                }
                if (this.options[nextIndex]) {
                    this.setValue(this.options[nextIndex].value, true);
                }
            }
        }
    }
}

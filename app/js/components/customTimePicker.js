/**
 * Custom Styled Time Picker Component
 * Eliminates all native <select> elements in favor of a sleek stepper and preset interface.
 */

export class CustomTimePicker {
    constructor({ container, initialHours = 23, initialMinutes = 59, onChange = null }) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.hours = Math.max(0, Math.min(23, parseInt(initialHours, 10) || 0));
        this.minutes = Math.max(0, Math.min(59, parseInt(initialMinutes, 10) || 0));
        this.onChange = onChange;

        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-time-picker-wrapper';

        // Title & Presets
        const header = document.createElement('div');
        header.className = 'time-picker-header';

        const label = document.createElement('span');
        label.className = 'time-picker-label';
        label.textContent = 'Due Time:';

        const presetsWrap = document.createElement('div');
        presetsWrap.className = 'time-presets-wrap';

        const presets = [
            { label: '09:00', h: 9, m: 0 },
            { label: '12:00', h: 12, m: 0 },
            { label: '18:00', h: 18, m: 0 },
            { label: '23:59', h: 23, m: 59 }
        ];

        presets.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'time-preset-pill';
            btn.textContent = p.label;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.setTime(p.h, p.m);
            });
            presetsWrap.appendChild(btn);
        });

        header.appendChild(label);
        header.appendChild(presetsWrap);
        wrapper.appendChild(header);

        // Interactive Stepper Row
        const steppersRow = document.createElement('div');
        steppersRow.className = 'time-steppers-row';

        // Hours Column
        const hourCol = this.createStepperCol({
            label: 'Hours',
            value: this.hours,
            max: 23,
            step: 1,
            onStep: (newVal) => {
                this.hours = newVal;
                this.notify();
            }
        });

        const colon = document.createElement('div');
        colon.className = 'time-colon-separator';
        colon.textContent = ':';

        // Minutes Column
        const minCol = this.createStepperCol({
            label: 'Minutes',
            value: this.minutes,
            max: 59,
            step: 5,
            onStep: (newVal) => {
                this.minutes = newVal;
                this.notify();
            }
        });

        steppersRow.appendChild(hourCol);
        steppersRow.appendChild(colon);
        steppersRow.appendChild(minCol);
        wrapper.appendChild(steppersRow);

        this.container.appendChild(wrapper);
    }

    createStepperCol({ label, value, max, step, onStep }) {
        const col = document.createElement('div');
        col.className = 'time-stepper-col';

        const btnUp = document.createElement('button');
        btnUp.type = 'button';
        btnUp.className = 'time-step-btn';
        btnUp.innerHTML = '&#9650;';
        btnUp.title = `Increase ${label}`;
        btnUp.addEventListener('click', (e) => {
            e.preventDefault();
            let current = parseInt(valDisplay.textContent, 10) || 0;
            current = (current + step) % (max + 1);
            valDisplay.textContent = String(current).padStart(2, '0');
            onStep(current);
        });

        const valDisplay = document.createElement('div');
        valDisplay.className = 'time-val-display';
        valDisplay.textContent = String(value).padStart(2, '0');

        const btnDown = document.createElement('button');
        btnDown.type = 'button';
        btnDown.className = 'time-step-btn';
        btnDown.innerHTML = '&#9660;';
        btnDown.title = `Decrease ${label}`;
        btnDown.addEventListener('click', (e) => {
            e.preventDefault();
            let current = parseInt(valDisplay.textContent, 10) || 0;
            current = (current - step + (max + 1)) % (max + 1);
            valDisplay.textContent = String(current).padStart(2, '0');
            onStep(current);
        });

        col.appendChild(btnUp);
        col.appendChild(valDisplay);
        col.appendChild(btnDown);

        return col;
    }

    setTime(hours, minutes, triggerChange = true) {
        this.hours = Math.max(0, Math.min(23, parseInt(hours, 10) || 0));
        this.minutes = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
        this.render();
        if (triggerChange) {
            this.notify();
        }
    }

    getTime() {
        return {
            hours: this.hours,
            minutes: this.minutes,
            timeStr: `${String(this.hours).padStart(2, '0')}:${String(this.minutes).padStart(2, '0')}`
        };
    }

    notify() {
        if (typeof this.onChange === 'function') {
            this.onChange(this.getTime());
        }
    }
}

/**
 * Custom Time Selector Component with Quick Presets
 */

let selectedHours = 23;
let selectedMinutes = 59;

export function getSelectedTime() {
    const hh = String(selectedHours).padStart(2, '0');
    const mm = String(selectedMinutes).padStart(2, '0');
    return { hours: selectedHours, minutes: selectedMinutes, timeStr: `${hh}:${mm}` };
}

export function setSelectedTime(hh, mm) {
    selectedHours = Math.max(0, Math.min(23, parseInt(hh, 10) || 0));
    selectedMinutes = Math.max(0, Math.min(59, parseInt(mm, 10) || 0));
    updateInputs();
}

export function initCustomTimePicker(container, onTimeChanged) {
    if (!container) return;

    container.innerHTML = `
        <div class="custom-time-picker">
            <div class="time-spinner-row">
                <div class="time-spinner-col">
                    <label class="time-spinner-label">ساعت (Hour):</label>
                    <select id="timeSelectHour" class="form-select time-dropdown"></select>
                </div>
                <div class="time-colon">:</div>
                <div class="time-spinner-col">
                    <label class="time-spinner-label">دقیقه (Minute):</label>
                    <select id="timeSelectMinute" class="form-select time-dropdown"></select>
                </div>
            </div>

            <!-- Quick time preset chips -->
            <div class="time-presets-chips">
                <button type="button" class="time-chip" data-h="9" data-m="0">09:00 Morning</button>
                <button type="button" class="time-chip" data-h="12" data-m="0">12:00 Noon</button>
                <button type="button" class="time-chip" data-h="18" data-m="0">18:00 Evening</button>
                <button type="button" class="time-chip active" data-h="23" data-m="59">23:59 End of Day</button>
            </div>
        </div>
    `;

    const selH = container.querySelector('#timeSelectHour');
    const selM = container.querySelector('#timeSelectMinute');

    // Populate Hours (00-23)
    for (let h = 0; h < 24; h++) {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = String(h).padStart(2, '0');
        selH.appendChild(opt);
    }

    // Populate Minutes (00-59)
    for (let m = 0; m < 60; m += 1) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = String(m).padStart(2, '0');
        selM.appendChild(opt);
    }

    selH.value = selectedHours;
    selM.value = selectedMinutes;

    const fireChange = () => {
        selectedHours = parseInt(selH.value, 10);
        selectedMinutes = parseInt(selM.value, 10);
        highlightActivePreset();
        if (typeof onTimeChanged === 'function') {
            onTimeChanged(getSelectedTime());
        }
    };

    selH.addEventListener('change', fireChange);
    selM.addEventListener('change', fireChange);

    // Preset chips
    container.querySelectorAll('.time-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const h = parseInt(chip.dataset.h, 10);
            const m = parseInt(chip.dataset.m, 10);
            selectedHours = h;
            selectedMinutes = m;
            selH.value = h;
            selM.value = m;
            highlightActivePreset();
            if (typeof onTimeChanged === 'function') {
                onTimeChanged(getSelectedTime());
            }
        });
    });
}

function updateInputs() {
    const selH = document.getElementById('timeSelectHour');
    const selM = document.getElementById('timeSelectMinute');
    if (selH) selH.value = selectedHours;
    if (selM) selM.value = selectedMinutes;
    highlightActivePreset();
}

function highlightActivePreset() {
    document.querySelectorAll('.time-chip').forEach(chip => {
        const h = parseInt(chip.dataset.h, 10);
        const m = parseInt(chip.dataset.m, 10);
        chip.classList.toggle('active', h === selectedHours && m === selectedMinutes);
    });
}

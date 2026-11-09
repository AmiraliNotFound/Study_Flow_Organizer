/**
 * Application Modal Templates
 * Extracted dynamically from index.html to decouple layout shell from dialog markup.
 */

export const ITEM_MODAL_HTML = `<div id="itemModal" class="modal-overlay">
        <div class="modal-window">
            <div class="modal-header">
                <h2 id="itemModalTitle">Add to Study Schedule</h2>
                <button type="button" class="modal-close-btn" id="itemModalCloseBtn">&times;</button>
            </div>
            <form id="itemForm">
                <div class="modal-body">
                    <!-- Task vs Event Switch -->
                    <div class="kind-segmented-switch">
                        <button type="button" class="kind-tab-btn active kind-task" id="btnKindTask">
                            <span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span> <span>Task (HW / Assignment / Project)</span>
                        </button>
                        <button type="button" class="kind-tab-btn" id="btnKindEvent">
                            <span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span> <span>Event (Quiz / Exam / Session)</span>
                        </button>
                    </div>

                    <!-- Type Selector Pills -->
                    <div class="form-group">
                        <label class="form-label">Item Category Type:</label>
                        <div class="type-pills-container" id="modalTypePillsWrap"></div>
                    </div>

                    <!-- Course Subject (Custom Styled Dropdown) -->
                    <div class="form-group">
                        <label class="form-label">Course Subject:</label>
                        <div id="itemSubjectSelectWrap"></div>
                        <input type="hidden" id="itemSubjectSelect" required>
                    </div>

                    <!-- Extra Info Section -->
                    <div class="extra-info-section">
                        <div class="extra-info-header">
                            <span>Item Metadata</span>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">Auto-generates title</span>
                        </div>

                        <!-- Task Fields -->
                        <div id="taskExtraFieldsWrap" class="extra-fields-grid">
                            <div class="form-group">
                                <label class="form-label" for="taskDetailNumber">Number or Suffix:</label>
                                <input type="text" id="taskDetailNumber" class="form-input" placeholder="e.g. 3 or Phase 1">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="itemTitleInput">Full Task Title:</label>
                                <input type="text" id="itemTitleInput" class="form-input" placeholder="Final task title" required>
                            </div>
                        </div>

                        <!-- Event Fields -->
                        <div id="eventExtraFieldsWrap" class="extra-fields-grid hidden">
                            <div class="form-group">
                                <label class="form-label" for="eventDetailNumber">Event Number / Topic:</label>
                                <input type="text" id="eventDetailNumber" class="form-input" placeholder="e.g. Midterm 1">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="eventLocationInput">Room / Location or Link:</label>
                                <input type="text" id="eventLocationInput" class="form-input" placeholder="e.g. Hall 302 or Online">
                            </div>
                        </div>

                        <!-- Notes & Markdown Checklists -->
                        <div class="form-group" style="margin-top: 6px;">
                            <label class="form-label" for="itemNotesInput">
                                <span>Notes & Checklists (Markdown supported):</span>
                                <span style="font-size: 0.7rem; color: var(--palette-stormy-teal);">Supports - [ ] checklist items</span>
                            </label>
                            <textarea id="itemNotesInput" class="form-textarea" placeholder="e.g.&#10;- [ ] Read Chapter 4&#10;- [ ] Solve Problems 4.2 & 4.5&#10;Exam room: Hall 302"></textarea>
                        </div>
                    </div>

                    <!-- Custom Dual Date & Time Picker Section (Month Calendar Viewer) -->
                    <div class="form-group">
                        <label class="form-label">
                            <span>Target Due Date & Time (Gregorian & Shamsi Calendar):</span>
                        </label>
                        <div class="dual-date-picker-box">
                            <!-- Custom Dual Date Picker Slot (Interactive Month Grid) -->
                            <div id="customDatePickerSlot"></div>

                            <!-- Custom Time Picker Slot -->
                            <div id="customTimePickerSlot"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="btnCancelItem">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btnSaveItem">Save Item</button>
                </div>
            </form>
        </div>
    </div>`;

export const SUBJECT_MODAL_HTML = `<div id="subjectModal" class="modal-overlay">
        <div class="modal-window">
            <div class="modal-header">
                <h2 id="subjectModalTitle">Course Subject</h2>
                <button type="button" class="modal-close-btn" id="subjectModalCloseBtn">&times;</button>
            </div>
            <form id="subjectForm">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label" for="subjectNameInput">Subject Name:</label>
                        <input type="text" id="subjectNameInput" class="form-input" placeholder="e.g. Fluid Mechanics or Computer Science" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="subjectCodeInput">Course Code / Units / Instructor:</label>
                        <input type="text" id="subjectCodeInput" class="form-input" placeholder="e.g. CS-101 • 3 Units • Hall 204">
                    </div>

                    <!-- Course Tags Section (Req 2) -->
                    <div class="form-group">
                        <label class="form-label">Course Tags:</label>
                        <div id="subjectTagsContainer" class="subject-tags-edit-wrap"></div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Theme Gradient:</label>
                        <div id="subjectGradientPicker" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-del hidden" id="btnDeleteSubject" style="color: var(--palette-tomato-jam); border-color: rgba(196, 69, 54, 0.4); margin-right: auto;">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Move to Trash
                    </button>
                    <button type="button" class="btn btn-secondary" id="btnCancelSubject">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btnSaveSubject">Save Subject</button>
                </div>
            </form>
        </div>
    </div>`;

export const FOLDER_MODAL_HTML = `<div id="folderModal" class="modal-overlay">
        <div class="modal-window">
            <div class="modal-header">
                <h2 id="folderModalTitle">Link Course Folder</h2>
                <button type="button" class="modal-close-btn" id="folderModalCloseBtn">&times;</button>
            </div>
            <form id="folderForm">
                <div class="modal-body">
                    <!-- Course Subject (Custom Styled Dropdown) -->
                    <div class="form-group">
                        <label class="form-label">Course Subject:</label>
                        <div id="folderSubjectSelectWrap"></div>
                        <input type="hidden" id="folderSubjectSelect" required>
                    </div>

                    <div class="material-drop-box">
                        <label class="form-label">Folder Location:</label>
                        <div class="material-picker-row">
                            <button type="button" class="btn btn-primary btn-sm" id="btnBrowseFolder" style="background: var(--palette-chestnut);">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Select Folder from System
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" id="btnPasteFolderPath">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Paste Path
                            </button>
                        </div>
                        <div class="form-group" style="margin-top: 6px;">
                            <label class="form-label" style="font-size: 0.74rem;">Folder Label:</label>
                            <input type="text" id="folderNameInput" class="form-input" placeholder="e.g. Lectures & Slides, Lab Manuals..." required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="font-size: 0.74rem;">Folder Path on Disk:</label>
                            <input type="text" id="folderPathInput" class="form-input" placeholder="e.g. D:\\University\\Course\\Materials" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="folderNotesInput">Description / Notes (Optional):</label>
                        <textarea id="folderNotesInput" class="form-textarea" placeholder="Contains reference materials, past exams, or slide PDFs..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="btnCancelFolder">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btnSaveFolder">Save Folder</button>
                </div>
            </form>
        </div>
    </div>`;

export const SETTINGS_MODAL_HTML = `<div id="settingsModal" class="modal-overlay">
        <div class="modal-window" style="max-width: 560px;">
            <div class="modal-header">
                <h2><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 6px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings & Storage</h2>
                <button type="button" class="modal-close-btn" id="settingsModalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" style="gap: 16px;">
                <!-- Theme Option Selector: Glassmorphic vs Flat -->
                <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--palette-powder-petal);">
                        Visual Theme Style:
                    </label>
                    <div class="theme-switch-container">
                        <div class="theme-card-option is-active" id="themeOptionGlass" data-theme="glass">
                            <span class="theme-card-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18v-18z"/></svg></span>
                            <span class="theme-card-title">Glassmorphic</span>
                            <span class="theme-card-desc">Atmospheric glows, deep blur & glass depth</span>
                        </div>
                        <div class="theme-card-option" id="themeOptionFlat" data-theme="flat">
                            <span class="theme-card-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></span>
                            <span class="theme-card-title">Flat Minimal</span>
                            <span class="theme-card-desc">Solid slate surfaces, hairline borders & zero blur</span>
                        </div>
                    </div>
                </div>

                <!-- Master Color Palette Selector (Req 3) -->
                <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--palette-powder-petal);">
                        Color Palette:
                    </label>
                    <div class="palette-switch-container">
                        <div class="palette-card-option is-active" data-palette="default">
                            <span class="palette-card-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg></span>
                            <span class="palette-card-title">Teal Slate</span>
                            <span class="palette-card-desc">Default 5-color earth & slate</span>
                        </div>
                        <div class="palette-card-option" data-palette="black">
                            <span class="palette-card-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg></span>
                            <span class="palette-card-title">Minimal Black</span>
                            <span class="palette-card-desc">Monochrome onyx & crisp white</span>
                        </div>
                        <div class="palette-card-option" data-palette="dark_blue">
                            <span class="palette-card-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg></span>
                            <span class="palette-card-title">Flat Dark Blue</span>
                            <span class="palette-card-desc">Deep midnight & electric azure</span>
                        </div>
                        <div class="palette-card-option" data-palette="custom">
                            <span class="palette-card-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg></span>
                            <span class="palette-card-title">Custom 5-Color</span>
                            <span class="palette-card-desc">User-defined dynamic colors</span>
                        </div>
                    </div>

                    <!-- Custom 5-Color Pickers (Req 3) -->
                    <div id="customPaletteControlsWrap" class="custom-palette-controls hidden">
                        <div class="custom-color-item">
                            <label>Primary Accent</label>
                            <input type="color" id="pickerColorPrimary" value="#197278">
                        </div>
                        <div class="custom-color-item">
                            <label>Canvas Base</label>
                            <input type="color" id="pickerColorCanvas" value="#1e2e2c">
                        </div>
                        <div class="custom-color-item">
                            <label>Card Surface</label>
                            <input type="color" id="pickerColorSurface" value="#283D3B">
                        </div>
                        <div class="custom-color-item">
                            <label>Light Text</label>
                            <input type="color" id="pickerColorText" value="#EDDDD4">
                        </div>
                        <div class="custom-color-item">
                            <label>Urgent Alert</label>
                            <input type="color" id="pickerColorUrgent" value="#C44536">
                        </div>
                    </div>
                </div>

                <!-- Course Trash Bin Management (Req 7) -->
                <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--palette-powder-petal);">
                        Course Trash & Recovery:
                    </label>
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(30, 46, 44, 0.6); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(237, 221, 212, 0.12);">
                        <div>
                            <div style="font-size: 0.84rem; font-weight: 600; color: var(--palette-powder-petal);">Deleted Courses Bin</div>
                            <div style="font-size: 0.72rem; color: var(--text-muted);">Restore deleted courses, tasks & folder links</div>
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm" id="btnSettingsOpenTrash">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> View Trash (<span id="settingsTrashCountBadge">0</span>)
                        </button>
                    </div>
                </div>

                <!-- Local AppData Storage & Backup Management (Moved to Settings) -->
                <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--palette-powder-petal);">
                        Local AppData Storage & Backups:
                    </label>
                    <div class="disk-sync-box" style="margin: 0; padding: 14px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span id="modalDiskSyncDot" style="width: 10px; height: 10px; border-radius: 50%; background: #2dd4bf; display: inline-block;"></span>
                                <strong id="modalDiskSyncText" style="font-size: 0.86rem; color: var(--palette-powder-petal);">Checking status...</strong>
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-cyan" id="btnOpenDataFolder">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Explorer
                            </button>
                        </div>
                        <div style="font-family: monospace; font-size: 0.73rem; color: var(--palette-stormy-teal); word-break: break-all; margin-top: 5px;" id="modalDataDirText">
                            Loading directory...
                        </div>
                        <p style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.45; margin-top: 6px;">
                            Data is permanently saved in your OS AppData directory, keeping it safe and independent from git updates.
                        </p>
                        <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                            <button type="button" class="btn btn-secondary btn-sm" id="btnExportJson" style="flex: 1; min-width: 130px;">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Backup
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" id="btnImportJson" style="flex: 1; min-width: 130px;">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Restore JSON
                            </button>
                            <input type="file" id="importJsonFileInput" accept=".json" style="display: none;">
                        </div>
                        <div style="margin-top: 10px; border-top: 1px solid rgba(237, 221, 212, 0.08); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.74rem; color: var(--text-muted);">Reset workspace:</span>
                            <button type="button" class="btn btn-secondary btn-sm" id="btnWipeData" style="color: var(--palette-tomato-jam); border-color: rgba(196, 69, 54, 0.45); font-size: 0.74rem; padding: 3px 10px;">
                                Clear All Data
                            </button>
                        </div>
                    </div>
                </div>

                <!-- AI Assistant Configuration -->
                <div class="form-group" style="margin-top: 4px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <label class="form-label" style="font-weight: 700; color: var(--palette-powder-petal); margin: 0;">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M12 3l1.912 5.885a1 1 0 0 0 .951.691h6.188l-5.006 3.637a1 1 0 0 0-.363 1.118l1.912 5.885-5.006-3.637a1 1 0 0 0-1.176 0l-5.006 3.637 1.912-5.885a1 1 0 0 0-.363-1.118l-5.006-3.637h6.188a1 1 0 0 0 .951-.691z"/></svg> AI Assistant Configuration:
                        </label>
                        <span id="aiSettingsStatusPill" class="ai-status-pill status-unconfigured">Unconfigured</span>
                    </div>

                    <div class="ai-settings-card">
                        <!-- Provider Custom Select -->
                        <div class="form-group" style="margin-bottom: 8px;">
                            <label class="form-label" style="font-size: 0.74rem;">AI Provider:</label>
                            <div id="aiProviderSelectWrap"></div>
                            <input type="hidden" id="aiProviderSelect" value="gemini">
                        </div>

                        <!-- Custom Base URL (hidden unless custom) -->
                        <div class="form-group hidden" id="aiBaseUrlWrap" style="margin-bottom: 8px;">
                            <label class="form-label" style="font-size: 0.74rem;">Base URL / Endpoint:</label>
                            <input type="text" id="aiBaseUrlInput" class="form-input" placeholder="e.g. https://openrouter.ai/api/v1 or http://localhost:11434/v1">
                        </div>

                        <!-- API Key Input -->
                        <div class="form-group" style="margin-bottom: 8px;">
                            <label class="form-label" style="font-size: 0.74rem;">API Key:</label>
                            <div style="display: flex; gap: 6px;">
                                <input type="password" id="aiApiKeyInput" class="form-input" placeholder="Paste your API key here (e.g. AIzaSy... or sk-...)" style="font-family: monospace;">
                                <button type="button" class="btn btn-secondary btn-sm" id="btnToggleApiKeyVisibility" title="Show / Hide Key" style="padding: 0 10px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                            </div>
                            <span style="font-size: 0.69rem; color: var(--text-muted); margin-top: 3px; display: block;" id="aiApiKeyHint">
                                For Gemini, get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: var(--palette-stormy-teal);">Google AI Studio</a>.
                            </span>
                        </div>

                        <!-- Fetch Models Button & Model Custom Select -->
                        <div class="form-group" style="margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <label class="form-label" style="font-size: 0.74rem; margin: 0;">AI Model:</label>
                                <button type="button" class="btn btn-sm btn-outline-cyan" id="btnFetchAiModels" style="font-size: 0.72rem; padding: 2px 8px;">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> Fetch Models from API
                                </button>
                            </div>
                            <div id="aiModelSelectWrap"></div>
                            <input type="hidden" id="aiModelSelect" value="">
                            <span id="aiModelStatusText" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 3px; display: block;"></span>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
                            <button type="button" class="btn btn-secondary btn-sm" id="btnTestAiConnection">Test Connection</button>
                            <button type="button" class="btn btn-primary btn-sm" id="btnSaveAiConfig">Save Settings</button>
                        </div>
                    </div>
                </div>

                <!-- Keyboard Shortcuts Cheat Sheet (Embedded Inside Settings) -->
                <div class="form-group" style="margin-top: 4px;">
                    <label class="form-label" style="font-weight: 700; color: var(--palette-powder-petal);">
                        Keyboard Shortcuts Cheat Sheet:
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 6px; background: rgba(40, 61, 59, 0.6); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(237, 221, 212, 0.12);">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(237, 221, 212, 0.08);">
                            <span style="font-size: 0.82rem; color: var(--text-secondary);">Push-to-Talk AI Voice (Hold)</span>
                            <kbd style="background: rgba(30, 46, 44, 0.9); border: 1px solid rgba(45, 212, 191, 0.4); color: #2dd4bf; padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.78rem;">Hold Space or Alt + A</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(237, 221, 212, 0.08);">
                            <span style="font-size: 0.82rem; color: var(--text-secondary);">Open AI Assistant Modal</span>
                            <kbd style="background: rgba(30, 46, 44, 0.9); border: 1px solid rgba(45, 212, 191, 0.4); color: #2dd4bf; padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.78rem;">Alt + A or A</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(237, 221, 212, 0.08);">
                            <span style="font-size: 0.82rem; color: var(--text-secondary);">Open New Item Modal</span>
                            <kbd style="background: rgba(30, 46, 44, 0.9); border: 1px solid rgba(237, 221, 212, 0.18); padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.78rem;">Alt + N or N</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(237, 221, 212, 0.08);">
                            <span style="font-size: 0.82rem; color: var(--text-secondary);">Focus Global Search</span>
                            <kbd style="background: rgba(30, 46, 44, 0.9); border: 1px solid rgba(237, 221, 212, 0.18); padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.78rem;">/ or Alt + S</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(237, 221, 212, 0.08);">
                            <span style="font-size: 0.82rem; color: var(--text-secondary);">Cycle Views / Direct Views</span>
                            <kbd style="background: rgba(30, 46, 44, 0.9); border: 1px solid rgba(237, 221, 212, 0.18); padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.78rem;">Alt + V or 1, 2, 3, 4</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                            <span style="font-size: 0.82rem; color: var(--text-secondary);">Close Active Dialog</span>
                            <kbd style="background: rgba(30, 46, 44, 0.9); border: 1px solid rgba(237, 221, 212, 0.18); padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.78rem;">Escape</kbd>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="btnCloseSettings">Done</button>
            </div>
        </div>
    </div>`;

export const AI_MODAL_HTML = `<div id="aiModal" class="modal-overlay">
        <div class="modal-window ai-modal-window">
            <!-- Minimalist AI Header -->
            <div class="modal-header ai-modal-header">
                <div class="ai-header-brand">
                    <div class="ai-header-icon-box">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="ai-sparkle-icon ai-header-svg">
                            <path d="M10 3C10 7.418 6.418 11 2 11C6.418 11 10 14.582 10 19C10 14.582 13.582 11 18 11C13.582 11 10 7.418 10 3Z"/>
                            <path d="M18 2C18 4.209 16.209 6 14 6C16.209 6 18 7.791 18 10C18 7.791 19.791 6 22 6C19.791 6 18 4.209 18 2Z"/>
                        </svg>
                    </div>
                    <div>
                        <h2 class="ai-modal-title">AI Schedule Assistant</h2>
                        <p class="ai-modal-subtitle">Schedule deadlines, tasks, and exams via voice or text</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <!-- Small History Actions: Preview Last Changes & Undo -->
                    <div id="aiHistoryActions" class="ai-history-actions hidden">
                        <button type="button" class="btn-ai-history" id="btnAiPreviewLast" title="Preview changes from last session">
                            <span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Last Changes</span>
                        </button>
                        <button type="button" class="btn-ai-history btn-ai-undo" id="btnAiUndoLast" title="Undo all changes from last session">
                            <span>↺ Undo</span>
                        </button>
                    </div>
                    <button type="button" id="aiActiveModelBadge" class="ai-model-badge" title="Click to configure in Settings">
                        Gemini
                    </button>
                    <button type="button" class="modal-close-btn" id="aiModalCloseBtn">&times;</button>
                </div>
            </div>

            <div class="modal-body ai-modal-body">
                <!-- Context Info Strip -->
                <div class="ai-context-strip" id="aiContextStrip">
                    <div class="ai-context-item">
                        <span class="context-label">Calendar:</span>
                        <strong id="aiContextDate">Loading calendar...</strong>
                    </div>
                    <div class="ai-context-item">
                        <span class="context-label">Courses:</span>
                        <strong id="aiContextCourses">0 courses</strong>
                    </div>
                </div>

                <!-- Input Section with Telegram-style Push-to-Hold Mic -->
                <div class="ai-input-card">
                    <div class="ai-input-stage">
                        <!-- Standard Textarea Wrapper -->
                        <div class="ai-textarea-wrapper" id="aiTextareaWrapper">
                            <textarea id="aiPromptInput" class="ai-prompt-textarea" placeholder="Type a scheduling instruction in English or Persian, or hold the mic below..."></textarea>
                        </div>

                        <!-- Telegram-Style Recording Overlay Capsule (Expands left over textarea) -->
                        <div id="aiVoiceLiveIndicator" class="ai-voice-recording-capsule hidden">
                            <div class="capsule-pulse-dot"></div>
                            <div class="capsule-wave-bars">
                                <span class="wave-bar"></span>
                                <span class="wave-bar"></span>
                                <span class="wave-bar"></span>
                                <span class="wave-bar"></span>
                                <span class="wave-bar"></span>
                                <span class="wave-bar"></span>
                                <span class="wave-bar"></span>
                            </div>
                            <span id="aiRecordingTimerText" class="capsule-timer">00:00</span>
                            <span class="capsule-hint">Release to finish</span>
                        </div>
                    </div>

                    <!-- Bottom Action Row: Audio Snippet + Clear + Telegram Mic + Process -->
                    <div class="ai-action-bar">
                        <!-- Audio playback pill (appears after hold is finished) -->
                        <div id="aiAudioSnippetWrap" class="ai-audio-snippet-wrap hidden">
                            <button type="button" class="btn-audio-icon" id="btnAiPlayAudio" title="Play recording">
                                <span id="aiPlayIcon">▶</span>
                            </button>
                            <span id="aiAudioDurationText" class="audio-clip-duration">0:00</span>
                            <button type="button" class="btn-audio-icon btn-audio-discard" id="btnAiRemoveAudio" title="Discard voice note">
                                &times;
                            </button>
                        </div>

                        <div style="flex: 1;"></div>

                        <!-- Clear Button -->
                        <button type="button" class="btn btn-secondary btn-sm" id="btnAiClearPrompt" title="Clear text and recording">Clear</button>

                        <!-- Telegram-Style Mic Push & Hold Button (NO text!) -->
                        <button type="button" class="btn-telegram-mic" id="btnAiVoiceRecord" title="Press & hold to record voice">
                            <svg viewBox="0 0 24 24" class="telegram-mic-svg">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                                <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                        </button>

                        <!-- Process Instruction Button -->
                        <button type="button" class="btn btn-primary btn-sm ai-analyze-btn" id="btnAiAnalyze">
                            <span class="btn-spinner hidden" id="aiAnalyzeSpinner"></span>
                            <span id="aiAnalyzeBtnText">Process Instruction</span>
                        </button>
                    </div>
                </div>

                <!-- Minimal Thinking State -->
                <div id="aiThinkingState" class="ai-thinking-state hidden">
                    <div class="ai-thinking-spinner"></div>
                    <p id="aiThinkingStatus">Analyzing schedule...</p>
                    <span style="font-size: 0.73rem; color: var(--text-muted);">Correlating dates, courses & events</span>
                </div>

                <!-- Error Banner -->
                <div id="aiErrorBanner" class="ai-error-banner hidden"></div>

                <!-- Editable Proposed Actions Preview Section -->
                <div id="aiPreviewContainer" class="ai-preview-container hidden">
                    <div class="ai-preview-header">
                        <div>
                            <h3 class="ai-preview-title">Proposed Schedule Changes</h3>
                            <p id="aiPreviewSummary" class="ai-preview-summary">0 items detected</p>
                        </div>
                    </div>

                    <!-- Editable Action Cards Container -->
                    <div id="aiActionCardsList" class="ai-action-cards-list"></div>

                    <!-- Bottom Right Actions Footer (Apply & Discard on the bottom right) -->
                    <div class="ai-preview-footer">
                        <button type="button" class="btn btn-secondary btn-sm" id="btnAiDiscardAll">Discard All</button>
                        <button type="button" class="btn btn-primary btn-sm ai-apply-all-btn" id="btnAiApplyAll">
                            Apply All (<span id="aiActionCount">0</span>)
                        </button>
                    </div>
                </div>
            </div>

            <div class="modal-footer ai-modal-footer">
                <span style="font-size: 0.72rem; color: var(--text-muted);">
                    Understands natural voice &amp; text instructions in English and Persian.
                </span>
                <button type="button" class="btn btn-secondary btn-sm" id="btnAiClose">Close</button>
            </div>
        </div>
    </div>`;

export const TRASH_MODAL_HTML = `<div id="trashModal" class="modal-overlay">
        <div class="modal-window" style="max-width: 580px;">
            <div class="modal-header">
                <div>
                    <h2><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Course & Task Trash</h2>
                    <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                        Restore deleted courses and scheduled items back to active workspace
                    </p>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span id="trashCountBadge" class="trash-count-badge">0 courses</span>
                    <button type="button" class="modal-close-btn" id="trashModalCloseBtn">&times;</button>
                </div>
            </div>
            <div class="modal-body" style="gap: 12px; max-height: 440px; overflow-y: auto;">
                <div id="trashItemsList" class="trash-items-list"></div>
            </div>
            <div class="modal-footer" style="justify-content: space-between;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnEmptyAllTrash" style="color: var(--palette-tomato-jam); border-color: rgba(196, 69, 54, 0.4);">
                    Empty Trash
                </button>
                <button type="button" class="btn btn-primary btn-sm" id="btnCloseTrashModal">Close</button>
            </div>
        </div>
    </div>`;

export const TAG_MANAGER_MODAL_HTML = `<div id="tagManagerModal" class="modal-overlay">
        <div class="modal-window" style="max-width: 480px;">
            <div class="modal-header">
                <h2><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 6px;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>Manage Course Tags</h2>
                <button type="button" class="modal-close-btn" id="tagModalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" style="gap: 14px;">
                <div class="form-group">
                    <label class="form-label">Create New Tag:</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="inputNewTagName" class="form-input" placeholder="e.g. Core, Math, Fall2026, Lab">
                        <button type="button" class="btn btn-primary btn-sm" id="btnSaveNewTag">Add</button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Available Tags:</label>
                    <div id="modalAllTagsWrap" class="modal-tags-collection"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" id="btnCloseTagModal">Done</button>
            </div>
        </div>
    </div>`;

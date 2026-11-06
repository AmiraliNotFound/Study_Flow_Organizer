/**
 * Safe, Zero-Dependency Markdown Renderer & Interactive Checklist Engine
 */

import { escapeHtml } from './dateUtils.js';

/**
 * Converts a markdown string into safe HTML with interactive checklist tags.
 */
export function renderMarkdown(markdownText = "") {
    if (!markdownText || typeof markdownText !== 'string') return "";

    const lines = markdownText.split(/\r?\n/);
    let htmlLines = [];
    let inCodeBlock = false;
    let codeBuffer = [];

    lines.forEach((line, index) => {
        // Code blocks
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                htmlLines.push(`<pre class="md-code-block"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
                codeBuffer = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            return;
        }

        // Checklist items: - [ ] or - [x]
        const checkMatch = line.match(/^(\s*[-*]\s*)\[([ xX])\]\s+(.*)$/);
        if (checkMatch) {
            const isChecked = checkMatch[2].toLowerCase() === 'x';
            const content = formatInlineMarkdown(checkMatch[3]);
            htmlLines.push(`
                <div class="md-checklist-item ${isChecked ? 'is-checked' : ''}" data-line-index="${index}">
                    <span class="md-checkbox ${isChecked ? 'checked' : ''}" data-line="${index}">${isChecked ? '✓' : ''}</span>
                    <span class="md-check-text">${content}</span>
                </div>
            `);
            return;
        }

        // Headers
        if (line.startsWith('### ')) {
            htmlLines.push(`<h4 class="md-h3">${formatInlineMarkdown(line.slice(4))}</h4>`);
            return;
        }
        if (line.startsWith('## ')) {
            htmlLines.push(`<h3 class="md-h2">${formatInlineMarkdown(line.slice(3))}</h3>`);
            return;
        }
        if (line.startsWith('# ')) {
            htmlLines.push(`<h2 class="md-h1">${formatInlineMarkdown(line.slice(2))}</h2>`);
            return;
        }

        // Unordered lists
        if (/^\s*[-*]\s+/.test(line)) {
            const content = line.replace(/^\s*[-*]\s+/, '');
            htmlLines.push(`<li class="md-li">${formatInlineMarkdown(content)}</li>`);
            return;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
            htmlLines.push(`<blockquote class="md-quote">${formatInlineMarkdown(line.slice(2))}</blockquote>`);
            return;
        }

        // Blank lines
        if (!line.trim()) {
            htmlLines.push('<div class="md-spacer"></div>');
            return;
        }

        // Regular paragraph
        htmlLines.push(`<p class="md-p">${formatInlineMarkdown(line)}</p>`);
    });

    if (inCodeBlock && codeBuffer.length > 0) {
        htmlLines.push(`<pre class="md-code-block"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
    }

    return htmlLines.join('\n');
}

/**
 * Format inline elements: bold, italic, code, links.
 */
function formatInlineMarkdown(text) {
    let out = escapeHtml(text);

    // Inline code: `code`
    out = out.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Bold: **text** or __text__
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    out = out.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Links: [title](url)
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>');

    return out;
}

/**
 * Binds click events to interactive checkboxes inside a container element.
 * When toggled, modifies the original markdown string and calls onUpdate(newMarkdown).
 */
export function bindMarkdownChecklists(container, originalMarkdown, onUpdate) {
    if (!container) return;
    const checkboxes = container.querySelectorAll('.md-checkbox');

    checkboxes.forEach(cb => {
        cb.addEventListener('click', (e) => {
            e.stopPropagation();
            const lineIdx = parseInt(cb.dataset.line, 10);
            if (isNaN(lineIdx)) return;

            const lines = originalMarkdown.split(/\r?\n/);
            const line = lines[lineIdx];
            if (!line) return;

            if (line.match(/^(\s*[-*]\s*)\[ \]\s+(.*)$/)) {
                lines[lineIdx] = line.replace(/\[ \]/, '[x]');
            } else if (line.match(/^(\s*[-*]\s*)\[[xX]\]\s+(.*)$/)) {
                lines[lineIdx] = line.replace(/\[[xX]\]/, '[ ]');
            }

            const updated = lines.join('\n');
            if (typeof onUpdate === 'function') {
                onUpdate(updated);
            }
        });
    });
}

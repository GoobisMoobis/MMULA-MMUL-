// Base template parts
const baseDefaultContent = `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">`;

// Translation mappings
const mmulToHtml = {
    'fatty1': 'h1',
    'swag': 'style',
    'js': 'script'
};

const htmlToMmul = {
    'h1': 'fatty1',
    'style': 'swag',
    'script': 'js'
};

function getBaseTemplate(title) {
    return `head>
${baseDefaultContent}
    <title>${title}</title`;
}

function translateToHTML(mmulCode) {
    let htmlCode = mmulCode;
    
    // Handle base tag with override type
    const baseOverrideRegex = /<base\s+type="override"(?:\s+title="([^"]*)")?\s*>/;
    const baseOverrideMatch = mmulCode.match(baseOverrideRegex);
    
    if (baseOverrideMatch) {
        const title = baseOverrideMatch[1] || window.location.href;
        htmlCode = htmlCode.replace(baseOverrideRegex, '<head>');
        htmlCode = htmlCode.replace('</base>', '</head>');
        if (title) {
            const titleTag = `<title>${title}</title>`;
            htmlCode = htmlCode.replace('</head>', titleTag + '</head>');
        }
    } else {
        // Handle regular base tag with title attribute
        const baseTagRegex = /<base(?:\s+title="([^"]*)")?\s*>/;
        const baseMatch = mmulCode.match(baseTagRegex);
        
        if (baseMatch) {
            const title = baseMatch[1] || window.location.href;
            const baseTemplate = getBaseTemplate(title);
            htmlCode = htmlCode.replace(baseTagRegex, `<${baseTemplate}>`);
            htmlCode = htmlCode.replace('</base>', '</head>');
        }
    }

    // Handle <html> tag passthrough
    const htmlTagRegex = /<html>(.*?)<\/html>/gs;
    htmlCode = htmlCode.replace(htmlTagRegex, '$1');

    // Handle other translations
    for (const [mmul, html] of Object.entries(mmulToHtml)) {
        const mmulRegex = new RegExp(`<${mmul}>`, 'g');
        const mmulCloseRegex = new RegExp(`</${mmul}>`, 'g');
        htmlCode = htmlCode.replace(mmulRegex, `<${html}>`);
        htmlCode = htmlCode.replace(mmulCloseRegex, `</${html.split('>')[0]}>`);
    }
    return htmlCode;
}

function translateToMMUL(htmlCode) {
    let mmulCode = htmlCode;
    
    // Handle head tag and its contents
    const headRegex = /<head>([\s\S]*?)<\/head>/;
    const headMatch = htmlCode.match(headRegex);
    
    if (headMatch) {
        const headContent = headMatch[1];
        const titleMatch = headContent.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : '';
        
        // Check if the head content matches our base structure
        const baseContentWithoutTitle = baseDefaultContent.replace(/\s+/g, '');
        const headContentWithoutTitle = headContent.replace(/<title>.*?<\/title>/, '')
                                                 .replace(/\s+/g, '');
        
        if (headContentWithoutTitle.includes(baseContentWithoutTitle)) {
            // Regular base tag
            if (title === window.location.href) {
                mmulCode = mmulCode.replace(headMatch[0], '<base>');
            } else {
                mmulCode = mmulCode.replace(headMatch[0], `<base title="${title}">`);
            }
        } else {
            // Override base tag
            if (title) {
                mmulCode = mmulCode.replace(headMatch[0], `<base type="override" title="${title}">`);
            } else {
                mmulCode = mmulCode.replace(headMatch[0], '<base type="override">');
            }
        }
        mmulCode = mmulCode.replace('</head>', '</base>');
    }
    
    // Handle other translations
    for (const [html, mmul] of Object.entries(htmlToMmul)) {
        const htmlRegex = new RegExp(`<${html}[^>]*>`, 'g');
        const htmlCloseRegex = new RegExp(`</${html}>`, 'g');
        mmulCode = mmulCode.replace(htmlRegex, `<${mmul}>`);
        mmulCode = mmulCode.replace(htmlCloseRegex, `</${mmul}>`);
    }
    
    return mmulCode;
}

// Event handling for translation website
document.addEventListener('DOMContentLoaded', function() {
    const htmlInput = document.getElementById('codeArea1');
    const mmulOutput = document.getElementById('codeArea2');
    const lineNumbers1 = document.getElementById('lineNumbers1');
    const lineNumbers2 = document.getElementById('lineNumbers2');

    function updateLineNumbers(textarea, lineNumbersDiv) {
        const lines = textarea.value.split('\n').length;
        lineNumbersDiv.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    }

    function syncScroll(textarea, lineNumbersDiv) {
        lineNumbersDiv.scrollTop = textarea.scrollTop;
    }

    if (htmlInput && mmulOutput) {
        htmlInput.addEventListener('input', function() {
            const htmlCode = htmlInput.value;
            const mmulCode = translateToMMUL(htmlCode);
            mmulOutput.value = mmulCode;
            updateLineNumbers(htmlInput, lineNumbers1);
            updateLineNumbers(mmulOutput, lineNumbers2);
        });

        mmulOutput.addEventListener('input', function() {
            const mmulCode = mmulOutput.value;
            const htmlCode = translateToHTML(mmulCode);
            htmlInput.value = htmlCode;
            updateLineNumbers(htmlInput, lineNumbers1);
            updateLineNumbers(mmulOutput, lineNumbers2);
        });

        htmlInput.addEventListener('scroll', () => syncScroll(htmlInput, lineNumbers1));
        mmulOutput.addEventListener('scroll', () => syncScroll(mmulOutput, lineNumbers2));
    }
});
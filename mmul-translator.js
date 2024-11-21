// Base template parts
const baseDefaultContent = `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">`;

// Translation mappings
const mmulToHtml = {
    'fatty1': 'h1',
    'swag': 'style'
};

const htmlToMmul = {
    'h1': 'fatty1',
    'style': 'swag'
};

function getBaseTemplate(title) {
    return `head>
${baseDefaultContent}
    <title>${title}</title`;
}

function translateToHTML(mmulCode) {
    let htmlCode = mmulCode;
    
    // Handle base tag with title attribute
    const baseTagRegex = /<base(?:\s+title="([^"]*)")?\s*>/;
    const baseMatch = mmulCode.match(baseTagRegex);
    
    if (baseMatch) {
        const title = baseMatch[1] || window.location.href;
        const baseTemplate = getBaseTemplate(title);
        htmlCode = htmlCode.replace(baseTagRegex, `<${baseTemplate}>`);
        htmlCode = htmlCode.replace('</base>', '</head>');
    }

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
            // If it's the default website title, don't include the title attribute
            if (title === window.location.href) {
                mmulCode = mmulCode.replace(headMatch[0], '<base>');
            } else {
                mmulCode = mmulCode.replace(headMatch[0], `<base title="${title}">`);
            }
            mmulCode = mmulCode.replace('</head>', '</base>');
        }
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

function updateLineNumbers(textareaId, lineNumbersId) {
    const textarea = document.getElementById(textareaId);
    const lineNumbers = document.getElementById(lineNumbersId);
    const lines = textarea.value.split('\n');
    
    lineNumbers.innerHTML = '';
    
    for (let i = 1; i <= Math.max(1, lines.length); i++) {
        const lineNumber = document.createElement('div');
        lineNumber.className = 'line-number';
        lineNumber.textContent = i;
        lineNumbers.appendChild(lineNumber);
    }
}

const htmlTextarea = document.getElementById('codeArea1');
const mmulTextarea = document.getElementById('codeArea2');

let isHtmlUpdating = false;
let isMmulUpdating = false;

htmlTextarea.addEventListener('input', () => {
    if (!isHtmlUpdating) {
        isMmulUpdating = true;
        mmulTextarea.value = translateToMMUL(htmlTextarea.value);
        updateLineNumbers('codeArea1', 'lineNumbers1');
        updateLineNumbers('codeArea2', 'lineNumbers2');
        isMmulUpdating = false;
    }
});

mmulTextarea.addEventListener('input', () => {
    if (!isMmulUpdating) {
        isHtmlUpdating = true;
        htmlTextarea.value = translateToHTML(mmulTextarea.value);
        updateLineNumbers('codeArea1', 'lineNumbers1');
        updateLineNumbers('codeArea2', 'lineNumbers2');
        isHtmlUpdating = false;
    }
});

// Initialize line numbers
updateLineNumbers('codeArea1', 'lineNumbers1');
updateLineNumbers('codeArea2', 'lineNumbers2');
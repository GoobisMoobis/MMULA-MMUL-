// Base template parts
const baseDefaultContent = `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">`;

// Translation mappings
const mmulToHtml = {
    'fatty1': 'h1',
    'swag': 'style',
    'js': 'script'
    // Add other number mappings here
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
    // Store HTML sections temporarily
    const htmlSections = [];
    let counter = 0;
    const placeholder = '###HTML_SECTION_';
    let htmlCode = mmulCode.replace(/<html>([\s\S]*?)<\/html>/g, (match, content) => {
        htmlSections.push(content);
        return placeholder + (counter++);
    });
    
    // Handle base tag with override type
    const baseOverrideRegex = /<base\s+type="override"(?:\s+title="([^"]*)")?\s*>/;
    const baseOverrideMatch = htmlCode.match(baseOverrideRegex);
    
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
        const baseMatch = htmlCode.match(baseTagRegex);
        
        if (baseMatch) {
            const title = baseMatch[1] || window.location.href;
            const baseTemplate = getBaseTemplate(title);
            htmlCode = htmlCode.replace(baseTagRegex, `<${baseTemplate}>`);
            htmlCode = htmlCode.replace('</base>', '</head>');
        }
    }

    // Handle other translations
    for (const [mmul, html] of Object.entries(mmulToHtml)) {
        const mmulRegex = new RegExp(`<${mmul}>`, 'g');
        const mmulCloseRegex = new RegExp(`</${mmul}>`, 'g');
        htmlCode = htmlCode.replace(mmulRegex, `<${html}>`);
        htmlCode = htmlCode.replace(mmulCloseRegex, `</${html.split('>')[0]}>`);
    }

    // Restore HTML sections
    for (let i = 0; i < htmlSections.length; i++) {
        htmlCode = htmlCode.replace(placeholder + i, htmlSections[i]);
    }
    
    return htmlCode;
}

function translateToMMUL(htmlCode) {
    // Store HTML sections temporarily
    const htmlSections = [];
    let counter = 0;
    const placeholder = '###HTML_SECTION_';
    let mmulCode = htmlCode.replace(/<html>([\s\S]*?)<\/html>/g, (match, content) => {
        htmlSections.push(content);
        return placeholder + (counter++);
    });

    // Handle head tag and its contents
    const headRegex = /<head>([\s\S]*?)<\/head>/;
    const headMatch = mmulCode.match(headRegex);
    
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

    // Restore HTML sections
    for (let i = 0; i < htmlSections.length; i++) {
        mmulCode = mmulCode.replace(placeholder + i, htmlSections[i]);
    }
    
    return mmulCode;
}
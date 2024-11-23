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
    
    // Split the code into sections by HTML tags
    const parts = htmlCode.split(/(<html>|<\/html>)/);
    
    // Process each section
    for (let i = 0; i < parts.length; i++) {
        // Skip the actual HTML tags and their content
        if (parts[i] === '<html>' || parts[i] === '</html>' || 
            (i > 0 && parts[i-1] === '<html>' && parts[i+1] === '</html>')) {
            continue;
        }
        
        // Process MMUL sections
        let section = parts[i];
        
        // Handle base tag with override type
        const baseOverrideRegex = /<base\s+type="override"(?:\s+title="([^"]*)")?\s*>/;
        const baseOverrideMatch = section.match(baseOverrideRegex);
        
        if (baseOverrideMatch) {
            const title = baseOverrideMatch[1] || window.location.href;
            section = section.replace(baseOverrideRegex, '<head>');
            section = section.replace('</base>', '</head>');
            if (title) {
                const titleTag = `<title>${title}</title>`;
                section = section.replace('</head>', titleTag + '</head>');
            }
        } else {
            // Handle regular base tag with title attribute
            const baseTagRegex = /<base(?:\s+title="([^"]*)")?\s*>/;
            const baseMatch = section.match(baseTagRegex);
            
            if (baseMatch) {
                const title = baseMatch[1] || window.location.href;
                const baseTemplate = getBaseTemplate(title);
                section = section.replace(baseTagRegex, `<${baseTemplate}>`);
                section = section.replace('</base>', '</head>');
            }
        }

        // Handle other translations
        for (const [mmul, html] of Object.entries(mmulToHtml)) {
            const mmulRegex = new RegExp(`<${mmul}>`, 'g');
            const mmulCloseRegex = new RegExp(`</${mmul}>`, 'g');
            section = section.replace(mmulRegex, `<${html}>`);
            section = section.replace(mmulCloseRegex, `</${html.split('>')[0]}>`);
        }
        
        parts[i] = section;
    }
    
    // Remove HTML tags and join the parts
    return parts.filter(part => part !== '<html>' && part !== '</html>').join('');
}

function translateToMMUL(htmlCode) {
    let mmulCode = htmlCode;
    
    // Split the code into sections by HTML tags
    const parts = mmulCode.split(/(<html>|<\/html>)/);
    
    // Process each section
    for (let i = 0; i < parts.length; i++) {
        // Skip the actual HTML tags and their content
        if (parts[i] === '<html>' || parts[i] === '</html>' || 
            (i > 0 && parts[i-1] === '<html>' && parts[i+1] === '</html>')) {
            continue;
        }
        
        // Process HTML sections
        let section = parts[i];
        
        // Handle head tag and its contents
        const headRegex = /<head>([\s\S]*?)<\/head>/;
        const headMatch = section.match(headRegex);
        
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
                    section = section.replace(headMatch[0], '<base>');
                } else {
                    section = section.replace(headMatch[0], `<base title="${title}">`);
                }
            } else {
                // Override base tag
                if (title) {
                    section = section.replace(headMatch[0], `<base type="override" title="${title}">`);
                } else {
                    section = section.replace(headMatch[0], '<base type="override">');
                }
            }
            section = section.replace('</head>', '</base>');
        }
        
        // Handle other translations
        for (const [html, mmul] of Object.entries(htmlToMmul)) {
            const htmlRegex = new RegExp(`<${html}[^>]*>`, 'g');
            const htmlCloseRegex = new RegExp(`</${html}>`, 'g');
            section = section.replace(htmlRegex, `<${mmul}>`);
            section = section.replace(htmlCloseRegex, `</${mmul}>`);
        }
        
        parts[i] = section;
    }
    
    // Remove HTML tags and join the parts
    return parts.filter(part => part !== '<html>' && part !== '</html>').join('');
}
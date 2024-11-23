function translateToHTML(mmulCode) {
    let htmlCode = mmulCode;
    
    // First split the code into MMUL sections and HTML passthrough sections
    const sections = htmlCode.split(/<html>|<\/html>/);
    
    // Process alternate sections (even indices are MMUL, odd are HTML passthrough)
    const processedSections = sections.map((section, index) => {
        if (index % 2 === 0) {
            // This is a MMUL section - process normally
            let processed = section;
            
            // Handle base tag with override type
            const baseOverrideRegex = /<base\s+type="override"(?:\s+title="([^"]*)")?\s*>/;
            const baseOverrideMatch = processed.match(baseOverrideRegex);
            
            if (baseOverrideMatch) {
                const title = baseOverrideMatch[1] || window.location.href;
                processed = processed.replace(baseOverrideRegex, '<head>');
                processed = processed.replace('</base>', '</head>');
                if (title) {
                    const titleTag = `<title>${title}</title>`;
                    processed = processed.replace('</head>', titleTag + '</head>');
                }
            } else {
                // Handle regular base tag with title attribute
                const baseTagRegex = /<base(?:\s+title="([^"]*)")?\s*>/;
                const baseMatch = processed.match(baseTagRegex);
                
                if (baseMatch) {
                    const title = baseMatch[1] || window.location.href;
                    const baseTemplate = getBaseTemplate(title);
                    processed = processed.replace(baseTagRegex, `<${baseTemplate}>`);
                    processed = processed.replace('</base>', '</head>');
                }
            }

            // Handle other translations
            for (const [mmul, html] of Object.entries(mmulToHtml)) {
                const mmulRegex = new RegExp(`<${mmul}>`, 'g');
                const mmulCloseRegex = new RegExp(`</${mmul}>`, 'g');
                processed = processed.replace(mmulRegex, `<${html}>`);
                processed = processed.replace(mmulCloseRegex, `</${html.split('>')[0]}>`);
            }
            return processed;
        } else {
            // This is an HTML passthrough section - return as-is
            return section;
        }
    });
    
    // Join all sections back together
    return processedSections.join('');
}

function translateToMMUL(htmlCode) {
    let mmulCode = htmlCode;
    
    // First find all HTML passthrough sections and temporarily store them
    const htmlSections = [];
    const htmlRegex = /<html>([\s\S]*?)<\/html>/g;
    let match;
    let index = 0;
    
    while ((match = htmlRegex.exec(htmlCode)) !== null) {
        htmlSections.push(match[1]);
        // Replace HTML section with placeholder
        mmulCode = mmulCode.replace(match[0], `__HTML_SECTION_${index}__`);
        index++;
    }
    
    // Process the remaining code as MMUL
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
        const htmlTagRegex = new RegExp(`<${html}[^>]*>`, 'g');
        const htmlCloseRegex = new RegExp(`</${html}>`, 'g');
        mmulCode = mmulCode.replace(htmlTagRegex, `<${mmul}>`);
        mmulCode = mmulCode.replace(htmlCloseRegex, `</${mmul}>`);
    }
    
    // Restore HTML sections
    htmlSections.forEach((section, i) => {
        mmulCode = mmulCode.replace(`__HTML_SECTION_${i}__`, `<html>${section}</html>`);
    });
    
    return mmulCode;
}
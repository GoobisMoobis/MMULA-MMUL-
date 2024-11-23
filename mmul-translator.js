function translateToHTML(mmulCode) {
    let htmlCode = mmulCode;
    
    // First, collect all HTML sections so we can exclude them from translation
    const htmlSections = [];
    const htmlTagRegex = /<html>([\s\S]*?)<\/html>/g;
    let match;
    let lastIndex = 0;
    const processedParts = [];

    // Collect all sections and their positions
    while ((match = htmlTagRegex.exec(mmulCode)) !== null) {
        // Add the non-HTML part before this match
        if (match.index > lastIndex) {
            processedParts.push({
                content: mmulCode.slice(lastIndex, match.index),
                isHtml: false
            });
        }
        // Add the HTML section
        processedParts.push({
            content: match[1],
            isHtml: true
        });
        lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining content after the last HTML section
    if (lastIndex < mmulCode.length) {
        processedParts.push({
            content: mmulCode.slice(lastIndex),
            isHtml: false
        });
    }

    // Process each part appropriately
    htmlCode = processedParts.map(part => {
        if (part.isHtml) {
            return part.content; // HTML sections pass through unchanged
        } else {
            let processed = part.content;
            
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

            // Handle translations for non-HTML sections
            for (const [mmul, html] of Object.entries(mmulToHtml)) {
                const mmulRegex = new RegExp(`<${mmul}>`, 'g');
                const mmulCloseRegex = new RegExp(`</${mmul}>`, 'g');
                processed = processed.replace(mmulRegex, `<${html}>`);
                processed = processed.replace(mmulCloseRegex, `</${html.split('>')[0]}>`);
            }
            
            return processed;
        }
    }).join('');
    
    return htmlCode;
}

function translateToMMUL(htmlCode) {
    let mmulCode = htmlCode;
    
    // First, collect all HTML sections so we can exclude them from translation
    const htmlSections = [];
    const htmlTagRegex = /<html>([\s\S]*?)<\/html>/g;
    let match;
    let lastIndex = 0;
    const processedParts = [];

    // Collect all sections and their positions
    while ((match = htmlTagRegex.exec(htmlCode)) !== null) {
        // Add the non-HTML part before this match
        if (match.index > lastIndex) {
            processedParts.push({
                content: htmlCode.slice(lastIndex, match.index),
                isHtml: false
            });
        }
        // Add the HTML section
        processedParts.push({
            content: match[1],
            isHtml: true
        });
        lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining content after the last HTML section
    if (lastIndex < htmlCode.length) {
        processedParts.push({
            content: htmlCode.slice(lastIndex),
            isHtml: false
        });
    }

    // Process each part appropriately
    mmulCode = processedParts.map(part => {
        if (part.isHtml) {
            return part.content; // HTML sections pass through unchanged
        } else {
            let processed = part.content;
            
            // Handle head tag and its contents
            const headRegex = /<head>([\s\S]*?)<\/head>/;
            const headMatch = processed.match(headRegex);
            
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
                        processed = processed.replace(headMatch[0], '<base>');
                    } else {
                        processed = processed.replace(headMatch[0], `<base title="${title}">`);
                    }
                } else {
                    // Override base tag
                    if (title) {
                        processed = processed.replace(headMatch[0], `<base type="override" title="${title}">`);
                    } else {
                        processed = processed.replace(headMatch[0], '<base type="override">');
                    }
                }
                processed = processed.replace('</head>', '</base>');
            }
            
            // Handle translations for non-HTML sections
            for (const [html, mmul] of Object.entries(htmlToMmul)) {
                const htmlRegex = new RegExp(`<${html}[^>]*>`, 'g');
                const htmlCloseRegex = new RegExp(`</${html}>`, 'g');
                processed = processed.replace(htmlRegex, `<${mmul}>`);
                processed = processed.replace(htmlCloseRegex, `</${mmul}>`);
            }
            
            return processed;
        }
    }).join('');
    
    return mmulCode;
}
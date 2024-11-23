function translateToHTML(mmulCode) {
    let htmlCode = mmulCode;
    let inHtmlSection = false;
    const lines = htmlCode.split('\n');
    const processedLines = [];

    for (let line of lines) {
        // Check for HTML tag opening/closing
        if (line.includes('<html>')) {
            inHtmlSection = true;
            continue; // Skip the <html> line
        } else if (line.includes('</html>')) {
            inHtmlSection = false;
            continue; // Skip the </html> line
        }

        // Process the line based on whether we're in an HTML section
        if (!inHtmlSection) {
            // Process MMUL translations
            let processedLine = line;
            
            // Handle base tag with override type
            const baseOverrideRegex = /<base\s+type="override"(?:\s+title="([^"]*)")?\s*>/;
            const baseOverrideMatch = processedLine.match(baseOverrideRegex);
            
            if (baseOverrideMatch) {
                const title = baseOverrideMatch[1] || window.location.href;
                processedLine = processedLine.replace(baseOverrideRegex, '<head>');
                processedLine = processedLine.replace('</base>', '</head>');
                if (title) {
                    const titleTag = `<title>${title}</title>`;
                    processedLine = processedLine.replace('</head>', titleTag + '</head>');
                }
            } else {
                // Handle regular base tag with title attribute
                const baseTagRegex = /<base(?:\s+title="([^"]*)")?\s*>/;
                const baseMatch = processedLine.match(baseTagRegex);
                
                if (baseMatch) {
                    const title = baseMatch[1] || window.location.href;
                    const baseTemplate = getBaseTemplate(title);
                    processedLine = processedLine.replace(baseTagRegex, `<${baseTemplate}>`);
                    processedLine = processedLine.replace('</base>', '</head>');
                }
            }

            // Handle other translations
            for (const [mmul, html] of Object.entries(mmulToHtml)) {
                const mmulRegex = new RegExp(`<${mmul}>`, 'g');
                const mmulCloseRegex = new RegExp(`</${mmul}>`, 'g');
                processedLine = processedLine.replace(mmulRegex, `<${html}>`);
                processedLine = processedLine.replace(mmulCloseRegex, `</${html.split('>')[0]}>`);
            }
            processedLines.push(processedLine);
        } else {
            // In HTML section - pass through unchanged
            processedLines.push(line);
        }
    }
    
    return processedLines.join('\n');
}

function translateToMMUL(htmlCode) {
    let mmulCode = htmlCode;
    let inHtmlSection = false;
    const lines = mmulCode.split('\n');
    const processedLines = [];

    for (let line of lines) {
        // Check for HTML tag opening/closing
        if (line.includes('<html>')) {
            inHtmlSection = true;
            continue; // Skip the <html> line
        } else if (line.includes('</html>')) {
            inHtmlSection = false;
            continue; // Skip the </html> line
        }

        // Process the line based on whether we're in an HTML section
        if (!inHtmlSection) {
            let processedLine = line;
            
            // Handle head tag and its contents
            const headRegex = /<head>([\s\S]*?)<\/head>/;
            const headMatch = processedLine.match(headRegex);
            
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
                        processedLine = processedLine.replace(headMatch[0], '<base>');
                    } else {
                        processedLine = processedLine.replace(headMatch[0], `<base title="${title}">`);
                    }
                } else {
                    // Override base tag
                    if (title) {
                        processedLine = processedLine.replace(headMatch[0], `<base type="override" title="${title}">`);
                    } else {
                        processedLine = processedLine.replace(headMatch[0], '<base type="override">');
                    }
                }
                processedLine = processedLine.replace('</head>', '</base>');
            }
            
            // Handle other translations
            for (const [html, mmul] of Object.entries(htmlToMmul)) {
                const htmlTagRegex = new RegExp(`<${html}[^>]*>`, 'g');
                const htmlCloseRegex = new RegExp(`</${html}>`, 'g');
                processedLine = processedLine.replace(htmlTagRegex, `<${mmul}>`);
                processedLine = processedLine.replace(htmlCloseRegex, `</${mmul}>`);
            }
            processedLines.push(processedLine);
        } else {
            // In HTML section - pass through unchanged
            processedLines.push(line);
        }
    }
    
    return processedLines.join('\n');
}
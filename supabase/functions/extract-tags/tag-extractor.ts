export interface ExtractionConfig {
  delimiterPairs: Array<{ start: string; end: string }>;
  caseSensitive: boolean;
  includeDelimiters: boolean;
}

export interface ExtractedTagResult {
  text: string;
  pattern: string;
  position: number;
  context: string;
  confidence: number;
  startDelimiter: string;
  endDelimiter: string;
  tagContent: string;
}

export class TagExtractor {
  static buildExtractionRegex(delimiterPairs: ExtractionConfig['delimiterPairs'], caseSensitive: boolean): RegExp {
    // Escape special regex characters properly, including Unicode characters
    const escapeRegex = (str: string) => {
      // Handle Unicode characters like « and » by escaping them properly
      return str.replace(/[.*+?^${}()|[\]\\«»<>]/g, '\\$&');
    };
    
    const patterns = [];
    
    // Create patterns for delimiter pairs - ENHANCED FOR MULTI-LINE SUPPORT
    const pairPatterns = delimiterPairs
      .filter(pair => pair.start && pair.end)
      .map(pair => {
        const startEscaped = escapeRegex(pair.start);
        let endEscaped;
        
        if (pair.end === ' ') {
          endEscaped = '\\s+';
        } else if (pair.end === ',') {
          endEscaped = ',';
        } else {
          endEscaped = escapeRegex(pair.end);
        }
        
        // Enhanced patterns to support multi-line tags with [\s\S] for any character including newlines
        if (pair.start === '<<' || pair.start === '<') {
          // Allow any content including newlines, spaces, and line breaks
          return `(${startEscaped})\\s*([A-Za-z_][\\s\\S]*?)\\s*(${endEscaped})`;
        } else {
          // For other delimiters, allow multi-line content but be more restrictive
          return `(${startEscaped})([A-Za-z_][A-Za-z0-9_\\s\\n\\r\\t]*?)(${endEscaped})`;
        }
      });
    
    patterns.push(...pairPatterns);
    
    // Enhanced common document tag patterns for multi-line support
    // Unicode guillemets pattern: «TAG» - with multi-line support
    patterns.push('(«)([A-Za-z_][A-Za-z0-9_\\s\\n\\r\\t]*?)(»)');
    
    // @ tag pattern @TAG@ (enclosed) - with multi-line support
    patterns.push('(@)([A-Za-z_][A-Za-z0-9_\\s\\n\\r\\t]*?)(@)');
    
    // @ tag pattern (space/comma terminated) - single line only
    patterns.push('(@)([A-Za-z_][A-Za-z0-9_]*)(?=[ ,\\n\\t\\r]|$)');
    
    // Double angle brackets: << TAG >> - with multi-line support
    patterns.push('(<<)\\s*([A-Za-z_][\\s\\S]*?)\\s*(>>)');
    
    // Square brackets: [TAG] - with multi-line support
    patterns.push('(\\[)([A-Za-z_][A-Za-z0-9_\\s\\n\\r\\t]*?)(\\])');
    
    // Curly braces: {TAG} - with multi-line support
    patterns.push('(\\{)([A-Za-z_][A-Za-z0-9_\\s\\n\\r\\t]*?)(\\})');
    
    if (patterns.length === 0) {
      // Enhanced fallback with multi-line support
      return /(\\[)([A-Za-z_][A-Za-z0-9_\\s\\n\\r\\t]*?)(\\])/gims;
    }
    
    // Combine all patterns with OR - added 'm' and 's' flags for multi-line support
    const combinedPattern = patterns.join('|');
    const flags = caseSensitive ? 'gms' : 'gims';
    
    return new RegExp('(' + combinedPattern + ')', flags);
  }

  static extractTags(templateContent: string, config: ExtractionConfig): ExtractedTagResult[] {
    console.log('Step 6: Building extraction regex...');
    
    // Use user-provided config, with minimal defaults only if needed
    const finalConfig: ExtractionConfig = {
      delimiterPairs: config?.delimiterPairs || [{ start: '[', end: ']' }],
      caseSensitive: config?.caseSensitive ?? false,
      includeDelimiters: config?.includeDelimiters ?? true
    };
    console.log('Using extraction config:', finalConfig);
    
    const tagRegex = this.buildExtractionRegex(finalConfig.delimiterPairs, finalConfig.caseSensitive);
    
    console.log('Generated regex:', tagRegex);
    const extractedTags: ExtractedTagResult[] = [];
    const seenTags = new Set<string>();
    let position = 1;

    // Reset regex lastIndex to ensure we scan from the beginning
    tagRegex.lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(templateContent)) !== null) {
      const fullMatch = match[0]; // Full match including delimiters
      
      // Handle different capture groups - find non-empty groups
      let startDelim = '';
      let tagContent = '';
      let endDelim = '';
      
      // Skip the first group (full match) and find populated groups
      for (let i = 2; i < match.length; i += 3) {
        if (match[i] && match[i + 1]) {
          startDelim = match[i];
          tagContent = match[i + 1];
          endDelim = match[i + 2] || '';
          break;
        }
      }
      
      // If we didn't find groups in the expected pattern, try alternative parsing
      if (!startDelim && !tagContent) {
        // Look for any sequence of 3 consecutive non-null groups
        for (let i = 1; i < match.length - 2; i++) {
          if (match[i] && match[i + 1] && (match[i + 2] || match[i + 1].trim())) {
            startDelim = match[i];
            tagContent = match[i + 1].trim();
            endDelim = match[i + 2] || '';
            break;
          }
        }
      }
      
      // Skip if we couldn't parse the tag
      if (!tagContent) {
        console.log('Could not parse tag from match:', match);
        continue;
      }
      
      // Clean up multi-line tag content - normalize whitespace but preserve structure
      tagContent = tagContent.trim();
      // Replace multiple consecutive whitespace/newlines with single spaces for cleaner display
      tagContent = tagContent.replace(/\s+/g, ' ');
      
      // For @ tags, if no explicit end delimiter is captured, use comma or space
      if (startDelim === '@' && !endDelim) {
        // Look ahead in the text to find the actual terminator
        const afterMatch = templateContent.substring(match.index + fullMatch.length, match.index + fullMatch.length + 10);
        if (afterMatch.match(/^[, \n\t]/)) {
          endDelim = afterMatch.charAt(0);
        }
      }
      
      const tagText = finalConfig.includeDelimiters ? (startDelim + tagContent + endDelim) : tagContent;
      
      // Skip if we've already seen this tag
      if (seenTags.has(tagText)) {
        continue;
      }
      seenTags.add(tagText);

      // Get context around the tag (±30 characters)
      const start = Math.max(0, match.index - 30);
      const end = Math.min(templateContent.length, match.index + match[0].length + 30);
      const context = templateContent.substring(start, end).trim();

      // Determine pattern/category based on tag content and delimiters
      let pattern = `${startDelim}...${endDelim || ''} tag`;
      let confidence = 85;

      // Special handling for @ tags
      if (startDelim === '@') {
        pattern = '@tag (comma/space terminated)';
        confidence = 90;
      } else if (tagContent.includes('DATE')) {
        pattern = 'Date field';
        confidence = 95;
      } else if (tagContent.includes('NAME')) {
        pattern = 'Name field';
        confidence = 90;
      } else if (tagContent.includes('EMAIL')) {
        pattern = 'Email field';
        confidence = 95;
      } else if (tagContent.includes('PHONE')) {
        pattern = 'Phone field';
        confidence = 90;
      } else if (tagContent.includes('ADDRESS')) {
        pattern = 'Address field';
        confidence = 90;
      } else if (tagContent.includes('VALUE') || tagContent.includes('AMOUNT')) {
        pattern = 'Currency/Value field';
        confidence = 90;
      } else if (tagContent.includes('NUMBER')) {
        pattern = 'Number field';
        confidence = 85;
      } else if (tagContent.includes('COMPANY')) {
        pattern = 'Company information field';
        confidence = 95;
      }

      extractedTags.push({
        text: tagText,
        pattern: pattern,
        position: position++,
        context: context,
        confidence: confidence,
        startDelimiter: startDelim,
        endDelimiter: endDelim,
        tagContent: tagContent
      });
    }

    console.log(`✅ Found ${extractedTags.length} unique tags:`, extractedTags.map(t => t.text));
    return extractedTags;
  }
}
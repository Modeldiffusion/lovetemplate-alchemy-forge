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
      return str.replace(/[.*+?^${}()|[\]\\«»]/g, '\\$&');
    };
    
    const patterns = [];
    
    // Create patterns for delimiter pairs
    const pairPatterns = delimiterPairs
      .filter(pair => pair.start && pair.end)
      .map(pair => {
        const startEscaped = escapeRegex(pair.start);
        const endEscaped = pair.end === ' ' ? '\\s+' : escapeRegex(pair.end);
        
        // Support mixed case tags like tag_Name or TAG_NAME
        return `(${startEscaped})([A-Za-z_][A-Za-z0-9_]*)(${endEscaped})`;
      });
    
    patterns.push(...pairPatterns);
    
    // Add @ tag pattern (comma or space terminated, or end of line)
    // @tagname followed by comma, space, or end of string/line
    patterns.push('(@)([A-Za-z_][A-Za-z0-9_]*)(?=[ ,\\n\\t\\r]|$)');
    
    if (patterns.length === 0) {
      // Fallback to default if no valid patterns
      return /(\\[)([A-Za-z_][A-Za-z0-9_]*)(\\])/gi;
    }
    
    // Combine all patterns with OR
    const combinedPattern = patterns.join('|');
    const flags = caseSensitive ? 'g' : 'gi';
    
    return new RegExp(combinedPattern, flags);
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
      
      // Handle different capture groups based on pattern type
      let startDelim = '';
      let tagContent = '';
      let endDelim = '';
      
      // Find which capture groups are populated
      for (let i = 1; i < match.length; i += 3) {
        if (match[i] && match[i + 1]) {
          startDelim = match[i];
          tagContent = match[i + 1];
          endDelim = match[i + 2] || '';
          break;
        }
      }
      
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
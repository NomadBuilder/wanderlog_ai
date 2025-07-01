// Story Formatter - Converts plain text narratives into well-formatted HTML
class StoryFormatter {
    
    /**
     * Format story narrative with proper paragraphs, bullets, and visual structure
     * @param {string} narrative - The plain text narrative
     * @returns {string} - Formatted HTML
     */
    static formatNarrative(narrative) {
        if (!narrative) return 'No narrative available';
        
        let formatted = narrative;
        
        // 1. Split into paragraphs (double line breaks)
        formatted = formatted.replace(/\n\n+/g, '</p><p>');
        
        // 2. Handle single line breaks within paragraphs
        formatted = formatted.replace(/\n(?!<\/p>)/g, '<br>');
        
        // 3. Wrap in paragraph tags if not already wrapped
        if (!formatted.startsWith('<p>')) {
            formatted = '<p>' + formatted + '</p>';
        }
        
        // 4. Convert bullet points and lists
        formatted = formatted.replace(/^[-•*]\s+(.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // 5. Handle numbered lists
        formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        
        // 6. Add emphasis to key phrases
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 7. Add visual separators for sections
        formatted = formatted.replace(/^(The Journey|Arrival|Exploring|Highlights|Memories|Reflections|Departure|Return):/gmi, '<h3>$1</h3>');
        
        // 8. Add spacing between sections
        formatted = formatted.replace(/<\/h3>/g, '</h3><div class="section-spacer"></div>');
        
        // 9. Clean up any double paragraph tags
        formatted = formatted.replace(/<\/p><p><\/p><p>/g, '</p><p>');
        formatted = formatted.replace(/<p><\/p>/g, '');
        
        // 10. Add special formatting for quotes or memorable moments
        formatted = formatted.replace(/"([^"]+)"/g, '<span class="quote">"$1"</span>');
        
        // 11. Add formatting for time references
        formatted = formatted.replace(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/g, '<span class="time">$1</span>');
        
        // 12. Add formatting for place names
        formatted = formatted.replace(/(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)/g, function(match) {
            // Don't format common words or already formatted text
            const commonWords = ['The', 'And', 'But', 'For', 'With', 'From', 'Into', 'During', 'Before', 'After', 'Above', 'Below', 'Between', 'Among'];
            if (commonWords.includes(match) || match.includes('<')) {
                return match;
            }
            return `<span class="place-name">${match}</span>`;
        });
        
        // 13. Add formatting for weather/atmosphere descriptions
        formatted = formatted.replace(/(sunny|rainy|cloudy|clear|warm|cold|hot|chilly|breezy|windy|humid|dry)/gi, '<span class="weather">$1</span>');
        
        // 14. Add formatting for food/drink mentions
        formatted = formatted.replace(/(coffee|tea|wine|beer|pasta|pizza|sushi|curry|bread|cheese|chocolate)/gi, '<span class="food">$1</span>');
        
        return formatted;
    }
    
    /**
     * Enhanced formatting with more sophisticated structure detection
     * @param {string} narrative - The plain text narrative
     * @returns {string} - Formatted HTML with enhanced structure
     */
    static formatNarrativeEnhanced(narrative) {
        if (!narrative) return 'No narrative available';
        
        let formatted = narrative;
        
        // First, apply basic formatting
        formatted = this.formatNarrative(formatted);
        
        // Add enhanced visual elements
        formatted = formatted.replace(/<p>(.*?)<\/p>/g, function(match, content) {
            // Add special styling for opening paragraphs
            if (content.includes('arrived') || content.includes('landed') || content.includes('reached')) {
                return `<p class="opening-paragraph">${content}</p>`;
            }
            // Add special styling for closing paragraphs
            if (content.includes('returned') || content.includes('left') || content.includes('goodbye') || content.includes('farewell')) {
                return `<p class="closing-paragraph">${content}</p>`;
            }
            return match;
        });
        
        // Add callout boxes for special moments
        formatted = formatted.replace(/<p>(.*?(?:amazing|incredible|unforgettable|breathtaking|stunning).*?)<\/p>/gi, 
            '<div class="highlight-box"><p>$1</p></div>');
        
        return formatted;
    }
}

// Global function for easy access
function formatStoryNarrative(narrative) {
    return StoryFormatter.formatNarrativeEnhanced(narrative);
} 
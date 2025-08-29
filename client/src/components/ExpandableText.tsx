import React, { useState } from 'react';
import './ExpandableText.css';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  maxLines?: number;
  className?: string;
  showMoreText?: string;
  showLessText?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLength = 100,
  maxLines,
  className = '',
  showMoreText = 'Show more',
  showLessText = 'Show less'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if text should be truncated
  const shouldTruncate = text.length > maxLength;
  
  if (!shouldTruncate) {
    return <span className={`expandable-text ${className}`}>{text}</span>;
  }

  const truncatedText = text.substring(0, maxLength);
  const displayText = isExpanded ? text : truncatedText;

  return (
    <span className={`expandable-text ${className}`}>
      <span className={`text-content ${maxLines ? 'line-clamp' : ''}`} 
            style={maxLines && !isExpanded ? { 
              display: '-webkit-box',
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            } : {}}>
        {displayText}
        {!isExpanded && shouldTruncate && '...'}
      </span>
      {shouldTruncate && (
        <button
          className="expand-toggle"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          type="button"
          aria-label={isExpanded ? showLessText : showMoreText}
        >
          {isExpanded ? showLessText : showMoreText}
        </button>
      )}
    </span>
  );
};

export default ExpandableText;
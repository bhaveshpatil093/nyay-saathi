import React from 'react';

interface HighlightMatchProps {
  text: string;
  query: string;
  className?: string;
  matchClassName?: string;
}

export const HighlightMatch: React.FC<HighlightMatchProps> = ({
  text,
  query,
  className = '',
  matchClassName = 'bg-saffron/30 text-amber-200 font-bold px-0.5 rounded',
}) => {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const trimmed = query.trim();
  // Escape special regex characters in the query
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokens = escaped.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create combined regex pattern for all query words
  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = tokens.some((token) => token.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={i} className={matchClassName}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </span>
  );
};

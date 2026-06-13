import React from "react";
import DOMPurify from "dompurify";

interface HTMLRendererProps {
  html?: string | null;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Safely renders HTML content after sanitization
 * Prevents XSS attacks while allowing formatted content
 */
export function HTMLRenderer({ html, className = "", fallback = null }: HTMLRendererProps) {
  if (!html) return fallback;

  // Sanitize HTML to remove scripts and dangerous attributes
  const cleanHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "strong", "em", "u", "p", "br", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6"],
    ALLOWED_ATTR: [],
  });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
    />
  );
}

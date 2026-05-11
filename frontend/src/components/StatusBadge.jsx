/**
 * ========================================
 * STATUS BADGE COMPONENT
 * ========================================
 * 
 * Tiny reusable component for displaying status labels like 'approved', 'pending',
 * 'rejected'. Features predefined colors for each status with option for custom colors.
 * Supports different sizes and shapes (pill or square).
 * 
 * @author Anxhela Valisi
 * @contributor Megi Shehi
 */

import React from 'react';

const StatusBadge = ({
  status,
  label,
  size = 'md',
  variant = 'pill',
  customColors,
  className = '',
}) => {
  // ===== COLOR MAPPING =====
  // Megi: "Each status has its own color scheme. Green = good, red = bad, yellow = wait, etc."
  const defaultColorMap = {
    approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    published: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    unverified: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    warning: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    info: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  };

  // ===== SIZE CONFIGURATION =====
  // Anxhela: "Three sizes to fit different contexts - small for lists, large for cards"
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // ===== SHAPE CONFIGURATION =====
  // Izabela: "Pill (rounded) looks modern, square is more traditional"
  const variantClasses = variant === 'pill' ? 'rounded-full' : 'rounded-md';

  // ===== SELECT COLORS AND DISPLAY TEXT =====
  // Megi: "Use custom colors if provided, otherwise fall back to status mapping"
  const colors = customColors || defaultColorMap[status?.toLowerCase()] || defaultColorMap.info;
  const displayLabel = label || status;

  return (
    <span
      className={`inline-flex items-center font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${variantClasses} ${className}`}
    >
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
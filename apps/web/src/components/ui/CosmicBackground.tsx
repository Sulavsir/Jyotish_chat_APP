'use client';

import React from 'react';

export function CosmicBackground() {
  return (
    <div className="cosmic-background">
      {/* Gradient layer */}
      <div className="cosmic-gradient" />

      {/* Optimized Nebula layers */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />

      {/* Star layers */}
      <div className="stars-small" />
      <div className="stars-medium" />
      <div className="stars-large" />
    </div>
  );
}

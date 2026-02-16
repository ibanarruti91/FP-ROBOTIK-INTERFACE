import { useState } from 'react';
import './BinaryBackground.css';

// Animation timing constants
const MIN_DURATION = 3; // seconds
const MAX_DURATION = 7; // seconds
const MAX_DELAY = 2; // seconds

function BinaryBackground() {
  // Generate 40 random bits with random positions and animation durations
  // Using useState to ensure values are only generated once
  const [bits] = useState(() => {
    return Array.from({ length: 40 }, (_, index) => ({
      id: index,
      value: Math.random() > 0.5 ? '1' : '0',
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION)}s`,
      delay: `${Math.random() * MAX_DELAY}s`,
      fontSize: '0.8rem'
    }));
  });

  return (
    <div className="binary-background-clean">
      {bits.map((bit) => (
        <span
          key={bit.id}
          className="bit-soft"
          style={{
            top: bit.top,
            left: bit.left,
            animationDuration: bit.duration,
            animationDelay: bit.delay,
            fontSize: bit.fontSize
          }}
        >
          {bit.value}
        </span>
      ))}
    </div>
  );
}

export default BinaryBackground;

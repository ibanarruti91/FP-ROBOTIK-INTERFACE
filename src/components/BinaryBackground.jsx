import { useState } from 'react';
import './BinaryBackground.css';

function BinaryBackground() {
  // Generate 40 random bits with random positions and animation durations
  // Using useState to ensure values are only generated once
  const [bits] = useState(() => {
    return Array.from({ length: 40 }, (_, index) => ({
      id: index,
      value: Math.random() > 0.5 ? '1' : '0',
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${3 + Math.random() * 4}s`, // Between 3-7 seconds
      delay: `${Math.random() * 2}s`, // Random delay up to 2 seconds
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

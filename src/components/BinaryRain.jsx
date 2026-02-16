import { useMemo } from 'react';
import './BinaryRain.css';

// Helper function to generate rain elements (outside component to avoid purity issues)
const generateRainElements = () => 
  Array.from({ length: 30 }, (_, i) => ({
    id: i,
    digit: Math.random() > 0.5 ? '1' : '0',
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${3 + Math.random() * 4}s`,
    opacity: 0.1 + Math.random() * 0.3
  }));

function BinaryRain() {
  // Generate array of binary digits with random properties (memoized to prevent re-renders)
  const rainElements = useMemo(() => generateRainElements(), []);

  return (
    <div className="binary-rain">
      {rainElements.map((element) => (
        <span
          key={element.id}
          className="binary-digit"
          style={{
            left: element.left,
            animationDelay: element.animationDelay,
            animationDuration: element.animationDuration,
            opacity: element.opacity
          }}
        >
          {element.digit}
        </span>
      ))}
    </div>
  );
}

export default BinaryRain;

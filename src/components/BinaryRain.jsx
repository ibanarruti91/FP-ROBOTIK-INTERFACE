import { useState, useEffect } from 'react';
import './BinaryRain.css';

// Helper function to generate static positioned data bits
const generateDataBits = () => 
  Array.from({ length: 180 }, (_, i) => ({
    id: i,
    digit: Math.random() > 0.5 ? '1' : '0',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${2 + Math.random() * 2}s`
  }));

function BinaryRain() {
  // Generate array of binary digits with fixed random positions
  const [dataBits, setDataBits] = useState(() => generateDataBits());

  // Change digit values intermittently
  useEffect(() => {
    const interval = setInterval(() => {
      setDataBits(prevBits => 
        prevBits.map(bit => ({
          ...bit,
          digit: Math.random() > 0.5 ? '1' : '0'
        }))
      );
    }, 3000); // Change digits every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="binary-data-grid">
      {dataBits.map((bit) => (
        <span
          key={bit.id}
          className="data-bit"
          style={{
            left: bit.left,
            top: bit.top,
            animationDelay: bit.animationDelay,
            animationDuration: bit.animationDuration
          }}
        >
          {bit.digit}
        </span>
      ))}
    </div>
  );
}

export default BinaryRain;

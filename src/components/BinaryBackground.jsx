import { useState, useEffect } from 'react';
import './BinaryRain.css';

const generateDataBits = () => 
  Array.from({ length: 300 }, (_, i) => ({
    id: i,
    digit: Math.random() > 0.5 ? '1' : '0',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 4}s`,
    animationDuration: `${0.8 + Math.random() * 1.2}s`
  }));

function BinaryRain() {
  const [dataBits, setDataBits] = useState(() => generateDataBits());

  useEffect(() => {
    const interval = setInterval(() => {
      setDataBits(prevBits => 
        prevBits.map(bit => ({
          ...bit,
          digit: Math.random() > 0.5 ? '1' : '0'
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="digital-universe-overlay">
      {dataBits.map((bit) => (
        <span
          key={bit.id}
          className="bit-flash"
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

import { useState, useEffect } from 'react';
import './BinaryRain.css';

const generateDataBits = () => 
  Array.from({ length: 300 }, (_, i) => ({
    id: i,
    digit: Math.random() > 0.5 ? '1' : '0',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${0.7 + Math.random() * 1.3}s`
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
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="digital-universe-overlay">
      {dataBits.map((bit) => (
        <span
          key={bit.id}
          /* Si el dígito es '1', añade la clase 'is-one' para más brillo */
          className={`bit-flash ${bit.digit === '1' ? 'is-one' : ''}`}
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

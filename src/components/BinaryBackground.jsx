import { useState, useEffect } from 'react';
import './BinaryRain.css';

const generateDataBits = () => 
  Array.from({ length: 300 }, (_, i) => ({
    id: i,
    digit: Math.random() > 0.5 ? '1' : '0',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    // Tiempos más cortos para que el parpadeo sea constante
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${0.6 + Math.random() * 1.0}s` 
  }));

function BinaryRain() {
  const [dataBits, setDataBits] = useState(() => generateDataBits());

  useEffect(() => {
    const interval = setInterval(() => {
      setDataBits(prevBits => 
        prevBits.map(bit => ({
          ...bit,
          // Cambiamos el dígito aleatoriamente para simular procesamiento
          digit: Math.random() > 0.5 ? '1' : '0'
        }))
      );
    }, 1500); // Cambio de datos más rápido
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

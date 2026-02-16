<div 
  className="sidebar-header" 
  onClick={() => navigate('/')} 
  style={{ 
    cursor: 'pointer', 
    display: 'flex !important', 
    flexDirection: 'column !important', 
    alignItems: 'center !important',
    padding: '0px !important',
    margin: '0px !important',
    gap: '0px !important'
  }}
>
  <div style={{ height: '260px', width: '100%', display: 'flex', justifyContent: 'center' }}>
    <img 
      src={`${import.meta.env.BASE_URL}assets/logo.png`}
      alt="Logo" 
      style={{ 
        height: '260px !important', // Forzamos altura gigante
        maxHeight: '260px !important',
        width: 'auto !important', 
        marginBottom: '-40px !important', // Forzamos que el texto suba mucho
        objectFit: 'contain'
      }} 
    />
  </div>
  
  <h1 
    className="sidebar-title" 
    style={{ 
      marginTop: '0px !important', 
      paddingTop: '0px !important', 
      lineHeight: '0.8 !important', // Ultra compacto
      fontSize: '1.4rem !important',
      textAlign: 'center'
    }}
  >
    FP Robotic Interface
  </h1>
  
  <p style={{ margin: '0', fontSize: '0.7rem', opacity: 0.7 }}>
    Colaboración Salesianos Urnieta × CIFP Repélegaaaaaaa
  </p>
</div>

import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient';

const Buscador = ({ alSeleccionarNicho }) => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  const manejarBusqueda = async (e) => {
    const texto = e.target.value;
    setBusqueda(texto);

    // Permitimos buscar si escribe al menos 3 números o letras
    if (texto.length < 3) {
      setResultados([]); 
      return;
    }

    setCargando(true);

    // --- AQUÍ ESTÁ EL CAMBIO ---
    // Agregamos "cedula.ilike" a la condición .or()
    const { data, error } = await supabase
      .from('fallecidos')
      .select(`
        id,
        nombres,
        apellidos,
        cedula, 
        fallecido_nicho (
          nichos (
            codigo
          )
        )
      `)
      // Ahora busca en Nombres O Apellidos O Cédula
      .or(`nombres.ilike.%${texto}%,apellidos.ilike.%${texto}%,cedula.ilike.%${texto}%`)
      .limit(5);

    if (error) {
      console.error('Error buscando:', error);
    } else {
      const formateados = data.map(d => {
        const codigoNicho = d.fallecido_nicho?.[0]?.nichos?.codigo || 'Sin Asignar';
        return {
          id: d.id,
          nombre_completo: `${d.nombres} ${d.apellidos}`,
          cedula: d.cedula, // Guardamos la cédula para mostrarla
          codigo_nicho: codigoNicho
        };
      });
      setResultados(formateados);
    }
    
    setCargando(false);
  };

  return (
    <div style={{
      position: 'absolute', top: '20px', left: '50px', zIndex: 1000,
      backgroundColor: 'white', padding: '10px', borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '300px',
      fontFamily: 'Arial, sans-serif' // Un toque de estilo básico
    }}>
      <input
        type="text"
        placeholder="Escribe Cédula o Nombre..." // Actualizamos el placeholder
        value={busqueda}
        onChange={manejarBusqueda}
        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
      
      {resultados.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0 0', borderTop: '1px solid #eee', maxHeight: '300px', overflowY: 'auto' }}>
          {resultados.map((item) => (
            <li 
              key={item.id} 
              onClick={() => {
                alSeleccionarNicho(item.codigo_nicho);
                setResultados([]); 
                setBusqueda(`${item.nombre_completo}`); // Al seleccionar, dejamos el nombre visible
              }} 
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9f9f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div style={{fontWeight: 'bold', color: '#333'}}>{item.nombre_completo}</div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '4px'}}>
                {/* Mostramos la cédula en azulito para que resalte */}
                <span style={{color: '#007bff', fontSize: '12px', fontWeight: '500'}}>
                  🪪 {item.cedula || 'S/N'}
                </span>
                <span style={{color: '#666', fontSize: '12px'}}>
                  📍 {item.codigo_nicho}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {cargando && <p style={{fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '5px'}}>Buscando en base de datos...</p>}
    </div>
  );
};

export default Buscador;
import React, { useState, useEffect } from 'react';
import { Search, Layers, Map as MapIcon, Eye, EyeOff, Sparkles, MapPin, Info, Navigation, Grid3X3, FileText, CheckSquare, Square } from 'lucide-react'; // Iconos
import { supabase } from '../../api/supabaseClient';
import { jsPDF } from 'jspdf'; // HU-GEO-10: Generar PDF
import logo from '../../assets/logo.png'; // Importamos el logo

const Sidebar = ({ alBuscar, alCambiarCapas, alSeleccionarBloque, capasConfig }) => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [bloques, setBloques] = useState([]); // Lista de bloques para HU-GEO-07
  const [bloqueActual, setBloqueActual] = useState(''); // Bloque seleccionado para zoom
  const [generandoReporte, setGenerandoReporte] = useState(false); // HU-GEO-10
  
  // HU-GEO-10: Estados para reporte por sector
  const [sectores, setSectores] = useState([]); // Lista de sectores únicos
  const [sectorSeleccionado, setSectorSeleccionado] = useState(''); // Sector seleccionado
  const [bloquesDelSector, setBloquesDelSector] = useState([]); // Bloques filtrados por sector
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]); // Bloques marcados para reporte
  
  const [capasVisibles, setCapasVisibles] = useState({
    'cementerio_general': true,
    'infraestructura': true,
    'bloques_geom': true,
    'nichos_geom': true
  });
  const [mensajeBusqueda, setMensajeBusqueda] = useState(null); // Para mostrar mensajes de búsqueda

  // --- CARGAR BLOQUES AL INICIAR (HU-GEO-07) ---
  useEffect(() => {
    const cargarBloques = async () => {
      try {
        // Cargar bloques directamente desde Supabase para tener los IDs correctos
        const { data: bloquesDB, error } = await supabase
          .from('bloques_geom')
          .select('id, codigo, nombre, sector')
          .order('codigo');
        
        if (error) {
          console.error('Error cargando bloques desde Supabase:', error);
          return;
        }
        
        console.log('🗄️ Bloques desde Supabase:', bloquesDB);
        
        const listaBloques = bloquesDB.map(b => ({
          id: b.id,  // ID real de la base de datos
          codigo: b.codigo,
          nombre: b.nombre || b.codigo,
          sector: b.sector
        }));
        
        console.log('✅ Bloques cargados con IDs reales:', listaBloques);
        setBloques(listaBloques);
        
        // HU-GEO-10 CA1: Extraer sectores únicos para el dropdown
        const sectoresUnicos = [...new Set(listaBloques.map(b => b.sector).filter(Boolean))].sort();
        setSectores(sectoresUnicos);
        console.log('✅ Sectores disponibles:', sectoresUnicos);
        
      } catch (error) {
        console.error('Error cargando bloques:', error);
      }
    };
    
    cargarBloques();
  }, []);

  // HU-GEO-10 CA1: Filtrar bloques cuando se selecciona un sector
  useEffect(() => {
    if (sectorSeleccionado) {
      const bloquesFiltrados = bloques.filter(b => b.sector === sectorSeleccionado);
      setBloquesDelSector(bloquesFiltrados);
      setBloquesSeleccionados([]); // Limpiar selección anterior
    } else {
      setBloquesDelSector([]);
      setBloquesSeleccionados([]);
    }
  }, [sectorSeleccionado, bloques]);

  // --- LÓGICA DEL BUSCADOR ---
  const manejarBusqueda = async (e) => {
    const texto = e.target.value;
    setBusqueda(texto);
    setMensajeBusqueda(null);

    if (texto.length < 3) { setResultados([]); return; }
    setCargando(true);

    const { data } = await supabase
      .from('fallecidos')
      .select(`id, nombres, apellidos, cedula, fallecido_nicho ( nichos ( codigo ) )`)
      .or(`nombres.ilike.%${texto}%,apellidos.ilike.%${texto}%,cedula.ilike.%${texto}%`)
      .limit(5);

    const formateados = data ? data.map(d => ({
      id: d.id,
      nombre: `${d.nombres} ${d.apellidos}`,
      cedula: d.cedula,
      codigo: d.fallecido_nicho?.[0]?.nichos?.codigo || null
    })) : [];

    setResultados(formateados);
    setCargando(false);
    
    // Si no hay resultados, mostrar mensaje
    if (formateados.length === 0 && texto.length >= 3) {
      setMensajeBusqueda({ tipo: 'error', texto: 'No se encontró ningún fallecido con esa cédula' });
      setTimeout(() => setMensajeBusqueda(null), 4000);
    }
  };

  // --- SELECCIONAR RESULTADO ---
  const seleccionarResultado = (item) => {
    if (item.codigo) {
      alBuscar(item.codigo);
      setResultados([]);
      setBusqueda(item.cedula);
    } else {
      // El fallecido no tiene nicho asignado
      setMensajeBusqueda({ tipo: 'warning', texto: `${item.nombre} no tiene nicho asignado` });
      setTimeout(() => setMensajeBusqueda(null), 4000);
      setResultados([]);
      setBusqueda(item.nombre);
    }
  };

  // --- LÓGICA DE CAPAS ---
  const toggleCapa = (nombreCapa) => {
    const nuevoEstado = { ...capasVisibles, [nombreCapa]: !capasVisibles[nombreCapa] };
    setCapasVisibles(nuevoEstado);
    alCambiarCapas(nuevoEstado); // Avisamos al mapa
  };

  // --- BOTÓN UBICAR ---
  const ubicarFallecido = async () => {
    if (busqueda.length < 3) {
      setMensajeBusqueda({ tipo: 'error', texto: 'Ingrese al menos 3 dígitos de la cédula' });
      setTimeout(() => setMensajeBusqueda(null), 4000);
      return;
    }
    
    setCargando(true);
    const { data } = await supabase
      .from('fallecidos')
      .select(`id, nombres, apellidos, cedula, fallecido_nicho ( nichos ( codigo ) )`)
      .eq('cedula', busqueda)
      .limit(1);

    if (data && data.length > 0) {
      const fallecido = data[0];
      const codigo = fallecido.fallecido_nicho?.[0]?.nichos?.codigo;
      
      if (codigo) {
        alBuscar(codigo);
        setMensajeBusqueda({ tipo: 'exito', texto: `${fallecido.nombres} ${fallecido.apellidos} ubicado` });
      } else {
        setMensajeBusqueda({ tipo: 'warning', texto: `${fallecido.nombres} ${fallecido.apellidos} no tiene nicho asignado` });
      }
    } else {
      setMensajeBusqueda({ tipo: 'error', texto: 'No se encontró ningún fallecido con esa cédula' });
    }
    
    setCargando(false);
    setResultados([]);
    setTimeout(() => setMensajeBusqueda(null), 4000);
  };

  // --- HU-GEO-10: GENERAR REPORTE PDF DE OCUPACIÓN POR SECTOR Y BLOQUES SELECCIONADOS ---
  const generarReportePDF = async () => {
    if (!sectorSeleccionado || bloquesSeleccionados.length === 0) {
      alert('Seleccione un sector y al menos un bloque para generar el reporte.');
      return;
    }
    
    setGenerandoReporte(true);
    
    try {
      // Primero obtenemos el mapeo correcto de bloques desde GeoServer
      // El bloques_geom_id en nichos corresponde al ID de GeoServer (bloques_geom.XX -> XX)
      const bloquesParams = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typename: 'otavalo_cementerio:bloques_geom',
        outputFormat: 'application/json'
      });
      
      const respuestaBloques = await fetch(`http://localhost:8080/geoserver/otavalo_cementerio/ows?${bloquesParams.toString()}`);
      const datosBloques = await respuestaBloques.json();
      
      // Crear mapeo: codigo -> ID de GeoServer
      const mapeoBloquesGeoServer = {};
      datosBloques.features.forEach(f => {
        const codigo = f.properties.codigo;
        // El ID viene como "bloques_geom.29", extraemos el 29
        const geoserverId = parseInt(f.id.split('.')[1]);
        mapeoBloquesGeoServer[codigo] = geoserverId;
      });
      
      console.log('🗺️ Mapeo bloques GeoServer:', mapeoBloquesGeoServer);
      
      // CA2: Consultar datos de TODOS los bloques seleccionados
      let totalNichos = 0;
      let totalOcupados = 0;
      let totalDisponibles = 0;
      let totalReservados = 0;
      const detallesPorBloque = [];
      
      for (const codigoBloque of bloquesSeleccionados) {
        const bloqueInfo = bloques.find(b => b.codigo === codigoBloque);
        
        // Usar el ID de GeoServer (bloques_geom.XX -> XX)
        const geoServerId = mapeoBloquesGeoServer[codigoBloque];
        
        console.log('🔍 Buscando nichos para bloque:', codigoBloque, '- GeoServer ID:', geoServerId);
        
        if (!geoServerId) {
          console.warn(`⚠️ No se encontró ID de GeoServer para bloque ${codigoBloque}`);
          detallesPorBloque.push({
            codigo: codigoBloque,
            nombre: bloqueInfo?.nombre || codigoBloque,
            nichos: 0,
            ocupados: 0,
            disponibles: 0,
            reservados: 0
          });
          continue;
        }
        
        // Usar el ID de GeoServer como bloques_geom_id
        const params = new URLSearchParams({
          service: 'WFS',
          version: '1.0.0',
          request: 'GetFeature',
          typename: 'otavalo_cementerio:nichos_geom',
          outputFormat: 'application/json',
          CQL_FILTER: `bloques_geom_id=${geoServerId}`
        });
        
        const respuesta = await fetch(`http://localhost:8080/geoserver/otavalo_cementerio/ows?${params.toString()}`);
        const datos = await respuesta.json();
        
        const nichos = datos.features || [];
        console.log(`✅ Bloque ${codigoBloque} (GeoServer ID: ${geoServerId}): ${nichos.length} nichos encontrados`);
        
        const ocupados = nichos.filter(n => n.properties.estado?.toLowerCase() === 'ocupado').length;
        const disponibles = nichos.filter(n => n.properties.estado?.toLowerCase() === 'disponible').length;
        const reservados = nichos.length - ocupados - disponibles;
        
        totalNichos += nichos.length;
        totalOcupados += ocupados;
        totalDisponibles += disponibles;
        totalReservados += reservados;
        
        detallesPorBloque.push({
          codigo: codigoBloque,
          nombre: bloqueInfo?.nombre || codigoBloque,
          nichos: nichos.length,
          ocupados,
          disponibles,
          reservados
        });
      }
      
      // Calcular porcentajes totales
      const porcentajeOcupacion = totalNichos > 0 ? ((totalOcupados / totalNichos) * 100).toFixed(1) : 0;
      const porcentajeDisponible = totalNichos > 0 ? ((totalDisponibles / totalNichos) * 100).toFixed(1) : 0;
      const porcentajeReservado = totalNichos > 0 ? ((totalReservados / totalNichos) * 100).toFixed(1) : 0;
      
      // Generar PDF
      const doc = new jsPDF();
      const fechaActual = new Date().toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // ========== ENCABEZADO INSTITUCIONAL ==========
      // Línea superior decorativa azul
      doc.setFillColor(0, 123, 167); // Color azul similar al documento
      doc.rect(0, 0, 210, 3, 'F');
      
      // Logo a la izquierda
      try {
        doc.addImage(logo, 'PNG', 15, 8, 30, 30);
      } catch (e) {
        console.warn('No se pudo cargar el logo:', e);
      }
      
      // Nombre de la organización
      doc.setTextColor(0, 123, 167); // Azul institucional
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('UNORICO SAMASHUNCHIC', 120, 15, { align: 'center' });
      
      // Subtítulo
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('UNIÓN DE ORGANIZACIONES INDÍGENAS DEL CANTÓN OTAVALO', 120, 22, { align: 'center' });
      
      // Acuerdo ministerial
      doc.setFontSize(8);
      doc.text('Acuerdo Ministerial No. 0239 de 22 de noviembre de 2001', 120, 28, { align: 'center' });
      
      // Línea separadora
      doc.setDrawColor(0, 123, 167);
      doc.setLineWidth(0.5);
      doc.line(15, 42, 195, 42);
      
      // Título del reporte
      doc.setTextColor(139, 69, 19); // Marrón/café
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE OCUPACIÓN POR SECTOR Y BLOQUES', 105, 52, { align: 'center' });
      
      // Subtítulo del reporte
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Centro Sagrado Ancestral o Cementerio Indígena de Otavalo', 105, 59, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text(`Generado: ${fechaActual}`, 105, 65, { align: 'center' });
      
      // Información del Sector
      doc.setFillColor(248, 250, 252);
      doc.rect(20, 72, 170, 18, 'F');
      doc.setDrawColor(0, 123, 167);
      doc.setLineWidth(0.5);
      doc.rect(20, 72, 170, 18, 'S');
      
      doc.setTextColor(0, 123, 167);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTOR:', 25, 83);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text(sectorSeleccionado, 55, 83);
      
      // Bloques seleccionados
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const nombresBloques = detallesPorBloque.map(b => b.nombre).join(', ');
      doc.text(`Bloques seleccionados: ${nombresBloques}`, 20, 97);
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 102, 190, 102);
      
      // Resumen Total
      doc.setTextColor(139, 69, 19); // Marrón
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN TOTAL DEL SECTOR', 20, 112);
      
      // Tabla resumen
      let startY = 118;
      const rowHeight = 10;
      
      // Headers
      doc.setFillColor(55, 65, 81); // Gris oscuro profesional
      doc.rect(20, startY, 170, rowHeight, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Estado', 25, startY + 7);
      doc.text('Cantidad', 95, startY + 7);
      doc.text('Porcentaje', 145, startY + 7);
      
      // Filas con colores profesionales alternados
      doc.setFont('helvetica', 'normal');
      
      // Ocupados - fila clara
      doc.setFillColor(249, 250, 251); // Gris muy claro
      doc.rect(20, startY + rowHeight, 170, rowHeight, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text('Ocupados (Difuntos)', 25, startY + rowHeight + 7);
      doc.text(totalOcupados.toString(), 95, startY + rowHeight + 7);
      doc.text(`${porcentajeOcupacion}%`, 145, startY + rowHeight + 7);
      
      // Disponibles - fila blanca
      doc.setFillColor(255, 255, 255);
      doc.rect(20, startY + rowHeight * 2, 170, rowHeight, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text('Disponibles', 25, startY + rowHeight * 2 + 7);
      doc.text(totalDisponibles.toString(), 95, startY + rowHeight * 2 + 7);
      doc.text(`${porcentajeDisponible}%`, 145, startY + rowHeight * 2 + 7);
      
      // Reservados - fila clara
      doc.setFillColor(249, 250, 251);
      doc.rect(20, startY + rowHeight * 3, 170, rowHeight, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text('Reservados', 25, startY + rowHeight * 3 + 7);
      doc.text(totalReservados.toString(), 95, startY + rowHeight * 3 + 7);
      doc.text(`${porcentajeReservado}%`, 145, startY + rowHeight * 3 + 7);
      
      // Total - fila destacada
      doc.setFillColor(55, 65, 81); // Gris oscuro
      doc.rect(20, startY + rowHeight * 4, 170, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 25, startY + rowHeight * 4 + 7);
      doc.text(totalNichos.toString(), 95, startY + rowHeight * 4 + 7);
      doc.text('100%', 145, startY + rowHeight * 4 + 7);
      
      // Bordes de la tabla
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.rect(20, startY, 170, rowHeight * 5, 'S');
      
      // Resumen destacado - más profesional
      doc.setFillColor(243, 244, 246); // Gris claro
      doc.rect(20, startY + rowHeight * 5 + 8, 170, 15, 'F');
      doc.setDrawColor(55, 65, 81);
      doc.setLineWidth(0.5);
      doc.rect(20, startY + rowHeight * 5 + 8, 170, 15, 'S');
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL DE DIFUNTOS EN ${sectorSeleccionado}: ${totalOcupados}`, 105, startY + rowHeight * 5 + 18, { align: 'center' });
      
      // Detalle por bloque
      startY = startY + rowHeight * 7 + 10;
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle por Bloque', 20, startY);
      
      startY += 8;
      
      // Headers detalle
      doc.setFillColor(240, 240, 240);
      doc.rect(20, startY, 170, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Bloque', 25, startY + 6);
      doc.text('Nichos', 70, startY + 6);
      doc.text('Ocupados', 95, startY + 6);
      doc.text('Disponibles', 125, startY + 6);
      doc.text('Reservados', 160, startY + 6);
      
      // Filas detalle
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      detallesPorBloque.forEach((bloque, index) => {
        const y = startY + 8 + (index * 8);
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(20, y, 170, 8, 'F');
        }
        doc.text(bloque.nombre, 25, y + 6);
        doc.text(bloque.nichos.toString(), 70, y + 6);
        doc.text(bloque.ocupados.toString(), 95, y + 6);
        doc.text(bloque.disponibles.toString(), 125, y + 6);
        doc.text(bloque.reservados.toString(), 160, y + 6);
      });
      
      // ========== PIE DE PÁGINA INSTITUCIONAL ==========
      // Línea decorativa curva (simulada con línea diagonal suave)
      doc.setDrawColor(200, 180, 200); // Color rosa/lila suave
      doc.setLineWidth(1);
      // Simulamos una curva con varias líneas
      doc.line(10, 275, 60, 272);
      doc.line(60, 272, 100, 274);
      doc.line(100, 274, 130, 271);
      
      // Información de contacto alineada a la derecha
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Dirección:', 115, 276);
      doc.setFont('helvetica', 'normal');
      doc.text('San Blas. Panamericana Sur y Atahualpa', 195, 276, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.text('Teléfono:', 144, 281);
      doc.setFont('helvetica', 'normal');
      doc.text('06 2 927 - 663', 195, 281, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 128, 286);
      doc.setFont('helvetica', 'normal');
      doc.text('unoricosamashunchic@gmail.com', 195, 286, { align: 'right' });
      
      doc.setTextColor(0, 123, 167);
      doc.setFont('helvetica', 'normal');
      doc.text('Otavalo - Ecuador', 195, 291, { align: 'right' });
      
      // Línea inferior decorativa rosa/lila
      doc.setDrawColor(200, 180, 200);
      doc.setLineWidth(2);
      doc.line(150, 294, 210, 294);
      
      // Guardar PDF
      const nombreSector = sectorSeleccionado.replace(/\s+/g, '_');
      doc.save(`Reporte_${nombreSector}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte. Verifique la conexión con GeoServer.');
    }
    
    setGenerandoReporte(false);
  };

  return (
    <div style={{ 
      width: '380px', 
      height: '100vh', 
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
      borderRight: 'none',
      display: 'flex', 
      flexDirection: 'column', 
      boxShadow: '4px 0 25px rgba(0,0,0,0.1)', 
      zIndex: 20,
      animation: 'slideIn 0.5s ease-out'
    }}>
      
      {/* HEADER CON GRADIENTE */}
      <div style={{ 
        padding: '25px', 
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decoración de fondo */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(30px)'
        }} />
        
        <h2 style={{ 
          margin: 0, 
          fontSize: '22px', 
          fontWeight: '700',
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          position: 'relative',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'float 3s ease-in-out infinite',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <img 
              src={logo} 
              alt="Logo" 
              style={{ 
                width: '40px', 
                height: '40px', 
                objectFit: 'contain' 
              }} 
            />
          </div>
          Organización UNORICO SAMASHUNCHIK
        </h2>
        <p style={{ 
          margin: '10px 0 0 0', 
          fontSize: '13px', 
          opacity: 0.9,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          position: 'relative'
        }}>
          <MapPin size={14} />
          Otavalo - Ecuador
        </p>
      </div>

      <div style={{ padding: '25px', flex: 1, overflowY: 'auto' }}>
        
        {/* SECCIÓN 1: BUSCADOR */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ 
            fontSize: '13px', 
            color: '#6366f1', 
            textTransform: 'uppercase', 
            marginBottom: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            <Search size={16} /> Búsqueda
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ingrese cédula"
                value={busqueda}
                onChange={(e) => {
                  // Solo permitir números
                  const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                  e.target.value = soloNumeros;
                  manejarBusqueda(e);
                }}
                onKeyPress={(e) => {
                  // Prevenir letras al escribir
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                  // Enter para ubicar
                  if (e.key === 'Enter' && busqueda.length >= 3) {
                    ubicarFallecido();
                  }
                }}
                maxLength={10}
                style={{ 
                  width: '100%', 
                  padding: '12px 12px 12px 40px', 
                  borderRadius: '10px', 
                  border: '2px solid #e2e8f0', 
                  fontSize: '14px', 
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8b5cf6';
                  e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                }}
              />
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
            </div>
            
            {/* Botón Ubicar */}
            <button
              onClick={ubicarFallecido}
              disabled={cargando || busqueda.length < 3}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: busqueda.length >= 3 
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                  : '#e2e8f0',
                color: busqueda.length >= 3 ? 'white' : '#9ca3af',
                fontSize: '13px',
                fontWeight: '600',
                cursor: busqueda.length >= 3 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                boxShadow: busqueda.length >= 3 ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <Navigation size={16} />
              Ubicar
            </button>
          </div>
          
          {/* Indicador de carga */}
          {cargando && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '8px',
              height: '60px'
            }} />
          )}
          
          {/* Mensaje de búsqueda (éxito/error/warning) */}
          {mensajeBusqueda && (
            <div style={{
              marginTop: '15px',
              padding: '12px 15px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: '500',
              animation: 'fadeIn 0.3s ease-out',
              background: mensajeBusqueda.tipo === 'error' 
                ? 'linear-gradient(135deg, #fef2f2, #fee2e2)' 
                : mensajeBusqueda.tipo === 'warning'
                ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
                : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              color: mensajeBusqueda.tipo === 'error' 
                ? '#dc2626' 
                : mensajeBusqueda.tipo === 'warning'
                ? '#d97706'
                : '#16a34a',
              border: mensajeBusqueda.tipo === 'error'
                ? '1px solid #fecaca'
                : mensajeBusqueda.tipo === 'warning'
                ? '1px solid #fde68a'
                : '1px solid #bbf7d0'
            }}>
              <span style={{ fontSize: '16px' }}>
                {mensajeBusqueda.tipo === 'error' ? '❌' : mensajeBusqueda.tipo === 'warning' ? '⚠️' : '✅'}
              </span>
              {mensajeBusqueda.texto}
            </div>
          )}
          
          {/* Resultados de búsqueda */}
          {resultados.length > 0 && (
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              marginTop: '15px', 
              border: 'none',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {resultados.map((item, index) => (
                <li 
                  key={item.id}
                  onClick={() => seleccionarResultado(item)}
                  style={{ 
                    padding: '15px', 
                    borderBottom: index === resultados.length - 1 ? 'none' : '1px solid #f1f5f9', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #f8fafc, #eef2ff)';
                    e.currentTarget.style.paddingLeft = '20px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.paddingLeft = '15px';
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{item.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🪪 {item.cedula}</span>
                    <span style={{ 
                      background: item.codigo 
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                        : 'linear-gradient(135deg, #9ca3af, #6b7280)', 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '20px',
                      fontWeight: '600',
                      fontSize: '10px'
                    }}>
                      {item.codigo || 'Sin nicho'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SECCIÓN 2: FILTRO POR BLOQUE (HU-GEO-07) */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            fontSize: '13px', 
            color: '#6366f1', 
            textTransform: 'uppercase', 
            marginBottom: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            <Grid3X3 size={16} /> Filtrar por Bloque
          </h3>
          <select
            value={bloqueActual}
            onChange={(e) => {
              const codigo = e.target.value;
              setBloqueActual(codigo);
              if (codigo) {
                const bloque = bloques.find(b => b.codigo === codigo);
                alSeleccionarBloque({ codigo, nombre: bloque?.nombre || codigo });
              } else {
                alSeleccionarBloque(null);
              }
            }}
            style={{
              width: '100%',
              padding: '12px 15px',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: bloqueActual ? '#1e293b' : '#9ca3af'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="" style={{ color: '#000000' }}>-- Seleccione un bloque --</option>
            {bloques.map(bloque => (
              <option key={bloque.codigo} value={bloque.codigo} style={{ color: '#000000' }}>
                {bloque.nombre} ({bloque.codigo})
              </option>
            ))}
          </select>
          
          {bloqueActual && (
            <button
              onClick={() => {
                setBloqueActual('');
                alSeleccionarBloque(null);
              }}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              ✕ Quitar filtro de bloque
            </button>
          )}
        </div>

        {/* SECCIÓN 3: REPORTE POR SECTOR (HU-GEO-10) */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            fontSize: '13px', 
            color: '#6366f1', 
            textTransform: 'uppercase', 
            marginBottom: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            <FileText size={16} /> Reporte por Sector
          </h3>
          
          {/* CA1: Selector de Sector */}
          <select
            value={sectorSeleccionado}
            onChange={(e) => setSectorSeleccionado(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: sectorSeleccionado ? '#1e293b' : '#9ca3af',
              marginBottom: '10px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="" style={{ color: '#000000' }}>-- Seleccione un sector --</option>
            {sectores.map(sector => (
              <option key={sector} value={sector} style={{ color: '#000000' }}>{sector}</option>
            ))}
          </select>
          
          {/* CA1: Lista de bloques del sector con checkboxes */}
          {sectorSeleccionado && bloquesDelSector.length > 0 && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '10px',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Bloques del sector ({bloquesDelSector.length})</span>
                <button
                  onClick={() => {
                    if (bloquesSeleccionados.length === bloquesDelSector.length) {
                      setBloquesSeleccionados([]);
                    } else {
                      setBloquesSeleccionados(bloquesDelSector.map(b => b.codigo));
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {bloquesSeleccionados.length === bloquesDelSector.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              
              {bloquesDelSector.map(bloque => (
                <label 
                  key={bloque.codigo}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: bloquesSeleccionados.includes(bloque.codigo) ? '#eef2ff' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bloquesSeleccionados.includes(bloque.codigo)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBloquesSeleccionados([...bloquesSeleccionados, bloque.codigo]);
                      } else {
                        setBloquesSeleccionados(bloquesSeleccionados.filter(c => c !== bloque.codigo));
                      }
                    }}
                    style={{ accentColor: '#6366f1' }}
                  />
                  <span style={{ fontSize: '13px', color: '#334155' }}>
                    {bloque.nombre} <span style={{ color: '#94a3b8' }}>({bloque.codigo})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          
          {/* Contador de seleccionados */}
          {bloquesSeleccionados.length > 0 && (
            <div style={{
              fontSize: '12px',
              color: '#6366f1',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              ✓ {bloquesSeleccionados.length} bloque(s) seleccionado(s)
            </div>
          )}
          
          {/* Botón Generar Reporte */}
          <button
            onClick={generarReportePDF}
            disabled={generandoReporte || !sectorSeleccionado || bloquesSeleccionados.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: (!sectorSeleccionado || bloquesSeleccionados.length === 0)
                ? '#e2e8f0'
                : generandoReporte 
                  ? '#94a3b8' 
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: (!sectorSeleccionado || bloquesSeleccionados.length === 0) ? '#9ca3af' : 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: (!sectorSeleccionado || bloquesSeleccionados.length === 0) ? 'not-allowed' : generandoReporte ? 'wait' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: (sectorSeleccionado && bloquesSeleccionados.length > 0) ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (sectorSeleccionado && bloquesSeleccionados.length > 0 && !generandoReporte) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FileText size={16} />
            {generandoReporte ? 'Generando...' : 'Generar Reporte PDF'}
          </button>
        </div>

        {/* SECCIÓN 4: LEYENDA DE ESTADOS (HU-GEO-03) */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            fontSize: '13px', 
            color: '#6366f1', 
            textTransform: 'uppercase', 
            marginBottom: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            <Info size={16} /> Simbología de Estados
          </h3>
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Libre - Verde */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.4)'
              }} />
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Libre / Disponible</span>
            </div>
            {/* Ocupado - Rojo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }} />
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Ocupado</span>
            </div>
            {/* Reservado - Amarillo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                boxShadow: '0 2px 6px rgba(234, 179, 8, 0.4)'
              }} />
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Reservado</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: CAPAS */}
        <div>
          <h3 style={{ 
            fontSize: '13px', 
            color: '#6366f1', 
            textTransform: 'uppercase', 
            marginBottom: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            <Layers size={16} /> Capas del Mapa
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {capasConfig.map((capa, index) => {
              // Colores específicos para cada capa (según simbología de GeoServer)
              const coloresCapa = {
                'cementerio_general': { 
                  fondo: '#E8F5E9',  // Verde menta pálido
                  borde: '#2E7D32',  // Verde bosque
                  sombra: 'rgba(46, 125, 50, 0.3)' 
                },
                'infraestructura': { 
                  fondo: '#CFD8DC',  // Gris azulado suave
                  borde: '#78909C',  // Gris azulado oscuro
                  sombra: 'rgba(120, 144, 156, 0.3)' 
                },
                'bloques_geom': { 
                  fondo: '#FFF3E0',  // Crema/arena suave
                  borde: '#F57C00',  // Naranja terracota
                  sombra: 'rgba(245, 124, 0, 0.3)' 
                },
                'nichos_geom': { 
                  fondo: '#FFFFFF',  // Blanco puro
                  borde: '#BBBBBB',  // Gris suave
                  sombra: 'rgba(0, 0, 0, 0.1)' 
                }
              };
              const colorCapa = coloresCapa[capa.id] || { fondo: '#f3f4f6', borde: '#6366f1', sombra: 'rgba(99, 102, 241, 0.4)' };
              
              return (
              <div 
                key={capa.id}
                onClick={() => toggleCapa(capa.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  color: '#334155',
                  padding: '12px 15px',
                  borderRadius: '10px',
                  background: capasVisibles[capa.id] ? 'linear-gradient(90deg, #eef2ff, #faf5ff)' : '#f8fafc',
                  border: capasVisibles[capa.id] ? '2px solid #c4b5fd' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(5px)';
                  if (!capasVisibles[capa.id]) {
                    e.currentTarget.style.background = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  if (!capasVisibles[capa.id]) {
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: colorCapa.fondo,
                    border: `3px solid ${colorCapa.borde}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 2px 8px ${colorCapa.sombra}`
                  }}
                >
                  {capasVisibles[capa.id] ? <Eye size={14} color={colorCapa.borde} /> : <EyeOff size={14} color={colorCapa.borde} />}
                </div>
                <span style={{ fontWeight: '500' }}>{capa.nombre}</span>
              </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FOOTER CON ESTILO */}
      <div style={{ 
        padding: '20px', 
        borderTop: '1px solid #e2e8f0', 
        fontSize: '11px', 
        color: '#64748b', 
        textAlign: 'center',
        background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '5px' }}>
          <Sparkles size={12} color="#8b5cf6" />
          <span style={{ fontWeight: '500' }}>Universidad Técnica del Norte</span>
          <Sparkles size={12} color="#8b5cf6" />
        </div>
        <span style={{ opacity: 0.7 }}>© 2026 - Todos los derechos reservados</span>
      </div>
    </div>
  );
};

export default Sidebar;
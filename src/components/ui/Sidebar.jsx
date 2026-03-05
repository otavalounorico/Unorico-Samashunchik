import React, { useState, useEffect, useRef } from 'react';
import { Search, Layers, Map as MapIcon, Eye, EyeOff, Sparkles, MapPin, Info, Navigation, Grid3X3, FileText, CheckCircle, AlertTriangle, AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '../../api/supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo.png';
import encabezadoImg from '../../assets/encabezado.png';
import piedepaginaImg from '../../assets/piepagina.png';
import './Sidebar.css';

const Sidebar = ({
  alBuscar,
  alCambiarCapas,
  alSeleccionarBloque,
  alSeleccionarSector, // Nuevo prop
  capasConfig = [],
  className = '',
  estadosSeleccionados = [],
  alCambiarEstados,
  alActualizarPopupExterno
}) => {
  // --- ESTADOS ---
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [bloques, setBloques] = useState([]);
  const [bloqueActual, setBloqueActual] = useState('');
  const [sectorFiltro, setSectorFiltro] = useState(''); // Estado para filtro de mapa
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [tipoBusqueda, setTipoBusqueda] = useState('');
  const buscarFallecidos = tipoBusqueda === 'difuntos';
  const buscarSocios = tipoBusqueda === 'socios';

  const [sectores, setSectores] = useState([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState('');
  const [bloquesDelSector, setBloquesDelSector] = useState([]);
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);
  const [dropdownBloqueOpen, setDropdownBloqueOpen] = useState(false);
  const bloqueDropdownRef = useRef(null);

  const [dropdownSectorFiltroOpen, setDropdownSectorFiltroOpen] = useState(false);
  const sectorFiltroRef = useRef(null);

  const [dropdownSectorReporteOpen, setDropdownSectorReporteOpen] = useState(false);
  const sectorReporteRef = useRef(null);

  const [capasVisibles, setCapasVisibles] = useState({
    'cementerio_general': true,
    'infraestructura': true,
    'bloques_geom': true,
    'nichos_geom': true
  });

  const [mensajeBusqueda, setMensajeBusqueda] = useState(null);

  // Cerrar dropdown de bloques al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bloqueDropdownRef.current && !bloqueDropdownRef.current.contains(e.target)) {
        setDropdownBloqueOpen(false);
      }
      if (sectorFiltroRef.current && !sectorFiltroRef.current.contains(e.target)) {
        setDropdownSectorFiltroOpen(false);
      }
      if (sectorReporteRef.current && !sectorReporteRef.current.contains(e.target)) {
        setDropdownSectorReporteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- LÓGICA DE SIMBOLOGÍA (COLORES) ---
  // --- LÓGICA DE SIMBOLOGÍA (COLORES) ---
  const toggleEstado = (valor) => {
    // Grupo Superior: Ocupado / Disponible. Exclusivo entre ellos.
    const grupoTop = ['Ocupado', 'Disponible'];

    // 1. Quitar otros del mismo grupo top (Exclusividad Top)
    let nuevos = estadosSeleccionados.filter(e => !grupoTop.includes(e));

    // 2. Lógica de selección
    if (!estadosSeleccionados.includes(valor)) {
      // --- SELECCIONAR (Toggle ON) ---
      nuevos.push(valor);

      if (valor === 'Disponible') {
        // Si selecciono LIBRE, limpio cualquier filtro de estado físico
        // "Cuando haga click en libre ya debe de mostrarme los nichos libres los filtros de abajo no tiene nada que ver"
        nuevos = nuevos.filter(e => !['Estado_Bueno', 'Estado_Malo', 'Mantenimiento'].includes(e));
      } else if (valor === 'Ocupado') {
        // Si selecciono OCUPADO, por defecto no seleccionamos ningún estado físico específico
        // o mantenemos los que estaban? (El usuario dice "permita seleccionar los 3")
        // Al NO filtrar 'Estado_Bueno' etc, permitimos que si estaban seleccionados, sigan (aunque abajo reseteamos si era Disponible)
        // Pero como venimos de un estado donde quizás estaba 'Disponible', los limpiamos por seguridad para empezar limpio?
        // Mejor dejar limpio para que el usuario elija. O si ya había uno seleccionado, se mantiene?
        // En la lógica anterior 'nuevos' ya filtra grupoTop, pero preserva los físicos.
        // Si estaba en 'Disponible', no tenía físicos (por la regla de abajo).
        // Si estaba en 'Ocupado' y re-clickeo, es deselección.
        // Así que aquí es cambio directo de Disponible -> Ocupado:
        // 'nuevos' trae los físicos anteriores? Si venía de Disponible, no debería tener.
      }

    } else {
      // --- DESELECCIONAR (Toggle OFF) ---
      // Si quito el check, limpio también los dependientes si es Ocupado?
      // O solo quito el Top?
      // "Si selecciono ocupado me permita seleccionar los 3". Si quito ocupado, deberían quitarse los 3?
      // Generalmente sí, para no quedar con "Malas condiciones" pero sin "Ocupado".
      if (valor === 'Ocupado') {
        nuevos = nuevos.filter(e => !['Estado_Bueno', 'Estado_Malo', 'Mantenimiento', 'Abandonado'].includes(e));
      }
      // Si quito Disponible, no hay dependientes que limpiar.
    }
    alCambiarEstados(nuevos);
  };

  const toggleEstadoFisico = (valor) => {
    // Grupo Inferior: Estado_Bueno / Estado_Malo / Mantenimiento / Abandonado. Exclusivo entre ellos.
    const grupoFisico = ['Estado_Bueno', 'Estado_Malo', 'Mantenimiento', 'Abandonado'];

    // 1. Quitar otros del grupo fisico (EXCLUSIVIDAD - "solo uno a la vez")
    let nuevos = estadosSeleccionados.filter(e => !grupoFisico.includes(e));

    // 2. Toggle ON/OFF
    if (!estadosSeleccionados.includes(valor)) {
      nuevos.push(valor);

      // 3. Implicaciones hacia arriba
      // Si selecciono cualquier estado físico, DEBE estar seleccionado 'Ocupado'.
      // Y NO debe estar 'Disponible'.
      if (!nuevos.includes('Ocupado')) {
        nuevos.push('Ocupado');
      }
      nuevos = nuevos.filter(e => e !== 'Disponible');
    }
    // Si deselecciono (Toggle OFF), simplemente se quita (ya lo hizo el filter inicial + no push).
    // ¿Debemos quitar 'Ocupado'? No necesariamente, el usuario puede querer ver "Todos los ocupados" sin filtro específico.

    alCambiarEstados(nuevos);
  };

  // --- CARGAR DATOS INICIALES (BLOQUES) ---
  useEffect(() => {
    const cargarBloques = async () => {
      try {
        const { data: bloquesDB, error } = await supabase
          .from('bloques_geom')
          .select('id, codigo, nombre, sector')
          .order('codigo');

        if (error) {
          console.error('Error cargando bloques:', error);
          return;
        }

        const listaBloques = bloquesDB.map(b => ({
          id: b.id,
          codigo: b.codigo,
          nombre: b.nombre || b.codigo,
          sector: b.sector
        }));

        // DEDUPLICACIÓN: Filtrar bloques repetidos por (sector + codigo)
        const vistos = new Set();
        const listaBloquesUnicos = [];

        listaBloques.forEach(b => {
          const clave = `${b.sector}-${b.codigo}`;
          if (!vistos.has(clave)) {
            vistos.add(clave);
            listaBloquesUnicos.push(b);
          }
        });

        setBloques(listaBloquesUnicos);

        const sectoresUnicos = [...new Set(listaBloques.map(b => b.sector).filter(Boolean))].sort();
        setSectores(sectoresUnicos);
      } catch (error) {
        console.error(error);
      }
    };
    cargarBloques();
  }, []);

  // Filtrar bloques cuando cambia el sector
  useEffect(() => {
    if (sectorSeleccionado) {
      const bloquesFiltrados = bloques
        .filter(b => b.sector === sectorSeleccionado)
        .filter(b => !b.nombre?.toLowerCase().includes('espacio verde') && !b.codigo?.toUpperCase().startsWith('EV'))
        // Excluir Bloque 04 explícitamente
        .filter(b => b.nombre !== 'Bloque 04' && b.codigo !== 'B-20');
      setBloquesDelSector(bloquesFiltrados);
      setBloquesSeleccionados([]);
    } else {
      setBloquesDelSector([]);
      setBloquesSeleccionados([]);
    }
  }, [sectorSeleccionado, bloques]);

  // Escuchar eventos externos de deselección (por ejemplo desde el mapa)
  useEffect(() => {
    const handler = () => {
      setBloqueActual('');
      setSectorFiltro('');
    };
    window.addEventListener('deseleccionarBloque', handler);
    return () => window.removeEventListener('deseleccionarBloque', handler);
  }, []);

  // --- FUNCIONES DEL BUSCADOR ---
  const manejarBusqueda = async (e) => {
    const texto = e.target.value;
    setBusqueda(texto);
    setMensajeBusqueda(null);

    if (texto.length < 3) {
      setResultados([]);
      return;
    }

    setCargando(true);

    const terminos = texto.split(' ').filter(t => t.trim().length > 0);

    let queryFallecidos = supabase
      .from('fallecidos')
      .select(`id, nombres, apellidos, cedula, fallecido_nicho ( nichos ( codigo ), socios ( nombres, apellidos ) )`);

    let querySocios = supabase
      .from('socios')
      .select(`id, nombres, apellidos, cedula, socio_nicho ( nichos ( codigo, fallecido_nicho ( fallecidos ( nombres, apellidos ) ) ) ), nichos ( codigo, fallecido_nicho ( fallecidos ( nombres, apellidos ) ) )`);

    terminos.forEach(term => {
      const filtro = `nombres.ilike.%${term}%,apellidos.ilike.%${term}%,cedula.ilike.%${term}%`;
      queryFallecidos = queryFallecidos.or(filtro);
      querySocios = querySocios.or(filtro);
    });

    const [resFallecidos, resSocios] = await Promise.all([
      buscarFallecidos ? queryFallecidos.limit(5) : Promise.resolve({ data: [], error: null }),
      buscarSocios ? querySocios.limit(5) : Promise.resolve({ data: [], error: null })
    ]);

    const hitsFallecidos = (resFallecidos.data || []).flatMap(d => {
      const nichos = d.fallecido_nicho || [];
      if (nichos.length === 0) return [{
        id: `F-${d.id}`,
        tipo: 'Difunto',
        nombre: `${d.nombres} ${d.apellidos}`,
        cedula: d.cedula,
        codigo: null,
        responsable: 'No asignado'
      }];
      return nichos.map((n, i) => {
        const nombreResponsable = n.socios ? `${n.socios.nombres} ${n.socios.apellidos}` : 'Sin responsable';
        const codigoNicho = n.nichos?.codigo || '?';
        return {
          id: `F-${d.id}-${i}`,
          tipo: 'Difunto',
          nombre: `${d.nombres} ${d.apellidos}`,
          cedula: d.cedula,
          codigo: codigoNicho,
          responsable: nombreResponsable,
          nicho: codigoNicho
        };
      });
    });

    const hitsSocios = (resSocios.data || []).flatMap(d => {
      const nichosDirectos = (d.nichos || []).map(n => ({ nichos: n }));
      const nichosIntermedios = d.socio_nicho || [];
      const nichosArr = [...nichosDirectos, ...nichosIntermedios];

      // Eliminar duplicados si el nicho sale en los dos lados (basado en el código)
      const codigosVistos = new Set();
      const nichos = nichosArr.filter(n => {
        const cod = n.nichos?.codigo;
        if (!cod) return false;
        if (codigosVistos.has(cod)) return false;
        codigosVistos.add(cod);
        return true;
      });

      if (nichos.length === 0) return [{
        id: `S-${d.id}`, tipo: 'Socio', nombre: `${d.nombres} ${d.apellidos}`, cedula: d.cedula, codigo: null
      }];
      return nichos.map((n, i) => {
        // Armar lista estructurada de difuntos para el popup
        const difuntosLista = (n.nichos?.fallecido_nicho || []).map(fn =>
          fn.fallecidos ? {
            nombre: `${fn.fallecidos.nombres} ${fn.fallecidos.apellidos}`,
            responsable: `${d.nombres} ${d.apellidos}`
          } : null
        ).filter(Boolean);

        return {
          id: `S-${d.id}-${i}`,
          tipo: 'Socio',
          nombre: `${d.nombres} ${d.apellidos}`,
          cedula: d.cedula,
          codigo: n.nichos?.codigo,
          responsable: `${d.nombres} ${d.apellidos}`,
          difuntosLista
        };
      });
    });

    // Concatenar resultados (ya son exclusivos por los checkboxes o se suman si la lógica cambia)
    // No deduplicamos por cédula para permitir ver múltiples nichos del mismo socio
    const combinados = [...hitsFallecidos, ...hitsSocios].slice(0, 7);
    setResultados(combinados);
    setCargando(false);

    if (combinados.length === 0 && texto.length >= 3) {
      setMensajeBusqueda({ tipo: 'error', texto: 'No se encontraron registros.' });
      setTimeout(() => setMensajeBusqueda(null), 3000);
    }
  };

  const seleccionarResultado = (item) => {
    if (item.codigo) {
      // Pasar datos pre-fetched al popup directamente
      if (alActualizarPopupExterno) {
        let difuntos = [];
        if (item.tipo === 'Difunto') {
          difuntos = [{ nombre: item.nombre, responsable: item.responsable || 'N/A' }];
        } else if (item.tipo === 'Socio') {
          // Para socios: usar difuntosLista estructurada, con el socio como responsable
          difuntos = (item.difuntosLista || []);
        }
        alActualizarPopupExterno({ codigo: item.codigo, difuntos, _prefetched: true });
      }
      alBuscar(item.codigo);
    } else {
      setMensajeBusqueda({ tipo: 'warning', texto: `${item.tipo} sin nicho asignado` });
      setTimeout(() => setMensajeBusqueda(null), 3000);
    }
    setResultados([]);
    setBusqueda('');
  };

  const ubicarFallecido = async () => {
    if (busqueda.length < 3) return;
    setCargando(true);
    setMensajeBusqueda(null);

    const [resFExacta, resSExacta] = await Promise.all([
      buscarFallecidos ? supabase.from('fallecidos').select(`id, fallecido_nicho ( nichos ( codigo ) )`).eq('cedula', busqueda).maybeSingle() : Promise.resolve({ data: null, error: null }),
      buscarSocios ? supabase.from('socios').select(`id, socio_nicho ( nichos ( codigo ) ), nichos ( codigo )`).eq('cedula', busqueda).maybeSingle() : Promise.resolve({ data: null, error: null })
    ]);

    // Verificamos si hay múltiples nichos para la coincidencia exacta
    if (resFExacta.data) {
      const nichos = resFExacta.data.fallecido_nicho || [];
      if (nichos.length === 1 && nichos[0].nichos?.codigo) {
        navegarANicho(nichos[0].nichos.codigo); return;
      } else if (nichos.length > 1) {
        setMensajeBusqueda({ tipo: 'warning', texto: 'Difunto con múltiples nichos. Seleccione de la lista.' });
        // Dejar pasar para que se llene la lista abajo
      }
    }

    if (resSExacta.data) {
      const nichosDirectos = (resSExacta.data.nichos || []).map(n => ({ nichos: n }));
      const nichosIntermedios = resSExacta.data.socio_nicho || [];
      const nichosArr = [...nichosDirectos, ...nichosIntermedios];

      const codigosVistos = new Set();
      const nichos = nichosArr.filter(n => {
        const cod = n.nichos?.codigo;
        if (!cod || codigosVistos.has(cod)) return false;
        codigosVistos.add(cod);
        return true;
      });
      if (nichos.length === 1 && nichos[0].nichos?.codigo) {
        navegarANicho(nichos[0].nichos.codigo); return;
      } else if (nichos.length > 1) {
        setMensajeBusqueda({ tipo: 'warning', texto: 'Socio con múltiples nichos. Seleccione de la lista.' });
        // Dejar pasar para que se llene la lista abajo
      }
    }

    const terminos = busqueda.split(' ').filter(t => t.trim().length > 0);
    let qF = supabase.from('fallecidos').select(`id, nombres, apellidos, fallecido_nicho ( nichos ( codigo ), socios ( nombres, apellidos ) )`);
    let qS = supabase.from('socios').select(`id, nombres, apellidos, socio_nicho ( nichos ( codigo ) ), nichos ( codigo )`);

    terminos.forEach(term => {
      const filtro = `nombres.ilike.%${term}%,apellidos.ilike.%${term}%,cedula.ilike.%${term}%`;
      qF = qF.or(filtro);
      qS = qS.or(filtro);
    });

    const [rf, rs] = await Promise.all([
      buscarFallecidos ? qF.limit(5) : Promise.resolve({ data: [], error: null }),
      buscarSocios ? qS.limit(5) : Promise.resolve({ data: [], error: null })
    ]);

    const validosF = (rf.data || []).filter(d => d.fallecido_nicho?.length > 0);
    const validosS = (rs.data || []).filter(d => (d.socio_nicho?.length > 0 || d.nichos?.length > 0));
    const totalEncontrados = validosF.length + validosS.length;

    if (totalEncontrados === 1) {
      const unico = validosF[0] || validosS[0];
      const nichoArr = unico.fallecido_nicho || unico.socio_nicho || (unico.nichos ? unico.nichos.map(n => ({ nichos: n })) : []);
      navegarANicho(nichoArr[0].nichos.codigo);
    } else if (totalEncontrados > 1) {
      setMensajeBusqueda({ tipo: 'warning', texto: 'Múltiples resultados. Seleccione de la lista.' });
      setTimeout(() => setMensajeBusqueda(null), 4000);
    } else {
      setMensajeBusqueda({ tipo: 'error', texto: 'No se encontraron registros.' });
      setTimeout(() => setMensajeBusqueda(null), 3000);
    }
    setCargando(false);
  };

  const navegarANicho = (codigo) => {
    alBuscar(codigo);
    setCargando(false);
    setResultados([]);
    setBusqueda('');
    setMensajeBusqueda(null);
  };

  const toggleCapa = (idCapa) => {
    const nuevoEstado = { ...capasVisibles, [idCapa]: !capasVisibles[idCapa] };
    setCapasVisibles(nuevoEstado);
    alCambiarCapas(nuevoEstado);
  };

  const generarReportePDF = async () => {
    if (!sectorSeleccionado || bloquesSeleccionados.length === 0) {
      alert('Seleccione un sector y al menos un bloque.');
      return;
    }

    setGenerandoReporte(true);

    try {
      let tNichos = 0, tBueno = 0, tMalo = 0, tMantenimiento = 0, tAbandonado = 0, tDisponibles = 0;
      const detalles = [];

      for (const cod of bloquesSeleccionados) {
        let feats = [];
        // Buscamos datos del bloque en el estado local (que viene de bloques_geom)
        const bloqueGeomItem = bloques.find(b => b.codigo === cod);
        const bgId = bloqueGeomItem?.id;
        let nombreBloque = bloqueGeomItem?.nombre || cod;

        // FILTRO: Ocultar Espacio Verde del reporte (no tiene nichos)
        if (nombreBloque.toLowerCase().includes('espacio verde') || cod.toUpperCase().startsWith('EV') || nombreBloque === 'Bloque 04' || cod === 'B-20') {
          continue; // Saltar este bloque sin agregarlo al reporte
        }

        // ESTRATEGIA DUAL SIN TRIGGERS:
        // - Total: nichos_geom (geometrías físicas)
        // - Ocupados/Mantenimiento: nichos (tabla administrativa)

        // PASO 1: Obtener CÓDIGOS de nichos_geom (Total Físico y Lista para cruce)
        let totalFisico = 0;
        let codigosFisicos = [];

        if (bgId) {
          const { data: geomData } = await supabase
            .from('nichos_geom')
            .select('codigo')
            .eq('bloques_geom_id', bgId);

          if (geomData) {
            totalFisico = geomData.length;
            codigosFisicos = geomData.map(n => n.codigo);
          }
        }

        // PASO 2: Buscar estados en tabla administrativa usando los ID/CÓDIGOS
        // Estrategia: Buscar en 'nichos' donde 'codigo' esté en la lista física
        if (codigosFisicos.length > 0) {
          // Dividir en chunks si son muchos (evita error 414 URI Too Long en Supabase GET)
          let nichosAdmin = [];
          const chunkSize = 40;

          for (let i = 0; i < codigosFisicos.length; i += chunkSize) {
            const chunk = codigosFisicos.slice(i, i + chunkSize);
            const { data } = await supabase
              .from('nichos')
              .select('codigo, estado')
              .in('codigo', chunk);

            if (data) {
              nichosAdmin = nichosAdmin.concat(data);
            }
          }

          if (nichosAdmin.length > 0) {
            const bueno = nichosAdmin.filter(n => n.estado?.toUpperCase() === 'BUENO').length;
            const malo = nichosAdmin.filter(n => n.estado?.toUpperCase() === 'MALO').length;
            const mant = nichosAdmin.filter(n => n.estado?.toUpperCase() === 'MANTENIMIENTO').length;
            const abandonado = nichosAdmin.filter(n => n.estado?.toUpperCase() === 'ABANDONADO').length;

            const totalOcupados = bueno + malo + mant + abandonado;
            const disp = totalFisico - totalOcupados;

            tNichos += totalFisico;
            tBueno += bueno;
            tMalo += malo;
            tMantenimiento += mant;
            tAbandonado += abandonado;
            tDisponibles += disp;

            detalles.push({ nombre: nombreBloque, codigo: cod, total: totalFisico, bueno, malo, mant, abandonado, disp });
          } else {
            tNichos += totalFisico;
            tDisponibles += totalFisico;
            detalles.push({ nombre: nombreBloque, codigo: cod, total: totalFisico, bueno: 0, malo: 0, mant: 0, abandonado: 0, disp: totalFisico });
          }
        }
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const fechaLarga = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaCorta = new Date().toLocaleDateString('es-ES');

      // Márgenes en milímetros (1cm = 10mm)
      const marginLeft = 15;
      const marginRight = 15;
      const marginTop = 50;
      const marginBottom = 45;

      // --- FUNCIONES PARA ENCABEZADO Y PIE DE PÁGINA ---
      const addHeaderFooter = (docParams) => {
        const totalPages = docParams.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          docParams.setPage(i);

          // 1. Encabezado
          try {
            // Cargar imagen de encabezado (importada desde assets)
            docParams.addImage(encabezadoImg, 'PNG', 0, 5, pageWidth, 30);
          } catch (e) {
            // Fallback (por si falla la imagen)
            docParams.setFillColor(28, 42, 72); // #1c2a48
            docParams.rect(0, 5, pageWidth, 20, 'F');
            docParams.setTextColor(255);
            docParams.setFontSize(14);
            docParams.text('UNORICO SAMASHUNCHIK', pageWidth / 2, 17, { align: 'center' });
          }

          // 2. Pie de Página
          const footerY = pageHeight - 42;

          // Línea divisora
          docParams.setDrawColor(204, 204, 204); // #ccc
          docParams.line(marginLeft, footerY, pageWidth - marginRight, footerY);

          // Textos Meta
          docParams.setFontSize(8);
          docParams.setTextColor(51, 51, 51); // #333
          docParams.setFont('helvetica', 'normal');
          docParams.text('Generado por: Sistema Unorico', marginLeft, footerY + 5);
          docParams.text(`Otavalo, ${fechaLarga}`, pageWidth - marginRight, footerY + 5, { align: 'right' });

          // Textos Contacto
          docParams.setFontSize(8);
          docParams.setFont('helvetica', 'bold');
          docParams.text('06) 2-927-663', pageWidth / 2, footerY + 12, { align: 'center' });

          docParams.setTextColor(0, 123, 255); // #007bff
          docParams.text('unoricosamashunchik@gmail.com', pageWidth / 2, footerY + 16, { align: 'center' });

          docParams.setTextColor(51, 51, 51);
          docParams.text('Calle Las Almas y Bolívar', pageWidth / 2, footerY + 20, { align: 'center' });

          // Imagen Pie de página (líneas moradas de diseño sin texto)
          try {
            docParams.addImage(piedepaginaImg, 'PNG', 0, pageHeight - 15, pageWidth, 15);
          } catch (e) { }
        }
      };

      // --- CONTENIDO PRINCIPAL ---
      let y = marginTop;

      // Fecha Alineada a la Derecha
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51); // #333
      doc.setFont('helvetica', 'normal');
      doc.text(`Otavalo, ${fechaLarga}`, pageWidth - marginRight, y, { align: 'right' });

      y += 15;

      // Titulo Principal UPPERCASE
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE GENERAL DE OCUPACIÓN', pageWidth / 2, y, { align: 'center' });

      y += 6;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sector: ${sectorSeleccionado}`, pageWidth / 2, y, { align: 'center' });

      y += 12;

      // --- TABLA RESUMEN TOTAL ---
      autoTable(doc, {
        startY: y,
        head: [['Estado Físico', 'Cantidad', 'Porcentaje']],
        body: [
          ['Buenas condiciones', tBueno, tNichos > 0 ? ((tBueno / tNichos) * 100).toFixed(1) + '%' : '0%'],
          ['Malas condiciones', tMalo, tNichos > 0 ? ((tMalo / tNichos) * 100).toFixed(1) + '%' : '0%'],
          ['Mantenimiento', tMantenimiento, tNichos > 0 ? ((tMantenimiento / tNichos) * 100).toFixed(1) + '%' : '0%'],
          ['Abandonado', tAbandonado, tNichos > 0 ? ((tAbandonado / tNichos) * 100).toFixed(1) + '%' : '0%'],
          ['Disponibles', tDisponibles, tNichos > 0 ? ((tDisponibles / tNichos) * 100).toFixed(1) + '%' : '0%'],
          ['TOTAL', tNichos, '100%']
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [28, 42, 72],
          textColor: [255, 255, 255],
          halign: 'center',
          fontSize: 9
        },
        bodyStyles: {
          textColor: [51, 51, 51],
          halign: 'center',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [242, 242, 242]
        },
        margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom }
      });

      // --- TABLA DETALLE POR BLOQUE ---
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [['#', 'Bloque', 'T. Nichos', 'Buenas', 'Malas', 'Manten.', 'Abandon.', 'Disponib.', 'Fecha']],
        body: detalles.map((d, index) => [
          index + 1,
          d.nombre,
          d.total,
          d.bueno,
          d.malo,
          d.mant,
          d.abandonado,
          d.disp,
          fechaCorta
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [28, 42, 72],
          textColor: [255, 255, 255],
          halign: 'center',
          fontSize: 7
        },
        bodyStyles: {
          textColor: [51, 51, 51],
          halign: 'center',
          fontSize: 7
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [249, 249, 249], halign: 'center' },
          1: { halign: 'left' }
        },
        alternateRowStyles: {
          fillColor: [242, 242, 242]
        },
        margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom }
      });

      // Agregamos el Header y el Footer a TODAS las páginas que se hayan generado
      addHeaderFooter(doc);

      doc.save(`Reporte_Ocupacion_${sectorSeleccionado.replace(/\s+/g, '_')}.pdf`);
      setSectorSeleccionado('');
      setBloquesSeleccionados([]);
    } catch (e) {
      console.error(e);
      alert('Error generando reporte.');
    }
    setGenerandoReporte(false);
  };

  return (
    <div className={`sidebar-container ${className}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <div>
            UNORICO SAMASHUNCHIK
            <p className="sidebar-subtitle">Otavalo - Ecuador</p>
          </div>
        </div>
      </div>

      <div className="sidebar-content">
        <section className="sidebar-section">
          <h3 className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={14} /> Búsqueda
            </div>
            <div className="search-filters-header">
              <label className="search-checkbox">
                <input
                  type="checkbox"
                  checked={buscarFallecidos}
                  onChange={(e) => setTipoBusqueda(e.target.checked ? 'difuntos' : '')}
                />
                <span>Difuntos</span>
              </label>
              <label className="search-checkbox">
                <input
                  type="checkbox"
                  checked={buscarSocios}
                  onChange={(e) => setTipoBusqueda(e.target.checked ? 'socios' : '')}
                />
                <span>Socios</span>
              </label>
            </div>
          </h3>
          <div className="input-group">
            <input type="text" placeholder="Ingrese cédula o nombre" value={busqueda} onChange={manejarBusqueda} onKeyDown={(e) => e.key === 'Enter' && ubicarFallecido()} className="form-input" />
            <button onClick={ubicarFallecido} disabled={busqueda.length < 3} className="btn-primary">
              <Navigation size={16} />
            </button>
          </div>
          {mensajeBusqueda && (
            <div className={`alert-box ${mensajeBusqueda.tipo === 'error' ? 'alert-error' : 'alert-warning'}`}>
              {mensajeBusqueda.tipo === 'error' ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
              {mensajeBusqueda.texto}
            </div>
          )}
          {resultados.length > 0 && (
            <ul className="search-results">
              {resultados.map(item => (
                <li key={item.id} onClick={() => seleccionarResultado(item)} className="search-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #edf2f7', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="item-name" style={{ fontWeight: 'bold', color: '#2d3748' }}>
                      {item.tipo === 'Socio' ? '👤 ' : '✝ '}{item.nombre}
                    </span>
                    {item.codigo && (
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#4a5568', fontWeight: 'bold' }}>
                        Nicho: {item.codigo}
                      </span>
                    )}
                  </div>

                  {item.tipo === 'Socio' && item.difuntosLista && item.difuntosLista.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                      <strong>Difunto(s):</strong> {item.difuntosLista.map(d => d.nombre).join(', ')}
                    </div>
                  )}
                  {item.tipo === 'Socio' && (!item.difuntosLista || item.difuntosLista.length === 0) && item.codigo && (
                    <div style={{ fontSize: '0.8rem', color: '#718096', fontStyle: 'italic' }}>
                      Nicho vacío (Sin difunto asignado)
                    </div>
                  )}

                  {item.tipo === 'Difunto' && (
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                      <strong>Titular:</strong> {item.responsable}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sidebar-section">
          <h3 className="section-title"><Grid3X3 size={14} /> Filtrar por Bloque</h3>

          {/* Custom dropdown para sector filtro - siempre abre hacia abajo */}
          <div className="custom-select-wrapper" ref={sectorFiltroRef} style={{ marginBottom: '0.5rem' }}>
            <div
              className="form-select custom-select-trigger"
              onClick={() => setDropdownSectorFiltroOpen(o => !o)}
            >
              <span>{sectorFiltro || '-- Seleccione un sector --'}</span>
              <span className="custom-select-arrow">{dropdownSectorFiltroOpen ? '▲' : '▼'}</span>
            </div>
            {dropdownSectorFiltroOpen && (
              <div className="custom-select-options">
                <div
                  className="custom-select-option"
                  onClick={() => {
                    setSectorFiltro('');
                    setBloqueActual('');
                    alSeleccionarBloque(null);
                    if (alSeleccionarSector) alSeleccionarSector('');
                    setDropdownSectorFiltroOpen(false);
                  }}
                >
                  -- Seleccione un sector --
                </div>
                {sectores.map(s => (
                  <div
                    key={s}
                    className={`custom-select-option${s === sectorFiltro ? ' selected' : ''}`}
                    onClick={() => {
                      setSectorFiltro(s);
                      setBloqueActual('');
                      alSeleccionarBloque(null);
                      if (alSeleccionarSector) alSeleccionarSector(s);
                      setDropdownSectorFiltroOpen(false);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom dropdown para bloques - siempre abre hacia abajo */}
          {(() => {
            const filteredBloques = bloques.filter(b => {
              if (!sectorFiltro || b.sector !== sectorFiltro) return false;
              if (sectorFiltro === 'CAPILLA' && (b.nombre === 'Bloque 04' || b.codigo === 'B-20')) return false;
              return true;
            });
            const selectedBloque = filteredBloques.find(b => b.codigo === bloqueActual);
            return (
              <div className="custom-select-wrapper" ref={bloqueDropdownRef}>
                <div
                  className={`form-select custom-select-trigger${!sectorFiltro ? ' disabled' : ''}`}
                  onClick={() => sectorFiltro && setDropdownBloqueOpen(o => !o)}
                >
                  <span>{selectedBloque ? `(${selectedBloque.codigo}) ${selectedBloque.nombre}` : '-- Seleccione un bloque --'}</span>
                  <span className="custom-select-arrow">{dropdownBloqueOpen ? '▲' : '▼'}</span>
                </div>
                {dropdownBloqueOpen && sectorFiltro && (
                  <div className="custom-select-options">
                    <div
                      className="custom-select-option"
                      onClick={() => { setBloqueActual(''); alSeleccionarBloque(null); setDropdownBloqueOpen(false); }}
                    >
                      -- Seleccione un bloque --
                    </div>
                    {filteredBloques.map(b => (
                      <div
                        key={b.codigo}
                        className={`custom-select-option${b.codigo === bloqueActual ? ' selected' : ''}`}
                        onClick={() => {
                          setBloqueActual(b.codigo);
                          alSeleccionarBloque({ codigo: b.codigo, nombre: b.nombre });
                          setDropdownBloqueOpen(false);
                        }}
                      >
                        ({b.codigo}) {b.nombre}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          {/* Botón de quitar filtro removido intencionalmente */}
        </section>

        <section className="sidebar-section">
          <h3 className="section-title"><FileText size={14} /> Reporte por Sector</h3>
          {/* Custom dropdown para sector reporte - siempre abre hacia abajo */}
          <div className="custom-select-wrapper" ref={sectorReporteRef} style={{ marginBottom: '0.5rem' }}>
            <div
              className="form-select custom-select-trigger"
              onClick={() => setDropdownSectorReporteOpen(o => !o)}
            >
              <span>{sectorSeleccionado || '-- Seleccione un sector --'}</span>
              <span className="custom-select-arrow">{dropdownSectorReporteOpen ? '▲' : '▼'}</span>
            </div>
            {dropdownSectorReporteOpen && (
              <div className="custom-select-options">
                <div
                  className="custom-select-option"
                  onClick={() => {
                    setSectorSeleccionado('');
                    setDropdownSectorReporteOpen(false);
                  }}
                >
                  -- Seleccione un sector --
                </div>
                {sectores.map(s => (
                  <div
                    key={s}
                    className={`custom-select-option${s === sectorSeleccionado ? ' selected' : ''}`}
                    onClick={() => {
                      setSectorSeleccionado(s);
                      setDropdownSectorReporteOpen(false);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          {sectorSeleccionado && !dropdownSectorReporteOpen && (
            <div className="blocks-list">
              <div className="block-actions">
                <span>Bloques del sector</span>
                <span className="link-action" onClick={() => setBloquesSeleccionados(bloquesSeleccionados.length === bloquesDelSector.length ? [] : bloquesDelSector.map(b => b.codigo))}>
                  {bloquesSeleccionados.length === bloquesDelSector.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </span>
              </div>
              {bloquesDelSector.map(b => (
                <label key={b.codigo} className="block-checkbox">
                  <input type="checkbox" checked={bloquesSeleccionados.includes(b.codigo)} onChange={(e) => {
                    if (e.target.checked) setBloquesSeleccionados([...bloquesSeleccionados, b.codigo]);
                    else setBloquesSeleccionados(bloquesSeleccionados.filter(x => x !== b.codigo));
                  }} />
                  ({b.codigo}) {b.nombre}
                </label>
              ))}
            </div>
          )}
          <button onClick={generarReportePDF} disabled={generandoReporte} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {generandoReporte ? 'Generando...' : 'Generar Reporte PDF'}
          </button>
        </section>

        <section className="sidebar-section">
          <h3 className="section-title"><Info size={14} /> Filtrar nichos Disponibilidad</h3>

          <div className="availability-toggles" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <label className="toggle-box"
              style={{
                flex: 1, padding: '0.5rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                borderRadius: '8px',
                backgroundColor: 'transparent'
              }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                {estadosSeleccionados.includes('Ocupado') && <div style={{ width: '18px', height: '18px', backgroundColor: '#ef4444', borderRadius: '4px' }} />}
              </div>
              <input
                type="checkbox"
                className="hidden-checkbox"
                checked={estadosSeleccionados.includes('Ocupado')}
                onChange={() => toggleEstado('Ocupado')}
              />
              <span className="toggle-text">Ocupado</span>
            </label>

            <label className="toggle-box"
              style={{
                flex: 1, padding: '0.5rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                borderRadius: '8px',
                backgroundColor: 'transparent'
              }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                {estadosSeleccionados.includes('Disponible') && <div style={{ width: '18px', height: '18px', backgroundColor: '#22c55e', borderRadius: '4px' }} />}
              </div>
              <input
                type="checkbox"
                className="hidden-checkbox"
                checked={estadosSeleccionados.includes('Disponible')}
                onChange={() => toggleEstado('Disponible')}
              />
              <span className="toggle-text">Libre</span>
            </label>
          </div>

          <h3 className="section-title">Filtrar por estado físico</h3>
          <div className="status-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

            <label className={`status-item ${estadosSeleccionados.includes('Estado_Bueno') ? 'active' : ''}`}
              style={{
                opacity: estadosSeleccionados.includes('Ocupado') ? 1 : 0.5,
                pointerEvents: estadosSeleccionados.includes('Ocupado') ? 'auto' : 'none'
              }}>
              <div className="status-color-box" style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #60a5fa', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {estadosSeleccionados.includes('Estado_Bueno') && <div style={{ width: '14px', height: '14px', backgroundColor: '#60a5fa', borderRadius: '2px' }} />}
              </div>
              <input type="checkbox" checked={estadosSeleccionados.includes('Estado_Bueno')} onChange={() => toggleEstadoFisico('Estado_Bueno')} className="hidden-checkbox" disabled={!estadosSeleccionados.includes('Ocupado')} />
              <span className="status-text">Buenas condiciones</span>
            </label>

            <label className={`status-item ${estadosSeleccionados.includes('Estado_Malo') ? 'active' : ''}`}
              style={{
                opacity: estadosSeleccionados.includes('Ocupado') ? 1 : 0.5,
                pointerEvents: estadosSeleccionados.includes('Ocupado') ? 'auto' : 'none'
              }}>
              <div className="status-color-box" style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #ef4444', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {estadosSeleccionados.includes('Estado_Malo') && <div style={{ width: '14px', height: '14px', backgroundColor: '#ef4444', borderRadius: '2px' }} />}
              </div>
              <input type="checkbox" checked={estadosSeleccionados.includes('Estado_Malo')} onChange={() => toggleEstadoFisico('Estado_Malo')} className="hidden-checkbox" disabled={!estadosSeleccionados.includes('Ocupado')} />
              <span className="status-text">Malas condiciones</span>
            </label>

            <label className={`status-item ${estadosSeleccionados.includes('Mantenimiento') ? 'active' : ''}`}
              style={{
                opacity: estadosSeleccionados.includes('Ocupado') ? 1 : 0.5,
                pointerEvents: estadosSeleccionados.includes('Ocupado') ? 'auto' : 'none'
              }}>
              <div className="status-color-box" style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #fbbf24', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {estadosSeleccionados.includes('Mantenimiento') && <div style={{ width: '14px', height: '14px', backgroundColor: '#fbbf24', borderRadius: '2px' }} />}
              </div>
              <input type="checkbox" checked={estadosSeleccionados.includes('Mantenimiento')} onChange={() => toggleEstadoFisico('Mantenimiento')} className="hidden-checkbox" disabled={!estadosSeleccionados.includes('Ocupado')} />
              <span className="status-text">Mantenimiento</span>
            </label>

            <label className={`status-item ${estadosSeleccionados.includes('Abandonado') ? 'active' : ''}`}
              style={{
                opacity: estadosSeleccionados.includes('Ocupado') ? 1 : 0.5,
                pointerEvents: estadosSeleccionados.includes('Ocupado') ? 'auto' : 'none'
              }}>
              <div className="status-color-box" style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #9333ea', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {estadosSeleccionados.includes('Abandonado') && <div style={{ width: '14px', height: '14px', backgroundColor: '#9333ea', borderRadius: '2px' }} />}
              </div>
              <input type="checkbox" checked={estadosSeleccionados.includes('Abandonado')} onChange={() => toggleEstadoFisico('Abandonado')} className="hidden-checkbox" disabled={!estadosSeleccionados.includes('Ocupado')} />
              <span className="status-text">Abandonado</span>
            </label>
          </div>
        </section>

        <section className="sidebar-section">
          <h3 className="section-title"><Layers size={14} /> Capas del Mapa</h3>
          <div className="layers-list">
            {capasConfig.map(capa => (
              <div key={capa.id} onClick={() => toggleCapa(capa.id)} className={`layer-item ${capasVisibles[capa.id] ? 'active' : 'inactive'}`}>
                {capasVisibles[capa.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>{capa.nombre}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Sidebar;
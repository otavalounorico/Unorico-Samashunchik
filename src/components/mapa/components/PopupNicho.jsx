import React from 'react';

const NichePopup = ({ datos, onClose }) => {
    if (!datos) return null;

    const cerrarNichoPopup = (e) => {
        e.stopPropagation(); // Evitar que el click llegue al mapa si fuera necesario
        onClose();
    };

    return (
        <div className="map-popup" style={{ display: 'block' }}>
            <div className="popup-header">
                <span className="popup-icon">📍</span>
                <h4 className="popup-title">Nicho {datos.codigo || '-'}</h4>
                <button onClick={cerrarNichoPopup} className="popup-close">×</button>
            </div>
            <div className="popup-content">
                <div className="popup-state-wrapper">
                    <span className="popup-label">Estado:</span>
                    <span className={`state-badge state-${datos.estado?.toLowerCase()}`}>
                        {datos.estado || 'DESCONOCIDO'}
                    </span>
                </div>
                <div className="popup-grid">
                    <div className="info-card">
                        <span className="info-label">Bloque</span>
                        <span className="info-value">{datos.bloque || 'N/A'}</span>
                    </div>
                    <div className="info-card">
                        <span className="info-label">Sector</span>
                        <span className="info-value">{datos.sector || 'N/A'}</span>
                    </div>
                </div>
                <div className="deceased-card">
                    <h5 className="deceased-header">
                        🕊️ INFORMACIÓN
                    </h5>
                    {datos.difuntos && datos.difuntos.length > 0 ? (() => {
                        const responsables = [...new Set(datos.difuntos.map(d => d.responsable))];
                        const mismoResponsable = responsables.length === 1;

                        return (
                            <>
                                {mismoResponsable && (
                                    <div className="deceased-info-group" style={{ marginBottom: '10px', borderBottom: '2px solid #ffebb0', paddingBottom: '8px' }}>
                                        <span className="deceased-label">Responsable (Titular)</span>
                                        <span className="deceased-value" style={{ fontWeight: 'bold' }}>{responsables[0]}</span>
                                    </div>
                                )}
                                <div className="deceased-list">
                                    <div className="deceased-label" style={{ marginBottom: '4px' }}>DIFUNTO/S</div>
                                    {datos.difuntos.map((d, i) => (
                                        <div key={i} className="deceased-item">
                                            <span className="deceased-name">✝ {d.nombre}</span>
                                            {!mismoResponsable && (
                                                <div className="deceased-info-group">
                                                    <span className="deceased-label">Resp:</span>
                                                    <span className="deceased-value">{d.responsable}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        );
                    })() : (
                        <>
                            <div className="deceased-info-group" style={{ marginBottom: '10px', borderBottom: '2px solid #ffebb0', paddingBottom: '8px' }}>
                                <span className="deceased-label">Responsable (Titular)</span>
                                <span className="deceased-value" style={{ fontWeight: 'bold' }}>N/A</span>
                            </div>
                            <div className="deceased-list">
                                <div className="deceased-label" style={{ marginBottom: '4px' }}>DIFUNTO/S</div>
                                <div className="deceased-item">
                                    <span className="deceased-name">N/A</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NichePopup;

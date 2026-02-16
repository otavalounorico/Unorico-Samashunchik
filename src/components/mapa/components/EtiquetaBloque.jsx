import React from 'react';

const BlockLabel = ({ etiqueta, onClose }) => {
    if (!etiqueta) return null;

    return (
        <div className="block-label" style={{ display: 'flex' }}>
            <div className="block-label-left">
                <span className="block-pin">📍</span>
                <div className="block-text">
                    <div className="block-label-title">Bloque:</div>
                    <div className="block-label-name">{etiqueta}</div>
                </div>
            </div>
            <button className="block-close" onClick={onClose} title="Cerrar/Remover filtro">×</button>
        </div>
    );
};

export default BlockLabel;

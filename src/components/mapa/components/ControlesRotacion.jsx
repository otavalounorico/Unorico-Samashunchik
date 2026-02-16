import React from 'react';

const MapRotationControls = ({ onRotateLeft, onRotateRight }) => {
    return (
        <div className="map-rotation-controls">
            <button onClick={onRotateLeft} className="rotation-btn" title="Rotar Izquierda">↺</button>
            <button onClick={onRotateRight} className="rotation-btn" title="Rotar Derecha">↻</button>
        </div>
    );
};

export default MapRotationControls;

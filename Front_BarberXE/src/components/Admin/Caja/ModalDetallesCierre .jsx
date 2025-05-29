const ModalDetallesCierre = () => {
    if (!mostrarDetallesCierre || !cierreInfo) return null;

    const { arqueo, alertas } = cierreInfo;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`p-6 rounded-t-lg ${
            alertas.requiereAtencion 
                ? 'bg-red-500 text-white' 
                : alertas.hayDiferencia 
                ? 'bg-yellow-500 text-white'
                : 'bg-green-500 text-white'
            }`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                {alertas.requiereAtencion ? (
                    <AlertCircle className="h-8 w-8" />
                ) : alertas.hayDiferencia ? (
                    <AlertCircle className="h-8 w-8" />
                ) : (
                    <CheckCircle className="h-8 w-8" />
                )}
                <div>
                    <h2 className="text-2xl font-bold">
                    Arqueo #{arqueo.id} - Cerrado
                    </h2>
                    <p className="text-sm opacity-90">
                    {formatDateTime(arqueo.fechaCierre)}
                    </p>
                </div>
                </div>
                <button
                onClick={cerrarDetallesCierre}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                <X className="h-6 w-6" />
                </button>
            </div>
            </div>

            {/* Content */}
            <div className="p-6">
            {/* Alerta principal */}
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                alertas.requiereAtencion 
                ? 'bg-red-50 border-red-500 text-red-800'
                : alertas.hayDiferencia 
                    ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                    : 'bg-green-50 border-green-500 text-green-800'
            }`}>
                <p className="font-semibold text-lg">
                {alertas.mensajeAlerta}
                </p>
            </div>

            {/* Resumen financiero */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Columna izquierda - Saldos */}
                <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Resumen de Saldos
                </h3>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Saldo Inicial:</span>
                    <span className="font-semibold text-green-600">
                        ${Number(arqueo.saldoInicial).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Ingresos:</span>
                    <span className="font-semibold text-green-600">
                        +${Number(arqueo.resumen?.totalIngresos || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Egresos:</span>
                    <span className="font-semibold text-red-600">
                        -${Number(arqueo.resumen?.totalEgresos || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 bg-gray-50 px-3 rounded">
                    <span className="font-semibold text-gray-800">Saldo Calculado:</span>
                    <span className="font-bold text-blue-600 text-lg">
                        ${Number(arqueo.saldoCalculado).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                    </div>
                </div>
                </div>

                {/* Columna derecha - Cierre */}
                <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Detalles del Cierre
                </h3>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Saldo Reportado:</span>
                    <span className="font-semibold text-blue-600">
                        ${Number(arqueo.saldoFinal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                    </div>
                    
                    <div className={`flex justify-between items-center py-2 border-b border-gray-100`}>
                    <span className="text-gray-600">Diferencia:</span>
                    <span className={`font-bold text-lg ${
                        Number(arqueo.diferencia) > 0 
                        ? 'text-green-600' 
                        : Number(arqueo.diferencia) < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                    }`}>
                        {Number(arqueo.diferencia) > 0 ? '+' : ''}${Number(arqueo.diferencia).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        arqueo.estado?.requiereAtencion
                        ? 'bg-red-100 text-red-800'
                        : arqueo.estado?.dentroDeToleranacia
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {arqueo.estado?.requiereAtencion 
                        ? 'Requiere Atención' 
                        : arqueo.estado?.dentroDeToleranacia 
                            ? 'Dentro de Tolerancia'
                            : 'Revisión'}
                    </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Cajero:</span>
                    <span className="font-semibold">
                        {arqueo.empleado?.nombre || 'No especificado'}
                    </span>
                    </div>
                </div>
                </div>
            </div>

            {/* Observaciones */}
            {arqueo.observaciones && (
                <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                    Observaciones
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                    {arqueo.observaciones}
                    </p>
                </div>
                </div>
            )}

            {/* Información adicional */}
            <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Información del Arqueo:</p>
                    <p>• Período: {formatDateTime(arqueo.fechaInicio)} - {formatDateTime(arqueo.fechaCierre)}</p>
                    <p>• Total de movimientos: {Number(arqueo.resumen?.cantidadMovimientos || 0)}</p>
                    <p>• Tolerancia aplicada: $1.00</p>
                </div>
                </div>
            </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button
                onClick={cerrarDetallesCierre}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
                Cerrar
            </button>
            </div>
        </div>
        </div>
    );
    };

    // ✨ COMPONENTE ADICIONAL: Indicador de alerta en la interfaz principal
    const AlertaCierreIndicator = () => {
    if (!alertaCierre) return null;

    return (
        <div className={`mb-4 p-4 rounded-lg border-l-4 ${
        alertaCierre.tipo === 'warning' || alertaCierre.requiereAtencion
            ? 'bg-red-50 border-red-500 text-red-800'
            : alertaCierre.tipo === 'success'
            ? 'bg-green-50 border-green-500 text-green-800'
            : 'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
            {alertaCierre.requiereAtencion ? (
                <AlertCircle className="h-5 w-5" />
            ) : (
                <CheckCircle className="h-5 w-5" />
            )}
            <span className="font-medium">
                {alertaCierre.mensaje}
            </span>
            </div>
            {cierreInfo && (
            <button
                onClick={toggleDetallesCierre}
                className="text-sm underline hover:no-underline"
            >
                Ver detalles
            </button>
            )}
        </div>
        </div>
    );
};
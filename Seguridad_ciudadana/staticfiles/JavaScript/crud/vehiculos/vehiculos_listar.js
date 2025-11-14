// =============================================
// FUNCIONES PARA LISTAR VEHÍCULOS - CORREGIDO CON IDs
// =============================================

// Variables globales
let todosLosVehiculos = [];
let vehiculosFiltrados = [];

// Función principal para listar vehículos
async function listarVehiculos() {
    try {
        mostrarLoadingVehiculos();
        
        const response = await fetch('/api/vehiculos-web/');
        const vehiculos = await response.json();

        if (response.ok) {
            todosLosVehiculos = vehiculos;
            vehiculosFiltrados = [...vehiculos];
            mostrarVehiculosEnLista(vehiculos);
            actualizarEstadisticas(vehiculos);
        } else {
            throw new Error('Error al cargar los vehículos');
        }
    } catch (error) {
        console.error('Error al listar vehículos:', error);
        mostrarErrorVehiculos('Error al cargar los vehículos: ' + error.message);
    }
}

// Función para mostrar vehículos en la lista
function mostrarVehiculosEnLista(vehiculos) {
    const contenedor = document.getElementById('lista-vehiculos');
    
    if (!vehiculos || vehiculos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-vehiculos">
                <i class="fa-solid fa-car"></i>
                <h3>No hay vehículos registrados</h3>
                <p>Agrega el primer vehículo haciendo clic en el botón "Agregar Nuevo Vehículo"</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = vehiculos.map(vehiculo => crearCardVehiculo(vehiculo)).join('');
}

// Función para crear el HTML de cada card de vehículo
function crearCardVehiculo(vehiculo) {
    const estadoClass = getClaseEstadoPorId(vehiculo.id_estado_vehiculo);
    const nombreEstado = getNombreEstadoPorId(vehiculo.id_estado_vehiculo);
    
    // 🔥 CORREGIDO: Formatear fecha correctamente
    let fechaFormateada = 'No disponible';
    
    if (vehiculo.fecha_creacion) {
        try {
            // Intentar parsear la fecha
            const fecha = new Date(vehiculo.fecha_creacion);
            
            // Verificar si la fecha es válida
            if (!isNaN(fecha.getTime())) {
                fechaFormateada = fecha.toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                console.warn(`⚠️ Fecha inválida para vehículo ${vehiculo.id_vehiculo}:`, vehiculo.fecha_creacion);
                fechaFormateada = 'Fecha inválida';
            }
        } catch (error) {
            console.error(`❌ Error formateando fecha para vehículo ${vehiculo.id_vehiculo}:`, error);
            fechaFormateada = 'Error en fecha';
        }
    }
    
    return `
        <div class="vehiculo-card" data-vehiculo-id="${vehiculo.id_vehiculo}">
            <div class="vehiculo-header">
                <div class="vehiculo-patente">${vehiculo.patente_vehiculo}</div>
                <div class="vehiculo-estado ${estadoClass}">
                    ${nombreEstado}
                </div>
            </div>
            
            <div class="vehiculo-info">
                <div class="vehiculo-dato">
                    <strong><i class="fa-solid fa-industry"></i> Marca:</strong>
                    <span>${vehiculo.marca_vehiculo}</span>
                </div>
                <div class="vehiculo-dato">
                    <strong><i class="fa-solid fa-car-side"></i> Modelo:</strong>
                    <span>${vehiculo.modelo_vehiculo}</span>
                </div>
                <div class="vehiculo-dato">
                    <strong><i class="fa-solid fa-barcode"></i> Código:</strong>
                    <span class="codigo-vehiculo">${vehiculo.codigo_vehiculo}</span>
                </div>
                <div class="vehiculo-dato">
                    <strong><i class="fa-solid fa-tachometer-alt"></i> Kilometraje:</strong>
                    <span class="kilometraje-info">${vehiculo.total_kilometraje.toLocaleString()} km</span>
                </div>
                <div class="vehiculo-dato">
                    <strong><i class="fa-solid fa-caravan"></i> Tipo:</strong>
                    <span>${vehiculo.nombre_tipo_vehiculo}</span>
                </div>
                <div class="vehiculo-dato">
                    <strong><i class="fa-solid fa-calendar"></i> Fecha Registro:</strong>
                    <span>${fechaFormateada}</span>
                </div>
            </div>
            
            <div class="vehiculo-acciones">
                <button class="btn-editar-vehiculo" onclick="editarVehiculoDesdeLista(${vehiculo.id_vehiculo})">
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn-eliminar-vehiculo-card" onclick="eliminarVehiculoDesdeLista(${vehiculo.id_vehiculo})">
                    <i class="fa-solid fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

// 🔥 NUEVO: Función para obtener nombre del estado por ID
function getNombreEstadoPorId(idEstado) {
    const estados = {
        1: 'Disponible',
        2: 'En Mantenimiento',
        3: 'No Disponible', 
        4: 'En Patrulla'
    };
    return estados[idEstado] || 'Desconocido';
}

// 🔥 NUEVO: Función para obtener clase CSS según ID del estado
function getClaseEstadoPorId(idEstado) {
    const estados = {
        1: 'estado-disponible',        // Disponible
        2: 'estado-mantenimiento',     // En Mantenimiento
        3: 'estado-no-disponible',     // No Disponible
        4: 'estado-patrulla'           // En Patrulla
    };
    return estados[idEstado] || 'estado-desconocido';
}

// Función para filtrar vehículos
function filtrarVehiculos() {
    const busqueda = document.getElementById('buscar-vehiculos').value.toLowerCase().trim();
    
    if (!busqueda) {
        vehiculosFiltrados = [...todosLosVehiculos];
    } else {
        vehiculosFiltrados = todosLosVehiculos.filter(vehiculo => 
            vehiculo.patente_vehiculo.toLowerCase().includes(busqueda) ||
            vehiculo.marca_vehiculo.toLowerCase().includes(busqueda) ||
            vehiculo.modelo_vehiculo.toLowerCase().includes(busqueda) ||
            vehiculo.codigo_vehiculo.toLowerCase().includes(busqueda) ||
            vehiculo.nombre_tipo_vehiculo.toLowerCase().includes(busqueda) ||
            getNombreEstadoPorId(vehiculo.id_estado_vehiculo).toLowerCase().includes(busqueda)
        );
    }
    
    mostrarVehiculosEnLista(vehiculosFiltrados);
    
    // Mostrar mensaje si no hay resultados
    const contenedor = document.getElementById('lista-vehiculos');
    if (vehiculosFiltrados.length === 0 && busqueda) {
        contenedor.innerHTML = `
            <div class="no-resultados">
                <i class="fa-solid fa-search"></i>
                <h3>No se encontraron vehículos</h3>
                <p>No hay resultados para "${busqueda}"</p>
            </div>
        `;
    }
}

// 🔥 CORREGIDO: Función para actualizar estadísticas por IDs específicos
function actualizarEstadisticas(vehiculos = todosLosVehiculos) {
    if (!vehiculos || vehiculos.length === 0) {
        document.getElementById('total-vehiculos').textContent = '0';
        document.getElementById('vehiculos-disponibles').textContent = '0';
        document.getElementById('vehiculos-mantenimiento').textContent = '0';
        document.getElementById('vehiculos-patrulla').textContent = '0';
        return;
    }

    const totalVehiculos = vehiculos.length;
    
    // 🔥 CONTAR POR IDs ESPECÍFICOS:
    const vehiculosDisponibles = vehiculos.filter(v => v.id_estado_vehiculo === 1).length;      // ID 1: Disponible
    const vehiculosMantenimiento = vehiculos.filter(v => v.id_estado_vehiculo === 2).length;   // ID 2: En Mantenimiento
    const vehiculosPatrulla = vehiculos.filter(v => v.id_estado_vehiculo === 4).length;        // ID 4: En Patrulla

    // Debug en consola
    console.log(`📊 Estadísticas por ID:`);
    console.log(`   Total: ${totalVehiculos}`);
    console.log(`   Disponibles (ID 1): ${vehiculosDisponibles}`);
    console.log(`   Mantenimiento (ID 2): ${vehiculosMantenimiento}`);
    console.log(`   En Patrulla (ID 4): ${vehiculosPatrulla}`);

    // Actualizar la interfaz
    document.getElementById('total-vehiculos').textContent = totalVehiculos.toLocaleString();
    document.getElementById('vehiculos-disponibles').textContent = vehiculosDisponibles.toLocaleString();
    document.getElementById('vehiculos-mantenimiento').textContent = vehiculosMantenimiento.toLocaleString();
    document.getElementById('vehiculos-patrulla').textContent = vehiculosPatrulla.toLocaleString();
}

// Función para mostrar estado de carga
function mostrarLoadingVehiculos() {
    const contenedor = document.getElementById('lista-vehiculos');
    contenedor.innerHTML = `
        <div class="loading-vehiculos">
            <i class="fa-solid fa-spinner"></i>
            <p>Cargando vehículos...</p>
        </div>
    `;
}

// Función para mostrar error
function mostrarErrorVehiculos(mensaje) {
    const contenedor = document.getElementById('lista-vehiculos');
    contenedor.innerHTML = `
        <div class="sin-vehiculos">
            <i class="fa-solid fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${mensaje}</p>
        </div>
    `;
}

// Función para editar vehículo desde la lista
function editarVehiculoDesdeLista(vehiculoId) {
    abrirModalActualizarVehiculo();
    setTimeout(() => seleccionarVehiculoParaEditar(vehiculoId), 100);
}

// Función para eliminar vehículo desde la lista
function eliminarVehiculoDesdeLista(vehiculoId) {
    abrirModalEliminarVehiculo();
    setTimeout(() => seleccionarVehiculoParaEliminar(vehiculoId), 100);
}

// Cargar vehículos cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    listarVehiculos();
    
    // Configurar búsqueda en tiempo real
    const inputBusqueda = document.getElementById('buscar-vehiculos');
    inputBusqueda.addEventListener('input', filtrarVehiculos);
});
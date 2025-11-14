// =============================================
// FUNCIONES PARA ELIMINAR VEHÍCULOS - CORREGIDO
// =============================================

// Variables globales
let vehiculoSeleccionadoEliminar = null;

// Función para abrir el modal de eliminar vehículo
function abrirModalEliminarVehiculo() {
    document.getElementById('modal-eliminar-vehiculo').style.display = 'block';
    limpiarFormularioEliminar();
    cargarVehiculosParaEliminar();
}

// Función para cerrar el modal de eliminar vehículo
function cerrarModalEliminarVehiculo() {
    document.getElementById('modal-eliminar-vehiculo').style.display = 'none';
    limpiarFormularioEliminar();
}

// Función para limpiar el formulario de eliminación
function limpiarFormularioEliminar() {
    vehiculoSeleccionadoEliminar = null;
    document.getElementById('buscar-vehiculo-eliminar').value = '';
    document.getElementById('lista-vehiculos-eliminar').innerHTML = '';
    document.getElementById('info-vehiculo-eliminar').style.display = 'none';
    document.getElementById('btn-eliminar-vehiculo').disabled = true;
}

async function cargarVehiculosParaEliminar() {
    try {
        console.log("📡 Cargando vehículos para eliminar...");
        
        const response = await fetch('/api/vehiculos-web/');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const vehiculos = await response.json();
        console.log(`✅ ${vehiculos.length} vehículos cargados para eliminar`);

        mostrarVehiculosEnBusquedaEliminar(vehiculos);
        
    } catch (error) {
        console.error('❌ Error al cargar vehículos para eliminar:', error);
        document.getElementById('lista-vehiculos-eliminar').innerHTML = `
            <div class="mensaje-error-eliminar">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <p>Error al cargar los vehículos: ${error.message}</p>
                <button onclick="cargarVehiculosParaEliminar()" class="btn-reintentar">
                    <i class="fa-solid fa-rotate"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Función para mostrar vehículos en la búsqueda de eliminación
function mostrarVehiculosEnBusquedaEliminar(vehiculos) {
    const contenedor = document.getElementById('lista-vehiculos-eliminar');
    
    if (!vehiculos || vehiculos.length === 0) {
        contenedor.innerHTML = `
            <div class="mensaje-vacio-eliminar">
                <i class="fa-solid fa-car"></i>
                <p>No hay vehículos registrados</p>
            </div>
        `;
        return;
    }

    const html = vehiculos.map(vehiculo => `
        <div class="vehiculo-item-search" onclick="seleccionarVehiculoParaEliminar(${vehiculo.id_vehiculo})">
            <div class="vehiculo-info-search">
                <div>
                    <div class="vehiculo-patente-search">${vehiculo.patente_vehiculo}</div>
                    <div class="vehiculo-marca-search">${vehiculo.marca_vehiculo} ${vehiculo.modelo_vehiculo}</div>
                    <div class="vehiculo-codigo-search">Código: ${vehiculo.codigo_vehiculo}</div>
                </div>
                <span class="estado-badge ${getClaseEstadoPorId(vehiculo.id_estado_vehiculo)}">
                    ${getNombreEstadoPorId(vehiculo.id_estado_vehiculo)}
                </span>
            </div>
        </div>
    `).join('');
    
    contenedor.innerHTML = html;
}

async function buscarVehiculosEliminar() {
    const busqueda = document.getElementById('buscar-vehiculo-eliminar').value.toLowerCase().trim();
    
    try {
        const response = await fetch('/api/vehiculos-web/');
        
        if (!response.ok) {
            throw new Error('Error al cargar vehículos');
        }
        
        const todosVehiculos = await response.json();
        let vehiculosFiltrados = todosVehiculos;
        
        if (busqueda) {
            vehiculosFiltrados = todosVehiculos.filter(vehiculo => 
                vehiculo.patente_vehiculo.toLowerCase().includes(busqueda) ||
                vehiculo.marca_vehiculo.toLowerCase().includes(busqueda) ||
                vehiculo.modelo_vehiculo.toLowerCase().includes(busqueda) ||
                vehiculo.codigo_vehiculo.toLowerCase().includes(busqueda) ||
                getNombreEstadoPorId(vehiculo.id_estado_vehiculo).toLowerCase().includes(busqueda)
            );
        }
        
        mostrarVehiculosEnBusquedaEliminar(vehiculosFiltrados);
        
    } catch (error) {
        console.error('Error al buscar vehículos:', error);
        document.getElementById('lista-vehiculos-eliminar').innerHTML = `
            <div class="mensaje-error-eliminar">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <p>Error al buscar vehículos: ${error.message}</p>
            </div>
        `;
    }
}

async function seleccionarVehiculoParaEliminar(vehiculoId) {
    try {
        console.log(`🎯 Seleccionando vehículo ${vehiculoId} para eliminar`);
        
        // Remover selección anterior
        document.querySelectorAll('.vehiculo-item-search').forEach(item => {
            item.classList.remove('selected');
        });

        // Marcar como seleccionado
        const itemSeleccionado = document.querySelector(`.vehiculo-item-search[onclick*="${vehiculoId}"]`);
        if (itemSeleccionado) {
            itemSeleccionado.classList.add('selected');
        }

        // Cargar datos del vehículo
        const response = await fetch(`/api/vehiculos-web/${vehiculoId}/obtener/`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const vehiculo = await response.json();

        if (vehiculo.error) {
            throw new Error(vehiculo.error);
        }

        vehiculoSeleccionadoEliminar = vehiculo;
        mostrarInformacionVehiculoEliminar(vehiculo);
        document.getElementById('btn-eliminar-vehiculo').disabled = false;
        
        console.log(`✅ Vehículo ${vehiculoId} seleccionado para eliminar`);
        
    } catch (error) {
        console.error('❌ Error al seleccionar vehículo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

// Funciones auxiliares para estados (deben estar disponibles)
function getNombreEstadoPorId(idEstado) {
    const estados = {
        1: 'Disponible',
        2: 'En Mantenimiento',
        3: 'No Disponible', 
        4: 'En Patrulla'
    };
    return estados[idEstado] || 'Desconocido';
}

function getClaseEstadoPorId(idEstado) {
    const estados = {
        1: 'estado-disponible',
        2: 'estado-mantenimiento', 
        3: 'estado-no-disponible',
        4: 'estado-patrulla'
    };
    return estados[idEstado] || 'estado-desconocido';
}

// Función para mostrar información del vehículo seleccionado para eliminar
function mostrarInformacionVehiculoEliminar(vehiculo) {
    document.getElementById('patente-vehiculo-eliminar').textContent = vehiculo.patente_vehiculo;
    document.getElementById('marca-modelo-eliminar').textContent = `${vehiculo.marca_vehiculo} ${vehiculo.modelo_vehiculo}`;
    document.getElementById('codigo-vehiculo-eliminar').textContent = vehiculo.codigo_vehiculo;
    
    const estadoBadge = document.getElementById('estado-vehiculo-eliminar');
    estadoBadge.textContent = getNombreEstadoPorId(vehiculo.id_estado_vehiculo);
    estadoBadge.className = `estado-badge ${getClaseEstadoPorId(vehiculo.id_estado_vehiculo)}`;
    
    document.getElementById('info-vehiculo-eliminar').style.display = 'block';
}

async function eliminarVehiculo() {
    if (!vehiculoSeleccionadoEliminar) {
        Swal.fire({
            icon: 'warning',
            title: 'Seleccione un vehículo',
            text: 'Debe seleccionar un vehículo para eliminar',
            confirmButtonColor: '#ffc107'
        });
        return;
    }

    const vehiculoId = vehiculoSeleccionadoEliminar.id_vehiculo;
    const vehiculoInfo = `${vehiculoSeleccionadoEliminar.patente_vehiculo} - ${vehiculoSeleccionadoEliminar.marca_vehiculo} ${vehiculoSeleccionadoEliminar.modelo_vehiculo}`;

    // Confirmación de eliminación
    const resultado = await Swal.fire({
        icon: 'warning',
        title: '¿Está seguro?',
        html: `
            <p>Está a punto de eliminar el vehículo:</p>
            <p><strong>${vehiculoInfo}</strong></p>
            <p class="texto-peligro">Esta acción no se puede deshacer</p>
        `,
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) {
        return;
    }

    try {
        console.log(`🗑️ Eliminando vehículo ${vehiculoId}...`);
        
        const response = await fetch(`/api/vehiculos-web/${vehiculoId}/eliminar/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: data.mensaje || 'Vehículo eliminado correctamente',
                confirmButtonColor: '#28a745'
            });
            
            cerrarModalEliminarVehiculo();
            listarVehiculos(); // Recargar lista principal
            actualizarEstadisticas(); // Actualizar estadísticas
            
        } else {
            throw new Error(data.error || 'Error al eliminar el vehículo');
        }
    } catch (error) {
        console.error('❌ Error al eliminar vehículo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal-eliminar-vehiculo');
    if (event.target === modal) {
        cerrarModalEliminarVehiculo();
    }
}

// Cerrar modal con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModalEliminarVehiculo();
    }
});
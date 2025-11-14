// =============================================
// FUNCIONES PARA ACTUALIZAR VEHÍCULOS
// =============================================

// Variables globales
let vehiculoSeleccionadoActualizar = null;

// Función para abrir el modal de actualizar vehículo
function abrirModalActualizarVehiculo() {
    document.getElementById('modal-actualizar-vehiculo').style.display = 'block';
    limpiarFormularioActualizar();
    cargarVehiculosParaActualizar();
}

// Función para cerrar el modal de actualizar vehículo
function cerrarModalActualizarVehiculo() {
    document.getElementById('modal-actualizar-vehiculo').style.display = 'none';
    limpiarFormularioActualizar();
}

// Función para limpiar el formulario de actualización
function limpiarFormularioActualizar() {
    vehiculoSeleccionadoActualizar = null;
    document.getElementById('buscar-vehiculo-actualizar').value = '';
    document.getElementById('lista-vehiculos-actualizar').innerHTML = '';
    document.getElementById('info-vehiculo-actualizar').style.display = 'none';
    document.getElementById('form-edicion-actualizar').style.display = 'none';
    document.getElementById('btn-actualizar-vehiculo').disabled = true;
    
    // Limpiar campos de edición
    document.getElementById('nueva-patente').value = '';
    document.getElementById('nuevo-codigo').value = '';
    document.getElementById('nueva-marca').value = '';
    document.getElementById('nuevo-modelo').value = '';
    document.getElementById('nuevo-kilometraje').value = '';
    document.getElementById('nuevo-tipo-vehiculo').value = '';
    document.getElementById('nuevo-estado-vehiculo').value = '';
}

// Función para cargar vehículos en el modal de actualización - CORREGIDA
async function cargarVehiculosParaActualizar() {
    try {
        console.log("🔄 Cargando vehículos para actualizar...");
        
        const response = await fetch('/api/vehiculos-web/');
        
        console.log("📊 Response status:", response.status);
        console.log("📊 Response ok:", response.ok);

        if (!response.ok) {
            // Si hay error HTTP, obtener el mensaje de error
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Si no se puede parsear como JSON, usar el texto plano
                const text = await response.text();
                if (text) {
                    errorMessage = text.substring(0, 100); // Limitar longitud
                }
            }
            throw new Error(errorMessage);
        }

        const vehiculos = await response.json();
        console.log(`✅ Vehículos cargados: ${vehiculos.length}`);

        if (response.ok) {
            mostrarVehiculosEnBusquedaActualizar(vehiculos);
        } else {
            throw new Error('Error al cargar vehículos');
        }
    } catch (error) {
        console.error('❌ Error al cargar vehículos para actualizar:', error);
        
        // Mostrar mensaje de error más específico
        let mensajeError = 'Error al cargar los vehículos';
        if (error.message.includes('Failed to fetch')) {
            mensajeError = 'Error de conexión. Verifica tu internet.';
        } else if (error.message.includes('404')) {
            mensajeError = 'API no encontrada. Verifica las rutas.';
        } else if (error.message.includes('500')) {
            mensajeError = 'Error interno del servidor.';
        } else {
            mensajeError = error.message;
        }
        
        document.getElementById('lista-vehiculos-actualizar').innerHTML = `
            <div class="mensaje-error-eliminar">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <p>${mensajeError}</p>
                <button onclick="cargarVehiculosParaActualizar()" class="btn-reintentar">
                    <i class="fa-solid fa-refresh"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Función para mostrar vehículos en la búsqueda de actualización
function mostrarVehiculosEnBusquedaActualizar(vehiculos) {
    const contenedor = document.getElementById('lista-vehiculos-actualizar');
    
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
        <div class="vehiculo-item-search" onclick="seleccionarVehiculoParaEditar(${vehiculo.id_vehiculo})">
            <div class="vehiculo-info-search">
                <div>
                    <div class="vehiculo-patente-search">${vehiculo.patente_vehiculo}</div>
                    <div class="vehiculo-marca-search">${vehiculo.marca_vehiculo} ${vehiculo.modelo_vehiculo}</div>
                </div>
                <span class="estado-badge ${getClaseEstado(vehiculo.nombre_estado_vehiculo)}">
                    ${vehiculo.nombre_estado_vehiculo}
                </span>
            </div>
        </div>
    `).join('');
    
    contenedor.innerHTML = html;
}

// Función para buscar vehículos en el modal de actualización
async function buscarVehiculosActualizar() {
    const busqueda = document.getElementById('buscar-vehiculo-actualizar').value.toLowerCase().trim();
    
    try {
        const response = await fetch('/api/vehiculos-web/');
        const todosVehiculos = await response.json();

        if (response.ok) {
            let vehiculosFiltrados = todosVehiculos;
            
            if (busqueda) {
                vehiculosFiltrados = todosVehiculos.filter(vehiculo => 
                    vehiculo.patente_vehiculo.toLowerCase().includes(busqueda) ||
                    vehiculo.marca_vehiculo.toLowerCase().includes(busqueda) ||
                    vehiculo.modelo_vehiculo.toLowerCase().includes(busqueda) ||
                    vehiculo.codigo_vehiculo.toLowerCase().includes(busqueda)
                );
            }
            
            mostrarVehiculosEnBusquedaActualizar(vehiculosFiltrados);
        }
    } catch (error) {
        console.error('Error al buscar vehículos:', error);
    }
}

// Función para seleccionar un vehículo para editar
async function seleccionarVehiculoParaEditar(vehiculoId) {
    try {
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
        const vehiculo = await response.json();

        if (response.ok) {
            vehiculoSeleccionadoActualizar = vehiculo;
            mostrarInformacionVehiculoActualizar(vehiculo);
            habilitarFormularioEdicion();
        } else {
            throw new Error(vehiculo.error || 'Error al cargar el vehículo');
        }
    } catch (error) {
        console.error('Error al seleccionar vehículo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

// Función para obtener nombre del estado por ID
function getNombreEstadoPorId(idEstado) {
    const estados = {
        1: 'Disponible',
        2: 'En Mantenimiento',
        3: 'No Disponible', 
        4: 'En Patrulla'
    };
    return estados[idEstado] || 'Desconocido';
}

// Función para obtener clase CSS según ID del estado
function getClaseEstadoPorId(idEstado) {
    const estados = {
        1: 'estado-disponible',        // Disponible
        2: 'estado-mantenimiento',     // En Mantenimiento
        3: 'estado-no-disponible',     // No Disponible
        4: 'estado-patrulla'           // En Patrulla
    };
    return estados[idEstado] || 'estado-desconocido';
}

// Función para mostrar información del vehículo seleccionado
function mostrarInformacionVehiculoActualizar(vehiculo) {
    document.getElementById('patente-vehiculo-actualizar').textContent = vehiculo.patente_vehiculo;
    document.getElementById('marca-modelo-actualizar').textContent = `${vehiculo.marca_vehiculo} ${vehiculo.modelo_vehiculo}`;
    document.getElementById('codigo-vehiculo-actualizar').textContent = vehiculo.codigo_vehiculo;
    
    const estadoBadge = document.getElementById('estado-vehiculo-actualizar');
    
    const nombreEstado = getNombreEstadoPorId(vehiculo.id_estado_vehiculo);
    const claseEstado = getClaseEstadoPorId(vehiculo.id_estado_vehiculo);
    
    estadoBadge.textContent = nombreEstado;
    estadoBadge.className = `estado-badge ${claseEstado}`;
    
    document.getElementById('info-vehiculo-actualizar').style.display = 'block';
}

// Función para habilitar el formulario de edición
function habilitarFormularioEdicion() {
    // Llenar campos con datos actuales
    document.getElementById('nueva-patente').value = vehiculoSeleccionadoActualizar.patente_vehiculo;
    document.getElementById('nuevo-codigo').value = vehiculoSeleccionadoActualizar.codigo_vehiculo;
    document.getElementById('nueva-marca').value = vehiculoSeleccionadoActualizar.marca_vehiculo;
    document.getElementById('nuevo-modelo').value = vehiculoSeleccionadoActualizar.modelo_vehiculo;
    document.getElementById('nuevo-kilometraje').value = vehiculoSeleccionadoActualizar.total_kilometraje;
    document.getElementById('nuevo-tipo-vehiculo').value = vehiculoSeleccionadoActualizar.id_tipo_vehiculo;
    document.getElementById('nuevo-estado-vehiculo').value = vehiculoSeleccionadoActualizar.id_estado_vehiculo;
    
    document.getElementById('form-edicion-actualizar').style.display = 'block';
    document.getElementById('btn-actualizar-vehiculo').disabled = false;
}

// Función principal para actualizar vehículo
async function actualizarVehiculo() {
    if (!vehiculoSeleccionadoActualizar) {
        Swal.fire({
            icon: 'warning',
            title: 'Seleccione un vehículo',
            text: 'Debe seleccionar un vehículo para actualizar',
            confirmButtonColor: '#ffc107'
        });
        return;
    }

    const datosActualizados = {
        patente_vehiculo: document.getElementById('nueva-patente').value.toUpperCase().trim(),
        codigo_vehiculo: document.getElementById('nuevo-codigo').value.toUpperCase().trim(),
        marca_vehiculo: document.getElementById('nueva-marca').value.trim(),
        modelo_vehiculo: document.getElementById('nuevo-modelo').value.trim(),
        total_kilometraje: parseInt(document.getElementById('nuevo-kilometraje').value) || 0,
        id_tipo_vehiculo: parseInt(document.getElementById('nuevo-tipo-vehiculo').value),
        id_estado_vehiculo: parseInt(document.getElementById('nuevo-estado-vehiculo').value)
    };

    // Validar datos
    if (!validarDatosActualizacion(datosActualizados)) {
        return;
    }

    try {
        const response = await fetch(`/api/vehiculos-web/${vehiculoSeleccionadoActualizar.id_vehiculo}/editar/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(datosActualizados)
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: data.mensaje || 'Vehículo actualizado correctamente',
                confirmButtonColor: '#28a745'
            });
            
            cerrarModalActualizarVehiculo();
            listarVehiculos(); // Recargar lista
            actualizarEstadisticas(); // Actualizar estadísticas
        } else {
            throw new Error(data.error || 'Error al actualizar el vehículo');
        }
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

// Función para validar datos de actualización
function validarDatosActualizacion(datos) {
    // Validar patente
    const patenteRegex = /^[A-Z]{2,3}\d{3}[A-Z]{0,2}$/;
    if (!patenteRegex.test(datos.patente_vehiculo)) {
        Swal.fire({
            icon: 'warning',
            title: 'Patente inválida',
            text: 'La patente debe tener formato chileno (ej: AB123CD o ABC123)',
            confirmButtonColor: '#ffc107'
        });
        return false;
    }

    // Validar campos requeridos
    const camposRequeridos = [
        'patente_vehiculo', 'marca_vehiculo', 'modelo_vehiculo', 
        'codigo_vehiculo', 'id_tipo_vehiculo', 'id_estado_vehiculo'
    ];

    for (const campo of camposRequeridos) {
        if (!datos[campo]) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: `El campo ${campo.replace('_', ' ')} es obligatorio`,
                confirmButtonColor: '#ffc107'
            });
            return false;
        }
    }

    // Validar kilometraje
    if (datos.total_kilometraje < 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Kilometraje inválido',
            text: 'El kilometraje no puede ser negativo',
            confirmButtonColor: '#ffc107'
        });
        return false;
    }

    return true;
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal-actualizar-vehiculo');
    if (event.target === modal) {
        cerrarModalActualizarVehiculo();
    }
}

// Cerrar modal con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModalActualizarVehiculo();
    }
});
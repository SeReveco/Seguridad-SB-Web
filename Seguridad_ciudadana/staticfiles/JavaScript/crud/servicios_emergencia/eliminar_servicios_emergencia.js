// =============================================
// ELIMINAR SERVICIOS DE EMERGENCIA
// =============================================

let serviciosEliminar = [];
let servicioSeleccionadoEliminar = null;

/**
 * Abrir modal para eliminar servicio
 */
function abrirModalEliminarServicio() {
    console.log("🗑️ Abriendo modal para eliminar servicio");
    document.getElementById('modal-eliminar-servicio').style.display = 'block';
    limpiarModalEliminar();
    cargarServiciosParaEliminar();
}

/**
 * Cerrar modal de eliminar servicio
 */
function cerrarModalEliminarServicio() {
    document.getElementById('modal-eliminar-servicio').style.display = 'none';
}

/**
 * Limpiar modal de eliminar
 */
function limpiarModalEliminar() {
    servicioSeleccionadoEliminar = null;
    document.getElementById('buscar-servicio-eliminar').value = '';
    document.getElementById('lista-servicios-eliminar').innerHTML = '';
    document.getElementById('info-servicio-eliminar').style.display = 'none';
    document.getElementById('btn-eliminar-servicio-confirmar').disabled = true;
}

/**
 * Cargar servicios para eliminar
 */
function cargarServiciosParaEliminar() {
    console.log("📥 Cargando servicios para eliminar");
    
    document.getElementById('lista-servicios-eliminar').innerHTML = `
        <div class="loading-eliminar">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando servicios...</p>
        </div>
    `;

    fetch('/api/servicios-emergencia-web/')
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log(`✅ ${data.length} servicios cargados`);
            serviciosEliminar = data;
            renderizarListaServiciosEliminar(data);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            document.getElementById('lista-servicios-eliminar').innerHTML = `
                <div class="error-eliminar">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar servicios</p>
                </div>
            `;
        });
}

/**
 * Renderizar lista de servicios para eliminar
 */
function renderizarListaServiciosEliminar(servicios) {
    const contenedor = document.getElementById('lista-servicios-eliminar');
    
    if (!servicios || servicios.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-servicios-eliminar">
                <i class="fas fa-inbox"></i>
                <p>No hay servicios registrados</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    servicios.forEach(servicio => {
        html += `
            <div class="servicio-item-eliminar" onclick="seleccionarServicioEliminar(${servicio.id_servicio}, event)">
                <div class="servicio-info-eliminar">
                    <strong>${servicio.nombre_servicio}</strong>
                    <span class="codigo-eliminar">${servicio.codigo_servicio}</span>
                </div>
                <button class="btn-seleccionar-eliminar" onclick="event.stopPropagation(); seleccionarServicioEliminar(${servicio.id_servicio}, event)">
                    <i class="fas fa-check"></i> Seleccionar
                </button>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

/**
 * Buscar servicios para eliminar
 */
function buscarServiciosEliminar() {
    const termino = document.getElementById('buscar-servicio-eliminar').value.toLowerCase().trim();
    
    if (!termino) {
        renderizarListaServiciosEliminar(serviciosEliminar);
        return;
    }
    
    const filtrados = serviciosEliminar.filter(servicio => 
        servicio.nombre_servicio.toLowerCase().includes(termino) ||
        servicio.codigo_servicio.toLowerCase().includes(termino)
    );
    
    if (filtrados.length === 0) {
        document.getElementById('lista-servicios-eliminar').innerHTML = `
            <div class="no-resultados-eliminar">
                <i class="fas fa-search"></i>
                <p>No se encontraron servicios</p>
            </div>
        `;
    } else {
        renderizarListaServiciosEliminar(filtrados);
    }
}

/**
 * Seleccionar servicio para eliminar
 */
function seleccionarServicioEliminar(idServicio, event = null) {
    console.log(`🎯 Seleccionando servicio para eliminar ID: ${idServicio}`);
    
    // Usar el evento pasado como parámetro o el evento global
    const targetEvent = event || window.event;
    
    // Remover selección anterior
    document.querySelectorAll('.servicio-item-eliminar').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Agregar selección al elemento clickeado
    if (targetEvent && targetEvent.currentTarget) {
        targetEvent.currentTarget.classList.add('selected');
    } else {
        // Fallback: buscar el elemento por ID
        const elementos = document.querySelectorAll('.servicio-item-eliminar');
        elementos.forEach(item => {
            if (item.onclick && item.onclick.toString().includes(`seleccionarServicioEliminar(${idServicio})`)) {
                item.classList.add('selected');
            }
        });
    }
    
    // Obtener servicio
    servicioSeleccionadoEliminar = serviciosEliminar.find(s => s.id_servicio === idServicio);
    
    if (!servicioSeleccionadoEliminar) {
        console.error('❌ Servicio no encontrado');
        return;
    }
    
    // Mostrar información
    document.getElementById('nombre-servicio-eliminar').textContent = servicioSeleccionadoEliminar.nombre_servicio;
    document.getElementById('codigo-servicio-eliminar').textContent = servicioSeleccionadoEliminar.codigo_servicio;
    document.getElementById('info-servicio-eliminar').style.display = 'block';
    document.getElementById('btn-eliminar-servicio-confirmar').disabled = false;
}

/**
 * Confirmar eliminación
 */
function confirmarEliminacionServicio() {
    if (!servicioSeleccionadoEliminar) {
        mostrarAlerta('No hay servicio seleccionado', 'error');
        return;
    }
    
    // Confirmación con SweetAlert
    Swal.fire({
        title: '¿Estás seguro?',
        html: `
            <p>Vas a eliminar el servicio:</p>
            <strong>${servicioSeleccionadoEliminar.nombre_servicio}</strong>
            <p class="texto-peligro">Esta acción no se puede deshacer</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarServicio();
        }
    });
}

/**
 * Eliminar servicio
 */
function eliminarServicio() {
    if (!servicioSeleccionadoEliminar) return;
    
    console.log(`🔥 Eliminando servicio ID: ${servicioSeleccionadoEliminar.id_servicio}`);
    
    // Loading
    const btnEliminar = document.getElementById('btn-eliminar-servicio-confirmar');
    const textoOriginal = btnEliminar.innerHTML;
    btnEliminar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
    btnEliminar.disabled = true;

    // Enviar DELETE - CORREGIDO: usar getCSRFToken()
    fetch(`/api/servicios-emergencia-web/${servicioSeleccionadoEliminar.id_servicio}/eliminar/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCSRFToken()  // ← CORREGIDO
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.error || `Error ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Servicio eliminado:", data);
        cerrarModalEliminarServicio();
        mostrarAlerta(data.mensaje || 'Servicio eliminado', 'success');
        
        // Recargar lista principal
        if (typeof cargarServicios === 'function') {
            cargarServicios();
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        mostrarAlerta(error.message, 'error');
    })
    .finally(() => {
        btnEliminar.innerHTML = textoOriginal;
        btnEliminar.disabled = false;
    });
}

/**
 * Eliminar servicio directo desde tarjeta
 */
function eliminarServicioDirecto(idServicio, nombreServicio) {
    Swal.fire({
        title: '¿Eliminar Servicio?',
        html: `
            <p>¿Estás seguro de eliminar el servicio?</p>
            <strong>"${nombreServicio}"</strong>
            <p class="texto-peligro">Esta acción es permanente</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Enviar DELETE directo - CORREGIDO: usar getCSRFToken()
            fetch(`/api/servicios-emergencia-web/${idServicio}/eliminar/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken()  // ← CORREGIDO
                }
            })
            .then(response => {
                if (!response.ok) throw new Error(`Error ${response.status}`);
                return response.json();
            })
            .then(data => {
                mostrarAlerta('Servicio eliminado correctamente', 'success');
                if (typeof cargarServicios === 'function') {
                    cargarServicios();
                }
            })
            .catch(error => {
                mostrarAlerta('Error al eliminar servicio', 'error');
            });
        }
    });
}

/**
 * Configurar eventos del modal eliminar
 */
function configurarEventosEliminar() {
    // Enter en búsqueda
    document.getElementById('buscar-servicio-eliminar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarServiciosEliminar();
        }
    });
}

// ✅ FUNCIONES DE UTILIDAD - AGREGAR EN CADA ARCHIVO
function getCSRFToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function mostrarAlerta(mensaje, tipo = 'info') {
    if (typeof Swal !== 'undefined') {
        const config = {
            title: tipo.charAt(0).toUpperCase() + tipo.slice(1),
            text: mensaje,
            icon: tipo,
            confirmButtonText: 'Aceptar'
        };
        
        Swal.fire(config);
    } else {
        alert(`${tipo.toUpperCase()}: ${mensaje}`);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Módulo eliminar servicios inicializado");
    configurarEventosEliminar();
});
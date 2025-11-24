// =============================================
// ACTUALIZAR SERVICIOS DE EMERGENCIA
// =============================================

let serviciosActualizar = [];
let servicioSeleccionadoActualizar = null;

/**
 * Abrir modal para actualizar servicio
 */
function abrirModalActualizarServicio() {
    console.log("🔧 Abriendo modal para actualizar servicio");
    document.getElementById('modal-actualizar-servicio').style.display = 'block';
    limpiarModalActualizar();
    cargarServiciosParaActualizar();
}

/**
 * Cerrar modal de actualizar servicio
 */
function cerrarModalActualizarServicio() {
    document.getElementById('modal-actualizar-servicio').style.display = 'none';
}

/**
 * Limpiar modal de actualizar
 */
function limpiarModalActualizar() {
    servicioSeleccionadoActualizar = null;
    document.getElementById('buscar-servicio-actualizar').value = '';
    document.getElementById('lista-servicios-actualizar').innerHTML = '';
    document.getElementById('form-edicion-actualizar').style.display = 'none';
    document.getElementById('btn-actualizar-servicio').disabled = true;
    
    document.getElementById('servicio-id-actualizar').value = '';
    document.getElementById('nuevo-nombre-servicio').value = '';
    document.getElementById('nuevo-codigo-servicio').value = '';
    
    document.getElementById('nuevo-nombre-servicio').classList.remove('is-invalid');
    document.getElementById('nuevo-codigo-servicio').classList.remove('is-invalid');
}

/**
 * Cargar servicios para actualizar
 */
function cargarServiciosParaActualizar() {
    console.log("📥 Cargando servicios para actualizar");
    
    document.getElementById('lista-servicios-actualizar').innerHTML = `
        <div class="loading-actualizar">
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
            serviciosActualizar = data;
            renderizarListaServiciosActualizar(data);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            document.getElementById('lista-servicios-actualizar').innerHTML = `
                <div class="error-actualizar">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar servicios</p>
                </div>
            `;
        });
}

/**
 * Renderizar lista de servicios para actualizar
 */
function renderizarListaServiciosActualizar(servicios) {
    const contenedor = document.getElementById('lista-servicios-actualizar');
    
    if (!servicios || servicios.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-servicios-actualizar">
                <i class="fas fa-inbox"></i>
                <p>No hay servicios registrados</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    servicios.forEach(servicio => {
        html += `
            <div class="servicio-item-search" onclick="seleccionarServicioActualizar(${servicio.id_servicio}, event)">
                <div class="servicio-info-search">
                    <div class="servicio-nombre-search">${servicio.nombre_servicio}</div>
                    <div class="servicio-codigo-search">${servicio.codigo_servicio}</div>
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

/**
 * Buscar servicios para actualizar
 */
function buscarServiciosActualizar() {
    const termino = document.getElementById('buscar-servicio-actualizar').value.toLowerCase().trim();
    
    if (!termino) {
        renderizarListaServiciosActualizar(serviciosActualizar);
        return;
    }
    
    const filtrados = serviciosActualizar.filter(servicio => 
        servicio.nombre_servicio.toLowerCase().includes(termino) ||
        servicio.codigo_servicio.toLowerCase().includes(termino)
    );
    
    if (filtrados.length === 0) {
        document.getElementById('lista-servicios-actualizar').innerHTML = `
            <div class="no-resultados-actualizar">
                <i class="fas fa-search"></i>
                <p>No se encontraron servicios</p>
            </div>
        `;
    } else {
        renderizarListaServiciosActualizar(filtrados);
    }
}

/**
 * Seleccionar servicio para actualizar
 */
function seleccionarServicioActualizar(idServicio, event = null) {
    console.log(`🎯 Seleccionando servicio ID: ${idServicio}`);
    
    // Usar el evento pasado como parámetro o el evento global
    const targetEvent = event || window.event;
    
    // Remover selección anterior
    document.querySelectorAll('.servicio-item-search').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Agregar selección al elemento clickeado
    if (targetEvent && targetEvent.currentTarget) {
        targetEvent.currentTarget.classList.add('selected');
    } else {
        // Fallback: buscar el elemento por ID
        const elementos = document.querySelectorAll('.servicio-item-search');
        elementos.forEach(item => {
            if (item.onclick && item.onclick.toString().includes(`seleccionarServicioActualizar(${idServicio})`)) {
                item.classList.add('selected');
            }
        });
    }
    
    // Obtener servicio
    servicioSeleccionadoActualizar = serviciosActualizar.find(s => s.id_servicio === idServicio);
    
    if (!servicioSeleccionadoActualizar) {
        console.error('❌ Servicio no encontrado');
        return;
    }
    
    // Cargar datos en formulario
    document.getElementById('servicio-id-actualizar').value = servicioSeleccionadoActualizar.id_servicio;
    document.getElementById('nuevo-nombre-servicio').value = servicioSeleccionadoActualizar.nombre_servicio;
    document.getElementById('nuevo-codigo-servicio').value = servicioSeleccionadoActualizar.codigo_servicio;
    
    // Mostrar sección de edición
    document.getElementById('form-edicion-actualizar').style.display = 'block';
    document.getElementById('btn-actualizar-servicio').disabled = false;
}

/**
 * Validar formulario de actualización
 */
function validarFormularioActualizar() {
    const nombre = document.getElementById('nuevo-nombre-servicio').value.trim();
    const codigo = document.getElementById('nuevo-codigo-servicio').value.trim();
    let esValido = true;

    if (!nombre) {
        document.getElementById('nuevo-nombre-servicio').classList.add('is-invalid');
        esValido = false;
    } else {
        document.getElementById('nuevo-nombre-servicio').classList.remove('is-invalid');
    }

    if (!codigo) {
        document.getElementById('nuevo-codigo-servicio').classList.add('is-invalid');
        esValido = false;
    } else {
        document.getElementById('nuevo-codigo-servicio').classList.remove('is-invalid');
    }

    return esValido;
}

/**
 * Actualizar servicio
 */
function actualizarServicio() {
    if (!servicioSeleccionadoActualizar) {
        mostrarAlerta('No hay servicio seleccionado', 'error');
        return;
    }
    
    if (!validarFormularioActualizar()) {
        mostrarAlerta('Complete todos los campos', 'error');
        return;
    }

    const nuevoNombre = document.getElementById('nuevo-nombre-servicio').value.trim();
    const nuevoCodigo = document.getElementById('nuevo-codigo-servicio').value.trim();

    // Verificar cambios
    if (nuevoNombre === servicioSeleccionadoActualizar.nombre_servicio && 
        nuevoCodigo === servicioSeleccionadoActualizar.codigo_servicio) {
        mostrarAlerta('No se realizaron cambios', 'info');
        return;
    }

    const datos = {
        nombre_servicio: nuevoNombre,
        codigo_servicio: nuevoCodigo
    };

    // Loading
    const btnActualizar = document.getElementById('btn-actualizar-servicio');
    const textoOriginal = btnActualizar.innerHTML;
    btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    btnActualizar.disabled = true;

    // Enviar PUT - CORREGIDO: usar getCSRFToken()
    fetch(`/api/servicios-emergencia-web/${servicioSeleccionadoActualizar.id_servicio}/editar/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()  // ← CORREGIDO
        },
        body: JSON.stringify(datos)
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
        console.log("✅ Servicio actualizado:", data);
        cerrarModalActualizarServicio();
        mostrarAlerta(data.mensaje || 'Servicio actualizado', 'success');
        
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
        btnActualizar.innerHTML = textoOriginal;
        btnActualizar.disabled = false;
    });
}

/**
 * Configurar eventos del modal actualizar
 */
function configurarEventosActualizar() {
    // Validación en tiempo real
    document.getElementById('nuevo-nombre-servicio').addEventListener('input', function() {
        if (this.value.trim()) this.classList.remove('is-invalid');
    });
    
    document.getElementById('nuevo-codigo-servicio').addEventListener('input', function() {
        if (this.value.trim()) this.classList.remove('is-invalid');
    });

    // Enter en búsqueda
    document.getElementById('buscar-servicio-actualizar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarServiciosActualizar();
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
    console.log("✅ Módulo actualizar servicios inicializado");
    configurarEventosActualizar();
});
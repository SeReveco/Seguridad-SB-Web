// =============================================
// AGREGAR SERVICIOS DE EMERGENCIA
// =============================================

/**
 * Abrir modal para agregar nuevo servicio
 */
function abrirModalServicio() {
    console.log("🔧 Abriendo modal para agregar servicio");
    document.getElementById('modal-servicio').style.display = 'block';
    limpiarFormularioAgregar();
}

/**
 * Cerrar modal de agregar servicio
 */
function cerrarModalServicio() {
    document.getElementById('modal-servicio').style.display = 'none';
}

/**
 * Limpiar formulario de agregar servicio
 */
function limpiarFormularioAgregar() {
    document.getElementById('nombre-servicio').value = '';
    document.getElementById('codigo-servicio').value = '';
    document.getElementById('nombre-servicio').classList.remove('is-invalid');
    document.getElementById('codigo-servicio').classList.remove('is-invalid');
}

/**
 * Validar formulario de servicio
 */
function validarFormularioServicio() {
    const nombre = document.getElementById('nombre-servicio').value.trim();
    const codigo = document.getElementById('codigo-servicio').value.trim();
    let esValido = true;

    if (!nombre) {
        document.getElementById('nombre-servicio').classList.add('is-invalid');
        esValido = false;
    } else {
        document.getElementById('nombre-servicio').classList.remove('is-invalid');
    }

    if (!codigo) {
        document.getElementById('codigo-servicio').classList.add('is-invalid');
        esValido = false;
    } else {
        document.getElementById('codigo-servicio').classList.remove('is-invalid');
    }

    return esValido;
}

/**
 * Guardar nuevo servicio de emergencia
 */
function guardarServicio() {
    console.log("💾 Intentando guardar nuevo servicio");
    
    if (!validarFormularioServicio()) {
        mostrarAlerta('Por favor complete todos los campos requeridos', 'error');
        return;
    }

    const nombre = document.getElementById('nombre-servicio').value.trim();
    const codigo = document.getElementById('codigo-servicio').value.trim();

    const datosServicio = {
        nombre_servicio: nombre,
        codigo_servicio: codigo
    };

    console.log("📤 Enviando datos:", datosServicio);

    // Mostrar loading
    const btnGuardar = document.querySelector('#modal-servicio .btn-guardar');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btnGuardar.disabled = true;

    // Enviar solicitud POST
    fetch('/api/servicios-emergencia-web/crear/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(datosServicio)
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
        console.log("✅ Servicio guardado:", data);
        cerrarModalServicio();
        mostrarAlerta(data.mensaje || 'Servicio creado correctamente', 'success');
        
        // Recargar lista
        if (typeof cargarServicios === 'function') {
            cargarServicios();
        }
    })
    .catch(error => {
        console.error('❌ Error al guardar:', error);
        mostrarAlerta(error.message, 'error');
    })
    .finally(() => {
        btnGuardar.innerHTML = textoOriginal;
        btnGuardar.disabled = false;
    });
}

/**
 * Configurar eventos del modal agregar
 */
function configurarEventosAgregar() {
    // Validación en tiempo real
    document.getElementById('nombre-servicio').addEventListener('input', function() {
        if (this.value.trim()) this.classList.remove('is-invalid');
    });
    
    document.getElementById('codigo-servicio').addEventListener('input', function() {
        if (this.value.trim()) this.classList.remove('is-invalid');
    });

    // Enter para guardar
    document.getElementById('form-servicio').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            guardarServicio();
        }
    });

    // Generar código automático
    document.getElementById('nombre-servicio').addEventListener('blur', function() {
        const nombre = this.value.trim();
        const codigoInput = document.getElementById('codigo-servicio');
        
        if (nombre && !codigoInput.value.trim()) {
            codigoInput.value = nombre.substring(0, 3).toUpperCase();
        }
    });
}

// ✅ FUNCIONES DE UTILIDAD - AGREGADAS DIRECTAMENTE
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

// Configurar cierre de modales al hacer click fuera
function configurarCierreModales() {
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Módulo agregar servicios inicializado");
    configurarEventosAgregar();
    configurarCierreModales();
});
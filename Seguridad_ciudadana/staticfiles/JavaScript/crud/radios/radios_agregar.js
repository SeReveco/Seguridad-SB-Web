// radios_agregar.js - Funciones para agregar radios

let radioEditando = null;

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    const iconos = {
        'success': 'success',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };
    
    Swal.fire({
        icon: iconos[tipo] || 'info',
        title: mensaje,
        confirmButtonColor: '#007bff',
        timer: tipo === 'success' ? 3000 : 4000,
        timerProgressBar: true
    });
}

// Función para obtener CSRF token
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Función para abrir modal de radio
function abrirModalRadio() {
    console.log("📻 Abriendo modal para agregar radio");
    radioEditando = null;
    document.getElementById('modal-radio').style.display = 'block';
    document.getElementById('form-radio').reset();
}

// Función para cerrar modal de radio
function cerrarModalRadio() {
    console.log("❌ Cerrando modal de radio");
    document.getElementById('modal-radio').style.display = 'none';
    radioEditando = null;
}

// Función principal para agregar radio
function agregarRadio(event) {
    event.preventDefault();
    console.log("💾 Intentando guardar radio...");

    const formData = {
        nombre_radio: document.getElementById('nombre-radio').value.trim(),
        codigo_radio: document.getElementById('codigo-radio').value.trim(),
        descripcion_radio: document.getElementById('descripcion-radio').value.trim(),
        estado_radio: document.getElementById('estado-radio').value
    };

    // Validaciones
    if (!formData.nombre_radio || !formData.codigo_radio || !formData.estado_radio) {
        mostrarAlerta('error', 'Por favor complete todos los campos requeridos');
        return;
    }

    if (formData.nombre_radio.length < 2) {
        mostrarAlerta('error', 'El nombre del radio debe tener al menos 2 caracteres');
        return;
    }

    if (formData.codigo_radio.length < 2) {
        mostrarAlerta('error', 'El código del radio debe tener al menos 2 caracteres');
        return;
    }

    const url = '/api/radios-web/crear/';
    const method = 'POST';

    console.log("📤 Enviando datos:", formData);

    // Mostrar loading
    const btnGuardar = document.querySelector('#form-radio .btn-guardar');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btnGuardar.disabled = true;

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Error del servidor'); });
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Radio guardado exitosamente:", data);
        cerrarModalRadio();
        mostrarAlerta('success', data.mensaje || 'Radio creado correctamente');
        
        // Recargar la lista de radios
        if (typeof listarRadios === 'function') {
            listarRadios();
        }
    })
    .catch(error => {
        console.error('❌ Error al guardar radio:', error);
        mostrarAlerta('error', error.message || 'Error al crear el radio');
    })
    .finally(() => {
        // Restaurar botón
        btnGuardar.innerHTML = originalText;
        btnGuardar.disabled = false;
    });
}

// Función para manejar el cierre del modal con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModalRadio();
        if (typeof cerrarModalActualizarRadio === 'function') {
            cerrarModalActualizarRadio();
        }
        if (typeof cerrarModalEliminarRadio === 'function') {
            cerrarModalEliminarRadio();
        }
    }
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal-radio');
    if (event.target === modal) {
        cerrarModalRadio();
    }
});

console.log("✅ radios_agregar.js cargado correctamente");
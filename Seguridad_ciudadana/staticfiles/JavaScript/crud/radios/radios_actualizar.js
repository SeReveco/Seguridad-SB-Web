// radios_actualizar.js - Funciones para actualizar radios

let radioSeleccionadoActualizar = null;

// Función para mostrar alertas (si no está definida globalmente)
if (typeof mostrarAlerta === 'undefined') {
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
}

// Función para obtener CSRF token (si no está definida globalmente)
if (typeof getCSRFToken === 'undefined') {
    function getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }
}

// Función auxiliar para escapar HTML (si no está definida globalmente)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Función auxiliar para obtener clase CSS según estado (si no está definida globalmente)
if (typeof getClaseEstado === 'undefined') {
    function getClaseEstado(estado) {
        switch(estado) {
            case 'Disponible': return 'estado-disponible';
            case 'No Disponible': return 'estado-no-disponible';
            default: return 'estado-no-disponible';
        }
    }
}

// Función para abrir modal de actualización
function abrirModalActualizarRadio() {
    console.log("📻 Abriendo modal para actualizar radio");
    document.getElementById('modal-actualizar-radio').style.display = 'block';
    document.getElementById('form-actualizar-radio').reset();
    document.getElementById('info-radio-actualizar').style.display = 'none';
    document.getElementById('form-edicion-actualizar').style.display = 'none';
    document.getElementById('btn-actualizar-radio').disabled = true;
    radioSeleccionadoActualizar = null;
    
    // Limpiar lista de resultados
    const listaRadios = document.getElementById('lista-radios-actualizar');
    if (listaRadios) {
        listaRadios.innerHTML = '';
    }
}

// Función para cerrar modal de actualización
function cerrarModalActualizarRadio() {
    console.log("❌ Cerrando modal de actualización de radio");
    document.getElementById('modal-actualizar-radio').style.display = 'none';
    radioSeleccionadoActualizar = null;
}

// Función para buscar radios en actualización
function buscarRadiosActualizar() {
    const searchTerm = document.getElementById('buscar-radio-actualizar').value.toLowerCase();
    const listaRadios = document.getElementById('lista-radios-actualizar');
    
    if (!listaRadios) {
        console.error('❌ No se encontró el elemento lista-radios-actualizar');
        return;
    }
    
    // Verificar si window.radiosData está disponible
    if (!window.radiosData || window.radiosData.length === 0) {
        console.warn('⚠️ window.radiosData no está disponible');
        listaRadios.innerHTML = '<div class="no-resultados">No hay datos de radios disponibles</div>';
        return;
    }
    
    if (searchTerm.length < 2) {
        listaRadios.innerHTML = '<div class="no-resultados">Ingrese al menos 2 caracteres para buscar</div>';
        return;
    }

    const radiosFiltrados = window.radiosData.filter(radio => 
        radio.nombre_radio.toLowerCase().includes(searchTerm) ||
        radio.codigo_radio.toLowerCase().includes(searchTerm) ||
        (radio.descripcion_radio && radio.descripcion_radio.toLowerCase().includes(searchTerm))
    );

    if (radiosFiltrados.length === 0) {
        listaRadios.innerHTML = '<div class="no-resultados">No se encontraron radios</div>';
        return;
    }

    listaRadios.innerHTML = radiosFiltrados.map(radio => `
        <div class="radio-item-search" onclick="seleccionarRadioActualizar(${radio.id_radio}, this)">
            <div class="radio-info-search">
                <div>
                    <div class="radio-nombre-search">${escapeHtml(radio.nombre_radio)}</div>
                    <div class="radio-codigo-search">${escapeHtml(radio.codigo_radio)}</div>
                </div>
                <span class="radio-estado ${getClaseEstado(radio.estado_radio)}">
                    ${escapeHtml(radio.estado_radio)}
                </span>
            </div>
        </div>
    `).join('');
}

// CORREGIDO: Función para seleccionar radio en actualización - ahora recibe el elemento
function seleccionarRadioActualizar(radioId, elemento) {
    console.log(`🎯 Seleccionando radio para actualizar ID: ${radioId}`);
    
    // Usar window.radiosData que es global
    const radiosDisponibles = window.radiosData || [];
    const radio = radiosDisponibles.find(r => r.id_radio === radioId);
    
    if (!radio) {
        mostrarAlerta('error', 'Radio no encontrado');
        return;
    }

    radioSeleccionadoActualizar = radio;

    // Actualizar información mostrada
    document.getElementById('nombre-radio-actualizar').textContent = radio.nombre_radio;
    document.getElementById('codigo-radio-actualizar').textContent = radio.codigo_radio;
    document.getElementById('descripcion-radio-actualizar').textContent = radio.descripcion_radio || 'Sin descripción';
    
    const estadoBadge = document.getElementById('estado-radio-actualizar');
    estadoBadge.textContent = radio.estado_radio;
    estadoBadge.className = `estado-badge ${getClaseEstado(radio.estado_radio)}`;

    // Llenar formulario de edición
    document.getElementById('nuevo-nombre').value = radio.nombre_radio;
    document.getElementById('nuevo-codigo').value = radio.codigo_radio;
    document.getElementById('nuevo-estado').value = radio.estado_radio;
    document.getElementById('nueva-descripcion').value = radio.descripcion_radio || '';

    // Mostrar secciones
    document.getElementById('info-radio-actualizar').style.display = 'block';
    document.getElementById('form-edicion-actualizar').style.display = 'block';
    document.getElementById('btn-actualizar-radio').disabled = false;

    // Remover selección anterior y agregar nueva
    document.querySelectorAll('.radio-item-search').forEach(item => {
        item.classList.remove('selected');
    });
    
    // CORREGIDO: Usar el elemento pasado como parámetro
    if (elemento) {
        elemento.classList.add('selected');
    }
}

// Función para cargar radio para editar (desde lista)
function cargarRadioParaEditar(radioId) {
    console.log(`✏️ Cargando radio para edición ID: ${radioId}`);
    
    fetch(`/api/radios-web/${radioId}/obtener/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener datos del radio');
            }
            return response.json();
        })
        .then(radio => {
            // Abrir modal de actualización y seleccionar el radio
            abrirModalActualizarRadio();
            
            // Simular búsqueda y selección
            const buscarInput = document.getElementById('buscar-radio-actualizar');
            if (buscarInput) {
                buscarInput.value = radio.nombre_radio;
            }
            
            // Buscar y mostrar resultados
            buscarRadiosActualizar();
            
            // Seleccionar el radio después de un breve delay
            setTimeout(() => {
                // Encontrar el elemento en la lista y seleccionarlo
                const radioElement = document.querySelector(`[onclick*="seleccionarRadioActualizar(${radioId}"]`);
                if (radioElement) {
                    seleccionarRadioActualizar(radioId, radioElement);
                }
            }, 300);
        })
        .catch(error => {
            console.error('❌ Error al cargar radio para editar:', error);
            mostrarAlerta('error', 'Error al cargar datos del radio');
        });
}

// Función principal para actualizar radio
function actualizarRadio() {
    if (!radioSeleccionadoActualizar) {
        mostrarAlerta('error', 'No hay ningún radio seleccionado');
        return;
    }

    const formData = {
        nombre_radio: document.getElementById('nuevo-nombre').value.trim(),
        codigo_radio: document.getElementById('nuevo-codigo').value.trim(),
        descripcion_radio: document.getElementById('nueva-descripcion').value.trim(),
        estado_radio: document.getElementById('nuevo-estado').value
    };

    // Validaciones
    if (!formData.nombre_radio || !formData.codigo_radio || !formData.estado_radio) {
        mostrarAlerta('error', 'Por favor complete todos los campos requeridos');
        return;
    }

    console.log("📤 Actualizando radio:", formData);

    // Mostrar loading
    const btnActualizar = document.getElementById('btn-actualizar-radio');
    const originalText = btnActualizar.innerHTML;
    btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    btnActualizar.disabled = true;

    fetch(`/api/radios-web/${radioSeleccionadoActualizar.id_radio}/editar/`, {
        method: 'PUT',
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
        console.log("✅ Radio actualizado exitosamente:", data);
        cerrarModalActualizarRadio();
        mostrarAlerta('success', data.mensaje || 'Radio actualizado correctamente');
        
        // Recargar la lista de radios
        if (typeof listarRadios === 'function') {
            listarRadios();
        }
    })
    .catch(error => {
        console.error('❌ Error al actualizar radio:', error);
        mostrarAlerta('error', error.message || 'Error al actualizar el radio');
    })
    .finally(() => {
        // Restaurar botón
        btnActualizar.innerHTML = originalText;
        btnActualizar.disabled = false;
    });
}

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal-actualizar-radio');
    if (event.target === modal) {
        cerrarModalActualizarRadio();
    }
});

// Hacer funciones globales
window.abrirModalActualizarRadio = abrirModalActualizarRadio;
window.cerrarModalActualizarRadio = cerrarModalActualizarRadio;
window.buscarRadiosActualizar = buscarRadiosActualizar;
window.seleccionarRadioActualizar = seleccionarRadioActualizar;
window.cargarRadioParaEditar = cargarRadioParaEditar;
window.actualizarRadio = actualizarRadio;

console.log("✅ radios_actualizar.js cargado correctamente");
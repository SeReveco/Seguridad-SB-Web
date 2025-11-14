// =============================================
// FUNCIONES PARA AGREGAR VEHÍCULOS
// =============================================

// Variables globales
let vehiculoEditando = null;

// Función para abrir el modal de agregar vehículo
function abrirModalVehiculo() {
    document.getElementById('modal-vehiculo').style.display = 'block';
    document.getElementById('form-vehiculo').reset();
    vehiculoEditando = null;
    
    // Cargar tipos de vehículo al abrir el modal
    cargarTiposVehiculo();
}

// Función para cerrar el modal de agregar vehículo
function cerrarModalVehiculo() {
    document.getElementById('modal-vehiculo').style.display = 'none';
    document.getElementById('form-vehiculo').reset();
    vehiculoEditando = null;
}

// Función para agregar nuevo tipo de vehículo - VERSIÓN CORREGIDA
function agregarNuevoTipoVehiculo() {
    console.log("🔘 Botón 'Nuevo Tipo' clickeado");
    
    // Buscar el contenedor de forma más flexible
    const inputGroup = document.querySelector('.input-group');
    
    // Si no encuentra por clase, buscar por estructura
    if (!inputGroup) {
        console.log("🔍 Buscando contenedor alternativo...");
        // Buscar el div que contiene el select y el botón
        const select = document.getElementById('id-tipo-vehiculo');
        if (select && select.parentNode) {
            inputGroup = select.parentNode;
            console.log("✅ Contenedor encontrado por parentNode:", inputGroup);
        }
    }
    
    if (!inputGroup) {
        console.error("❌ No se pudo encontrar el contenedor del formulario");
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo inicializar el formulario',
            confirmButtonColor: '#dc3545'
        });
        return;
    }
    
    console.log("✅ Contenedor encontrado:", inputGroup);
    
    let inputNuevoTipo = document.getElementById('input-nuevo-tipo');
    
    // Si no existe el input, crearlo
    if (!inputNuevoTipo) {
        console.log("📝 Creando nuevo input para tipo de vehículo");
        
        inputNuevoTipo = document.createElement('div');
        inputNuevoTipo.id = 'input-nuevo-tipo';
        inputNuevoTipo.className = 'input-nuevo-tipo';
        inputNuevoTipo.innerHTML = `
            <div class="nuevo-tipo-container">
                <input type="text" id="nombre-nuevo-tipo" placeholder="Ej: Automóvil, Motocicleta, Camioneta..." 
                       class="input-nuevo-tipo-field">
                <div class="nuevo-tipo-buttons">
                    <button type="button" onclick="guardarNuevoTipoVehiculo()" class="btn-guardar-tipo">
                        <i class="fa-solid fa-check"></i> Guardar
                    </button>
                    <button type="button" onclick="cancelarNuevoTipoVehiculo()" class="btn-cancelar-tipo">
                        <i class="fa-solid fa-xmark"></i> Cancelar
                    </button>
                </div>
            </div>
        `;
        
        // Insertar después del contenedor actual
        inputGroup.parentNode.insertBefore(inputNuevoTipo, inputGroup.nextSibling);
        
        console.log("✅ Input creado e insertado correctamente");
    }
    
    // Mostrar el input
    inputNuevoTipo.style.display = 'block';
    
    // Enfocar el input
    setTimeout(() => {
        const inputField = document.getElementById('nombre-nuevo-tipo');
        if (inputField) {
            inputField.focus();
            console.log("🎯 Input enfocado");
        }
    }, 100);
    
    // Ocultar el botón "Nuevo Tipo" temporalmente
    const btnNuevoTipo = document.querySelector('button[onclick="agregarNuevoTipoVehiculo()"]');
    if (btnNuevoTipo) {
        btnNuevoTipo.style.display = 'none';
        console.log("🔘 Botón ocultado temporalmente");
    }
}

// Función para guardar el nuevo tipo de vehículo
async function guardarNuevoTipoVehiculo() {
    const inputField = document.getElementById('nombre-nuevo-tipo');
    const tipoNombre = inputField.value.trim();
    
    if (!tipoNombre) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'Debe ingresar un nombre para el tipo de vehículo',
            confirmButtonColor: '#ffc107'
        });
        inputField.focus();
        return;
    }
    
    if (tipoNombre.length < 3) {
        Swal.fire({
            icon: 'warning',
            title: 'Nombre muy corto',
            text: 'El nombre debe tener al menos 3 caracteres',
            confirmButtonColor: '#ffc107'
        });
        inputField.focus();
        return;
    }
    
    try {
        const response = await fetch('/api/tipos-vehiculos-web/crear/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                nombre_tipo_vehiculo: tipoNombre
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Éxito
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: data.mensaje || 'Tipo de vehículo agregado correctamente',
                confirmButtonColor: '#28a745',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Limpiar y ocultar el input
            cancelarNuevoTipoVehiculo();
            
            // Recargar los tipos de vehículo
            await cargarTiposVehiculo();
            
            // Seleccionar el nuevo tipo
            const select = document.getElementById('id-tipo-vehiculo');
            if (data.tipo_vehiculo && data.tipo_vehiculo.id_tipo_vehiculo) {
                select.value = data.tipo_vehiculo.id_tipo_vehiculo;
            }
            
        } else {
            throw new Error(data.error || 'Error al agregar el tipo de vehículo');
        }
    } catch (error) {
        console.error('Error al agregar tipo de vehículo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

// Función para cancelar la creación de nuevo tipo
function cancelarNuevoTipoVehiculo() {
    const inputNuevoTipo = document.getElementById('input-nuevo-tipo');
    if (inputNuevoTipo) {
        inputNuevoTipo.style.display = 'none';
        
        // Limpiar el input
        const inputField = document.getElementById('nombre-nuevo-tipo');
        if (inputField) {
            inputField.value = '';
        }
    }
    
    // Mostrar el botón "Nuevo Tipo" nuevamente
    const btnNuevoTipo = document.querySelector('.btn-nuevo-tipo');
    if (btnNuevoTipo) {
        btnNuevoTipo.style.display = 'flex';
    }
}

// Función para cargar tipos de vehículo
async function cargarTiposVehiculo() {
    try {
        const response = await fetch('/api/tipos-vehiculos-web/');
        
        if (!response.ok) {
            throw new Error('Error al cargar tipos de vehículo');
        }
        
        const tipos = await response.json();
        const select = document.getElementById('id-tipo-vehiculo');
        const currentValue = select.value;
        
        // Limpiar opciones excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Agregar tipos
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id_tipo_vehiculo;
            option.textContent = tipo.nombre_tipo_vehiculo;
            select.appendChild(option);
        });

        // Restaurar valor seleccionado si existe
        if (currentValue) {
            select.value = currentValue;
        }
        
    } catch (error) {
        console.error('Error al cargar tipos de vehículo:', error);
    }
}

// Función principal para agregar vehículo
async function agregarVehiculo(event) {
    event.preventDefault();
    
    const formData = new FormData(document.getElementById('form-vehiculo'));
    const vehiculoData = {
        patente_vehiculo: formData.get('patente_vehiculo').toUpperCase().trim(),
        marca_vehiculo: formData.get('marca_vehiculo').trim(),
        modelo_vehiculo: formData.get('modelo_vehiculo').trim(),
        codigo_vehiculo: formData.get('codigo_vehiculo').toUpperCase().trim(),
        total_kilometraje: parseInt(formData.get('total_kilometraje')) || 0,
        id_tipo_vehiculo: parseInt(formData.get('id_tipo_vehiculo')),
        id_estado_vehiculo: parseInt(formData.get('id_estado_vehiculo'))
    };

    // Validaciones
    if (!validarDatosVehiculo(vehiculoData)) {
        return;
    }

    try {
        const response = await fetch('/api/vehiculos-web/crear/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(vehiculoData)
        });

        const data = await response.json();

        if (response.ok) {
            // Éxito
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: data.mensaje || 'Vehículo agregado correctamente',
                confirmButtonColor: '#28a745'
            });
            
            cerrarModalVehiculo();
            listarVehiculos(); // Recargar la lista
            actualizarEstadisticas(); // Actualizar estadísticas
        } else {
            // Error
            throw new Error(data.error || 'Error al agregar el vehículo');
        }
    } catch (error) {
        console.error('Error al agregar vehículo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}


// Función para validar los datos del vehículo
function validarDatosVehiculo(vehiculoData) {
    // Validar patente (formato chileno: AB123CD o ABC123)
    const patenteRegex = /^[A-Z]{2,3}\d{3}[A-Z]{0,2}$/;
    if (!patenteRegex.test(vehiculoData.patente_vehiculo)) {
        Swal.fire({
            icon: 'warning',
            title: 'Patente inválida',
            text: 'La patente debe tener formato chileno (ej: AB123CD o ABC123)',
            confirmButtonColor: '#ffc107'
        });
        return false;
    }

    // Validar que los campos requeridos no estén vacíos
    const camposRequeridos = [
        'patente_vehiculo', 'marca_vehiculo', 'modelo_vehiculo', 
        'codigo_vehiculo', 'id_tipo_vehiculo', 'id_estado_vehiculo'
    ];

    for (const campo of camposRequeridos) {
        if (!vehiculoData[campo]) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: `El campo ${campo.replace('_', ' ')} es obligatorio`,
                confirmButtonColor: '#ffc107'
            });
            return false;
        }
    }

    // Validar kilometraje no negativo
    if (vehiculoData.total_kilometraje < 0) {
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

// Función para obtener el token CSRF
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// Cerrar modal al hacer click fuera del contenido
window.onclick = function(event) {
    const modal = document.getElementById('modal-vehiculo');
    if (event.target === modal) {
        cerrarModalVehiculo();
    }
}

// Cerrar modal con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModalVehiculo();
    }
});
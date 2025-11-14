// radios_listar.js - Funciones para listar y mostrar radios

let todosLosRadios = [];
let radiosFiltrados = [];

// Función para mostrar alertas
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

// Función auxiliar para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función auxiliar para truncar texto
function truncarTexto(texto, longitud) {
    if (!texto) return '';
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
}

// Función auxiliar para obtener clase CSS según estado
function getClaseEstado(estado) {
    switch(estado) {
        case 'Disponible': return 'estado-disponible';
        case 'No Disponible': return 'estado-no-disponible';
        default: return 'estado-no-disponible';
    }
}

// Función para mostrar estado de carga
function mostrarLoadingRadios() {
    const listaRadios = document.getElementById('lista-radios');
    if (listaRadios) {
        listaRadios.innerHTML = `
            <div class="loading-radios">
                <i class="fas fa-sync fa-spin"></i>
                <p>Cargando radios...</p>
            </div>
        `;
    }
}

// Función para mostrar error
function mostrarErrorRadios(mensaje) {
    const listaRadios = document.getElementById('lista-radios');
    if (listaRadios) {
        listaRadios.innerHTML = `
            <div class="sin-radios">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${mensaje}</p>
                <button onclick="listarRadios()" class="btn-actualizar">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Función principal para listar radios
async function listarRadios() {
    try {
        console.log('📻 Cargando lista de radios...');
        mostrarLoadingRadios();
        
        const response = await fetch('/api/radios-web/');
        
        if (response.status === 403 || response.status === 302) {
            // Redirigir al login si no está autenticado
            window.location.href = '/login/';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        const radios = await response.json();
        console.log(`✅ ${radios.length} radios cargados correctamente`);
        
        window.radiosData = radios;
        window.todosLosRadios = radios;
        window.radiosFiltrados = [...radios];
        mostrarRadiosEnLista(radios);
        actualizarEstadisticasRadios(radios);
        
    } catch (error) {
        console.error('❌ Error al cargar radios:', error);
        
        if (error.message.includes('auth') || error.message.includes('login')) {
            mostrarErrorRadios('Sesión expirada. Redirigiendo al login...');
            setTimeout(() => {
                window.location.href = '/login/';
            }, 2000);
        } else {
            mostrarErrorRadios('Error al cargar los radios: ' + error.message);
        }
    }
}

// Función para mostrar radios en la lista
function mostrarRadiosEnLista(radios) {
    const contenedor = document.getElementById('lista-radios');
    
    if (!contenedor) {
        console.error('❌ No se encontró el elemento lista-radios');
        return;
    }
    
    if (!radios || radios.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-radios">
                <i class="fas fa-walkie-talkie"></i>
                <h3>No hay radios registrados</h3>
                <p>Agrega el primer radio haciendo clic en el botón "Agregar Nuevo Radio"</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = radios.map(radio => crearCardRadio(radio)).join('');
}

// Función para crear el HTML de cada card de radio
function crearCardRadio(radio) {
    const estadoClass = getClaseEstado(radio.estado_radio);
    
    // Formatear fecha correctamente - MEJORADO
    let fechaFormateada = 'No disponible';
    
    if (radio.fecha_creacion_radio) {
        try {
            console.log(`📅 Fecha original para radio ${radio.id_radio}:`, radio.fecha_creacion_radio);
            
            // Intentar diferentes métodos de parseo
            let fecha;
            
            // Método 1: Si ya es una fecha formateada (string)
            if (typeof radio.fecha_creacion_radio === 'string') {
                // Intentar parsear como ISO string
                fecha = new Date(radio.fecha_creacion_radio);
                
                // Si no es válida, intentar otros formatos
                if (isNaN(fecha.getTime())) {
                    // Intentar parsear formato Django común: "12/12/2023 15:30"
                    const partes = radio.fecha_creacion_radio.split(' ');
                    if (partes.length === 2) {
                        const [fechaStr, horaStr] = partes;
                        const [dia, mes, anio] = fechaStr.split('/');
                        const [horas, minutos] = horaStr.split(':');
                        fecha = new Date(anio, mes - 1, dia, horas, minutos);
                    }
                }
            } 
            // Método 2: Si es un timestamp
            else if (typeof radio.fecha_creacion_radio === 'number') {
                fecha = new Date(radio.fecha_creacion_radio);
            }
            
            // Verificar si la fecha es válida después de todos los intentos
            if (fecha && !isNaN(fecha.getTime())) {
                fechaFormateada = fecha.toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                console.log(`✅ Fecha formateada correctamente: ${fechaFormateada}`);
            } else {
                // Si no podemos parsear, mostrar el valor original
                fechaFormateada = String(radio.fecha_creacion_radio).substring(0, 16);
                console.warn(`⚠️ Usando fecha original: ${fechaFormateada}`);
            }
            
        } catch (error) {
            console.error(`❌ Error formateando fecha para radio ${radio.id_radio}:`, error);
            // Mostrar el valor original truncado
            fechaFormateada = String(radio.fecha_creacion_radio).substring(0, 16);
        }
    } else {
        console.warn(`⚠️ Radio ${radio.id_radio} no tiene fecha_creacion_radio`);
    }
    
    return `
        <div class="radio-card" data-radio-id="${radio.id_radio}">
            <div class="radio-header">
                <div class="radio-nombre">${escapeHtml(radio.nombre_radio)}</div>
                <div class="radio-estado ${estadoClass}">
                    ${escapeHtml(radio.estado_radio)}
                </div>
            </div>
            
            <div class="radio-info">
                <div class="radio-dato">
                    <strong><i class="fa-solid fa-barcode"></i> Código:</strong>
                    <span class="codigo-radio">${escapeHtml(radio.codigo_radio)}</span>
                </div>
                <div class="radio-dato">
                    <strong><i class="fa-solid fa-calendar"></i> Fecha Registro:</strong>
                    <span>${fechaFormateada}</span>
                </div>
                ${radio.descripcion_radio ? `
                <div class="radio-dato">
                    <strong><i class="fa-solid fa-file-lines"></i> Descripción:</strong>
                    <span class="descripcion-radio">${truncarTexto(radio.descripcion_radio, 60)}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="radio-acciones">
                <button class="btn-editar-radio" onclick="editarRadioDesdeLista(${radio.id_radio})">
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn-eliminar-radio-card" onclick="eliminarRadioDesdeLista(${radio.id_radio})">
                    <i class="fa-solid fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

// Función para actualizar estadísticas de radios
function actualizarEstadisticasRadios(radios = todosLosRadios) {
    if (!radios || radios.length === 0) {
        // Actualizar elementos solo si existen
        const totalElement = document.getElementById('total-radios');
        const disponiblesElement = document.getElementById('radios-disponibles');
        const noDisponiblesElement = document.getElementById('radios-no-disponibles');
        
        if (totalElement) totalElement.textContent = '0';
        if (disponiblesElement) disponiblesElement.textContent = '0';
        if (noDisponiblesElement) noDisponiblesElement.textContent = '0';
        return;
    }

    const totalRadios = radios.length;
    const radiosDisponibles = radios.filter(r => r.estado_radio === 'Disponible').length;
    const radiosNoDisponibles = radios.filter(r => r.estado_radio === 'No Disponible').length;

    // Debug en consola
    console.log(`📊 Estadísticas de radios:`);
    console.log(`   Total: ${totalRadios}`);
    console.log(`   Disponibles: ${radiosDisponibles}`);
    console.log(`   No Disponibles: ${radiosNoDisponibles}`);

    // Actualizar elementos solo si existen
    const totalElement = document.getElementById('total-radios');
    const disponiblesElement = document.getElementById('radios-disponibles');
    const noDisponiblesElement = document.getElementById('radios-no-disponibles');
    
    if (totalElement) totalElement.textContent = totalRadios.toLocaleString();
    if (disponiblesElement) disponiblesElement.textContent = radiosDisponibles.toLocaleString();
    if (noDisponiblesElement) noDisponiblesElement.textContent = radiosNoDisponibles.toLocaleString();
}

// Función para filtrar radios
function filtrarRadios() {
    const busquedaInput = document.getElementById('buscar-radios');
    if (!busquedaInput) return;
    
    const busqueda = busquedaInput.value.toLowerCase().trim();
    
    if (!busqueda) {
        radiosFiltrados = [...todosLosRadios];
    } else {
        radiosFiltrados = todosLosRadios.filter(radio => 
            radio.nombre_radio.toLowerCase().includes(busqueda) ||
            radio.codigo_radio.toLowerCase().includes(busqueda) ||
            (radio.descripcion_radio && radio.descripcion_radio.toLowerCase().includes(busqueda)) ||
            radio.estado_radio.toLowerCase().includes(busqueda)
        );
    }
    
    mostrarRadiosEnLista(radiosFiltrados);
    
    // Mostrar mensaje si no hay resultados
    const contenedor = document.getElementById('lista-radios');
    if (radiosFiltrados.length === 0 && busqueda && contenedor) {
        contenedor.innerHTML = `
            <div class="no-resultados">
                <i class="fa-solid fa-search"></i>
                <h3>No se encontraron radios</h3>
                <p>No hay resultados para "${busqueda}"</p>
            </div>
        `;
    }
}

// Función para editar radio desde la lista
function editarRadioDesdeLista(radioId) {
    console.log(`✏️ Editando radio desde lista ID: ${radioId}`);
    if (typeof cargarRadioParaEditar === 'function') {
        cargarRadioParaEditar(radioId);
    } else {
        console.error('❌ Función cargarRadioParaEditar no está disponible');
        mostrarAlerta('error', 'Función de edición no disponible');
    }
}

// Función para eliminar radio desde la lista
function eliminarRadioDesdeLista(radioId) {
    console.log(`🗑️ Eliminando radio desde lista ID: ${radioId}`);
    const radio = todosLosRadios.find(r => r.id_radio === radioId);
    
    if (radio) {
        Swal.fire({
            title: '¿Eliminar Radio?',
            html: `¿Estás seguro de que deseas eliminar el radio <strong>"${radio.nombre_radio}"</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                if (typeof eliminarRadio === 'function') {
                    eliminarRadio(radioId);
                } else {
                    console.error('❌ Función eliminarRadio no está disponible');
                    mostrarAlerta('error', 'Función de eliminación no disponible');
                }
            }
        });
    }
}

// Cargar radios cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando módulo de listado de radios...');
    
    // Verificar que los elementos existan antes de agregar event listeners
    const buscarInput = document.getElementById('buscar-radios');
    if (buscarInput) {
        buscarInput.addEventListener('input', filtrarRadios);
    } else {
        console.warn('⚠️ No se encontró el input de búsqueda de radios');
    }
    
    listarRadios();
});

console.log("✅ radios_listar.js cargado correctamente");
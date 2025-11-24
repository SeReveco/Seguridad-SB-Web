// =============================================
// LISTAR SERVICIOS DE EMERGENCIA
// =============================================

let servicios = [];
let serviciosFiltrados = [];

/**
 * Cargar servicios desde API
 */
function cargarServicios() {
    console.log("📥 Cargando servicios...");
    
    mostrarLoadingServicios();
    
    fetch('/api/servicios-emergencia-web/')
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log(`✅ ${data.length} servicios cargados`);
            servicios = data;
            serviciosFiltrados = [...data];
            renderizarServicios(data);
            actualizarEstadisticas(data.length);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            mostrarErrorServicios('Error al cargar servicios: ' + error.message);
        });
}

/**
 * Mostrar loading
 */
function mostrarLoadingServicios() {
    document.getElementById('lista-servicios').innerHTML = `
        <div class="loading-servicios">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando servicios...</p>
        </div>
    `;
}

/**
 * Mostrar error
 */
function mostrarErrorServicios(mensaje) {
    document.getElementById('lista-servicios').innerHTML = `
        <div class="error-servicios">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${mensaje}</p>
            <button class="btn-reintentar" onclick="cargarServicios()">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

/**
 * Renderizar servicios en grid
 */
function renderizarServicios(servicios) {
    const contenedor = document.getElementById('lista-servicios');
    
    if (!servicios || servicios.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-servicios">
                <i class="fas fa-ambulance"></i>
                <h4>No hay servicios de emergencia</h4>
                <p>Utilice el botón "Agregar Nuevo Servicio" para comenzar.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    servicios.forEach(servicio => {
        html += `
            <div class="servicio-card">
                <div class="servicio-header">
                    <h3 class="servicio-nombre">${servicio.nombre_servicio}</h3>
                    <span class="servicio-codigo">${servicio.codigo_servicio}</span>
                </div>
                
                <div class="servicio-info">
                    <div class="servicio-dato">
                        <strong>Nombre:</strong>
                        <span>${servicio.nombre_servicio}</span>
                    </div>
                    <div class="servicio-dato">
                        <strong>Código:</strong>
                        <span>${servicio.codigo_servicio}</span>
                    </div>
                </div>
                
                <div class="servicio-acciones">
                    <button class="btn-editar-servicio" onclick="editarServicioDesdeLista(${servicio.id_servicio})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-eliminar-servicio-card" 
                            onclick="eliminarServicioDirecto(${servicio.id_servicio}, '${servicio.nombre_servicio}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

/**
 * Filtrar servicios
 */
function filtrarServicios() {
    const termino = document.getElementById('buscar-servicios').value.toLowerCase().trim();
    
    if (!termino) {
        serviciosFiltrados = [...servicios];
        renderizarServicios(servicios);
        return;
    }
    
    serviciosFiltrados = servicios.filter(servicio => 
        servicio.nombre_servicio.toLowerCase().includes(termino) ||
        servicio.codigo_servicio.toLowerCase().includes(termino)
    );
    
    if (serviciosFiltrados.length === 0) {
        document.getElementById('lista-servicios').innerHTML = `
            <div class="no-resultados">
                <i class="fas fa-search"></i>
                <p>No hay servicios con "${termino}"</p>
            </div>
        `;
    } else {
        renderizarServicios(serviciosFiltrados);
    }
}

/**
 * Actualizar estadísticas
 */
function actualizarEstadisticas(total) {
    const elemento = document.getElementById('total-servicios');
    if (elemento) {
        elemento.textContent = total;
    }
}

/**
 * Editar servicio desde lista
 */
function editarServicioDesdeLista(idServicio) {
    console.log(`✏️ Editando desde lista ID: ${idServicio}`);
    
    // Abrir modal de actualizar
    if (typeof abrirModalActualizarServicio === 'function') {
        abrirModalActualizarServicio();
        
        // Seleccionar servicio después de abrir modal
        setTimeout(() => {
            if (typeof seleccionarServicioActualizar === 'function') {
                // Buscar el servicio en los datos actuales
                const servicio = servicios.find(s => s.id_servicio === idServicio);
                if (servicio) {
                    seleccionarServicioActualizar(idServicio);
                }
            }
        }, 500);
    }
}

/**
 * Descargar lista de servicios como Excel (CSV)
 */
async function descargarExcel() {
    console.log("📊 Generando archivo Excel...");
    
    if (!servicios || servicios.length === 0) {
        mostrarAlerta('No hay servicios para exportar', 'warning');
        return;
    }
    
    const btnExcel = document.querySelector('.btn-descargar-excel');
    const textoOriginal = btnExcel.innerHTML;
    
    try {
        // Mostrar loading
        btnExcel.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        btnExcel.disabled = true;
        
        // Pequeña delay para mejor UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Usar CSV simple - más confiable
        descargarCSVSimple();
        
    } catch (error) {
        console.error('❌ Error al generar archivo:', error);
        mostrarAlerta('Error al generar el archivo', 'error');
    } finally {
        // Restaurar botón
        btnExcel.innerHTML = textoOriginal;
        btnExcel.disabled = false;
    }
}

/**
 * Descargar como CSV simple
 */
function descargarCSVSimple() {
    // Encabezados sin fecha de creación
    const headers = "ID;Nombre del Servicio;Código;Estado\n";
    
    // Filas sin fecha de creación
    const filas = servicios.map(servicio => 
        `${servicio.id_servicio};"${servicio.nombre_servicio}";"${servicio.codigo_servicio}";"Activo"`
    ).join("\n");
    
    const csvContent = headers + filas;
    
    // Crear y descargar archivo
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const fecha = new Date().toISOString().split('T')[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `servicios_emergencia_${fecha}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta(`Archivo exportado correctamente (${servicios.length} registros)`, 'success');
}

/**
 * Configurar eventos de lista
 */
function configurarEventosLista() {
    // Enter en búsqueda
    const buscarInput = document.getElementById('buscar-servicios');
    if (buscarInput) {
        buscarInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filtrarServicios();
            }
        });

        // Limpiar búsqueda con Escape
        buscarInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                filtrarServicios();
            }
        });
    }
}

// ✅ FUNCIONES DE UTILIDAD
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
    console.log("✅ Módulo listar servicios inicializado");
    configurarEventosLista();
    cargarServicios();
});
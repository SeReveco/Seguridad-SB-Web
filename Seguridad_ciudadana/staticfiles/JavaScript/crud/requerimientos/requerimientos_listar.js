// requerimientos_listar.js - VERSIÓN CORREGIDA SIN CONFLICTOS

// Verificar si las variables ya existen para evitar redeclaración
if (typeof window.todosRequerimientos === 'undefined') {
    window.todosRequerimientos = [];
}

if (typeof window.estadisticasGlobales === 'undefined') {
    window.estadisticasGlobales = {
        familias: 0,
        grupos: 0,
        subgrupos: 0,
        requerimientos: 0
    };
}

if (typeof window.filtrosAplicados === 'undefined') {
    window.filtrosAplicados = {
        familia: '',
        grupo: '',
        subgrupo: '',
        clasificacion: ''
    };
}

// ✅ INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Sistema de listado de requerimientos listo');
    // Verificar que no se esté ejecutando múltiples veces
    if (window.paginaListarCargada) {
        console.log('⚠️ La página ya fue cargada, evitando duplicación');
        return;
    }
    window.paginaListarCargada = true;
    
    cargarPaginaCompleta();
    inicializarEventListeners();
});

// ✅ INICIALIZAR TODOS LOS EVENT LISTENERS
function inicializarEventListeners() {
    // Botón de exportar Excel
    const btnExportar = document.getElementById('btn-exportar-excel');
    if (btnExportar && !btnExportar.hasListener) {
        btnExportar.addEventListener('click', exportarAExcel);
        btnExportar.hasListener = true;
        console.log('✅ Botón exportar Excel inicializado');
    }

    // Botón de filtrar
    const btnFiltros = document.getElementById('btn-filtrar-requerimientos');
    if (btnFiltros && !btnFiltros.hasListener) {
        btnFiltros.addEventListener('click', mostrarModalFiltros);
        btnFiltros.hasListener = true;
        console.log('✅ Botón filtros inicializado');
    }

    // Búsqueda en tiempo real
    const buscarInput = document.getElementById('buscar-requerimientos');
    if (buscarInput && !buscarInput.hasListener) {
        buscarInput.addEventListener('input', filtrarRequerimientos);
        buscarInput.hasListener = true;
        console.log('✅ Búsqueda en tiempo real inicializada');
    }
}

// ✅ CARGAR PÁGINA COMPLETA
async function cargarPaginaCompleta() {
    try {
        console.log('📥 Cargando página completa...');
        
        // Cargar requerimientos primero, luego estadísticas
        await cargarRequerimientosExistentes();
        await cargarEstadisticas();
        
        console.log('✅ Página cargada completamente');
        
    } catch (error) {
        console.error('❌ Error cargando página:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
    }
}

// ✅ CARGAR ESTADÍSTICAS - VERSIÓN CORREGIDA
async function cargarEstadisticas() {
    try {
        console.log('📊 Cargando estadísticas...');
        
        // Cargar TODAS las APIs en paralelo
        const [familiasRes, gruposRes, subgruposRes] = await Promise.all([
            fetch('/api/familias/'),
            fetch('/api/grupos/'), 
            fetch('/api/subgrupos/')
        ]);
        
        console.log('🔍 Respuestas de APIs:', {
            familias: familiasRes.status,
            grupos: gruposRes.status,
            subgrupos: subgruposRes.status
        });
        
        // Verificar respuestas
        if (!familiasRes.ok) throw new Error(`Error familias: ${familiasRes.status}`);
        if (!gruposRes.ok) throw new Error(`Error grupos: ${gruposRes.status}`);
        if (!subgruposRes.ok) throw new Error(`Error subgrupos: ${subgruposRes.status}`);
        
        // Obtener datos
        const [familiasData, gruposData, subgruposData] = await Promise.all([
            familiasRes.json(),
            gruposRes.json(),
            subgruposRes.json()
        ]);
        
        console.log('📊 Datos recibidos:', {
            familias: familiasData.length,
            grupos: gruposData.length, 
            subgrupos: subgruposData.length,
            requerimientos: window.todosRequerimientos.length
        });
        
        // Actualizar estadísticas
        window.estadisticasGlobales = {
            familias: familiasData.length,
            grupos: gruposData.length,
            subgrupos: subgruposData.length,
            requerimientos: window.todosRequerimientos.length
        };
        
        // Actualizar la interfaz
        actualizarEstadisticasUI();
        
        console.log('✅ Estadísticas cargadas correctamente:', window.estadisticasGlobales);
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        
        // Intentar método alternativo: calcular desde requerimientos
        console.log('🔄 Intentando calcular estadísticas desde requerimientos...');
        calcularEstadisticasDesdeRequerimientos();
    }
}

// ✅ CALCULAR ESTADÍSTICAS DESDE REQUERIMIENTOS (método alternativo)
function calcularEstadisticasDesdeRequerimientos() {
    try {
        const familiasUnicas = new Set();
        const gruposUnicos = new Set();
        const subgruposUnicos = new Set();
        
        window.todosRequerimientos.forEach(req => {
            // Familia
            const familia = req.familia_nombre || req.nombre_familia_denuncia;
            if (familia) familiasUnicas.add(familia);
            
            // Grupo
            const grupo = req.grupo_nombre || req.nombre_grupo_denuncia;
            if (grupo) gruposUnicos.add(grupo);
            
            // Subgrupo
            const subgrupo = req.subgrupo_nombre || req.nombre_subgrupo_denuncia;
            if (subgrupo) subgruposUnicos.add(subgrupo);
        });
        
        window.estadisticasGlobales = {
            familias: familiasUnicas.size,
            grupos: gruposUnicos.size,
            subgrupos: subgruposUnicos.size,
            requerimientos: window.todosRequerimientos.length
        };
        
        console.log('📊 Estadísticas calculadas desde requerimientos:', window.estadisticasGlobales);
        actualizarEstadisticasUI();
        
    } catch (error) {
        console.error('❌ Error calculando estadísticas desde requerimientos:', error);
        // Valores por defecto
        window.estadisticasGlobales = { familias: 0, grupos: 0, subgrupos: 0, requerimientos: 0 };
        actualizarEstadisticasUI();
    }
}

// ✅ ACTUALIZAR INTERFAZ DE ESTADÍSTICAS
function actualizarEstadisticasUI() {
    const totalFamilias = document.getElementById('total-familias');
    const totalGrupos = document.getElementById('total-grupos');
    const totalSubgrupos = document.getElementById('total-subgrupos');
    const totalRequerimientos = document.getElementById('total-requerimientos');
    
    if (totalFamilias) totalFamilias.textContent = window.estadisticasGlobales.familias;
    if (totalGrupos) totalGrupos.textContent = window.estadisticasGlobales.grupos;
    if (totalSubgrupos) totalSubgrupos.textContent = window.estadisticasGlobales.subgrupos;
    if (totalRequerimientos) totalRequerimientos.textContent = window.estadisticasGlobales.requerimientos;
    
    console.log('📊 UI actualizada con:', window.estadisticasGlobales);
    
    // Agregar animación a los números
    animarContadores();
}

// ✅ ANIMAR CONTADORES
function animarContadores() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = +counter.textContent;
        if (isNaN(target) || target === 0) return;
        
        const increment = target / 50;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current > target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 30);
    });
}

// ✅ CARGAR REQUERIMIENTOS EXISTENTES
async function cargarRequerimientosExistentes() {
    try {
        console.log('📋 Cargando requerimientos existentes...');
        
        const response = await fetch('/api/requerimientos/');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        window.todosRequerimientos = await response.json();
        console.log('✅ Requerimientos cargados:', window.todosRequerimientos.length, 'registros');
        
        // Actualizar la interfaz
        renderizarRequerimientos();
        
    } catch (error) {
        console.error('❌ Error cargando requerimientos:', error);
        mostrarListaVacia('Error al cargar los requerimientos: ' + error.message);
    }
}

// ✅ RENDERIZAR REQUERIMIENTOS EN TARJETAS (ESTILO LISTADO DE USUARIOS)
function renderizarRequerimientos() {
    const contenedor = document.getElementById('lista-requerimientos');
    
    if (!contenedor) {
        console.error('❌ Contenedor de requerimientos no encontrado');
        return;
    }
    
    if (window.todosRequerimientos.length === 0) {
        mostrarListaVacia('No hay requerimientos registrados');
        return;
    }
    
    // Aplicar filtros si existen
    const requerimientosFiltrados = aplicarFiltros(window.todosRequerimientos);
    
    // Crear tarjetas
    const tarjetasHTML = crearTarjetasRequerimientos(requerimientosFiltrados);
    contenedor.innerHTML = tarjetasHTML;
    
    // Agregar animación de entrada
    animarEntradaTarjetas();
    
    // Actualizar contador de resultados
    actualizarContadorResultados(requerimientosFiltrados.length);
}

// ✅ CREAR TARJETAS DE REQUERIMIENTOS (GRID)
function crearTarjetasRequerimientos(requerimientos) {
    let html = `
        <div class="lista-requerimientos-grid">
    `;
    
    requerimientos.forEach((req, index) => {
        // Manejar diferentes nombres de campos
        const id = req.id_requerimiento || req.id;
        const nombre = req.nombre_requerimiento || req.nombre || 'Sin nombre';
        const codigo = req.codigo_requerimiento || req.codigo || 'N/A';
        const clasificacion = (req.clasificacion_requerimiento || req.clasificacion || 'Sin clasificación');
        const subgrupo = req.subgrupo_nombre || req.nombre_subgrupo_denuncia || 'Sin subgrupo';
        const grupo = req.grupo_nombre || req.nombre_grupo_denuncia || 'Sin grupo';
        const familia = req.familia_nombre || req.nombre_familia_denuncia || 'Sin familia';
        const descripcion = req.descripcion_requerimiento || req.descripcion || 'Sin descripción registrada';
        
        // Determinar clases para clasificación (badge + borde de la tarjeta)
        let claseBadge = 'sin';
        let claseCard = 'clasificacion-sin';
        
        const clasificacionLower = clasificacion.toString().toLowerCase();
        if (clasificacionLower === 'baja') {
            claseBadge = 'baja';
            claseCard = 'clasificacion-baja-card';
        } else if (clasificacionLower === 'media') {
            claseBadge = 'media';
            claseCard = 'clasificacion-media-card';
        } else if (clasificacionLower === 'alta') {
            claseBadge = 'alta';
            claseCard = 'clasificacion-alta-card';
        }
        
        html += `
            <div class="requerimiento-card ${claseCard}" data-id="${id}">
                <div class="requerimiento-header">
                    <h4 class="requerimiento-nombre">
                        ${index + 1}. ${nombre}
                    </h4>
                    <span class="requerimiento-clasificacion clasificacion-badge ${claseBadge}">
                        ${clasificacion}
                    </span>
                </div>

                <div class="requerimiento-info">
                    <div class="requerimiento-dato">
                        <strong><i class="fa-solid fa-hashtag"></i> Código</strong>
                        <span><span class="codigo-requerimiento">${codigo}</span></span>
                    </div>
                    <div class="requerimiento-dato">
                        <strong><i class="fa-solid fa-sitemap"></i> Familia</strong>
                        <span>${familia}</span>
                    </div>
                    <div class="requerimiento-dato">
                        <strong><i class="fa-solid fa-layer-group"></i> Grupo</strong>
                        <span>${grupo}</span>
                    </div>
                    <div class="requerimiento-dato">
                        <strong><i class="fa-solid fa-diagram-project"></i> Subgrupo</strong>
                        <span>${subgrupo}</span>
                    </div>
                    <div class="requerimiento-dato descripcion">
                        <strong><i class="fa-solid fa-align-left"></i> Descripción</strong>
                        <span class="texto-descripcion">${descripcion}</span>
                    </div>
                </div>

                <div class="requerimiento-acciones">
                    <button type="button" class="btn-editar-requerimiento" onclick="editarRequerimientoDesdeLista(${id})" title="Editar requerimiento">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                    <button type="button" class="btn-eliminar-requerimiento-card" onclick="eliminarRequerimientoDesdeLista(${id})" title="Eliminar requerimiento">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
    `;
    
    return html;
}

// ✅ APLICAR FILTROS A LOS REQUERIMIENTOS
function aplicarFiltros(requerimientos) {
    let filtrados = [...requerimientos];
    
    // Aplicar filtro por familia
    if (window.filtrosAplicados.familia) {
        filtrados = filtrados.filter(req => {
            const nombreFamilia = req.familia_nombre || req.nombre_familia_denuncia;
            return nombreFamilia === window.filtrosAplicados.familia;
        });
    }
    
    // Aplicar filtro por grupo
    if (window.filtrosAplicados.grupo) {
        filtrados = filtrados.filter(req => {
            const nombreGrupo = req.grupo_nombre || req.nombre_grupo_denuncia;
            return nombreGrupo === window.filtrosAplicados.grupo;
        });
    }
    
    // Aplicar filtro por subgrupo
    if (window.filtrosAplicados.subgrupo) {
        filtrados = filtrados.filter(req => {
            const nombreSubgrupo = req.subgrupo_nombre || req.nombre_subgrupo_denuncia;
            return nombreSubgrupo === window.filtrosAplicados.subgrupo;
        });
    }
    
    // Aplicar filtro por clasificación
    if (window.filtrosAplicados.clasificacion) {
        filtrados = filtrados.filter(req => {
            const clasificacionReq = req.clasificacion_requerimiento || req.clasificacion;
            return clasificacionReq === window.filtrosAplicados.clasificacion;
        });
    }
    
    return filtrados;
}

// ✅ ACTUALIZAR CONTADOR DE RESULTADOS
function actualizarContadorResultados(cantidad) {
    const contador = document.getElementById('contador-resultados');
    if (contador) {
        const total = window.todosRequerimientos.length;
        const textoFiltros = obtenerTextoFiltrosAplicados();
        
        if (textoFiltros) {
            contador.textContent = `Mostrando ${cantidad} de ${total} requerimientos ${textoFiltros}`;
        } else {
            contador.textContent = `Mostrando ${cantidad} de ${total} requerimientos`;
        }
    }
}

// ✅ OBTENER TEXTO DE FILTROS APLICADOS
function obtenerTextoFiltrosAplicados() {
    const filtros = [];
    
    if (window.filtrosAplicados.familia) {
        filtros.push(`Familia: ${window.filtrosAplicados.familia}`);
    }
    if (window.filtrosAplicados.grupo) {
        filtros.push(`Grupo: ${window.filtrosAplicados.grupo}`);
    }
    if (window.filtrosAplicados.subgrupo) {
        filtros.push(`Subgrupo: ${window.filtrosAplicados.subgrupo}`);
    }
    if (window.filtrosAplicados.clasificacion) {
        filtros.push(`Clasificación: ${window.filtrosAplicados.clasificacion}`);
    }
    
    return filtros.length > 0 ? `(Filtros: ${filtros.join(', ')})` : '';
}

// ✅ MOSTRAR MODAL DE FILTROS
async function mostrarModalFiltros() {
    try {
        console.log('🔍 Mostrando modal de filtros...');
        
        // Cargar datos para los filtros
        const [familias, grupos, subgrupos] = await Promise.all([
            fetch('/api/familias/').then(r => r.json()),
            fetch('/api/grupos/').then(r => r.json()),
            fetch('/api/subgrupos/').then(r => r.json())
        ]);
        
        const modalHTML = crearModalFiltros(familias, grupos, subgrupos);
        
        // Mostrar modal con SweetAlert2
        const { value: formValues } = await Swal.fire({
            title: 'Filtrar Requerimientos',
            html: modalHTML,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Aplicar Filtros',
            cancelButtonText: 'Limpiar Filtros',
            width: '600px',
            customClass: {
                popup: 'filtros-modal'
            },
            preConfirm: () => {
                return {
                    familia: document.getElementById('filtro-familia').value,
                    grupo: document.getElementById('filtro-grupo').value,
                    subgrupo: document.getElementById('filtro-subgrupo').value,
                    clasificacion: document.getElementById('filtro-clasificacion').value
                };
            }
        });
        
        if (formValues) {
            // Aplicar filtros
            window.filtrosAplicados = formValues;
            renderizarRequerimientos();
            
            // Mostrar notificación de filtros aplicados
            const textoFiltros = obtenerTextoFiltrosAplicados();
            if (textoFiltros) {
                Swal.fire({
                    title: 'Filtros aplicados',
                    text: textoFiltros.replace('(Filtros: ', '').replace(')', ''),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } else if (Swal.isDismissed && Swal.DismissReason.cancel) {
            // Limpiar filtros
            window.filtrosAplicados = { familia: '', grupo: '', subgrupo: '', clasificacion: '' };
            renderizarRequerimientos();
            
            Swal.fire({
                title: 'Filtros limpiados',
                text: 'Todos los filtros han sido removidos',
                icon: 'info',
                timer: 2000,
                showConfirmButton: false
            });
        }
        
    } catch (error) {
        console.error('❌ Error mostrando modal de filtros:', error);
        mostrarError('Error al cargar los filtros: ' + error.message);
    }
}

// ✅ CREAR MODAL DE FILTROS
function crearModalFiltros(familias, grupos, subgrupos) {
    // Función auxiliar para obtener nombres
    const obtenerNombre = (item) => {
        return item.nombre_familia_denuncia || item.nombre_grupo_denuncia || item.nombre_subgrupo_denuncia || item.nombre || 'Sin nombre';
    };
    
    return `
        <div class="filtros-container">
            <div class="filtro-group">
                <label for="filtro-familia">Familia:</label>
                <select id="filtro-familia" class="filtro-select">
                    <option value="">Todas las familias</option>
                    ${familias.map(f => {
                        const nombre = obtenerNombre(f);
                        return `<option value="${nombre}" ${window.filtrosAplicados.familia === nombre ? 'selected' : ''}>${nombre}</option>`;
                    }).join('')}
                </select>
            </div>
            
            <div class="filtro-group">
                <label for="filtro-grupo">Grupo:</label>
                <select id="filtro-grupo" class="filtro-select">
                    <option value="">Todos los grupos</option>
                    ${grupos.map(g => {
                        const nombre = obtenerNombre(g);
                        return `<option value="${nombre}" ${window.filtrosAplicados.grupo === nombre ? 'selected' : ''}>${nombre}</option>`;
                    }).join('')}
                </select>
            </div>
            
            <div class="filtro-group">
                <label for="filtro-subgrupo">Subgrupo:</label>
                <select id="filtro-subgrupo" class="filtro-select">
                    <option value="">Todos los subgrupos</option>
                    ${subgrupos.map(s => {
                        const nombre = obtenerNombre(s);
                        return `<option value="${nombre}" ${window.filtrosAplicados.subgrupo === nombre ? 'selected' : ''}>${nombre}</option>`;
                    }).join('')}
                </select>
            </div>
            
            <div class="filtro-group">
                <label for="filtro-clasificacion">Clasificación:</label>
                <select id="filtro-clasificacion" class="filtro-select">
                    <option value="">Todas las clasificaciones</option>
                    <option value="Baja" ${window.filtrosAplicados.clasificacion === 'Baja' ? 'selected' : ''}>Baja</option>
                    <option value="Media" ${window.filtrosAplicados.clasificacion === 'Media' ? 'selected' : ''}>Media</option>
                    <option value="Alta" ${window.filtrosAplicados.clasificacion === 'Alta' ? 'selected' : ''}>Alta</option>
                </select>
            </div>
            
            <div class="filtros-info">
                <p><small><i class="fa-solid fa-info-circle"></i> Seleccione uno o más filtros para refinar la lista de requerimientos</small></p>
            </div>
        </div>
    `;
}

// ✅ EDITAR REQUERIMIENTO DESDE LISTA
function editarRequerimientoDesdeLista(idRequerimiento) {
    console.log('✏️ Editando requerimiento desde lista:', idRequerimiento);
    
    // Buscar el requerimiento
    const requerimiento = window.todosRequerimientos.find(req => {
        const reqId = req.id_requerimiento || req.id;
        return reqId == idRequerimiento;
    });
    
    if (!requerimiento) {
        mostrarError('Requerimiento no encontrado');
        return;
    }
    
    // Abrir el modal de actualización si existe la función
    if (typeof abrirModalActualizarRequerimiento === 'function') {
        abrirModalActualizarRequerimiento();
        
        // Buscar y seleccionar automáticamente el requerimiento después de un delay
        setTimeout(() => {
            if (typeof seleccionarRequerimientoActualizar === 'function') {
                const reqId = requerimiento.id_requerimiento || requerimiento.id;
                seleccionarRequerimientoActualizar(reqId);
            } else {
                console.warn('⚠️ Función seleccionarRequerimientoActualizar no disponible');
                // Llenar manualmente los campos del modal de actualización
                llenarModalActualizacionManual(requerimiento);
            }
        }, 500);
    } else {
        console.warn('⚠️ Modal de actualización no disponible');
        mostrarError('La función de edición no está disponible en este momento');
    }
}

// ✅ FUNCIÓN DE RESPALDO PARA LLENAR MODAL DE ACTUALIZACIÓN
function llenarModalActualizacionManual(requerimiento) {
    console.log('🔄 Llenando modal de actualización manualmente:', requerimiento);
    
    // Intentar llenar los campos del modal de actualización
    const buscarInput = document.getElementById('buscar-requerimiento');
    const nombreInput = document.getElementById('nuevo-nombre-requerimiento');
    const clasificacionSelect = document.getElementById('nueva-clasificacion-requerimiento');
    const descripcionTextarea = document.getElementById('nueva-descripcion-requerimiento');
    
    if (buscarInput) buscarInput.value = requerimiento.nombre_requerimiento || requerimiento.nombre;
    if (nombreInput) nombreInput.value = requerimiento.nombre_requerimiento || requerimiento.nombre;
    if (clasificacionSelect) clasificacionSelect.value = requerimiento.clasificacion_requerimiento || requerimiento.clasificacion;
    if (descripcionTextarea) descripcionTextarea.value = requerimiento.descripcion_requerimiento || requerimiento.descripcion || '';
    
    // Mostrar sección de edición
    const seccionEdicion = document.getElementById('form-edicion-actualizar');
    const seccionInfo = document.getElementById('info-requerimiento-actualizar');
    const btnActualizar = document.getElementById('btn-actualizar-requerimiento');
    
    if (seccionEdicion) seccionEdicion.style.display = 'block';
    if (seccionInfo) seccionInfo.style.display = 'block';
    if (btnActualizar) btnActualizar.disabled = false;
    
    // Actualizar información del requerimiento
    const nombreElement = document.getElementById('nombre-requerimiento-actualizar');
    const clasificacionElement = document.getElementById('clasificacion-requerimiento-actualizar');
    const rutaElement = document.getElementById('ruta-completa-actualizar');
    
    if (nombreElement) nombreElement.textContent = requerimiento.nombre_requerimiento || requerimiento.nombre;
    if (clasificacionElement) {
        clasificacionElement.textContent = requerimiento.clasificacion_requerimiento || requerimiento.clasificacion;
        clasificacionElement.className = 'clasificacion-badge ' + 
            (requerimiento.clasificacion_requerimiento ? 
             `clasificacion-${requerimiento.clasificacion_requerimiento.toLowerCase()}` : 
             'clasificacion-sin');
    }
    if (rutaElement) {
        const familia = requerimiento.familia_nombre || requerimiento.nombre_familia_denuncia || 'Sin familia';
        const grupo = requerimiento.grupo_nombre || requerimiento.nombre_grupo_denuncia || 'Sin grupo';
        const subgrupo = requerimiento.subgrupo_nombre || requerimiento.nombre_subgrupo_denuncia || 'Sin subgrupo';
        rutaElement.textContent = `${familia} → ${grupo} → ${subgrupo}`;
    }
}

// ✅ ELIMINAR REQUERIMIENTO DESDE LISTA
async function eliminarRequerimientoDesdeLista(idRequerimiento) {
    console.log('🗑️ Eliminando requerimiento:', idRequerimiento);
    
    const requerimiento = window.todosRequerimientos.find(req => {
        const reqId = req.id_requerimiento || req.id;
        return reqId == idRequerimiento;
    });
    
    if (!requerimiento) {
        mostrarError('Requerimiento no encontrado');
        return;
    }
    
    const nombre = requerimiento.nombre_requerimiento || requerimiento.nombre;
    const clasificacion = requerimiento.clasificacion_requerimiento || requerimiento.clasificacion;
    const codigo = requerimiento.codigo_requerimiento || requerimiento.codigo;
    const familia = requerimiento.familia_nombre || requerimiento.nombre_familia_denuncia;
    const grupo = requerimiento.grupo_nombre || requerimiento.nombre_grupo_denuncia;
    const subgrupo = requerimiento.subgrupo_nombre || requerimiento.nombre_subgrupo_denuncia;
    
    const resultado = await Swal.fire({
        title: '¿Eliminar requerimiento?',
        html: `
            <div style="text-align: left;">
                <p>Está a punto de eliminar el siguiente requerimiento:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <strong>Nombre:</strong> ${nombre}<br>
                    <strong>Clasificación:</strong> 
                    <span class="clasificacion-badge clasificacion-${(clasificacion || 'media').toLowerCase()}">
                        ${clasificacion || 'Sin clasificación'}
                    </span><br>
                    <strong>Código:</strong> ${codigo || 'N/A'}<br>
                    <strong>Ruta:</strong> ${familia || 'Sin familia'} → ${grupo || 'Sin grupo'} → ${subgrupo || 'Sin subgrupo'}
                </div>
                <p style="color: #dc3545; font-weight: bold;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Esta acción no se puede deshacer.
                </p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        width: '600px'
    });
    
    if (resultado.isConfirmed) {
        await ejecutarEliminacionRequerimiento(idRequerimiento, requerimiento);
    }
}

// ✅ EJECUTAR ELIMINACIÓN DE REQUERIMIENTO
async function ejecutarEliminacionRequerimiento(idRequerimiento, requerimiento) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Eliminando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/api/requerimientos/${idRequerimiento}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar éxito
        await Swal.fire({
            title: '¡Eliminado!',
            html: `
                <p>El requerimiento <strong>"${requerimiento.nombre_requerimiento || requerimiento.nombre}"</strong> ha sido eliminado correctamente.</p>
            `,
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });
        
        // Recargar los datos
        await cargarRequerimientosExistentes();
        await cargarEstadisticas();
        
    } catch (error) {
        console.error('❌ Error eliminando requerimiento:', error);
        
        // Cerrar loading si está abierto
        Swal.close();
        
        let mensajeError = `Error al eliminar el requerimiento: ${error.message}`;
        
        // Mensajes más específicos para errores comunes
        if (error.message.includes('violates foreign key constraint') || 
            error.message.includes('tiene denuncias asociadas')) {
            mensajeError = 'No se puede eliminar este requerimiento porque está siendo utilizado en denuncias existentes.';
        }
        
        Swal.fire({
            title: 'Error',
            text: mensajeError,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// ✅ FILTRAR REQUERIMIENTOS EN LA LISTA (BUSCA EN TARJETAS)
function filtrarRequerimientos() {
    const searchInput = document.getElementById('buscar-requerimientos');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const tarjetas = document.querySelectorAll('.requerimiento-card');
    
    let visibleCount = 0;
    
    tarjetas.forEach(card => {
        const texto = card.textContent.toLowerCase();
        if (texto.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Actualizar contador de resultados
    actualizarContadorResultados(visibleCount);
    
    // Mostrar mensaje si no hay resultados
    const contenedor = document.getElementById('lista-requerimientos');
    let mensajeNoResultados = contenedor.querySelector('.no-resultados');
    
    if (visibleCount === 0 && searchTerm) {
        if (!mensajeNoResultados) {
            mensajeNoResultados = document.createElement('div');
            mensajeNoResultados.className = 'no-resultados sin-requerimientos';
            mensajeNoResultados.innerHTML = `
                <i class="fa-solid fa-search"></i>
                <h4>No se encontraron requerimientos</h4>
                <p>No hay resultados para "${searchTerm}"</p>
            `;
            contenedor.appendChild(mensajeNoResultados);
        }
    } else if (mensajeNoResultados) {
        mensajeNoResultados.remove();
    }
}

// ✅ EXPORTAR A EXCEL
async function exportarAExcel() {
    try {
        if (window.todosRequerimientos.length === 0) {
            mostrarError('No hay requerimientos para exportar');
            return;
        }

        // Mostrar loading
        Swal.fire({
            title: 'Generando Excel...',
            text: 'Preparando archivo de exportación',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Preparar datos para Excel
        const datosExcel = prepararDatosParaExcel();
        
        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        
        // Ajustar anchos de columnas
        const anchosColumnas = [
            { wch: 5 },   // N°
            { wch: 40 },  // Nombre del Requerimiento
            { wch: 15 },  // Código
            { wch: 15 },  // Clasificación
            { wch: 25 },  // Subgrupo
            { wch: 25 },  // Grupo
            { wch: 25 },  // Familia
            { wch: 50 }   // Descripción
        ];
        ws['!cols'] = anchosColumnas;
        
        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, "Requerimientos");
        
        // Generar archivo
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `requerimientos_${fecha}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar éxito
        Swal.fire({
            title: '¡Éxito!',
            html: `
                <p>Se ha generado el archivo Excel correctamente.</p>
                <p><strong>Archivo:</strong> ${nombreArchivo}</p>
                <p><strong>Registros exportados:</strong> ${window.todosRequerimientos.length}</p>
            `,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            timer: 5000
        });
        
    } catch (error) {
        console.error('❌ Error exportando a Excel:', error);
        Swal.close();
        mostrarError('Error al generar el archivo Excel: ' + error.message);
    }
}

// ✅ PREPARAR DATOS PARA EXCEL
function prepararDatosParaExcel() {
    return window.todosRequerimientos.map((req, index) => ({
        'N°': index + 1,
        'Nombre del Requerimiento': req.nombre_requerimiento || req.nombre,
        'Código': req.codigo_requerimiento || req.codigo || 'N/A',
        'Clasificación': req.clasificacion_requerimiento || req.clasificacion || 'Sin clasificación',
        'Subgrupo': req.subgrupo_nombre || req.nombre_subgrupo_denuncia || 'Sin subgrupo',
        'Grupo': req.grupo_nombre || req.nombre_grupo_denuncia || 'Sin grupo',
        'Familia': req.familia_nombre || req.nombre_familia_denuncia || 'Sin familia',
        'Descripción': req.descripcion_requerimiento || req.descripcion || ''
    }));
}

// ✅ MOSTRAR LISTA VACÍA
function mostrarListaVacia(mensaje) {
    const contenedor = document.getElementById('lista-requerimientos');
    if (!contenedor) return;
    
    contenedor.innerHTML = `
        <div class="sin-requerimientos">
            <i class="fa-solid fa-inbox"></i>
            <h4>${mensaje}</h4>
            <p>Utilice el botón "Agregar Nuevo Requerimiento" para crear el primero.</p>
        </div>
    `;
}

// ✅ ANIMAR ENTRADA DE TARJETAS
function animarEntradaTarjetas() {
    const cards = document.querySelectorAll('.requerimiento-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 40);
    });
}

// ✅ FUNCIONES DE UTILIDAD
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonText: 'Aceptar'
    });
}

// ✅ EXPORTAR FUNCIONES PARA USO GLOBAL
window.cargarEstadisticas = cargarEstadisticas;
window.cargarRequerimientosExistentes = cargarRequerimientosExistentes;
window.filtrarRequerimientos = filtrarRequerimientos;
window.editarRequerimientoDesdeLista = editarRequerimientoDesdeLista;
window.eliminarRequerimientoDesdeLista = eliminarRequerimientoDesdeLista;
window.exportarAExcel = exportarAExcel;
window.mostrarModalFiltros = mostrarModalFiltros;
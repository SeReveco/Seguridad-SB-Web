// requerimientos_actualizar.js - VERSIÓN CORREGIDA SIN CONFLICTOS

// Verificar si las variables ya existen para evitar redeclaración
if (typeof window.requerimientoSeleccionado === 'undefined') {
    window.requerimientoSeleccionado = null;
}

if (typeof window.timeoutBusqueda === 'undefined') {
    window.timeoutBusqueda = null;
}

// ✅ CORREGIDO: Función para abrir el modal de actualizar requerimiento
function abrirModalActualizarRequerimiento() {
    const modal = document.getElementById('modal-actualizar-requerimiento');
    if (!modal) {
        console.error('❌ Modal de actualizar no encontrado');
        return;
    }
    
    modal.style.display = 'block';
    
    // Limpiar formulario
    limpiarFormularioActualizar();
    
    // Cargar datos iniciales
    cargarDatosInicialesActualizar();
    
    // Enfocar el campo de búsqueda
    setTimeout(() => {
        const buscarInput = document.getElementById('buscar-requerimiento');
        if (buscarInput) buscarInput.focus();
    }, 100);
}

// ✅ CORREGIDO: Función para cerrar el modal de actualizar requerimiento
function cerrarModalActualizarRequerimiento() {
    const modal = document.getElementById('modal-actualizar-requerimiento');
    if (modal) {
        modal.style.display = 'none';
    }
    window.requerimientoSeleccionado = null;
}

// ✅ CORREGIDO: Función para limpiar el formulario de actualizar
function limpiarFormularioActualizar() {
    // Limpiar búsqueda
    const buscarInput = document.getElementById('buscar-requerimiento');
    if (buscarInput) buscarInput.value = '';
    
    const listaResultados = document.getElementById('lista-requerimientos-actualizar');
    if (listaResultados) listaResultados.innerHTML = '';
    
    // Ocultar secciones
    const infoSection = document.getElementById('info-requerimiento-actualizar');
    const formSection = document.getElementById('form-edicion-actualizar');
    const btnActualizar = document.getElementById('btn-actualizar-requerimiento');
    
    if (infoSection) infoSection.style.display = 'none';
    if (formSection) formSection.style.display = 'none';
    if (btnActualizar) btnActualizar.disabled = true;
    
    // Limpiar campos de edición
    const nuevoNombre = document.getElementById('nuevo-nombre-requerimiento');
    const nuevaClasificacion = document.getElementById('nueva-clasificacion-requerimiento');
    const nuevaDescripcion = document.getElementById('nueva-descripcion-requerimiento');
    
    if (nuevoNombre) nuevoNombre.value = '';
    if (nuevaClasificacion) nuevaClasificacion.value = 'Media';
    if (nuevaDescripcion) nuevaDescripcion.value = '';
    
    // Limpiar selectores de cambio de subgrupo
    const selectFamilia = document.getElementById('select-familia-actualizar');
    const selectGrupo = document.getElementById('select-grupo-actualizar');
    const selectSubgrupo = document.getElementById('select-subgrupo-actualizar');
    
    if (selectFamilia) {
        selectFamilia.innerHTML = '<option value="">Seleccionar Familia</option>';
    }
    if (selectGrupo) {
        selectGrupo.innerHTML = '<option value="">Seleccionar Grupo</option>';
        selectGrupo.disabled = true;
    }
    if (selectSubgrupo) {
        selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
        selectSubgrupo.disabled = true;
    }
}

// ✅ CORREGIDO: Cargar datos iniciales para actualizar
async function cargarDatosInicialesActualizar() {
    try {
        console.log('📥 Cargando datos iniciales para actualizar...');
        
        // Cargar todos los requerimientos para búsqueda
        await cargarTodosRequerimientosParaBusqueda();
        
        // Cargar familias para el selector de cambio
        await cargarFamiliasActualizar();
        
        // ✅ NUEVO: Mostrar todos los requerimientos al abrir el modal
        mostrarTodosLosRequerimientos();
        
        console.log('✅ Datos iniciales para actualizar cargados correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales para actualizar:', error);
        mostrarError('No se pudieron cargar los datos iniciales para la actualización');
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar todos los requerimientos al abrir el modal
function mostrarTodosLosRequerimientos() {
    const lista = document.getElementById('lista-requerimientos-actualizar');
    if (!lista) return;
    
    if (!window.todosRequerimientos || window.todosRequerimientos.length === 0) {
        lista.innerHTML = `
            <div class="sin-resultados">
                <i class="fa-solid fa-inbox"></i>
                <p>No hay requerimientos registrados</p>
                <small>Utilice el botón "Agregar Nuevo Requerimiento" para crear el primero.</small>
            </div>
        `;
        return;
    }
    
    let html = '<div class="resultados-header">';
    html += `<span class="resultados-count">${window.todosRequerimientos.length} requerimiento(s) en total</span>`;
    html += '<small>Haga clic en un requerimiento para editarlo</small>';
    html += '</div>';
    
    window.todosRequerimientos.slice(0, 15).forEach(requerimiento => {
        const clasificacion = requerimiento.clasificacion_requerimiento || 'Media';
        const claseClasificacion = `clasificacion-${clasificacion.toLowerCase()}`;
        const ruta = `${requerimiento.familia_nombre || 'Sin familia'} → ${requerimiento.grupo_nombre || 'Sin grupo'} → ${requerimiento.subgrupo_nombre || 'Sin subgrupo'}`;
        
        html += `
            <div class="requerimiento-resultado-item" onclick="seleccionarRequerimientoActualizar(${requerimiento.id})">
                <div class="resultado-content">
                    <div class="resultado-header">
                        <span class="resultado-nombre">${requerimiento.nombre_requerimiento}</span>
                        <span class="resultado-codigo">${requerimiento.codigo_requerimiento}</span>
                    </div>
                    <div class="resultado-info">
                        <span class="clasificacion-badge ${claseClasificacion}">${clasificacion}</span>
                        <span class="resultado-ruta">${ruta}</span>
                    </div>
                </div>
                <div class="resultado-accion">
                    <i class="fa-solid fa-chevron-right"></i>
                </div>
            </div>
        `;
    });
    
    if (window.todosRequerimientos.length > 15) {
        html += `<div class="mas-resultados">+${window.todosRequerimientos.length - 15} requerimientos más. Use la búsqueda para filtrar.</div>`;
    }
    
    lista.innerHTML = html;
}

// ✅ CORREGIDO: Cargar todos los requerimientos para búsqueda
async function cargarTodosRequerimientosParaBusqueda() {
    try {
        console.log('🔍 Cargando requerimientos para búsqueda...');
        const response = await fetch('/api/requerimientos/');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        window.todosRequerimientos = await response.json();
        console.log(`✅ ${window.todosRequerimientos.length} requerimientos cargados para búsqueda`);
        
    } catch (error) {
        console.error('❌ Error cargando requerimientos para búsqueda:', error);
        throw error;
    }
}

// ✅ CORREGIDO: Función para buscar requerimientos (búsqueda en memoria)
function buscarRequerimientos() {
    clearTimeout(window.timeoutBusqueda);
    
    window.timeoutBusqueda = setTimeout(() => {
        const query = document.getElementById('buscar-requerimiento').value.trim();
        const lista = document.getElementById('lista-requerimientos-actualizar');
        
        if (!lista) {
            console.error('❌ Lista de resultados no encontrada');
            return;
        }
        
        // Si la búsqueda está vacía, mostrar todos los requerimientos
        if (!query) {
            mostrarTodosLosRequerimientos();
            return;
        }
        
        if (query.length < 2) {
            lista.innerHTML = '<div class="sin-resultados">Escriba al menos 2 caracteres para buscar</div>';
            return;
        }
        
        // Mostrar loading
        lista.innerHTML = '<div class="loading-busqueda"><i class="fa-solid fa-spinner fa-spin"></i> Buscando requerimientos...</div>';
        
        // Realizar búsqueda en los requerimientos cargados
        const resultados = window.todosRequerimientos.filter(req => {
            const nombre = req.nombre_requerimiento?.toLowerCase() || '';
            const codigo = req.codigo_requerimiento?.toLowerCase() || '';
            const familia = req.familia_nombre?.toLowerCase() || '';
            const grupo = req.grupo_nombre?.toLowerCase() || '';
            const subgrupo = req.subgrupo_nombre?.toLowerCase() || '';
            const busqueda = query.toLowerCase();
            
            return nombre.includes(busqueda) || 
                   codigo.includes(busqueda) || 
                   familia.includes(busqueda) ||
                   grupo.includes(busqueda) ||
                   subgrupo.includes(busqueda);
        });
        
        mostrarResultadosBusqueda(resultados, query);
        
    }, 300);
}

// ✅ CORREGIDO: Función para mostrar resultados de búsqueda
function mostrarResultadosBusqueda(resultados, query) {
    const lista = document.getElementById('lista-requerimientos-actualizar');
    if (!lista) return;
    
    if (resultados.length === 0) {
        lista.innerHTML = `
            <div class="sin-resultados">
                <i class="fa-solid fa-search"></i>
                <p>No se encontraron requerimientos para "${query}"</p>
                <small>Intente con otros términos de búsqueda</small>
            </div>
        `;
        return;
    }
    
    let html = '<div class="resultados-header">';
    html += `<span class="resultados-count">${resultados.length} resultado(s) para "${query}"</span>`;
    html += '</div>';
    
    resultados.slice(0, 10).forEach(requerimiento => {
        const clasificacion = requerimiento.clasificacion_requerimiento || 'Media';
        const claseClasificacion = `clasificacion-${clasificacion.toLowerCase()}`;
        const ruta = `${requerimiento.familia_nombre || 'Sin familia'} → ${requerimiento.grupo_nombre || 'Sin grupo'} → ${requerimiento.subgrupo_nombre || 'Sin subgrupo'}`;
        
        html += `
            <div class="requerimiento-resultado-item" onclick="seleccionarRequerimientoActualizar(${requerimiento.id})">
                <div class="resultado-content">
                    <div class="resultado-header">
                        <span class="resultado-nombre">${requerimiento.nombre_requerimiento}</span>
                        <span class="resultado-codigo">${requerimiento.codigo_requerimiento}</span>
                    </div>
                    <div class="resultado-info">
                        <span class="clasificacion-badge ${claseClasificacion}">${clasificacion}</span>
                        <span class="resultado-ruta">${ruta}</span>
                    </div>
                </div>
                <div class="resultado-accion">
                    <i class="fa-solid fa-chevron-right"></i>
                </div>
            </div>
        `;
    });
    
    if (resultados.length > 10) {
        html += `<div class="mas-resultados">+${resultados.length - 10} resultados más. Refine su búsqueda.</div>`;
    }
    
    lista.innerHTML = html;
}

// ✅ CORREGIDO: Función para seleccionar un requerimiento
async function seleccionarRequerimientoActualizar(requerimientoId) {
    try {
        console.log(`🎯 Seleccionando requerimiento ${requerimientoId}...`);
        
        // Mostrar loading
        const infoSection = document.getElementById('info-requerimiento-actualizar');
        const formSection = document.getElementById('form-edicion-actualizar');
        const btnActualizar = document.getElementById('btn-actualizar-requerimiento');
        
        if (infoSection) infoSection.style.display = 'none';
        if (formSection) formSection.style.display = 'none';
        if (btnActualizar) btnActualizar.disabled = true;
        
        // Mostrar loading en la lista de resultados
        const lista = document.getElementById('lista-requerimientos-actualizar');
        if (lista) {
            const itemSeleccionado = lista.querySelector(`[onclick="seleccionarRequerimientoActualizar(${requerimientoId})"]`);
            if (itemSeleccionado) {
                itemSeleccionado.innerHTML = '<div class="loading-item"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
            }
        }
        
        const response = await fetch(`/api/requerimientos/${requerimientoId}/`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        const requerimiento = await response.json();
        window.requerimientoSeleccionado = requerimiento;
        
        console.log('✅ Requerimiento cargado para edición:', requerimiento);
        
        // Mostrar información del requerimiento
        mostrarInformacionRequerimiento(requerimiento);
        
        // Cargar datos en el formulario de edición
        await cargarDatosFormularioEdicion(requerimiento);
        
        // Mostrar secciones
        if (infoSection) infoSection.style.display = 'block';
        if (formSection) formSection.style.display = 'block';
        if (btnActualizar) btnActualizar.disabled = false;
        
        // Restaurar lista de resultados
        const query = document.getElementById('buscar-requerimiento').value.trim();
        if (query) {
            const resultados = window.todosRequerimientos.filter(req => 
                req.nombre_requerimiento?.toLowerCase().includes(query.toLowerCase()) ||
                req.codigo_requerimiento?.toLowerCase().includes(query.toLowerCase())
            );
            mostrarResultadosBusqueda(resultados, query);
        } else {
            mostrarTodosLosRequerimientos();
        }
        
    } catch (error) {
        console.error('❌ Error cargando requerimiento:', error);
        
        // Restaurar lista de resultados
        const query = document.getElementById('buscar-requerimiento').value.trim();
        if (query) {
            const resultados = window.todosRequerimientos.filter(req => 
                req.nombre_requerimiento?.toLowerCase().includes(query.toLowerCase()) ||
                req.codigo_requerimiento?.toLowerCase().includes(query.toLowerCase())
            );
            mostrarResultadosBusqueda(resultados, query);
        } else {
            mostrarTodosLosRequerimientos();
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del requerimiento: ' + error.message,
            confirmButtonText: 'Entendido'
        });
    }
}

// ✅ CORREGIDO: Función para mostrar información del requerimiento seleccionado
function mostrarInformacionRequerimiento(requerimiento) {
    const nombreElement = document.getElementById('nombre-requerimiento-actualizar');
    const clasificacionElement = document.getElementById('clasificacion-requerimiento-actualizar');
    const rutaElement = document.getElementById('ruta-completa-actualizar');
    
    if (nombreElement) nombreElement.textContent = requerimiento.nombre_requerimiento;
    
    if (clasificacionElement) {
        const clasificacion = requerimiento.clasificacion_requerimiento || 'Media';
        clasificacionElement.textContent = clasificacion;
        clasificacionElement.className = `clasificacion-badge clasificacion-${clasificacion.toLowerCase()}`;
    }
    
    if (rutaElement) {
        const ruta = `${requerimiento.familia_nombre || 'Sin familia'} → ${requerimiento.grupo_nombre || 'Sin grupo'} → ${requerimiento.subgrupo_nombre || 'Sin subgrupo'}`;
        rutaElement.textContent = ruta;
    }
}

// ✅ CORREGIDO: Función para cargar datos en el formulario de edición
async function cargarDatosFormularioEdicion(requerimiento) {
    // Cargar datos básicos
    const nuevoNombre = document.getElementById('nuevo-nombre-requerimiento');
    const nuevaClasificacion = document.getElementById('nueva-clasificacion-requerimiento');
    const nuevaDescripcion = document.getElementById('nueva-descripcion-requerimiento');
    
    if (nuevoNombre) nuevoNombre.value = requerimiento.nombre_requerimiento || '';
    if (nuevaClasificacion) nuevaClasificacion.value = requerimiento.clasificacion_requerimiento || 'Media';
    if (nuevaDescripcion) nuevaDescripcion.value = requerimiento.descripcion_requerimiento || '';
    
    // ✅ CORREGIDO: Cargar selectores de cambio de subgrupo de forma asíncrona
    if (requerimiento.id_familia_denuncia) {
        console.log('🔄 Cargando selectores para cambio de subgrupo...');
        
        // Esperar a que se carguen las familias
        await cargarFamiliasActualizar();
        
        // Seleccionar la familia actual
        const selectFamilia = document.getElementById('select-familia-actualizar');
        if (selectFamilia) {
            selectFamilia.value = requerimiento.id_familia_denuncia;
            
            // ✅ CORREGIDO: Esperar a que se carguen los grupos
            await cargarGruposActualizar(requerimiento.id_grupo_denuncia);
            
            // ✅ CORREGIDO: Esperar a que se carguen los subgrupos
            await cargarSubgruposActualizarPrincipal(requerimiento.id_subgrupo_denuncia);
            
            console.log('✅ Selectores de jerarquía cargados correctamente');
        }
    }
}

// ✅ CORREGIDO: Función para cargar familias en el selector de actualizar
async function cargarFamiliasActualizar() {
    try {
        console.log('📥 Cargando familias para selector de actualizar...');
        const response = await fetch('/api/familias/');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const familias = await response.json();
        console.log(`✅ ${familias.length} familias cargadas para actualizar`);
        
        const select = document.getElementById('select-familia-actualizar');
        if (!select) {
            console.error('❌ Select de familias no encontrado');
            return;
        }
        
        select.innerHTML = '<option value="">Seleccionar Familia</option>';
        
        familias.forEach(familia => {
            const option = document.createElement('option');
            // ✅ CORREGIDO: Usar 'id' en lugar de 'id_familia_denuncia' según tu API
            option.value = familia.id;
            option.textContent = `${familia.codigo_familia} - ${familia.nombre_familia_denuncia}`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Error cargando familias para actualizar:', error);
        mostrarError('Error cargando la lista de familias');
    }
}

// ✅ CORREGIDO: Función para cargar grupos en el selector de actualizar
async function cargarGruposActualizar(grupoSeleccionado = null) {
    const familiaId = document.getElementById('select-familia-actualizar').value;
    const selectGrupo = document.getElementById('select-grupo-actualizar');
    const selectSubgrupo = document.getElementById('select-subgrupo-actualizar');
    
    if (!selectGrupo) {
        console.error('❌ Selector de grupos no encontrado');
        return;
    }
    
    if (!familiaId) {
        selectGrupo.innerHTML = '<option value="">Seleccionar Grupo</option>';
        selectGrupo.disabled = true;
        
        if (selectSubgrupo) {
            selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
            selectSubgrupo.disabled = true;
        }
        return;
    }
    
    try {
        selectGrupo.disabled = true;
        selectGrupo.innerHTML = '<option value="">Cargando grupos...</option>';
        
        if (selectSubgrupo) {
            selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
            selectSubgrupo.disabled = true;
        }
        
        console.log(`📥 Cargando grupos para familia ${familiaId}...`);
        const response = await fetch(`/api/grupos/?familia_id=${familiaId}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const grupos = await response.json();
        console.log(`✅ ${grupos.length} grupos cargados para actualizar`);
        
        selectGrupo.innerHTML = '<option value="">Seleccionar Grupo</option>';
        grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id_grupo_denuncia;
            option.textContent = `${grupo.codigo_grupo} - ${grupo.nombre_grupo_denuncia}`;
            if (grupoSeleccionado && grupo.id_grupo_denuncia == grupoSeleccionado) {
                option.selected = true;
            }
            selectGrupo.appendChild(option);
        });
        
        selectGrupo.disabled = false;
        
        // ✅ CORREGIDO: Solo cargar subgrupos si hay un grupo seleccionado automáticamente
        if (grupoSeleccionado) {
            await cargarSubgruposActualizarPrincipal(window.requerimientoSeleccionado.id_subgrupo_denuncia);
        } else {
            // Si no hay grupo seleccionado, habilitar el select de subgrupos pero vacío
            if (selectSubgrupo) {
                selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
                selectSubgrupo.disabled = false;
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando grupos para actualizar:', error);
        selectGrupo.innerHTML = '<option value="">Error al cargar grupos</option>';
        selectGrupo.disabled = false;
        
        if (selectSubgrupo) {
            selectSubgrupo.innerHTML = '<option value="">Error en grupos</option>';
            selectSubgrupo.disabled = false;
        }
        
        mostrarError('Error cargando grupos: ' + error.message);
    }
}

// ✅ CORREGIDO: Función principal para cargar subgrupos - SIN EVENTO ONCHANGE
async function cargarSubgruposActualizarPrincipal(subgrupoSeleccionado = null) {
    const grupoId = document.getElementById('select-grupo-actualizar').value;
    const selectSubgrupo = document.getElementById('select-subgrupo-actualizar');
    
    if (!selectSubgrupo) {
        console.error('❌ Select de subgrupos no encontrado');
        return;
    }
    
    if (!grupoId) {
        selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
        selectSubgrupo.disabled = false;
        return;
    }
    
    try {
        selectSubgrupo.disabled = true;
        selectSubgrupo.innerHTML = '<option value="">Cargando subgrupos...</option>';
        
        console.log(`📥 Cargando subgrupos para grupo ${grupoId}...`);
        const response = await fetch(`/api/subgrupos/?grupo_id=${grupoId}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const subgrupos = await response.json();
        console.log(`✅ ${subgrupos.length} subgrupos cargados para actualizar`);
        
        // Guardar la selección actual antes de limpiar
        const seleccionActual = selectSubgrupo.value;
        
        selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
        subgrupos.forEach(subgrupo => {
            const option = document.createElement('option');
            option.value = subgrupo.id_subgrupo_denuncia || subgrupo.id;
            option.textContent = `${subgrupo.codigo_subgrupo} - ${subgrupo.nombre_subgrupo_denuncia}`;
            
            // ✅ CORREGIDO: Seleccionar automáticamente solo si se pasa un parámetro
            if (subgrupoSeleccionado && (subgrupo.id_subgrupo_denuncia == subgrupoSeleccionado || subgrupo.id == subgrupoSeleccionado)) {
                option.selected = true;
                console.log(`🎯 Subgrupo seleccionado automáticamente: ${option.value}`);
            }
            // ✅ MANTENER la selección del usuario si existe
            else if (!subgrupoSeleccionado && option.value === seleccionActual) {
                option.selected = true;
            }
            
            selectSubgrupo.appendChild(option);
        });
        
        selectSubgrupo.disabled = false;
        
        console.log('✅ Selector de subgrupos cargado correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando subgrupos para actualizar:', error);
        selectSubgrupo.innerHTML = '<option value="">Error al cargar subgrupos</option>';
        selectSubgrupo.disabled = false;
    }
}

// ✅ CORREGIDO: Función para cargar subgrupos cuando cambia el grupo
function cargarSubgruposActualizar() {
    const grupoId = document.getElementById('select-grupo-actualizar').value;
    const selectSubgrupo = document.getElementById('select-subgrupo-actualizar');
    
    if (!selectSubgrupo) return;
    
    if (grupoId) {
        // ✅ CORREGIDO: Llamar sin parámetro para que NO seleccione automáticamente
        cargarSubgruposActualizarPrincipal();
    } else {
        selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
        selectSubgrupo.disabled = false;
    }
}

// ✅ CORREGIDO: Función principal para actualizar el requerimiento
async function actualizarRequerimiento() {
    if (!window.requerimientoSeleccionado) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No hay ningún requerimiento seleccionado para actualizar',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    // Obtener datos del formulario
    const nuevoNombre = document.getElementById('nuevo-nombre-requerimiento').value.trim();
    const nuevaClasificacion = document.getElementById('nueva-clasificacion-requerimiento').value;
    const nuevaDescripcion = document.getElementById('nueva-descripcion-requerimiento').value.trim();
    const nuevoSubgrupoId = document.getElementById('select-subgrupo-actualizar').value;
    
    console.log('🔧 Datos para actualizar requerimiento:', {
        id: window.requerimientoSeleccionado.id_requerimiento,
        nuevoNombre,
        nuevaClasificacion,
        nuevaDescripcion,
        nuevoSubgrupoId,
        subgrupoActual: window.requerimientoSeleccionado.id_subgrupo_denuncia
    });
    
    // Validaciones básicas
    if (!nuevoNombre) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'El nombre del requerimiento es obligatorio',
            confirmButtonText: 'Entendido'
        });
        document.getElementById('nuevo-nombre-requerimiento').focus();
        return;
    }
    
    // Preparar datos para enviar - ✅ CORREGIDO: Usar estructura exacta
    const datosActualizacion = {
        nombre_requerimiento: nuevoNombre,
        clasificacion_requerimiento: nuevaClasificacion,
        descripcion_requerimiento: nuevaDescripcion
    };
    
    // ✅ CORREGIDO: Solo agregar subgrupo si se seleccionó uno diferente
    if (nuevoSubgrupoId && nuevoSubgrupoId !== "" && nuevoSubgrupoId !== window.requerimientoSeleccionado.id_subgrupo_denuncia.toString()) {
        // ✅ CORREGIDO: Usar el campo correcto según tu modelo
        datosActualizacion.id_subgrupo_denuncia_id = parseInt(nuevoSubgrupoId);
        console.log('🔄 Cambiando subgrupo a:', nuevoSubgrupoId);
    }
    
    try {
        // Mostrar loading
        const btnActualizar = document.getElementById('btn-actualizar-requerimiento');
        const btnTextoOriginal = btnActualizar.innerHTML;
        
        btnActualizar.disabled = true;
        btnActualizar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
        
        console.log(`📤 Enviando actualización para requerimiento ${window.requerimientoSeleccionado.id_requerimiento}...`);
        console.log('📦 Datos enviados:', datosActualizacion);
        
        const response = await fetch(`/api/requerimientos/${window.requerimientoSeleccionado.id_requerimiento}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(datosActualizacion)
        });
        
        console.log('🔧 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        console.log('✅ Requerimiento actualizado correctamente:', resultado);
        
        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: resultado.mensaje || 'Requerimiento actualizado correctamente',
            timer: 2000,
            showConfirmButton: false
        });
        
        // Cerrar modal después de éxito
        cerrarModalActualizarRequerimiento();
        
        // Recargar la lista de requerimientos en la página principal
        if (typeof cargarTodosLosRequerimientos === 'function') {
            await cargarTodosLosRequerimientos();
        }
        
        // Recargar estadísticas si existe la función
        if (typeof actualizarEstadisticas === 'function') {
            actualizarEstadisticas();
        }
        
    } catch (error) {
        console.error('❌ Error actualizando requerimiento:', error);
        
        // Rehabilitar botón
        const btnActualizar = document.getElementById('btn-actualizar-requerimiento');
        if (btnActualizar) {
            btnActualizar.disabled = false;
            btnActualizar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar Requerimiento';
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Error en actualización',
            text: error.message || 'No se pudo actualizar el requerimiento',
            confirmButtonText: 'Entendido'
        });
    }
}

// ✅ CORREGIDO: Funciones auxiliares para los selectores
function cargarfamiliaActualizar() {
    const familiaId = document.getElementById('select-familia-actualizar').value;
    const grupoSelect = document.getElementById('select-grupo-actualizar');
    const subgrupoSelect = document.getElementById('select-subgrupo-actualizar');
    
    if (grupoSelect) {
        grupoSelect.innerHTML = '<option value="">Seleccionar Grupo</option>';
        grupoSelect.disabled = true;
    }
    if (subgrupoSelect) {
        subgrupoSelect.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
        subgrupoSelect.disabled = true;
    }
    
    if (familiaId) {
        cargarGruposActualizar();
    }
}

// ✅ CORREGIDO: Función para cuando cambia el grupo
function cargargruposActualizar() {
    const grupoId = document.getElementById('select-grupo-actualizar').value;
    const selectSubgrupo = document.getElementById('select-subgrupo-actualizar');
    
    if (selectSubgrupo) {
        selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
        selectSubgrupo.disabled = false;
    }
    
    if (grupoId) {
        cargarSubgruposActualizar();
    }
}

// ✅ CORREGIDO: Función para obtener el token CSRF
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// ✅ CORREGIDO: Función para mostrar errores
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonText: 'Entendido',
        background: '#f8f9fa'
    });
}

// ✅ CORREGIDO: Inicializar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando event listeners para actualizar requerimientos...');
    
    // Event listeners para los selectores de cambio
    const selectFamilia = document.getElementById('select-familia-actualizar');
    const selectGrupo = document.getElementById('select-grupo-actualizar');
    const selectSubgrupo = document.getElementById('select-subgrupo-actualizar');
    
    if (selectFamilia) {
        selectFamilia.addEventListener('change', function() {
            console.log('🔄 Cambio en familia detectado');
            cargarfamiliaActualizar();
        });
    }
    
    if (selectGrupo) {
        selectGrupo.addEventListener('change', function() {
            console.log('🔄 Cambio en grupo detectado');
            cargargruposActualizar();
        });
    }
    
    // ✅ CORREGIDO: Event listener para subgrupo - solo para logging, no para recargar
    if (selectSubgrupo) {
        selectSubgrupo.addEventListener('change', function() {
            const subgrupoId = this.value;
            console.log(`🎯 Usuario seleccionó subgrupo: ${subgrupoId}`);
            // NO recargar los subgrupos, solo registrar la selección
        });
    }
    
    console.log('✅ Event listeners inicializados correctamente');
});

// ✅ CORREGIDO: Permitir cerrar modal con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModalActualizarRequerimiento();
    }
});

// ✅ CORREGIDO: Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal-actualizar-requerimiento');
    if (event.target === modal) {
        cerrarModalActualizarRequerimiento();
    }
});
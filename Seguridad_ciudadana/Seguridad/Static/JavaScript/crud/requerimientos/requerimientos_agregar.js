// Variables globales para almacenar datos
let familias = [];
let grupos = [];
let subgrupos = [];
let requerimientos = [];

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando sistema de requerimientos...');
    cargarDatosIniciales();
    inicializarEventListeners();
});

// Cargar todos los datos iniciales
async function cargarDatosIniciales() {
    try {
        console.log('📥 Cargando datos iniciales...');
        await Promise.all([
            cargarFamilias(),
            cargarTodosLosRequerimientos()
        ]);
        actualizarEstadisticas();
        console.log('✅ Datos iniciales cargados correctamente');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        mostrarError('No se pudieron cargar los datos iniciales: ' + error.message);
    }
}

// ✅ FUNCIÓN: Actualizar estadísticas
function actualizarEstadisticas() {
    try {
        document.getElementById('total-familias').textContent = familias.length;
        document.getElementById('total-grupos').textContent = grupos.length;
        document.getElementById('total-subgrupos').textContent = subgrupos.length;
        document.getElementById('total-requerimientos').textContent = requerimientos.length;
        
        console.log('📊 Estadísticas actualizadas:', {
            familias: familias.length,
            grupos: grupos.length,
            subgrupos: subgrupos.length,
            requerimientos: requerimientos.length
        });
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

// ✅ FUNCIÓN: Mostrar error con SweetAlert2
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonText: 'Entendido',
        background: '#f8f9fa',
        confirmButtonColor: '#dc3545'
    });
}

// ✅ FUNCIÓN: Mostrar éxito con SweetAlert2
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        confirmButtonText: 'Continuar',
        timer: 3000,
        background: '#f8f9fa',
        confirmButtonColor: '#28a745'
    });
}

// ✅ FUNCIÓN: Cargar familias desde la API
async function cargarFamilias() {
    try {
        console.log('📥 Cargando familias...');
        const response = await fetch('/api/familias/');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        familias = await response.json();
        console.log('✅ Familias cargadas:', familias);
        
        const selectFamilia = document.getElementById('select-familia');
        selectFamilia.innerHTML = '<option value="">Seleccionar Familia</option>';
        
        familias.forEach(familia => {
            const option = document.createElement('option');
            option.value = familia.id;
            option.textContent = `${familia.nombre_familia_denuncia} (${familia.codigo_familia})`;
            selectFamilia.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Error cargando familias:', error);
        throw error;
    }
}

// ✅ FUNCIÓN: Cargar grupos basados en familia seleccionada
async function cargarGrupos() {
    try {
        const familiaSelect = document.getElementById('select-familia');
        const familiaId = familiaSelect.value;
        const selectGrupo = document.getElementById('select-grupo');
        const btnNuevoGrupo = document.querySelector('button[onclick="mostrarInput(\'grupo\')"]');
        
        console.log('🔧 Cargando grupos para familia:', familiaId);

        if (!familiaId || familiaId === '') {
            selectGrupo.innerHTML = '<option value="">Primero seleccione una familia</option>';
            selectGrupo.disabled = true;
            if (btnNuevoGrupo) btnNuevoGrupo.disabled = true;
            limpiarNivelesInferiores();
            return;
        }

        const familiaIdNum = parseInt(familiaId);
        if (isNaN(familiaIdNum)) {
            throw new Error('ID de familia inválido');
        }

        console.log(`📥 Haciendo request a: /api/grupos/?familia_id=${familiaIdNum}`);
        const response = await fetch(`/api/grupos/?familia_id=${familiaIdNum}`);
        
        console.log('🔧 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        grupos = await response.json();
        console.log('✅ Grupos cargados:', grupos);
        
        selectGrupo.innerHTML = '<option value="">Seleccionar Grupo</option>';
        
        if (grupos.length === 0) {
            selectGrupo.innerHTML += '<option value="" disabled>No hay grupos para esta familia</option>';
        } else {
            grupos.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.id_grupo_denuncia;
                option.textContent = `${grupo.nombre_grupo_denuncia} (${grupo.codigo_grupo})`;
                selectGrupo.appendChild(option);
            });
        }
        
        selectGrupo.disabled = false;
        if (btnNuevoGrupo) btnNuevoGrupo.disabled = false;
        
        limpiarNivelesInferiores();
        
    } catch (error) {
        console.error('❌ Error cargando grupos:', error);
        mostrarError('Error cargando grupos: ' + error.message);
        
        const selectGrupo = document.getElementById('select-grupo');
        selectGrupo.innerHTML = '<option value="">Error al cargar grupos</option>';
        selectGrupo.disabled = true;
        limpiarNivelesInferiores();
    }
}

// ✅ FUNCIÓN: Cargar subgrupos basados en grupo seleccionado
async function cargarSubgrupos() {
    try {
        const grupoSelect = document.getElementById('select-grupo');
        const grupoId = grupoSelect.value;
        const selectSubgrupo = document.getElementById('select-subgrupo');
        const btnNuevoSubgrupo = document.querySelector('button[onclick="mostrarInput(\'subgrupo\')"]');
        
        console.log('🔧 Cargando subgrupos para grupo:', grupoId);

        if (!grupoId || grupoId === '') {
            selectSubgrupo.innerHTML = '<option value="">Primero seleccione un grupo</option>';
            selectSubgrupo.disabled = true;
            if (btnNuevoSubgrupo) btnNuevoSubgrupo.disabled = true;
            limpiarRequerimientos();
            return;
        }

        const grupoIdNum = parseInt(grupoId);
        if (isNaN(grupoIdNum)) {
            throw new Error('ID de grupo inválido');
        }

        console.log(`📥 Haciendo request a: /api/subgrupos/?grupo_id=${grupoIdNum}`);
        const response = await fetch(`/api/subgrupos/?grupo_id=${grupoIdNum}`);
        
        console.log('🔧 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        subgrupos = await response.json();
        console.log('✅ Subgrupos cargados:', subgrupos);
        
        selectSubgrupo.innerHTML = '<option value="">Seleccionar Subgrupo</option>';
        
        if (subgrupos.length === 0) {
            selectSubgrupo.innerHTML += '<option value="" disabled>No hay subgrupos para este grupo</option>';
        } else {
            subgrupos.forEach(subgrupo => {
                const option = document.createElement('option');
                option.value = subgrupo.id;
                option.textContent = `${subgrupo.nombre_subgrupo_denuncia} (${subgrupo.codigo_subgrupo})`;
                selectSubgrupo.appendChild(option);
            });
        }
        
        selectSubgrupo.disabled = false;
        if (btnNuevoSubgrupo) btnNuevoSubgrupo.disabled = false;
        
        limpiarRequerimientos();
        
    } catch (error) {
        console.error('❌ Error cargando subgrupos:', error);
        mostrarError('Error cargando subgrupos: ' + error.message);
        
        const selectSubgrupo = document.getElementById('select-subgrupo');
        selectSubgrupo.innerHTML = '<option value="">Error al cargar subgrupos</option>';
        selectSubgrupo.disabled = true;
        limpiarRequerimientos();
    }
}

// ✅ FUNCIÓN: Cargar requerimientos basados en subgrupo seleccionado
async function cargarRequerimientos() {
    try {
        const subgrupoSelect = document.getElementById('select-subgrupo');
        const subgrupoId = subgrupoSelect.value;
        const selectRequerimiento = document.getElementById('select-requerimiento');
        const btnNuevoRequerimiento = document.querySelector('button[onclick="mostrarInput(\'requerimiento\')"]');
        
        console.log('🔧 Cargando requerimientos para subgrupo:', subgrupoId);

        if (!subgrupoId || subgrupoId === '') {
            selectRequerimiento.innerHTML = '<option value="">Primero seleccione un subgrupo</option>';
            selectRequerimiento.disabled = true;
            if (btnNuevoRequerimiento) btnNuevoRequerimiento.disabled = true;
            ocultarInputRequerimiento();
            habilitarBotonGuardar();
            return;
        }

        const subgrupoIdNum = parseInt(subgrupoId);
        if (isNaN(subgrupoIdNum)) {
            throw new Error('ID de subgrupo inválido');
        }

        console.log(`📥 Haciendo request a: /api/requerimientos/?subgrupo_id=${subgrupoIdNum}`);
        const response = await fetch(`/api/requerimientos/?subgrupo_id=${subgrupoIdNum}`);
        
        console.log('🔧 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }
        
        const requerimientosData = await response.json();
        console.log('✅ Requerimientos cargados:', requerimientosData);
        
        selectRequerimiento.innerHTML = '<option value="">Seleccionar Requerimiento</option>';
        
        if (requerimientosData.length === 0) {
            selectRequerimiento.innerHTML += '<option value="" disabled>No hay requerimientos para este subgrupo</option>';
        } else {
            requerimientosData.forEach(req => {
                const option = document.createElement('option');
                option.value = req.id;
                option.textContent = `${req.nombre_requerimiento} (${req.clasificacion_requerimiento})`;
                option.setAttribute('data-descripcion', req.descripcion_requerimiento || '');
                selectRequerimiento.appendChild(option);
            });
        }
        
        selectRequerimiento.disabled = false;
        if (btnNuevoRequerimiento) btnNuevoRequerimiento.disabled = false;
        
        habilitarBotonGuardar();
        
    } catch (error) {
        console.error('❌ Error cargando requerimientos:', error);
        mostrarError('Error cargando requerimientos: ' + error.message);
        
        const selectRequerimiento = document.getElementById('select-requerimiento');
        selectRequerimiento.innerHTML = '<option value="">Error al cargar requerimientos</option>';
        selectRequerimiento.disabled = true;
    }
}

// ✅ FUNCIÓN: Limpiar niveles inferiores (subgrupos y requerimientos)
function limpiarNivelesInferiores() {
    const selectSubgrupo = document.getElementById('select-subgrupo');
    const btnNuevoSubgrupo = document.querySelector('button[onclick="mostrarInput(\'subgrupo\')"]');
    
    selectSubgrupo.innerHTML = '<option value="">Primero seleccione un grupo</option>';
    selectSubgrupo.disabled = true;
    if (btnNuevoSubgrupo) btnNuevoSubgrupo.disabled = true;
    
    limpiarRequerimientos();
}

// ✅ FUNCIÓN: Limpiar requerimientos
function limpiarRequerimientos() {
    const selectRequerimiento = document.getElementById('select-requerimiento');
    const btnNuevoRequerimiento = document.querySelector('button[onclick="mostrarInput(\'requerimiento\')"]');
    
    selectRequerimiento.innerHTML = '<option value="">Primero seleccione un subgrupo</option>';
    selectRequerimiento.disabled = true;
    if (btnNuevoRequerimiento) btnNuevoRequerimiento.disabled = true;
    
    ocultarInputRequerimiento();
    habilitarBotonGuardar();
}

// ✅ FUNCIÓN: Ocultar input de requerimiento
function ocultarInputRequerimiento() {
    const inputRequerimiento = document.getElementById('input-requerimiento');
    inputRequerimiento.style.display = 'none';
    document.getElementById('nuevo-requerimiento').value = '';
    document.getElementById('descripcion-requerimiento').value = '';
}

// ✅ FUNCIÓN: Mostrar/ocultar inputs para nuevos elementos
function mostrarInput(tipo) {
    const inputDiv = document.getElementById(`input-${tipo}`);
    const todosInputs = document.querySelectorAll('.input-nuevo');
    
    // Ocultar todos los inputs primero
    todosInputs.forEach(input => {
        input.style.display = 'none';
    });
    
    // Mostrar el input seleccionado
    inputDiv.style.display = 'block';
    
    // Enfocar el primer input
    const primerInput = inputDiv.querySelector('input');
    if (primerInput) {
        primerInput.focus();
    }
    
    // Si es requerimiento, actualizar el estado del botón
    if (tipo === 'requerimiento') {
        setTimeout(() => {
            habilitarBotonGuardar();
        }, 100);
    }
}

// ✅ FUNCIÓN: Agregar nueva familia
async function agregarFamilia() {
    const nombreInput = document.getElementById('nueva-familia');
    const nombre = nombreInput.value.trim();
    
    if (!nombre) {
        mostrarError('Ingrese un nombre para la familia');
        nombreInput.focus();
        return;
    }

    try {
        console.log(`➕ Agregando nueva familia: ${nombre}`);
        
        const response = await fetch('/api/familias/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ 
                nombre: nombre 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const nuevaFamilia = await response.json();
        console.log('✅ Familia agregada:', nuevaFamilia);
        
        // Limpiar formulario
        nombreInput.value = '';
        document.getElementById('input-familia').style.display = 'none';
        
        // Recargar y seleccionar la nueva familia
        await cargarFamilias();
        document.getElementById('select-familia').value = nuevaFamilia.id;
        
        // Cargar grupos para la nueva familia
        await cargarGrupos();
        
        mostrarExito('Familia agregada correctamente');
        
    } catch (error) {
        console.error('❌ Error agregando familia:', error);
        mostrarError('Error al agregar familia: ' + error.message);
    }
}

// ✅ FUNCIÓN: Agregar nuevo grupo
async function agregarGrupo() {
    const nombreInput = document.getElementById('nuevo-grupo');
    const nombre = nombreInput.value.trim();
    const familiaId = document.getElementById('select-familia').value;
    
    if (!nombre) {
        mostrarError('Ingrese un nombre para el grupo');
        nombreInput.focus();
        return;
    }
    
    if (!familiaId) {
        mostrarError('Seleccione una familia primero');
        return;
    }

    try {
        console.log(`➕ Agregando nuevo grupo: ${nombre} para familia ${familiaId}`);
        
        const response = await fetch('/api/grupos/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ 
                nombre: nombre,
                familia_id: parseInt(familiaId)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const nuevoGrupo = await response.json();
        console.log('✅ Grupo agregado:', nuevoGrupo);
        
        // Limpiar formulario
        nombreInput.value = '';
        document.getElementById('input-grupo').style.display = 'none';
        
        // Recargar y seleccionar el nuevo grupo
        await cargarGrupos();
        document.getElementById('select-grupo').value = nuevoGrupo.id_grupo_denuncia;
        
        // Cargar subgrupos para el nuevo grupo
        await cargarSubgrupos();
        
        mostrarExito('Grupo agregado correctamente');
        
    } catch (error) {
        console.error('❌ Error agregando grupo:', error);
        mostrarError('Error al agregar grupo: ' + error.message);
    }
}

// ✅ FUNCIÓN: Agregar nuevo subgrupo
async function agregarSubgrupo() {
    const nombreInput = document.getElementById('nuevo-subgrupo');
    const nombre = nombreInput.value.trim();
    const grupoId = document.getElementById('select-grupo').value;
    
    if (!nombre) {
        mostrarError('Ingrese un nombre para el subgrupo');
        nombreInput.focus();
        return;
    }
    
    if (!grupoId) {
        mostrarError('Seleccione un grupo primero');
        return;
    }

    try {
        console.log(`➕ Agregando nuevo subgrupo: ${nombre} para grupo ${grupoId}`);
        
        const response = await fetch('/api/subgrupos/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ 
                nombre: nombre,
                grupo_id: parseInt(grupoId)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const nuevoSubgrupo = await response.json();
        console.log('✅ Subgrupo agregado:', nuevoSubgrupo);
        
        // Limpiar formulario
        nombreInput.value = '';
        document.getElementById('input-subgrupo').style.display = 'none';
        
        // Recargar y seleccionar el nuevo subgrupo
        await cargarSubgrupos();
        document.getElementById('select-subgrupo').value = nuevoSubgrupo.id;
        
        // Cargar requerimientos para el nuevo subgrupo
        await cargarRequerimientos();
        
        mostrarExito('Subgrupo agregado correctamente');
        
    } catch (error) {
        console.error('❌ Error agregando subgrupo:', error);
        mostrarError('Error al agregar subgrupo: ' + error.message);
    }
}

// ✅ FUNCIÓN: Agregar nuevo requerimiento - CORREGIDA (CAMPOS EXACTOS)
async function agregarRequerimiento() {
    const nombreInput = document.getElementById('nuevo-requerimiento');
    const nombre = nombreInput.value.trim();
    const subgrupoId = document.getElementById('select-subgrupo').value;
    const clasificacion = document.getElementById('clasificacion-requerimiento').value;
    const descripcion = document.getElementById('descripcion-requerimiento').value.trim();
    
    console.log('🔧 Datos para nuevo requerimiento:', {
        nombre,
        subgrupoId,
        clasificacion,
        descripcion
    });
    
    if (!nombre) {
        mostrarError('Ingrese un nombre para el requerimiento');
        nombreInput.focus();
        return;
    }
    
    if (!subgrupoId) {
        mostrarError('Seleccione un subgrupo primero');
        return;
    }

    try {
        console.log(`➕ Agregando nuevo requerimiento: ${nombre} para subgrupo ${subgrupoId}`);
        
        // Mostrar loading
        Swal.fire({
            title: 'Creando requerimiento...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // ✅ CORREGIDO: Enviar los campos EXACTOS que espera el backend
        const response = await fetch('/api/requerimientos/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ 
                nombre: nombre,  // ✅ Campo que espera el backend
                subgrupo_id: parseInt(subgrupoId),  // ✅ Campo que espera el backend (subgrupo_id)
                clasificacion: clasificacion,  // ✅ Campo que espera el backend
                descripcion: descripcion  // ✅ Campo que espera el backend
            })
        });

        console.log('🔧 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error response:', errorData);
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const nuevoRequerimiento = await response.json();
        console.log('✅ Nuevo requerimiento creado:', nuevoRequerimiento);

        // Cerrar loading
        Swal.close();

        // Limpiar formulario
        nombreInput.value = '';
        document.getElementById('descripcion-requerimiento').value = '';
        document.getElementById('input-requerimiento').style.display = 'none';
        
        // Recargar requerimientos
        await cargarRequerimientos();
        
        // Recargar lista principal
        await cargarTodosLosRequerimientos();
        
        mostrarExito('Requerimiento agregado correctamente');
        
    } catch (error) {
        console.error('❌ Error agregando requerimiento:', error);
        Swal.close();
        mostrarError('Error al agregar requerimiento: ' + error.message);
    }
}

// ✅ FUNCIÓN: Guardar requerimiento completo (formulario principal)
async function guardarRequerimientoCompleto(event) {
    event.preventDefault();
    
    const requerimientoId = document.getElementById('select-requerimiento').value;
    const inputRequerimientoVisible = document.getElementById('input-requerimiento').style.display !== 'none';
    const nuevoRequerimientoNombre = document.getElementById('nuevo-requerimiento').value.trim();
    
    console.log('🔧 Estado guardarRequerimientoCompleto:', {
        requerimientoId,
        inputRequerimientoVisible,
        nuevoRequerimientoNombre
    });

    // Validar que se haya seleccionado o creado un requerimiento
    if (!requerimientoId && (!inputRequerimientoVisible || !nuevoRequerimientoNombre)) {
        mostrarError('Debe seleccionar un requerimiento existente o crear uno nuevo');
        return;
    }

    // Si se está creando un nuevo requerimiento, usar esa función
    if (inputRequerimientoVisible && nuevoRequerimientoNombre) {
        await agregarRequerimiento();
    } else if (requerimientoId) {
        // Si se seleccionó un requerimiento existente, simplemente cerrar el modal
        mostrarExito('Requerimiento seleccionado correctamente');
        cerrarModalRequerimiento();
        
        // Recargar la lista principal después de un breve delay
        setTimeout(() => {
            cargarTodosLosRequerimientos();
        }, 1000);
    }
}

// ✅ FUNCIÓN: Cargar todos los requerimientos para la lista principal
async function cargarTodosLosRequerimientos() {
    try {
        console.log('📥 Cargando todos los requerimientos...');
        const response = await fetch('/api/requerimientos/');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        requerimientos = await response.json();
        console.log('✅ Todos los requerimientos cargados:', requerimientos);
        
        renderizarListaRequerimientos();
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('❌ Error cargando requerimientos:', error);
        throw error;
    }
}

// ✅ FUNCIÓN: Renderizar lista de requerimientos
function renderizarListaRequerimientos() {
    const lista = document.getElementById('lista-requerimientos');
    
    if (!lista) {
        console.error('❌ Contenedor lista-requerimientos no encontrado');
        return;
    }
    
    lista.innerHTML = '';
    
    if (requerimientos.length === 0) {
        lista.innerHTML = `
            <div class="sin-requerimientos">
                <i class="fa-solid fa-inbox"></i>
                <h4>No hay requerimientos registrados</h4>
                <p>Utilice el botón "Agregar Nuevo Requerimiento" para crear el primero.</p>
            </div>
        `;
        return;
    }
    
    // Crear contenedor grid para las tarjetas
    const gridContainer = document.createElement('div');
    gridContainer.className = 'lista-requerimientos-grid';
    
    requerimientos.forEach((req, index) => {
        const card = crearTarjetaRequerimiento(req, index);
        gridContainer.appendChild(card);
    });
    
    lista.appendChild(gridContainer);
}

// ✅ FUNCIÓN: Crear tarjeta de requerimiento
function crearTarjetaRequerimiento(requerimiento, index) {
    const card = document.createElement('div');
    card.className = 'requerimiento-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const clasificacion = requerimiento.clasificacion_requerimiento || 'Sin clasificación';
    const claseClasificacion = `clasificacion-${clasificacion.toLowerCase()}`;
    
    card.innerHTML = `
        <div class="requerimiento-header">
            <h3 class="requerimiento-nombre">${requerimiento.nombre_requerimiento}</h3>
            <span class="requerimiento-clasificacion ${claseClasificacion}">
                ${clasificacion}
            </span>
        </div>
        <div class="requerimiento-info">
            <div class="requerimiento-dato">
                <strong><i class="fa-solid fa-hashtag"></i> Código:</strong>
                <span class="codigo-requerimiento">${requerimiento.codigo_requerimiento || 'N/A'}</span>
            </div>
            <div class="requerimiento-dato">
                <strong><i class="fa-solid fa-sitemap"></i> Familia:</strong>
                <span>${requerimiento.familia_nombre || 'Sin familia'}</span>
            </div>
            <div class="requerimiento-dato">
                <strong><i class="fa-solid fa-layer-group"></i> Grupo:</strong>
                <span>${requerimiento.grupo_nombre || 'Sin grupo'}</span>
            </div>
            <div class="requerimiento-dato">
                <strong><i class="fa-solid fa-stream"></i> Subgrupo:</strong>
                <span>${requerimiento.subgrupo_nombre || 'Sin subgrupo'}</span>
            </div>
            ${requerimiento.descripcion_requerimiento ? `
            <div class="requerimiento-dato descripcion">
                <strong><i class="fa-solid fa-file-lines"></i> Descripción:</strong>
                <span class="texto-descripcion">${requerimiento.descripcion_requerimiento}</span>
            </div>
            ` : ''}
        </div>
        <div class="requerimiento-acciones">
            <button class="btn-editar-requerimiento" onclick="editarRequerimiento(${requerimiento.id})">
                <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-eliminar-requerimiento-card" onclick="eliminarRequerimiento(${requerimiento.id})">
                <i class="fa-solid fa-trash"></i> Eliminar
            </button>
        </div>
    `;
    
    return card;
}

// ✅ FUNCIÓN: Filtrar requerimientos en la lista
function filtrarRequerimientos() {
    const searchTerm = document.getElementById('buscar-requerimientos').value.toLowerCase();
    const cards = document.querySelectorAll('.requerimiento-card');
    
    let resultados = 0;
    
    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        if (texto.includes(searchTerm)) {
            card.style.display = 'block';
            resultados++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay resultados
    if (resultados === 0 && searchTerm) {
        const lista = document.getElementById('lista-requerimientos');
        const mensajeNoResultados = document.createElement('div');
        mensajeNoResultados.className = 'no-resultados';
        mensajeNoResultados.innerHTML = `
            <i class="fa-solid fa-search"></i>
            <h4>No se encontraron resultados</h4>
            <p>No hay requerimientos que coincidan con "${searchTerm}"</p>
        `;
        // Solo agregar el mensaje si no existe ya
        if (!document.querySelector('.no-resultados')) {
            lista.appendChild(mensajeNoResultados);
        }
    } else {
        // Remover mensaje de no resultados si existe
        const mensajeNoResultados = document.querySelector('.no-resultados');
        if (mensajeNoResultados) {
            mensajeNoResultados.remove();
        }
    }
}

// ✅ FUNCIÓN: Obtener token CSRF
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// ✅ FUNCIÓN: Inicializar event listeners
function inicializarEventListeners() {
    console.log('🔧 Inicializando event listeners...');
    
    // Event listeners para los selects en cascada
    document.getElementById('select-familia').addEventListener('change', cargarGrupos);
    document.getElementById('select-grupo').addEventListener('change', cargarSubgrupos);
    document.getElementById('select-subgrupo').addEventListener('change', cargarRequerimientos);
    
    // Event listener para búsqueda
    document.getElementById('buscar-requerimientos').addEventListener('input', filtrarRequerimientos);
    
    // Event listeners para inputs de nuevos elementos
    document.getElementById('nuevo-requerimiento').addEventListener('input', habilitarBotonGuardar);
    document.getElementById('select-requerimiento').addEventListener('change', habilitarBotonGuardar);
}

// ✅ FUNCIÓN: Habilitar/deshabilitar botón guardar
function habilitarBotonGuardar() {
    const requerimientoId = document.getElementById('select-requerimiento').value;
    const inputRequerimientoVisible = document.getElementById('input-requerimiento').style.display !== 'none';
    const nuevoRequerimientoNombre = document.getElementById('nuevo-requerimiento').value.trim();
    const btnGuardar = document.getElementById('btn-guardar-requerimiento');
    
    if (!btnGuardar) return;
    
    const puedeGuardar = requerimientoId || (inputRequerimientoVisible && nuevoRequerimientoNombre);
    btnGuardar.disabled = !puedeGuardar;
    
    console.log('🔧 Estado botón guardar:', {
        puedeGuardar,
        requerimientoId,
        inputRequerimientoVisible,
        nuevoRequerimientoNombre
    });
}

// ✅ FUNCIONES DEL MODAL
function abrirModalRequerimiento() {
    document.getElementById('modal-requerimiento').style.display = 'block';
    // Resetear el formulario
    document.getElementById('form-requerimiento').reset();
    limpiarNivelesInferiores();
    
    // Cargar datos iniciales del modal
    setTimeout(() => {
        cargarFamilias().catch(console.error);
    }, 100);
}

function cerrarModalRequerimiento() {
    document.getElementById('modal-requerimiento').style.display = 'none';
    // Limpiar formulario
    document.getElementById('form-requerimiento').reset();
    // Ocultar todos los inputs nuevos
    document.querySelectorAll('.input-nuevo').forEach(input => {
        input.style.display = 'none';
    });
    // Resetear el botón guardar
    habilitarBotonGuardar();
}

// ✅ Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal-requerimiento');
    if (event.target === modal) {
        cerrarModalRequerimiento();
    }
}

// ✅ Funciones placeholder para editar y eliminar (se implementarán en otros archivos)
function editarRequerimiento(id) {
    console.log('Editar requerimiento:', id);
    // Esta función se implementará en requerimientos_actualizar.js
}

function eliminarRequerimiento(id) {
    console.log('Eliminar requerimiento:', id);
    // Esta función se implementará en requerimientos_eliminar.js
}

// ✅ CORRECCIÓN: Función para habilitar requerimiento (mantener compatibilidad con HTML)
function habilitarRequerimiento() {
    cargarRequerimientos();
}
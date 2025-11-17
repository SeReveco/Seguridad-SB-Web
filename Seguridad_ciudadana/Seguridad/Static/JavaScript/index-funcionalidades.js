// Variables globales
let mapa;
let miniMapa;
let marcadoresDenuncias = [];
let marcadoresVehiculos = [];
let marcadorUbicacion = null;
let requerimientos = [];
let metodoUbicacionActual = 'manual';
let direccionDesdeCoordenadas = '';
let cuadrantesLayer = null;
let rutasLayer = null;

// Cuadrantes reales de San Bernardo (numerados 80-86)
const CUADRANTES_SAN_BERNARDO = [
    {
        id: 80,
        nombre: "Cuadrante 80 - Centro",
        coordinates: [
            [-33.580, -70.710],
            [-33.580, -70.695],
            [-33.595, -70.695],
            [-33.595, -70.710],
            [-33.580, -70.710]
        ],
        color: "#FF6B6B"
    },
    {
        id: 81,
        nombre: "Cuadrante 81 - Nororiente",
        coordinates: [
            [-33.575, -70.695],
            [-33.575, -70.680],
            [-33.585, -70.680],
            [-33.585, -70.695],
            [-33.575, -70.695]
        ],
        color: "#4ECDC4"
    },
    {
        id: 82,
        nombre: "Cuadrante 82 - Norponiente", 
        coordinates: [
            [-33.575, -70.710],
            [-33.575, -70.695],
            [-33.585, -70.695],
            [-33.585, -70.710],
            [-33.575, -70.710]
        ],
        color: "#45B7D1"
    },
    {
        id: 83,
        nombre: "Cuadrante 83 - Suroriente",
        coordinates: [
            [-33.595, -70.695],
            [-33.595, -70.680],
            [-33.605, -70.680],
            [-33.605, -70.695],
            [-33.595, -70.695]
        ],
        color: "#96CEB4"
    },
    {
        id: 84,
        nombre: "Cuadrante 84 - Surponiente",
        coordinates: [
            [-33.595, -70.710],
            [-33.595, -70.695],
            [-33.605, -70.695],
            [-33.605, -70.710],
            [-33.595, -70.710]
        ],
        color: "#FFE66D"
    },
    {
        id: 85,
        nombre: "Cuadrante 85 - Extremo Norte",
        coordinates: [
            [-33.570, -70.705],
            [-33.570, -70.685],
            [-33.575, -70.685],
            [-33.575, -70.705],
            [-33.570, -70.705]
        ],
        color: "#6A0572"
    },
    {
        id: 86,
        nombre: "Cuadrante 86 - Extremo Sur",
        coordinates: [
            [-33.605, -70.705],
            [-33.605, -70.685],
            [-33.615, -70.685],
            [-33.615, -70.705],
            [-33.605, -70.705]
        ],
        color: "#118AB2"
    }
];

// Inicializar el mapa principal
function inicializarMapa() {
    mapa = L.map('map').setView([-33.593, -70.698], 14);
    
    // Cargar tiles de OpenStreetMap (de tu código original)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19, 
        minZoom: 11
    }).addTo(mapa);

    // Agregar cuadrantes
    agregarCuadrantesAlMapa();
    
    // Cargar rutas existentes (de tu código original)
    cargarRutas();
}

// Agregar cuadrantes al mapa
function agregarCuadrantesAlMapa() {
    if (cuadrantesLayer) {
        mapa.removeLayer(cuadrantesLayer);
    }

    cuadrantesLayer = L.layerGroup().addTo(mapa);

    CUADRANTES_SAN_BERNARDO.forEach(cuadrante => {
        const polygon = L.polygon(cuadrante.coordinates, {
            color: cuadrante.color,
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1,
            fillColor: cuadrante.color
        }).addTo(cuadrantesLayer);

        // Agregar tooltip con el nombre del cuadrante
        polygon.bindTooltip(cuadrante.nombre, {
            permanent: false,
            direction: 'center',
            className: 'tooltip-cuadrante'
        });

        // Agregar popup con información del cuadrante
        polygon.bindPopup(`
            <div class="popup-cuadrante">
                <h4>${cuadrante.nombre}</h4>
                <p><strong>ID:</strong> ${cuadrante.id}</p>
                <p><strong>Área:</strong> Aprox. 4 km²</p>
                <button onclick="seleccionarCuadrante(${cuadrante.id})" class="btn-seleccionar-cuadrante">
                    Seleccionar este cuadrante
                </button>
            </div>
        `);
    });
}

// Cargar rutas existentes (de tu código original, adaptada)
function cargarRutas() {
    // Por ahora es un ejemplo - puedes conectar con tu API real
    console.log('Cargando rutas...');
    
    // Limpiar rutas existentes
    if (rutasLayer) {
        mapa.removeLayer(rutasLayer);
    }
    rutasLayer = L.layerGroup().addTo(mapa);
    
    // Ejemplo de ruta de demostración (adaptado de tu código)
    const rutaEjemplo = [
        L.latLng(-33.590, -70.700),
        L.latLng(-33.595, -70.705),
        L.latLng(-33.600, -70.695)
    ];

    const controlRuta = L.Routing.control({
        waypoints: rutaEjemplo,
        routeWhileDragging: false,
        language: 'es',
        showAlternatives: false,
        lineOptions: {
            styles: [{color: 'blue', opacity: 0.6, weight: 5}]
        },
        createMarker: function(i, waypoint, n) {
            if (i === 0) {
                return L.marker(waypoint.latLng, {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).bindPopup('Inicio: Ruta Patrulla 1');
            } else if (i === n - 1) {
                return L.marker(waypoint.latLng, {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).bindPopup('Fin: Ruta Patrulla 1');
            }
            return false; // No crear marcadores para puntos intermedios
        }
    }).addTo(mapa);
    
    // Agregar al layer group para poder limpiarlo después
    rutasLayer.addLayer(controlRuta);
}

// Función para agregar nueva ruta (de tu código original)
function agregarNuevaRuta() {
    const nombre = prompt('Nombre de la ruta:');
    const vehiculo = prompt('Vehículo:');
    const latInicio = parseFloat(prompt('Latitud inicio:'));
    const lngInicio = parseFloat(prompt('Longitud inicio:'));
    const latFin = parseFloat(prompt('Latitud fin:'));
    const lngFin = parseFloat(prompt('Longitud fin:'));

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('vehiculo', vehiculo);
    formData.append('lat_inicio', latInicio);
    formData.append('lng_inicio', lngInicio);
    formData.append('lat_fin', latFin);
    formData.append('lng_fin', lngFin);

    fetch('/agregar-ruta/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Ruta agregada correctamente');
            cargarRutas(); // Recargar rutas
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error agregando ruta:', error);
        alert('Error al agregar ruta');
    });
}

// Seleccionar cuadrante desde el mapa
function seleccionarCuadrante(cuadranteId) {
    document.getElementById('cuadrante').value = cuadranteId;
    Swal.fire({
        icon: 'success',
        title: 'Cuadrante seleccionado',
        text: `Se ha seleccionado el Cuadrante ${cuadranteId}`,
        confirmButtonText: 'Aceptar',
        timer: 2000
    });
}

// Modal functions
function abrirModalDenuncia() {
    document.getElementById('modalDenuncia').style.display = 'block';
}

function cerrarModalDenuncia() {
    document.getElementById('modalDenuncia').style.display = 'none';
    document.getElementById('formDenuncia').reset();
    limpiarUbicacionMapa();
    resetearMetodoUbicacion();
}

function resetearMetodoUbicacion() {
    metodoUbicacionActual = 'manual';
    direccionDesdeCoordenadas = '';
    
    document.querySelectorAll('.btn-metodo').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-metodo="manual"]').classList.add('active');
    
    document.querySelectorAll('.metodo-ubicacion').forEach(seccion => {
        seccion.style.display = 'none';
    });
    document.getElementById('metodo-manual').style.display = 'block';
}

// Función para cambiar entre métodos de ubicación
function cambiarMetodoUbicacion(metodo) {
    metodoUbicacionActual = metodo;
    
    // Actualizar botones
    document.querySelectorAll('.btn-metodo').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-metodo="${metodo}"]`).classList.add('active');
    
    // Mostrar/ocultar secciones
    document.querySelectorAll('.metodo-ubicacion').forEach(seccion => {
        seccion.style.display = 'none';
    });
    document.getElementById(`metodo-${metodo}`).style.display = 'block';
    
    // Inicializar mini mapa si es necesario
    if (metodo === 'mapa' && !miniMapa) {
        inicializarMiniMapa();
    }
    
    // Actualizar validación
    actualizarValidacionUbicacion();
}

// Inicializar mini mapa para selección
function inicializarMiniMapa() {
    miniMapa = L.map('mini-mapa').setView([-33.593, -70.698], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(miniMapa);
    
    // Agregar cuadrantes al mini mapa también
    CUADRANTES_SAN_BERNARDO.forEach(cuadrante => {
        L.polygon(cuadrante.coordinates, {
            color: cuadrante.color,
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.05
        }).addTo(miniMapa);
    });
    
    // Agregar evento de clic al mapa
    miniMapa.on('click', function(e) {
        seleccionarUbicacionEnMapa(e.latlng.lat, e.latlng.lng);
    });
    
    // Agregar control de escala
    L.control.scale().addTo(miniMapa);
}

// Seleccionar ubicación en el mapa
async function seleccionarUbicacionEnMapa(lat, lng) {
    // Limpiar marcador anterior
    if (marcadorUbicacion) {
        miniMapa.removeLayer(marcadorUbicacion);
    }
    
    // Crear nuevo marcador
    marcadorUbicacion = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'marcador-ubicacion',
            iconSize: [20, 20]
        })
    }).addTo(miniMapa);
    
    // Mostrar mensaje de carga
    const direccionElemento = document.getElementById('direccion-seleccionada').querySelector('.texto-direccion');
    direccionElemento.textContent = 'Obteniendo dirección...';
    direccionElemento.className = 'texto-direccion cargando';
    
    // Obtener dirección mejorada
    const direccionCompleta = await obtenerDireccionMejorada(lat, lng);
    direccionElemento.textContent = direccionCompleta;
    direccionElemento.className = 'texto-direccion';
    direccionDesdeCoordenadas = direccionCompleta;
    document.getElementById('direccion').value = direccionCompleta;
    
    // Determinar cuadrante automáticamente
    const cuadranteId = determinarCuadrante(lat, lng);
    if (cuadranteId) {
        document.getElementById('cuadrante').value = cuadranteId;
    }
    
    // Centrar mapa en la ubicación seleccionada
    miniMapa.setView([lat, lng], 16);
}

// Determinar cuadrante basado en coordenadas
function determinarCuadrante(lat, lng) {
    for (const cuadrante of CUADRANTES_SAN_BERNARDO) {
        if (estaEnPoligono(lat, lng, cuadrante.coordinates)) {
            return cuadrante.id;
        }
    }
    return null;
}

// Algoritmo para verificar si un punto está dentro de un polígono
function estaEnPoligono(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][1], yi = polygon[i][0];
        const xj = polygon[j][1], yj = polygon[j][0];
        
        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Obtener dirección mejorada desde coordenadas
async function obtenerDireccionMejorada(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        if (data && data.address) {
            const address = data.address;
            
            // Construir dirección en formato chileno
            let direccionPartes = [];
            
            // Agregar calle y número si están disponibles
            if (address.road) {
                let calle = address.road;
                if (address.house_number) {
                    calle += ' ' + address.house_number;
                }
                direccionPartes.push(calle);
            }
            
            // Agregar comuna/ciudad
            if (address.city || address.town || address.village) {
                direccionPartes.push(address.city || address.town || address.village);
            }
            
            // Agregar región
            if (address.state) {
                direccionPartes.push(address.state);
            }
            
            let direccionFinal = direccionPartes.join(', ');
            
            // Si no pudimos construir una dirección específica, usar la completa
            if (!direccionFinal || direccionFinal.length < 10) {
                direccionFinal = data.display_name;
            }
            
            return direccionFinal;
        }
        
        return data.display_name || `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
    } catch (error) {
        console.error('Error en reverse geocoding:', error);
        return `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

// Limpiar ubicación seleccionada en el mapa
function limpiarUbicacionMapa() {
    if (marcadorUbicacion) {
        miniMapa.removeLayer(marcadorUbicacion);
        marcadorUbicacion = null;
    }
    
    const direccionElemento = document.getElementById('direccion-seleccionada').querySelector('.texto-direccion');
    direccionElemento.textContent = 'No se ha seleccionado ubicación';
    direccionElemento.className = 'texto-direccion vacia';
    
    document.getElementById('direccion').value = '';
    direccionDesdeCoordenadas = '';
}

// Actualizar validación según el método de ubicación
function actualizarValidacionUbicacion() {
    const campoDireccion = document.getElementById('direccion');
    
    if (metodoUbicacionActual === 'manual') {
        campoDireccion.required = true;
    } else {
        campoDireccion.required = false;
    }
}

// Cargar requerimientos para el select
async function cargarRequerimientos() {
    try {
        const response = await fetch('/api/requerimientos/');
        if (response.ok) {
            requerimientos = await response.json();
            const select = document.getElementById('requerimiento');
            select.innerHTML = '<option value="">Seleccione un requerimiento</option>';
            
            requerimientos.forEach(req => {
                const option = document.createElement('option');
                option.value = req.id_requerimiento;
                option.textContent = req.nombre_requerimiento;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando requerimientos:', error);
    }
}

// Cargar denuncias del día
async function cargarDenunciasDelDia() {
    try {
        const response = await fetch('/api/denuncias/');
        if (response.ok) {
            const denuncias = await response.json();
            const hoy = new Date().toISOString().split('T')[0];
            
            // Filtrar denuncias de hoy
            const denunciasHoy = denuncias.filter(denuncia => 
                denuncia.fecha_denuncia.startsWith(hoy)
            );
            
            mostrarDenunciasEnLista(denunciasHoy);
        } else {
            document.getElementById('lista-denuncias-hoy').innerHTML = 
                '<div class="sin-datos">Error cargando denuncias</div>';
        }
    } catch (error) {
        console.error('Error cargando denuncias:', error);
        document.getElementById('lista-denuncias-hoy').innerHTML = 
            '<div class="sin-datos">Error al cargar denuncias</div>';
    }
}

// Mostrar denuncias en la lista
function mostrarDenunciasEnLista(denuncias) {
    const contenedor = document.getElementById('lista-denuncias-hoy');
    
    if (denuncias.length === 0) {
        contenedor.innerHTML = '<div class="sin-datos">No hay denuncias hoy</div>';
        return;
    }
    
    contenedor.innerHTML = denuncias.map(denuncia => `
        <div class="item-denuncia" data-id="${denuncia.id_denuncia}">
            <div class="info-principal">${denuncia.direccion_denuncia}</div>
            <div class="info-secundaria">${denuncia.detalle_denuncia?.substring(0, 100) || 'Sin detalles'}...</div>
            <div class="estado estado-${denuncia.estado_denuncia?.toLowerCase().replace(' ', '-') || 'pendiente'}">
                ${denuncia.estado_denuncia || 'Pendiente'}
            </div>
            <button class="btn-ver-mapa" onclick="mostrarDenunciaEnMapa(${denuncia.id_denuncia})">
                <i class="fa-solid fa-map-marker-alt"></i> Ver en Mapa
            </button>
        </div>
    `).join('');
}

// Cargar vehículos asignados
async function cargarVehiculosAsignados() {
    try {
        const response = await fetch('/api/vehiculos-web/');
        if (response.ok) {
            const vehiculos = await response.json();
            mostrarVehiculosEnLista(vehiculos);
        } else {
            document.getElementById('lista-vehiculos-asignados').innerHTML = 
                '<div class="sin-datos">Error cargando vehículos</div>';
        }
    } catch (error) {
        console.error('Error cargando vehículos:', error);
        document.getElementById('lista-vehiculos-asignados').innerHTML = 
            '<div class="sin-datos">Error al cargar vehículos</div>';
    }
}

// Mostrar vehículos en la lista
function mostrarVehiculosEnLista(vehiculos) {
    const contenedor = document.getElementById('lista-vehiculos-asignados');
    
    if (vehiculos.length === 0) {
        contenedor.innerHTML = '<div class="sin-datos">No hay vehículos asignados</div>';
        return;
    }
    
    contenedor.innerHTML = vehiculos.map(vehiculo => `
        <div class="item-vehiculo" data-id="${vehiculo.id_vehiculo}">
            <div class="info-principal">${vehiculo.patente_vehiculo} - ${vehiculo.marca_vehiculo} ${vehiculo.modelo_vehiculo}</div>
            <div class="info-secundaria">${vehiculo.nombre_tipo_vehiculo}</div>
            <div class="info-secundaria">Estado: ${vehiculo.nombre_estado_vehiculo}</div>
            <button class="btn-ver-mapa" onclick="mostrarVehiculoEnMapa(${vehiculo.id_vehiculo})">
                <i class="fa-solid fa-location-dot"></i> Ver Ubicación
            </button>
        </div>
    `).join('');
}

// Mostrar denuncia en el mapa principal
function mostrarDenunciaEnMapa(id) {
    // Limpiar marcadores anteriores de denuncias
    marcadoresDenuncias.forEach(marker => mapa.removeLayer(marker));
    marcadoresDenuncias = [];
    
    // Por ahora usamos ubicación fija - en producción esto vendría de la API
    const lat = -33.593 + (Math.random() - 0.5) * 0.01;
    const lng = -70.698 + (Math.random() - 0.5) * 0.01;
    
    const marker = L.marker([lat, lng]).addTo(mapa);
    marker.bindPopup(`
        <div class="popup-denuncia">
            <h4>Denuncia #${id}</h4>
            <p><strong>Estado:</strong> Activa</p>
            <p><strong>Prioridad:</strong> Media</p>
            <button onclick="mapa.setView([${lat}, ${lng}], 16)" class="btn-centrar-mapa">
                Centrar en ubicación
            </button>
        </div>
    `).openPopup();
    
    marcadoresDenuncias.push(marker);
    mapa.setView([lat, lng], 16);
}

// Mostrar vehículo en el mapa principal
function mostrarVehiculoEnMapa(id) {
    // Limpiar marcadores anteriores de vehículos
    marcadoresVehiculos.forEach(marker => mapa.removeLayer(marker));
    marcadoresVehiculos = [];
    
    // Por ahora usamos ubicación fija - en producción esto vendría de GPS real
    const lat = -33.593 + (Math.random() - 0.5) * 0.01;
    const lng = -70.698 + (Math.random() - 0.5) * 0.01;
    
    const marker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(mapa);
    
    marker.bindPopup(`
        <div class="popup-vehiculo">
            <h4>Vehículo #${id}</h4>
            <p><strong>Estado:</strong> En patrulla</p>
            <p><strong>Última actualización:</strong> ${new Date().toLocaleTimeString()}</p>
            <button onclick="mapa.setView([${lat}, ${lng}], 16)" class="btn-centrar-mapa">
                Centrar en ubicación
            </button>
        </div>
    `).openPopup();
    
    marcadoresVehiculos.push(marker);
    mapa.setView([lat, lng], 16);
}

// Manejar envío del formulario de denuncia
document.getElementById('formDenuncia').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    let direccionPrincipal = '';
    
    // Determinar la dirección según el método seleccionado
    if (metodoUbicacionActual === 'mapa') {
        if (!direccionDesdeCoordenadas) {
            Swal.fire({
                icon: 'error',
                title: 'Ubicación requerida',
                text: 'Por favor, seleccione una ubicación en el mapa',
                confirmButtonText: 'Aceptar'
            });
            return;
        }
        direccionPrincipal = direccionDesdeCoordenadas;
    } else {
        direccionPrincipal = formData.get('direccion');
        if (!direccionPrincipal.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Dirección requerida',
                text: 'Por favor, ingrese una dirección',
                confirmButtonText: 'Aceptar'
            });
            return;
        }
    }
    
    const denunciaData = {
        direccion_denuncia: direccionPrincipal,
        direccion_denuncia_1: formData.get('direccion_secundaria') || direccionPrincipal,
        detalle_denuncia: formData.get('detalle'),
        id_requerimiento_id: parseInt(formData.get('requerimiento')),
        cuadrante_denuncia: parseInt(formData.get('cuadrante')) || 1,
        visibilidad_camaras_denuncia: formData.get('visibilidad_camaras') === 'on',
        fecha_denuncia: new Date().toISOString().split('T')[0],
        hora_denuncia: new Date().toISOString(),
        id_usuario: 1, // Esto debería venir del usuario logueado
        id_ciudadano: 1, // Esto debería venir del contexto
        estado_denuncia: 'pendiente'
    };
    
    try {
        const response = await fetch('/api/denuncias/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(denunciaData)
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Denuncia creada!',
                text: 'La denuncia se ha registrado correctamente',
                confirmButtonText: 'Aceptar'
            });
            
            cerrarModalDenuncia();
            cargarDenunciasDelDia();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la respuesta del servidor');
        }
    } catch (error) {
        console.error('Error creando denuncia:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la denuncia: ' + error.message,
            confirmButtonText: 'Aceptar'
        });
    }
});

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modalDenuncia');
    if (event.target === modal) {
        cerrarModalDenuncia();
    }
}

// Actualizar datos cada 30 segundos
setInterval(() => {
    cargarDenunciasDelDia();
    cargarVehiculosAsignados();
}, 30000);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarMapa();
    cargarRequerimientos();
    cargarDenunciasDelDia();
    cargarVehiculosAsignados();
    
    // Agregar evento para el botón de agregar ruta si existe
    const btnAgregarRuta = document.getElementById('agregar-ruta-btn');
    if (btnAgregarRuta) {
        btnAgregarRuta.addEventListener('click', agregarNuevaRuta);
    }
});
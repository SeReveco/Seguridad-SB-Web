// Variables globales
let mapa;
let miniMapa;
let marcadoresDenuncias = [];
let marcadoresAsignaciones = [];
let movilesDisponibles = [];
let marcadorUbicacion = null;
let requerimientos = [];
let metodoUbicacionActual = 'manual';
let direccionDesdeCoordenadas = '';
let cuadrantesLayer = null;
let rutasLayer = null;

// Nuevas variables para cuadrantes desde GeoJSON
let cuadrantesGeoJSON = null;
let miniCuadrantesLayer = null;

// Este arreglo se llenará dinámicamente con los cuadrantes de SAN BERNARDO
// cada elemento tendrá: { id, nombre, polygons: [ [ [lat,lng], ... ], ... ], color }
const CUADRANTES_SAN_BERNARDO = [];

// Mapa de colores por número base de cuadrante
const COLORES_POR_NUMERO = {
    80: "#FF6B6B",
    81: "#4ECDC4",
    82: "#45B7D1",
    83: "#96CEB4",
    84: "#FFE66D",
    85: "#6A0572",
    86: "#118AB2",
    87: "#FF9F1C",
    88: "#2EC4B6",
    89: "#8E44AD"
};

// Función que obtiene el color para una feature GeoJSON
function obtenerColor(feature) {
    const num = (feature.properties?.NUM_CUAD || "")
        .replace(/\D/g, ""); // "80A" → "80"

    const numeroBase = parseInt(num);
    return COLORES_POR_NUMERO[numeroBase] || "#FF0000"; // Si no existe, rojo
}

// ============================================
// FUNCIONES DEL MAPA
// ============================================

function inicializarMapa() {
    // Definimos un rectángulo que cubre Santiago
    const limitesSantiago = [
        [-33.9, -71.1], // Suroeste (lat, lng)
        [-33.2, -70.4]  // Noreste  (lat, lng)
    ];

    // Crear mapa con límites
    mapa = L.map('map', {
        center: [-33.593, -70.698],
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: limitesSantiago,     // 👈 límites
        maxBoundsViscosity: 1.0         // 👈 “pared dura” (no deja salir)
    });

    // Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapa);

    // Cargar capas
    cargarCuadrantesDesdeGeoJSON();
    cargarRutas();
}

// Cargar cuadrantes desde un archivo GeoJSON
function cargarCuadrantesDesdeGeoJSON() {
    // AJUSTA ESTA RUTA A DONDE SUBAS TU ARCHIVO
    const urlGeoJSON = '/static/data/cuadrantes_san_bernardo.geojson';

    fetch(urlGeoJSON)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error cargando cuadrantes: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            cuadrantesGeoJSON = data;
            agregarCuadrantesAlMapa();
            // Si el mini mapa ya existe, dibujar también allí
            if (miniMapa) {
                agregarCuadrantesAlMiniMapa();
            }
        })
        .catch(error => {
            console.error('Error al cargar GeoJSON de cuadrantes:', error);
        });
}

function agregarCuadrantesAlMapa() {
    if (cuadrantesLayer) {
        mapa.removeLayer(cuadrantesLayer);
    }

    cuadrantesLayer = L.layerGroup().addTo(mapa);

    // ✅ Usar la URL pasada desde el template
    const urlGeojson = window.URL_CUADRANTES_GEOJSON || '/static/data/cuadrantes_san_bernardo.geojson';
    console.log('Cargando GeoJSON desde:', urlGeojson);

    fetch(urlGeojson)
        .then(response => {
            console.log('Respuesta GeoJSON status:', response.status);
            if (!response.ok) {
                throw new Error('No se pudo cargar el GeoJSON: ' + response.statusText);
            }
            return response.json();
        })
        .then(geojsonData => {
            console.log('GeoJSON cargado, features:', geojsonData.features?.length);

            cuadrantesLayer = L.geoJSON(geojsonData, {
                style: function (feature) {
                    const color = obtenerColor(feature);
                    return {
                        color: color,
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.15,
                        fillColor: color
                    };
                },
                onEachFeature: function (feature, layer) {
                    const props = feature.properties || {};
                    const nombre = props.CUA_DESCRI || `Cuadrante ${props.NUM_CUAD || ''}`.trim();
                    const id = props.CUA_CODIGO || '';
                    const numCuad = props.NUM_CUAD || '';

                    layer.bindTooltip(nombre, {
                        permanent: false,
                        direction: 'center',
                        className: 'tooltip-cuadrante'
                    });

                    layer.bindPopup(`
                        <div class="popup-cuadrante">
                            <h4>${nombre}</h4>
                            <p><strong>Código:</strong> ${id}</p>
                            <p><strong>Número:</strong> ${numCuad}</p>
                        </div>
                    `);
                }
            }).addTo(mapa);
        })
        .catch(error => {
            console.error('Error cargando cuadrantes GeoJSON:', error);
        });
}

// Agregar cuadrantes al mini mapa (cuando exista)
function agregarCuadrantesAlMiniMapa() {
    if (!miniMapa || !cuadrantesGeoJSON) return;

    if (miniCuadrantesLayer) {
        miniMapa.removeLayer(miniCuadrantesLayer);
    }

    miniCuadrantesLayer = L.geoJSON(cuadrantesGeoJSON, {
        filter: function (feature) {
            return feature.properties && feature.properties.COMUNA === 'SAN BERNARDO';
        },
        style: {
            color: '#2563eb',
            weight: 1,
            opacity: 0.6,
            fillOpacity: 0.05,
            fillColor: '#93c5fd'
        }
    }).addTo(miniMapa);
}

// Cargar rutas existentes (vacío - sin ruta de ejemplo)
function cargarRutas() {
    console.log('Cargando rutas...');

    // Limpiar rutas existentes
    if (rutasLayer) {
        mapa.removeLayer(rutasLayer);
    }
    rutasLayer = L.layerGroup().addTo(mapa);

    // Aquí puedes cargar rutas reales desde tu API cuando las tengas
    // Por ahora se queda vacío
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

// ============================================
// FUNCIONES DEL MODAL DE DENUNCIA
// ============================================

// Modal functions
function abrirModalDenuncia() {
    document.getElementById('modalDenuncia').style.display = 'block';
    // Cargar móviles disponibles cuando se abre el modal
    cargarMovilesDisponibles();
}

// Actualizar la función de cierre del modal para limpiar todos los campos
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
    // Esperar un momento para que el contenedor esté visible
    setTimeout(() => {
        if (!miniMapa) {
            miniMapa = L.map('mini-mapa').setView([-33.593, -70.698], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(miniMapa);

            // Agregar cuadrantes al mini mapa si ya tenemos el GeoJSON
            if (cuadrantesGeoJSON) {
                agregarCuadrantesAlMiniMapa();
            }

            // Agregar evento de clic al mapa
            miniMapa.on('click', function (e) {
                seleccionarUbicacionEnMapa(e.latlng.lat, e.latlng.lng);
            });

            // Agregar control de escala
            L.control.scale().addTo(miniMapa);

            // Forzar actualización del mapa
            setTimeout(() => {
                miniMapa.invalidateSize();
            }, 100);
        } else {
            // Si ya existe, forzar actualización del tamaño
            setTimeout(() => {
                miniMapa.invalidateSize();
            }, 100);
        }
    }, 100);
}

// Actualizar la función de selección de ubicación para incluir cuadrante
async function seleccionarUbicacionEnMapa(lat, lng) {
    console.log('Coordenadas click:', lat, lng);

    // Limpiar marcador anterior
    if (marcadorUbicacion) {
        miniMapa.removeLayer(marcadorUbicacion);
    }

    // Crear nuevo marcador en las coordenadas exactas del click
    marcadorUbicacion = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
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
        console.log('Cuadrante detectado:', cuadranteId);
    }

    // Centrar mapa en la ubicación seleccionada
    miniMapa.setView([lat, lng], 16);
}

// Determinar cuadrante basado en coordenadas usando los polígonos del GeoJSON
function determinarCuadrante(lat, lng) {
    if (!CUADRANTES_SAN_BERNARDO.length) return null;

    for (const cuadrante of CUADRANTES_SAN_BERNARDO) {
        for (const polygon of cuadrante.polygons) {
            if (estaEnPoligono(lat, lng, polygon)) {
                return cuadrante.id;
            }
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
    if (marcadorUbicacion && miniMapa) {
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

// ============================================
// FUNCIONES DE ASIGNACIONES DE VEHÍCULOS
// ============================================

// Cargar asignaciones de vehículos del día
async function cargarAsignacionesVehiculos() {
    try {
        const contenedor = document.getElementById('lista-vehiculos-asignados');

        // Mostrar estado de carga
        contenedor.innerHTML = `
            <div class="cargando pulse">
                <i class="fas fa-spinner fa-spin"></i> Cargando asignaciones...
            </div>
        `;

        // Obtener asignaciones del día desde el contexto de Django
        const response = await fetch(window.location.href, {
            headers: {
                'Accept': 'text/html',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        console.log('Recargando asignaciones...');

        // Llamar a la API de asignaciones si existe, o recargar desde API específica
        await cargarAsignacionesDesdeAPI();

    } catch (error) {
        console.error('Error cargando asignaciones:', error);
        mostrarErrorAsignaciones(error.message);
    }
}

// Cargar asignaciones desde API (método alternativo / definitivo)
async function cargarAsignacionesDesdeAPI() {
    try {
        // Usar la nueva API específica para asignaciones del día
        const response = await fetch('/api/asignaciones-dia/');

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                mostrarAsignacionesEnLista(data.asignaciones);
                mostrarAsignacionesEnMapa(data.asignaciones);
            } else {
                throw new Error(data.error || 'Error en la respuesta de la API');
            }
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.log('API no disponible, usando datos de ejemplo:', error);
        mostrarDatosDeEjemplo();
    }
}

// Mostrar datos de ejemplo para asignaciones
function mostrarDatosDeEjemplo() {
    const asignacionesEjemplo = [
        {
            patente: 'ABC123',
            marca: 'Toyota',
            modelo: 'Hilux',
            conductor: 'Juan Pérez',
            hora_creacion: '08:30',
            fecha_turno: '25/12/2024',
            estado: 1,
            estado_texto: 'Disponible',
            color_estado: 'success',
            kilometraje_recorrido: 45,
            kilometraje_total: 12500
        },
        {
            patente: 'DEF456',
            marca: 'Nissan',
            modelo: 'Navara',
            conductor: 'María González',
            hora_creacion: '09:15',
            fecha_turno: '25/12/2024',
            estado: 2,
            estado_texto: 'En proceso',
            color_estado: 'info',
            kilometraje_recorrido: 120,
            kilometraje_total: 32000
        },
        {
            patente: 'GHI789',
            marca: 'Chevrolet',
            modelo: 'LUV',
            conductor: 'Carlos Rodríguez',
            hora_creacion: '10:00',
            fecha_turno: '25/12/2024',
            estado: 3,
            estado_texto: 'En central',
            color_estado: 'warning',
            kilometraje_recorrido: 0,
            kilometraje_total: 8500
        }
    ];

    mostrarAsignacionesEnLista(asignacionesEjemplo);
    mostrarAsignacionesEnMapa(asignacionesEjemplo);
}

// Mostrar error en la carga de asignaciones
function mostrarErrorAsignaciones(mensaje) {
    const contenedor = document.getElementById('lista-vehiculos-asignados');
    contenedor.innerHTML = `
        <div class="sin-datos">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Error al cargar asignaciones</h4>
            <p>${mensaje}</p>
            <button onclick="cargarAsignacionesVehiculos()" class="btn-agregar-denuncia" style="padding: 0.5rem 1rem;">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

// Mostrar asignaciones en la lista del panel lateral
function mostrarAsignacionesEnLista(asignaciones) {
    const contenedor = document.getElementById('lista-vehiculos-asignados');

    if (!asignaciones || asignaciones.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-asignaciones">
                <i class="fas fa-car fa-3x" style="color: #6c757d; opacity: 0.5;"></i>
                <h4>No hay asignaciones activas</h4>
                <p>No hay asignaciones de vehículos para mostrar en este momento.</p>
            </div>
        `;
        return;
    }

    // Contadores por estado
    const contadores = {
        disponible: 0,
        proceso: 0,
        central: 0,
        nodisponible: 0
    };

    // Generar HTML para cada asignación
    const asignacionesHTML = asignaciones.map(asignacion => {
        // Actualizar contadores
        const estado = asignacion.estado_texto?.toLowerCase().replace(' ', '_') || 'disponible';
        if (estado.includes('disponible')) contadores.disponible++;
        else if (estado.includes('proceso')) contadores.proceso++;
        else if (estado.includes('central')) contadores.central++;
        else contadores.nodisponible++;

        // Determinar clase CSS según estado
        const estadoClase = asignacion.color_estado || 'success';
        const estadoTexto = asignacion.estado_texto || 'Disponible';

        // Formatear hora de creación
        const horaCreacion = asignacion.hora_creacion || '00:00';

        // Formatear kilometraje
        const kmRecorrido = asignacion.kilometraje_recorrido || 0;
        const kmTotal = asignacion.kilometraje_total || 0;

        return `
            <div class="item-asignacion" data-patente="${asignacion.patente}">
                <div class="asignacion-header">
                    <div class="asignacion-vehiculo">
                        <div class="asignacion-patente">${asignacion.patente}</div>
                        <div class="asignacion-descripcion">${asignacion.marca} ${asignacion.modelo}</div>
                    </div>
                    <div class="asignacion-estado estado-${estadoClase}">
                        ${estadoTexto}
                    </div>
                </div>
                
                <div class="asignacion-info">
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        ${horaCreacion}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-alt"></i>
                        ${asignacion.fecha_turno || 'Hoy'}
                    </div>
                </div>
                
                <div class="asignacion-conductor">
                    <div class="conductor-nombre">
                        <i class="fas fa-user"></i> ${asignacion.conductor}
                    </div>
                    <div class="conductor-info">
                        Conductor asignado
                    </div>
                </div>
                
                <div class="asignacion-kilometraje">
                    <div class="km-item">
                        <span class="km-label">Recorrido</span>
                        <span class="km-value">${kmRecorrido} km</span>
                    </div>
                    <div class="km-item">
                        <span class="km-label">Total</span>
                        <span class="km-value">${kmTotal} km</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // HTML de contadores
    const contadoresHTML = `
        <div class="contadores-estado">
            <div class="contador contador-disponible">
                <i class="fas fa-check-circle"></i> ${contadores.disponible}
            </div>
            <div class="contador contador-proceso">
                <i class="fas fa-sync-alt"></i> ${contadores.proceso}
            </div>
            <div class="contador contador-central">
                <i class="fas fa-home"></i> ${contadores.central}
            </div>
            <div class="contador contador-nodisponible">
                <i class="fas fa-times-circle"></i> ${contadores.nodisponible}
            </div>
        </div>
    `;

    contenedor.innerHTML = asignacionesHTML + contadoresHTML;

    // Agregar evento de clic a cada asignación para mostrar en el mapa
    document.querySelectorAll('.item-asignacion').forEach(item => {
        item.addEventListener('click', function () {
            const patente = this.getAttribute('data-patente');
            mostrarAsignacionEnMapa(patente);
        });
    });
}

// Mostrar asignaciones en el mapa
function mostrarAsignacionesEnMapa(asignaciones) {
    // Limpiar marcadores anteriores de asignaciones
    marcadoresAsignaciones.forEach(item => mapa.removeLayer(item.marker));
    marcadoresAsignaciones = [];

    if (!asignaciones || asignaciones.length === 0) return;

    // Agregar cada asignación al mapa
    asignaciones.forEach((asignacion, index) => {
        // Generar ubicación aleatoria dentro del área de San Bernardo
        const lat = -33.593 + (Math.random() - 0.5) * 0.02;
        const lng = -70.698 + (Math.random() - 0.5) * 0.02;

        // Determinar color del marcador según estado
        let iconColor = 'blue';
        switch (asignacion.color_estado) {
            case 'success': iconColor = 'green'; break;
            case 'info': iconColor = 'blue'; break;
            case 'warning': iconColor = 'orange'; break;
            case 'danger': iconColor = 'red'; break;
        }

        // Crear marcador personalizado
        const icono = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        const marker = L.marker([lat, lng], { icon: icono }).addTo(mapa);

        // Crear contenido del popup
        const popupContent = `
            <div class="popup-asignacion">
                <h4><i class="fas fa-car"></i> ${asignacion.patente}</h4>
                <p><strong>Vehículo:</strong> ${asignacion.marca} ${asignacion.modelo}</p>
                <p><strong>Conductor:</strong> ${asignacion.conductor}</p>
                <p><strong>Estado:</strong> 
                    <span class="badge badge-${asignacion.color_estado}">
                        ${asignacion.estado_texto}
                    </span>
                </p>
                <p><strong>Hora asignación:</strong> ${asignacion.hora_creacion}</p>
                <p><strong>Kilometraje:</strong> ${asignacion.kilometraje_recorrido || 0} km recorridos</p>
                <button onclick="centrarEnAsignacion('${asignacion.patente}')" class="btn-centrar-mapa">
                    <i class="fas fa-crosshairs"></i> Centrar en ubicación
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Guardar referencia al marcador
        marcadoresAsignaciones.push({
            marker: marker,
            patente: asignacion.patente,
            lat: lat,
            lng: lng,
            asignacion: asignacion
        });
    });

    // Centrar el mapa en el primer vehículo si existe
    if (asignaciones.length > 0) {
        const primeraAsignacion = asignaciones[0];
        const asignacionMarker = marcadoresAsignaciones.find(m => m.patente === primeraAsignacion.patente);
        if (asignacionMarker) {
            mapa.setView([asignacionMarker.lat, asignacionMarker.lng], 14);
        }
    }
}

// Mostrar una asignación específica en el mapa
function mostrarAsignacionEnMapa(patente) {
    const asignacionMarker = marcadoresAsignaciones.find(m => m.patente === patente);

    if (asignacionMarker) {
        // Abrir popup y centrar en el marcador
        asignacionMarker.marker.openPopup();
        mapa.setView([asignacionMarker.lat, asignacionMarker.lng], 16);

        // Destacar el marcador con una animación
        asignacionMarker.marker.setZIndexOffset(1000);
        asignacionMarker.marker.setIcon(L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }));

        setTimeout(() => {
            asignacionMarker.marker.setZIndexOffset(0);
            // Restaurar el icono original según el estado
            let iconColor = 'blue';
            switch (asignacionMarker.asignacion.color_estado) {
                case 'success': iconColor = 'green'; break;
                case 'info': iconColor = 'blue'; break;
                case 'warning': iconColor = 'orange'; break;
                case 'danger': iconColor = 'red'; break;
            }
            asignacionMarker.marker.setIcon(L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            }));
        }, 2000);
    }
}

// Centrar en una asignación específica
function centrarEnAsignacion(patente) {
    mostrarAsignacionEnMapa(patente);
}

// ============================================
// FUNCIONES DE DENUNCIAS
// ============================================

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

// Cargar móviles disponibles
async function cargarMovilesDisponibles() {
    try {
        const response = await fetch('/api/vehiculos-web/');
        if (response.ok) {
            const vehiculos = await response.json();

            const select = document.getElementById('movil');
            select.innerHTML = '<option value="">Seleccione un móvil (opcional)</option>';

            vehiculos.forEach(vehiculo => {
                const option = document.createElement('option');
                option.value = vehiculo.id_vehiculo;

                const estado = vehiculo.nombre_estado_vehiculo || vehiculo.estado_vehiculo || 'Desconocido';
                const patente = vehiculo.patente_vehiculo || 'Sin patente';
                const marca = vehiculo.marca_vehiculo || 'Sin marca';
                const modelo = vehiculo.modelo_vehiculo || 'Sin modelo';

                option.textContent = `${patente} - ${marca} ${modelo} (${estado})`;
                select.appendChild(option);
            });

            if (vehiculos.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay vehículos disponibles';
                option.disabled = true;
                select.appendChild(option);
            }
        } else {
            console.error('Error en respuesta de vehículos:', response.status);
            const select = document.getElementById('movil');
            select.innerHTML = '<option value="">Error cargando vehículos</option>';
        }
    } catch (error) {
        console.error('Error cargando móviles:', error);
        const select = document.getElementById('movil');
        select.innerHTML = '<option value="">Error al cargar vehículos</option>';
    }
}

// Cargar denuncias del día - CORREGIDO
async function cargarDenunciasDelDia() {
    try {
        const contenedor = document.getElementById('lista-denuncias-hoy');

        // Mostrar estado de carga
        contenedor.innerHTML = `
            <div class="cargando pulse">
                <i class="fas fa-spinner fa-spin"></i> Cargando denuncias...
            </div>
        `;

        console.log('📡 Solicitando denuncias del día...');

        const response = await fetch('/api/denuncias-hoy/');

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const denuncias = await response.json();
        console.log(`✅ Denuncias recibidas:`, denuncias);

        if (Array.isArray(denuncias)) {
            mostrarDenunciasEnLista(denuncias);
        } else {
            console.error('❌ La respuesta no es un array:', denuncias);
            mostrarErrorDenuncias('Formato de datos incorrecto');
        }

    } catch (error) {
        console.error('❌ Error cargando denuncias:', error);
        mostrarErrorDenuncias(error.message);
    }
}

// Mostrar denuncias en la lista - ACTUALIZADA
function mostrarDenunciasEnLista(denuncias) {
    const contenedor = document.getElementById('lista-denuncias-hoy');

    if (!denuncias || denuncias.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-datos">
                <i class="fas a-clipboard-list fa-3x"></i>
                <h4>No hay denuncias hoy</h4>
                <p>No se han registrado denuncias en el día de hoy.</p>
            </div>
        `;
        return;
    }

    // Ordenar por fecha/hora más reciente primero
    denuncias.sort((a, b) => {
        if (a.fecha_hora_completa && b.fecha_hora_completa) {
            return new Date(b.fecha_hora_completa) - new Date(a.fecha_hora_completa);
        }
        return 0;
    });

    const denunciasHTML = denuncias.map(denuncia => {
        // Determinar color del estado
        let claseEstado = 'estado-pendiente';
        let iconoEstado = '⏳';

        switch (denuncia.estado_denuncia?.toLowerCase()) {
            case 'en_proceso':
            case 'en proceso':
                claseEstado = 'estado-proceso';
                iconoEstado = '🚨';
                break;
            case 'completada':
                claseEstado = 'estado-completada';
                iconoEstado = '✅';
                break;
            case 'cancelada':
                claseEstado = 'estado-cancelada';
                iconoEstado = '❌';
                break;
            default:
                claseEstado = 'estado-pendiente';
                iconoEstado = '⏳';
        }

        // Formatear información del móvil si existe
        let infoMovil = '';
        if (denuncia.movil_asignado) {
            infoMovil = `
                <div class="info-secundaria">
                    <i class="fas fa-car"></i>
                    <strong>Móvil:</strong> ${denuncia.movil_asignado.patente}
                </div>
            `;
        }

        return `
            <div class="item-denuncia" data-id="${denuncia.id_denuncia}">
                <div class="denuncia-header">
                    <div class="denuncia-info-principal">
                        <div class="denuncia-hora">
                            <i class="far fa-clock"></i>
                            ${denuncia.display_hora || denuncia.hora_denuncia || ''}
                        </div>
                        <div class="denuncia-estado ${claseEstado}">
                            ${iconoEstado} ${denuncia.display_estado || denuncia.estado_denuncia || 'Pendiente'}
                        </div>
                    </div>
                    
                    <div class="info-principal">
                        <i class="fas fa-user"></i>
                        <strong>${denuncia.nombre_denunciante || 'Anónimo'}</strong>
                        <span class="telefono-denunciante">
                            <i class="fas fa-phone"></i> ${denuncia.telefono_denunciante || 'Sin teléfono'}
                        </span>
                    </div>
                    
                    <div class="info-secundaria">
                        <i class="fas fa-map-marker-alt"></i>
                        ${denuncia.direccion_denuncia || 'Sin dirección'}
                    </div>
                    
                    <div class="info-secundaria">
                        <i class="fas fa-exclamation-circle"></i>
                        <strong>${denuncia.nombre_requerimiento || 'Sin requerimiento'}</strong>
                        <span class="clasificacion ${denuncia.clasificacion_requerimiento?.toLowerCase() || 'media'}">
                            ${denuncia.clasificacion_requerimiento || 'Media'}
                        </span>
                    </div>
                    
                    ${infoMovil}
                    
                    <div class="info-secundaria">
                        <i class="fas fa-info-circle"></i>
                        ${denuncia.detalle_denuncia?.substring(0, 120) || 'Sin detalles'}${denuncia.detalle_denuncia?.length > 120 ? '...' : ''}
                    </div>
                    
                    <div class="denuncia-footer">
                        <div class="denuncia-cuadrante">
                            <i class="fas fa-th"></i> Cuadrante ${denuncia.cuadrante_denuncia || 'N/A'}
                        </div>
                        <button class="btn-ver-mapa" onclick="mostrarDenunciaEnMapa(${denuncia.id_denuncia})" 
                                title="Ver en el mapa">
                            <i class="fa-solid fa-map-marker-alt"></i> Ver en Mapa
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    contenedor.innerHTML = denunciasHTML;

    // Agregar evento de clic a cada denuncia
    document.querySelectorAll('.item-denuncia').forEach(item => {
        item.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            mostrarDetallesDenuncia(id, denuncias.find(d => d.id_denuncia == id));
        });
    });
}

// Mostrar denuncias en el mapa
function mostrarDenunciasEnMapa(denuncias) {
    // Limpiar marcadores anteriores de denuncias
    marcadoresDenuncias.forEach(marker => mapa.removeLayer(marker));
    marcadoresDenuncias = [];

    if (!denuncias || denuncias.length === 0) return;

    // Agregar cada denuncia al mapa
    denuncias.forEach((denuncia, index) => {
        // Generar ubicación aleatoria dentro del área de San Bernardo
        const lat = -33.593 + (Math.random() - 0.5) * 0.02;
        const lng = -70.698 + (Math.random() - 0.5) * 0.02;

        // Determinar color según estado
        let iconColor = 'red';
        switch (denuncia.estado_denuncia?.toLowerCase()) {
            case 'pendiente': iconColor = 'red'; break;
            case 'en_proceso':
            case 'en proceso': iconColor = 'blue'; break;
            case 'completada': iconColor = 'green'; break;
            case 'cancelada': iconColor = 'gray'; break;
        }

        const marker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(mapa);

        // Crear contenido del popup con toda la información
        const popupContent = `
            <div class="popup-denuncia">
                <h4><i class="fas fa-exclamation-triangle"></i> ${denuncia.numero_denuncia}</h4>
                <p><strong>Estado:</strong> 
                    <span class="badge badge-${denuncia.estado_denuncia?.toLowerCase().replace(' ', '-')}">
                        ${denuncia.estado_denuncia}
                    </span>
                </p>
                <p><strong>Denunciante:</strong> ${denuncia.nombre_denunciante}</p>
                <p><strong>Teléfono:</strong> ${denuncia.telefono_denunciante}</p>
                <p><strong>Dirección:</strong> ${denuncia.direccion_denuncia}</p>
                <p><strong>Requerimiento:</strong> ${denuncia.nombre_requerimiento}</p>
                <p><strong>Clasificación:</strong> ${denuncia.clasificacion_requerimiento}</p>
                <p><strong>Fecha/Hora:</strong> ${denuncia.fecha_denuncia} ${denuncia.hora_denuncia}</p>
                <p><strong>Detalle:</strong> ${denuncia.detalle_denuncia?.substring(0, 100)}...</p>
                <button onclick="centrarEnDenuncia(${denuncia.id_denuncia})" class="btn-centrar-mapa">
                    <i class="fas fa-crosshairs"></i> Centrar en ubicación
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Guardar referencia al marcador
        marcadoresDenuncias.push({
            marker: marker,
            id: denuncia.id_denuncia,
            lat: lat,
            lng: lng,
            denuncia: denuncia
        });
    });
}

// Mostrar denuncia en el mapa principal
function mostrarDenunciaEnMapa(id) {
    const denunciaMarker = marcadoresDenuncias.find(m => m.id === id);

    if (denunciaMarker) {
        // Abrir popup y centrar en el marcador
        denunciaMarker.marker.openPopup();
        mapa.setView([denunciaMarker.lat, denunciaMarker.lng], 16);

        // Destacar el marcador con una animación
        denunciaMarker.marker.setZIndexOffset(1000);
        setTimeout(() => {
            denunciaMarker.marker.setZIndexOffset(0);
        }, 2000);
    }
}

// Función para mostrar detalles de una denuncia
function mostrarDetallesDenuncia(id, denuncia) {
    if (!denuncia) return;

    Swal.fire({
        title: `Denuncia #${id}`,
        html: `
            <div class="detalle-denuncia">
                <div class="detalle-item">
                    <strong><i class="fas fa-user"></i> Denunciante:</strong>
                    ${denuncia.nombre_denunciante || 'Anónimo'}
                </div>
                <div class="detalle-item">
                    <strong><i class="fas fa-phone"></i> Teléfono:</strong>
                    ${denuncia.telefono_denunciante || 'Sin teléfono'}
                </div>
                <div class="detalle-item">
                    <strong><i class="fas fa-map-marker-alt"></i> Dirección:</strong>
                    ${denuncia.direccion_denuncia || 'Sin dirección'}
                </div>
                <div class="detalle-item">
                    <strong><i class="fas fa-exclamation-circle"></i> Requerimiento:</strong>
                    ${denuncia.nombre_requerimiento || 'Sin requerimiento'} 
                    (${denuncia.clasificacion_requerimiento || 'Media'})
                </div>
                <div class="detalle-item">
                    <strong><i class="fas fa-info-circle"></i> Detalle:</strong>
                    ${denuncia.detalle_denuncia || 'Sin detalles'}
                </div>
                <div class="detalle-item">
                    <strong><i class="fas fa-th"></i> Cuadrante:</strong>
                    ${denuncia.cuadrante_denuncia || 'N/A'}
                </div>
                <div class="detalle-item">
                    <strong><i class="far fa-clock"></i> Hora:</strong>
                    ${denuncia.display_hora || denuncia.hora_denuncia || ''}
                </div>
                <div class="detalle-item">
                    <strong><i class="fas fa-user-check"></i> Registró:</strong>
                    ${denuncia.usuario_registro || 'No especificado'}
                </div>
                ${denuncia.movil_asignado ? `
                    <div class="detalle-item">
                        <strong><i class="fas fa-car"></i> Móvil asignado:</strong>
                        ${denuncia.movil_asignado.patente} - ${denuncia.movil_asignado.marca} ${denuncia.movil_asignado.modelo}
                    </div>
                ` : ''}
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '600px',
        customClass: {
            popup: 'popup-detalle-denuncia'
        }
    });
}

// Mostrar error en la carga de denuncias
function mostrarErrorDenuncias(mensaje) {
    const contenedor = document.getElementById('lista-denuncias-hoy');
    contenedor.innerHTML = `
        <div class="sin-datos">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Error al cargar denuncias</h4>
            <p>${mensaje}</p>
            <button onclick="cargarDenunciasDelDia()" class="btn-agregar-denuncia" style="padding: 0.5rem 1rem;">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

// Centrar en una denuncia específica
function centrarEnDenuncia(id) {
    mostrarDenunciaEnMapa(id);
}

// ============================================
// MANEJO DEL FORMULARIO DE DENUNCIA
// ============================================

// Manejar envío del formulario de denuncia - CON CSRF
document.getElementById('formDenuncia').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    // Obtener datos del formulario
    const nombreCiudadano = formData.get('nombre_ciudadano') || '';
    const telefonoCiudadano = formData.get('telefono_ciudadano') || '';
    const direccionPrincipal = formData.get('direccion') || '';
    const direccionSecundaria = formData.get('direccion_secundaria') || '';
    const detalle = formData.get('detalle') || '';
    const cuadrante = formData.get('cuadrante') || '';

    // Obtener el ID del requerimiento seleccionado
    const requerimientoSelect = document.getElementById('requerimiento');
    const idRequerimiento = requerimientoSelect.value;

    // Obtener el ID del vehículo seleccionado
    const movilSelect = document.getElementById('movil');
    const idVehiculo = movilSelect.value;

    console.log('📋 Validando datos del formulario...');

    // Validaciones básicas
    if (!nombreCiudadano.trim()) {
        mostrarError('El nombre del ciudadano es requerido');
        return;
    }

    if (!telefonoCiudadano.trim()) {
        mostrarError('El teléfono del ciudadano es requerido');
        return;
    }

    if (!direccionPrincipal.trim()) {
        mostrarError('La dirección principal es requerida');
        return;
    }

    if (!cuadrante) {
        mostrarError('Debe seleccionar un cuadrante');
        return;
    }

    if (!idRequerimiento) {
        mostrarError('Debe seleccionar un tipo de requerimiento');
        return;
    }

    if (!detalle.trim()) {
        mostrarError('El detalle de la denuncia es requerido');
        return;
    }

    const denunciaData = {
        nombre_ciudadano: nombreCiudadano.trim(),
        telefono_ciudadano: telefonoCiudadano.trim(),
        direccion_denuncia: direccionPrincipal.trim(),
        direccion_secundaria: direccionSecundaria.trim() || direccionPrincipal.trim(),
        cuadrante_denuncia: parseInt(cuadrante), // parseInt('80A') -> 80
        detalle_denuncia: detalle.trim(),
        id_requerimiento: parseInt(idRequerimiento),
        visibilidad_camaras_denuncia: formData.get('visibilidad_camaras') === 'on',
        id_vehiculo: idVehiculo ? parseInt(idVehiculo) : null
    };

    console.log('📤 Enviando denuncia de operador:', denunciaData);

    // Obtener token CSRF
    const csrfToken = getCSRFToken();

    if (!csrfToken) {
        mostrarError('No se pudo obtener el token de seguridad. Por favor, recargue la página.');
        return;
    }

    try {
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Creando denuncia...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('/api/denuncias-web/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(denunciaData)
        });

        // Cerrar loader
        Swal.close();

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Denuncia creada!',
                html: `
                    <p>La denuncia se ha registrado correctamente</p>
                    <p><strong>Número:</strong> ${result.denuncia.numero_denuncia}</p>
                    <p><strong>Estado:</strong> ${result.denuncia.estado_denuncia}</p>
                    <p><strong>Fecha:</strong> ${new Date(result.denuncia.fecha_creacion).toLocaleDateString()}</p>
                `,
                confirmButtonText: 'Aceptar'
            });

            cerrarModalDenuncia();

            // Recargar datos después de un breve delay
            setTimeout(() => {
                cargarDenunciasDelDia();
                cargarAsignacionesVehiculos();
            }, 1500);

        } else {
            throw new Error(result.error || 'Error desconocido al crear la denuncia');
        }

    } catch (error) {
        console.error('❌ Error creando denuncia:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            html: `
                <p>No se pudo crear la denuncia</p>
                <p><strong>${error.message}</strong></p>
                <p class="small text-muted mt-2">Por favor, verifique los datos e intente nuevamente.</p>
            `,
            confirmButtonText: 'Aceptar'
        });
    }
});

// Función para mostrar errores de validación
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: mensaje,
        confirmButtonText: 'Aceptar'
    });
}

// ============================================
// FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
// ============================================

// Función para actualizar periódicamente los datos
function iniciarActualizacionAutomatica() {
    // Actualizar asignaciones cada 2 minutos
    setInterval(cargarAsignacionesVehiculos, 120000);

    // Actualizar denuncias cada minuto
    setInterval(cargarDenunciasDelDia, 60000);

    // También actualizar cuando el usuario vuelve a la pestaña
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            cargarAsignacionesVehiculos();
            cargarDenunciasDelDia();
        }
    });
}

// Función para actualizar manualmente
function actualizarManual() {
    const btn = document.querySelector('.btn-refresh');
    if (btn) {
        btn.classList.add('refreshing');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    Promise.all([
        cargarAsignacionesVehiculos(),
        cargarDenunciasDelDia()
    ]).finally(() => {
        if (btn) {
            btn.classList.remove('refreshing');
            btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }

        // Mostrar notificación de éxito
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-actualizacion';
        notificacion.innerHTML = '<i class="fas fa-check-circle"></i> Datos actualizados';
        notificacion.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notificacion.remove(), 300);
        }, 2000);
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Función de inicialización principal
function inicializarAplicacion() {
    // Inicializar mapa
    inicializarMapa();

    // Cargar datos iniciales
    cargarRequerimientos();
    cargarDenunciasDelDia();
    cargarAsignacionesVehiculos();

    // Iniciar actualización automática
    iniciarActualizacionAutomatica();

    // Configurar botón de actualización manual
    const btnActualizar = document.querySelector('.btn-refresh');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarManual);
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
    const modal = document.getElementById('modalDenuncia');
    if (event.target === modal) {
        cerrarModalDenuncia();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    inicializarAplicacion();

    // Agregar animación CSS para notificaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .pulse {
            animation: pulse 1.5s infinite;
        }
    `;
    document.head.appendChild(style);
});

// Función para obtener el token CSRF de las cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Buscar la cookie que comienza con el nombre especificado
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Función alternativa si la anterior no funciona
function getCSRFToken() {
    // Primero intentar obtener de la cookie
    const token = getCookie('csrftoken');
    if (token) return token;

    // Si no está en cookie, buscar en el meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        return metaToken.getAttribute('content');
    }

    // Si no hay meta tag, buscar input hidden
    const inputToken = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (inputToken) {
        return inputToken.value;
    }

    console.warn('No se encontró token CSRF');
    return '';
}

// Exportar funciones para uso global (si es necesario)
window.cargarAsignacionesVehiculos = cargarAsignacionesVehiculos;
window.cargarDenunciasDelDia = cargarDenunciasDelDia;
window.mostrarAsignacionEnMapa = mostrarAsignacionEnMapa;
window.mostrarDenunciaEnMapa = mostrarDenunciaEnMapa;
window.actualizarManual = actualizarManual;

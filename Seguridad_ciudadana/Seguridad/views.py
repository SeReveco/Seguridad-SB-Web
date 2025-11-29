from datetime import date
import random
import re
from django.contrib import messages  # type: ignore
from django.shortcuts import render, redirect, get_object_or_404  # type: ignore
from django.contrib.auth import login, authenticate, logout  # type: ignore
from django.utils.decorators import method_decorator  # type: ignore
from django.contrib.auth.hashers import make_password, check_password  # type: ignore
from django.contrib.auth.decorators import login_required  # type: ignore
from django.http import HttpResponse, JsonResponse  # type: ignore
from django.utils import timezone
from django.views import View  # type: ignore
from .models import (
    EstadoVehiculo, FamiliaDenuncia, GrupoDenuncia, Requerimiento, SubgrupoDenuncia,
    TiposVehiculos, Usuario, Denuncia, Vehiculos,
    AsignacionVehiculo, AsignacionRadio, Roles, Turnos,
    Ciudadano, ServiciosEmergencia, MovilesDenuncia, DerivacionesDenuncia,
    Fiscalizacion, SolicitudCiudadano, Radio
)
from django.views.decorators.csrf import csrf_exempt  # type: ignore
import json
from django.db.models import Q  # type: ignore


# Vistas básicas de autenticación
@login_required
def index(request):
    """Vista principal luego del login"""
    usuario_nombre = request.session.get('usuario_nombre', '')
    mostrar_bienvenida = request.session.get('mostrar_bienvenida', False)

    # Limpiar bandera después de mostrarla
    if 'mostrar_bienvenida' in request.session:
        del request.session['mostrar_bienvenida']

    context = {
        'usuario_nombre': usuario_nombre,
        'mostrar_bienvenida': mostrar_bienvenida
    }

    return render(request, 'index.html', context)

@csrf_exempt
@login_required
def api_asignaciones_vehiculos_web(request):
    """API para obtener asignaciones de vehículos con información completa"""
    try:
        if request.method == 'GET':
            # Obtener asignaciones activas con todas las relaciones
            asignaciones = AsignacionVehiculo.objects.filter(
                activo=1  # Solo asignaciones activas
            ).select_related(
                'id_vehiculo__id_tipo_vehiculo',
                'id_vehiculo__id_estado_vehiculo',
                'id_usuario',
                'id_usuario__id_rol',
                'id_usuario__id_turno'
            )
            
            data = []
            for asignacion in asignaciones:
                # Obtener radio asignado si existe
                radio_asignado = AsignacionRadio.objects.filter(
                    id_usuario=asignacion.id_usuario,
                    fecha_devolucion__isnull=True
                ).select_related('id_radio').first()
                
                data.append({
                    'id_asignacion': asignacion.id,
                    'patente_vehiculo': asignacion.id_vehiculo.patente_vehiculo,
                    'marca_vehiculo': asignacion.id_vehiculo.marca_vehiculo,
                    'modelo_vehiculo': asignacion.id_vehiculo.modelo_vehiculo,
                    'tipo_vehiculo': asignacion.id_vehiculo.id_tipo_vehiculo.nombre_tipo_vehiculo,
                    'estado_vehiculo': asignacion.id_vehiculo.id_estado_vehiculo.nombre_estado,
                    'conductor_nombre': f"{asignacion.id_usuario.nombre_usuario} {asignacion.id_usuario.apellido_pat_usuario}",
                    'conductor_rol': asignacion.id_usuario.id_rol.nombre_rol,
                    'turno': asignacion.id_usuario.id_turno.nombre_turno if asignacion.id_usuario.id_turno else 'Sin turno',
                    'radio_asignado': radio_asignado.id_radio.nombre_radio if radio_asignado else 'Sin radio',
                    'disponibilidad': 'Disponible' if asignacion.activo == 1 else 'No disponible',
                    'fecha_asignacion': asignacion.fecha_asignacion.isoformat(),
                    'kilometraje_recorrido': asignacion.kilometraje_recorrido,
                    # Coordenadas de ejemplo - en producción esto vendría de GPS
                    'latitud': -33.5925 + (random.random() - 0.5) * 0.01,
                    'longitud': -70.7003 + (random.random() - 0.5) * 0.01
                })
            
            return JsonResponse(data, safe=False)
            
    except Exception as e:
        print(f"❌ Error en api_asignaciones_vehiculos_web: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def cerrar_sesion(request):
    """Cerrar sesión de forma segura"""
    try:
        usuario_info = {
            'nombre': f"{request.user.nombre_usuario} {request.user.apellido_pat_usuario}",
            # 🔴 CORREGIR: Cambiar request.user.rol.nombre_rol por request.user.id_rol.nombre_rol
            'rol': request.user.id_rol.nombre_rol
        }

        # Cerrar sesión
        logout(request)
        request.session.flush()

        # Mensaje de cierre
        request.session['alert_type'] = 'info'
        request.session['alert_title'] = 'Sesión Cerrada'
        request.session['alert_message'] = f'Hasta pronto, {usuario_info["nombre"]}! 👋'

        return redirect('login')

    except Exception:
        return redirect('login')


def iniciar_sesion(request):
    """Inicio de sesión para usuarios del sistema"""
    if request.method == 'POST':
        correo_electronico_usuario = request.POST.get('correo_electronico_usuario')
        password = request.POST.get('password')
        user = authenticate(request, username=correo_electronico_usuario, password=password)

        if user is not None:
            rol_permitido = user.id_rol.nombre_rol.lower() in ['administrador', 'operador']

            if rol_permitido:
                login(request, user)

                rol_mensaje = user.id_rol.nombre_rol
                request.session['usuario_nombre'] = f'{user.nombre_usuario} {user.apellido_pat_usuario}'
                request.session['usuario_rol'] = rol_mensaje
                request.session['mostrar_bienvenida'] = True

                return redirect('index')
            else:
                # Acceso denegado
                request.session['alert_type'] = 'error'
                request.session['alert_title'] = 'Acceso Denegado 🔒'
                request.session['alert_message'] = 'Solo personal autorizado puede acceder al sistema.'
                return redirect('login')
        else:
            # Credenciales inválidas
            request.session['alert_type'] = 'error'
            request.session['alert_title'] = 'Error de Login ❌'
            request.session['alert_message'] = 'Credenciales inválidas. Verifique su correo y contraseña.'
            return redirect('login')

    # Manejo de alertas en login
    alert_type = request.session.pop('alert_type', None)
    alert_title = request.session.pop('alert_title', None)
    alert_message = request.session.pop('alert_message', None)

    context = {
        'alert_type': alert_type,
        'alert_title': alert_title,
        'alert_message': alert_message
    }

    return render(request, 'usuario/inicio.html', context)


def clear_alert(request):
    """Limpiar alertas de la sesión"""
    if 'alert_type' in request.session:
        for key in ['alert_type', 'alert_title', 'alert_message']:
            request.session.pop(key, None)
        request.session.modified = True
    return JsonResponse({'status': 'success'})


@login_required
def admin_dashboard(request):
    """Panel de administración"""
    # 🔴 CORREGIR: Cambiar request.user.rol.nombre_rol por request.user.id_rol.nombre_rol
    if request.user.id_rol.nombre_rol.lower() != 'administrador':
        return redirect('index')

    total_usuarios = Usuario.objects.count()
    total_denuncias = Denuncia.objects.count()
    vehiculos_activos = Vehiculos.objects.filter(id_estado_vehiculo__nombre_estado='Disponible').count()

    context = {
        'total_usuarios': total_usuarios,
        'total_denuncias': total_denuncias,
        'vehiculos_activos': vehiculos_activos,
    }
    return render(request, 'usuario/admin.html', context)

@login_required
def admin_requerimientos(request):
    """Página principal de gestión de requerimientos"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return redirect('login')
    
    # Obtener todos los datos para mostrar
    familias = FamiliaDenuncia.objects.all()
    grupos = GrupoDenuncia.objects.all()
    subgrupos = SubgrupoDenuncia.objects.all()
    requerimientos = Requerimiento.objects.all()
    
    context = {
        'familias': familias,
        'grupos': grupos,
        'subgrupos': subgrupos,
        'requerimientos': requerimientos,
    }
    return render(request, 'crud/admin/requerimientos.html', context)

# ✅ API PARA FAMILIAS (CORREGIDA SEGÚN BD REAL)
@csrf_exempt
def api_familias(request, familia_id=None):
    """Manejar operaciones CRUD para familias"""
    try:
        if request.method == 'GET':
            familias = FamiliaDenuncia.objects.all()
            data = []
            for familia in familias:
                data.append({
                    'id': familia.id_familia_denuncia,  # CAMBIADO: id en lugar de id_familia_denuncia
                    'nombre_familia_denuncia': familia.nombre_familia_denuncia,
                    'codigo_familia': familia.codigo_familia  # CAMBIADO: codigo_familia en lugar de codigo_familia_denuncia
                })
            return JsonResponse(data, safe=False)
        
        elif request.method == 'POST':
            data = json.loads(request.body)
            nombre = data.get('nombre')
            
            if not nombre:
                return JsonResponse({'error': 'El nombre es requerido'}, status=400)
            
            # Verificar si ya existe
            if FamiliaDenuncia.objects.filter(nombre_familia_denuncia=nombre).exists():
                return JsonResponse({'error': 'La familia ya existe'}, status=400)
            
            # Crear familia con el campo correcto
            familia = FamiliaDenuncia.objects.create(
                nombre_familia_denuncia=nombre,
                codigo_familia=nombre[:3].upper() + str(FamiliaDenuncia.objects.count() + 1).zfill(3)
            )
            
            return JsonResponse({
                'id': familia.id_familia_denuncia,  # CAMBIADO: id en lugar de id_familia_denuncia
                'nombre_familia_denuncia': familia.nombre_familia_denuncia,
                'codigo_familia': familia.codigo_familia  # CAMBIADO: codigo_familia en lugar de codigo_familia_denuncia
            })
            
    except Exception as e:
        print(f"❌ Error en api_familias: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

# ✅ CORREGIR API DE GRUPOS PARA INCLUIR INFORMACIÓN DE LA FAMILIA
@csrf_exempt
def api_grupos(request, grupo_id=None):
    """Manejar operaciones CRUD para grupos - CORREGIDA"""
    try:
        if request.method == 'GET':
            familia_id = request.GET.get('familia_id')
            
            if familia_id:
                try:
                    familia_id = int(familia_id)
                except (ValueError, TypeError):
                    return JsonResponse({'error': 'ID de familia inválido'}, status=400)
                
                grupos = GrupoDenuncia.objects.filter(id_familia_denuncia_id=familia_id).select_related('id_familia_denuncia')
            else:
                grupos = GrupoDenuncia.objects.all().select_related('id_familia_denuncia')
            
            data = []
            for grupo in grupos:
                grupo_data = {
                    'id_grupo_denuncia': grupo.id_grupo_denuncia,
                    'nombre_grupo_denuncia': grupo.nombre_grupo_denuncia,
                    'codigo_grupo': grupo.codigo_grupo,
                    'id_familia_denuncia': grupo.id_familia_denuncia_id,
                }
                
                # ✅ AGREGAR INFORMACIÓN DE LA FAMILIA SI ESTÁ DISPONIBLE
                if hasattr(grupo, 'id_familia_denuncia') and grupo.id_familia_denuncia:
                    grupo_data['nombre_familia_denuncia'] = grupo.id_familia_denuncia.nombre_familia_denuncia
                    grupo_data['codigo_familia'] = grupo.id_familia_denuncia.codigo_familia
                
                data.append(grupo_data)
            
            return JsonResponse(data, safe=False)
            
    except Exception as e:
        print(f"❌ Error en api_grupos: {str(e)}")
        return JsonResponse({'error': f'Error interno del servidor: {str(e)}'}, status=500)
    
# ✅ CORREGIR API DE SUBGRUPOS PARA INCLUIR INFORMACIÓN DEL GRUPO
@csrf_exempt
def api_subgrupos(request, subgrupo_id=None):
    """Manejar operaciones CRUD para subgrupos"""
    try:
        if request.method == 'GET':
            grupo_id = request.GET.get('grupo_id')
            if grupo_id:
                subgrupos = SubgrupoDenuncia.objects.filter(id_grupo_denuncia_id=grupo_id).select_related('id_grupo_denuncia')
            else:
                subgrupos = SubgrupoDenuncia.objects.all().select_related('id_grupo_denuncia')
            
            data = []
            for subgrupo in subgrupos:
                subgrupo_data = {
                    'id': subgrupo.id_subgrupo_denuncia,
                    'id_subgrupo_denuncia': subgrupo.id_subgrupo_denuncia,
                    'nombre_subgrupo_denuncia': subgrupo.nombre_subgrupo_denuncia,
                    'codigo_subgrupo': subgrupo.codigo_subgrupo,
                    'id_grupo_denuncia': subgrupo.id_grupo_denuncia_id,
                }
                
                # ✅ AGREGAR INFORMACIÓN DEL GRUPO SI ESTÁ DISPONIBLE
                if hasattr(subgrupo, 'id_grupo_denuncia') and subgrupo.id_grupo_denuncia:
                    subgrupo_data['nombre_grupo_denuncia'] = subgrupo.id_grupo_denuncia.nombre_grupo_denuncia
                    subgrupo_data['codigo_grupo'] = subgrupo.id_grupo_denuncia.codigo_grupo
                
                data.append(subgrupo_data)
            return JsonResponse(data, safe=False)
            
    except Exception as e:
        print(f"❌ Error en api_subgrupos: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def api_requerimientos(request):
    """Listar y crear requerimientos - MEJORADA CON MANEJO DE ERRORES"""
    try:
        if request.method == 'GET':
            subgrupo_id = request.GET.get('subgrupo_id')
            
            # ✅ OPTIMIZACIÓN: Cargar todas las relaciones en una sola consulta
            if subgrupo_id:
                requerimientos = Requerimiento.objects.filter(
                    id_subgrupo_denuncia_id=subgrupo_id
                ).select_related(
                    'id_subgrupo_denuncia__id_grupo_denuncia__id_familia_denuncia'
                )
            else:
                requerimientos = Requerimiento.objects.all().select_related(
                    'id_subgrupo_denuncia__id_grupo_denuncia__id_familia_denuncia'
                )
            
            data = []
            for req in requerimientos:
                try:
                    # ✅ ACCESO DIRECTO A LAS RELACIONES PRE-CARGADAS
                    subgrupo = req.id_subgrupo_denuncia
                    grupo = subgrupo.id_grupo_denuncia
                    familia = grupo.id_familia_denuncia
                    
                    requerimiento_data = {
                        'id': req.id_requerimiento,
                        'id_requerimiento': req.id_requerimiento,
                        'nombre_requerimiento': req.nombre_requerimiento,
                        'clasificacion_requerimiento': req.clasificacion_requerimiento,
                        'descripcion_requerimiento': req.descripcion_requerimiento,
                        'codigo_requerimiento': req.codigo_requerimiento,
                        'id_subgrupo_denuncia': req.id_subgrupo_denuncia_id,
                        
                        # ✅ INFORMACIÓN DE JERARQUÍA (cargada eficientemente)
                        'familia_nombre': familia.nombre_familia_denuncia,
                        'grupo_nombre': grupo.nombre_grupo_denuncia,
                        'subgrupo_nombre': subgrupo.nombre_subgrupo_denuncia,
                        
                        # ✅ IDs para referencia
                        'id_familia_denuncia': familia.id_familia_denuncia,
                        'id_grupo_denuncia': grupo.id_grupo_denuncia,
                        'id_subgrupo_denuncia_completo': subgrupo.id_subgrupo_denuncia,
                        
                        # ✅ Códigos de jerarquía
                        'codigo_familia': familia.codigo_familia,
                        'codigo_grupo': grupo.codigo_grupo,
                        'codigo_subgrupo': subgrupo.codigo_subgrupo
                    }
                    data.append(requerimiento_data)
                    
                except Exception as e:
                    print(f"⚠️ Error procesando requerimiento {req.id_requerimiento}: {e}")
                    # Continuar con el siguiente requerimiento
                    continue
            
            print(f"✅ Requerimientos cargados: {len(data)} con información de jerarquía")
            return JsonResponse(data, safe=False)
        
        elif request.method == 'POST':
            data = json.loads(request.body)
            
            # ✅ VALIDACIÓN MÁS ROBUSTA
            required_fields = ['nombre', 'subgrupo_id']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({'error': f'El campo {field} es requerido'}, status=400)
            
            nombre = data.get('nombre')
            subgrupo_id = data.get('subgrupo_id')
            clasificacion = data.get('clasificacion', 'Media')
            descripcion = data.get('descripcion', '')
            
            # Verificar que el subgrupo existe
            try:
                subgrupo = SubgrupoDenuncia.objects.get(id_subgrupo_denuncia=subgrupo_id)
            except SubgrupoDenuncia.DoesNotExist:
                return JsonResponse({'error': 'El subgrupo especificado no existe'}, status=400)
            
            # Verificar si ya existe un requerimiento con el mismo nombre en el mismo subgrupo
            if Requerimiento.objects.filter(
                nombre_requerimiento=nombre, 
                id_subgrupo_denuncia_id=subgrupo_id
            ).exists():
                return JsonResponse({
                    'error': 'Ya existe un requerimiento con este nombre en el subgrupo seleccionado'
                }, status=400)
            
            # Generar código único
            codigo_base = nombre[:3].upper()
            contador = 1
            codigo_requerimiento = f"{codigo_base}{str(contador).zfill(3)}"
            
            while Requerimiento.objects.filter(codigo_requerimiento=codigo_requerimiento).exists():
                contador += 1
                codigo_requerimiento = f"{codigo_base}{str(contador).zfill(3)}"
            
            # Crear requerimiento
            requerimiento = Requerimiento.objects.create(
                nombre_requerimiento=nombre,
                clasificacion_requerimiento=clasificacion,
                descripcion_requerimiento=descripcion,
                id_subgrupo_denuncia_id=subgrupo_id,
                codigo_requerimiento=codigo_requerimiento
            )
            
            # ✅ OPTIMIZAR: Cargar relaciones para la respuesta
            requerimiento_con_relaciones = Requerimiento.objects.select_related(
                'id_subgrupo_denuncia__id_grupo_denuncia__id_familia_denuncia'
            ).get(id_requerimiento=requerimiento.id_requerimiento)
            
            try:
                subgrupo = requerimiento_con_relaciones.id_subgrupo_denuncia
                grupo = subgrupo.id_grupo_denuncia
                familia = grupo.id_familia_denuncia
                
                return JsonResponse({
                    'id': requerimiento.id_requerimiento,
                    'id_requerimiento': requerimiento.id_requerimiento,
                    'nombre_requerimiento': requerimiento.nombre_requerimiento,
                    'clasificacion_requerimiento': requerimiento.clasificacion_requerimiento,
                    'descripcion_requerimiento': requerimiento.descripcion_requerimiento,
                    'codigo_requerimiento': requerimiento.codigo_requerimiento,
                    'id_subgrupo_denuncia': requerimiento.id_subgrupo_denuncia_id,
                    
                    # ✅ JERARQUÍA
                    'familia_nombre': familia.nombre_familia_denuncia,
                    'grupo_nombre': grupo.nombre_grupo_denuncia,
                    'subgrupo_nombre': subgrupo.nombre_subgrupo_denuncia,
                    'id_familia_denuncia': familia.id_familia_denuncia,
                    'id_grupo_denuncia': grupo.id_grupo_denuncia
                }, status=201)
                
            except Exception as e:
                print(f"⚠️ Error obteniendo jerarquía para nuevo requerimiento: {e}")
                return JsonResponse({
                    'id': requerimiento.id_requerimiento,
                    'nombre_requerimiento': requerimiento.nombre_requerimiento,
                    'clasificacion_requerimiento': requerimiento.clasificacion_requerimiento,
                    'descripcion_requerimiento': requerimiento.descripcion_requerimiento,
                    'codigo_requerimiento': requerimiento.codigo_requerimiento,
                    'id_subgrupo_denuncia': requerimiento.id_subgrupo_denuncia_id,
                    'familia_nombre': 'No disponible',
                    'grupo_nombre': 'No disponible',
                    'subgrupo_nombre': 'No disponible'
                }, status=201)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido en el cuerpo de la solicitud'}, status=400)
    except Exception as e:
        print(f"❌ Error en api_requerimientos: {str(e)}")
        return JsonResponse({'error': 'Error interno del servidor'}, status=500)

# ✅ API PARA DETALLE DE FAMILIA (CORREGIDA)
@csrf_exempt
def api_familia_detalle(request, familia_id):
    """Manejar operaciones CRUD para una familia específica"""
    try:
        familia = FamiliaDenuncia.objects.get(id_familia_denuncia=familia_id)
    except FamiliaDenuncia.DoesNotExist:
        return JsonResponse({'error': 'Familia no encontrada'}, status=404)
    
    if request.method == 'DELETE':
        try:
            # Verificar si hay grupos dependientes
            grupos_dependientes = GrupoDenuncia.objects.filter(id_familia_denuncia_id=familia_id)
            if grupos_dependientes.exists():
                return JsonResponse({
                    'error': 'No se puede eliminar la familia porque tiene grupos asociados. Elimine primero los grupos.'
                }, status=400)
            
            familia.delete()
            return JsonResponse({'mensaje': 'Familia eliminada correctamente'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

# ✅ API PARA DETALLE DE GRUPO (CORREGIDA)
@csrf_exempt
def api_grupo_detalle(request, grupo_id):
    """Manejar operaciones CRUD para un grupo específico"""
    try:
        grupo = GrupoDenuncia.objects.get(id_grupo_denuncia=grupo_id)
    except GrupoDenuncia.DoesNotExist:
        return JsonResponse({'error': 'Grupo no encontrado'}, status=404)
    
    if request.method == 'DELETE':
        try:
            # Verificar si hay subgrupos dependientes
            subgrupos_dependientes = SubgrupoDenuncia.objects.filter(id_grupo_denuncia_id=grupo_id)
            if subgrupos_dependientes.exists():
                return JsonResponse({
                    'error': 'No se puede eliminar el grupo porque tiene subgrupos asociados. Elimine primero los subgrupos.'
                }, status=400)
            
            grupo.delete()
            return JsonResponse({'mensaje': 'Grupo eliminado correctamente'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

# ✅ API PARA DETALLE DE SUBGRUPO (CORREGIDA)
@csrf_exempt
def api_subgrupo_detalle(request, subgrupo_id):
    """Manejar operaciones CRUD para un subgrupo específico"""
    try:
        subgrupo = SubgrupoDenuncia.objects.get(id_subgrupo_denuncia=subgrupo_id)
    except SubgrupoDenuncia.DoesNotExist:
        return JsonResponse({'error': 'Subgrupo no encontrado'}, status=404)
    
    if request.method == 'DELETE':
        try:
            # Verificar si hay requerimientos dependientes
            requerimientos_dependientes = Requerimiento.objects.filter(id_subgrupo_denuncia_id=subgrupo_id)
            if requerimientos_dependientes.exists():
                return JsonResponse({
                    'error': 'No se puede eliminar el subgrupo porque tiene requerimientos asociados. Elimine primero los requerimientos.'
                }, status=400)
            
            subgrupo.delete()
            return JsonResponse({'mensaje': 'Subgrupo eliminado correctamente'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def api_requerimiento_detalle(request, requerimiento_id):
    """Manejar operaciones CRUD para un requerimiento específico - MEJORADA"""
    try:
        # ✅ OPTIMIZACIÓN: Cargar relaciones para el detalle
        requerimiento = Requerimiento.objects.select_related(
            'id_subgrupo_denuncia__id_grupo_denuncia__id_familia_denuncia'
        ).get(id_requerimiento=requerimiento_id)
    except Requerimiento.DoesNotExist:
        return JsonResponse({'error': 'Requerimiento no encontrado'}, status=404)
    
    if request.method == 'GET':
        try:
            subgrupo = requerimiento.id_subgrupo_denuncia
            grupo = subgrupo.id_grupo_denuncia
            familia = grupo.id_familia_denuncia
            
            data = {
                'id_requerimiento': requerimiento.id_requerimiento,
                'nombre_requerimiento': requerimiento.nombre_requerimiento,
                'clasificacion_requerimiento': requerimiento.clasificacion_requerimiento,
                'descripcion_requerimiento': requerimiento.descripcion_requerimiento,
                'codigo_requerimiento': requerimiento.codigo_requerimiento,
                'id_subgrupo_denuncia': requerimiento.id_subgrupo_denuncia_id,
                
                # ✅ INFORMACIÓN DE JERARQUÍA
                'familia_nombre': familia.nombre_familia_denuncia,
                'grupo_nombre': grupo.nombre_grupo_denuncia,
                'subgrupo_nombre': subgrupo.nombre_subgrupo_denuncia,
                'id_familia_denuncia': familia.id_familia_denuncia,
                'id_grupo_denuncia': grupo.id_grupo_denuncia,
            }
        except Exception as e:
            print(f"⚠️ Error obteniendo jerarquía: {e}")
            data = {
                'id_requerimiento': requerimiento.id_requerimiento,
                'nombre_requerimiento': requerimiento.nombre_requerimiento,
                'clasificacion_requerimiento': requerimiento.clasificacion_requerimiento,
                'descripcion_requerimiento': requerimiento.descripcion_requerimiento,
                'codigo_requerimiento': requerimiento.codigo_requerimiento,
                'id_subgrupo_denuncia': requerimiento.id_subgrupo_denuncia_id,
                'familia_nombre': 'No disponible',
                'grupo_nombre': 'No disponible',
                'subgrupo_nombre': 'No disponible',
            }
        
        return JsonResponse(data)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print(f"📥 Datos recibidos para actualizar requerimiento {requerimiento_id}: {data}")
            
            # ✅ VALIDACIÓN DE DATOS
            campos_actualizados = []
            
            # Validar y actualizar nombre
            if 'nombre_requerimiento' in data:
                nuevo_nombre = data['nombre_requerimiento'].strip()
                if nuevo_nombre and nuevo_nombre != requerimiento.nombre_requerimiento:
                    # Verificar que no exista otro requerimiento con el mismo nombre en el mismo subgrupo
                    if Requerimiento.objects.filter(
                        nombre_requerimiento=nuevo_nombre,
                        id_subgrupo_denuncia_id=requerimiento.id_subgrupo_denuncia_id
                    ).exclude(id_requerimiento=requerimiento_id).exists():
                        return JsonResponse({
                            'error': 'Ya existe un requerimiento con este nombre en el mismo subgrupo'
                        }, status=400)
                    
                    requerimiento.nombre_requerimiento = nuevo_nombre
                    campos_actualizados.append('nombre')
            
            # Actualizar clasificación
            if 'clasificacion_requerimiento' in data:
                requerimiento.clasificacion_requerimiento = data['clasificacion_requerimiento']
                campos_actualizados.append('clasificación')
            
            # Actualizar descripción
            if 'descripcion_requerimiento' in data:
                requerimiento.descripcion_requerimiento = data['descripcion_requerimiento']
                campos_actualizados.append('descripción')
            
            # ✅ ACTUALIZAR SUBGRUPO CON VALIDACIÓN
            subgrupo_cambiado = False
            nuevo_subgrupo_id = None
            
            # Buscar el campo de subgrupo en diferentes formatos
            posibles_campos_subgrupo = ['id_subgrupo_denuncia_id', 'id_subgrupo_denuncia', 'subgrupo_id']
            
            for campo in posibles_campos_subgrupo:
                if campo in data and data[campo] is not None:
                    nuevo_subgrupo_id = data[campo]
                    break
            
            if nuevo_subgrupo_id is not None:
                try:
                    nuevo_subgrupo_id = int(nuevo_subgrupo_id)
                    subgrupo_actual_id = int(requerimiento.id_subgrupo_denuncia_id)
                    
                    if nuevo_subgrupo_id != subgrupo_actual_id:
                        # Verificar que el nuevo subgrupo existe
                        try:
                            nuevo_subgrupo = SubgrupoDenuncia.objects.get(id_subgrupo_denuncia=nuevo_subgrupo_id)
                            
                            # Verificar que no exista otro requerimiento con el mismo nombre en el nuevo subgrupo
                            if Requerimiento.objects.filter(
                                nombre_requerimiento=requerimiento.nombre_requerimiento,
                                id_subgrupo_denuncia_id=nuevo_subgrupo_id
                            ).exclude(id_requerimiento=requerimiento_id).exists():
                                return JsonResponse({
                                    'error': 'Ya existe un requerimiento con este nombre en el nuevo subgrupo'
                                }, status=400)
                            
                            requerimiento.id_subgrupo_denuncia = nuevo_subgrupo
                            campos_actualizados.append('subgrupo')
                            subgrupo_cambiado = True
                            
                        except SubgrupoDenuncia.DoesNotExist:
                            return JsonResponse({'error': 'Subgrupo no encontrado'}, status=400)
                            
                except (ValueError, TypeError) as e:
                    return JsonResponse({'error': 'ID de subgrupo inválido'}, status=400)
            
            # ✅ GUARDAR SOLO SI HAY CAMBIOS
            if campos_actualizados:
                requerimiento.save()
                print(f"✅ Requerimiento {requerimiento_id} actualizado. Campos: {', '.join(campos_actualizados)}")
                
                # Cargar relaciones actualizadas
                requerimiento.refresh_from_db()
                requerimiento_actualizado = Requerimiento.objects.select_related(
                    'id_subgrupo_denuncia__id_grupo_denuncia__id_familia_denuncia'
                ).get(id_requerimiento=requerimiento_id)
                
                # Obtener jerarquía actualizada
                try:
                    subgrupo_actual = requerimiento_actualizado.id_subgrupo_denuncia
                    grupo_actual = subgrupo_actual.id_grupo_denuncia
                    familia_actual = grupo_actual.id_familia_denuncia
                    
                    respuesta = {
                        'id_requerimiento': requerimiento_actualizado.id_requerimiento,
                        'nombre_requerimiento': requerimiento_actualizado.nombre_requerimiento,
                        'clasificacion_requerimiento': requerimiento_actualizado.clasificacion_requerimiento,
                        'descripcion_requerimiento': requerimiento_actualizado.descripcion_requerimiento,
                        'mensaje': 'Requerimiento actualizado correctamente',
                        'jerarquia_actual': {
                            'familia': {
                                'id': familia_actual.id_familia_denuncia,
                                'nombre': familia_actual.nombre_familia_denuncia
                            },
                            'grupo': {
                                'id': grupo_actual.id_grupo_denuncia,
                                'nombre': grupo_actual.nombre_grupo_denuncia
                            },
                            'subgrupo': {
                                'id': subgrupo_actual.id_subgrupo_denuncia,
                                'nombre': subgrupo_actual.nombre_subgrupo_denuncia
                            }
                        }
                    }
                    
                except Exception as e:
                    print(f"⚠️ Error obteniendo jerarquía actualizada: {e}")
                    respuesta = {
                        'id_requerimiento': requerimiento_actualizado.id_requerimiento,
                        'nombre_requerimiento': requerimiento_actualizado.nombre_requerimiento,
                        'clasificacion_requerimiento': requerimiento_actualizado.clasificacion_requerimiento,
                        'descripcion_requerimiento': requerimiento_actualizado.descripcion_requerimiento,
                        'mensaje': 'Requerimiento actualizado correctamente'
                    }
                
                return JsonResponse(respuesta)
            else:
                return JsonResponse({
                    'mensaje': 'No se realizaron cambios',
                    'id_requerimiento': requerimiento.id_requerimiento,
                    'nombre_requerimiento': requerimiento.nombre_requerimiento,
                    'clasificacion_requerimiento': requerimiento.clasificacion_requerimiento,
                    'descripcion_requerimiento': requerimiento.descripcion_requerimiento
                })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido en el cuerpo de la solicitud'}, status=400)
        except Exception as e:
            print(f"❌ Error actualizando requerimiento {requerimiento_id}: {str(e)}")
            return JsonResponse({'error': f'Error al actualizar requerimiento: {str(e)}'}, status=500)
    
    elif request.method == 'DELETE':
        try:
            # Verificar si el requerimiento está siendo usado en denuncias
            denuncias_asociadas = Denuncia.objects.filter(id_requerimiento_id=requerimiento_id).exists()
            
            if denuncias_asociadas:
                return JsonResponse({
                    'error': 'No se puede eliminar el requerimiento porque está asociado a denuncias existentes'
                }, status=400)
            
            requerimiento.delete()
            return JsonResponse({'mensaje': 'Requerimiento eliminado correctamente'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        
# ✅ API PARA RUTA COMPLETA - CORREGIDA
@csrf_exempt
def api_requerimiento_ruta_completa(request, requerimiento_id):
    """Obtener la ruta completa (familia → grupo → subgrupo) de un requerimiento"""
    try:
        # ✅ OPTIMIZACIÓN: Cargar todas las relaciones en una consulta
        requerimiento = Requerimiento.objects.select_related(
            'id_subgrupo_denuncia__id_grupo_denuncia__id_familia_denuncia'
        ).get(id_requerimiento=requerimiento_id)
        
        # Obtener la jerarquía completa (ya cargada)
        subgrupo = requerimiento.id_subgrupo_denuncia
        grupo = subgrupo.id_grupo_denuncia
        familia = grupo.id_familia_denuncia
        
        data = {
            'familia': {
                'id': familia.id_familia_denuncia,
                'nombre': familia.nombre_familia_denuncia,
                'codigo': familia.codigo_familia 
            },
            'grupo': {
                'id': grupo.id_grupo_denuncia,
                'nombre': grupo.nombre_grupo_denuncia,
                'codigo': grupo.codigo_grupo 
            },
            'subgrupo': {
                'id': subgrupo.id_subgrupo_denuncia,
                'nombre': subgrupo.nombre_subgrupo_denuncia,
                'codigo': subgrupo.codigo_subgrupo
            },
            'requerimiento': {
                'id': requerimiento.id_requerimiento,
                'nombre': requerimiento.nombre_requerimiento,
                'codigo': requerimiento.codigo_requerimiento,
                'clasificacion': requerimiento.clasificacion_requerimiento 
            }
        }
        
        return JsonResponse(data)
        
    except Requerimiento.DoesNotExist:
        return JsonResponse({'error': 'Requerimiento no encontrado'}, status=404)
    except Exception as e:
        print(f"❌ Error en api_requerimiento_ruta_completa: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_usuarios(request):
    """Página principal de gestión de usuarios"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return redirect('login')
    
    # Obtener estadísticas de usuarios
    total_usuarios = Usuario.objects.count()
    total_administradores = Usuario.objects.filter(id_rol__nombre_rol='administrador').count()
    total_activos = Usuario.objects.filter(is_active=True).count()
    
    context = {
        'total_usuarios': total_usuarios,
        'total_administradores': total_administradores,
        'total_activos': total_activos,
    }
    return render(request, 'crud/admin/usuarios.html', context)

# ✅ API PARA CREAR USUARIOS
@csrf_exempt
@login_required
def api_usuarios(request):
    """Manejar operaciones CRUD para usuarios"""
    try:
        if request.method == 'GET':
            # Obtener lista de usuarios
            usuarios = Usuario.objects.all().select_related('id_rol', 'id_turno')
            data = []
            for usuario in usuarios:
                data.append({
                    'id_usuario': usuario.id_usuario,
                    'nombre_usuario': usuario.nombre_usuario,
                    'apellido_pat_usuario': usuario.apellido_pat_usuario,
                    'apellido_mat_usuario': usuario.apellido_mat_usuario,
                    'rut_usuario': usuario.rut_usuario,
                    'telefono_movil_usuario': usuario.telefono_movil_usuario,
                    'correo_electronico_usuario': usuario.correo_electronico_usuario,
                    'estado_usuario': usuario.is_active,
                    'id_rol': usuario.id_rol_id,
                    'rol_nombre': usuario.id_rol.nombre_rol if usuario.id_rol else '',
                    'id_turno': usuario.id_turno_id if usuario.id_turno else None,
                    'turno_nombre': usuario.id_turno.nombre_turno if usuario.id_turno else '',
                    'fecha_creacion': usuario.fecha_creacion.strftime('%d/%m/%Y %H:%M') if usuario.fecha_creacion else ''
                })
            return JsonResponse(data, safe=False)
        
        elif request.method == 'POST':
            # Crear nuevo usuario
            data = json.loads(request.body)
            
            # Validar campos requeridos según tu modelo
            campos_requeridos = [
                'nombre_usuario', 'apellido_pat_usuario', 'apellido_mat_usuario',
                'rut_usuario', 'telefono_movil_usuario', 'correo_electronico_usuario',
                'password', 'id_rol'
            ]
            
            for campo in campos_requeridos:
                if not data.get(campo):
                    return JsonResponse({'error': f'El campo {campo} es requerido'}, status=400)
            
            # Verificar si el correo ya existe
            if Usuario.objects.filter(correo_electronico_usuario=data['correo_electronico_usuario']).exists():
                return JsonResponse({'error': 'El correo electrónico ya está registrado'}, status=400)
            
            # Verificar si el RUT ya existe
            if Usuario.objects.filter(rut_usuario=data['rut_usuario']).exists():
                return JsonResponse({'error': 'El RUT ya está registrado'}, status=400)
            
            try:
                # Crear el usuario usando el manager personalizado
                usuario = Usuario.objects.create_user(
                    correo_electronico_usuario=data['correo_electronico_usuario'],
                    password=data['password'],
                    nombre_usuario=data['nombre_usuario'],
                    apellido_pat_usuario=data['apellido_pat_usuario'],
                    apellido_mat_usuario=data['apellido_mat_usuario'],
                    rut_usuario=data['rut_usuario'],
                    telefono_movil_usuario=data['telefono_movil_usuario'],
                    id_rol_id=data['id_rol'],
                    id_turno_id=data.get('id_turno'),
                    is_active=data.get('estado_usuario', True)
                )
                
                return JsonResponse({
                    'id_usuario': usuario.id_usuario,
                    'nombre_completo': f"{usuario.nombre_usuario} {usuario.apellido_pat_usuario} {usuario.apellido_mat_usuario}",
                    'correo_electronico_usuario': usuario.correo_electronico_usuario,
                    'rut_usuario': usuario.rut_usuario,
                    'mensaje': 'Usuario creado correctamente'
                })
                
            except Exception as e:
                return JsonResponse({'error': f'Error al crear usuario: {str(e)}'}, status=500)
            
    except Exception as e:
        print(f"❌ Error en api_usuarios: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_usuario_detalle(request, usuario_id):
    """Manejar operaciones CRUD para un usuario específico"""
    try:
        usuario = Usuario.objects.get(id_usuario=usuario_id)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
    
    if request.method == 'GET':
        data = {
            'id_usuario': usuario.id_usuario,
            'nombre_usuario': usuario.nombre_usuario,
            'apellido_pat_usuario': usuario.apellido_pat_usuario,
            'apellido_mat_usuario': usuario.apellido_mat_usuario,
            'rut_usuario': usuario.rut_usuario,
            'telefono_movil_usuario': usuario.telefono_movil_usuario,
            'correo_electronico_usuario': usuario.correo_electronico_usuario,
            'estado_usuario': usuario.is_active,
            'id_rol': usuario.id_rol_id,
            'id_turno': usuario.id_turno_id if usuario.id_turno else None
        }
        return JsonResponse(data)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print(f"📥 Datos recibidos para actualizar usuario {usuario_id}: {data}")
            
            # Actualizar campos permitidos según tu modelo
            campos_permitidos = [
                'nombre_usuario', 'apellido_pat_usuario', 'apellido_mat_usuario',
                'telefono_movil_usuario', 'correo_electronico_usuario'
            ]
            
            for campo in campos_permitidos:
                if campo in data:
                    setattr(usuario, campo, data[campo])
            
            if 'estado_usuario' in data:
                usuario.is_active = bool(data['estado_usuario'])
                print(f"✅ Estado actualizado a: {'Activo' if usuario.is_active else 'Inactivo'}")
            
            if 'id_rol' in data:
                try:
                    rol = Roles.objects.get(id_rol=data['id_rol'])
                    usuario.id_rol = rol
                    print(f"✅ Rol actualizado a: {rol.nombre_rol}")
                except Roles.DoesNotExist:
                    return JsonResponse({'error': 'El rol especificado no existe'}, status=400)
            
            if 'id_turno' in data:
                if data['id_turno']:
                    try:
                        turno = Turnos.objects.get(id_turno=data['id_turno'])
                        usuario.id_turno = turno
                        print(f"✅ Turno actualizado a: {turno.nombre_turno}")
                    except Turnos.DoesNotExist:
                        return JsonResponse({'error': 'El turno especificado no existe'}, status=400)
                else:
                    usuario.id_turno = None
                    print("✅ Turno eliminado (seteado a None)")
            
            if 'password' in data and data['password']:
                usuario.set_password(data['password'])
                print("✅ Contraseña actualizada")
            
            usuario.save()
            print(f"✅ Usuario {usuario_id} actualizado correctamente")
            
            return JsonResponse({
                'mensaje': 'Usuario actualizado correctamente',
                'id_usuario': usuario.id_usuario,
                'nombre_completo': f"{usuario.nombre_usuario} {usuario.apellido_pat_usuario}",
                'correo_electronico_usuario': usuario.correo_electronico_usuario,
                'estado_actual': 'Activo' if usuario.is_active else 'Inactivo'
            })
            
        except Exception as e:
            print(f"❌ Error actualizando usuario {usuario_id}: {str(e)}")
            return JsonResponse({'error': f'Error al actualizar usuario: {str(e)}'}, status=500)
    
    elif request.method == 'DELETE':
        try:
            # ✅ LISTA DE ROLES PERMITIDOS PARA ELIMINAR
            roles_permitidos_eliminar = ['administrador', 'operador', 'supervisor', 'inspector']
            
            if usuario.id_rol.nombre_rol not in roles_permitidos_eliminar:
                return JsonResponse({
                    'error': f'No se puede eliminar usuarios con rol de {usuario.id_rol.nombre_rol}'
                }, status=400)
            
            # Verificar si el usuario tiene denuncias asociadas
            denuncias_asociadas = Denuncia.objects.filter(id_usuario=usuario_id)
            if denuncias_asociadas.exists():
                return JsonResponse({
                    'error': 'No se puede eliminar el usuario porque tiene denuncias asociadas'
                }, status=400)
            
            usuario.delete()
            return JsonResponse({'mensaje': 'Usuario eliminado correctamente'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_usuarios_buscar(request):
    """Buscar usuarios por nombre, email o RUT"""
    try:
        query = request.GET.get('q', '')
        
        if not query:
            return JsonResponse([], safe=False)
        
        usuarios = Usuario.objects.filter(
            Q(nombre_usuario__icontains=query) |
            Q(apellido_pat_usuario__icontains=query) |
            Q(apellido_mat_usuario__icontains=query) |
            Q(correo_electronico_usuario__icontains=query) |
            Q(rut_usuario__icontains=query)
        ).select_related('id_rol')[:10]  # Limitar a 10 resultados
        
        data = []
        for usuario in usuarios:
            data.append({
                'id_usuario': usuario.id_usuario,
                'nombre_completo': f"{usuario.nombre_usuario} {usuario.apellido_pat_usuario} {usuario.apellido_mat_usuario}",
                'rut_usuario': usuario.rut_usuario,
                'correo_electronico_usuario': usuario.correo_electronico_usuario,
                'rol_nombre': usuario.id_rol.nombre_rol if usuario.id_rol else '',
                'estado_usuario': usuario.is_active
            })
        
        return JsonResponse(data, safe=False)
        
    except Exception as e:
        print(f"❌ Error en api_usuarios_buscar: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
    
    
# ========== Vistas de vehiculos página web ==========   
@login_required
def admin_vehiculos(request):
    """Página principal de gestión de vehículos desde el panel admin - SOLO ADMINISTRADORES"""
    try:
        print("🎯 Entrando a admin_vehiculos")
        
        # Verificación básica de autenticación primero
        if not request.user.is_authenticated:
            print("❌ Usuario no autenticado")
            return redirect('login')
            
        # Verificar rol de forma segura - SOLO ADMINISTRADORES
        try:
            if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
                print("❌ Acceso denegado - Solo administradores pueden acceder")
                messages.error(request, 'No tienes permisos para acceder a esta sección.')
                return redirect('Admin')
                                        
        except AttributeError as e:
            print(f"❌ Error accediendo al rol: {e}")
            return redirect('login')
        
        # Obtener datos para los dropdowns
        tipos_vehiculos = TiposVehiculos.objects.all()
        estados_vehiculo = EstadoVehiculo.objects.all()
        
        # Obtener estadísticas para el dashboard
        total_vehiculos = Vehiculos.objects.count()
        vehiculos_disponibles = Vehiculos.objects.filter(id_estado_vehiculo__nombre_estado='Disponible').count()
        vehiculos_mantenimiento = Vehiculos.objects.filter(id_estado_vehiculo__nombre_estado='En Mantenimiento').count()
        
        print(f"📊 Datos cargados - Tipos: {tipos_vehiculos.count()}, Estados: {estados_vehiculo.count()}")
        
        context = {
            'tipos_vehiculos': tipos_vehiculos,
            'estados_vehiculo': estados_vehiculo,
            'total_vehiculos': total_vehiculos,
            'vehiculos_disponibles': vehiculos_disponibles,
            'vehiculos_mantenimiento': vehiculos_mantenimiento,
        }
        
        print("✅ Contexto cargado, renderizando template...")
        # 🔥 CORREGIDO: Ruta correcta del template
        return render(request, 'crud/admin/vehiculos.html', context)
        
    except Exception as e:
        print(f"❌ ERROR CRÍTICO en admin_vehiculos: {str(e)}")
        import traceback
        print(f"📋 Traceback completo:\n{traceback.format_exc()}")
        return HttpResponse(f"Error en admin_vehiculos: {str(e)}", status=500)

@login_required
def listar_vehiculos(request):
    """Página principal de gestión de vehículos - SOLO ADMINISTRADORES"""
    # 🔥 CORREGIDO: Solo administradores
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        messages.error(request, 'No tienes permisos para acceder a esta sección.')
        return redirect('Admin')
    
    # Obtener datos para los dropdowns
    tipos_vehiculos = TiposVehiculos.objects.all()
    estados_vehiculo = EstadoVehiculo.objects.all()
    
    context = {
        'tipos_vehiculos': tipos_vehiculos,
        'estados_vehiculo': estados_vehiculo,
    }
    # 🔥 CORREGIDO: Ruta correcta del template
    return render(request, 'crud/admin/vehiculos.html', context)

@csrf_exempt
@login_required
def api_vehiculos_web(request):
    """API para listar vehículos (web)"""
    try:
        if request.method == 'GET':
            vehiculos = Vehiculos.objects.all().select_related('id_tipo_vehiculo', 'id_estado_vehiculo')
            data = []
            for vehiculo in vehiculos:
                data.append({
                    'id_vehiculo': vehiculo.id_vehiculo,
                    'patente_vehiculo': vehiculo.patente_vehiculo,
                    'marca_vehiculo': vehiculo.marca_vehiculo,
                    'modelo_vehiculo': vehiculo.modelo_vehiculo,
                    'codigo_vehiculo': vehiculo.codigo_vehiculo,
                    'total_kilometraje': vehiculo.total_kilometraje,
                    'fecha_creacion': vehiculo.fecha_creacion.isoformat() if vehiculo.fecha_creacion else None,
                    'id_tipo_vehiculo': vehiculo.id_tipo_vehiculo.id_tipo_vehiculo,
                    'nombre_tipo_vehiculo': vehiculo.id_tipo_vehiculo.nombre_tipo_vehiculo,
                    'id_estado_vehiculo': vehiculo.id_estado_vehiculo.id_estado_vehiculo,
                    'nombre_estado_vehiculo': vehiculo.id_estado_vehiculo.nombre_estado,
                })
            return JsonResponse(data, safe=False)
            
    except Exception as e:
        print(f"❌ Error en api_vehiculos_web: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_tipos_vehiculos_web(request):
    """API para obtener tipos de vehículos (web)"""
    try:
        if request.method == 'GET':
            tipos = TiposVehiculos.objects.all()
            data = [{
                'id_tipo_vehiculo': tipo.id_tipo_vehiculo,
                'nombre_tipo_vehiculo': tipo.nombre_tipo_vehiculo
            } for tipo in tipos]
            return JsonResponse(data, safe=False)
            
    except Exception as e:
        print(f"❌ Error en api_tipos_vehiculos_web: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_crear_tipo_vehiculo(request):
    """API para crear tipo de vehículo"""
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            nombre = data.get('nombre_tipo_vehiculo', '').strip()
            
            if not nombre:
                return JsonResponse({'error': 'El nombre del tipo de vehículo es requerido'}, status=400)
            
            # Verificar si ya existe
            if TiposVehiculos.objects.filter(nombre_tipo_vehiculo__iexact=nombre).exists():
                return JsonResponse({'error': 'Este tipo de vehículo ya existe'}, status=400)
            
            # Crear tipo de vehículo
            tipo_vehiculo = TiposVehiculos.objects.create(
                nombre_tipo_vehiculo=nombre
            )
            
            return JsonResponse({
                'mensaje': 'Tipo de vehículo creado correctamente',
                'tipo_vehiculo': {
                    'id_tipo_vehiculo': tipo_vehiculo.id_tipo_vehiculo,
                    'nombre_tipo_vehiculo': tipo_vehiculo.nombre_tipo_vehiculo
                }
            })
            
    except Exception as e:
        print(f"❌ Error en api_crear_tipo_vehiculo: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def inicializar_tipos_vehiculos():
    """Función para crear los tipos básicos de vehículos si no existen"""
    tipos_basicos = ['Automóvil', 'Motocicleta', 'Camioneta', 'Bicicleta']
    
    for tipo_nombre in tipos_basicos:
        if not TiposVehiculos.objects.filter(nombre_tipo_vehiculo=tipo_nombre).exists():
            TiposVehiculos.objects.create(nombre_tipo_vehiculo=tipo_nombre)
            print(f"✅ Tipo de vehículo creado: {tipo_nombre}")

@csrf_exempt
@login_required
def api_crear_vehiculo(request):
    """API para crear vehículo - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            
            # Validar campos requeridos
            campos_requeridos = [
                'patente_vehiculo', 'marca_vehiculo', 'modelo_vehiculo', 
                'codigo_vehiculo', 'id_tipo_vehiculo', 'id_estado_vehiculo'
            ]
            
            for campo in campos_requeridos:
                if not data.get(campo):
                    return JsonResponse({'error': f'El campo {campo} es requerido'}, status=400)
            
            # Verificar si la patente ya existe
            if Vehiculos.objects.filter(patente_vehiculo=data['patente_vehiculo']).exists():
                return JsonResponse({'error': 'La patente ya está registrada'}, status=400)
            
            # Verificar si el código ya existe
            if Vehiculos.objects.filter(codigo_vehiculo=data['codigo_vehiculo']).exists():
                return JsonResponse({'error': 'El código ya está registrado'}, status=400)
            
            # Crear vehículo
            vehiculo = Vehiculos.objects.create(
                patente_vehiculo=data['patente_vehiculo'],
                marca_vehiculo=data['marca_vehiculo'],
                modelo_vehiculo=data['modelo_vehiculo'],
                codigo_vehiculo=data['codigo_vehiculo'],
                total_kilometraje=data.get('total_kilometraje', 0),
                id_tipo_vehiculo_id=data['id_tipo_vehiculo'],
                id_estado_vehiculo_id=data['id_estado_vehiculo']
            )
            
            # Cargar relaciones para la respuesta
            vehiculo_con_relaciones = Vehiculos.objects.select_related(
                'id_tipo_vehiculo', 'id_estado_vehiculo'
            ).get(id_vehiculo=vehiculo.id_vehiculo)
            
            return JsonResponse({
                'mensaje': 'Vehículo creado correctamente',
                'vehiculo': {
                    'id_vehiculo': vehiculo.id_vehiculo,
                    'patente_vehiculo': vehiculo.patente_vehiculo,
                    'marca_vehiculo': vehiculo.marca_vehiculo,
                    'modelo_vehiculo': vehiculo.modelo_vehiculo,
                    'codigo_vehiculo': vehiculo.codigo_vehiculo,
                    'total_kilometraje': vehiculo.total_kilometraje,
                    'nombre_tipo_vehiculo': vehiculo_con_relaciones.id_tipo_vehiculo.nombre_tipo_vehiculo,
                    'nombre_estado_vehiculo': vehiculo_con_relaciones.id_estado_vehiculo.nombre_estado,
                }
            })
            
    except Exception as e:
        print(f"❌ Error en api_crear_vehiculo: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_obtener_vehiculo(request, vehiculo_id):
    """API para obtener datos de un vehículo (GET)"""
    try:
        # Verificar permisos
        if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() not in ['administrador', 'operador']:
            return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
        
        # Obtener el vehículo con todas las relaciones
        vehiculo = Vehiculos.objects.select_related(
            'id_tipo_vehiculo', 
            'id_estado_vehiculo'
        ).get(id_vehiculo=vehiculo_id)
        
        # Preparar datos para la respuesta
        data = {
            'id_vehiculo': vehiculo.id_vehiculo,
            'patente_vehiculo': vehiculo.patente_vehiculo,
            'marca_vehiculo': vehiculo.marca_vehiculo,
            'modelo_vehiculo': vehiculo.modelo_vehiculo,
            'codigo_vehiculo': vehiculo.codigo_vehiculo,
            'total_kilometraje': vehiculo.total_kilometraje,
            'id_tipo_vehiculo': vehiculo.id_tipo_vehiculo.id_tipo_vehiculo,
            'nombre_tipo_vehiculo': vehiculo.id_tipo_vehiculo.nombre_tipo_vehiculo,
            'id_estado_vehiculo': vehiculo.id_estado_vehiculo.id_estado_vehiculo,
            'nombre_estado_vehiculo': vehiculo.id_estado_vehiculo.nombre_estado,
            'fecha_creacion': vehiculo.fecha_creacion.strftime('%d/%m/%Y %H:%M') if vehiculo.fecha_creacion else ''
        }
        
        return JsonResponse(data)
        
    except Vehiculos.DoesNotExist:
        return JsonResponse({'error': 'Vehículo no encontrado'}, status=404)
    except Exception as e:
        print(f"❌ Error en api_obtener_vehiculo: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_editar_vehiculo(request, vehiculo_id):
    """API para editar vehículo - SOLO ADMINISTRADORES"""
    # 🔥 CORREGIDO: Verificar permisos
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        vehiculo = Vehiculos.objects.get(id_vehiculo=vehiculo_id)
    except Vehiculos.DoesNotExist:
        return JsonResponse({'error': 'Vehículo no encontrado'}, status=404)
    
    try:
        if request.method == 'PUT':
            data = json.loads(request.body)
            
            # Validar campos
            if 'patente_vehiculo' in data and data['patente_vehiculo']:
                # Verificar si la patente ya existe (excluyendo el actual)
                if Vehiculos.objects.filter(patente_vehiculo=data['patente_vehiculo']).exclude(id_vehiculo=vehiculo_id).exists():
                    return JsonResponse({'error': 'La patente ya está registrada'}, status=400)
                vehiculo.patente_vehiculo = data['patente_vehiculo']
            
            if 'codigo_vehiculo' in data and data['codigo_vehiculo']:
                # Verificar si el código ya existe (excluyendo el actual)
                if Vehiculos.objects.filter(codigo_vehiculo=data['codigo_vehiculo']).exclude(id_vehiculo=vehiculo_id).exists():
                    return JsonResponse({'error': 'El código ya está registrado'}, status=400)
                vehiculo.codigo_vehiculo = data['codigo_vehiculo']
            
            # Actualizar otros campos
            if 'marca_vehiculo' in data:
                vehiculo.marca_vehiculo = data['marca_vehiculo']
            
            if 'modelo_vehiculo' in data:
                vehiculo.modelo_vehiculo = data['modelo_vehiculo']
            
            if 'total_kilometraje' in data:
                vehiculo.total_kilometraje = data['total_kilometraje']
            
            if 'id_tipo_vehiculo' in data:
                vehiculo.id_tipo_vehiculo_id = data['id_tipo_vehiculo']
            
            if 'id_estado_vehiculo' in data:
                vehiculo.id_estado_vehiculo_id = data['id_estado_vehiculo']
            
            vehiculo.save()
            
            # Cargar relaciones actualizadas para la respuesta
            vehiculo_actualizado = Vehiculos.objects.select_related(
                'id_tipo_vehiculo', 'id_estado_vehiculo'
            ).get(id_vehiculo=vehiculo_id)
            
            return JsonResponse({
                'mensaje': 'Vehículo actualizado correctamente',
                'vehiculo': {
                    'id_vehiculo': vehiculo_actualizado.id_vehiculo,
                    'patente_vehiculo': vehiculo_actualizado.patente_vehiculo,
                    'marca_vehiculo': vehiculo_actualizado.marca_vehiculo,
                    'modelo_vehiculo': vehiculo_actualizado.modelo_vehiculo,
                    'codigo_vehiculo': vehiculo_actualizado.codigo_vehiculo,
                    'total_kilometraje': vehiculo_actualizado.total_kilometraje,
                    'nombre_tipo_vehiculo': vehiculo_actualizado.id_tipo_vehiculo.nombre_tipo_vehiculo,
                    'nombre_estado_vehiculo': vehiculo_actualizado.id_estado_vehiculo.nombre_estado,
                }
            })
            
    except Exception as e:
        print(f"❌ Error en api_editar_vehiculo: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_eliminar_vehiculo(request, vehiculo_id):
    """API para eliminar vehículo - SOLO ADMINISTRADORES"""
    # 🔥 CORREGIDO: Verificar permisos
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        vehiculo = Vehiculos.objects.get(id_vehiculo=vehiculo_id)
    except Vehiculos.DoesNotExist:
        return JsonResponse({'error': 'Vehículo no encontrado'}, status=404)
    
    try:
        if request.method == 'DELETE':
            # Verificar si el vehículo tiene asignaciones activas
            asignaciones_activas = AsignacionVehiculo.objects.filter(
                id_vehiculo=vehiculo_id, 
                activo=1
            ).exists()
            
            if asignaciones_activas:
                return JsonResponse({
                    'error': 'No se puede eliminar el vehículo porque tiene asignaciones activas'
                }, status=400)
            
            vehiculo.delete()
            return JsonResponse({'mensaje': 'Vehículo eliminado correctamente'})
            
    except Exception as e:
        print(f"❌ Error en api_eliminar_vehiculo: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)  
    
# ========== Vistas de radios página web ==========
    
@login_required
def admin_radios(request):
    """Página principal de gestión de radios desde el panel admin - SOLO ADMINISTRADORES"""
    try:
        print("🎯 Entrando a admin_radios")
        
        # Verificación básica de autenticación primero
        if not request.user.is_authenticated:
            print("❌ Usuario no autenticado")
            return redirect('login')
            
        # Verificar rol de forma segura - SOLO ADMINISTRADORES
        try:
            if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
                print("❌ Acceso denegado - Solo administradores pueden acceder")
                messages.error(request, 'No tienes permisos para acceder a esta sección.')
                return redirect('Admin')
                                        
        except AttributeError as e:
            print(f"❌ Error accediendo al rol: {e}")
            return redirect('login')
        
        # Obtener estadísticas para el dashboard - SOLO DISPONIBLE Y NO DISPONIBLE
        total_radios = Radio.objects.count()
        radios_disponibles = Radio.objects.filter(estado_radio='Disponible').count()
        radios_no_disponibles = Radio.objects.filter(estado_radio='No Disponible').count()
        
        print(f"📊 Datos cargados - Total: {total_radios}, Disponibles: {radios_disponibles}")
        
        context = {
            'total_radios': total_radios,
            'radios_disponibles': radios_disponibles,
            'radios_no_disponibles': radios_no_disponibles,
        }
        
        print("✅ Contexto cargado, renderizando template...")
        return render(request, 'crud/admin/radios.html', context)
        
    except Exception as e:
        print(f"❌ ERROR CRÍTICO en admin_radios: {str(e)}")
        import traceback
        print(f"📋 Traceback completo:\n{traceback.format_exc()}")
        return HttpResponse(f"Error en admin_radios: {str(e)}", status=500)    
    
@login_required
def listar_radios(request):
    """Página principal de gestión de radios - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        messages.error(request, 'No tienes permisos para acceder a esta sección.')
        return redirect('Admin')
    
    # Obtener estadísticas - SOLO DISPONIBLE Y NO DISPONIBLE
    total_radios = Radio.objects.count()
    radios_disponibles = Radio.objects.filter(estado_radio='Disponible').count()
    radios_no_disponibles = Radio.objects.filter(estado_radio='No Disponible').count()
    
    context = {
        'total_radios': total_radios,
        'radios_disponibles': radios_disponibles,
        'radios_no_disponibles': radios_no_disponibles,
    }
    return render(request, 'crud/admin/radios.html', context)

@csrf_exempt
@login_required  # ← AGREGAR ESTA LÍNEA
def api_radios_web(request):
    """API para listar radios (web)"""
    try:
        if request.method == 'GET':
            radios = Radio.objects.all()
            data = []
            for radio in radios:
                # Formatear fecha correctamente
                fecha_formateada = ''
                if radio.fecha_creacion_radio:
                    fecha_formateada = radio.fecha_creacion_radio.strftime('%d/%m/%Y %H:%M')
                
                data.append({
                    'id_radio': radio.id_radio,
                    'nombre_radio': radio.nombre_radio,
                    'codigo_radio': radio.codigo_radio,
                    'descripcion_radio': radio.descripcion_radio,
                    'estado_radio': radio.estado_radio,
                    'fecha_creacion_radio': fecha_formateada,
                })
            return JsonResponse(data, safe=False)
            
    except Exception as e:
        print(f"❌ Error en api_radios_web: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_crear_radio(request):
    """API para crear radio - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            
            # Validar campos requeridos
            campos_requeridos = ['nombre_radio', 'codigo_radio', 'descripcion_radio', 'estado_radio']
            
            for campo in campos_requeridos:
                if not data.get(campo):
                    return JsonResponse({'error': f'El campo {campo} es requerido'}, status=400)
            
            # Validar que el estado sea válido
            if data['estado_radio'] not in ['Disponible', 'No Disponible']:
                return JsonResponse({'error': 'El estado debe ser "Disponible" o "No Disponible"'}, status=400)
            
            # Verificar si el nombre ya existe
            if Radio.objects.filter(nombre_radio=data['nombre_radio']).exists():
                return JsonResponse({'error': 'El nombre del radio ya está registrado'}, status=400)
            
            # Verificar si el código ya existe
            if Radio.objects.filter(codigo_radio=data['codigo_radio']).exists():
                return JsonResponse({'error': 'El código del radio ya está registrado'}, status=400)
            
            # Crear radio
            radio = Radio.objects.create(
                nombre_radio=data['nombre_radio'],
                codigo_radio=data['codigo_radio'],
                descripcion_radio=data['descripcion_radio'],
                estado_radio=data['estado_radio']
            )
            
            return JsonResponse({
                'mensaje': 'Radio creado correctamente',
                'radio': {
                    'id_radio': radio.id_radio,
                    'nombre_radio': radio.nombre_radio,
                    'codigo_radio': radio.codigo_radio,
                    'descripcion_radio': radio.descripcion_radio,
                    'estado_radio': radio.estado_radio,
                    'fecha_creacion_radio': radio.fecha_creacion_radio.strftime('%d/%m/%Y %H:%M') if radio.fecha_creacion_radio else '',
                }
            })
            
    except Exception as e:
        print(f"❌ Error en api_crear_radio: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_obtener_radio(request, radio_id):
    """API para obtener datos de un radio (GET)"""
    try:
        if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() not in ['administrador', 'operador']:
            return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
        
        radio = Radio.objects.get(id_radio=radio_id)
        
        data = {
            'id_radio': radio.id_radio,
            'nombre_radio': radio.nombre_radio,
            'codigo_radio': radio.codigo_radio,
            'descripcion_radio': radio.descripcion_radio,
            'estado_radio': radio.estado_radio,
            'fecha_creacion_radio': radio.fecha_creacion_radio.strftime('%d/%m/%Y %H:%M') if radio.fecha_creacion_radio else ''
        }
        
        return JsonResponse(data)
        
    except Radio.DoesNotExist:
        return JsonResponse({'error': 'Radio no encontrado'}, status=404)
    except Exception as e:
        print(f"❌ Error en api_obtener_radio: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_editar_radio(request, radio_id):
    """API para editar radio - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        radio = Radio.objects.get(id_radio=radio_id)
    except Radio.DoesNotExist:
        return JsonResponse({'error': 'Radio no encontrado'}, status=404)
    
    try:
        if request.method == 'PUT':
            data = json.loads(request.body)
            
            # Validar campos
            if 'nombre_radio' in data and data['nombre_radio']:
                # Verificar si el nombre ya existe (excluyendo el actual)
                if Radio.objects.filter(nombre_radio=data['nombre_radio']).exclude(id_radio=radio_id).exists():
                    return JsonResponse({'error': 'El nombre del radio ya está registrado'}, status=400)
                radio.nombre_radio = data['nombre_radio']
            
            if 'codigo_radio' in data and data['codigo_radio']:
                # Verificar si el código ya existe (excluyendo el actual)
                if Radio.objects.filter(codigo_radio=data['codigo_radio']).exclude(id_radio=radio_id).exists():
                    return JsonResponse({'error': 'El código del radio ya está registrado'}, status=400)
                radio.codigo_radio = data['codigo_radio']
            
            # Actualizar otros campos
            if 'descripcion_radio' in data:
                radio.descripcion_radio = data['descripcion_radio']
            
            if 'estado_radio' in data:
                radio.estado_radio = data['estado_radio']
            
            radio.save()
            
            return JsonResponse({
                'mensaje': 'Radio actualizado correctamente',
                'radio': {
                    'id_radio': radio.id_radio,
                    'nombre_radio': radio.nombre_radio,
                    'codigo_radio': radio.codigo_radio,
                    'descripcion_radio': radio.descripcion_radio,
                    'estado_radio': radio.estado_radio,
                }
            })
            
    except Exception as e:
        print(f"❌ Error en api_editar_radio: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_eliminar_radio(request, radio_id):
    """API para eliminar radio - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        radio = Radio.objects.get(id_radio=radio_id)
    except Radio.DoesNotExist:
        return JsonResponse({'error': 'Radio no encontrado'}, status=404)
    
    try:
        if request.method == 'DELETE':
            # Verificar si el radio tiene asignaciones activas
            asignaciones_activas = AsignacionRadio.objects.filter(
                id_radio=radio_id,
                fecha_devolucion__isnull=True
            ).exists()
            
            if asignaciones_activas:
                return JsonResponse({
                    'error': 'No se puede eliminar el radio porque tiene asignaciones activas'
                }, status=400)
            
            radio.delete()
            return JsonResponse({'mensaje': 'Radio eliminado correctamente'})
            
    except Exception as e:
        print(f"❌ Error en api_eliminar_radio: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)    
    
    
# ========== Vistas de servicios emergencia página web ==========

@login_required
def admin_servicios_emergencia(request):
    """Página principal de gestión de servicios de emergencia - SOLO ADMINISTRADORES"""
    try:
        print("🎯 Entrando a admin_servicios_emergencia")
        
        # Verificación básica de autenticación primero
        if not request.user.is_authenticated:
            print("❌ Usuario no autenticado")
            return redirect('login')
            
        # Verificar rol de forma segura - SOLO ADMINISTRADORES
        try:
            if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
                print("❌ Acceso denegado - Solo administradores pueden acceder")
                messages.error(request, 'No tienes permisos para acceder a esta sección.')
                return redirect('Admin')
                                        
        except AttributeError as e:
            print(f"❌ Error accediendo al rol: {e}")
            return redirect('login')
        
        # Obtener estadísticas para el dashboard
        total_servicios = ServiciosEmergencia.objects.count()
        
        print(f"📊 Datos cargados - Total servicios: {total_servicios}")
        
        context = {
            'total_servicios': total_servicios,
        }
        
        print("✅ Contexto cargado, renderizando template...")
        return render(request, 'crud/admin/servicios_emergencia.html', context)
        
    except Exception as e:
        print(f"❌ ERROR CRÍTICO en admin_servicios_emergencia: {str(e)}")
        import traceback
        print(f"📋 Traceback completo:\n{traceback.format_exc()}")
        return HttpResponse(f"Error en admin_servicios_emergencia: {str(e)}", status=500)
    
@csrf_exempt
@login_required
def api_servicios_emergencia_web(request):
    """API para listar servicios de emergencia (web)"""
    try:
        if request.method == 'GET':
            servicios = ServiciosEmergencia.objects.all()
            data = []
            for servicio in servicios:
                data.append({
                    'id_servicio': servicio.id_servicio,
                    'nombre_servicio': servicio.nombre_servicio,
                    'codigo_servicio': servicio.codigo_servicio,
                })
            return JsonResponse(data, safe=False)
            
    except Exception as e:
        print(f"❌ Error en api_servicios_emergencia_web: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_crear_servicio_emergencia(request):
    """API para crear servicio de emergencia - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            
            # Validar campos requeridos
            campos_requeridos = ['nombre_servicio', 'codigo_servicio']
            
            for campo in campos_requeridos:
                if not data.get(campo):
                    return JsonResponse({'error': f'El campo {campo} es requerido'}, status=400)
            
            # Verificar si el nombre ya existe
            if ServiciosEmergencia.objects.filter(nombre_servicio=data['nombre_servicio']).exists():
                return JsonResponse({'error': 'El nombre del servicio ya está registrado'}, status=400)
            
            # Verificar si el código ya existe
            if ServiciosEmergencia.objects.filter(codigo_servicio=data['codigo_servicio']).exists():
                return JsonResponse({'error': 'El código del servicio ya está registrado'}, status=400)
            
            # Crear servicio
            servicio = ServiciosEmergencia.objects.create(
                nombre_servicio=data['nombre_servicio'],
                codigo_servicio=data['codigo_servicio']
            )
            
            return JsonResponse({
                'mensaje': 'Servicio de emergencia creado correctamente',
                'servicio': {
                    'id_servicio': servicio.id_servicio,
                    'nombre_servicio': servicio.nombre_servicio,
                    'codigo_servicio': servicio.codigo_servicio,
                }
            })
            
    except Exception as e:
        print(f"❌ Error en api_crear_servicio_emergencia: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_obtener_servicio_emergencia(request, servicio_id):
    """API para obtener datos de un servicio de emergencia (GET)"""
    try:
        if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() not in ['administrador', 'operador']:
            return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
        
        servicio = ServiciosEmergencia.objects.get(id_servicio=servicio_id)
        
        data = {
            'id_servicio': servicio.id_servicio,
            'nombre_servicio': servicio.nombre_servicio,
            'codigo_servicio': servicio.codigo_servicio,
        }
        
        return JsonResponse(data)
        
    except ServiciosEmergencia.DoesNotExist:
        return JsonResponse({'error': 'Servicio de emergencia no encontrado'}, status=404)
    except Exception as e:
        print(f"❌ Error en api_obtener_servicio_emergencia: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_editar_servicio_emergencia(request, servicio_id):
    """API para editar servicio de emergencia - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        servicio = ServiciosEmergencia.objects.get(id_servicio=servicio_id)
    except ServiciosEmergencia.DoesNotExist:
        return JsonResponse({'error': 'Servicio de emergencia no encontrado'}, status=404)
    
    try:
        if request.method == 'PUT':
            data = json.loads(request.body)
            
            # Validar campos
            if 'nombre_servicio' in data and data['nombre_servicio']:
                # Verificar si el nombre ya existe (excluyendo el actual)
                if ServiciosEmergencia.objects.filter(nombre_servicio=data['nombre_servicio']).exclude(id_servicio=servicio_id).exists():
                    return JsonResponse({'error': 'El nombre del servicio ya está registrado'}, status=400)
                servicio.nombre_servicio = data['nombre_servicio']
            
            if 'codigo_servicio' in data and data['codigo_servicio']:
                # Verificar si el código ya existe (excluyendo el actual)
                if ServiciosEmergencia.objects.filter(codigo_servicio=data['codigo_servicio']).exclude(id_servicio=servicio_id).exists():
                    return JsonResponse({'error': 'El código del servicio ya está registrado'}, status=400)
                servicio.codigo_servicio = data['codigo_servicio']
            
            servicio.save()
            
            return JsonResponse({
                'mensaje': 'Servicio de emergencia actualizado correctamente',
                'servicio': {
                    'id_servicio': servicio.id_servicio,
                    'nombre_servicio': servicio.nombre_servicio,
                    'codigo_servicio': servicio.codigo_servicio,
                }
            })
            
    except Exception as e:
        print(f"❌ Error en api_editar_servicio_emergencia: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@login_required
def api_eliminar_servicio_emergencia(request, servicio_id):
    """API para eliminar servicio de emergencia - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        return JsonResponse({'error': 'No tienes permisos para acceder a esta función'}, status=403)
    
    try:
        servicio = ServiciosEmergencia.objects.get(id_servicio=servicio_id)
    except ServiciosEmergencia.DoesNotExist:
        return JsonResponse({'error': 'Servicio de emergencia no encontrado'}, status=404)
    
    try:
        if request.method == 'DELETE':
            # Verificar si el servicio tiene derivaciones asociadas
            derivaciones_asociadas = DerivacionesDenuncia.objects.filter(id_servicio=servicio_id).exists()
            
            if derivaciones_asociadas:
                return JsonResponse({
                    'error': 'No se puede eliminar el servicio porque tiene derivaciones asociadas'
                }, status=400)
            
            servicio.delete()
            return JsonResponse({'mensaje': 'Servicio de emergencia eliminado correctamente'})
            
    except Exception as e:
        print(f"❌ Error en api_eliminar_servicio_emergencia: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
    
@login_required
def listar_servicios_emergencia(request):
    """Página principal de gestión de servicios de emergencia - SOLO ADMINISTRADORES"""
    if not request.user.is_authenticated or request.user.id_rol.nombre_rol.lower() != 'administrador':
        messages.error(request, 'No tienes permisos para acceder a esta sección.')
        return redirect('Admin')
    
    # Obtener estadísticas
    total_servicios = ServiciosEmergencia.objects.count()
    
    context = {
        'total_servicios': total_servicios,
    }
    return render(request, 'crud/admin/servicios_emergencia.html', context)


# ========== Vistas de denuncias página web ==========    
    
@csrf_exempt
def api_denuncias_web(request):
    """API para crear denuncias desde la web - CORREGIDA"""
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            
            # Crear ciudadano temporal para la denuncia web
            from django.utils.crypto import get_random_string
            ciudadano, created = Ciudadano.objects.get_or_create(
                telefono_movil_ciudadano=data['telefono_ciudadano'],
                defaults={
                    'nombre_ciudadano': data['nombre_ciudadano'],
                    'apellido_pat_ciudadano': 'Temporal',
                    'apellido_mat_ciudadano': 'Web',
                    'rut_ciudadano': f"temp_{data['telefono_ciudadano']}",
                    'correo_electronico_ciudadano': f"temp_{data['telefono_ciudadano']}@temp.com",
                    'password_ciudadano': get_random_string(10),
                    'is_active_ciudadano': True
                }
            )
            
            # Crear denuncia
            denuncia = Denuncia.objects.create(
                hora_denuncia=timezone.now(),
                fecha_denuncia=timezone.now().date(),
                direccion_denuncia=data['direccion_denuncia'],
                direccion_denuncia_1=data.get('direccion_secundaria', data['direccion_denuncia']),
                cuadrante_denuncia=data['cuadrante_denuncia'],
                detalle_denuncia=data['detalle_denuncia'],
                visibilidad_camaras_denuncia=data.get('visibilidad_camaras_denuncia', False),
                estado_denuncia='pendiente',  # Estado inicial
                id_usuario=request.user if request.user.is_authenticated else Usuario.objects.first(),
                id_ciudadano=ciudadano,
                id_requerimiento_id=data['id_requerimiento']
            )
            
            # Crear asignación de móvil si se proporcionó
            if data.get('id_vehiculo'):
                MovilesDenuncia.objects.create(
                    orden_asignacion=1,
                    hora_asignacion=timezone.now(),
                    id_denuncia=denuncia,
                    id_vehiculo_id=data['id_vehiculo'],
                    id_conductor=request.user if request.user.is_authenticated else Usuario.objects.first()
                )
            
            return JsonResponse({
                'success': True,
                'denuncia': {
                    'id_denuncia': denuncia.id_denuncia,
                    'numero_denuncia': f"DEN-{denuncia.id_denuncia:06d}",
                    'estado_denuncia': denuncia.estado_denuncia,
                    'fecha_creacion': denuncia.fecha_creacion_denuncia.isoformat()
                },
                'message': 'Denuncia creada exitosamente'
            })
            
    except Exception as e:
        print(f"❌ Error en api_denuncias_web: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

    
@csrf_exempt
def api_denuncias_hoy(request):
    """API para obtener denuncias del día actual - CORREGIDA"""
    try:
        hoy = timezone.now().date()
        
        # Obtener denuncias de hoy con select_related para optimizar
        denuncias = Denuncia.objects.filter(
            fecha_denuncia=hoy
        ).select_related(
            'id_ciudadano',
            'id_requerimiento',
            'id_usuario'
        ).prefetch_related('movilesdenuncia_set__id_vehiculo')
        
        data = []
        for denuncia in denuncias:
            # Obtener información del móvil asignado si existe
            movil_asignado = None
            movil_denuncia = denuncia.movilesdenuncia_set.first()
            if movil_denuncia and movil_denuncia.id_vehiculo:
                movil_asignado = {
                    'patente': movil_denuncia.id_vehiculo.patente_vehiculo,
                    'marca': movil_denuncia.id_vehiculo.marca_vehiculo,
                    'modelo': movil_denuncia.id_vehiculo.modelo_vehiculo
                }
            
            denuncia_data = {
                'id_denuncia': denuncia.id_denuncia,
                'direccion_denuncia': denuncia.direccion_denuncia,
                'detalle_denuncia': denuncia.detalle_denuncia,
                'estado_denuncia': denuncia.estado_denuncia,
                'fecha_denuncia': denuncia.fecha_denuncia.isoformat(),
                'hora_denuncia': denuncia.hora_denuncia.isoformat() if denuncia.hora_denuncia else None,
                'cuadrante_denuncia': denuncia.cuadrante_denuncia,
                'visibilidad_camaras_denuncia': denuncia.visibilidad_camaras_denuncia,
                
                # Información del ciudadano (solo campos básicos)
                'nombre_ciudadano': denuncia.id_ciudadano.nombre_ciudadano if denuncia.id_ciudadano else 'No especificado',
                'telefono_ciudadano': denuncia.id_ciudadano.telefono_movil_ciudadano if denuncia.id_ciudadano else 'No especificado',
                
                # Información del requerimiento
                'nombre_requerimiento': denuncia.id_requerimiento.nombre_requerimiento if denuncia.id_requerimiento else 'No especificado',
                
                # Móvil asignado
                'movil_asignado': movil_asignado,
                
                # Información del usuario que registró
                'usuario_registro': f"{denuncia.id_usuario.nombre_usuario} {denuncia.id_usuario.apellido_pat_usuario}" if denuncia.id_usuario else 'No especificado'
            }
            data.append(denuncia_data)
        
        return JsonResponse(data, safe=False)
        
    except Exception as e:
        print(f"❌ Error en api_denuncias_hoy: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        return JsonResponse({'error': 'Error interno del servidor'}, status=500)
    
# ========== APIs ESPECÍFICAS PARA IONIC ==========

@csrf_exempt
def api_login_ionic(request):
    """API de login dual para Ionic - CORREGIR FLUJO"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            
            print(f"🔐 ===== LOGIN ATTEMPT =====")
            print(f"📧 Email recibido: {email}")
            print(f"🔑 Password recibido: {password}")
            
            if not email or not password:
                return JsonResponse({'success': False, 'error': 'Email y contraseña requeridos'}, status=400)
            
            # PRIMERO: Intentar autenticar como Usuario (trabajador)
            try:
                usuario = Usuario.objects.get(
                    correo_electronico_usuario=email, 
                    is_active=True
                )
                print(f"👤 TRABAJADOR encontrado: {usuario.nombre_usuario}")
                
                if usuario.check_password(password):
                    print(f"✅ Contraseña correcta para trabajador")
                    
                    # VERIFICAR SI PUEDE ACCEDER A LA APP MÓVIL
                    rol_id = usuario.id_rol.id_rol
                    print(f"🎯 Rol ID: {rol_id}")
                    
                    if rol_id not in [3, 4]:  # Solo supervisores (3) e inspectores (4)
                        print(f"❌ Rol {rol_id} no tiene acceso a la app")
                        return JsonResponse({
                            'success': False, 
                            'error': 'Tu rol no tiene acceso a la aplicación móvil. Solo inspectores y supervisores.'
                        }, status=403)
                    
                    user_data = {
                        'id': usuario.id_usuario,
                        'nombre': f"{usuario.nombre_usuario} {usuario.apellido_pat_usuario}",
                        'email': usuario.correo_electronico_usuario,
                        'rut': usuario.rut_usuario,
                        'user_type': 'trabajador',
                        'id_rol': rol_id,
                        'nombre_rol': usuario.id_rol.nombre_rol,
                        'telefono': usuario.telefono_movil_usuario,
                        'is_active': usuario.is_active
                    }
                    
                    print(f"✅ Login exitoso como trabajador: {user_data['nombre']}")
                    return JsonResponse({
                        'success': True, 
                        'user': user_data,
                        'message': 'Login exitoso como trabajador'
                    })
                else:
                    print("❌ Contraseña incorrecta para trabajador")
            except Usuario.DoesNotExist:
                print("❌ Usuario trabajador no encontrado")
            except Exception as e:
                print(f"❌ Error en autenticación trabajador: {e}")

            # SEGUNDO: Intentar autenticar como Ciudadano
            try:
                ciudadano = Ciudadano.objects.get(
                    correo_electronico_ciudadano=email,
                    is_active_ciudadano=True
                )
                print(f"👤 CIUDADANO encontrado: {ciudadano.nombre_ciudadano}")
                print(f"🔐 Contraseña en BD: {ciudadano.password_ciudadano[:50]}...")
                
                if check_password(password, ciudadano.password_ciudadano):
                    print(f"✅ Contraseña correcta para ciudadano")
                    
                    ciudadano_data = {
                        'id': ciudadano.id_ciudadano,
                        'nombre': f"{ciudadano.nombre_ciudadano} {ciudadano.apellido_pat_ciudadano}",
                        'email': ciudadano.correo_electronico_ciudadano,
                        'rut': ciudadano.rut_ciudadano,
                        'user_type': 'ciudadano',
                        'id_rol': 5,
                        'nombre_rol': 'ciudadano',
                        'telefono': ciudadano.telefono_movil_ciudadano,
                        'is_active': ciudadano.is_active_ciudadano
                    }
                    
                    # Actualizar último inicio de sesión
                    ciudadano.ultimo_inicio_ciudadano = timezone.now()
                    ciudadano.save()
                    
                    print(f"✅ Login exitoso como ciudadano: {ciudadano_data['nombre']}")
                    print(f"🎯 Retornando respuesta exitosa...")
                    
                    return JsonResponse({
                        'success': True, 
                        'user': ciudadano_data,
                        'message': 'Login exitoso como ciudadano'
                    })
                else:
                    print("❌ Contraseña incorrecta para ciudadano")
                    
            except Ciudadano.DoesNotExist:
                print("❌ Ciudadano no encontrado o inactivo")
            except Exception as e:
                print(f"❌ Error en autenticación ciudadano: {e}")
                
            # Si llegamos aquí, ninguna autenticación funcionó
            print("❌ Todas las autenticaciones fallaron")
            return JsonResponse({
                'success': False, 
                'error': 'Credenciales inválidas o usuario sin acceso'
            }, status=401)
                
        except Exception as e:
            print(f"❌ Error en login: {str(e)}")
            import traceback
            print(f"📋 TRACEBACK: {traceback.format_exc()}")
            return JsonResponse({
                'success': False, 
                'error': f'Error interno del servidor: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'success': False, 
        'error': 'Método no permitido'
    }, status=405)

@csrf_exempt
def api_register_ciudadano(request):
    """
    API para registro de ciudadanos - USAR password_ciudadano
    """
    print(f"🎯 ===== REGISTER API CALLED =====")
    
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False, 
                'error': 'Método no permitido. Use POST.'
            }, status=405)
        
        # Leer y parsear JSON
        try:
            data = json.loads(request.body)
            print(f"📦 Datos recibidos: {data}")
        except json.JSONDecodeError as e:
            return JsonResponse({
                'success': False,
                'error': 'JSON inválido en el request'
            }, status=400)
        
        # ✅ CORREGIDO: Usar SOLO password_ciudadano
        if 'password_ciudadano' not in data:
            return JsonResponse({
                'success': False,
                'error': 'Campo password_ciudadano es requerido'
            }, status=400)
        
        password = data['password_ciudadano']
        print(f"🔑 Password recibido: {password}")
        
        # Validar campos requeridos - ✅ CORREGIDO: usar password_ciudadano
        required_fields = [
            'rut_ciudadano', 'nombre_ciudadano', 'apellido_pat_ciudadano',
            'apellido_mat_ciudadano', 'correo_electronico_ciudadano',
            'telefono_movil_ciudadano', 'password_ciudadano'  # ✅ password_ciudadano
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"❌ Campos faltantes: {missing_fields}")
            return JsonResponse({
                'success': False,
                'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'
            }, status=400)
        
        print(f"✅ Todos los campos requeridos presentes")
        
        # Validaciones básicas
        if not re.match(r'^\d{7,8}-[\dkK]$', data['rut_ciudadano']):
            return JsonResponse({
                'success': False,
                'error': 'El RUT debe tener formato: 12345678-9'
            }, status=400)
        
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['correo_electronico_ciudadano']):
            return JsonResponse({
                'success': False, 
                'error': 'El correo electrónico no tiene formato válido'
            }, status=400)
        
        print(f"✅ Validaciones de formato pasadas")
        
        # Verificar si el correo ya existe en ambas tablas
        email = data['correo_electronico_ciudadano']
        
        if Usuario.objects.filter(correo_electronico_usuario=email).exists():
            return JsonResponse({
                'success': False,
                'error': 'Este correo ya está registrado como trabajador'
            }, status=400)
            
        if Ciudadano.objects.filter(correo_electronico_ciudadano=email).exists():
            return JsonResponse({
                'success': False,
                'error': 'El correo electrónico ya está registrado'
            }, status=400)
        
        if Ciudadano.objects.filter(rut_ciudadano=data['rut_ciudadano']).exists():
            return JsonResponse({
                'success': False,
                'error': 'El RUT ya está registrado'
            }, status=400)
        
        print(f"✅ No hay duplicados")
        
        # CREAR CIUDADANO CON HASHING
        try:
            # APLICAR HASHING
            contraseña_hasheada = make_password(password)
            print(f"🔐 Contraseña original: {password}")
            print(f"🔐 Contraseña hasheada: {contraseña_hasheada[:50]}...")
            
            ciudadano = Ciudadano(
                rut_ciudadano=data['rut_ciudadano'],
                nombre_ciudadano=data['nombre_ciudadano'],
                apellido_pat_ciudadano=data['apellido_pat_ciudadano'],
                apellido_mat_ciudadano=data['apellido_mat_ciudadano'],
                correo_electronico_ciudadano=email,
                telefono_movil_ciudadano=data['telefono_movil_ciudadano'],
                password_ciudadano=contraseña_hasheada,  # ✅ password_ciudadano
                is_active_ciudadano=True
            )
            ciudadano.save()
            print(f"✅ Ciudadano guardado: {ciudadano.id_ciudadano}")
            
        except Exception as e:
            print(f"❌ Error guardando: {e}")
            return JsonResponse({
                'success': False,
                'error': f'Error guardando en base de datos: {str(e)}'
            }, status=500)
        
        # ÉXITO
        return JsonResponse({
            'success': True,
            'message': 'Ciudadano registrado correctamente',
            'ciudadano_id': ciudadano.id_ciudadano
        }, status=201)
        
    except Exception as e:
        print(f"💥 ERROR: {str(e)}")
        import traceback
        print(f"📋 TRACEBACK: {traceback.format_exc()}")
        return JsonResponse({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=500)
        
@method_decorator(csrf_exempt, name='dispatch')
class ObtenerDatosTrabajador(View):
    def get(self, request, usuario_id=None):
        try:
            print(f"🔍 Solicitando datos para usuario_id: {usuario_id}")
            
            # Si no hay usuario_id, intentar obtener de parámetros GET
            if not usuario_id:
                usuario_id = request.GET.get('usuario_id')
                print(f"🔍 Usuario ID desde GET: {usuario_id}")
            
            # Si aún no hay usuario_id, devolver datos básicos
            if not usuario_id:
                return self.get_datos_basicos()
            
            try:
                # Obtener usuario por ID
                usuario = Usuario.objects.get(id_usuario=usuario_id)
                print(f"✅ Usuario encontrado: {usuario.nombre_usuario}")
                return self.get_datos_completos(usuario)
                
            except Usuario.DoesNotExist:
                print(f"❌ Usuario {usuario_id} no encontrado")
                return self.get_datos_basicos()
            
        except Exception as e:
            print(f"❌ Error en ObtenerDatosTrabajador: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def get_datos_completos(self, usuario):
        """Obtener datos completos del trabajador"""
        try:
            # Obtener tipos de vehículos
            tipos_vehiculos = list(TiposVehiculos.objects.all().values(
                'id_tipo_vehiculo', 'nombre_tipo_vehiculo'
            ))
            
            # Obtener radios disponibles (CORREGIDO: buscar por 'Disponible' con mayúscula)
            radios_disponibles = list(Radio.objects.filter(
                estado_radio='Disponible'  # Cambiado a mayúscula
            ).values('id_radio', 'nombre_radio', 'codigo_radio', 'descripcion_radio', 'estado_radio'))
            
            print(f"📻 Radios disponibles encontradas: {len(radios_disponibles)}")
            
            response_data = {
                'usuario': {
                    'id_usuario': usuario.id_usuario,
                    'nombre': usuario.nombre_usuario,
                    'apellido': usuario.apellido_pat_usuario,
                    'rol': usuario.id_rol.nombre_rol if usuario.id_rol else None,
                    'correo': usuario.correo_electronico_usuario,
                    'rut': usuario.rut_usuario
                },
                'tipos_vehiculos': tipos_vehiculos,
                'radios_disponibles': radios_disponibles
            }
            
            print(f"✅ Datos completos cargados: {len(tipos_vehiculos)} tipos, {len(radios_disponibles)} radios")
            return JsonResponse(response_data)
            
        except Exception as e:
            print(f"❌ Error en get_datos_completos: {str(e)}")
            return self.get_datos_basicos()
    
    def get_datos_basicos(self):
        """Obtener datos básicos cuando no hay usuario específico"""
        try:
            # Obtener tipos de vehículos
            tipos_vehiculos = list(TiposVehiculos.objects.all().values(
                'id_tipo_vehiculo', 'nombre_tipo_vehiculo'
            ))
            
            # Obtener radios disponibles (CORREGIDO: buscar por 'Disponible' con mayúscula)
            radios_disponibles = list(Radio.objects.filter(
                estado_radio='Disponible'  # Cambiado a mayúscula
            ).values('id_radio', 'nombre_radio', 'codigo_radio', 'descripcion_radio', 'estado_radio'))
            
            print(f"📻 Radios disponibles (básicas): {len(radios_disponibles)}")
            
            response_data = {
                'usuario': None,
                'tipos_vehiculos': tipos_vehiculos,
                'radios_disponibles': radios_disponibles,
                'mensaje': 'Mostrando datos básicos disponibles'
            }
            
            print(f"✅ Datos básicos cargados: {len(tipos_vehiculos)} tipos, {len(radios_disponibles)} radios")
            return JsonResponse(response_data)
            
        except Exception as e:
            print(f"❌ Error en get_datos_basicos: {str(e)}")
            # Datos de respaldo por si todo falla
            return JsonResponse({
                'usuario': None,
                'tipos_vehiculos': [
                    {'id_tipo_vehiculo': 1, 'nombre_tipo_vehiculo': 'Auto'},
                    {'id_tipo_vehiculo': 2, 'nombre_tipo_vehiculo': 'Motocicleta'},
                    {'id_tipo_vehiculo': 3, 'nombre_tipo_vehiculo': 'Camioneta'},
                    {'id_tipo_vehiculo': 4, 'nombre_tipo_vehiculo': 'Bicicleta'}
                ],
                'radios_disponibles': [
                    {'id_radio': 1, 'nombre_radio': 'Radio 61', 'codigo_radio': 'SC7', 'estado_radio': 'Disponible'},
                    {'id_radio': 2, 'nombre_radio': 'Radio 63', 'codigo_radio': 'SC4', 'estado_radio': 'Disponible'},
                    {'id_radio': 3, 'nombre_radio': 'Radio 64', 'codigo_radio': '621', 'estado_radio': 'Disponible'}
                ],
                'mensaje': 'Usando datos de respaldo'
            })

@method_decorator(csrf_exempt, name='dispatch')
class ObtenerVehiculosPorTipo(View):
    def get(self, request, tipo_vehiculo_id):
        try:
            print(f"🔍 Solicitando vehículos para tipo: {tipo_vehiculo_id}")
            
            # Obtener vehículos por tipo que estén disponibles
            # Asumiendo que id_estado_vehiculo=1 es "Disponible"
            vehiculos = Vehiculos.objects.filter(
                id_tipo_vehiculo=tipo_vehiculo_id,
                id_estado_vehiculo=1  # Disponible
            ).values('id_vehiculo', 'patente_vehiculo', 'marca_vehiculo', 
                    'modelo_vehiculo', 'codigo_vehiculo', 'total_kilometraje')
            
            vehiculos_list = list(vehiculos)
            print(f"✅ Vehículos encontrados: {len(vehiculos_list)}")
            
            return JsonResponse({'vehiculos': vehiculos_list})
            
        except Exception as e:
            print(f"❌ Error en ObtenerVehiculosPorTipo: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class IniciarTurnoTrabajador(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            print(f"🚀 Iniciando turno con datos: {data}")
            
            usuario_id = data.get('usuario_id')
            tipo_vehiculo_id = data.get('tipo_vehiculo_id')
            vehiculo_id = data.get('vehiculo_id')
            codigo_vehiculo_manual = data.get('codigo_vehiculo_manual')
            radio_id = data.get('radio_id')
            
            # Validaciones básicas
            if not usuario_id:
                return JsonResponse({'error': 'ID de usuario requerido'}, status=400)
            
            # Obtener usuario
            usuario = Usuario.objects.get(id_usuario=usuario_id)
            
            # Crear asignación de vehículo si se proporcionó vehículo
            asignacion_vehiculo = None
            if vehiculo_id:
                vehiculo = Vehiculos.objects.get(id_vehiculo=vehiculo_id)
                
                # Verificar si ya existe una asignación activa para este vehículo
                asignacion_existente = AsignacionVehiculo.objects.filter(
                    id_vehiculo=vehiculo_id,
                    activo=1  # Disponible
                ).exists()
                
                if asignacion_existente:
                    return JsonResponse({
                        'error': f'El vehículo {vehiculo.patente_vehiculo} ya tiene una asignación activa'
                    }, status=400)
                
                # Crear nueva asignación de vehículo
                asignacion_vehiculo = AsignacionVehiculo.objects.create(
                    id_usuario=usuario,
                    id_vehiculo=vehiculo,
                    fecha_asignacion=date.today(),
                    kilometraje_inicial=vehiculo.total_kilometraje,
                    kilometraje_recorrido=0,  # Iniciar en 0
                    kilometraje_total=vehiculo.total_kilometraje,  # Total inicial = kilometraje del vehículo
                    activo=1  # Disponible (inicia como disponible)
                )
                print(f"✅ Asignación de vehículo creada: {vehiculo.patente_vehiculo}")
                print(f"📊 Kilometraje inicial: {vehiculo.total_kilometraje}")
                print(f"🎯 Estado asignación: Disponible")
                
            elif codigo_vehiculo_manual:
                # Para códigos manuales, crear un registro especial
                asignacion_vehiculo = AsignacionVehiculo.objects.create(
                    id_usuario=usuario,
                    id_vehiculo=None,  # Sin vehículo específico
                    fecha_asignacion=date.today(),
                    kilometraje_inicial=0,
                    kilometraje_recorrido=0,
                    kilometraje_total=0,
                    observaciones=f"Vehículo manual: {codigo_vehiculo_manual}",
                    activo=1  # Disponible
                )
                print(f"✅ Asignación manual creada: {codigo_vehiculo_manual}")
                print(f"🎯 Estado asignación: Disponible")
            
            # Crear asignación de radio si se proporcionó radio
            asignacion_radio = None
            if radio_id:
                radio = Radio.objects.get(id_radio=radio_id)
                
                # Verificar si la radio ya está asignada
                if radio.estado_radio == 'No Disponible':
                    return JsonResponse({
                        'error': f'La radio {radio.nombre_radio} ya está asignada'
                    }, status=400)
                
                asignacion_radio = AsignacionRadio.objects.create(
                    id_usuario=usuario,
                    id_radio=radio,
                    fecha_asignacion=date.today()
                    # fecha_devolucion se establecerá al finalizar el turno
                )
                
                # Marcar radio como no disponible
                radio.estado_radio = 'No Disponible'
                radio.save()
                print(f"✅ Asignación de radio creada: {radio.nombre_radio}")
                print(f"📻 Estado de radio actualizado a: No Disponible")
            
            # Preparar respuesta
            response_data = {
                'success': True,
                'message': 'Turno iniciado correctamente',
                'asignacion_vehiculo_id': asignacion_vehiculo.id if asignacion_vehiculo else None,
                'asignacion_radio_id': asignacion_radio.id if asignacion_radio else None,
                'fecha': date.today().isoformat(),
                'detalles': {
                    'vehiculo': f"{vehiculo.patente_vehiculo if vehiculo_id else 'Manual: ' + codigo_vehiculo_manual}",
                    'radio': radio.nombre_radio if radio_id else 'No asignada',
                    'kilometraje_inicial': vehiculo.total_kilometraje if vehiculo_id else 0,
                    'estado_asignacion': 'Disponible'
                }
            }
            
            print("✅ Turno iniciado exitosamente")
            print(f"📋 Resumen: Vehículo: {response_data['detalles']['vehiculo']}, Radio: {response_data['detalles']['radio']}")
            
            return JsonResponse(response_data)
            
        except Usuario.DoesNotExist:
            print(f"❌ Usuario no encontrado: {usuario_id}")
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
        except Vehiculos.DoesNotExist:
            print(f"❌ Vehículo no encontrado: {vehiculo_id}")
            return JsonResponse({'error': 'Vehículo no encontrado'}, status=404)
        except Radio.DoesNotExist:
            print(f"❌ Radio no encontrada: {radio_id}")
            return JsonResponse({'error': 'Radio no encontrada'}, status=404)
        except Exception as e:
            print(f"❌ Error en IniciarTurnoTrabajador: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class FinalizarTurnoTrabajador(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            print(f"🛑 Finalizando turno con datos: {data}")
            
            usuario_id = data.get('usuario_id')
            asignacion_vehiculo_id = data.get('asignacion_vehiculo_id')
            asignacion_radio_id = data.get('asignacion_radio_id')
            kilometraje_final = data.get('kilometraje_final')
            estado_final = data.get('estado_final', 4)  # Por defecto "No disponible"
            
            cambios_realizados = []
            
            # Finalizar asignación de vehículo
            if asignacion_vehiculo_id:
                try:
                    asignacion_vehiculo = AsignacionVehiculo.objects.get(
                        id=asignacion_vehiculo_id,
                        id_usuario_id=usuario_id
                    )
                    
                    # Actualizar kilometraje si se proporciona
                    if kilometraje_final is not None and asignacion_vehiculo.id_vehiculo:
                        # Calcular kilometraje recorrido
                        kilometraje_recorrido = max(0, kilometraje_final - asignacion_vehiculo.kilometraje_inicial)
                        
                        # Actualizar asignación
                        asignacion_vehiculo.kilometraje_recorrido = kilometraje_recorrido
                        asignacion_vehiculo.kilometraje_total = kilometraje_final
                        asignacion_vehiculo.activo = estado_final  # Usar el estado proporcionado
                        asignacion_vehiculo.save()
                        
                        # Actualizar kilometraje del vehículo
                        vehiculo = asignacion_vehiculo.id_vehiculo
                        vehiculo.total_kilometraje = kilometraje_final
                        vehiculo.save()
                        
                        estado_texto = self.get_estado_texto(estado_final)
                        cambios_realizados.append(f"Vehículo: {kilometraje_recorrido} km recorridos - Estado: {estado_texto}")
                        print(f"✅ Kilometraje actualizado: {kilometraje_recorrido} km recorridos")
                        print(f"🎯 Estado vehículo actualizado a: {estado_texto}")
                    
                    else:
                        # Solo actualizar estado sin kilometraje
                        asignacion_vehiculo.activo = estado_final
                        asignacion_vehiculo.save()
                        estado_texto = self.get_estado_texto(estado_final)
                        cambios_realizados.append(f"Vehículo: Estado: {estado_texto}")
                        print(f"🎯 Estado vehículo actualizado a: {estado_texto}")
                    
                    print("✅ Asignación de vehículo finalizada")
                    
                except AsignacionVehiculo.DoesNotExist:
                    print(f"❌ Asignación de vehículo no encontrada: {asignacion_vehiculo_id}")
                    return JsonResponse({'error': 'Asignación de vehículo no encontrada'}, status=404)
            
            # Finalizar asignación de radio
            if asignacion_radio_id:
                try:
                    asignacion_radio = AsignacionRadio.objects.get(
                        id=asignacion_radio_id,
                        id_usuario_id=usuario_id
                    )
                    asignacion_radio.fecha_devolucion = timezone.now()
                    asignacion_radio.save()
                    
                    # Marcar radio como disponible
                    radio = asignacion_radio.id_radio
                    radio.estado_radio = 'Disponible'
                    radio.save()
                    
                    cambios_realizados.append("Radio: devuelta y disponible")
                    print("✅ Asignación de radio finalizada")
                    print(f"📻 Estado de radio actualizado a: Disponible")
                    
                except AsignacionRadio.DoesNotExist:
                    print(f"❌ Asignación de radio no encontrada: {asignacion_radio_id}")
                    return JsonResponse({'error': 'Asignación de radio no encontrada'}, status=404)
            
            mensaje = 'Turno finalizado correctamente'
            if cambios_realizados:
                mensaje += f". {', '.join(cambios_realizados)}"
            
            return JsonResponse({
                'success': True, 
                'message': mensaje,
                'cambios': cambios_realizados
            })
            
        except Exception as e:
            print(f"❌ Error en FinalizarTurnoTrabajador: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def get_estado_texto(self, estado_id):
        """Convertir ID de estado a texto"""
        estados = {
            1: 'Disponible',
            2: 'En proceso', 
            3: 'En central',
            4: 'No disponible'
        }
        return estados.get(estado_id, 'Desconocido')
    
@method_decorator(csrf_exempt, name='dispatch')
class CambiarEstadoVehiculo(View):
    def post(self, request):
        """Cambiar el estado del vehículo durante el turno"""
        try:
            data = json.loads(request.body)
            
            usuario_id = data.get('usuario_id')
            asignacion_vehiculo_id = data.get('asignacion_vehiculo_id')
            nuevo_estado = data.get('nuevo_estado')  # 1: Disponible, 2: En proceso, 3: En central
            
            if not all([usuario_id, asignacion_vehiculo_id, nuevo_estado]):
                return JsonResponse({'error': 'Datos incompletos'}, status=400)
            
            if nuevo_estado not in [1, 2, 3]:
                return JsonResponse({'error': 'Estado inválido'}, status=400)
            
            # Obtener y actualizar asignación
            asignacion = AsignacionVehiculo.objects.get(
                id=asignacion_vehiculo_id,
                id_usuario_id=usuario_id
            )
            
            estado_anterior = asignacion.activo
            asignacion.activo = nuevo_estado
            asignacion.save()
            
            estados = {1: 'Disponible', 2: 'En proceso', 3: 'En central'}
            
            return JsonResponse({
                'success': True,
                'message': f'Estado cambiado de {estados.get(estado_anterior)} a {estados.get(nuevo_estado)}',
                'estado_anterior': estado_anterior,
                'nuevo_estado': nuevo_estado,
                'estado_texto': estados.get(nuevo_estado)
            })
            
        except AsignacionVehiculo.DoesNotExist:
            return JsonResponse({'error': 'Asignación no encontrada'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
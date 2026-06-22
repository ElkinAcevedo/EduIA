import json
from rest_framework import generics
from .models import Estudiante, EntradaBitacora, Estrategia
from .serializers import EstudianteSerializer, EntradaBitacoraSerializer, EstrategiaSerializer
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .gemini import generar_o_recuperar_analisis,  chat_asistente
from .models import MaterialAdaptado
from .serializers import MaterialAdaptadoSerializer
from .gemini import generar_material
from django.http import HttpResponse
from .pdf_export import generar_pdf_material
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Usuario
from .serializers import RegistroSerializer, UsuarioSerializer
from rest_framework.decorators import api_view, permission_classes


class EstudianteListView(generics.ListCreateAPIView):
    serializer_class = EstudianteSerializer

    def get_queryset(self):
        return Estudiante.objects.filter(profesor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(profesor=self.request.user)

class EstudianteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EstudianteSerializer

    def get_queryset(self):
        return Estudiante.objects.filter(profesor=self.request.user)

class EntradaBitacoraListView(generics.ListCreateAPIView):
    serializer_class = EntradaBitacoraSerializer

    def get_queryset(self):
        queryset = EntradaBitacora.objects.filter(estudiante__profesor=self.request.user)
        estudiante_id = self.request.query_params.get('student')
        if estudiante_id:
            queryset = queryset.filter(estudiante_id=estudiante_id)
        return queryset


class EntradaBitacoraDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EntradaBitacoraSerializer

    def get_queryset(self):
        return EntradaBitacora.objects.filter(estudiante__profesor=self.request.user)

@api_view(['GET'])
def analisis_bitacora(request):
    estudiante_id = request.query_params.get('student')
    if not estudiante_id:
        return Response({'error': 'Se requiere el parámetro student.'}, status=400)
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id, profesor=request.user)
    resultado  = generar_o_recuperar_analisis(estudiante)
    return Response(resultado)

@api_view(['POST'])
def asistente_chat(request):
    estudiante_id = request.data.get('studentId')
    mensaje       = request.data.get('message')
    historial     = request.data.get('history', [])
    if not estudiante_id or not mensaje:
        return Response({'error': 'studentId y message son requeridos.'}, status=400)
    estudiante = get_object_or_404(Estudiante, pk=estudiante_id, profesor=request.user)
    respuesta  = chat_asistente(estudiante, mensaje, historial)
    return Response({'reply': respuesta})

@api_view(['GET'])
def dashboard_resumen(request):
    from django.utils import timezone
    from datetime import timedelta

    hoy = timezone.now().date()
    inicio_semana = hoy - timedelta(days=hoy.weekday())

    estudiantes = Estudiante.objects.filter(profesor=request.user)
    total_estudiantes = estudiantes.count()
    entradas_hoy = EntradaBitacora.objects.filter(
        creado_en__date=hoy
    ).count()

    # Stat cards
    stats = {
        'total_estudiantes': total_estudiantes,
        'estudiantes_hoy': entradas_hoy,
    }

# Estudiantes activos — ordenados por atencion_promedio asc (los más bajos primero)
    activos = []
    for e in estudiantes.order_by('atencion_promedio'):
        atencion = e.atencion_promedio or 0
        status = 'success' if atencion >= 60 else 'danger'

        initials = ''.join(w[0] for w in e.nombre.split())[:2].upper()
        activos.append({
            'id': e.id,
            'name': e.nombre,
            'initials': initials,
            'attention': atencion,
            'status': status,
        })

    # Alertas IA — estudiantes con atencion < 60
    alertas = []
    for e in estudiantes.filter(atencion_promedio__lt=60):
        alertas.append({
            'id': e.id,
            'type': 'warning',
            'title': f'Atención baja detectada en {e.nombre}',
            'body': f'{e.nombre} tiene un promedio de atención de {e.atencion_promedio}%, por debajo del umbral recomendado. Revisa su bitácora reciente.',
            'studentId': e.id,
        })

    # Actividad reciente — últimas 4 entradas de bitácora
    ultimas = EntradaBitacora.objects.select_related('estudiante').filter(estudiante__profesor=request.user).order_by('-creado_en')[:4]
    actividad = []
    for entrada in ultimas:
        actividad.append({
            'id': entrada.id,
            'label': entrada.titulo,
            'student': entrada.estudiante.nombre,
            'categoria': entrada.categoria,
            'time': entrada.creado_en.strftime('%d/%m · %H:%M'),
        })

    return Response({
        'stats': stats,
        'activos': activos,
        'alertas': alertas,
        'actividad': actividad,
    })


class EstrategiaListView(generics.ListAPIView):
    serializer_class = EstrategiaSerializer

    def get_queryset(self):
        qs = Estrategia.objects.filter(activa=True)
        categoria = self.request.query_params.get('categoria')
        q = self.request.query_params.get('q')
        if categoria and categoria != 'todos':
            qs = [e for e in qs if categoria in (e.categorias or [])]
        if q:
            qs_final = [e for e in (qs if isinstance(qs, list) else qs) 
                        if q.lower() in e.titulo.lower() or q.lower() in e.descripcion.lower()]
            return qs_final
        return qs

@api_view(['GET'])
def estrategia_detalle(request, pk):
    estrategia = get_object_or_404(Estrategia, pk=pk, activa=True)
    serializer = EstrategiaSerializer(estrategia)
    return Response(serializer.data)

@api_view(['POST'])
def generar_material_view(request):
    tema           = request.data.get('tema')
    tipo_material  = request.data.get('tipo_material')
    dificultad     = request.data.get('dificultad', 'Intermedio')
    estudiante_id  = request.data.get('estudiante_id')  # puede ser None
    opciones       = request.data.get('opciones', {})

    if not tema or not tipo_material:
        return Response({'error': 'tema y tipo_material son requeridos.'}, status=400)

    estudiante = None
    if estudiante_id:
        estudiante = get_object_or_404(Estudiante, pk=estudiante_id, profesor=request.user)

    try:
        contenido = generar_material(tema, tipo_material, dificultad, estudiante, opciones)
    except Exception as e:
        return Response({'error': f'No se pudo generar el material: {str(e)}'}, status=500)

    material = MaterialAdaptado.objects.create(
        estudiante=estudiante,
        tema=tema,
        tipo_material=tipo_material,
        dificultad=dificultad,
        contenido_markdown=json.dumps(contenido, ensure_ascii=False),
    )

    return Response({
        'id': material.id,
        'tema': material.tema,
        'tipo_material': material.tipo_material,
        'dificultad': material.dificultad,
        'estudiante': estudiante.nombre if estudiante else None,
        'contenido': contenido,
        'creado_en': material.creado_en.isoformat(),
    })


class MaterialAdaptadoListView(generics.ListAPIView):
    serializer_class = MaterialAdaptadoSerializer
    def get_queryset(self):
        return MaterialAdaptado.objects.filter(
            estudiante__profesor=self.request.user
        ).order_by('-creado_en')

@api_view(['GET'])
def material_pdf(request, pk):
    material = get_object_or_404(MaterialAdaptado, pk=pk, estudiante__profesor=request.user)
    contenido = json.loads(material.contenido_markdown)

    material_dict = {
        'tipo_material': material.tipo_material,
        'dificultad': material.dificultad,
        'creado_en': material.creado_en.strftime('%d/%m/%Y'),
    }

    pdf_bytes = generar_pdf_material(material_dict, contenido, material.estudiante)

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    nombre_archivo = f"material_{material.tema.replace(' ', '_')[:30]}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def registro_view(request):
    serializer = RegistroSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    usuario = serializer.save()
    refresh = RefreshToken.for_user(usuario)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': UsuarioSerializer(usuario).data,
    }, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email y contraseña son requeridos.'}, status=400)

    usuario = authenticate(request, email=email, password=password)
    if usuario is None:
        return Response({'error': 'Credenciales inválidas.'}, status=401)

    refresh = RefreshToken.for_user(usuario)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': UsuarioSerializer(usuario).data,
    })


@api_view(['GET'])
def yo_view(request):
    """Devuelve el perfil del usuario autenticado (para hidratar el frontend al refrescar)."""
    return Response(UsuarioSerializer(request.user).data)

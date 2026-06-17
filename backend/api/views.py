from rest_framework import generics
from .models import Estudiante, EntradaBitacora, Estrategia
from .serializers import EstudianteSerializer, EntradaBitacoraSerializer, EstrategiaSerializer
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .gemini import generar_o_recuperar_analisis,  chat_asistente


class EstudianteListView(generics.ListCreateAPIView):
    queryset = Estudiante.objects.all()
    serializer_class = EstudianteSerializer

class EstudianteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Estudiante.objects.all()
    serializer_class = EstudianteSerializer


class EntradaBitacoraListView(generics.ListCreateAPIView):
    serializer_class = EntradaBitacoraSerializer

    def get_queryset(self):
        queryset = EntradaBitacora.objects.all()
        estudiante_id = self.request.query_params.get('student')
        if estudiante_id:
            queryset = queryset.filter(estudiante_id=estudiante_id)
        return queryset

class EntradaBitacoraDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EntradaBitacora.objects.all()
    serializer_class = EntradaBitacoraSerializer

@api_view(['GET'])
def analisis_bitacora(request):
    estudiante_id = request.query_params.get('student')
    if not estudiante_id:
        return Response({'error': 'Se requiere el parámetro student.'}, status=400)

    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    resultado  = generar_o_recuperar_analisis(estudiante)
    return Response(resultado)

@api_view(['POST'])
def asistente_chat(request):
    estudiante_id = request.data.get('studentId')
    mensaje       = request.data.get('message')
    historial     = request.data.get('history', [])

    if not estudiante_id or not mensaje:
        return Response({'error': 'studentId y message son requeridos.'}, status=400)

    estudiante = get_object_or_404(Estudiante, pk=estudiante_id)
    respuesta  = chat_asistente(estudiante, mensaje, historial)
    return Response({'reply': respuesta})

@api_view(['GET'])
def dashboard_resumen(request):
    from django.utils import timezone
    from datetime import timedelta

    hoy = timezone.now().date()
    inicio_semana = hoy - timedelta(days=hoy.weekday())

    estudiantes = Estudiante.objects.all()
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
    ultimas = EntradaBitacora.objects.select_related('estudiante').order_by('-creado_en')[:4]
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


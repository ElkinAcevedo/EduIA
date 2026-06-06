from rest_framework import generics
from .models import Estudiante, EntradaBitacora
from .serializers import EstudianteSerializer, EntradaBitacoraSerializer

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

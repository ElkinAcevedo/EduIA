from rest_framework import serializers
from .models import Estudiante,EntradaBitacora


class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = '__all__'

class EntradaBitacoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntradaBitacora
        fields = '__all__'

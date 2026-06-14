from rest_framework import serializers
from .models import Estudiante,EntradaBitacora,AnalisisBitacora, Estrategia


class EstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudiante
        fields = '__all__'

class EntradaBitacoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntradaBitacora
        fields = '__all__'

class AnalisisSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AnalisisBitacora
        fields = ['resumen', 'patron', 'sugerencia', 'generado_en']



class EstrategiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estrategia
        fields = '__all__'

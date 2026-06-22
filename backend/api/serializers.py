from rest_framework import serializers
from .models import Estudiante,EntradaBitacora,AnalisisBitacora, Estrategia, MaterialAdaptado, Usuario
from rest_framework_simplejwt.tokens import RefreshToken


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


class MaterialAdaptadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialAdaptado
        fields = '__all__'


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'password', 'nombre', 'colegio', 'grado_asignado']

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre', 'colegio', 'grado_asignado']

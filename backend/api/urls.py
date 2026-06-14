from django.urls import path
from .views import (
    EstudianteListView, EstudianteDetailView,
    EntradaBitacoraListView, EntradaBitacoraDetailView,
    analisis_bitacora, asistente_chat, dashboard_resumen,
    EstrategiaListView, estrategia_detalle,
)
urlpatterns = [
    path('students/',          EstudianteListView.as_view()),
    path('students/<int:pk>/', EstudianteDetailView.as_view()),
    path('logbook/',           EntradaBitacoraListView.as_view()),  
    path('logbook/<int:pk>/',  EntradaBitacoraDetailView.as_view()), 
    path('logbook/analysis/',  analisis_bitacora),   
    path('assistant/chat/',    asistente_chat), 
    path('dashboard/', dashboard_resumen),
    path('bank/',          EstrategiaListView.as_view()),
    path('bank/<int:pk>/', estrategia_detalle),
]

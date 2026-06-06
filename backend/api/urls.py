from django.urls import path
from .views import EstudianteListView, EstudianteDetailView, EntradaBitacoraListView, EntradaBitacoraDetailView

urlpatterns = [
    path('students/',          EstudianteListView.as_view()),
    path('students/<int:pk>/', EstudianteDetailView.as_view()),
    path('logbook/',           EntradaBitacoraListView.as_view()),  
    path('logbook/<int:pk>/',  EntradaBitacoraDetailView.as_view()), 
]

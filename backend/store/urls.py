from django.urls import path
from . import views
from rest_framework_simplejwt.views import (

    TokenObtainPairView,
    TokenRefreshView,

)
urlpatterns = [
    path('products/', views.get_products),
    path('products/<int:pk>/', views.get_product),  
    path('products/<int:pk>', views.get_product),
    path('categories/', views.get_categories),
    path('cart/', views.get_cart),
    path('cart/add/', views.add_to_cart),
    path('cart/remove/<int:pk>/', views.remove_from_cart),
    path('cart/update/<int:pk>/', views.update_cart),
    path("register/", views.register),

    path(
        "login/",
        TokenObtainPairView.as_view(),
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
    ),

]
from django.urls import path
from . import views
from .views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Products (public — shows ALL products for storefront)
    path('products/', views.get_products),
    path('products/<int:pk>/', views.get_product),
    path('products/<int:pk>', views.get_product),
    # Products (admin — scoped to created_by)
    path('admin/products/', views.admin_products),
    path('products/create/', views.create_product),
    path('products/<int:pk>/update/', views.update_product),
    path('products/<int:pk>/delete/', views.delete_product),
    # Categories (public — shows ALL categories for storefront)
    path('categories/', views.get_categories),
    # Categories (admin — scoped to created_by)
    path('admin/categories/', views.admin_categories),
    path('categories/create/', views.create_category),
    path('categories/<int:pk>/update/', views.update_category),
    path('categories/<int:pk>/delete/', views.delete_category),
    # Cart
    path('cart/', views.get_cart),
    path('cart/add/', views.add_to_cart),
    path('cart/remove/<int:pk>/', views.remove_from_cart),
    path('cart/update/<int:pk>/', views.update_cart),
    # Checkout (Customer)
    path('checkout/', views.checkout),
    # Order History (Customer)
    path('orders/mine/', views.my_orders),
    path('orders/mine/<int:pk>/', views.my_order_detail),
    # Orders (Admin)
    path('orders/', views.get_orders),
    path('orders/<int:pk>/', views.get_order_detail),
    # Ratings (Customer)
    path('ratings/', views.create_rating),
    path('ratings/mine/', views.my_ratings),
    path('products/<int:pk>/ratings/', views.product_ratings),
    # Ratings (Admin)
    path('admin/ratings/', views.admin_product_ratings),
    # Dashboard (Admin)
    path('dashboard/stats/', views.get_dashboard_stats),
    # Auth
    path('register/', views.register),
    path('login/', CustomTokenObtainPairView.as_view()),
    path('forgot-password/', views.forgot_password),
    path('reset-password/', views.reset_password),
    path('refresh/', TokenRefreshView.as_view()),
    path('profile/', views.get_profile),
    path('profile/update/', views.update_profile),
]
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
# pyrefly: ignore [missing-import]
from . import views

urlpatterns = [
    path('products/', views.get_products),
    path('products/<int:pk>/', views.get_product),
    path(
    "products/<int:pk>/find-variant/",
    views.find_product_variant,
    name="find-product-variant",
),
    path('products/<int:pk>/variants/', views.get_product_variants, name='product-variants'),
    path('products/<int:pk>/variants/create/', views.create_product_variant, name='create-product-variant'),
    path('variants/<int:pk>/update/', views.update_product_variant, name='update-product-variant'),
    path('variants/<int:pk>/delete/', views.delete_product_variant, name='delete-product-variant'),
    path('admin/products/', views.admin_products),
    path('products/create/', views.create_product),
    path('products/<int:pk>/update/', views.update_product),
    path('products/<int:pk>/delete/', views.delete_product),
    path('categories/', views.get_categories),
    path('admin/categories/', views.admin_categories),
    path('admin/orders/',views.admin_orders),
    path('categories/create/', views.create_category),
    path('categories/<int:pk>/update/', views.update_category),
    path('categories/<int:pk>/delete/', views.delete_category),
    path("categories/<int:category_id>/subcategories/",views.get_subcategories,name="get-subcategories"),
    path("categories/<int:category_id>/subcategories/create/",views.create_subcategory,name="create-subcategory"),
    path("subcategories/<int:pk>/",views.update_subcategory,),
    path("subcategories/<int:pk>/delete/",views.delete_subcategory,),  
    path("subcategories/<slug:slug>/attributes/", views.get_subcategory_attributes),
    path("subcategories/<int:subcategory_id>/attributes/create/", views.create_attribute),
    path("attributes/<int:pk>/update/", views.update_attribute),
    path("attributes/<int:pk>/delete/", views.delete_attribute),
    path("attributes/<int:attribute_id>/values/create/", views.create_attribute_value),
    path("values/<int:pk>/update/", views.update_attribute_value),
    path("values/<int:pk>/delete/", views.delete_attribute_value),

    path(
    "wishlist/",
    views.get_wishlist,
    ),

    path(
    "wishlist/add/",
    views.add_to_wishlist,
    ),

    path(
    "wishlist/remove/<int:product_id>/",
    views.remove_from_wishlist,
    ),

    path('cart/', views.get_cart),
    path('cart/add/', views.add_to_cart),
    path('cart/remove/<int:pk>/', views.remove_from_cart),
    path('cart/update/<int:pk>/', views.update_cart),
    path('checkout/', views.checkout),
    path('checkoutRaz/', views.checkout_razorpay, name='checkout-razorpay'),
    path('checkoutRaz/verify/', views.checkout_razorpay_verify, name='checkout-razorpay-verify'),
    path('orders/mine/', views.my_orders),
    path('orders/mine/<int:pk>/', views.my_order_detail),
    path('orders/', views.get_orders),
    path('orders/<int:pk>/', views.get_order_detail),
    path('ratings/', views.create_rating),
    path('ratings/mine/', views.my_ratings),
    path('products/<int:pk>/ratings/', views.product_ratings),
    path('admin/ratings/', views.admin_product_ratings),
    path('dashboard/stats/', views.get_dashboard_stats),
    path('register/', views.register),
    path('login/', views.CustomTokenObtainPairView.as_view()),
    path('forgot-password/', views.forgot_password),
    path('reset-password/', views.reset_password),
    path('refresh/', TokenRefreshView.as_view()),
    path('profile/', views.get_profile),
    path('profile/update/', views.update_profile),
    path(
    "vendor/subscription-plans/",
    views.get_subscription_plans,
    name="subscription-plans",
    ),

    path(
    "vendor/subscription/",
    views.get_my_subscription,
    name="my-subscription",
    ),
    
    path(
    "vendor/subscription/current/",
    views.CurrentSubscriptionView.as_view(),
    name="current-vendor-subscription",
    ),
    
    path(
    "vendor/subscription/create/",
    views.create_vendor_subscription,
    name="create-vendor-subscription",
),
    path(
    "vendor/subscription/verify/",
    views.verify_subscription_payment,
    name="verify-subscription-payment",
),
    # Super admin 
    path('superadmin/admins/', views.superadmin_admins),
    path('superadmin/admins/pending/', views.superadmin_pending_admins),
    path('superadmin/admins/<int:pk>/activate/', views.superadmin_activate_admin),
    path('superadmin/admins/<int:pk>/reject/', views.superadmin_reject_admin),
    path('superadmin/admins/<int:pk>/suspend/', views.superadmin_suspend_admin),
    path(
    "vendor/subscription-plans/create/",
    views.create_subscription_plan,
    name="create-subscription-plan",
),
    path(
    "vendor/subscription-plans/",
    views.list_subscription_plans,
    name="subscription-plans",
),
    path(
    "vendor/subscription-plans/<int:pk>/update/",
    views.update_subscription_plan,
    name="update-subscription-plan",
),

    path(
        "vendor/subscription-plans/<int:pk>/delete/",
        views.delete_subscription_plan,
        name="delete-subscription-plan",
    ),
]
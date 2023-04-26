from django.urls import path, include
from . import views
from rest_framework_nested import routers

router = routers.DefaultRouter()

router.register('categories', views.CategoryViewSet, basename='categories')
router.register('products', views.ProductViewset, basename='products')
router.register('cart', views.CartViewSet, basename='carts')
# nested cartitem view: nested in the cart view
cart_router = routers.NestedDefaultRouter(router, 'cart', lookup='cart')
cart_router.register('items', views.CartItemViewSet, basename='cart-items')
router.register('user', views.UserViewset, basename='user')
router.register('order-item', views.OrderItemViewSet, basename='order-item')
router.register(r'payments', views.PaymentViewSet, basename='payment')




urlpatterns = [
    path('', include(cart_router.urls)),
    path('', include(router.urls)),
    path('orders/', views.OrderView.as_view(), name='order-create'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),

]

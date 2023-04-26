from rest_framework import status, generics
from .models import Category, Product, Cart, CartItems, Order, Payment, OrderItem
from .serializers import CategorySerializer, ProductSerializer, CartSerializer, CartItemSerializer, AddCartItemSerializer, UpdateCartItemSerializer, UserSerializer, OrderSerializer, OrderItemSerializer, PaymentSerializer
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from core.models import MyUser
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
import uuid
from django.urls import reverse
from django.http import JsonResponse
from django.views import View
from django.core.exceptions import ValidationError


# Create your views here.



class UserViewset(ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return MyUser.objects.all().order_by('id')
        else:
            return MyUser.objects.filter(id=self.request.user.id)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        session_key = request.session.get('session_key', str(uuid.uuid4()))
        request.session['session_key'] = session_key
        data = serializer.data
        data['session_key'] = session_key
        return Response(data)


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer



class ProductViewset(ModelViewSet):
    queryset = Product.objects.order_by('id')
    serializer_class = ProductSerializer
    ordering_fields = ['category', 'price']
    search_fields = ['title', 'category__title']

    def get_permissions(self):
        permission_classes = []
        if self.request.method != 'GET':
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]



class CartViewSet(ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    authentication_classes = (JWTAuthentication,)

    def create(self, request, *args, **kwargs):
        user = request.user

        # Check if the user already has a cart
        cart = Cart.objects.filter(user=user).first()
        if cart:
            if cart.completed:
                cart.completed = False
                cart.save()

            serializer = self.get_serializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # If the user does not have a cart, create a new one
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = serializer.save(user=user)

       # Update the session key in the cart object
        session_key = request.data.get('session_key')
        cart.session_key = session_key
        cart.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)




class CartItemViewSet(ModelViewSet):
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        cart_id = self.kwargs.get("cart_pk")
        if cart_id is None:
            return CartItems.objects.none()
        return CartItems.objects.filter(cart_id=cart_id)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AddCartItemSerializer
        elif self.request.method == "PATCH":
            return UpdateCartItemSerializer
        return CartItemSerializer

    def get_serializer_context(self):
        return {"cart_id": self.kwargs.get("cart_pk")}

    def perform_create(self, serializer):
        cart_id = self.kwargs.get("cart_pk")
        if cart_id is None:
            return Response(
                {"error": "cart_id must be specified"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.request.session["cart_id"] = cart_id
        try:
            cart = get_object_or_404(Cart, pk=cart_id)
        except ValidationError:
            return Response(
                {"error": "Invalid cart_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = serializer.validated_data
        product_id = data.get("product_id")
        product = get_object_or_404(Product, pk=product_id)
        quantity = data.get("quantity", 1)
        cart_item = CartItems.objects.filter(cart=cart, product=product).first()
        if cart_item:
            cart_item.quantity += quantity
            cart_item.save()
        else:
            cart_item = serializer.save(cart=cart, product=product, quantity=quantity)


    def perform_destroy(self, instance):
        if instance.quantity > 1:
            instance.quantity -= 1
            instance.save()
        else:
            instance.delete()

    def delete(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        queryset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)




class OrderItemViewSet(ModelViewSet):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return MyUser.objects.all().order_by('id')
        else:
            return MyUser.objects.filter(id=self.request.user.id)



class OrderView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Order.objects.all()
        elif self.request.user.groups.count() == 0:
            return Order.objects.filter(cart__user=self.request.user)
        elif self.request.user.groups.filter(name='Delivery Crew').exists():
            return Order.objects.filter(status=Order.PENDING, cart__items__product__seller=self.request.user)
        else:
            return Order.objects.all()

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user_id', None)
        user = get_object_or_404(MyUser, id=user_id)
        if user_id is None:
            return Response({'message': 'user_id is required to create an order'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = CartItems.objects.filter(cart__user_id=user_id)
        if not cart_items.exists():
            return Response({'message': 'no items in cart'})


        order = Order(cart=cart_items.first().cart, total_cost=self.get_total_price(cart_items), user=user)
        order.save()

        for cart_item in cart_items:
            OrderItem.objects.create(order=order, product=cart_item.product, quantity=cart_item.quantity, price=cart_item.product.price)

        cart_items.delete()

        serialized_order = OrderSerializer(order)
        return Response(serialized_order.data)

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        order.shipping_address = request.data['shipping_address']
        order.save()
        serialized_order = OrderSerializer(order)
        return Response(serialized_order.data)

    def get_total_price(self, cart_items):
        return sum([cart_item.quantity * cart_item.product.price for cart_item in cart_items])





class PaymentViewSet(ModelViewSet):
    serializer_class = PaymentSerializer
    authentication_classes = (JWTAuthentication,)

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Payment.objects.all().order_by('id')
        else:
            return Payment.objects.none()

    def create(self, request, *args, **kwargs):
        # retrieve the order object for the user
        order_id = request.data.get('order_id')
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order does not exist or is not owned by the user.'}, status=status.HTTP_400_BAD_REQUEST)

        # check if the order has already been paid for
        if Payment.objects.filter(Q(order=order) & Q(user=request.user)).exists():
            return Response({'error': 'Order has already been paid for.'}, status=status.HTTP_400_BAD_REQUEST)

        # update the order with the shipping address and payment status
        order_serializer = OrderSerializer(order, data={
            'shipping_address': request.data.get('shipping_address'), 
            'status': 'paid'
        }, partial=True )
        if order_serializer.is_valid():
            order_serializer.save()


            # create a payment for the order
            payment_serializer = self.get_serializer(data={
                'user': request.user.id,
                'order': order.id,
                'payment_method': request.data.get('payment_method'),
                'amount_paid': order.total_cost,
                'shipping_address': request.data.get('shipping_address')
            })
            payment_serializer.is_valid(raise_exception=True)
            payment_serializer.save()

            # # Mark the cart as completed
            # cart_id = order.cart_id
            # cart = get_object_or_404(Cart, id=cart_id, user=request.user)
            # if cart.completed:
            #     raise ValidationError('Cart has already been completed.')
            # cart.completed = True
            # cart.save()

            # Toggle the cart status
            cart_id = order.cart_id
            cart = get_object_or_404(Cart, id=cart_id, user=request.user)
            cart.completed = not cart.completed
            cart.save()

            return Response({'order_id': order.id}, status=status.HTTP_200_OK)
        else:
            # if order serializer is not valid, return an error
            return Response(order_serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.all()

    def get(self, request, *args, **kwargs):
        order = self.get_object()

        # check if the user who made the request is the owner of the order or an admin user
        if request.user == order.cart.user or request.user.is_staff:
            serializer = self.serializer_class(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'You do not have permission to access this order.'}, status=status.HTTP_403_FORBIDDEN)



class IndexView(View):
    def get(self, request, *args, **kwargs):
        endpoints = {
            'categories-list': reverse('categories-list'),
            'categories-detail': reverse('categories-detail', args=[1]),
            'products-list': reverse('products-list'),
            'products-detail': reverse('products-detail', args=[1]),
            # 'carts-list': reverse('carts-list'),
            # 'carts-detail': reverse('carts-detail', args=[1]),
            # 'cart-items-list': reverse('cart-items-list', args=[1]),

            # 'user-list': reverse('user-list'),
            # 'user-detail': reverse('user-detail', args=[1]),
            # 'order-item-list': reverse('order-item-list'),
            # 'order-item-detail': reverse('order-item-detail', args=[1]),
            # 'payments-list': reverse('payment-list'),
            # 'payments-detail': reverse('payment-detail', args=[1]),
        }

        links = []
        for name, url in endpoints.items():
            links.append({
                'name': name,
                'url': url,
            })

        return JsonResponse({'endpoints': links})



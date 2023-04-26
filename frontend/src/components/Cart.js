import React, {useState} from "react";
import { Card, Typography, CardActions, Button, Modal, Box, Container, Grid } from "@mui/material";
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import CartItem from "./CartItem";
import { useNavigate, Link } from "react-router-dom";
import { fetchCartItems, API_URL } from "../constants";
import eventEmitter from "../constants/events";
import axios from "axios";





const Cart = ({ cartItems, deleteCartItem, setCartItems }) => {

  const [isPopUpOpen, setPopUpOpen] = useState(false)
  const navigate = useNavigate()

  const handlePopUp = () => setPopUpOpen(!isPopUpOpen)

  const items = cartItems?.items ?? []

  const cartId = localStorage.getItem('cart_id');
  const userId = localStorage.getItem('user_id')


  const confirmPurchase = async () => {
    handlePopUp();
    const access = localStorage.getItem('access_token');
  
    try {
      const orderData = {
        'total_cost': cartItems.cart_total,
        'cart_id': cartId,
        'user_id': userId,
        'status': 'pending'
      };
      console.log(userId)
      const response = await axios.post(`${API_URL}orders/`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${access}`,
        }
      });
  
      const orderId = response.data.id;
  
      // Clear the cart
      axios.delete(`${API_URL}cart/${cartId}/items/`)
        .then(resp => {
          console.log(`Your order is successful, cart emptied`);
          fetchCartItems(cartId, setCartItems);
          localStorage.removeItem('cartitems');
          eventEmitter.emit('cartUpdated', items.length);
        });
  
      navigate(`/payments/${orderId}`);
    } catch (error) {
      console.log('Error creating order:', error);
      console.log(error.response.data)
    }
  };
  


  return (
    <Container sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Container>
        <Typography variant="h3" style={{ marginTop: 30, textDecoration: "underline #ff0000 solid", fontFamily: "Pacifico" }}>Cart</Typography>
        {
          isPopUpOpen && (
            <Modal open={isPopUpOpen} onClose={handlePopUp} >
              <Box sx={modalStyle}>
                <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ textAlign: "center" }} >
                  Thank you for your order
                </Typography>
                <Typography id="modal-modal-title" variant="h6" component="h2">
                  Your Order Summary: {items.map(item => {
                    return <Typography key={item.id} sx={{ my: 1 }} >
                      {item.product.title}
                    </Typography>
                  })}
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2, fontWeight: 600 }}>
                  Total amount is £{cartItems.cart_total}
                </Typography>
                <Button onClick={confirmPurchase} sx={{ textAlign: "center" }} variant="contained" >Confirm Purchase</Button>
              </Box>
            </Modal>
          )
        }

        <Card sx={cardStyle}>
          {
            items.length > 0 ?
              items.map((item) => (
                <CartItem
                  itemData={item}
                  key={item.id}
                  setCartItems={setCartItems}
                  deleteCartItem={deleteCartItem}
                  cartItems={cartItems}
                />
              )) : (
                <Typography></Typography>
              )
          }
          {
            items.length > 0 &&
            <>
              <Grid container>
                <Grid item xs={6} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  Total: {cartItems.cart_total}
                </Grid>
                <Grid item xs={6} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <CardActions>
                    <Button
                      size="medium"
                      sx={checkoutbtnStyle}
                      onClick={handlePopUp}
                      variant="contained"
                      color='inherit'
                    >
                      checkout
                    </Button>
                  </CardActions>
                </Grid>
              </Grid>
            </>
          }
          {
            items.length === 0 &&
            <CardActions sx={{ display: 'flex', justifyContent: "center" }}>
              <Typography>Your cart is empty!</Typography>
              <RemoveShoppingCartIcon />
            </CardActions>
          }
        </Card>
        <Link to="/" style={{ textDecoration: "none", color: 'black' }} >
          <Button variant="contained" size="medium" color='error' sx={{ mb: 3 }}>Go back</Button>
        </Link>
      </Container>
    </Container>
  )
}

export default Cart;


const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}


const cardStyle = {
  display: "grid",
  alignItems: "center",
  textAlign: "center",
  gap: { lg: "30px", md: "20px", xs: "5px" },
  maxWidth: { lg: "800px", md: "600px", xs: "400px" },
  padding: "40px",
  margin: " 25px auto",
  borderBottom: "2px solid #D9D9D9"
}


const checkoutbtnStyle = {
  textTransform: "none"
}

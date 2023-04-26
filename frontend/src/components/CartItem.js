import { Button, CardMedia, Typography, Grid } from "@mui/material";
import axios from "axios";
import { BASE_URL, fetchCartItems } from "../constants";
import eventEmitter from "../constants/events";



const CartItem = ({itemData, setCartItems, cartItems}) => {

    const cartId = localStorage.getItem('cart_id');
    const items = cartItems.items


    const deleteCartItem = (id) => {
        axios.delete(`${BASE_URL}cart/${cartId}/items/${id}/`)
            .then(response => {
                console.log(`Cart item ${id} deleted successfully`, response);
                // Remove the deleted item from cart items
                const updatedCartItems = items.filter(item => item.id !== id);
                setCartItems(updatedCartItems);
                fetchCartItems(cartId, setCartItems)
                eventEmitter.emit('cartUpdated', updatedCartItems.length);
            })
            .catch(error => {
                console.error(`Error deleting cart item ${id}:`, error);
            });
    };




    return (
        <>
            <Grid container>
                <Grid item xs={6} md={3} sx={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                    <CardMedia component="img" image={itemData.product.image} title={itemData.title} sx={{height:"100px", width:"80px"}} />
                </Grid>
                <Grid item xs={6} md={3} sx={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                    <Typography variant="p" > {itemData.product.title} </Typography>
                </Grid>
                <Grid item xs={4} md={2} sx={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                    <Typography variant="p" > £ {itemData.product.price} </Typography>
                </Grid>
                <Grid item xs={4} md={2} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Typography variant="p" > QTY:{itemData.quantity} </Typography>
                </Grid>
                <Grid item xs={4} md={2} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Button
                        size="small"
                        variant="contained"
                        color="error"
                        component="button"
                        sx={{ textTransform: "none" }}
                        onClick={() => deleteCartItem(itemData.id)}
                    >
                        Delete
                    </Button>

                </Grid>
            </Grid>
        </>
    )
}

export default CartItem;

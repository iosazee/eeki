import React, {useState, useEffect} from 'react';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { useParams, Link } from 'react-router-dom';
import LazyLoad from 'react-lazy-load';
import axios from "axios";
import { BASE_URL, fetchCartItems} from '../constants';
import eventEmitter from '../constants/events';


const ProductDetail = ({setCartItems}) => {

    const [selectedProduct, setSelectedProduct] = useState(null)
    const [errorMessage, setErrorMessage] = useState('');
    let {id} = useParams()
   

    useEffect(() => {
        axios.get(`${BASE_URL}products/${id}`)
          .then(response => {
            setSelectedProduct(response.data);
            // console.log(response.data)
          })
          .catch(error => {
            console.error(error);
          });
      }, [id]);



      const handleAddItemToCart = () => {
          const cartId = localStorage.getItem('cart_id');
          const userId = localStorage.getItem('user_id');

          if (!userId) {
              setErrorMessage('Please log in or register to add items to the cart.');
              return;
          }

          const newItem = {
          "product_id": selectedProduct.id,
          "quantity": 1,
          "user_id": userId
        };
        axios.post(`${BASE_URL}cart/${cartId}/items/`, newItem)
          .then(response => {
            // console.log( "PD Resp", response.data);
            localStorage.setItem('cart_updated', true);
            fetchCartItems(cartId, setCartItems);
            // Emit the cartUpdated event with the updated cartCount
            eventEmitter.emit('cartUpdated', response.data.total_quantity);
          })
          .catch(error => {
            console.error(error);
          });
      };


    const getRatingStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                stars.push(<StarIcon key={i} style={{ color: "yellow" }} />);
            } else {
                stars.push(<StarBorderIcon key={i} style={{ color: "yellow" }} />);
            }
        }
        return stars;
    };


    return (
        <Container sx={{flexGrow:1, display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Card elevation={0} sx={{background: "transparent", my:3}}>
                {
                    selectedProduct ? (
                        <Card sx={{padding: "20px 5px" }} >
                            <Grid container> 
                                <Grid item xs={12} sm={6}>
                                    <LazyLoad height={350} offset={70} >
                                        <CardMedia
                                            sx={{ height: "100%", objectFit: "contain" }}
                                            component="img"
                                            image={selectedProduct.image}
                                            title={selectedProduct.title}
                                        />
                                    </LazyLoad>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="div">
                                            {selectedProduct.title}
                                        </Typography>
                                        <Typography gutterBottom variant="h5" component="div">
                                            {selectedProduct.price}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedProduct.description}
                                        </Typography>
                                        <Typography variant="body2" style={{backgroundColor:"#394150", color:"#fff", borderRadius: "8px"}} component="div" my={2} > <Typography>Rating:</Typography>
                                            {selectedProduct && getRatingStars(selectedProduct.rating)}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{display: "flex", justifyContent: "space-evenly", alignItems: "center"}}>
                                        <Button variant="contained" size="small" onClick={handleAddItemToCart} data-testid="add-to-cart" color='inherit' sx={{mr:12 }} >Add to Cart</Button>
                                        <Link to="/cart" style={{ textDecoration: "none", color: 'inherit' }} ><Button variant="contained" size="small" color='inherit'>View Cart</Button></Link>
                                    </CardActions>
                                    {errorMessage && (
                                        <Typography variant="body2" style={{ color: 'red', marginTop: '10px' }}>
                                            {errorMessage}
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </Card>
                    ) : (
                        <Typography>Loading...</Typography>
                    )
                }
                <Link to="/" style={{ textDecoration: "none", color:'black'}} >
                    <Button variant="contained" size="medium" color='error' sx={{ mt: 3 }}>Go back</Button>
                </Link>
            </Card>
        </Container>
    );
}

export default ProductDetail;



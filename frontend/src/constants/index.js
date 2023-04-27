import axios from "axios";
import eventEmitter from "./events";


export const BASE_URL = "https://shop365api.store/"


export const fetchCartItems = (cartId, setCartItems) => {
    axios
      .get(`${BASE_URL}cart/${cartId}/`)
      .then((response) => {
        setCartItems(response.data);
        // console.log(response.data)
        localStorage.setItem("cartitems", JSON.stringify(response.data));
        const cartCount = response.data.total_quantity || 0;
        eventEmitter.emit('cartUpdated', cartCount);
      })
      .catch((error) => {
        console.error(error);
      });
  };
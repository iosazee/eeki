import { useState, useEffect } from 'react'
import Products from './components/Products'
import ProductDetail from './components/ProductDetail';
import { Routes, Route } from 'react-router-dom';
import ContactUs from './components/ContactUs';
import Cart from './components/Cart';
import NavBar from './components/Navbar';
import Footer from './components/Footer';
import About from './components/About';
import Faq from './components/Faq';
import './App.css';
import FeaturedProduct from './components/FeaturedProduct';
import Results from './components/Results';
import axios from 'axios';
import { BASE_URL, fetchCartItems } from './constants';
import UserLogin from './components/UserLogin';
import Payment from './components/Payment';
import PaymentConfirmation from './components/PaymentConfirmation';




function App() {

  const [products, setProducts] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchSubmiited, setSearchSubmission] = useState(false)



  useEffect(() => {
    const cartId = localStorage.getItem("cart_id");
    if (cartId) {
      fetchCartItems(cartId, setCartItems);
    }
  }, []);


    useEffect(() => {
      axios.get(`${BASE_URL}products`)
        .then(response => {
          setProducts(response.data.results);
          // console.log(response.data.results)
        })
        .catch(error => {
          console.error(error);
        });
    }, []);





  const menProducts = products.filter(product => product.category.title === "Men's Clothing");
  const womenProducts = products.filter(product => product.category.title === "Women's Clothing");
  const electronicProducts = products.filter(product => product.category.title  === "Electronics");
  const jeweleryProducts = products.filter(product => product.category.title === "Jewellery");



  const searchProducts = products.filter((el) => {
    return searchQuery !== "" && isSearchSubmiited
      ? el.title.toLowerCase().includes(searchQuery.toLowerCase()) ? el : null
      : null
  })

  const handleSearchQuery = (e) => {
    setSearchQuery(e.target.value)
    if (e.target.value === "") {
      setSearchSubmission(false)
    }
  }


  return (

      <section className='App'>
        <NavBar
          cartItems={cartItems}
          searchQuery={searchQuery}
          handleSearchQuery={handleSearchQuery}
          setSearchSubmission={setSearchSubmission}
        />
        <Routes>
          <Route exact path='/' element={<> <FeaturedProduct products={products} />
            <Products products={products} /> </>} />
          <Route path='/products/:id' element={<ProductDetail  setCartItems={setCartItems}  />} />
          <Route path='/cart'
            element={<Cart cartItems={cartItems}
              setCartItems={setCartItems}
            />}
          />
          <Route path='/payments/:orderId' element={<Payment />} />
          <Route path='/confirm/:orderId/' element={  <PaymentConfirmation />} />
          <Route path='/products/search' element={<> <Products products={searchProducts} /> <Results products={searchProducts} /> </>} />
          <Route path='/products/mens' element={<> <Products products={menProducts} /> <Results products={menProducts} /> </>} />
          <Route path='/products/womens' element={<> <Products products={womenProducts} /> <Results products={womenProducts} /> </>} />
          <Route path='/products/jewelery' element={<> <Products products={jeweleryProducts} /> <Results products={jeweleryProducts} /> </>} />
          <Route path='/products/electronics' element={<> <Products products={electronicProducts} /> <Results products={electronicProducts} /> </>} />
          <Route path='/contact' element={<ContactUs />} />
          <Route path='/about' element={<About />} />
          <Route path='/faq' element={<Faq />} />
          <Route path='/login' element={<UserLogin />} />
          {/* <Route path="*" element={<Navigate to='/' replace />} /> */}
        </Routes>
        <Footer />
      </section>
  )
}

export default App;

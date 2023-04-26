import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BASE_URL } from '../constants';
import axios from 'axios';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  Container,
  Typography
} from "@mui/material";

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [shippingAddress, setShippingAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiration, setCardExpiration] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate()
  const { orderId } = useParams()

  useEffect(()  => {
    // console.log(orderId)
  }, [orderId])



  const resetForm = () => {
    setPaymentMethod('stripe');
    setShippingAddress('');
    setCardNumber('');
    setCardExpiration('');
    setCardCVV('');
  };

  const validateCardNumber = () => {
    let sum = 0;
    let doubleUp = false;
    const cardNumberArray = cardNumber.split('').reverse();
    for (let i = 0, len = cardNumberArray.length; i < len; i++) {
      let num = parseInt(cardNumberArray[i], 10);
      if (doubleUp) {
        if ((num *= 2) > 9) num -= 9;
      }
      sum += num;
      doubleUp = !doubleUp;
    }
    return sum % 10 === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const accessToken = localStorage.getItem('access_token');

    if (!validateCardNumber()) {
      setErrorMessage('Invalid credit card number.');
      return;
    }

    const formData = {
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      card_number: cardNumber,
      card_expiration: cardExpiration,
      card_cvv: cardCVV,
      order_id: orderId
    };

    axios.post(`${BASE_URL}payments/`, formData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${accessToken}`,
      },
    })
      .then((response) => {
        console.log('Payment created successfully', response.data);
        // Handle successful payment creation (e.g. show confirmation message)
        resetForm()
        navigate(`/confirm/${orderId}`)
      })
      .catch((error) => {
        console.error('Error creating payment', error);
        // Handle error (e.g. show error message)
      });
  };


  return (
    <Container>
      <Card elevation={3} sx={{ background: "transparent", my: 3, maxWidth: 650, margin: "32px auto", padding: "10px" }}>
        <Typography>Thank you for confirming your Order with id of {orderId}. Kindly fill in the form below to pay for the order</Typography>
        {errorMessage && (
          <Typography color="error" style={{ marginBottom: 16 }}>
            {errorMessage}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="payment-method-label" sx={{my: 2}} >Payment Method</InputLabel>
          <Select
            labelId="payment-method-label"
            id="payment-method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <MenuItem value="stripe">Stripe</MenuItem>
            <MenuItem value="paypal">PayPal</MenuItem>
            <MenuItem value="credit_card">Credit Card</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Shipping Address"
          margin="normal"
          value={shippingAddress}
          onChange={(event) => setShippingAddress(event.target.value)}
        />
        {paymentMethod && (
          <>
            <TextField
              fullWidth
              label="Card Number"
              margin="normal"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
            />
            <TextField
              fullWidth
              label="Expiration (MM/YYYY)"
              margin="normal"
              value={cardExpiration}
              onChange={(event) => setCardExpiration(event.target.value)}
            />
            <TextField
              fullWidth
              label="CVV"
              margin="normal"
              value={cardCVV}
              onChange={(event) => setCardCVV(event.target.value)}
            />
          </>
        )}
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>
      </Card>
    </Container>
  );
};

export default Payment;
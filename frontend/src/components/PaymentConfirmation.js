import { Card, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line
  const { orderId } = useParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000); // Redirect the user to the homepage after 3 seconds
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section style={{ marginBottom: 25 }}>
      <Card style={{ maxWidth: 650, margin: "0 auto", padding: "20px 5px" }}>
        <Typography variant="h3" style={{ marginTop: 25 }}>
          Thank you for your purchase!
        </Typography>
        <Typography variant="h3" style={{ marginTop: 25 }}>
          Your items are on the way
        </Typography>
      </Card>
    </section>
  );
};

export default PaymentConfirmation;
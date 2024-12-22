const express = require("express");
const PORT = 8000;
const app = express();
const { RPCObserver, RPCRequest } = require("./rpc");

app.use(express.json());

const fakeProductResponse = {
  product_id: "43h32g4jh2354g4jh5g43j5",
  title: "iPad",
  price: 700,
};
RPCObserver("PRODUCT_RPC", fakeProductResponse);

app.get("/customer", async (req, res) => {
  const requestPayload = {
    customerId: "43h32g4jh2354g4jh5g43j5",
  };
  try {
    const responseData = await RPCRequest("CUSTOMER_RPC", requestPayload);
    console.log("CUSTOMER_RPC responseData: ", responseData);
    return res.status(200).json(responseData);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }

  return res.json("Product Profile");
});

app.get("/", (req, res) => {
  return res.json("Product Service");
});

app.listen(PORT, () => {
  console.log(`Product is Running on ${PORT}`);
});

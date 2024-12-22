const express = require("express");
const { RPCObserver, RPCRequest } = require("./rpc");
const PORT = 9000;
const app = express();

app.use(express.json());
const fakeCustomerResponse = {
  customer_Id: "43h32g4jh2354g4jh5g43j5",
  name: "Mike",
  country: "Finland",
};
RPCObserver("CUSTOMER_RPC", fakeCustomerResponse);

app.get("/wishlist", async (req, res) => {
  const requestPayload = {
    productId: "123",
    customerId: "43h32g4jh2354g4jh5g43j5",
  };
  try {
    const responseData = await RPCRequest("PRODUCT_RPC", requestPayload);
    console.log("PRODUCT_RPC responseData: ", responseData);
    return res.status(200).json(responseData);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

app.get("/", (req, res) => {
  return res.json("Customer Service");
});

app.listen(PORT, () => {
  console.log(`Customer is Running on ${PORT}`);
});

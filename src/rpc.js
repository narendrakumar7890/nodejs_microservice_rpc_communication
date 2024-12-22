const amqplib = require("amqplib");
const { v4: uuid4 } = require("uuid");

let amqplibConnection = null;

let getChannel = async () => {
  if (amqplibConnection == null) {
    amqplibConnection = await amqplib.connect("amqp://localhost");
    // amqplibConnection = await amqplib(
    //   "amqps://xmnxntdp:hFQzCZ61XW0O9V3xrHtM5-D_yqSVrsUy@cow.rmq2.cloudamqp.com/xmnxntdp"
    // );
  }
  return await amqplibConnection.createChannel();
};
const expensiveDBOperation = (payload, fakeResponse) => {
  console.log("payload: ", payload);
  console.log("fakeResponse: ", fakeResponse);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(fakeResponse);
    }, 3000);
  });
};
const RPCObserver = async (RPC_QUEUE_NAME, fakeResponse) => {
  const channel = await getChannel();

  await channel.assertQueue(RPC_QUEUE_NAME, {
    durable: false,
  });

  channel.prefetch(1);

  channel.consume(
    RPC_QUEUE_NAME,
    async (msg) => {
      if (msg.content) {
        //DB Operation
        const payload = JSON.parse(msg.content.toString());
        //const response = { fakeResponse, payload }; // call fake DB Operation
        const response = await expensiveDBOperation(payload, fakeResponse); // call fake DB Operation
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(response)),
          {
            correlationId: msg.properties.correlationId,
          }
        );
        channel.ack(msg);
      }
    },
    {
      noAck: false,
    }
  );
};

const requestData = async (RPC_QUEUE_NAME, payload, uuid) => {
  const channel = await getChannel();

  const q = await channel.assertQueue("", { exclusive: true });

  channel.sendToQueue(RPC_QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
    replyTo: q.queue,
    correlationId: uuid,
  });

  return new Promise((resolve, reject) => {
    //timeout  n

    const timeout = setTimeout(() => {
      channel.close();
      resolve("API could not fullfil the request");
    }, 8000);

    channel.consume(q.queue, (msg) => {
      if (msg.properties.correlationId === uuid) {
        resolve(JSON.parse(msg.content.toString()));
        clearTimeout(timeout);
      } else {
        reject("Data Not found");
      }
    });
  });
};

const RPCRequest = async (RPC_QUEUE_NAME, requestPayload) => {
  const uuid = uuid4(); // correlationId
  return await requestData(RPC_QUEUE_NAME, requestPayload, uuid);
};

module.exports = {
  getChannel,
  RPCObserver,
  RPCRequest,
};

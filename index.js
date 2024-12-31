const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const uri = process.env.DATABASE_URL;
const stripe = require("stripe")(
  "sk_test_51IeMHCDxOVqYVf88dO8p5pwi5yZBPcS8GIzPSfLVjjf5jaMsuCWnxWLnPHzCY0ZiRJgfslcsfQ2L2hs486z4KxDh000gewKyow"
);
const createToken = (user) => {
  const token = jwt.sign(
    {
      email: user.email,
    },
    "secret",
    { expiresIn: "7d" }
  );
  return token;
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const verify = jwt.verify(token, "secret");
  if (!verify?.email) {
    return res.send("You are not authorized");
  }
  req.user = verify?.email;
  next();
};
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const ShoeCollection = await client
      .db("FationShoeDB")
      .collection("ShoeCollection");
    const OrderCollection = await client
      .db("OrderDB")
      .collection("OrderCollection");
    const AdminCollection = await client
      .db("AdminDB")
      .collection("AdminCollection");
    const UserCollection = await client
      .db("UserDB")
      .collection("UserCollection");
    const ReviewCollection = await client.db("UserDB").collection("UserReview");
    const MessageCollection = await client
      .db("MessageDB")
      .collection("UserMessage");

    app.get("/product", async (req, res) => {
      const { searchValue, searchCategory } = req.query;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const queryByName = {
        pd_name: { $regex: `${searchValue}`, $options: "i" },
        isDeleted:false
      };
      const queryByCategory = {
        pd_category: { $regex: `${searchValue}`, $options: "i" },
        isDeleted:false
      };

      if (searchCategory == undefined && searchValue == undefined) {
        const result = await ShoeCollection.find({isDeleted:false})
          .skip(size * page)
          .limit(size)
          .toArray();

          const totalItems=await ShoeCollection.countDocuments()
          const totalPages=Math.ceil(totalItems/size)
      return  res.send({
          data:result,
          currentPage:page,
          totalPages:totalPages,
          totalItems:totalItems
        });
      }
      if (searchCategory !== "undefined") {
        const result = await ShoeCollection.find(queryByCategory)
          .skip(size * page)
          .limit(size)
          .toArray();
          const totalItems=await ShoeCollection.countDocuments(queryByCategory)
          const totalPages=Math.ceil(totalItems/size)
      return  res.send({
          data:result,
          currentPage:page,
          totalPages:totalPages,
          totalItems:totalItems
        });
      }

      const result = await ShoeCollection.find(queryByName)
        .skip(size * page)
        .limit(size)
        .toArray();
        const totalItems=await ShoeCollection.countDocuments(queryByCategory)
        const totalPages=Math.ceil(totalItems/size)
   return  res.send({
        data:result,
        currentPage:page,
        totalPages:totalPages,
        totalItems:totalItems
      });
    });
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const result = await ShoeCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.post("/auth/register", async (req, res) => {
      const data = await req.body;
      const result = await ShoeCollection.insertOne(data);
      res.send(result);
    });

    app.patch("/product/:id", async (req, res) => {
      const UpdateData = req.body;
      const id = req.params.id;

      const result = await ShoeCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: UpdateData }
      );
      res.send(result);
    });
    app.post("/add_product", async (req, res) => {
      const data = await req.body;
      console.log(data);
      const result = await ShoeCollection.insertOne(data);
      res.send(result);
    });
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const result = await ShoeCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // app.get('/orderStatus/:email',async(req,res)=>{
    //   const email=req.params.email
    //   const result = await OrderCollection.u
    // })
    app.get("/order", async (req, res) => {
      const email = req.params.email;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await OrderCollection.find({isDeleted:false})
        .skip(size * page)
        .limit(size)
        .toArray();
        const totalItems=await OrderCollection.countDocuments()
        const totalPages=Math.ceil(totalItems/size)
       return res.send({
          data:result,
          currentPage:page,
          totalPages:totalPages,
          totalItems:totalItems
        });
    });
    app.delete("/cancel-order/:id", async (req, res) => {
      const id = req.params.id;
      const result = await OrderCollection.deleteOne({_id:ObjectId(id)})
      res.send(result);
    });
    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await OrderCollection.find({ email: email })
        .skip(page * size)
        .limit(size)
        .toArray();
        const totalItems=await OrderCollection.countDocuments()
        const totalPages=Math.ceil(totalItems/size)
     return res.send({
        data:result,
        currentPage:page,
        totalPages:totalPages,
        totalItems:totalItems
      });


    });
    app.get("/review", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await ReviewCollection.find({isDeleted:false,isServiceReview:true})
      .skip(page * size)
      .limit(size)
      .toArray();
      const totalItems=await ReviewCollection.countDocuments()
      const totalPages=Math.ceil(totalItems/size)
   return res.send({
      data:result,
      currentPage:page,
      totalPages:totalPages,
      totalItems:totalItems
    });


    });
    app.get("/review/:email", async (req, res) => {
      const email = req.params.email;
      const result = await ReviewCollection.find({ email: email }).toArray();
      res.send(result);
    });
    app.get("/pd_review/:pd_id", async (req, res) => {
      const pd_id = req.params.pd_id;
      console.log(req.params);
      const result = await ReviewCollection.find({ pd_id: pd_id }).toArray();
      res.send(result);
    });
    app.delete("/review/:id", async (req, res) => {
      const result = await ReviewCollection.deleteOne(
        { _id: new ObjectId(id) }
      );
      res.send(result);
    });
    app.patch("/review/:id", async (req, res) => {
      const result = await ReviewCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isDeleted: req.body.isDeleted } }
      );
      res.send(result);
    });
    app.patch("/order/:id", async (req, res) => {
      const UpdateData = req.body;
      const id = req.params.email;
      const result = await OrderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isDeleted: UpdateData.isDeleted } }
      );
      console.log(result);
      res.send(result);
    });
    app.patch("/order/:email", async (req, res) => {
      const UpdateData = req.body;
      const id = req.params.email;
      const result = await OrderCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: UpdateData.status } }
      );
      console.log(result);
      res.send(result);
    });
    // Review Post
    app.post("/add_review", async (req, res) => {
      const data = await req.body;
      console.log(data);
      const result = await ReviewCollection.insertOne({...data, isDeleted:false});
      res.send(result);
    });
    // Get Message
    app.get("/message", async (req, res) => {
      const result = await MessageCollection.find().toArray();
      res.send(result);
    });
    // Send Message
    app.post("/message", async (req, res) => {
      const data = await req.body;
      console.log(data);
      const result = await MessageCollection.insertOne({
        ...data,
        status: "pending",
      });
      res.send(result);
    });
    app.patch("/message/:id", async (req, res) => {
      const UpdateData = req.body;
      const id = req.params.id;
      const result = await MessageCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: UpdateData.status } }
      );
      console.log(result);
      res.send(result);
    });
    // Order Post
    app.post("/add_order", async (req, res) => {
      const data = await req.body;

      const result = await OrderCollection.insertOne({...data, isDeleted:false});
      res.send(result);
    });

    // Payment with strip

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // User Program
    app.get("/user", async (req, res) => {
      const result = await UserCollection.find().toArray();
      res.send(result);
    });
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await UserCollection.findOne({ email: email });

      res.send(result);
    });
    app.get("/admin", async (req, res) => {
      const email = req.params.id;
      const result = await AdminCollection.find().toArray();

      res.send(result);
    });
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const result = await AdminCollection.findOne({ email: email });
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    });

    // new Admin Create
    app.post("/admin", async (req, res) => {
      const adminData = req.body;
      const result = await AdminCollection.insertMany(adminData);
      res.send(result);
    });
    app.post("/add_user", async (req, res) => {
      const newUser = req.body;

      const token = createToken(newUser);

      const isExistUser = await UserCollection.findOne({
        email: newUser?.email,
      });
      if (isExistUser) {
        return res.send({
          status: "200",
          message: "Successfully LoggedIn",
          token,
        });
      }
      await UserCollection.insertOne(newUser);
      return res.send({ token });
    });
    app.patch("/user/:email", async (req, res) => {
      const UpdateData = req.body;
      const email = req.params.email;

      const result = await UserCollection.updateOne(
        { email: email },
        { $set: UpdateData }
      );

      res.send(result);
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fation is Run");
});

app.listen(port, () => {
  console.log(`Fation Shoe is run ${port}`);
});

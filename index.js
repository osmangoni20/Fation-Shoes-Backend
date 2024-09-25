const express=require("express");
const cors=require('cors');
const app=express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json())
const port=3000;
const jwt=require('jsonwebtoken');
const uri = "mongodb+srv://osmangoni0827:osman01goni@server1.oquauxc.mongodb.net/?retryWrites=true&w=majority&appName=Server1";
const stripe=require("stripe")('sk_test_51IeMHCDxOVqYVf88dO8p5pwi5yZBPcS8GIzPSfLVjjf5jaMsuCWnxWLnPHzCY0ZiRJgfslcsfQ2L2hs486z4KxDh000gewKyow')
const createToken=(user)=>{
  const token= jwt.sign({
    email:user.email
  }, 'secret', { expiresIn: '7d' });
  return token;
}

const verifyToken=(req,res,next)=>{
  const token=req.headers.authorization?.split(" ")[1];
  const verify=jwt.verify(token,'secret')
  if(!verify?.email){
   return res.send("You are not authorized")
  }
  req.user=verify?.email;
  next()
}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const database= await client.db("FationShoeDB")
    const OrderDB=await client.db("OrderDB")
    const UserDB=await client.db("UserDB")
    const AdminDB=await client.db("AdminDB")

    const ShoeCollection=await database.collection("ShoeCollection")
    const OrderCollection=await OrderDB.collection("ShoeCollection")
    const AdminCollection=await AdminDB.collection("AdminCollection")
    const UserCollection=await UserDB.collection("UserCollection");
    const ReviewCollection=await UserDB.collection("UserReview")
    app.get('/product', async(req,res)=>{
       const {searchValue,searchCategory}=req.query;
       
       const queryByName={
        pd_name:{$regex:searchValue, $options:'i'}
       }
       const queryByCategory={
        pd_category:{$regex:searchValue, $options:'i'}
       }
       if(searchCategory){

        const result= await ShoeCollection.find(queryByCategory).toArray();
       return res.send(result);
       }
       else if(searchValue){
      const result= await ShoeCollection.find(queryByName).toArray();
       return res.send(result);
       }
        const result= await ShoeCollection.find().toArray();
       return res.send(result);
    })
    app.get('/product/:id', async(req,res)=>{
        const id=req.params.id
        const result= await ShoeCollection.findOne({_id: new ObjectId(id)});
        res.send(result);
    })
    app.post('/auth/register', async(req,res)=>{
        const data= await req.body;
        console.log(data)
        const result= await ShoeCollection.insertOne(data);
        res.send(result);
    })
    
    app.patch('/product/:id', async(req,res)=>{
        const UpdateData=req.body;
        const id= req.params.id;
     
        const result= await ShoeCollection.updateOne({_id: new ObjectId(id)},
        {$set:UpdateData});
        res.send(result);
    })
    app.delete('/product/:id', async(req,res)=>{
        const id=req.params.id
        const result= await ShoeCollection.deleteOne({_id: new ObjectId(id)});
        res.send(result);
    })
    // app.get('/orderStatus/:email',async(req,res)=>{
    //   const email=req.params.email
    //   const result = await OrderCollection.u
    // })
    app.get('/order', async(req,res)=>{
      const email=req.params.email
      const result= await OrderCollection.find().toArray();
      res.send(result);
  })
    app.get('/order/:email', async(req,res)=>{
      const email=req.params.email
      const result= await OrderCollection.find({email: email}).toArray();
      res.send(result);
  })

  // Review Post
  app.post('/add_review', async(req,res)=>{
    const data= await req.body;
    console.log(data)
    const result= await ReviewCollection.insertOne(data);
    res.send(result);
})
// Order Post
    app.post('/add_order', async(req,res)=>{
      const data= await req.body;
      console.log(data)
      const result= await OrderCollection.insertOne(data);
      res.send(result);
  })

  // Payment with strip

  app.post('/create-payment-intent',async(req,res)=>{
    const{price}=req.body
    console.log(price) 
    const amount=parseInt(price*100)
    const paymentIntent =await stripe.paymentIntents.create({
      amount:amount,
      currency: "usd",
      payment_method_types:['card']
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.

    })

    res.send({
      clientSecret:paymentIntent.client_secret
    })
  })

    // User Program
    app.get('/user', async(req,res)=>{
      const result= await UserCollection.find().toArray();
      res.send(result);
  })
  app.get('/user/:email', async(req,res)=>{
    const email=req.params.email
    const result= await UserCollection.findOne({email: email});
    res.send(result);
   
})
app.get('/admin', async(req,res)=>{
  const email=req.params.id
  const result= await AdminCollection.find().toArray();
  console.log(result)
  res.send(result);
})
  app.get('/admin/:email', async (req,res)=>{
    const email=req.params.email
    const result=await AdminCollection.findOne({email:email})
    res.send(result)
  })

  // new Admin Create
  app.post('/admin', async(req,res)=>{
    const adminData=req.body
    const result= await AdminCollection.insertMany(adminData);
    res.send(result);
  })
    app.post('/add_user', async(req,res)=>{
      const newUser=req.body;
     
      const token=createToken(newUser);
    
      const isExistUser= await UserCollection.findOne({email:newUser?.email})
      if(isExistUser){
        return res.send({
          status:"200",
          message:"Successfully LoggedIn",
          token
        })
      }
     await UserCollection.insertOne(newUser);
    return res.send({token})
    })
    app.patch('/user/:email',verifyToken, async(req,res)=>{
      const UpdateData=req.body;
      const email= req.params.email;
      
      const result= await UserCollection.updateOne({email:email},
      {$set:UpdateData});
    
      res.send(result);
  })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.log);


app.listen(port,()=>{
        console.log("Server Run in port ",port)
})
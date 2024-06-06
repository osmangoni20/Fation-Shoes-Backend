const express=require("express");
const cors=require('cors');
const app=express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json())
const port=3000;
const jwt=require('jsonwebtoken');
const uri = "mongodb+srv://osmangoni0827:osman01goni@server1.oquauxc.mongodb.net/?retryWrites=true&w=majority&appName=Server1";

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
    const ShoeCollection=await database.collection("ShoeCollection")
    const UserCollection=await database.collection("UserCollection");
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
    app.post('/add_product', async(req,res)=>{
      
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
    app.get('/user', async(req,res)=>{
      const email=req.params.id
      const result= await UserCollection.findOne({email: email});
      res.send(result);
  })
  app.get('/user/:email', async(req,res)=>{
    const email=req.params.email
    const result= await UserCollection.findOne({email: email});
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
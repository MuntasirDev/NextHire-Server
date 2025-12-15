const express = require ('express')
const cors = require ('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express ();
const port = process.env.PORT || 3000;
require ('dotenv').config()

// NextHire = NextHire_Admin pass= kCa0kpdCz031ibZP


// Mongo_Connect



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@simple-crud-server.a0arf8b.mongodb.net/?appName=simple-crud-server`;

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
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



//middleweare

app.use(cors());
app.use(express.json());

app.get ( '/', (req,res) => {
    res.send('Next Hire on the verge!!')
})

app.listen(port, ()=>{
    console.log(`Next Hire running on port ${port}`)
})


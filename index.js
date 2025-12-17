const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

// 1. মিডলওয়্যারগুলো অবশ্যই রাউটের উপরে থাকতে হবে
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@simple-crud-server.a0arf8b.mongodb.net/?appName=simple-crud-server`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect(); // চাইলে কানেক্ট করতে পারেন

    const jobsCollection = client.db("NextHire").collection("Jobs");
    const applicationCollection = client.db("NextHire").collection("applications");

    // --- Jobs API ---

    // ১. এই রাউটেই আপনার সমস্যা ছিল
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {}; // 'query' অবজেক্টটি ডিফাইন করা হলো

      if (email) {
        // ফ্রন্টএন্ড থেকে পাঠানো hr_email এর সাথে ডাটাবেজের ফিল্ড মিলতে হবে
        query.hr_email = email; 
      }

      // find() এর ভেতরে query পাঠাতে হবে
      const cursor = jobsCollection.find(query); 
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post('/jobs', async(req,res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    // --- Job Application Related Api ---

    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = { applicant: email };
      const result = await applicationCollection.find(query).toArray();

      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobsCollection.findOne(jobQuery);
        if (job) {
          application.company = job.company;
          application.title = job.jobTitle; // ফ্রন্টএন্ডে jobTitle ব্যবহার করেছেন
          application.company_logo = job.company_logo;
        }
      }
      res.send(result);
    });

    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");

  } finally {
    // client.close() করার দরকার নেই রান টাইম এ
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Next Hire Server is Running!!");
});

app.listen(port, () => {
  console.log(`Next Hire running on port ${port}`);
});
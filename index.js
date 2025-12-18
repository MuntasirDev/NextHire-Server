const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

// Middleware
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
    const jobsCollection = client.db("NextHire").collection("Jobs");
    const applicationCollection = client.db("NextHire").collection("applications");

    // --- Jobs API ---
    // সকল জব অথবা নির্দিষ্ট HR-এর পোস্ট করা জব পাওয়ার জন্য
    app.get("/jobs", async (req, res) => {
      const email = req.query.email; //
      let query = {};
      if (email) {
        query.hr_email = email; //
      }
      const result = await jobsCollection.find(query).toArray();

      // প্রতিটি জবের জন্য ডাইনামিকভাবে অ্যাপ্লিকেশন কাউন্ট করা
      for (const job of result) {
        const countQuery = { jobId: job._id.toString() }; // ডাটাবেজে jobId স্ট্রিং হিসেবে থাকে
        const applicationCount = await applicationCollection.countDocuments(countQuery);
        job.applicationCount = applicationCount; //
      }
      res.send(result);
    });

    // নির্দিষ্ট একটি জবের ডিটেইলস দেখার জন্য
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; //
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // নতুন জব পোস্ট করার জন্য
    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob); //
      res.send(result);
    });

    // --- Job Application Related Api ---

    // ১. নির্দিষ্ট একটি জবে কতজন আবেদন করেছে তা দেখার জন্য (HR View)
    app.get("/applications/job/:job_id", async (req, res) => {
      try {
        const job_id = req.params.job_id.trim(); // URL থেকে আসা আইডি
        
        // jobId ফিল্ডটি স্ট্রিং এবং ObjectId উভয় ফরম্যাটেই চেক করা নিরাপদ
        const query = {
          $or: [
            { jobId: job_id },
            { jobId: new ObjectId(job_id) }
          ]
        };
        const result = await applicationCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching applications" });
      }
    });

    // ২. একজন আবেদনকারী (Candidate) নিজে কোথায় কোথায় অ্যাপ্লাই করেছেন (My Applications)
    app.get("/applications", async (req, res) => {
      const email = req.query.email; //
      const query = { applicant: email }; //
      const result = await applicationCollection.find(query).toArray();

      // আবেদনের সাথে জবের তথ্য (Title, Company) যোগ করা
      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobsCollection.findOne(jobQuery);
        if (job) {
          application.company = job.company; //
          application.title = job.title || job.jobTitle; //
          application.company_logo = job.company_logo; //
        }
      }
      res.send(result);
    });

    // ৩. জবে আবেদন সাবমিট করার জন্য
    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application); //
      res.send(result);
    });

    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error(error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Next Hire Server is Running!!");
});

app.listen(port, () => {
  console.log(`Next Hire running on port ${port}`);
});
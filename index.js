const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken")
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
    const db = client.db("NextHire");
    const jobsCollection = db.collection("Jobs");
    const applicationCollection = db.collection("applications");



  //  Using JWT related APIS


app.post('/jwt', async (req,res)=>{
  const {email} = req.body;
  const user = {email}
  const token = jwt.sign(user, 'secret', {expiresIn: '1h'});
  res.send ({token})
})





    // --- Jobs API ---
    
    // ১. সকল জব অথবা নির্দিষ্ট HR-এর পোস্ট করা জব পাওয়ার জন্য (কাউন্টসহ)
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = email ? { hr_email: email } : {};

      const jobs = await jobsCollection.find(query).toArray();

      // প্রতিটি জবের জন্য অ্যাপ্লিকেশন সংখ্যা যোগ করা
      for (const job of jobs) {
        const count = await applicationCollection.countDocuments({ 
            jobId: job._id.toString() 
        });
        job.applicationCount = count;
      }
      res.send(jobs);
    });

    // ২. নির্দিষ্ট একটি জবের ডিটেইলস
    app.get("/jobs/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // ৩. নতুন জব পোস্ট করা
    app.post('/jobs', async (req, res) => {
      const result = await jobsCollection.insertOne(req.body);
      res.send(result);
    });


    // --- Application API ---

    // ৪. জবে আবেদন সাবমিট করা
    app.post("/applications", async (req, res) => {
      const result = await applicationCollection.insertOne(req.body);
      res.send(result);
    });

    // ৫. নির্দিষ্ট জবের সকল আবেদন দেখা (HR-এর জন্য)
    app.get("/applications/job/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      const query = {
        $or: [{ jobId: jobId }, { jobId: new ObjectId(jobId) }]
      };
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

    // ৬. ইউজারের নিজের করা সকল আবেদন দেখা (Candidate-এর জন্য)
    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      const applications = await applicationCollection.find({ applicant: email }).toArray();

      // আবেদনের সাথে জবের প্রয়োজনীয় তথ্য যোগ করা
      for (const appTask of applications) {
        const job = await jobsCollection.findOne({ _id: new ObjectId(appTask.jobId) });
        if (job) {
          appTask.company = job.company;
          appTask.title = job.title || job.jobTitle;
          appTask.company_logo = job.company_logo;
        }
      }
      res.send(applications);
    });

    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Connection error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Next Hire Server is Running!!"));
app.listen(port, () => console.log(`Next Hire running on port ${port}`));
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// --- 1. Middleware Configuration ---
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://nexthire-38482.web.app'
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());

// --- Database Connection ---
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@simple-crud-server.a0arf8b.mongodb.net/?appName=simple-crud-server`;
const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
    try {
        const db = client.db("NextHire");
        const jobsCollection = db.collection("Jobs");
        const applicationCollection = db.collection("applications");

        // JWT Token API
        app.post('/jwt', async (req, res) => {
            const userData = req.body;
            const token = jwt.sign(userData, process.env.JWT_ACCCESS_SECRET, { expiresIn: '7d' });
            res.cookie('token', token, {
                httpOnly: true, secure: true, sameSite: 'none', path: '/' 
            }).send({ success: true });
        });

        // Logout
        app.post('/logout', (req, res) => {
            res.clearCookie('token', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none', path: '/' })
               .send({ success: true });
        });

        // Get All Jobs
        app.get("/jobs", async (req, res) => {
            const email = req.query.email;
            let query = email ? { hr_email: email } : {};
            const jobs = await jobsCollection.find(query).toArray();
            res.send(jobs);
        });

        // Single Job Details
        app.get("/jobs/:id", async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });
                const result = await jobsCollection.findOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (err) { res.status(500).send(err); }
        });

        console.log("Connected to MongoDB!");
    } finally { }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Server is Running!!"));
app.listen(port, () => console.log(`Running on port ${port}`));
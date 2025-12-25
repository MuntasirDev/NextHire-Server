const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// --- ১. Logger Middleware ---
const logger = (req, res, next) => {
    console.log('Log Info:', req.method, req.url);
    next();
};

// --- ২. Middleware Configuration ---
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://nexthire-38482.web.app'
    ],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(logger);

// --- ৩.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', true);
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@simple-crud-server.a0arf8b.mongodb.net/?appName=simple-crud-server`;
const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

let jobsCollection, applicationCollection;

async function dbConnect() {
    try {
        const db = client.db("NextHire");
        jobsCollection = db.collection("Jobs");
        applicationCollection = db.collection("applications");
        console.log("Connected to MongoDB Successfully!");
    } catch (error) {
        console.error("DB Connection Error:", error);
    }
}
dbConnect();

// --- ৪. verifyToken ---
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) return res.status(401).send({ message: 'Unauthorized access' });

    jwt.verify(token, process.env.JWT_ACCCESS_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ message: 'Unauthorized access' });
        req.user = decoded;
        next();
    });
}

// --- ৫. API Routes ---

app.get("/", (req, res) => res.send("Next Hire Server is Running!!"));

// JWT Generation
app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.JWT_ACCCESS_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, 
        sameSite: 'none'
    })
    .send({ success: true });
});

// Logout
app.post('/logout', (req, res) => {
    res.clearCookie('token', { 
        maxAge: 0, 
        secure: true, 
        sameSite: 'none' 
    }).send({ success: true });
});

// Jobs Routes
app.get("/jobs", async (req, res) => {
    const email = req.query.email;
    let query = email ? { hr_email: email } : {};
    const jobs = await jobsCollection.find(query).toArray();
    res.send(jobs);
});

app.get("/jobs/:id", async (req, res) => {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).send({ message: "Invalid ID" });
    const result = await jobsCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
});

app.post('/jobs', verifyToken, async (req, res) => {
    const result = await jobsCollection.insertOne(req.body);
    res.send(result);
});

app.get("/applications", verifyToken, async (req, res) => {
    const email = req.query.email;
    if (req.user.email !== email) return res.status(403).send({ message: 'Forbidden' });
    const result = await applicationCollection.find({ applicant: email }).toArray();
    res.send(result);
});

app.get("/applications/job/:job_id", verifyToken, async (req, res) => {
    const jobId = req.params.job_id;
    const query = { job_id: jobId }; 
    const result = await applicationCollection.find(query).toArray();
    res.send(result);
});

app.post("/applications", async (req, res) => {
    const result = await applicationCollection.insertOne(req.body);
    res.send(result);
});

// Error Handling
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message });
});

app.listen(port, () => console.log(`Server on ${port}`));
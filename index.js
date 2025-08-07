const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");

const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);
const app = express();
const port = process.env.PORT || 3000;

//middleware
//"http://localhost:5173"
app.use(
  cors({
    origin: ["https://bloodconnect-3e8aa.web.app","http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

const decodedKey = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decodedKey);

// const serviceAccount = require("./bloodconnect-firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.BloodConnect_DB_USER}:${process.env.BloodConnect_DB_PASS}@cluster0.nnagfsm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const db = client.db("BloodConnectDB"); // database name
    const usersCollection = db.collection("users");
    const donationRequestsCollection = db.collection("donationRequests");
    const blogsCollection = db.collection("blogs");
    const fundsCollection = db.collection("funds");

    /**
     * custom middlewares
     */

    const verifyFBToken = async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
      }

      // verify the token
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next();
      } catch (error) {
        return res.status(403).send({ message: "forbidden access" });
      }
    };

    /**
     * PUBLIC :: Search
     * GET /donors/search?blood_group=A+&district=Dhaka&upazila=Savar
     */

    app.get("/search", async (req, res) => {
      const { blood_group, district, upazila } = req.query;

      try {
        const donors = await usersCollection
          .find({
            user_role: { $in: ["donor", "volunteer"] },
            user_status: "active",
            user_blood_group: blood_group,
            user_district: district,
            user_upazila: upazila,
          })
          .toArray();

        res.send(donors);
      } catch (error) {
        //console.error('Search error:', error);
        res.status(500).send({ message: "Failed to search donors" });
      }
    });

    /**
     * PUBLIC :: public donation request
     * GET /public-donation-requests
     */

    app.get("/public-donation-requests", async (req, res) => {
      try {
        const pendingRequests = await donationRequestsCollection
          .find({
            donation_status: "pending",
          })
          .toArray();

        res.send(pendingRequests);
      } catch (error) {
        //console.error('Error fetching public donation requests:', error);
        res.status(500).send({ message: "Failed to load donation requests" });
      }
    });

    /**
     * PRIVATE
     * GET
     * donation-request/:id
     */

    app.get("/donation-requests/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;

      try {
        const donation = await donationRequestsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!donation) {
          return res
            .status(404)
            .send({ message: "Donation request not found" });
        }

        res.send(donation);
      } catch (error) {
        //console.error('Error fetching donation request:', error);
        res.status(500).send({ message: "Failed to get donation request" });
      }
    });

    /**
     * PRIVATE
     * GET
     * allUsers
     */

    app.get("/allUsers", verifyFBToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    /**
     * PRIVATE
     * GET
     * allUsers/status
     */

    app.get("/allUsers/status", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      try {
        const user = await usersCollection.findOne({ user_email: email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        res.send({ status: user.user_status });
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to retrieve user status", error });
      }
    });

    /**
     * PRIVATE
     * GET
     * allUsers/role
     */

    app.get("/allUsers/role", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      try {
        const user = await usersCollection.findOne({ user_email: email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        res.send({ role: user.user_role });
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to retrieve user role", error });
      }
    });

    /**
     * PUBLIC
     * POST
     * allUsers  register form
     */

    app.post("/allUsers", async (req, res) => {
      const newUser = req.body;
      //   console.log(newProduct);
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    /**
     * PRIVATE
     * PUT
     * allUsers/:id
     *
     * update a user
     */

    app.put("/allUsers/:id", verifyFBToken, async (req, res) => {
      const userId = req.params.id;
      const updateData = req.body;

      try {
        const filter = { _id: new ObjectId(userId) };
        const updateDoc = { $set: updateData };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to update user", error: err });
      }
    });

    /**
     * PRIVATE
     * PATCH
     * allUsers/role/:id
     *
     * update a user's role  By Admin
     */

    app.patch("/allUsers/role/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      const { user_role } = req.body;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { user_role } }
      );
      res.send(result);
    });

    /**
     * PRIVATE
     * PATCH
     * allUsers/status/:id
     *
     * update a user's status  By Admin
     */

    app.patch("/allUsers/status/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      const { user_status } = req.body;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { user_status } }
      );
      res.send(result);
    });

    /**
     * PRIVATE
     * Get
     * admin-donation-requests
     *
     */

    app.get("/admin-donation-requests", verifyFBToken, async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0; // 0 means return all
        const skip = (page - 1) * limit;

        const query = {}; // No filter for admin — get all
        const cursor = donationRequestsCollection
          .find(query)
          .sort({ created_at: -1 });

        const total = await donationRequestsCollection.countDocuments(query);

        const requests =
          limit > 0
            ? await cursor.skip(skip).limit(limit).toArray()
            : await cursor.toArray();

        res.send({ requests, total });
      } catch (error) {
        //console.error('Error fetching donation requests:', error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    /**
     * PRIVATE
     * Get
     * donation-requests
     *
     */

    app.get("/donation-requests", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      try {
        if (!email) {
          return res
            .status(400)
            .send({ message: "Email is required in query." });
        }
        const requests = await donationRequestsCollection
          .find({ requester_email: email })
          .sort({ created_at: -1 }) // Optional: newest first
          .toArray();
        res.send(requests);
      } catch (error) {
        //console.error('Error getting donation requests:', error);
        res.status(500).send({ message: "Internal Server Error", error });
      }
    });

    /**
     * PRIVATE
     * Get
     * donation-requests/:id
     * Get a single donation request by ID
     */

    app.get("/donation-requests/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;

      try {
        const request = await donationRequestsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!request) {
          return res
            .status(404)
            .send({ message: "Donation request not found" });
        }

        res.send(request);
      } catch (error) {
        //console.error('Error fetching donation request:', error);
        res.status(500).send({ message: "Internal server error", error });
      }
    });

    /**
     * PRIVATE
     * POST
     * donation-requests
     * Create a donation request
     */

    app.post("/donation-requests", verifyFBToken, async (req, res) => {
      const requestData = req.body;
      const requesterEmail = requestData.requester_email;

      try {
        const user = await usersCollection.findOne({
          user_email: requesterEmail,
        });

        if (!user) {
          return res.status(404).send({ message: "Requester not found" });
        }

        if (user.user_status !== "active") {
          return res
            .status(403)
            .send({ message: "Blocked users cannot create requests" });
        }

        requestData.donation_status = "pending";
        requestData.created_at = new Date().toISOString();

        const result = await donationRequestsCollection.insertOne(requestData);
        res.send({ insertedId: result.insertedId });
      } catch (err) {
        res
          .status(500)
          .send({ message: "Failed to create request", error: err });
      }
    });

    /**
     * PRIVATE
     * PUT
     * donation-requests/:id
     * PUT API to avoid _id mutation error
     */

    app.put("/donation-requests/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };

      const updatedDonation = req.body;

      // Remove _id if present
      if (updatedDonation._id) {
        delete updatedDonation._id;
      }

      const updatedDoc = {
        $set: updatedDonation,
      };

      try {
        const result = await donationRequestsCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(result);
      } catch (error) {
        //console.error('Error updating donation request:', error);
        res
          .status(500)
          .send({ message: "Failed to update donation request", error });
      }
    });

    /**
     * PRIVATE
     * PATCH
     * donation-requests/:id
     *
     */

    app.patch("/donation-requests/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      const { donation_status } = req.body;

      try {
        const result = await donationRequestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { donation_status } }
        );

        if (result.modifiedCount === 1) {
          res.send({ message: "Donation status updated successfully" });
        } else {
          res
            .status(404)
            .send({ message: "Request not found or already updated" });
        }
      } catch (error) {
        //console.error('Failed to update donation status:', error);
        res
          .status(500)
          .send({ message: "Failed to update donation status", error });
      }
    });

    /**
     * PRIVATE
     * DELETE
     * donation-requests/:id
     * Delete donation request by ID
     */

    app.delete("/donation-requests/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;

      try {
        const result = await donationRequestsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 1) {
          res.send({ message: "Donation request deleted successfully" });
        } else {
          res.status(404).send({ message: "Donation request not found" });
        }
      } catch (error) {
        //console.error('Failed to delete donation request:', error);
        res
          .status(500)
          .send({ message: "Failed to delete donation request", error });
      }
    });

    /**
     * PRIVATE
     * POST
     * addBlogs
     * /blogs → Add new blog
     */

    app.post("/addBlogs", verifyFBToken, async (req, res) => {
      try {
        const blog = req.body;

        if (!blog.title || !blog.thumbnail || !blog.content) {
          return res.status(400).send({ message: "Missing required fields" });
        }

        blog.status = "draft"; // default
        blog.created_at = new Date();

        const result = await blogsCollection.insertOne(blog);
        res.send({ insertedId: result.insertedId });
      } catch (error) {
        //console.error('Error adding blog:', error);
        res.status(500).send({ message: "Failed to add blog", error });
      }
    });

    /**
     * PUBLIC
     * GET
     * publicBlogs
     * Get All Blogs (for public viewing, only published)
     */

    app.get("/publicBlogs", async (req, res) => {
      try {
        const blogs = await blogsCollection
          .find({ status: "published" })
          .toArray();
        res.send(blogs);
      } catch (error) {
        //console.error('Error fetching blogs:', error);
        res.status(500).send({ message: "Failed to fetch blogs" });
      }
    });

    /**
     * PUBLIC
     * GET
     * /publicBlogs/:id
     * Get Blog Details by ID
     */

    app.get("/publicBlogs/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });
        if (!blog) return res.status(404).send({ message: "Blog not found" });
        res.send(blog);
      } catch (error) {
        //console.error('Error fetching blog:', error);
        res.status(500).send({ message: "Failed to fetch blog" });
      }
    });

    /**
     * PRIVATE
     * GET
     * /blogs
     *  ADMIN view all blogs including  UNPUBLISH Blogs
     */

    app.get("/blogs", verifyFBToken, async (req, res) => {
      try {
        const blogs = await blogsCollection.find().toArray();
        res.send(blogs);
      } catch (error) {
        //console.error('Error fetching blogs:', error);
        res.status(500).send({ message: "Failed to fetch blogs" });
      }
    });

    /**
     * PRIVATE
     * GET
     * /blogs
     *  ADMIN :: Get Blog Details by ID
     */

    app.get("/blogs/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      try {
        const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });
        if (!blog) return res.status(404).send({ message: "Blog not found" });
        res.send(blog);
      } catch (error) {
        //console.error('Error fetching blog:', error);
        res.status(500).send({ message: "Failed to fetch blog" });
      }
    });

    /**
     * PRIVATE
     * PATCH
     * /admin/blogs/:id
     *  Update blog status (publish/unpublish)
     */

    app.patch("/admin/blogs/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      if (!["draft", "published"].includes(status)) {
        return res.status(400).send({ message: "Invalid status" });
      }

      try {
        const result = await blogsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        res.send(result);
      } catch (err) {
        //console.error('Failed to update blog status:', err);
        res.status(500).send({ message: "Failed to update blog status" });
      }
    });

    /**
     * PRIVATE
     * DELETE
     * /admin/blogs/:id
     *  Delete blog
     */

    app.delete("/admin/blogs/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      try {
        const result = await blogsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        //console.error('Failed to delete blog:', err);
        res.status(500).send({ message: "Failed to delete blog" });
      }
    });

    /**
     * PRIVATE
     * PUT
     * /admin/blogs/:id
     *  Edit blog (update content)
     */

    app.put("/admin/blogs/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      const { title, thumbnail, content } = req.body;

      try {
        const result = await blogsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { title, thumbnail, content } }
        );
        res.send(result);
      } catch (err) {
        //console.error('Failed to update blog:', err);
        res.status(500).send({ message: "Failed to update blog" });
      }
    });

    /**
     * PRIVATE
     * GET
     * /funds
     *
     */

    app.get("/funds",verifyFBToken, async (req, res) => {
      try {
        const funds = await fundsCollection
          .find()
          .sort({ paid_at: -1 })
          .toArray();
        res.send(funds);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch funds", error });
      }
    });

    /**
     * PRIVATE
     * POST
     * /funds
     *
     */

    app.post("/funds",verifyFBToken, async (req, res) => {
      try {
        const { name, email, amount, paymentMethod, transactionId } = req.body;

        const paymentDoc = {
          name,
          email,
          amount,
          paymentMethod,
          transactionId,
          paid_at_string: new Date().toISOString(),
          paid_at: new Date(),
        };

        const paymentResult = await fundsCollection.insertOne(paymentDoc);

        res.status(201).send({
          message: "Payment recorded and parcel marked as paid",
          insertedId: paymentResult.insertedId,
        });
      } catch (error) {
        //console.error('Payment processing failed:', error);
        res.status(500).send({ message: "Failed to record payment" });
      }
    });

    /**
     * PRIVATE
     * POST
     * /create-payment-intent
     *
     * 
     * Payment intent
     */

    app.post("/create-payment-intent",verifyFBToken, async (req, res) => {
      const amountInCents = req.body.amountInCents;
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("BloodConnect is running !");
});

app.listen(port, () => {
  console.log(`BloodConnect server is running in port ${port}`);
});

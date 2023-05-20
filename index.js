const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// Middleware:
app.use(cors());
app.use(express.json());

// MongoDB Connection:
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zw8zgdm.mongodb.net/?retryWrites=true&w=majority`;

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



        const toyCollection = client.db('zoomieToys').collection('toys');

        // Get all toys:
        app.get('/toys', async (req, res) => {
            const searchQuery = req.query.search || ''; // Get search query from request query parameter
            const regex = new RegExp(searchQuery, 'i'); // Create case-insensitive regular expression
            const query = searchQuery ? { toyName: regex } : {}; // Create query object with regex if search query exists

            const cursor = toyCollection.find(query).sort({ _id: -1 }).limit(20); // Limit results to 20 by default
            const toys = await cursor.toArray();
            res.send(toys);
        });

        // Get category wise toys:
        app.get('/toys/:category', async (req, res) => {
            const category = req.params.category;
            const query = { subCategory: category };
            const cursor = toyCollection.find(query).sort({ _id: -1 }).limit(3); // Sort by _id in descending order (latest first)
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get Toy Details by ID:
        app.get('/toy/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await toyCollection.findOne(filter);
            res.send(result);
        })

        // Add a new Toy:
        app.post('/addToy', async (req, res) => {
            const data = req.body;
            const result = await toyCollection.insertOne(data);
            res.send(result);
        })

        // Get toy by user enmail:
        app.get('/myToys', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { sellerEmail: req.query.email }
            }
            const result = await toyCollection.find(query).limit(20).toArray();
            res.send(result);
        })

        // Delete toy by id:
        app.delete('/myToy/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.deleteOne(query);
            res.send(result);
        })

       
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Zoomie Toys is running");
})

app.listen(port, () => {
    console.log(`Zoomie Toys server is running on port: ${port}`);
})
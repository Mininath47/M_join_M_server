const express = require("express");
const cors = require("cors");
const mongodb = require('mongodb').MongoClient;
const mysql = require("mysql");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const conString = process.env.MongoUrl;
const Port = process.env.PORT || 4000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));

// MongoDB Routes

app.post('/user', (req, res) => {
    mongodb.connect(conString).then((object) => {
        const user = {
            userid: req.body.userid,
            img: req.body.img,
            title: req.body.title,
            price: req.body.price,
            descri: req.body.descri,
            que: req.body.que
            
        }
        const database = object.db('decent');
        database.collection('user').insertOne(user).then(document => {
            res.send('Add Product Record One...');
            res.end();
        });
    });
});

app.post('/register', (req, res) => {
    mongodb.connect(conString).then((object) => {
        const user = {
            userid: req.body.userid,
            mobile: req.body.mobile,
            age : req.body.age,
            email: req.body.email,
            password: req.body.password,
          
        }
        const database = object.db('decent');
        database.collection('login').insertOne(user).then(document => {
            res.send(document);
            res.end();
        })
    })
})

app.get('/login', (req, res) => {
    mongodb.connect(conString).then((object) => {
        const database = object.db('decent');
        database.collection('login').find().toArray().then((document) => {
            res.send(document);
            res.end();
        });
    });
});

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASES,
    port: process.env.PORTT || 3306,
    connectTimeout: 1000,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
    console.log("DB connected...");
});

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Save the image with its original name
    },
});
const upload = multer({ storage: storage });

// Upload Image Route
app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("Received File:", req.file);
    console.log("Received Body:", req.body);

    const imagePath = `/images/${req.file.filename}`;
    const { category, title, price, descri, que } = req.body;
    const originalImageName = req.file.originalname;  // Store original file name

    const sql =
        `INSERT INTO ${category} ( img , title, price, descri, que) VALUES (  ?, ?, ?, ?, ?)`;
    db.query(sql, [ imagePath,  title, price, descri, que], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to upload image" });

        res.json({ message: "Image uploaded successfully", id: result.insertId, path: imagePath, originalName: originalImageName });
    });
});

// Get All Images
app.get("/image", (req, res) => {
    db.query("SELECT * FROM image", (err, result) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        res.send(result);
    });
});

// Update Image Route
app.put("/update/:id", upload.single("image"), (req, res) => {
    const { id } = req.params;
    const { category, title, price, descri, que } = req.body;

    db.query("SELECT img  FROM image WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database query failed" });

        if (result.length > 0) {
            const oldPath = result[0].path;
            const oldOriginalName = result[0].original_name;
            const newImagePath = req.file ? `/images/${req.file.filename}` : oldPath;
            const newOriginalName = req.file ? req.file.originalname : oldOriginalName;

            const sql = "UPDATE image SET category=?, path=?, original_name=?, title=?, price=?, descri=?, que=? WHERE id=?";
            db.query(sql, [category, newImagePath, newOriginalName, title, price, descri, que, id], (err) => {
                if (err) return res.status(500).json({ error: "Failed to update image" });

                // Delete old image if a new one is uploaded
                if (req.file && fs.existsSync(path.join(__dirname, oldPath))) {
                    fs.unlinkSync(path.join(__dirname, oldPath)); // Delete old image
                }

                res.json({ message: "Image updated successfully", path: newImagePath, originalName: newOriginalName });
            });
        } else {
            res.status(404).json({ message: "Image not found" });
        }
    });
});



// Delete Image Route
app.delete("/delete/:id", (req, res) => {
    const { id } = req.params;

    db.query("SELECT path, original_name FROM image WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database query failed" });

        if (result.length > 0) {
            const imagePath = result[0].path;

            db.query("DELETE FROM image WHERE id = ?", [id], (err) => {
                if (err) return res.status(500).json({ error: "Failed to delete image" });

                // Delete image file from the server
                if (fs.existsSync(path.join(__dirname, imagePath))) {
                    fs.unlinkSync(path.join(__dirname, imagePath)); // Delete image file
                }

                res.json({ message: "Image deleted successfully" });
            });
        } else {
            res.status(404).json({ message: "Image not found" });
        }
    });
});




app.get("/Vegetarian", (req, res) => {
    db.query("SELECT * FROM Vegetarian", (err, result) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        res.send(result);
    });
});


// Start Server
app.listen(Port, () => {
    console.log(`Server is running on http://127.0.0.1:${Port}`);
});

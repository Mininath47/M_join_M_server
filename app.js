const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb').MongoClient;
const mysql = require('mysql');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const MongoPath = process.env.MongoUrl;
const Port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASES,
    port: process.env.PORTT || 3306,
    connectTimeout: 1000
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('DB connected...');
});

// MongoDB Routes
const collections = ['user', 'dairy', 'drinks', 'foods', 'vegetarian', 'product', 'login'];
collections.forEach(col => {
    app.get(`/${col}`, (req, res) => {
        mongodb.connect(MongoPath).then(object => {
            const database = object.db('e-com');
            database.collection(col).find().toArray().then(document => {
                res.send(document);
            });
        });
    });
});

// MySQL Routes
app.get('/users', (req, res) => {
    db.query('SELECT * FROM user', (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

app.get('/image', (req, res) => {
    db.query('SELECT * FROM image', (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

// Multer Storage Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Upload Image
app.post('/upload', upload.single('image'), (req, res) => {
    const imagePath = `/images/${req.file.filename}`;
    db.query('INSERT INTO image (path) VALUES (?)', [imagePath], (err) => {
        if (err) throw err;
        res.json({ message: 'Image uploaded successfully', path: imagePath });
    });
});

// Update Image
app.put('/update/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    db.query('SELECT path FROM image WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            const oldPath = result[0].path;
            const imagePath = `/images/${req.file.filename}`;
            db.query('UPDATE image SET path = ? WHERE id = ?', [imagePath, id], (err) => {
                if (err) throw err;
                fs.unlinkSync(path.join(__dirname, oldPath));
                res.json({ message: 'Image updated successfully', path: imagePath });
            });
        } else {
            res.status(404).json({ message: 'Image not found' });
        }
    });
});

// Delete Image
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT path FROM image WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            const imagePath = result[0].path;
            db.query('DELETE FROM image WHERE id = ?', [id], (err) => {
                if (err) throw err;
                fs.unlinkSync(path.join(__dirname, imagePath));
                res.json({ message: 'Image deleted successfully' });
            });
        } else {
            res.status(404).json({ message: 'Image not found' });
        }
    });
});

app.listen(Port, () => {
    console.log(`Server is running.... http://127.0.0.1:${Port}`);
});

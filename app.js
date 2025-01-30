const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb').MongoClient;
const mysql = require('mysql');
const app = express();
require('dotenv').config();
const MongoPath = process.env.MongoUrl;
const MysqlPath = process.env.MysqlUrl;
const Port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//Mysql Create Connection


const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASES,
    port: process.env.PORTT || 3306,
    connectTimeout :1000
});


db.connect((err)=>{
    if(err)
    {
        throw err;
    }
    console.log('DB connected...');
})

// MongoDB

app.get('/user',(req,res)=>{
    mongodb.connect(MongoPath).then((object)=>{
        const database = object.db('e-com');
        database.collection('users').find().toArray().then((document)=>{
            res.send(document);
            res.end();
        })
    })
});

//Mysql 

app.get('/users',(req,res)=>{
   db.query('select * from user',(err,result)=>{
    if(err)
    {
        throw err;
    }
    res.send(result)
   })
});

app.listen(Port,()=>{
    console.log(`server is running.... http://127.0.0.1:${Port}`);
})
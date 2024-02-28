const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

const secretkey = require('./config/lsw-wikipage-firebase-adminsdk-secretkey.json')

admin.initializeApp({
    credential: admin.credential.cert(secretkey)
});
const firestore = admin.firestore();

const postRouter = require('./routes/post');

const app = express();

const allowedOrigins =
    ['http://localhost:3000',
    ];
app.use(cors({ origin: allowedOrigins }));


app.use('/Post', postRouter(firestore))

exports.api = functions.region("asia-northeast3").https.onRequest(app);
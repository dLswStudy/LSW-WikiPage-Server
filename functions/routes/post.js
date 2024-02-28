const moment = require('moment');
const logger = require("firebase-functions/logger");
const {addPost, getPostById} = require("../service/PostService");
const express = require("express");
const router = express.Router();

const collectionPath = 'Posts'
function postRouter(firestore) {
    //위키페이지 목록 가져오기
    router.get('/', async (req, res) => {
        logger.info("getPosts");

        const snapshot = await firestore.collection(collectionPath).orderBy('index', 'asc').get();
        const posts = snapshot.docs.map(doc => ({...doc.data()}));
        res.status(200).send(posts);
    });
    //위키페이지 등록하기
    router.post('/', async (req, res) => {
        try {
            logger.info("postPostOne");

            const now = moment().add(9, 'hour').format('YYYYMMDDHHmmss');
            logger.info("postPostOne now", now);

            const postData = {
                title: req.body.title,
                content: req.body.content,
                instDT: now,
                modfDT: now
            };

            const addedData = await addPost(firestore, postData)
            res.status(200).send(addedData);
        } catch (e) {
            res.status(500).send(e.message);
        }
    });
    //위키페이지 상세 가져오기
    router.get("/:postId", async (req, res) => {
        try {
            const postId = req.params.postId;
            const post = await getPostById(firestore, postId);
            res.status(200).json(post);
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    return router;
}

module.exports = postRouter;

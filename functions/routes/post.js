const moment = require('moment');
const logger = require("firebase-functions/logger");
const {addPost, getPostById, putPostById, deletePostById, convertToRaw, deletePostByIds} = require("../service/PostService");
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

            let content = req.body.content;
            //Test 생성용 (Front 의 react-draft-wysiwyg 에디터용)
            if(typeof content === 'string') content = convertToRaw(content)
            const postData = {
                title: req.body.title,
                content: content //
            };
            console.log("postData = ", postData);

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
    //위키페이지 상세 업데이트
    router.put("/:postId", async (req, res) => {
        try {
            const postId = req.params.postId;
            const data = req.body;
            await putPostById(firestore, postId, data);
            res.status(200).send('success');
        } catch (error) {
            res.status(500).send(error.message);
        }
    });
    // 상세 페이지 삭제
    router.delete("/:postId", async (req, res) => {
        try {
            const postId = req.params.postId;
            await deletePostById(firestore, postId); // PostService에서 제공하는 삭제 함수 호출
            res.status(200).send({ message: 'Post deleted successfully' });
        } catch (error) {
            logger.error(`Error deleting post: ${error}`);
            res.status(500).send({ message: error.message });
        }
    });
    // 상세 페이지 여러개 삭제
    router.delete("/:postId1/:postId2", async (req, res) => {
        try {
            const { postId1, postId2 } = req.params;
            await deletePostByIds(firestore, postId1, postId2); // PostService에서 제공하는 삭제 함수 호출
            res.status(200).send({ message: 'Post deleted successfully' });
        } catch (error) {
            logger.error(`Error deleting post: ${error}`);
            res.status(500).send({ message: error.message });
        }
    });


    return router;
}

module.exports = postRouter;

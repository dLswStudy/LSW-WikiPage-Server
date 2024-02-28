const moment = require("moment");
const collectionPath = 'Posts'

async function addPost(db, data) {
    const indexDocRef = db.collection('Index').doc('Post');
    const postsCollRef = db.collection(collectionPath);

    return await db.runTransaction(async (transaction) => {
        // Index 문서에서 현재 인덱스 가져오기
        const indexSnap = await transaction.get(indexDocRef);
        const currIndex = indexSnap.data().index;
        const nextIndex = currIndex + 1;
        data.index = nextIndex

        // Posts 컬렉션에 새 문서 추가
        const newPostRef = postsCollRef.doc(nextIndex.toString());
        transaction.set(newPostRef, data);

        // Index 문서의 index 필드 업데이트
        transaction.update(indexDocRef, {index: nextIndex});
        return data
    });
}

async function getPostById(db, postId) {
    try {
        const postRef = db.collection(collectionPath).doc(postId);
        const postSnap = await postRef.get();
        if (!postSnap.exists) {
            throw new Error("게시물을 찾을 수 없습니다.");
        }
        const data = postSnap.data()
        data.prev = {title: ''}
        data.next = {title: ''}

        const idx = await getPrevNextIdx(db, postId)
        console.log('idx',idx)
        if (idx.prevIdx>=0) {
            const prevDoc = db.collection(collectionPath).doc(idx.prevIdx + '');
            const prevSnap = await prevDoc.get();
            data.prev.title = prevSnap.data().title
        }
        if (idx.nextIdx>=0) {
            const nextDoc = db.collection(collectionPath).doc(idx.nextIdx + '');
            const nextSnap = await nextDoc.get();
            data.next.title = nextSnap.data().title
        }

        return data;
    } catch (error) {
        console.error('Error[getPostById] :', error);
        throw new Error(error)
    }
}

async function getPrevNextIdx(db, postId) {
    //field의 index
    let prevIdx = -1
    let nextIdx = -1
    try {
        // QnA 컬렉션을 categoryCode 및 index에 따라 정렬
        const query = db.collection(collectionPath)
            .orderBy('index', 'asc');

        const snapshot = await query.get();
        const docs = snapshot.docs.map(doc=>doc.data());
        const arrIdx = docs.findIndex(doc => doc.index === Number(postId))
        if (arrIdx > 0) prevIdx = docs[arrIdx - 1]?.index
        if (arrIdx >= 0) nextIdx = docs[arrIdx + 1]?.index

        return {
            prevIdx:prevIdx ?? -1,
            nextIdx:nextIdx ?? -1
        };
    } catch (error) {
        console.error('Error[getPrevNextIdx]:', error);
        throw new Error(error)
    }
}


module.exports = {
    addPost,
    getPostById,
}
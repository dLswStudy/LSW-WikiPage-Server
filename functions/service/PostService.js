const moment = require("moment");
const logger = require("firebase-functions/logger");
const collectionPath = 'Posts'

function calcNow() {
    const now = moment().add(9, 'hour').format('YYYYMMDDHHmmss');
    return now;
}

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
        const now = calcNow();
        logger.info("postPostOne now", now);
        data.instDT = now
        data.modfDT = now
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
        if (idx.prevIdx>=0) {
            const prevDoc = db.collection(collectionPath).doc(idx.prevIdx + '');
            const prevSnap = await prevDoc.get();
            data.prev.title = prevSnap.data().title
            data.prev.postId = idx.prevIdx
        }
        if (idx.nextIdx>=0) {
            const nextDoc = db.collection(collectionPath).doc(idx.nextIdx + '');
            const nextSnap = await nextDoc.get();
            data.next.title = nextSnap.data().title
            data.next.postId = idx.nextIdx
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

async function putPostById(db, postId, data) {
    try {
        const postRef = db.collection(collectionPath).doc(postId);
        data.modfDT = calcNow()
        await postRef.update(data);
    } catch (error) {
        console.error('Error[putPostById]:', error);
        throw new Error('문서 업데이트 중 오류가 발생했습니다.');
    }
}

async function deletePostById(db, postId) {
    const postRef = db.collection(collectionPath).doc(postId);
    const snapshot = await postRef.get();
    if(!snapshot.exists) throw new Error('삭제할 문서가 존재하지 않습니다.')
    await postRef.delete();
}
async function deletePostByIds(db, postId1, postId2) {
    for (let id = Number(postId1); id <= Number(postId2); id++) {
        const postRef = db.collection(collectionPath).doc(id.toString());
        const snapshot = await postRef.get();
        if(!snapshot.exists) throw new Error('삭제할 문서가 존재하지 않습니다. postId: '+id)
        await postRef.delete();
    }
}



function convertTitlesToLinks(content, docArr) {
    docArr.forEach(doc => {
        // 이미 태그로 감싸진 title을 제외하기 위한 정규 표현식
        const regex = new RegExp(`(?<!<[^>]*?)${doc.title}(?![^<]*?>)`, "g");
        content = content.replace(regex, (match) => {
            // 이미 다른 태그로 감싸진 경우를 확인하기 위한 추가 검사
            if (/<[^>]+>/.test(match)) {
                return match; // 이미 다른 태그로 감싸진 경우 변경하지 않음
            }
            return `<a href="#" onClick="()=>moveTo(${doc.index})">${doc.title}</a>`;
        });
    });
    return content;
}

async function contentWithTag(db, content) {
    try {
        const snapshot = await db.collection(collectionPath).orderBy('index', 'asc').get();
        const posts = snapshot.docs.map(doc => ({...doc.data()}));
        data.modfDT = calcNow()
        await postRef.update(data);
    } catch (error) {
        console.error('Error[putPostById]:', error);
        throw new Error('문서 업데이트 중 오류가 발생했습니다.');
    }
}

function convertToRaw(content){
    const unit = {
        "entityMap": {},
        "blocks": [
            {
                "depth": 0,
                "data": {},
                "inlineStyleRanges": [],
                "text": "",
                "type": "unstyled",
                "key": "6p1cd",
                "entityRanges": []
            }
        ]
    }
    unit.blocks[0].text = content
    return unit
}


module.exports = {
    addPost,
    getPostById,
    putPostById,
    deletePostById,
    deletePostByIds,
    convertToRaw
}
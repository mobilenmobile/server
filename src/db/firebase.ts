// lib/firebase.ts
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";


const { privateKey } = JSON.parse(process.env.FIREBASE_PRIVATE_KEY || "")
const config = {
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // project_id: process.env.FIREBASE_PROJECT_ID,
    privateKey: privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
}

export const firebase = admin.apps.length
  ? admin.app()
  : admin.initializeApp(config);

export const getUid = async (authToken: string): Promise<{ uid: string; }> => {
  const decodedToken = await getAuth()
    .verifyIdToken(authToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      return { authenticated: true, uid: uid }
    })
  // console.log("from firebase decoded token =>",decodedToken)
  return decodedToken
}


// function getAllUsers(nextPageToken: string | undefined) {
//   admin.auth().listUsers(100, nextPageToken)
//       .then(function(listUsersResult) {
//           listUsersResult.users.forEach(function(userRecord) {
//               let uid = userRecord.toJSON().uid;
//               deleteUser(uid);
//           });
//           if (listUsersResult.pageToken) {
//               getAllUsers(listUsersResult.pageToken);
//           }
//       })
//       .catch(function(error) {
//           console.log('Error listing users:', error);
//       });
// }

// export function deleteAllUsers(nextPageToken?: any) {
//   console.log("delete all user called")
//   admin.auth().listUsers(40, nextPageToken)
//     .then(function (listUsersResult) {
//       console.log("list user result=> ", listUsersResult)
//       listUsersResult.users.forEach(function (userRecord) {
//         console.log("user record=>", userRecord)
//         admin.auth().deleteUser(userRecord.uid).then(() => {
//           console.log(`deleted ${userRecord.uid}`);
//         });
//       });
//       if (listUsersResult.pageToken) {
//         setTimeout(() => {
//           deleteAllUsers(listUsersResult.pageToken)
//         }, 1000);
//       }
//     })
//     .catch(function (error) {
//       console.log(error);
//     });
// }

// deleteAllUsers()







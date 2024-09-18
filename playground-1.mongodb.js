// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('comm-tracker');

// Create a new document in the collection.
db.getCollection('users').insertOne({
username:"receving",password:'$2a$12$22imNFveH2Xf3WXIhmLTuO0iHiSD3Qlpxdil0Wx1pqxtvKuAEtVN2',userrole:'receiving'
});

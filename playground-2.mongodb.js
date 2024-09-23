// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('comm-tracker');

// Create a new document in the collection.
db.getCollection('users').insertOne({
  "username":"receiving",
  "password":"$2a$10$cyTU6guW5.3f7jJWYBBWleVpgTQw/4D/HRI71/m3trQekYcO6FMui",
  "userrole":"receiving"
});

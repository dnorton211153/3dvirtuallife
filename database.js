module.exports = function (mongoose, callback) {

    const CONNECTION_STRING = process.env.DB || "mongodb://localhost:27017/nortonAdventure";


    const savedGameSchema = mongoose.Schema({
        gameName: {type: String, unique: true, required: true},
        props: String,
        heroTemplate: String
    });
      
    const SavedGame = mongoose.model('SavedGame', savedGameSchema);

    const userSchema = mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      roles: {type: [String], default: ['player']},
      firstname: String,
      surname: String
    });
    
    const UserModel = mongoose.model('User', userSchema);

    mongoose.connect(CONNECTION_STRING, { useMongoClient: true })
    .then(

      (db) => {
        callback(db);
      },
  
      (err) => {
          console.log('Database error: ' + err.message);
      }
    ); 
}
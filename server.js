const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
//inclusão de dependencias
const mongoose = require('mongoose');
const mongo = require("mongodb");
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//conexão com o banco de dados
const uri = process.env.MONGO_URI
mongoose.connect(uri);

//configurações intermedarias
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//inicio do codigo
//criando o modelo de dados
let ExerciseSchema = new mongoose.Schema({
  userId: String,
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
})
let Exercise = mongoose.model("Exercise", ExerciseSchema)

let UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: Array,
  
})
let User = mongoose.model("User", UserSchema)

////////////////////////
//app post users
app.post("/api/users", (req, res) => {
  let newUser = new User({
    username: req.body.username
  })
  newUser.save((err, data) => {
    if (err) {
      res.send("tem erro no salvar usuario")
    } else {
      res.json(data)
    }

  })
})

////////////////////////
//app post exercises
app.post("/api/users/:_id/exercises", (req, res)=>{
  const userId = req.params._id;
  const {duration, description} = req.body;
  let date = req.body.date ? new Date(req.body.date) : new Date();
  
if(userId && duration && description){
  User.findById(userId, (err, data)=>{
    if(!data){
      res.send("Unknown userId");
    } else {
      const username = data.username;
      const _id = data.userId;
      let log = data.log
     
        let newExercise = new Exercise({
        "userId": userId, 
        "username": username, 
        "date": date.toDateString(), 
        "duration": duration, 
        "description": description});

      newExercise.save((err, data)=>{
        if(err) { console.error(err);
        } else {
        res.json({     
          "username": username,
          "description": description,
          "duration": parseInt(duration),
          "date": date.toDateString(),
          "_id": userId,
            });
        }
      });
    }
  });
} else {
  res.send("Please fill in all required fields.");
}
});

////////////////////////
// app get user id logs
app.get("/api/users/:_id/logs", (req, res)=>{
  const userId = req.params._id;
  var limit = req.query.limit;
  var from = req.query.from ? new Date(req.query.from).getTime() : new Date("1111-11-11").getTime();
  var to = req.query.to ? new Date(req.query.to).getTime() : new Date().getTime();

  User.findById(userId, (err, data)=>{
    if(err) console.error(err);  
    
    if(!data){
      res.send("Unknown userId");
    } else {
      const username = data.username;
            
      Exercise.find({"userId": userId}).select(["description", "date", "duration"]).limit(+limit).sort({date: -1}).exec((err, data)=>{
        if(err) console.error(err);
        let count = 0;
        let customData = data
        .filter(element=>{
          let newEle = new Date(element.date).getTime();
          if(newEle >= from && newEle <=to) count++;
          return newEle >= from && newEle <=to;
          })
        .map(element=>{
          let newDate = new Date(element.date).toDateString();
          return {description: element.description, duration: element.duration, date: newDate};
        });
        if(!data){
          res.json({
            "userId": userId,
            "username": username,
            "count": 0,
            "log": []
          });
        } else {
          res.json({
            "userId": userId,
            "username": username,
            "count": count,
            "log": customData
          });
        }
      });
    }
  })

});

/////////////////
//api get users
app.get("/api/users", (req, res)=>{
  User.find({}).select(["_id", "username"]).exec(
    (err, data)=>{
 wtimeout : 2500,
    res.json(data);
  });
});



//testando a porta de conexão
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
//testando se o banco está conectado
mongoose.connect(uri, {
  useMongoClient: true
})
  .then(() => {
    console.log('Connection to database!')
  })
  .catch(() => {
    console.log('Connection to database failed!')
  })


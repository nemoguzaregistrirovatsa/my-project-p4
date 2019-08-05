const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
var SchemaP4 = new mongoose.Schema({
  username: String,
  count: Number,
  log: [Object]
}/*, {timestamps: true}*/)
var ModelP4 = mongoose.model('ModelP4', SchemaP4);

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', function(req, res) {
  var data = new ModelP4({
    username: req.body.username,
    count: 0
  });
  data.save((err) => {
    if (err) res.send('Error saving to database!')
    else {
      res.json({username: data.username, _id: data._id});
    }
  });
});

app.get('/api/exercise/users', function(req, res) {
  ModelP4.find({}, (err, data) => {
    if (err) res.send('Error reading database!')
    else {
      var newData = [];
      for (var i = 0; i < data.length; i++) {
        newData[i] = ({username: data[i].username, _id: data[i]._id});
      };
      res.json(newData);
    }
  });
});

app.post('/api/exercise/add', function(req, res) {
  var date = new Date(req.body.date);
  if (date == 'Invalid Date') date = new Date();
  date = date.toLocaleDateString();
  ModelP4.findOne({'_id': req.body.userId}, (err, data) => {
      if (err) res.send('Error reading and saving to database!')
      else if (data == null) res.send('There is no such user!')
      else {
        data.count++;
        data.log.push({
          description: req.body.description,
          duration: req.body.duration,
          date: date
          })
        data.save((err) => {
          if (err) res.send('Error saving to database!')
          else res.json({username: data.username, _id: data._id, count: data.count, log: data.log});
        });
      };
  });
});

app.get('/api/exercise/log', function(req, res) {
  ModelP4.findOne({_id: req.query.userId}, (err, data) => {
    if (err) res.send('Error reading and saving to database!')
      else if (data == null) res.send('There is no such user!')
      else {
        var logCopy = data.log.map((item) => {return item});
        //if (new Date(req.query.from) != 'Invalid Date') {
          logCopy = logCopy.filter((item) => {return new Date(item.date) >= new Date(req.query.from)})
        //} //else res.send('Incorrect "from" date!');
        //if (new Date(req.query.to) != 'Invalid Date') {
          logCopy = logCopy.filter((item) => {return new Date(item.date) <= new Date(req.query.to)})
        //} //else res.send('Incorrect "to" date!');
        //if (typeof(req.query.limit) == Number) {
          logCopy = logCopy.filter((item, i) => {return i < req.query.limit})
        //} //else res.send('Incorrect "limit"!');
        res.json({username: data.username, _id: data._id, count: data.count, log: logCopy});
        //res.json(new Date(data.log[0].date) >= new Date(req.query.from))
      };
  });
});

/*
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
*/
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
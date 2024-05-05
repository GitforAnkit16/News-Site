const express = require('express')
const app = express()
const {MONGOURI} = require("./keys")
const mongoose = require('mongoose')
const PORT = 8000;
const cors = require('cors')


app.use(cors({
    origin: 'http://localhost:8000' 
  }));

mongoose.connect(MONGOURI)
mongoose.connection.on('connected',()=>{
    console.log("Connected to Mongo")
})
mongoose.connection.on('error',(err)=>{
    console.log("Error Connecting: ",err)
}) 

require('./models/user')
require('./models/post')
app.use(express.json())
app.use(require('./routes/auth'))
app.use(require('./routes/post'))
app.use(require('./routes/user'))
app.listen(PORT,()=>{
    console.log("Server is running on",PORT)
})
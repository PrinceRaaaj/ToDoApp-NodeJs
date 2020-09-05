require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const today = require(__dirname + "/date.js");
const mongoose = require("mongoose");
var _ = require('lodash');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("static"));
mongoose.connect(proces.env.MONGODB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name field required"]
  }
});
const Item = new mongoose.model("Item", itemsSchema);

app.get("/", function(req, res) {
  let day = today.getDay();
  Item.find({}, (err, items) => {
    if (!err) {
      res.render("list", {listTitle: day, items: items});
    }
  });
});

const listSchema = new mongoose.Schema({
  name: String,
  list : [itemsSchema]
})
const List = new mongoose.model("List", listSchema);
const listItems = [];
app.get("/:customListName", (req,res)=>{
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, (err, foundItem)=>{
    if(!err){
      if(foundItem){
        res.render("list" , {listTitle: foundItem.name, items: foundItem.list.reverse()});
      } else {
        const newList = new List({name: customListName, list:[]});
        newList.save((err)=>{
          if(!err){
            res.redirect("/"+customListName);
          }
        });
      }
    }
  });
});


app.post("/", function(req, res) {
  const item = req.body.toDo;
  const listName = req.body.list;
  if (item === "") {
    if(listName === today.getDay()){
      res.redirect("/");
    } else {
      res.redirect("/"+listName);
    }
  } else {
    const newItem = new Item({name:item});
    if(listName === today.getDay()){
      newItem.save((err)=>{
        if(!err){
          res.redirect("/");
        }
      });
    }
    else{
      List.findOne({name: listName}, (err, foundItem)=>{
        foundItem.list.push(newItem);
        foundItem.save((err)=>{
          if(!err){
            res.redirect("/"+listName);
          }
        });
      });
    }
  }
});

app.post("/delete", (req,res)=>{
  const itemId = req.body.checkbox;
  const listName = req.body.list;
  if(listName === today.getDay()){
    Item.deleteOne({_id:itemId}, (err)=>{
      if(!err){
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{list:{_id:itemId}}}, (err, newList)=>{
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function() {
  console.log("Server started at port 3000");
});

const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const app = express();
const port = 8000;
const  author = require('./Model/authorSchema')
const Article = require('./Model/articleSchema')
app.use(express.json())


const verification = function(req, res, next) {
  const token = req.header('x-access-token');
  const secretKey = "MySecretKey123!@#";
  if (!token) {
    res.send('Access denied!');
  } else {
    jwt.verify(token, secretKey, function(err, decoded) {
      if (err) {
        res.send('Authentication failed');
      } else {
        req.user = {
          authorID: decoded.id,
          authorName: decoded.name
        };
        next();
      }
    });
  }
}



//require the models
const mongoDBString = "mongodb://127.0.0.1:27017/myblog"
async function connect() {
    try {
      let c = await mongoose.connect(mongoDBString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB!');
    } catch (error) { 
      console.error('Error connecting to MongoDB:', error);
    }
  }

connect()



//Checking if I can access the data that I sent in the p
app.get("/hemlo", function(req, res){
  res.send(req.user)
})

app.get('/',function(req,res) {
    res.send("Hello budding bloggers!");
    console.log("Pheww!")
})

app.get('/about', function(req,res){
    res.send("MyBlog is an application for youngsters who are looking for the perfect platform to \n post their blogs on without the hassle of setting up a personal website. ");
    console.log("Pheww!")
})


//Author sign up --Fully validated. no verification needed
app.post('/signup/', async function(req, res){
    
    
    if((req.body.name == null) || (req.body.age == null) || (req.body.address == null) || (req.body.bio ==null) || (req.body.email == null) || (req.body.password == null)){
      res.send("Fill all the fields before signing up! ")
    }

    else{

      //Check password format
      const pass = req.body.password;
      const regex1 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/;
      if(regex1.test(pass) != true){
          res.send("The password should contain the following: \n Atleast 1 uppercase letter \n Atleast 1 lowercase letter \n Atleast one numerical digit \n Atleast 6 digits")
      }

      //Check age
      if(req.body.age <= 12){
          res.send("All authors are required to be older than 13 years")
      }

      //Check email format
      const mail = req.body.email;
      const regex2 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if(regex2.test(mail) != true){
        res.send("Enter email in the correct format e.g. xxxxxx@yyy.com")
      }


      //Check if email already used
      const emailUsed = await author.findOne({authorEmail: req.body.email})
      if(emailUsed == null){
        const hashedPass = await bcrypt.hash(req.body.password, 10)
        const docs = await author.countDocuments({});
        const newID = docs + 1;
        await author.create({
          authorID: newID,
          authorName: req.body.name, 
          authorAge : req.body.age,
          authorAdd: req.body.address, 
          authorBio:req.body.bio,
          authorEmail: req.body.email,
          authorPassword: hashedPass
        })
      
        console.log("Document entered successfully")
        res.send("Your author id: " + newID)
      }

      else{
        res.send("User already exists with email id: " + `${req.body.email}`)
      }
      
      
    }
    
})

//Get author -- fully validated. No need for verification
app.get('/author/about', async function(req,res){
    //Check if the author name is null
    if(req.body.name == null){
      res.send("Need author name!")
    }

    //Check if the author name passed exists?
    const findAuthor = await author.find({authorName: req.body.name});
    if(findAuthor.length !== 0){
      res.send(findAuthor)
    }
    else{
      res.send("Author does not exist")
    }
})

//New version of the request do not delete. Verified
app.patch('/author/editprofile/', verification, async function(req,res){
      if(!Object.keys(req.body).length){
        res.send("No body!")
        return
      } 

      if(req.body.authorAge == null && req.body.authorAdd == null && req.body.authorBio == null && req.body.authorEmail == null){
        res.send("You can update age, address, bio and email only")
        return
      }

      //If trying to change id or name
      if(req.body.authorID != null || req.body.authorName != null){
        res.send("Cannot change name or ID")
        return
      }

      //If the age they are trying to put is <12
      if(req.body.authorAge != null && req.body.authorAge <=  12 ){
        res.send("Enter a correct age value. Users under the age of 12 are not allowed.")
        return
      }
      
      //Trying to submit without bio
      if(req.body.authorBio == ""){
        res.send("Bio cannot be empty!")
        return
      }

      //Check email format
      const regex2 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if(req.body.authorEmail != null && regex2.test(req.body.authorEmail) != true){
        res.send("Email not in the right format!")
      }

      //Check if email already present in the database
      if (req.body.authorEmail != null && (await author.findOne({authorEmail: req.body.authorEmail})) != null) {
        res.send("Email already used")
      }
        
      //Now make the changes
      else{
        const updatedDetails = await author.findOneAndUpdate({authorID : req.user.authorID}, req.body)
        if(updatedDetails.length !== 0){
          res.send("Successfully updated!")
        }
        else{
          res.send("Some error occured")
      }
      }
})

//Reset password -- Fully validated. Verified
app.patch("/author/resetpassword/", verification, async function(req, res){
  //Check if valid user id entered
  const userID = await author.findOne({authorID : req.user.authorID});
  if(userID == null){
    res.send("Enter a valid user ID! This user does not exist.")
  }

  //Check if password entered or not
  if(req.body.password == null){
    res.send("Enter a valid password! Password field should not be empty")
  }

  //Check if password in the correct format
  const regex1 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/;
  if(regex1.test(req.body.password) != true){
    res.send("The password should contain the following: \n Atleast 1 uppercase letter \n Atleast 1 lowercase letter \n Atleast one numerical digit \n Atleast 6 digits")
  }

  //Now do the actual updating of password using hashing
  else{
    const updatedPassword = await bcrypt.hash(req.body.password, 10);
    await author.findOneAndUpdate({authorID: req.user.authorID},{authorPassword: updatedPassword})
    res.send("Password updated successfully")
  }
})


//Author ID login
app.post("/author/login",  async function(req, res) {
  // If no information sent, i.e., username and password not sent
  if (req.body == null) {
    res.send("Enter an ID and password!");
    return;
  }

  // Check if the user exists
  const user = await author.findOne({ authorID: req.body.ID });
  if (!user) {
    res.send("Invalid ID or password!");
    return;
  }

  // Comparing the password
  const userLoggedIn = await bcrypt.compare(req.body.password, user.authorPassword);

  // Then proceed to generate the token
  if (!userLoggedIn) {
    res.send("Invalid user or password");
    return;
  } else {
    const user1 = await author.findOne({ authorID: req.body.ID });
    const payload = {
      id: req.body.ID,
      name: user1.authorName
    };

    const secretKey = "MySecretKey123!@#";
    jwt.sign(payload, secretKey, {expiresIn: 86400},(err, token) => {
      if (err) {
        res.json({ message: err });
        return;
      }
      res.header("x-access-token", token);
      res.send(token);
      
    });
  }
});


//<Now the article apis are gonna be written over here>

//Publish an article
app.post('/author/newarticle', verification, async function (req, res){
  //Check if body is required
  if(!Object.keys(req.body).length){
    res.send("Article title, text and category are required")
    return
  }

  //Check if the text, category and the title are present
  if(req.body.articleTitle ==null || req.body.articleTitle == ""){
    res.send("Title is required.");
    return
  }

  if(req.body.articleCategory ==null || req.body.articleCategory == ""){
    res.send("Category is required.");
    return
  }

  if(req.body.articleText == null || req.body.articleText== ""){
    res.send("Text is required")
  }

  //Check if article selected is in the correct category choice
  if(req.body.articleCategory != null && req.body.articleCategory != "Op-ed" && req.body.articleCategory != "Finance" && req.body.articleCategory != "Health" && req.body.articleCategory !="Tech" & req.body.articleCategory !="Education" && req.body.articleCategory !="Entertainment"){
    res.send("Categories should only be one of the following: \n 1.Finance \n 2.Health \n 3.Tech \n 4.Op-ed \n 5.Education \n 6.Entertainment")
    return
  }

  //Check if article title already written about
  const aTitle = await Article.findOne({articleTitle: req.body.articleTitle})
  if(aTitle != null){
    res.send("Title already used. Select another title.")
    return
  }

  await Article.create({
    articleTitle: req.body.articleTitle,
    authorID: req.user.authorID,
    authorName: req.user.authorName,
    articleCategory: req.body.articleCategory,
    articleText: req.body.articleText
  })
  res.send("Article successfully published!")
})

//Delete an article -- Fully validated. Need verification
app.delete("/deletearticle/", async function(req,res){

  if(req.body.title != null){
    const articleTitle = await Article.findOne({articleTitle: req.body.title});
    if(articleTitle != null){
      await Article.findOneAndDelete({articleTitle: req.body.title})
      res.send("The article "+`${req.body.title}` + " has been successfully deleted.")
    }
    else{
      res.send("There is no article with the title: " + `${req.body.title}` +" . Please try again")
    }
  }
  else{
    res.status(400).send("Only title is required for the deletion! You cannot delete the author or category here!")
  }
  
})

//Delete an article with validation and verified
app.delete("/author/deletearticle", verification,  async function(req,res){
  if(req.body.articleTitle == null){
    res.send("Enter an article title")
    return
  }

  const articleMatch = await Article.findOne({articleTitle: req.body.articleTitle})
  if(articleMatch.authorName != req.user.authorName){
    res.send("You cannot delete an article you did not write!")
    return
  }
  else{
    await Article.findOneAndDelete({articleTitle: req.body.articleTitle})
    res.send("Article successfully deleted")
  }

})

//Update an article -- Fully validated. Need verification. Just article text! Title in params is the resource identifier. Title in the body is the new title
app.patch('/author/editarticle/:articleTitle', verification, async function(req, res){
  
    //Check if title is available
    if(req.body.articleTitle == null && req.body.articleText == null && req.body.articleCategory == null){
      res.status(400).send("Title and text are required. You cannot change authorID and authorName")
      return
    }
    
    //Does the article exist in our database?
    const articleFound = await Article.findOne({articleTitle: req.params.articleTitle});
    if(articleFound == null){
      res.send("There is no article with the title: " + `${req.params.articleTitle}` +" . Please try again")
      return
    }

    //Is category changed correctly?
    if(req.body.articleCategory != null && req.body.articleCategory != "Op-ed" && req.body.articleCategory != "Finance" && req.body.articleCategory != "Health" && req.body.articleCategory !="Tech" & req.body.articleCategory !="Education" && req.body.articleCategory !="Entertainment"){
      res.send("Categories should only be one of the following: \n 1.Finance \n 2.Health \n 3.Tech \n 4.Op-ed \n 5.Education \n 6.Entertainment")
      return
    }

    //Does this article belong to this writer?
    if(articleFound.authorName != req.user.authorName){
      res.send("You cannot edit someone elses articles")
      return
    }

    //Is the new title already used by someone else
    if(req.body.articleTitle != null && (await Article.findOne({articleTitle: req.body.articleTitle}))!= null && (await Article.findOne({articleTitle: req.body.articleTitle})).authorName != req.user.authorName){
      res.send("Will you please not mess with others")
      return
    }

    else{
      const updatedVal = req.body;
      const updateTitle ={articleTitle: req.params.articleTitle};
      await Article.findOneAndUpdate(updateTitle, updatedVal)
      res.send("Successfully updated article")
       
    }
})

//Get article
app.get("/article", async function(req, res){
      //Check if title is present
      if(req.body.title == null){
        res.send("Title is required")
      }

      //Check if title is present in the database
      const findArticle = await Article.findOne({articleTitle:req.body.title})
      if(findArticle != null){
        res.send(findArticle)
      }
      else{
        res.send("Article with title " + `${req.body.title}`+ " does not exist")
      }
})

//Get article
app.get("/articles/:category", async function(req, res){
  try {
  //Check if category is valid
  if(req.params.category == "Op-ed" || req.params.category == "Finance" || req.params.category == "Health" || req.params.category =="Tech" || req.params.category =="Education" || req.params.category =="Entertainment"){
    // const findCategory = await Article.find({category: req.params.category}); -- you can do find length with this too
    const findCategory = await Article.aggregate([{$match:{category: req.params.category}}])
    if(findCategory.length === 0){
      res.send("No articles found in the " + `${req.params.category}` +" category")
    }
    else{
      res.send(findCategory) 
    }

  }
  else{
    res.send("Category does not exist. Categories should only be one of the following: \n 1.Finance \n 2.Health \n 3.Tech \n 4.Op-ed \n 5.Education \n 6.Entertainment")
  }
  
  } catch (error) {
    res.status(400).send("Choose the category first! Categories should only be one of the following: \n 1.Finance \n 2.Health \n 3.Tech \n 4.Op-ed \n 5.Education \n 6.Entertainment")
  }
  
})

//Get Articles by a given author
app.get("/writer/:writer", async function(req, res){
  //Check if writer name in body
  if(req.params.writer == null){
    res.send("Please enter the name of the writer")
  }

  //Check if writer name is in the database
  const findWriter = await author.exists({authorName: req.params.writer})
  if(findWriter != null){
    const findArticles = await Article.aggregate([{$match:{authorName: req.params.writer} }])
    if(findArticles.length === 0){
      res.send("No articles by our writer "+ `${req.params.writer}` + " yet.")
    }
    else{
      res.send(findArticles)
    }
  }

  else{
    res.send("Writer " + `${req.params.writer}` +" does not exist")
  }
 


})

//

//<Server listening for requests in this code>
app.listen(port, function(){
    console.log(`Server running on port number ${port}`);
})


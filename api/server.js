const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser  = require('body-parser');
const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const nodemailer = require('nodemailer');

//Secrets...
const sessionSecret = process.env.SESSION_SECRET;
const adminEmail = process.env.ADMIN_EMAIL;
const adminEmailPW = process.env.ADMIN_EMAIL_PW;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: adminEmail,
      pass: adminEmailPW
    },
    tls: {
        rejectUnauthorized: false //This is necessary to prevent self-signed certificate error that keeps popping up whenever javascript tries to send the email 
    }
  });
//Okay, so if you use the connection string for node.js version 3 or higher, it doesn't connect
//even though I'm using node.js version 10 here. Using the connection string for version 2... works
//don't know why. Maybe mongoose is causing the problem? Oddly, the exact same dependencies and server.js code
//on Glitch works using the node.js version 3 or higher connection string. 
const mongoURL = process.env.MONGO_URL; 

//Some other constants
const client = new MongoClient(mongoURL, { useNewURLParser: true}); //note that even though I have useNewURLParser here, the mongoURL is old version string, in future this might cause connection problems
const siteURL = 'https://red-eden.glitch.me';

app.use(cors({credentials: true, origin: siteURL})); //If sending fetch request from client side with 'include credentials', must specify the origin to allow cross origin access
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: sessionSecret,
    resave: true,
    saveUninitialized: true,
  }));
app.use(passport.initialize());
app.use(passport.session());

client.connect((err)=>{
    if(err){
        console.log(err);
    } else {
        console.log("Successful database connection");
        const db = client.db('RedEdenDatabase');

        passport.serializeUser((user, done) => {
            done(null, user._id);
        });
       
        passport.deserializeUser((id, done) => {
            db.collection('users').findOne(
                {_id: new ObjectID(id)},
                (err, doc) => {
                    done(null, doc);
                }
            );
        });

        passport.use(new LocalStrategy(
            function(username, password, done) {
                db.collection('users').findOne({ username: username }, function (err, user) {
                    console.log('User '+ username +' attempted to log in.');
                    console.log("password: " + password);
                    if (err) { console.log("error trying to login"); return done(err); }
                    if (!user) { console.log("ain't no user by that name"); return done(null, false); }
                    if (!bcrypt.compareSync(password, user.password)) { console.log("wrong pw, nice try buddy"); return done(null, false); }
                    console.log(`welcome back ${username}!`);
                    return done(null, user);
                });
            }
        ));

        //I found it unnecessary to use this middleware (just check if req.isAuthenticated directly), so it never got used 
        function ensureAuthenticated(req, res, next) {
            if (req.isAuthenticated()) {
                return next();
            } else {
                res.redirect(siteURL+'/forum');
            }
        };

        app.post('/email', async(req, res)=>{
            let mailOptions = {
                from: adminEmail,
                to: req.body.email,
                subject: 'Red Eden Novella',
                html: `<a href="https://cdn.glitch.com/3f1b8d60-72dd-4749-b52a-b1d788645b26%2FSavingEverAfter%5Bv1%5D.pdf?v=1567369542266" download target='_blank'>Link to download novella</a>` 
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
            });
            res.json({message: "Check your email for your free novella!"});
        });

        app.post('/accesscodex', async(req, res)=>{
            let entry;
            let currentTab = req.body.currentTab;
           
            if(req.body.instruction == 'new'){
                await db.collection('codex').insertOne({
                    tab: req.body.codexTabField,
                    header: req.body.codexHeaderField,
                    body: req.body.codexBodyField,
                    author: req.user.username,
                    date: Date.now()
                }); 
                currentTab = req.body.codexTabField;
            } else if(req.body.instruction=='fetch'){
                if (currentTab){
                    entry = await db.collection('codex').findOne({tab: req.body.currentTab});    
                } else {
                    entry = await db.collection('codex').findOne();
                    currentTab = entry.tab;
                }
            } else if(req.body.instruction=='edit'){
                await db.collection('codex').findOneAndUpdate({tab: currentTab}, {
                    $set: { 
                        tab: req.body.codexTabField,
                        header: req.body.codexHeaderField,
                        body: req.body.codexBodyField, 
                    } 
                }); 
                currentTab = req.body.codexTabField;   
            } else if(req.body.instruction=='delete'){
                await db.collection('codex').findOneAndDelete({tab: currentTab}); 
                entry = await db.collection('codex').findOne();
                currentTab = entry.tab;   
            }

            let codexArrayTabsOnly = await db.collection('codex').find().project({tab: 1, _id: 0}).toArray(); 
            //note: passing in projection as an argument into find() doesn't work as it should for some reason (all fields returned when I only want tabs), so I put the projection outside
            let codexArray = codexArrayTabsOnly.map((x)=>{
                if (x.tab == currentTab && (req.body.instruction == 'new' || req.body.instruction == 'edit')){
                    return {tab: x.tab, header: req.body.codexHeaderField, body: req.body.codexBodyField};
                } else if(x.tab == currentTab && (req.body.instruction == 'fetch' || req.body.instruction == 'delete')){
                    return {tab: entry.tab, header: entry.header, body: entry.body};
                } else {
                    return {tab: x.tab, header: "", body: ""};
                }
            });
            res.json({
                codexArray: [...codexArray],
                currentTab: currentTab
            });      
        });

        app.post('/accessforum', async (req, res)=>{
            if(req.user){
                //Unload all the data in the json package 
                let instruction = req.body.instruction;
                let comment = req.body.comment;
                let noOfComments = req.body.noOfComments;
                let newComment = req.body.newComment;
                //then carry out the instruction 
                switch(instruction){
                    case 'postEditedComment':
                        let query = await db.collection('comments').findOne({_id: ObjectID(comment._id)});
                        let date = query.date; //necessary step to get UNIX date because the date in request had been converted to string on client side
                        await db.collection('comments').findOneAndReplace({_id: ObjectID(comment._id)}, {
                            _id: ObjectID(comment._id),
                            username: comment.username,
                            userId: comment.userId,
                            comment: "Edited:\n" + newComment,
                            date: date  
                        }); 
                        break;
                    case 'postNewComment':
                        await db.collection('comments').insertOne({
                            username: req.user.username,
                            userId: req.user._id,
                            comment: newComment,
                            date: Date.now()
                        }); 
                        break;
                    case 'deleteComment':
                        await db.collection('comments').findOneAndDelete({_id: ObjectID(comment._id)});
                        break;
                }
                //Finally, send back an array of new comments 
                let comments = await db.collection('comments').find().sort({date: -1}).limit(noOfComments).toArray(); 
                res.json({
                    comments: [...comments]
                });
            }
        });

        app.post('/login', passport.authenticate('local',{ failureRedirect: siteURL+'/' }), function(req, res){
            console.log("logging in...");
            console.log(req.user);
            res.redirect(siteURL+'/forum');
          });
        
        app.get('/logout', (req, res) => {
            console.log("logging out...");
            console.log(req.user);
            req.logout();
            res.redirect(siteURL+'/');
        });
         
        //When first load webpage (or with each refresh), initialize the state with values that need to be pulled from the database
        app.post('/initialize', async (req, res) => {
            //Need to load up the first few comments for the forum
            let comments = await db.collection('comments').find().sort({date: -1}).limit(req.body.noOfComments).toArray(); 
            //Need to load all the codex entry tabs, plus the full first entry (rather than fully load all entries which could take up a lot of bandwidth)
            let entry = await db.collection('codex').findOne();
            let codexArrayTabsOnly = await db.collection('codex').find().project({tab: 1, _id: 0}).toArray(); 
            let codexArray = codexArrayTabsOnly.map((x)=>{
                if(x.tab == entry.tab){
                    return {tab: entry.tab, header: entry.header, body: entry.body};
                } else {
                    return {tab: x.tab, header: "", body: ""};
                }
            });
            let administrator = 'MEVigil';
            if (req.user) {
                //Need to know if the user logging in is administrator, otherwise default is MEVigil 
                let administratorObject = await db.collection('administrators').findOne({username: req.user.username}); 
                if(administratorObject){ administrator = administratorObject.username; }
                res.json({
                    success: true,
                    message: "user has successfully authenticated",
                    user: req.user.username,
                    cookies: req.cookies,
                    comments: [...comments],
                    codexArray: codexArray,
                    currentTab: entry.tab,
                    authenticated: true,
                    administrator: administrator
                });
            } else {
                res.json({
                    authenticated: false,
                    user: "Anonymous",
                    comments: [{username: "Anonymous", date: Date.now(), comment:"Please log in to access forum\nYou will need to register to create an account"}],
                    codexArray: codexArray,
                    currentTab: entry.tab,
                    administrator: administrator
                });
            } 
        });

        app.post('/register', async (req, res, next)=>{
            let userObj = await db.collection('users').findOne({ username: req.body.username });
            if(userObj){
                res.json({
                    message: "User already exists"
                });
                return false; //This doesn't do anything other than kick javascript out of this function to prevent error caused by attempting to authenticate after res has been sent back to client
            } else {
                let hash = bcrypt.hashSync(req.body.password, 12);
                await db.collection('users').insertOne({username: req.body.username, password: hash});
            }
            next();},
            //note: passport.authenticate has to be mounted as middleware for it to work (notice how I'm chaining a bunch of functions in the app.post function)
            //Somehow (i don't know how), it knows to extract username and password from req.body (what if I named username and password something else like user and pw?)
            //then it somehow inserts a cookie that allows all subsequent req to contain req.user (from which you can get req.user.username, req.isauthenticated, res.redirect etc)
            passport.authenticate('local', { failureRedirect: siteURL+'/' }),
            (req, res, next) => {
                res.json({
                    authenticated: true,
                    user: req.body.username,
                    message: `${req.body.username} has been registered`
                });
            }
        );

        app.post('/changepassword', async (req, res)=>{
            if(req.isAuthenticated()){
                let username = req.user.username; 
                let hash = bcrypt.hashSync(req.body.newPWField, 12);
                await db.collection('users').findOneAndUpdate({username: username}, {
                    $set: { 
                        password: hash
                    } 
                });
                await passport.authenticate('local', { failureRedirect: siteURL+'/' });
                res.json({
                    authenticated: true,
                    user: username,
                    newPWField: "",
                    confirmNewPWField: "",
                    message: "Password changed"
                });
            } else {
                res.json({message: "You are not logged in!"});
            }
        });

        async function verifyAdministrator(user){
            console.log("verifying admin");
            if(user == 'MEVigil'){
                return true;
            }
            let administrators = await db.collection('administrators').find().toArray();
            if(administrators){
                for(let i=0; i<administrators.length; i++){
                    if(user == administrators[i].username){
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }   
        }

        app.post('/admin', async(req, res)=>{
            let verifiedAdmin = await verifyAdministrator(req.user.username);
            console.log(`Admin verified: ${verifiedAdmin}`);
            if(req.isAuthenticated() && verifiedAdmin){
                let adminFunction = req.body.adminFunction;
                let adminWhichUser = req.body.adminWhichUser;
                let message = `${adminFunction} has been carried out on ${adminWhichUser}`;
                console.log(`${adminFunction}: ${adminWhichUser}`);
                switch(adminFunction){
                    case 'addAdmin':
                        let user = await db.collection('administrators').findOne({username: adminWhichUser});
                        if(user){
                            message = `${adminWhichUser} is already an administrator`;
                        } else {
                            await db.collection('administrators').insertOne({
                                username: adminWhichUser
                            });
                        }
                        break;
                    case 'removeAdmin':
                        await db.collection('administrators').findOneAndDelete({username: adminWhichUser});
                        break; 
                    case 'removeUser':
                        await db.collection('users').findOneAndDelete({username: adminWhichUser});
                        break;
                }
                console.log("job done");
                res.json({message: message});
            }
        });
        
        app.listen(3000, () => {
            console.log("Listening on port " + 3000);
        });
    }
});

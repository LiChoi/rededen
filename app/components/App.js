const React = require('react');
const Home = require('./Home').Home;
const About = require('./About').About;
const Forum = require('./Forum').Forum;
const Codex = require('./Codex').Codex;
const Admin = require('./Admin').Admin;
const Lore = require('./Lore').Lore;
const Videos = require('./Videos').Videos;
const Artwork = require('./Artwork').Artwork;
const Router = require('react-router-dom').BrowserRouter;
const Switch = require('react-router-dom').Switch;
const Route = require('react-router-dom').Route; 
const Link = require('react-router-dom').Link;
const Server = require('./Constants').Server;  //The backend server url 
//require('../index.css');
//import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

class Test extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      administrator: "MEVigil",
      message:"",  //Any alerts of messages to show to the site user 
      user: "Anonymous",
      authenticated: false,
      error: "",
      noOfComments: 2,
      comments: [{username: "Anonymous", date: Date.now(), comment:"Please log in to access forum\nYou will need to register to create an account"}],
      newComment: "",
      editComment: false, //if true, then open comment editor, though this is probably unnecessary if we're also specifying which comment to edit (buttonPressed)
      buttonPressed:"", //this is used to identify which comment needs to be edited 
      editedComment:"",
      codexArray: [{tab: "Select Entry", header: "", body: ""}], //load list of all codex entries, need tab field for all entries, only 1 entry will have header and body fields filled in 
      toggleCodexView: {currentTab: "", viewType: "view"}, //viewType values can be: view, edit, new
      codexTabField:"",  
      codexHeaderField:"",
      codexBodyField:"",
      newPWField:"",
      confirmNewPWField:"",
      registerUserField:"",
      registerPWField:"",
      adminFunction: "Nothing",  //What does administrator want to do? i.e. add another administrator, delete user, remove administrator 
      adminWhichUser:"",  //Which user to do it to? 
      emailField:"" //email to send link to download free books 
    };
    this.displayLogin = this.displayLogin.bind(this);
    this.displayRegister = this.displayRegister.bind(this);
    this.displayChangePassword = this.displayChangePassword.bind(this);
    this.displayAlert = this.displayAlert.bind(this);
    this.changeState = this.changeState.bind(this);
    this.apiCall = this.apiCall.bind(this);
  }

  changeState(state){
    this.setState(state);
  }

  getUser() {
    // Fetch does not send cookies. So you should add credentials: 'include'
    fetch(Server+"/initialize", { 
      method: "POST", 
      credentials: 'include',
      body: JSON.stringify({noOfComments: this.state.noOfComments}),
      headers:{
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.status === 200) return response.json();
      throw new Error("failed to authenticate user");
    })
    .then(responseJson => {
        console.log("comments: " + responseJson.comments);
        this.setState({
          authenticated: responseJson.authenticated,
          user: responseJson.user,
          comments: responseJson.comments,
          codexArray: responseJson.codexArray,
          toggleCodexView: {currentTab: responseJson.currentTab, viewType: "view"},
          administrator: responseJson.administrator 
        });
      })
      .catch(error => {
        this.setState({
          authenticated: false,
          error: "Failed to authenticate user"
        });
      });
  }

  apiCall(instruction){
    let json = {}; //initialize the json to send to backend 
    let URL = ""; //initialize api route 
    switch(instruction){
      case 'changePassword':
        if(this.state.newPWField !== this.state.confirmNewPWField){
          this.setState({message: "Your new password does not match the confirmation"});
          return "error"; //This kicks the program out of the apiCall function before api call is made
        } else {
          URL = Server+"/changepassword";
          json = {
            newPWField: this.state.newPWField,
            confirmNewPWField: this.state.confirmNewPWField 
          };
        }
        break;
      case 'register':
        URL = Server+"/register";
        json = {
          username: this.state.registerUserField,
          password: this.state.registerPWField
        }
        break;
    }

    fetch(URL, { 
      method: "POST", 
      credentials: 'include',
      body: JSON.stringify(json),
      headers:{
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.status === 200) return response.json();
      throw new Error("failed to authenticate user");
    })
    .then(responseJson => {
        this.setState({
          authenticated: responseJson.authenticated,
          user: responseJson.user,
          newPWField: "",
          confirmNewPWField: "",
          registerUserField: "",
          registerPWField: "",
          message: responseJson.message
        });
      })
      .catch(error => {
        this.setState({
          authenticated: false,
          error: "Failed to authenticate user"
        });
      });
  }

  componentDidMount() {
    this.getUser();
  }

  displayLogin(authenticated, user){
    if(authenticated && user !== this.state.administrator){
      return (
        <div id='visitor'>
          <div>Welcome</div>
          <div>{user}</div><br></br><br></br>
          <a className='log-in-out' href={Server+'/logout'}>Logout</a>
        </div>
      );
    } else if(authenticated && user == this.state.administrator){
      return (
        <div id='visitor'>
          <div>Welcome</div>
          <div>{user}</div><br></br>
          <Link className='log-in-out' to="/admin">Admin</Link>
          <br></br>
          <a className='log-in-out' href={Server+'/logout'}>Logout</a>
        </div>
      );
    } else {
      return (
        <div id='visitor'>
          <form action={Server+'/login'} method='post'>
            <div><label>User ID:<br></br><input className='login-input' type ='text' name='username'></input></label></div>
            <div><label>Password:<br></br><input className='login-input' type='password' name='password'></input></label></div>
            <br></br>
            <div><button type='submit' className='log-in-out'>Login</button></div>
          </form>
        </div>
      );
    }
  }

  displayRegister(authenticated){
    if(!authenticated){
      return(
        <div id='register'>
          <div><label>New User:<br></br><input className='login-input' type ='text' onChange={(e)=>{this.setState({registerUserField: e.target.value})}} value={this.state.registerUserField} /></label></div>
          <div><label>Password:<br></br><input className='login-input' type='password' onChange={(e)=>{this.setState({registerPWField: e.target.value})}} value={this.state.registerPWField} /></label></div><br></br>
          <div><input className='log-in-out' type='submit' value='Register' onClick={()=>{this.apiCall('register')}} /></div><br></br>  
        </div>
      );    
    }
  }

  displayAlert(message){
    if(message){
      return(
        <div id='alert'>
          <div>{message}</div>
          <div><input type='submit' onClick={()=>{this.setState({message:""})}} value='Close' /></div>
        </div>
      );
    }
  }

  displayChangePassword(authenticated){
    if(authenticated){
      return(
        <div id='change-password'>
          <div><label>New Password:<br></br><input type='password' onChange={(e)=>{this.setState({newPWField: e.target.value})}} value={this.state.newPWField}></input></label></div><br></br>
          <div><label>Confirm New Password:<br></br><input type='password' onChange={(e)=>{this.setState({confirmNewPWField: e.target.value})}} value={this.state.confirmNewPWField}></input></label></div><br></br>
          <div><button className='log-in-out' onClick={()=>{this.apiCall('changePassword')}} type='submit'>Change Password</button></div><br></br>
        </div>
      );
    }
  }

  render() {
    return (
      <Router>
        <div id='container'>
          {this.displayLogin(this.state.authenticated, this.state.user)}
          <br></br>
          {this.displayAlert(this.state.message)}
          <nav id='navlink' className='navlink'>
            <Link className='link' to="/">Home</Link>
            <Link className='link' to="/about">About</Link>
            <Link className='link' to="/codex">Codex</Link>
            <Link className='link' to="/lore">Lore</Link> 
          </nav>
          <nav id='navlink2' className='navlink'>
            <a className='link' href='https://www.amazon.com/dp/B07D56YKNV' target='_blank'>Shop</a>
            <Link className='link' to="/videos">Videos</Link>
            <Link className='link' to="/artwork">Artwork</Link>  
            <Link className='link' to="/forum">Forum</Link>  
          </nav>
          {this.displayRegister(this.state.authenticated)}
          {this.displayChangePassword(this.state.authenticated)}
          <div id='empty1'></div>  
          <div id='empty2'></div>

          <Switch>
            <Route path="/" exact render={(props)=><Home {...props} state={this.state} />}/>
            <Route path="/about" render={(props)=><About {...props} state={this.state} />} />
            <Route path="/forum" render={(props)=><Forum {...props} state={this.state} changeState={this.changeState} />} />
            <Route path="/codex" render={(props)=><Codex {...props} state={this.state} changeState={this.changeState} />}/>
            <Route path="/admin" render={(props)=><Admin {...props} state={this.state}  changeState={this.changeState} />} />
            <Route path="/lore" render={(props)=><Lore {...props} state={this.state}  changeState={this.changeState} />} />
            <Route path="/videos" render={(props)=><Videos {...props} state={this.state}  changeState={this.changeState} />} />
            <Route path="/artwork" render={(props)=><Artwork {...props} state={this.state}  changeState={this.changeState} />} />
          </Switch>
        </div>
      </Router>
    );
  }
}

module.exports = Test;

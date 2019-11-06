import React from 'react';
const Server = require('./Constants').Server;  //The backend server url 

export function Admin(prop){

    function adminApi(prop){
        fetch(Server+"/admin", { 
            method: "POST", 
            credentials: 'include',
            body: JSON.stringify({
              adminFunction: prop.state.adminFunction,
              adminWhichUser: prop.state.adminWhichUser
            }),
            headers:{
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (response.status === 200) return response.json();
            throw new Error("failed to carry out admin function");
          })
          .then(responseJson => {
              prop.changeState({
                message: responseJson.message,
                adminWhichUser: ""
              });
          })
    }

    return (
        <div className='center' id='admin'>
            <div>
                <select className='codex' id="admin-options" onChange={(e)=>{prop.changeState({adminFunction: e.target.value}) }} >  
                    <option value='Nothing'>Select a function</option>      
                    <option value='addAdmin'>Add Administrator</option>
                    <option value='removeAdmin'>Remove Administrator</option>
                    <option value='removeUser'>Remove User</option>
                </select> 
            </div>
            <br></br>
            <div>Username:</div>
            <div><input type='text' onChange={(e)=>{prop.changeState({adminWhichUser: e.target.value})}} value={prop.state.adminWhichUser} ></input></div>
            <br></br>
            <div><input type='submit' value='Submit'onClick={()=>{adminApi(prop)}} /></div>
            <br></br>
            <div>{prop.state.message}</div>
        </div>
    );
}
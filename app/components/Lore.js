import React from 'react';
const Server = require('./Constants').Server;  //The backend server url 

export function Lore(prop){
    function sendEmail(prop){
        fetch(Server+"/email", { 
            method: "POST", 
            credentials: 'include',
            body: JSON.stringify({email: prop.state.emailField}),
            headers:{
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.status === 200) return response.json();
            throw new Error("failed to authenticate user");
        })
        .then(responseJson => {
            prop.changeState({
                message: responseJson.message,
                emailField: ""
            });
        })
    }

    function renderDownloadLinks(prop){
        return(
            <div>
                <div id='subtitle'>Saving Ever After</div>
                <img className='lore-image' src="https://cdn.glitch.com/3f1b8d60-72dd-4749-b52a-b1d788645b26%2FFairy%20Tale%20Land.jpg?v=1567369572073" alt="saving-ever-after"/>
                <div>
                    <p className='lore-synopsis'>A little girl named Princess Lily has lived in Ever After all her life, one hundred years to be exact. 
                        Her father, whose name is Father, created the fairy tale land of Ever After for her and her sister to play in for all time. 
                        All is not as it seems, however. Princess Lily has an inquisitive mind, and she knows that Father is keeping secrets from her. 
                        Her desire to discover the truth propels her on a journey that will take her far beyond the realm of her eternal childhood...</p>    
                </div>
                <div>Provide your email to receive a FREE! copy of Saving Ever After:</div>
                <div>
                    <input type='text' onChange={(e)=>{prop.changeState({emailField: e.target.value})}} value={prop.state.emailField}/>
                    <input type='submit' onClick={()=>{sendEmail(prop)}} value='Send FREE copy'/>
                </div>
                <br></br><br></br>
            </div>
        );
    }

    return (
        <div className='center' id='lore'>
            <div id='book_title'>
                <div id='subtitle'>Chronicles of the</div>
                <div id='series'>RED EDEN</div>
            </div>
            <div id='lore-subtitle2'>Universe</div> 
            {renderDownloadLinks(prop)}
        </div>
    );
}

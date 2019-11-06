import React from 'react';
const Server = require('./Constants').Server;  //The backend server url 

export function Codex(prop){

    function accessCodexDatabase(prop, instruction, data){
        let currentTab = prop.state.toggleCodexView.currentTab;
        if (instruction == 'fetch'){
          currentTab = data; 
          //Need to do this because state doesn't update currentTab in time, which means we're sending the wrong currentTab to server if getting it from state
          //Sure, I can use async wait where the fetch is being called, but then I need to add yet more dependencies to webpack for it to translate async functions
          //And that's just too much trouble, don't want to risk messing up everything else. 
          //It's ridiculous that the babel translator I already installed on webpack doesn't translate async functions. Aboslutely outrageous! 
        }
        fetch(Server+"/accesscodex", { 
            method: "POST", 
            credentials: 'include',
            body: JSON.stringify({
                instruction: instruction, //tell database what to do. COuld be: 'new', 'edit', 'fetch',
                codexTabField: prop.state.codexTabField,
                codexHeaderField: prop.state.codexHeaderField,
                codexBodyField: prop.state.codexBodyField,
                currentTab: currentTab
            }), 
            headers:{
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.status === 200) return response.json();
            throw new Error("Couldn' update codex entry");
        })
        .then(responseJson => {
            prop.changeState({
                codexArray: responseJson.codexArray,
                toggleCodexView: {currentTab: responseJson.currentTab, viewType: "view"}
            });
        })
        .catch(error => {
            console.log("error");
        });
    }

    function updateCodexState(prop, context, data){
        switch (context){
            case 'editCodex':
                prop.changeState({
                    toggleCodexView: {currentTab: prop.state.toggleCodexView.currentTab, viewType: "edit"},
                    codexTabField: data.tab,
                    codexHeaderField: data.header,
                    codexBodyField: data.body
                });
                break;
            case 'newCodex':
                prop.changeState({
                    toggleCodexView: {currentTab: "", viewType: "new"},
                    codexTabField: "",
                    codexHeaderField: "",
                    codexBodyField: ""
                });
                break;
            case 'updateCodexHeader':
                prop.changeState({
                    codexHeaderField: data.target.value
                });
                break;
            case 'updateCodexBody':
                prop.changeState({
                    codexBodyField: data.target.value
                });
                break;
            case 'setCurrentTab':
                if (data!=='Select an entry'){  //If I don't screen for this, 'Select an entry' will be fed into currentTab, which would screw up the script trying to pull that tab which doesn't exist
                    prop.changeState({
                        toggleCodexView: {currentTab: data, viewType: "view"}
                    });   
                    //Need to feed in 'data' (the currentTab) directly because state won't update currentTab in time 
                    accessCodexDatabase(prop, 'fetch', data);
                }
                break;
            case 'updateCodexTab':
                prop.changeState({
                    codexTabField: data.target.value
                }); 
                break;
        }            
    }

    function checkUniqueTab(prop, context){
        let currentTab = prop.state.toggleCodexView.currentTab.trim(); 
        let proposedTab = prop.state.codexTabField.trim(); 
        let tabArray = prop.state.codexArray; 
        let unique; 
        for(let i = 0; i<tabArray.length; i++){ 
            if (proposedTab == tabArray[i].tab.trim()){
                unique = false;
                i = tabArray.length;
            }
            if (i == tabArray.length-1){
                unique = true;
            }
        }
        if(context == 'edit' && proposedTab == currentTab){
            accessCodexDatabase(prop, context);
        } else if (unique){
            accessCodexDatabase(prop, context);
        } else {
            prop.changeState({
                codexTabField: "The tab name must be unique"
            }); 
        }
    }

    function renderCodexButtons(prop, codexEntry){
        let user = prop.state.user;
        let administrator = prop.state.administrator;
        if(user == administrator && prop.state.toggleCodexView.viewType == "view"){
            return (
                <div>
                    <button className='codex-buttons' onClick={()=>{updateCodexState(prop, "editCodex", codexEntry)}}>Edit</button>
                    <button className='codex-buttons' onClick={()=>{updateCodexState(prop, "newCodex", codexEntry)}} >New Entry</button>
                    <button className='codex-buttons' onClick={()=>{accessCodexDatabase(prop, "delete")}} >Delete</button>
                </div>
            );
        } else if(user == administrator && prop.state.toggleCodexView.viewType == "edit"){
            return (
                <div>
                    <button className='codex-buttons' onClick={()=>{ checkUniqueTab(prop, "edit"); }}>Submit Edit</button>
                </div>
            ); 
        } else if(user == administrator && prop.state.toggleCodexView.viewType == "new"){
            return (
                <div>
                    <button className='codex-buttons' onClick={()=>{ checkUniqueTab(prop, "new"); }}>Submit New Entry</button>
                </div>
            ); 
        }
    }

    function renderDropDown(prop){
        let tabArray = prop.state.codexArray.map((x)=>{
            return x.tab;
        });

        return(
            <div id='codex-dropdown-div'>
                <label id="role">Codex Entries<br></br>
                    <select className='codex' id="codex-dropdown" onChange={(e)=>{ updateCodexState(prop, "setCurrentTab", e.target.value); }} >
                        <option value='Select an entry'>Select an entry</option>
                        {tabArray.map((tab,i)=>{
                            return (<option key={"dropdown"+i} value={tab}>{tab}</option>);
                        })}
                    </select> <br></br>
                </label><br></br>
            </div>
        );
    }

    function renderView(prop){
        let currentTab = prop.state.toggleCodexView.currentTab;
        let codexArray = prop.state.codexArray;
        let viewType = prop.state.toggleCodexView.viewType;
        let codexEntryArray = codexArray.filter((entry)=>{
            return entry.tab == currentTab;
        });
        let codexEntry=codexEntryArray[0];

        if(currentTab && viewType=="view"){
            return(
                <div id='codex-view' className='codex'>
                    <div id='codex-header'><h1>{codexEntry.header}</h1></div>
                    <div id='codex-body'>{codexEntry.body}</div>
                    {renderCodexButtons(prop, codexEntry)}
                </div>
            );
        } else if ((currentTab && viewType=="edit") || (!currentTab && viewType=="new")){
            return(
                <div id='codex-editor-div' className='codex'>
                    <div>Select-tab name (must be unique)<br></br><input className='codex-editor' id='codex-tab-editor' onChange={(e)=>{updateCodexState(prop, 'updateCodexTab', e)}} value={prop.state.codexTabField} /></div>
                    <div>Title<br></br><input className='codex-editor' id='codex-header-editor' onChange={(e)=>{updateCodexState(prop, 'updateCodexHeader', e)}} value={prop.state.codexHeaderField} /></div>
                    <div>Body<br></br><textarea className='codex-editor' id='codex-body-editor' onChange={(e)=>{updateCodexState(prop, 'updateCodexBody', e)}} value={prop.state.codexBodyField} /></div>
                    {renderCodexButtons(prop, codexEntry)}
                </div>
            );
        } 
    }

    return (
        <div className='center' id='codex'>
            {renderDropDown(prop)}
            {renderView(prop)}
        </div>
    );
}
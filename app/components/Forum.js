import React from 'react';
const Server = require('./Constants').Server;  //The backend server url 

//I'm keeping the comments below to show that child component can be written as a class and still accept props (must do this.props)
/*
export class Forum extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            noOfComments: this.props.state.noOfComments
        }
        this.moreComments = this.moreComments.bind(this);
    }

    moreComments(){
        this.setState({noOfComments: this.state.noOfComments + 1});
    } 
    
    render(){
        let comments = this.props.state.comments.slice(0, this.state.noOfComments);
    return (
        <div class='center' id='forum'>
            <h1>Welcome to the Forum<br></br>{this.props.state.user}</h1>
            <br></br>
            
            <form action='http://localhost:3000/comment' method='post'>    
                <textarea id='new-comment' name='comment' value='post your comments here'></textarea>
                <div><button className='comment-buttons' type='submit'>Post comment</button></div><br></br>
            </form>
            <div id='comments'>
                {comments.map((x)=>{
                    return( 
                        <div className='comment'>
                            <div>{x.username}: {x.date}</div><br></br>
                            <div>{x.comment}</div> 
                        </div>
                    );
                })} 
            </div>
            <div>
                <button className='comment-buttons' onClick={this.moreComments}>See more comments</button>
            </div>
        </div>
    );
    }
}
*/


export function Forum(prop){
    let comments = prop.state.comments.slice(0, prop.state.noOfComments);
    let options = {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: "2-digit" };
    for(let i = 0; i<comments.length;i++){
        let date = new Date(comments[i].date);
        let dateString = date.toLocaleDateString('en-US', options); 
        comments[i].date = dateString;
    }

    function updateForumState(prop, context, data){
        switch (context){
            case 'updateNewComment': //update the post-comment text area as user is entering new comment 
                prop.changeState({newComment: data});  
                break;
            case 'updateEditedComment': //update the edit-comment text area as user is editing a commment 
                prop.changeState({editedComment: data});
                break;
        }
    }

    function accessForumDatabase(prop, instruction, data){  //data is an object containing any extra info needed 
        //Prepare variables to be included in package to send...
        let comment = data.comment;  //if deleting or editing comment, need to know which comment. Data.comment should contain comment ._id   
        let newComment = ""; 
        let noOfComments = prop.state.noOfComments;
        //And do anything else that needs to be done for each instruction 
        switch (instruction){
            case 'postEditedComment':
                data.event.preventDefault(); //prevents automatic refresh when form is submitted 
                newComment = prop.state.editedComment;
                prop.changeState({editComment: false});
                break;
            case 'loadMoreComments':
                noOfComments += 1; 
                prop.changeState({noOfComments: noOfComments});
                break;
            case 'postNewComment':
                data.event.preventDefault();
                noOfComments += 1;
                newComment = prop.state.newComment;
                prop.changeState({noOfComments: noOfComments, newComment: ""}); //clear the newComment text editor field 
                break;
            //Don't need to do anything extra for case 'deleteComment' 
        }

        fetch(Server+"/accessforum", { 
            method: "POST", 
            credentials: 'include',
            body: JSON.stringify({
                instruction: instruction, 
                comment: comment, 
                noOfComments: noOfComments, 
                newComment: newComment
            }), 
            headers:{
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.status === 200) return response.json();
            throw new Error("Couldn' fetch more comments");
        })
        .then(responseJson => {
            prop.changeState({
                comments: responseJson.comments
            });
        })
        .catch(error => {
            console.log("error");
        });
    }

    function renderEditComment (activate, comment, i) {
        if(activate && i == prop.state.buttonPressed){ // 'i' is the index from the array of comments. i is used to identify which comment needs to be edited 
            return (
                <form onSubmit={(e)=>{accessForumDatabase(prop, 'postEditedComment', {comment: comment, event: e})}}>
                    <textarea id='edit-comment-textarea' className='edit-comment-buttons' type='text' onChange={(e)=>{updateForumState(prop, "updateEditedComment", e.target.value)}} value={prop.state.editedComment} />
                    <br></br>
                    <input id='submit-edit-button' className='edit-comment-buttons' type='submit' value='Submit Edit' />
                </form>
            );
        }
    }

    function renderCommentButtons (user, comment, i){
        if(user == comment.username && comment._id){ //comment._id needed to make sure it's not the default comment by anonymous 
            return (
                <div>
                    {renderEditComment(prop.state.editComment, comment, i)}
                    <button id='delete-comment' className='edit-comment-buttons' onClick={(e)=>{accessForumDatabase(prop, 'deleteComment', {comment: comment, event: "none"})}} >Delete</button>
                    <button id='edit-comment' className='edit-comment-buttons' onClick={()=>{prop.changeState({editComment: true, editedComment: comment.comment, buttonPressed: i})}} >Edit</button>
                </div>
            );
        } else if (user == prop.state.administrator){
            return (
                <div>
                    <button id='delete-comment' className='edit-comment-buttons' onClick={(e)=>{accessForumDatabase(prop, 'deleteComment', {comment: comment, event: "none"})}} >Delete</button>
                </div>
            );
        }
    }

    return (
        <div className='center' id='forum'>
            <h1>Welcome to the Forum<br></br>{prop.state.user}</h1>
            <br></br> 
            <form onSubmit={(e)=>{accessForumDatabase(prop, 'postNewComment', {comment: "", event: e})}}>
                <div><textarea id='new-comment' type='text' onChange={(e)=>{updateForumState(prop, "updateNewComment", e.target.value)}} value={prop.state.newComment} /></div>
                <div><input className='comment-buttons' type='submit' value='Post comment' /></div><br></br>
            </form>
            <div id='comments'>
                {comments.map((x,i)=>{
                    return( 
                        <div className="comment" key={"comment-box"+i} className='comment'>
                            <div key={"comment-name"+i}>{x.username}: {x.date}</div><br></br>
                            <div key={"comment"+i}>{x.comment}</div> 
                            {renderCommentButtons(prop.state.user, x, i)}
                        </div>
                    );
                })} 
            </div>
            <div>
                <button className='comment-buttons' onClick={()=>{accessForumDatabase(prop, 'loadMoreComments', {comment:"", event: "none"})}}>See more comments</button>
            </div>
        </div>
    );
}

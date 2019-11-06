import React from 'react';

export function Artwork(prop){
    return (
        <div className='center' id='artwork'>
            <div id='book_title'>
                <div id='series'>RED EDEN</div>
                <div id='subtitle'>Concept Art Gallery</div>
            </div>
            <br></br><br></br>
            <div >
                <img className='images' src='https://cdn.glitch.com/3f1b8d60-72dd-4749-b52a-b1d788645b26%2FErwinYuAltered.jpg?v=1567394500850'></img>
            </div>
            <div className = 'image-tag'>Erwin Yu</div>
            <br></br><br></br>
            <div >
                <img className='images' src='https://cdn.glitch.com/3f1b8d60-72dd-4749-b52a-b1d788645b26%2FGabriella%20Colour.jpg?v=1567393885892'></img>
            </div>
            <div className = 'image-tag'>Gabriella Romero</div>
        </div>
    );
}

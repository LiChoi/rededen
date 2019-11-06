import React from 'react';

export function About(prop){
    return (
        <div className='center' id='about'>
            <div id='book_title'>
                <div id='series'>RED EDEN</div>
                <div id='subtitle'>Homeworld Bound</div>
            </div>
            <div id='synopsis'>
                <p>
                    In the year 2085, Enon Truss, Father of Mars, led our ancestors to the red planet in pursuit of liberty. 
                    One hundred years after the Exodus, Martian satellites detected multiple nuclear detonations across the homeworld. 
                    For the first time since dawn of the twentieth century, Earth fell into total radio silence.
                </p>
                <p>
                    But on Mars, our ancestors endured. They thrived.
                </p>
                <p>
                    Today, two hundred years after the Exodus, our population is eleven million strong and growing. 
                    We stand ready to retake our homeworld. 
                    In preparation for our journey across deep space, we have sent drones to monitor Earth. 
                    To our surprise, we have discovered that human society has re-emerged from the ashes of nuclear war. 
                    These societies are in the earliest stages of development. 
                    It is as if time has been set back five thousand years.
                </p>
                <p>
                    My name is Jack Hanlon, and I'll be joining the First Expedition. 
                    Our mission: to rebuild human civilization and lead humanity to the stars.
                </p>
            </div>
            <div id='author'>Michael E Vigil</div>
        </div>
    );
}


import React from "react";
import { useDeck } from "mdx-deck"; // Import useDeck

const getDotColor = (i, currentSlideIndex) => {
  return {
    borderRadius: '1rem',
    width: '1rem',
    height: '1rem',
    marginRight: '0.1rem',
    backgroundColor: i === currentSlideIndex ? '#100604' : '#9eafb1'
  };
}

const Indicator = () => {
  const state = useDeck(); // Declare a new state variable
  
  return (
      <div style={{ display: 'flex', width: 'fit-content', marginRight: 'auto', marginLeft: 'auto'}}>
          {Array.from({length: state.length}, (_x, i) => i).map( i =>
          <div style={ getDotColor(i, state.index) }></div>
          )}
      </div>
  );
};

export default Indicator;

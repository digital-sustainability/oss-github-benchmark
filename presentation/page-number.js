import React from "react";
import { useDeck } from "mdx-deck"; // Import useDeck

const PageNumber = () => {
  const state = useDeck(); // Declare a new state variable

  const currentSlide = state.index + 1; // The slides are zero-index
  return (
      <p style={{ fontWeight: 'bold', fontSize: '1.8em', marginRight: '1.5rem' }}>{currentSlide}</p>
  );
};

export default PageNumber;

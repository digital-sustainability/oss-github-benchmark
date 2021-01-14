// layout.js

import React from "react";
import { useDeck } from "mdx-deck"; // Import useDeck

const Layout = ({ children }) => {
  const state = useDeck(); // Declare a new state variable

  const currentSlide = state.index + 1; // The slides are zero-index
  return (
    <>
      <div>{children}</div>
      <footer>
        <span>My Awesome Presentation! 🚀</span>
        <span>{currentSlide}</span>
        <span>@corrinachow</span>
      </footer>
    </>
  );
};

export default Layout;

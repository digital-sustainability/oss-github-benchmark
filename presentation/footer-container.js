import React from "react";
import { useDeck } from "mdx-deck"; // Import useDeck

const FooterContainer = ({ children }) => {

  const styles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  return (
      <div style={ styles }>{ children }</div>

  );
};

export default FooterContainer;

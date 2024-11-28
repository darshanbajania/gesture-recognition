import React from "react";

const GestureComponent = ({ children, itemKey }) => {
  return (
    <div id={"gesture-component-" + itemKey} className="gesture-component">
      {children}
    </div>
  );
};

export default GestureComponent;

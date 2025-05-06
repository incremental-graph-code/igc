import React from "react";
import { RowRendererProps } from "react-arborist";

export const TreeRow = <T,>({
  node,
  innerRef,
  attrs,
  children,
}: RowRendererProps<T>) => {
  // attrs already includes onClick, onContextMenu, aria-*, etc
  return (
    <div
      ref={innerRef}
      {...attrs}
      style={{ ...attrs.style, display: "flex", position: "absolute" }}
    >
      {children}
    </div>
  );
};

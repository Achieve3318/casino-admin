import React from "react";

export default function Card({
  title = " ",
  image = (f) => f,
  imageColor = "pink",
  onClick = (f) => f,
  bgcolor = null,
  ...props
}) {
  return (
    <div
      className={`bg-${bgcolor ? bgcolor : imageColor}-50 drop-shadow-md max-w-xs rounded-xl`}
      onClick={onClick}
      {...props}
    >
      <div className="w-full min-h-24 relative flex rounded-xl">
        {image()}
        <div
          className={`absolute w-full h-full bg-${imageColor}-200 rounded-xl`}
        >
          &nbsp;
        </div>
        <div
          className={`absolute w-full h-full flex justify-center items-center text-${imageColor}-700 font-bold text-2xl`}
        >
          {title}
        </div>
      </div>
      <div className="w-full p-3 flex flex-col">{props.children}</div>
    </div>
  );
}

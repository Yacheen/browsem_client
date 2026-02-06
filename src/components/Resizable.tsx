// import { useRef } from "react";
//
// type Direction =
//   | "top"
//   | "right"
//   | "bottom"
//   | "left"
//   | "top-right"
//   | "top-left"
//   | "bottom-right"
//   | "bottom-left";
//
// interface Props {
//   minWidth: number;
//   minHeight: number;
//   size: { width: number; height: number };
//   setSize: React.Dispatch<
//     React.SetStateAction<{ width: number; height: number }>
//   >;
// }
//
// export function Resizable({ minWidth, minHeight, size, setSize }: Props) {
//   const start = useRef({
//     x: 0,
//     y: 0,
//     width: 0,
//     height: 0,
//     dir: "" as Direction,
//   });
//
//   const onMouseDown = (e: React.MouseEvent, dir: Direction) => {
//     e.preventDefault();
//     e.stopPropagation();
//
//     start.current = {
//       x: e.clientX,
//       y: e.clientY,
//       width: size.width,
//       height: size.height,
//       dir,
//     };
//
//     document.addEventListener("mousemove", onMouseMove);
//     document.addEventListener("mouseup", onMouseUp);
//   };
//
//   const onMouseMove = (e: MouseEvent) => {
//     const dx = e.clientX - start.current.x;
//     const dy = e.clientY - start.current.y;
//
//     // prev in args here
//     setSize(() => {
//       let w = start.current.width;
//       let h = start.current.height;
//
//       if (start.current.dir.includes("right")) w += dx;
//       if (start.current.dir.includes("left")) w -= dx;
//       if (start.current.dir.includes("bottom")) h += dy;
//       if (start.current.dir.includes("top")) h -= dy;
//
//       return {
//         width: Math.max(minWidth, w),
//         height: Math.max(minHeight, h),
//       };
//     });
//   };
//
//   const onMouseUp = () => {
//     document.removeEventListener("mousemove", onMouseMove);
//     document.removeEventListener("mouseup", onMouseUp);
//   };
//
//   return (
//     <>
//       {[
//         "top",
//         "right",
//         "bottom",
//         "left",
//         "top-right",
//         "top-left",
//         "bottom-right",
//         "bottom-left",
//       ].map(dir => (
//         <div
//           key={dir}
//           className={`resize-handle ${dir}`}
//           onMouseDown={e => onMouseDown(e, dir as Direction)}
//         />
//       ))}
//     </>
//   );
// }

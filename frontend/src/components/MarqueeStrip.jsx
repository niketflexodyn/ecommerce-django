// const fontBody = { fontFamily: "font-body" };

// // Single thin announcement bar — brand promises scrolling left.
// const PROMISES = [
//   'Free Shipping Over ₹50',
//   'Secure Checkout',
//   '30-Day Easy Returns',
//   'New Drops Weekly',
//   '24/7 Customer Care',
// ];

// const Star = () => (
//   <span className="mx-5 inline-flex text-gold-600/80" aria-hidden="true">
//     <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
//       <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z" />
//     </svg>
//   </span>
// );

// // Render the list an even number of times so the -50% translate loops
// // seamlessly. The track is split into two identical halves; one half must be
// // at least as wide as the viewport, otherwise the right edge shows an empty
// // gap before the loop resets (the "break"). 6 copies => each half is 3 copies
// // (~3000px), which comfortably covers up to ~3K-wide screens.
// const Row = ({ items, separator: Sep, className, repeat = 6 }) => {
//   const loop = Array.from({ length: repeat }, () => items).flat();
//   return (
//     <div className="flex w-max flex-nowrap" aria-hidden="true">
//       <div className={`marquee-track animate-marquee ${className}`}>
//         {loop.map((item, i) => (
//           <span key={i} className="flex items-center whitespace-nowrap">
//             <span>{item}</span>
//             <Sep />
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default function MarqueeStrip() {
//   return (
//     <section className="relative overflow-hidden bg-plum-950 py-1.5 text-gold-500 font-body">
//       {/* Edge fades so items dissolve in/out instead of hard-cutting */}
//       <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-plum-950 to-transparent sm:w-20" />
//       <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-plum-950 to-transparent sm:w-20" />

//       <div className="marquee-pause relative select-none">
//         <Row
//           items={PROMISES}
//           separator={Star}
//           className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold-500 sm:text-xs"
//         />
//       </div>
//     </section>
//   );
// }
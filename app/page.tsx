
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/editor');
}
// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { motion, useScroll, useTransform } from "framer-motion";
// import { Book, Leaf, Wind, Mountain, Sparkles } from "lucide-react";

// export default function HomePage() {
//   const [mounted, setMounted] = useState(false);
//   const { scrollYProgress } = useScroll();
//   const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-green-50 flex items-center justify-center">
//         <div className="text-gray-400 font-serif">불러오는 중...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-green-50/30 relative overflow-hidden">
//       {/* 자연스러운 배경 레이어 */}
//       <div className="fixed inset-0 pointer-events-none">
//         <div className="absolute top-0 left-0 w-full h-full bg-[url('/textures/paper.png')] opacity-[0.02]" />
//         <motion.div 
//           style={{ opacity }}
//           className="absolute top-40 right-20 w-96 h-96 bg-moss/10 rounded-full blur-3xl"
//         />
//         <motion.div 
//           style={{ opacity }}
//           className="absolute bottom-40 left-20 w-80 h-80 bg-leaf/10 rounded-full blur-3xl"
//         />
//       </div>

//       {/* 헤더 */}
//       <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/40 border-b border-moss/10">
//         <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             className="flex items-center space-x-3"
//           >
//             <div className="w-10 h-10 rounded-lg bg-moss/10 flex items-center justify-center">
//               <Book className="w-5 h-5 text-moss" strokeWidth={1.5} />
//             </div>
//             <div>
//               <span className="text-xl font-serif font-bold text-gray-800">Bookend</span>
//               <p className="text-[10px] text-gray-500 -mt-0.5">자연에 담다</p>
//             </div>
//           </motion.div>

//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             className="flex items-center gap-4"
//           >
//             <Link
//               href="/editor"
//               className="px-6 py-2.5 rounded-lg border border-moss/30 text-moss font-medium text-sm
//                        hover:bg-moss/5 transition-all duration-300"
//             >
//               글쓰기 시작
//             </Link>
//           </motion.div>
//         </nav>
//       </header>

//       {/* 히어로 섹션 */}
//       <section className="relative pt-40 pb-32 px-6">
//         <div className="container mx-auto max-w-6xl">
//           <motion.div
//             initial={{ opacity: 0, y: 40 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 1, ease: "easeOut" }}
//             className="text-center mb-20"
//           >
//             {/* 상단 태그 */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-moss/5 border border-moss/10 mb-8"
//             >
//               <Leaf className="w-4 h-4 text-moss" strokeWidth={1.5} />
//               <span className="text-sm text-gray-600 font-medium">자연처럼 늘 곁에</span>
//             </motion.div>

//             {/* 메인 타이틀 */}
//             <h1 className="text-6xl md:text-7xl font-serif font-bold mb-8 leading-tight text-gray-900">
//               <span className="block mb-3">자연 속</span>
//               <span className="block text-moss">서재</span>
//             </h1>

//             <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-12 font-serif">
//               공기처럼 자연스럽게, 물처럼 편안하게.<br />
//               당신의 글쓰기가 숨 쉬는 공간.
//             </p>

//             {/* CTA 버튼 */}
//             <Link
//               href="/editor"
//               className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-moss text-white font-medium text-lg
//                        shadow-lg shadow-moss/20 hover:shadow-xl hover:shadow-moss/30 hover:-translate-y-1 
//                        transition-all duration-300"
//             >
//               <Book className="w-5 h-5" />
//               <span>글쓰기 시작하기</span>
//             </Link>
//           </motion.div>

//           {/* 자연 요소 카드 */}
//           <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
//             <NatureCard
//               icon={<Wind className="w-8 h-8 text-moss" strokeWidth={1.5} />}
//               title="공기처럼"
//               description="늘 곁에 있지만 의식하지 못하는, 자연스러운 글쓰기 환경"
//               delay={0.3}
//             />
//             <NatureCard
//               icon={<Mountain className="w-8 h-8 text-moss" strokeWidth={1.5} />}
//               title="산처럼"
//               description="묵직하고 안정적인, 당신의 생각을 지탱하는 든든한 기반"
//               delay={0.4}
//             />
//             <NatureCard
//               icon={<Sparkles className="w-8 h-8 text-moss" strokeWidth={1.5} />}
//               title="이슬처럼"
//               description="필요한 순간 조용히 나타나는, 섬세한 AI 도움"
//               delay={0.5}
//             />
//           </div>
//         </div>
//       </section>

//       {/* 철학 섹션 */}
//       <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-moss/5 to-transparent">
//         <div className="container mx-auto max-w-4xl">
//           <motion.div
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.8 }}
//             className="text-center mb-16"
//           >
//             <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">
//               자연의 지혜
//             </h2>
//             <p className="text-lg text-gray-600">
//               북앤드가 품은 7가지 철학
//             </p>
//           </motion.div>

//           <div className="space-y-6">
//             {philosophies.map((phil, index) => (
//               <PhilosophyCard key={index} philosophy={phil} index={index} />
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="relative py-12 px-6 border-t border-moss/10 bg-white/40 backdrop-blur-sm">
//         <div className="container mx-auto text-center">
//           <div className="flex items-center justify-center gap-2 mb-4">
//             <Book className="w-5 h-5 text-moss" strokeWidth={1.5} />
//             <span className="font-serif font-bold text-gray-800">Bookend</span>
//           </div>
//           <p className="text-sm text-gray-600 mb-2">
//             자연에 담긴 글쓰기 공간
//           </p>
//           <p className="text-xs text-gray-500">
//             © 2024 Bookend. 자연스럽게 성장하는 인사이트.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }

// // 자연 요소 카드 컴포넌트
// function NatureCard({ icon, title, description, delay }: any) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 30 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true }}
//       transition={{ delay, duration: 0.6 }}
//       whileHover={{ y: -8 }}
//       className="group p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-moss/10 
//                  hover:border-moss/30 hover:shadow-xl hover:shadow-moss/5 transition-all duration-300"
//     >
//       <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
//         {icon}
//       </div>
//       <h3 className="text-xl font-serif font-semibold text-gray-900 mb-3">
//         {title}
//       </h3>
//       <p className="text-gray-600 leading-relaxed text-sm">
//         {description}
//       </p>
//     </motion.div>
//   );
// }

// // 철학 카드 컴포넌트
// function PhilosophyCard({ philosophy, index }: any) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, x: -20 }}
//       whileInView={{ opacity: 1, x: 0 }}
//       viewport={{ once: true }}
//       transition={{ delay: index * 0.1, duration: 0.5 }}
//       className="p-6 rounded-xl bg-white/60 backdrop-blur-sm border-l-4 
//                  hover:bg-white/80 transition-all duration-300"
//       style={{ borderLeftColor: philosophy.color }}
//     >
//       <div className="flex items-start gap-4">
//         <span className="text-3xl flex-shrink-0">{philosophy.icon}</span>
//         <div className="flex-1">
//           <h4 className="font-serif font-semibold text-lg text-gray-900 mb-2">
//             {philosophy.title}
//           </h4>
//           <p className="text-sm text-gray-600 leading-relaxed">
//             {philosophy.description}
//           </p>
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// // 철학 데이터
// const philosophies = [
//   {
//     icon: "🌬️",
//     title: "Ambient - 공기처럼 편안한 추천",
//     description: "숨 쉬듯 자연스럽게. 자주 쓰는 기능이 늘 가까이.",
//     color: "#7A9B76",
//   },
//   {
//     icon: "🔄",
//     title: "Echo - 메아리의 기억",
//     description: "산의 메아리처럼. 이전 행동이 다음 세션에 반영.",
//     color: "#7DD3C0",
//   },
//   {
//     icon: "👻",
//     title: "Ghost Preview - 안개 속 미리보기",
//     description: "아침 안개처럼. 결과를 미리 보고 선택.",
//     color: "#A5C9E6",
//   },
//   {
//     icon: "⏰",
//     title: "Temporal Flow - 하루의 호흡",
//     description: "자연의 리듬에 맞춰. 시간대별 맞춤 추천.",
//     color: "#F4D03F",
//   },
//   {
//     icon: "🔁",
//     title: "Soft Loop - 계절의 순환",
//     description: "계절처럼 반복되되, 매번 다르게.",
//     color: "#E8AEB7",
//   },
//   {
//     icon: "🌱",
//     title: "Quiet Growth - 조용한 성장",
//     description: "나무가 자라듯. 천천히, 그러나 확실하게.",
//     color: "#9DC88D",
//   },
//   {
//     icon: "🌙",
//     title: "Context Echo - 달빛의 속삭임",
//     description: "달빛이 비추듯. 당신의 글에서 발견되는 가능성.",
//     color: "#8B7355",
//   },
// ];
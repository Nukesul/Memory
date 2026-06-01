import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import yadaPhoto from "./photo/yada.jpg";
import aun from "./photo/aun.jpg";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CLASS_DATA = {
  school: "Sakura Japanese Language Academy",
  class: "Advanced Intensive Course — Class 3B",
  year: "2024–2025",
  city: "Kyoto, Japan",
  graduationDate: "2025-03-20",
  groupQuote: "言葉は橋 — Words are bridges.",
  timeCapsula: "Open this in 10 years and remember how young we were.",
};

// Unsplash portrait photos — each student has 2 different photos
const PHOTO_SETS = [
  // Kyrgyzstan
  ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=711&fit=crop&crop=top"],
  // Indonesia
  ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1529505534180-8d9b1430b21c?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=711&fit=crop&crop=top"],
  // Vietnam
  [aun, aun],
  [aun, aun],
  // Sri Lanka
  ["https://images.unsplash.com/photo-1546961342-ea5f62d51c85?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400&h=711&fit=crop&crop=top"],
  // China
  ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&h=711&fit=crop&crop=top"],
  // Nepal
  ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1509460913899-515f1df34fea?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=400&h=711&fit=crop&crop=top"],
  // Mongolia
  ["https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1507152927626-84cf901b6572?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1548544149-4835e62ee5b3?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=711&fit=crop&crop=top"],
  // Myanmar
  [yadaPhoto, yadaPhoto],
  // Extra slot for 20th if needed
  ["https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1523006535-31aee3e7a2a3?w=400&h=711&fit=crop&crop=top"],
];

const STUDENTS = [
  // Kyrgyzstan (4)
  { id: 1, name: "Asyl Mamatova", country: "Kyrgyzstan", flag: "🇰🇬", initials: "AM", color: "#e8d5c4", dream: "Become a Japanese-Kyrgyz interpreter for diplomatic missions", quote: "Жол — жүрүүгө. — The road is for those who walk it.", memory: "Making traditional Kyrgyz tea for the whole class and watching everyone's eyes light up.", emoji: "🏔️", role: "Cultural Ambassador", photoSet: PHOTO_SETS[0] },
  { id: 2, name: "Nursultan Bekov", country: "Kyrgyzstan", flag: "🇰🇬", initials: "NB", color: "#c4d5e8", dream: "Build a tech bridge between Central Asia and Japan", quote: "Сабыр түбү — сары алтын. — Patience is gold.", memory: "Staying up until 3am coding a class website with Sensei's blessing.", emoji: "💻", role: "Tech Lead", photoSet: PHOTO_SETS[1] },
  { id: 3, name: "Madara Sulaimanova", country: "Kyrgyzstan", flag: "🇰🇬", initials: "MS", color: "#d5c4e8", dream: "Open a Kyrgyz cultural center in Osaka", quote: "Эл — деңиз. — The people are an ocean.", memory: "Teaching the class Kyrgyz folk dance at the cultural festival night.", emoji: "🎭", role: "Cultural Director", photoSet: PHOTO_SETS[2] },
  { id: 4, name: "Baiel Dzhaksybekov", country: "Kyrgyzstan", flag: "🇰🇬", initials: "BD", color: "#c4e8d5", dream: "Write a manga series set in the Tian Shan mountains", quote: "Ар бир адам — бир дүйнө. — Every person is a whole world.", memory: "Sketching manga panels in every café from Kyoto to Nara.", emoji: "✏️", role: "Class Manga Artist", photoSet: PHOTO_SETS[3] },
  // Indonesia (3)
  { id: 5, name: "Anjery Putri", country: "Indonesia", flag: "🇮🇩", initials: "AP", color: "#e8c4c4", dream: "Fashion designer blending batik patterns with Japanese aesthetics", quote: "Banyak jalan menuju Roma. — Many roads lead to Rome.", memory: "Finding batik fabric at a Kyoto market and making the whole class scarves.", emoji: "🧣", role: "Style Maven", photoSet: PHOTO_SETS[4] },
  { id: 6, name: "Nabira Salsabila", country: "Indonesia", flag: "🇮🇩", initials: "NS", color: "#e8dac4", dream: "Culinary journalist covering Southeast Asian street food in Japan", quote: "Siapa yang menanam, dia yang menuai. — Reap what you sow.", memory: "Hosting a secret rendang tasting session in the dorm kitchen at midnight.", emoji: "🌶️", role: "Food Correspondent", photoSet: PHOTO_SETS[5] },
  { id: 7, name: "Chacha Maharani", country: "Indonesia", flag: "🇮🇩", initials: "CM", color: "#c4e8e8", dream: "Produce a documentary on Indonesian diaspora in Japan", quote: "Ringan sama dijinjing, berat sama dipikul. — Share burdens and joys together.", memory: "Filming every class moment — she always had her camera ready.", emoji: "🎬", role: "Class Filmmaker", photoSet: PHOTO_SETS[6] },
  // Vietnam (2)
  { id: 8, name: "Hieu Nguyen", country: "Vietnam", flag: "🇻🇳", initials: "HN", color: "#d5e8c4", dream: "Software engineer at a Japanese robotics company", quote: "Có công mài sắt, có ngày nên kim. — Perseverance turns iron into a needle.", memory: "Solving a kanji riddle that stumped the entire class in under a minute.", emoji: "🤖", role: "Logic Master", photoSet: PHOTO_SETS[7] },
  { id: 9, name: "Aun Tran", country: "Vietnam", flag: "🇻🇳", initials: "AT", color: "#e8c4d5", dream: "Architect designing bamboo-inspired buildings across Asia", quote: "Đi một ngày đàng, học một sàng khôn. — One day of travel teaches a basketful of wisdom.", memory: "Building a tiny bamboo model of Sensei's house as a goodbye gift.", emoji: "🏗️", role: "Class Builder", photoSet: PHOTO_SETS[8] },
  // Sri Lanka (2)
  { id: 10, name: "Otchini Perera", country: "Sri Lanka", flag: "🇱🇰", initials: "OP", color: "#c4cce8", dream: "Tea sommelier introducing Sri Lankan tea culture to Japan", quote: "දිනෙන් දිනෙට හොඳ. — Better day by day.", memory: "Brewing Ceylon tea for Sensei and watching her say it rivaled Japanese tea.", emoji: "🍵", role: "Tea Ceremony Host", photoSet: PHOTO_SETS[9] },
  { id: 11, name: "Rukumaru Silva", country: "Sri Lanka", flag: "🇱🇰", initials: "RS", color: "#e8e4c4", dream: "Marine biologist protecting Sri Lankan and Japanese coral reefs", quote: "දිය ගොඩ දෙකෙහිම — At home in water and on land.", memory: "Leading the class snorkeling trip in Okinawa and naming every fish in Japanese.", emoji: "🐠", role: "Ocean Guardian", photoSet: PHOTO_SETS[10] },
  // China (1)
  { id: 12, name: "Ko Mingzhi", country: "China", flag: "🇨🇳", initials: "KM", color: "#e4c4e8", dream: "Calligrapher bridging Chinese and Japanese brush art traditions", quote: "千里之行，始於足下。 — A journey of a thousand miles begins with a single step.", memory: "Hosting a midnight calligraphy session that lasted until sunrise.", emoji: "🖌️", role: "Master Calligrapher", photoSet: PHOTO_SETS[11] },
  // Nepal (2)
  { id: 13, name: "Sharuri Tamang", country: "Nepal", flag: "🇳🇵", initials: "ST", color: "#c4e4e8", dream: "Mountain guide leading treks between the Himalayas and Japanese Alps", quote: "जहाँ चाह, त्यहाँ बाह. — Where there's a will, there's a way.", memory: "Teaching sunrise meditation on the roof of our dorm every Monday.", emoji: "🏔️", role: "Sunrise Guide", photoSet: PHOTO_SETS[12] },
  { id: 14, name: "Sukura Shrestha", country: "Nepal", flag: "🇳🇵", initials: "SS", color: "#e8ccc4", dream: "Child educator building bilingual schools in rural Nepal", quote: "ज्ञान नै शक्ति हो। — Knowledge is power.", memory: "Organizing the class tutoring circle that helped everyone pass the N3 exam.", emoji: "📚", role: "Class Tutor", photoSet: PHOTO_SETS[13] },
  // Mongolia (4)
  { id: 15, name: "Unda Gantulga", country: "Mongolia", flag: "🇲🇳", initials: "UG", color: "#cce8c4", dream: "Veterinarian caring for endangered wildlife across the steppe", quote: "Эрдэм номын эх — сурах явдал. — The mother of knowledge is study.", memory: "Bringing traditional Mongolian airag to the cultural night and daring everyone to try it.", emoji: "🐎", role: "Wildlife Advocate", photoSet: PHOTO_SETS[14] },
  { id: 16, name: "Azjargal Batbold", country: "Mongolia", flag: "🇲🇳", initials: "AB", color: "#c8c4e8", dream: "Fashion designer weaving Mongolian felt art into modern collections", quote: "Хүнд хэцүүгийн цаана аз жаргал байдаг. — Happiness lies beyond hardship.", memory: "Sewing matching felt badges for the whole class by hand overnight.", emoji: "🧵", role: "Craft Queen", photoSet: PHOTO_SETS[15] },
  { id: 17, name: "Beruguti Namsrai", country: "Mongolia", flag: "🇲🇳", initials: "BN", color: "#e8e0c4", dream: "Music producer blending Mongolian throat singing with J-pop", quote: "Дуу хоолой — сэтгэлийн хэл. — Voice is the language of the soul.", memory: "Performing a live throat singing duet with the school's traditional music club.", emoji: "🎶", role: "Music Soul", photoSet: PHOTO_SETS[16] },
  { id: 18, name: "Otogo Chimeddorj", country: "Mongolia", flag: "🇲🇳", initials: "OC", color: "#c4e8cc", dream: "Diplomat fostering Mongolia-Japan cultural exchanges", quote: "Нэгдсэн нь хүчтэй. — United we are strong.", memory: "Organizing the class's end-of-year talent show from scratch in three days.", emoji: "🎪", role: "Chief Organizer", photoSet: PHOTO_SETS[17] },
  // Myanmar (1)
  { id: 19, name: "Yadana Kyaw", country: "Myanmar", flag: "🇲🇲", initials: "YK", color: "#e8d0c4", dream: "Journalist bringing Myanmar stories to a Japanese-speaking world", quote: "ကြိုးစားမှ အောင်မြင်မည်။ — Effort brings success.", memory: "Reading her own Burmese poetry translated into Japanese at the school festival.", emoji: "📜", role: "Class Poet", photoSet: PHOTO_SETS[18] },
  // 20th student
  { id: 20, name: "Arai Somsak", country: "Thailand", flag: "🇹🇭", initials: "AS", color: "#c4d8e8", dream: "Chef opening a Thai-Japanese fusion restaurant in Kyoto", quote: "ทำดีได้ดี — Do good, receive good.", memory: "Cooking pad thai for 25 people in the dorm kitchen on New Year's Eve.", emoji: "🍜", role: "Class Chef", photoSet: PHOTO_SETS[19] },
];

const FUNNY_QUOTES = [
  { quote: "すみません is the most powerful word in Japanese. Also, すみません。", author: "Class consensus, Week 2" },
  { quote: "Sensei asked who forgot their homework. We all said '電車が遅れました' (the train was late).", author: "Every Monday morning" },
  { quote: "At some point we stopped translating and started just… living here.", author: "Class diary, Month 4" },
  { quote: "The konbini near school has seen things. Things we will never speak of.", author: "Anonymous" },
  { quote: "We came for the language. We stayed for the ramen, the festivals, and each other.", author: "Graduation speech draft #7" },
  { quote: "Our group chat went from 'what is this kanji?' to 'anyone else crying at this sunset?'", author: "The WhatsApp group" },
  { quote: "Level 1: ordering at a restaurant. Level 99: understanding train announcements. We did it.", author: "Graduation ceremony" },
  { quote: "I don't know if I learned more Japanese or more about myself. Probably both.", author: "Month 8 journal entry" },
];

const GALLERY_ITEMS = [
  { id: 1, label: "First snow in Kyoto", emoji: "❄️", bg: "#e8f0f8", note: "January morning, 6:04am", rotate: -2 },
  { id: 2, label: "Gion Festival night", emoji: "🏮", bg: "#f8ece8", note: "Summer, unforgettable", rotate: 1.5 },
  { id: 3, label: "Sakura season window", emoji: "🌸", bg: "#f8e8f0", note: "Classroom view, March", rotate: -1 },
  { id: 4, label: "Konbini late-night run", emoji: "🥟", bg: "#e8f8ee", note: "Every study night, 11pm", rotate: 2 },
  { id: 5, label: "Arashiyama bamboo walk", emoji: "🎋", bg: "#eef8e8", note: "October weekend trip", rotate: -1.5 },
  { id: 6, label: "Train station goodbyes", emoji: "🚃", bg: "#e8eef8", note: "Too many of these", rotate: 1 },
  { id: 7, label: "Cultural festival day", emoji: "🎉", bg: "#f8f0e8", note: "We danced for 3 hours", rotate: -2.5 },
  { id: 8, label: "Zen garden meditation", emoji: "⛩️", bg: "#f0e8f8", note: "Ryoan-ji, 6am silence", rotate: 1.5 },
  { id: 9, label: "Year-end class dinner", emoji: "🍱", bg: "#f8eee8", note: "Someone cried (everyone)", rotate: -1 },
  { id: 10, label: "Nara deer encounter", emoji: "🦌", bg: "#eef0e8", note: "RIP someone's snacks", rotate: 2.5 },
  { id: 11, label: "Calligraphy class", emoji: "🖌️", bg: "#f0e8ee", note: "90-year-old sensei", rotate: -2 },
  { id: 12, label: "Osaka aquarium trip", emoji: "🐠", bg: "#e8f4f8", note: "Zero studying happened", rotate: 1 },
];

const MEMORY_CAPSULE = [
  "By the time you read this, your Japanese is probably perfect.",
  "Remember the day it clicked — when you stopped translating and just understood.",
  "You were brave enough to leave home and build a new one, even temporarily.",
  "Keep the friends you made here. Distance cannot erase what you built.",
  "These people believed in you on your worst days. They celebrated every small victory with you.",
  "これはあなたの物語の小さな章です — This is a small chapter of your story.",
];

const MINI_VIDEOS = [
  { id: 1, title: "Class intro day", duration: "2:14", emoji: "🎬", color: "#f0e8f8", note: "First day jitters, last day tears" },
  { id: 2, title: "Bon Odori dancing", duration: "1:47", emoji: "🏮", color: "#f8ece8", note: "Everyone learned the steps" },
  { id: 3, title: "Cooking class chaos", duration: "3:02", emoji: "🍙", color: "#e8f8ee", note: "Pasta meets onigiri" },
  { id: 4, title: "Graduation ceremony", duration: "8:30", emoji: "🎓", color: "#e8eef8", note: "The tissues ran out" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: linear-gradient(160deg, #faf8f5 0%, #f5f0ea 40%, #eaeaf5 100%);
    min-height: 100vh;
    color: #3a3a3a;
  }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(180,160,140,0.25); border-radius: 3px; }
  
  @keyframes float { 0%,100%{transform:translateY(0) rotate(0)} 33%{transform:translateY(-14px) rotate(1deg)} 66%{transform:translateY(-7px) rotate(-0.5deg)} }
  @keyframes floatSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(32px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes sakuraFall { 0%{transform:translateY(-20px) rotate(0deg) translateX(0);opacity:0} 10%{opacity:0.7} 90%{opacity:0.5} 100%{transform:translateY(110vh) rotate(720deg) translateX(60px);opacity:0} }
  @keyframes drift { 0%,100%{transform:translateX(0) rotate(0) scale(1)} 25%{transform:translateX(15px) rotate(90deg) scale(1.05)} 50%{transform:translateX(5px) rotate(180deg) scale(0.95)} 75%{transform:translateX(-10px) rotate(270deg) scale(1.02)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.97)} }
  @keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes photoFlip { 0%{opacity:1;transform:scale(1)} 40%{opacity:0;transform:scale(0.92)} 60%{opacity:0;transform:scale(0.92)} 100%{opacity:1;transform:scale(1)} }
  
  input:focus, textarea:focus { outline: none; box-shadow: 0 0 0 3px rgba(160,140,120,0.15); }
  button { font-family: 'DM Sans', -apple-system, sans-serif; }
  section { scroll-margin-top: 72px; }
  
  .hover-lift { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .hover-lift:hover { transform: translateY(-8px) scale(1.02); }

  .student-card-img-wrap { position: relative; width: 100%; padding-bottom: 133%; overflow: hidden; }
  .student-card-img-wrap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; }
  
  .glass {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.9);
  }
  
  .nav-pill {
    background: transparent; border: none; border-radius: 50px;
    padding: 6px 16px; cursor: pointer; font-size: 13px; font-weight: 400;
    color: #888; transition: all 0.2s ease; font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .nav-pill:hover { background: rgba(0,0,0,0.05); color: #444; }
  .nav-pill.active { background: rgba(0,0,0,0.08); color: #1a1a1a; font-weight: 500; }
  
  .photo-toggle-btn {
    transition: all 0.2s ease;
  }
  .photo-toggle-btn:hover {
    background: rgba(255,255,255,0.95) !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
    transform: scale(1.05);
  }
`;

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function SakuraPetal({ style }) {
  return (
    <div style={{
      position: "absolute", fontSize: style.size,
      animation: `sakuraFall ${style.duration}s ease-in infinite`,
      animationDelay: `${style.delay}s`,
      left: style.left, top: "-30px", opacity: 0, pointerEvents: "none", zIndex: 1,
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))", ...style,
    }}>🌸</div>
  );
}

function FloatingOrb({ style }) {
  return (
    <div style={{
      position: "absolute", borderRadius: "50%", opacity: 0.18,
      animation: `float ${style.duration}s ease-in-out infinite`,
      animationDelay: `${style.delay}s`,
      filter: "blur(24px)", pointerEvents: "none", ...style,
    }} />
  );
}

// ─── PHOTO AVATAR (with click-to-flip) ───────────────────────────────────────
function PhotoAvatar({ student, size = 80, flippable = false }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  const flip = (e) => {
    if (!flippable || !student.photoSet) return;
    e.stopPropagation();
    setFlipping(true);
    setTimeout(() => {
      setPhotoIdx(i => (i + 1) % 2);
      setFlipping(false);
    }, 220);
  };

  if (student.photoSet) {
    return (
      <div
        onClick={flip}
        style={{
          width: size, height: size, borderRadius: "50%",
          overflow: "hidden", flexShrink: 0, position: "relative",
          border: `${Math.max(2, size * 0.03)}px solid rgba(255,255,255,0.9)`,
          boxShadow: `0 ${size * 0.05}px ${size * 0.3}px ${student.color}55, 0 2px 8px rgba(0,0,0,0.08)`,
          cursor: flippable ? "pointer" : "default",
        }}
      >
        <img
          src={student.photoSet[photoIdx]}
          alt={student.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: flipping ? 0 : 1,
            transform: flipping ? "scale(0.9)" : "scale(1)",
            transition: "opacity 0.22s ease, transform 0.22s ease",
          }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.style.background = `radial-gradient(135deg, ${student.color} 0%, ${student.color}bb 100%)`;
          }}
        />
        {flippable && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0)",
            transition: "background 0.2s",
            borderRadius: "50%",
          }} />
        )}
      </div>
    );
  }

  // Fallback initials avatar
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(135deg, ${student.color} 0%, ${student.color}bb 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.27, fontWeight: 600, color: "#4a4a4a",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      flexShrink: 0, letterSpacing: 1,
      border: `${Math.max(2, size * 0.03)}px solid rgba(255,255,255,0.85)`,
      boxShadow: `0 ${size * 0.05}px ${size * 0.3}px ${student.color}55, 0 2px 8px rgba(0,0,0,0.06)`,
      position: "relative",
    }}>
      {student.initials}
      <div style={{
        position: "absolute", bottom: size * 0.02, right: size * 0.02,
        fontSize: size * 0.22, lineHeight: 1,
      }}>{student.flag}</div>
    </div>
  );
}

// ─── AVATAR (small, no flip) ──────────────────────────────────────────────────
function Avatar({ student, size = 80 }) {
  return <PhotoAvatar student={student} size={size} flippable={false} />;
}

// ─── STUDENT CARD ─────────────────────────────────────────────────────────────
function StudentCard({ student, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  const currentPhoto = student.photoSet ? student.photoSet[photoIdx] : null;

  const switchPhoto = (e) => {
    e.stopPropagation();
    if (student.photoSet) setPhotoIdx(i => (i + 1) % 2);
  };

  return (
    <div
      onClick={() => onClick(student)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 28px 56px rgba(0,0,0,0.18), 0 0 0 1px ${student.color}60`
          : "0 4px 20px rgba(0,0,0,0.08)",
        animation: "fadeInUp 0.5s ease both",
        background: "#fff",
      }}
    >
      {/* ── Portrait photo (9:16) ── */}
      <div style={{
        position: "relative",
        width: "100%",
        paddingBottom: "133%", /* 3:4 ratio — tall portrait */
        overflow: "hidden",
        background: `linear-gradient(160deg, ${student.color}cc 0%, ${student.color}66 100%)`,
      }}>
        {currentPhoto && !imgError ? (
          <img
            src={currentPhoto}
            alt={student.name}
            onError={() => setImgError(true)}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top center",
              transition: "transform 0.6s ease, opacity 0.3s ease",
              transform: hovered ? "scale(1.07)" : "scale(1)",
              display: "block",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 8,
          }}>
            <div style={{ fontSize: 52 }}>{student.emoji}</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 36, fontWeight: 700, color: "rgba(60,50,40,0.6)",
            }}>{student.initials}</div>
          </div>
        )}

        {/* Gradient overlay at bottom of photo */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "55%",
          background: "linear-gradient(to top, rgba(10,8,6,0.72) 0%, rgba(10,8,6,0.18) 60%, transparent 100%)",
          transition: "opacity 0.3s ease",
          opacity: hovered ? 1 : 0.85,
        }} />

        {/* Flag badge */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderRadius: 50, padding: "4px 10px",
          fontSize: 13, display: "flex", alignItems: "center", gap: 5,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}>
          <span>{student.flag}</span>
          <span style={{ fontSize: 10, color: "#777", letterSpacing: 0.3 }}>{student.country}</span>
        </div>

        {/* Photo switch button — visible on hover */}
        {student.photoSet && (
          <button
            onClick={switchPhoto}
            style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(8px)",
              border: "none", borderRadius: 50,
              width: 30, height: 30, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.25s ease, transform 0.25s ease",
              transform: hovered ? "scale(1)" : "scale(0.8)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
            title="Switch photo"
          >📸</button>
        )}

        {/* Name & role overlaid on photo bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "1rem 1rem 0.85rem",
          zIndex: 2,
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 17, fontWeight: 700, color: "#fff",
            lineHeight: 1.2, marginBottom: 4,
            textShadow: "0 1px 6px rgba(0,0,0,0.3)",
          }}>{student.name}</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: student.color + "bb",
            backdropFilter: "blur(6px)",
            borderRadius: 50, padding: "2px 9px",
            fontSize: 10, color: "#fff", letterSpacing: 0.5,
            fontWeight: 500,
          }}>
            <span>{student.emoji}</span>
            {student.role}
          </div>
        </div>
      </div>

      {/* ── Info strip below photo ── */}
      <div style={{
        padding: "0.85rem 1rem 0.95rem",
        background: "#fff",
        borderTop: `2px solid ${student.color}44`,
      }}>
        <div style={{
          fontSize: 11, color: "#999", fontStyle: "italic", lineHeight: 1.5,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          "{student.quote.length > 72 ? student.quote.slice(0, 72) + "…" : student.quote}"
        </div>
        <div style={{
          marginTop: 8, fontSize: 10, color: hovered ? student.color : "#ccc",
          letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600,
          transition: "color 0.3s ease",
        }}>
          {hovered ? "View profile →" : "· · ·"}
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT MODAL ────────────────────────────────────────────────────────────
function StudentModal({ student, onClose, onNext, onPrev }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  // Reset photo when student changes
  useEffect(() => { setPhotoIdx(0); setFlipping(false); }, [student.id]);

  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose, onNext, onPrev]);

  const flipPhoto = () => {
    if (!student.photoSet) return;
    setFlipping(true);
    setTimeout(() => {
      setPhotoIdx(i => (i + 1) % 2);
      setFlipping(false);
    }, 220);
  };

  const currentPhoto = student.photoSet ? student.photoSet[photoIdx] : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,8,6,0.55)",
        backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "24px 16px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          borderRadius: 32,
          border: "1px solid rgba(255,255,255,1)",
          boxShadow: `0 48px 120px rgba(0,0,0,0.22), 0 0 0 1px ${student.color}40`,
          padding: "2.5rem",
          maxWidth: 520, width: "100%",
          animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative", overflow: "hidden",
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -60, right: -60, width: 220, height: 220,
          borderRadius: "50%", background: student.color, opacity: 0.22,
          filter: "blur(20px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
          borderRadius: "50%", background: student.color, opacity: 0.12,
          filter: "blur(16px)", pointerEvents: "none",
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 18, right: 18,
            background: "rgba(0,0,0,0.06)", border: "none",
            borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "#666", transition: "all 0.2s", zIndex: 10,
          }}
        >×</button>

        {/* Nav arrows */}
        <button onClick={onPrev} style={{
          position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,190,180,0.4)",
          borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#888", zIndex: 10, transition: "all 0.2s",
        }}>‹</button>
        <button onClick={onNext} style={{
          position: "absolute", top: "50%", right: 52, transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,190,180,0.4)",
          borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#888", zIndex: 10, transition: "all 0.2s",
        }}>›</button>

        {/* Header with dual-photo */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: "1.75rem", position: "relative", zIndex: 1 }}>
          {/* Photo area */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 110,
              aspectRatio: "3/4",
              borderRadius: 16, overflow: "hidden",
              border: `3px solid rgba(255,255,255,0.95)`,
              boxShadow: `0 8px 32px ${student.color}66, 0 2px 12px rgba(0,0,0,0.1)`,
              cursor: student.photoSet ? "pointer" : "default",
              transition: "box-shadow 0.3s ease",
              position: "relative",
              background: `linear-gradient(160deg, ${student.color}cc 0%, ${student.color}66 100%)`,
            }} onClick={flipPhoto}>
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={student.name}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "top center",
                    opacity: flipping ? 0 : 1,
                    transform: flipping ? "scale(0.88)" : "scale(1)",
                    transition: "opacity 0.22s ease, transform 0.22s ease",
                    display: "block",
                  }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6,
                  fontSize: 28, fontWeight: 700, color: "rgba(60,50,40,0.6)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                }}>
                  <span style={{ fontSize: 32 }}>{student.emoji}</span>
                  {student.initials}
                </div>
              )}
            </div>

            {/* Photo switcher dots */}
            {student.photoSet && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {[0, 1].map(i => (
                  <button
                    key={i}
                    onClick={() => {
                      if (i !== photoIdx) flipPhoto();
                    }}
                    style={{
                      width: i === photoIdx ? 18 : 7,
                      height: 7, borderRadius: 10, border: "none",
                      background: i === photoIdx ? student.color : "rgba(200,190,180,0.5)",
                      cursor: "pointer", padding: 0,
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  />
                ))}
              </div>
            )}

            {student.photoSet && (
              <button
                className="photo-toggle-btn"
                onClick={flipPhoto}
                style={{
                  fontSize: 11, color: "#888",
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(200,190,180,0.45)",
                  borderRadius: 20, padding: "4px 12px",
                  cursor: "pointer", letterSpacing: 0.5,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                📸 {photoIdx === 0 ? "Photo 2 →" : "← Photo 1"}
              </button>
            )}
          </div>

          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 26, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, marginBottom: 6,
            }}>{student.name}</div>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 8 }}>
              {student.flag} {student.country}
            </div>
            <div style={{
              display: "inline-block",
              background: student.color + "66",
              borderRadius: 50, padding: "3px 12px",
              fontSize: 12, color: "#555", fontWeight: 500,
            }}>{student.role}</div>
          </div>
        </div>

        {/* Dream */}
        <div style={{
          background: student.color + "33",
          borderRadius: 18, padding: "1.1rem 1.4rem", marginBottom: "1.25rem",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 6 }}>✦ Dream</div>
          <div style={{ fontSize: 15, color: "#2a2a2a", fontWeight: 500, lineHeight: 1.5 }}>{student.dream}</div>
        </div>

        {/* Quote */}
        <div style={{
          borderLeft: `3px solid ${student.color}`,
          paddingLeft: "1.1rem", marginBottom: "1.5rem",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ fontSize: 32, color: student.color, lineHeight: 0.6, marginBottom: 6, fontFamily: "Georgia", opacity: 0.6 }}>"</div>
          <div style={{ fontSize: 15, fontStyle: "italic", color: "#555", lineHeight: 1.8 }}>{student.quote}</div>
        </div>

        {/* Memory */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#bbb", marginBottom: 10 }}>Memory from Japan</div>
          <div style={{
            background: "rgba(250,248,245,0.8)", borderRadius: 14, padding: "1rem 1.25rem",
            fontSize: 14, color: "#555", lineHeight: 1.9, fontStyle: "italic",
            border: "1px solid rgba(230,220,210,0.6)",
          }}>
            <span style={{ fontSize: 20, marginRight: 8 }}>{student.emoji}</span>
            {student.memory}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WORLD MAP SECTION ────────────────────────────────────────────────────────
function WorldSection({ students, onSelectCountry, selectedCountry }) {
  const countries = [...new Set(students.map(s => s.country))];
  const countryGroups = useMemo(() => {
    const g = {};
    students.forEach(s => {
      if (!g[s.country]) g[s.country] = [];
      g[s.country].push(s);
    });
    return g;
  }, [students]);

  const stats = [
    { label: "Countries", value: countries.length, emoji: "🌍" },
    { label: "Students", value: students.length, emoji: "👥" },
    { label: "Languages", value: "10+", emoji: "💬" },
    { label: "Memories", value: "∞", emoji: "🌸" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: "3rem" }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.9)", borderRadius: 20,
            padding: "1.5rem 1rem", textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.emoji}</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 36, fontWeight: 700, color: "#2a2a2a", lineHeight: 1,
            }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#aaa", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14, textAlign: "center" }}>
          {selectedCountry
            ? `Showing ${countryGroups[selectedCountry]?.length} student${countryGroups[selectedCountry]?.length !== 1 ? "s" : ""} from ${selectedCountry}`
            : "Tap a flag to spotlight classmates"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {countries.map(country => {
            const s = countryGroups[country];
            const isSelected = selectedCountry === country;
            return (
              <button
                key={country}
                onClick={() => onSelectCountry(isSelected ? null : country)}
                style={{
                  background: isSelected ? "rgba(160,140,120,0.18)" : "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(8px)",
                  border: isSelected ? "1.5px solid rgba(160,140,120,0.5)" : "1px solid rgba(210,200,190,0.5)",
                  borderRadius: 50, padding: "7px 16px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                  fontSize: 13, color: isSelected ? "#3a3a3a" : "#666",
                  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: isSelected ? "scale(1.07)" : "scale(1)",
                  boxShadow: isSelected ? "0 6px 20px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ fontSize: 17 }}>{s[0].flag}</span>
                {country}
                <span style={{
                  background: isSelected ? "rgba(160,140,120,0.25)" : "rgba(200,190,180,0.35)",
                  borderRadius: 50, padding: "1px 8px", fontSize: 11, color: "#888",
                }}>{s.length}</span>
              </button>
            );
          })}
          {selectedCountry && (
            <button
              onClick={() => onSelectCountry(null)}
              style={{
                background: "transparent", border: "1px dashed rgba(200,190,180,0.5)",
                borderRadius: 50, padding: "7px 16px", cursor: "pointer",
                fontSize: 12, color: "#bbb", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >× Show everyone</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GALLERY ITEM ─────────────────────────────────────────────────────────────
function GalleryItem({ item, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white", borderRadius: 4,
        padding: "0.875rem 0.875rem 2.5rem",
        boxShadow: hovered
          ? "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)"
          : "0 6px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.04)",
        transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: hovered ? `rotate(0deg) translateY(-10px) scale(1.04)` : `rotate(${item.rotate}deg)`,
        cursor: "default", userSelect: "none",
        animation: `fadeInUp 0.5s ease ${index * 0.06}s both`,
        zIndex: hovered ? 10 : 1, position: "relative",
      }}
    >
      <div style={{
        background: item.bg, borderRadius: 2,
        height: 140, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 52, marginBottom: "0.75rem", overflow: "hidden",
      }}>{item.emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#3a3a3a", marginBottom: 3, textAlign: "center" }}>{item.label}</div>
      <div style={{ fontSize: 10, color: "#bbb", textAlign: "center", fontStyle: "italic" }}>{item.note}</div>
    </div>
  );
}

// ─── QUOTE CARD ───────────────────────────────────────────────────────────────
function QuoteCard({ item, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(230,220,210,0.8)",
        borderRadius: 20, padding: "1.75rem",
        position: "relative",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 16px 40px rgba(0,0,0,0.08)" : "0 2px 12px rgba(0,0,0,0.04)",
        animation: `fadeInUp 0.5s ease ${index * 0.1}s both`,
      }}
    >
      <div style={{
        fontSize: 56, color: "rgba(180,160,140,0.2)",
        fontFamily: "Georgia", lineHeight: 0.7, marginBottom: 10, display: "block",
      }}>"</div>
      <div style={{
        fontSize: 18, color: "#4a4a4a", lineHeight: 1.85,
        fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}>{item.quote}</div>
      <div style={{ fontSize: 12, color: "#bbb", marginTop: 14 }}>— {item.author}</div>
    </div>
  );
}

// ─── ANONYMOUS MESSAGES ───────────────────────────────────────────────────────
function AnonymousMessages() {
  const [messages, setMessages] = useState([
    { id: 1, text: "To whoever was always first in class — you inspired me to try harder. 🌸", color: "#f0e8f8" },
    { id: 2, text: "Thank you for sharing your home food with everyone. It made us feel less far away. 🍱", color: "#e8f0e8" },
    { id: 3, text: "I will never forget the night we got lost in Osaka and ended up having the best adventure.", color: "#f8f0e8" },
    { id: 4, text: "Your laugh is the soundtrack of this year. I hope you never change.", color: "#e8e8f8" },
    { id: 5, text: "Whoever taught me to say あなたが大好き — thank you for that lesson in bravery.", color: "#f8f4e8" },
  ]);
  const [draft, setDraft] = useState("");
  const colors = ["#f0e8f8", "#e8f0e8", "#f8f0e8", "#e8e8f8", "#f8e8e8", "#e8f8f0", "#f8f4e8"];

  const add = () => {
    if (!draft.trim()) return;
    setMessages(m => [...m, { id: Date.now(), text: draft.trim(), color: colors[Math.floor(Math.random() * colors.length)] }]);
    setDraft("");
  };

  return (
    <div>
      <div style={{ display: "grid", gap: 10, marginBottom: "1.5rem" }}>
        {messages.map((m) => (
          <div key={m.id} style={{
            background: m.color, borderRadius: 16, padding: "1rem 1.35rem",
            fontSize: 14, color: "#4a4a4a", lineHeight: 1.75,
            border: "1px solid rgba(255,255,255,0.9)",
            animation: "slideIn 0.4s ease",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}>{m.text}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Leave an anonymous note for a classmate…"
          style={{
            flex: 1, padding: "11px 18px", borderRadius: 50,
            border: "1px solid rgba(200,190,180,0.55)",
            background: "rgba(255,255,255,0.85)", fontSize: 14,
            color: "#3a3a3a", fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          onClick={add}
          style={{
            background: "#2a2a2a", color: "white", border: "none",
            borderRadius: 50, padding: "11px 22px", cursor: "pointer",
            fontSize: 13, fontWeight: 500, transition: "all 0.2s", letterSpacing: 0.3,
          }}
        >Send ✦</button>
      </div>
    </div>
  );
}

// ─── TIME CAPSULE ─────────────────────────────────────────────────────────────
function TimeCapsule() {
  const [revealed, setRevealed] = useState(false);
  const [opening, setOpening] = useState(false);

  const open = () => {
    setOpening(true);
    setTimeout(() => { setRevealed(true); setOpening(false); }, 600);
  };

  return (
    <div style={{ textAlign: "center" }}>
      {!revealed ? (
        <div style={{
          background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)",
          border: "1.5px dashed rgba(180,160,140,0.4)",
          borderRadius: 24, padding: "3.5rem 2.5rem",
          transition: "all 0.3s ease",
          transform: opening ? "scale(0.97)" : "scale(1)",
          opacity: opening ? 0.7 : 1,
        }}>
          <div style={{ fontSize: 52, marginBottom: 18, animation: "float 3s ease-in-out infinite", display: "inline-block" }}>📮</div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: "#3a3a3a", marginBottom: 10, lineHeight: 1.4 }}>
            A letter from your past self
          </div>
          <div style={{ fontSize: 14, color: "#aaa", marginBottom: 28, lineHeight: 1.6 }}>
            Written on graduation day.<br />Open when you're ready.
          </div>
          <button
            onClick={open}
            style={{
              background: "#2a2a2a", color: "white", border: "none",
              borderRadius: 50, padding: "13px 36px", cursor: "pointer",
              fontSize: 14, fontWeight: 500, letterSpacing: 0.5,
              transition: "all 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >Open the capsule</button>
        </div>
      ) : (
        <div style={{ animation: "fadeIn 0.8s ease", textAlign: "left" }}>
          {MEMORY_CAPSULE.map((msg, i) => (
            <div key={i} style={{
              background: i === MEMORY_CAPSULE.length - 1 ? "rgba(240,232,248,0.6)" : "rgba(255,255,255,0.72)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(230,220,210,0.8)",
              borderRadius: 18, padding: "1.35rem 1.65rem", marginBottom: 10,
              fontSize: i === MEMORY_CAPSULE.length - 1 ? 17 : 15,
              color: "#4a4a4a", lineHeight: 1.85,
              fontStyle: i === MEMORY_CAPSULE.length - 1 ? "italic" : "normal",
              fontFamily: i === MEMORY_CAPSULE.length - 1 ? "'Cormorant Garamond', Georgia, serif" : "inherit",
              animation: `fadeInUp 0.5s ease ${i * 0.18}s both`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              {i === MEMORY_CAPSULE.length - 1 && <span style={{ marginRight: 8 }}>🌸</span>}
              {msg}
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={() => setRevealed(false)}
              style={{
                background: "transparent", color: "#bbb",
                border: "1px solid rgba(200,190,180,0.4)",
                borderRadius: 50, padding: "8px 22px", cursor: "pointer",
                fontSize: 13, transition: "all 0.2s",
              }}
            >Seal again</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RANDOM MEMORY ────────────────────────────────────────────────────────────
function RandomMemoryButton({ students }) {
  const [memory, setMemory] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const pick = () => {
    setSpinning(true);
    setMemory(null);
    setTimeout(() => {
      const all = students.map(s => ({ student: s, memory: s.memory, emoji: s.emoji }));
      setMemory(all[Math.floor(Math.random() * all.length)]);
      setSpinning(false);
    }, 400);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={pick}
        style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
          border: "1.5px solid rgba(180,160,140,0.45)", borderRadius: 50,
          padding: "15px 36px", cursor: "pointer",
          fontSize: 15, color: "#4a4a4a", fontWeight: 500,
          transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          display: "inline-flex", alignItems: "center", gap: 12,
          boxShadow: "0 6px 24px rgba(0,0,0,0.08)", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span style={{ fontSize: 18, display: "inline-block", animation: spinning ? "drift 0.4s linear" : "none" }}>✦</span>
        {spinning ? "Finding a memory…" : "Surface a random memory"}
      </button>

      {memory && (
        <div style={{
          marginTop: 24, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(230,220,210,0.9)",
          borderRadius: 24, padding: "2rem",
          animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          maxWidth: 520, margin: "24px auto 0",
          boxShadow: `0 16px 48px ${memory.student.color}44, 0 4px 16px rgba(0,0,0,0.06)`,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{memory.emoji}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, justifyContent: "center" }}>
            <Avatar student={memory.student} size={36} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#2a2a2a" }}>{memory.student.name}</span>
            <span style={{ fontSize: 14 }}>{memory.student.flag}</span>
          </div>
          <div style={{ fontSize: 16, color: "#555", lineHeight: 1.85, fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            "{memory.memory}"
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MINI VIDEOS ──────────────────────────────────────────────────────────────
function MiniVideos() {
  const [playing, setPlaying] = useState(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
      {MINI_VIDEOS.map((v, i) => (
        <div
          key={v.id}
          onClick={() => setPlaying(playing === v.id ? null : v.id)}
          style={{
            background: v.color, borderRadius: 20, padding: "1.5rem", cursor: "pointer",
            transition: "all 0.3s ease",
            border: playing === v.id ? "2px solid rgba(150,130,110,0.5)" : "1px solid rgba(255,255,255,0.8)",
            transform: playing === v.id ? "scale(0.98)" : "scale(1)",
            boxShadow: playing === v.id ? "0 4px 20px rgba(0,0,0,0.12) inset" : "0 4px 16px rgba(0,0,0,0.06)",
            animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12, textAlign: "center" }}>{playing === v.id ? "⏸️" : v.emoji}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2a2a2a", marginBottom: 4 }}>{v.title}</div>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 6 }}>{v.duration}</div>
          <div style={{ fontSize: 11, color: "#888", fontStyle: "italic", lineHeight: 1.5 }}>{v.note}</div>
          {playing === v.id && (
            <div style={{ marginTop: 12, background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#666", textAlign: "center" }}>
              🎬 Playing…
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0, past: false });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date("2025-03-20T09:00:00+09:00");
      const diff = target - now;
      if (diff <= 0) {
        const ago = Math.abs(diff);
        const d = Math.floor(ago / 86400000);
        setTime({ days: d, hours: 0, mins: 0, secs: 0, past: true });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ days: d, hours: h, mins: m, secs: s, past: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (time.past) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontStyle: "italic", color: "#9a8a7a" }}>
          Graduated {time.days} days ago 🌸
        </div>
        <div style={{ fontSize: 13, color: "#bbb", marginTop: 6 }}>The memories remain.</div>
      </div>
    );
  }

  const parts = [
    { label: "Days", val: time.days },
    { label: "Hours", val: time.hours },
    { label: "Mins", val: time.mins },
    { label: "Secs", val: time.secs },
  ];

  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: 3, color: "#c4b4a4", textTransform: "uppercase", textAlign: "center", marginBottom: 16 }}>
        Until graduation
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {parts.map(p => (
          <div key={p.label} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 42, fontWeight: 700, color: "#2a2a2a", lineHeight: 1, minWidth: 52,
              animation: "countUp 0.3s ease",
            }}>{String(p.val).padStart(2, "0")}</div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#bbb", textTransform: "uppercase", marginTop: 4 }}>{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION HEADING ─────────────────────────────────────────────────────────
function SectionHeading({ tag, title, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
      <div style={{ fontSize: 11, letterSpacing: 4, color: "#c4a882", textTransform: "uppercase", marginBottom: 14, fontWeight: 500 }}>{tag}</div>
      <h2 style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700,
        color: "#2a2a2a", margin: "0 0 12px", lineHeight: 1.2,
      }}>{title}</h2>
      {sub && <p style={{ color: "#b4a494", fontSize: 15, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Yearbook() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activeSection, setActiveSection] = useState("home");
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMsg, setLoadMsg] = useState("思い出を読み込んでいます…");
  const [musicOn, setMusicOn] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const sectionsRef = useRef({});

  const LOAD_MSGS = [
    "思い出を読み込んでいます…",
    "Gathering sakura petals…",
    "Counting konbini memories…",
    "Almost ready…",
  ];

  useEffect(() => {
    let prog = 0;
    const timer = setInterval(() => {
      prog += 1.6;
      setLoadProgress(Math.min(prog, 100));
      setLoadMsg(LOAD_MSGS[Math.floor(prog / 25)] || LOAD_MSGS[3]);
      if (prog >= 100) {
        clearInterval(timer);
        setTimeout(() => setLoading(false), 500);
      }
    }, 28);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 20);
      const sections = Object.entries(sectionsRef.current);
      for (const [id, el] of sections.reverse()) {
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = sectionsRef.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const filteredStudents = selectedCountry
    ? STUDENTS.filter(s => s.country === selectedCountry)
    : STUDENTS;

  const selectedIdx = selectedStudent ? STUDENTS.findIndex(s => s.id === selectedStudent.id) : -1;
  const openNext = () => selectedIdx >= 0 && setSelectedStudent(STUDENTS[(selectedIdx + 1) % STUDENTS.length]);
  const openPrev = () => selectedIdx >= 0 && setSelectedStudent(STUDENTS[(selectedIdx - 1 + STUDENTS.length) % STUDENTS.length]);

  const orbs = [
    { width: 320, height: 320, background: "#f2c4ce", top: "5%", left: "10%", duration: 8, delay: 0 },
    { width: 280, height: 280, background: "#c4d4f2", top: "60%", right: "5%", duration: 10, delay: 2 },
    { width: 200, height: 200, background: "#d4f2c4", top: "30%", right: "25%", duration: 7, delay: 1 },
    { width: 240, height: 240, background: "#f2e8c4", bottom: "10%", left: "20%", duration: 9, delay: 3 },
  ];

  const petals = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 7.3) % 95}%`, size: `${12 + (i * 3) % 10}px`,
    duration: 8 + (i * 1.3) % 8, delay: (i * 1.7) % 12,
  }));

  const navItems = [
    { id: "home", label: "Home" },
    { id: "students", label: "Classmates" },
    { id: "world", label: "World" },
    { id: "gallery", label: "Gallery" },
    { id: "memories", label: "Memories" },
  ];

  // ── LOADING ──
  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #faf8f5 0%, #f0ebe4 50%, #ebe4f0 100%)",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontSize: 44, marginBottom: 20, animation: "float 2s ease-in-out infinite", display: "inline-block" }}>🌸</div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, color: "#5a5a5a", marginBottom: 6, textAlign: "center" }}>
        {CLASS_DATA.school}
      </div>
      <div style={{ fontSize: 13, color: "#bbb", marginBottom: 40, letterSpacing: 3, textTransform: "uppercase" }}>
        {CLASS_DATA.year}
      </div>
      <div style={{ width: 220, marginBottom: 14 }}>
        <div style={{ height: 2, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #c4a882, #a882c4, #82c4a8)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
            borderRadius: 2, width: `${loadProgress}%`, transition: "width 0.1s ease",
          }} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#ccc", letterSpacing: 1 }}>{loadMsg}</div>
    </div>
  );

  // ── MAIN ──
  return (
    <div style={{
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      background: "linear-gradient(160deg, #faf8f5 0%, #f5f0ea 40%, #eaeaf5 100%)",
      minHeight: "100vh", color: "#3a3a3a",
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: navScrolled ? "rgba(250,248,245,0.92)" : "rgba(250,248,245,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: navScrolled ? "1px solid rgba(210,195,180,0.4)" : "1px solid transparent",
        padding: "0 2rem", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 17, fontWeight: 600, color: "#3a3a3a",
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
        }} onClick={() => scrollTo("home")}>
          <span>🌸</span> Class 3B · {CLASS_DATA.year}
        </div>

        <div style={{ display: "flex", gap: 2 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`nav-pill${activeSection === item.id ? " active" : ""}`}
            >{item.label}</button>
          ))}
        </div>

        <button
          onClick={() => setMusicOn(!musicOn)}
          style={{
            background: musicOn ? "rgba(180,160,140,0.18)" : "transparent",
            border: "1px solid rgba(200,190,180,0.4)",
            borderRadius: 50, padding: "6px 16px", cursor: "pointer",
            fontSize: 12, color: musicOn ? "#5a4a3a" : "#aaa",
            transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <span>♪</span>{musicOn ? "On" : "Off"}
        </button>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={el => sectionsRef.current.home = el}
        id="home"
        style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          padding: "68px 2rem 4rem", textAlign: "center",
        }}
      >
        {petals.map((p, i) => <SakuraPetal key={i} style={p} />)}
        {orbs.map((o, i) => <FloatingOrb key={i} style={o} />)}

        <div style={{ position: "relative", zIndex: 2, animation: "fadeInUp 1s ease 0.2s both", maxWidth: 700 }}>
          <div style={{ fontSize: 12, letterSpacing: 5, color: "#c4a882", textTransform: "uppercase", marginBottom: 28, fontWeight: 400 }}>
            {CLASS_DATA.city} · {CLASS_DATA.year}
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(64px, 11vw, 110px)",
            fontWeight: 700, color: "#1a1a1a", lineHeight: 0.95, margin: "0 0 12px", letterSpacing: -1,
          }}>Class 3B</h1>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(17px, 2.8vw, 24px)",
            fontWeight: 300, fontStyle: "italic", color: "#8a7a6a", margin: "0 0 44px", lineHeight: 1.4,
          }}>{CLASS_DATA.school}</h2>

          <div style={{
            display: "inline-block", background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(12px)", border: "1px solid rgba(210,195,180,0.6)",
            borderRadius: 100, padding: "14px 36px", marginBottom: 56,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontStyle: "italic", color: "#6a5a4a" }}>
              {CLASS_DATA.groupQuote}
            </span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
              {STUDENTS.slice(0, 12).map((s, i) => (
                <div key={s.id} style={{
                  marginLeft: i > 0 ? -14 : 0, zIndex: 12 - i,
                  width: 46, height: 46, borderRadius: "50%",
                  background: s.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, color: "#4a4a4a",
                  border: "2.5px solid rgba(255,255,255,0.92)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  cursor: "default",
                }}>{s.initials}</div>
              ))}
              <div style={{
                marginLeft: -14, zIndex: 0,
                width: 46, height: 46, borderRadius: "50%",
                background: "rgba(200,190,180,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500, color: "#999",
                border: "2.5px solid rgba(255,255,255,0.9)",
              }}>+8</div>
            </div>
            <div style={{ fontSize: 13, color: "#b4a494", letterSpacing: 0.5 }}>
              20 students · 8 countries · 1 unforgettable year
            </div>
          </div>

          <div style={{
            marginTop: 40, background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(210,195,180,0.5)", borderRadius: 24, padding: "1.75rem 2.5rem",
            display: "inline-block", boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <Countdown />
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
          animation: "floatSlow 2.5s ease-in-out infinite", zIndex: 2,
        }}>
          <div style={{ fontSize: 10, color: "#d4c4b4", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Scroll</div>
          <div style={{ fontSize: 14, color: "#d4c4b4", textAlign: "center" }}>↓</div>
        </div>
      </section>

      {/* ── STUDENTS ── */}
      <section
        ref={el => sectionsRef.current.students = el}
        id="students"
        style={{ padding: "6rem 2rem 4rem", maxWidth: 1280, margin: "0 auto" }}
      >
        <SectionHeading
          tag="Our Class"
          title="Classmates"
          sub="From across Asia, brought together by Japanese and kept together by friendship. Click any card to see their profile."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18 }}>
          {STUDENTS.map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <StudentCard student={s} onClick={setSelectedStudent} />
            </div>
          ))}
        </div>
      </section>

      {/* ── WORLD ── */}
      <section
        ref={el => sectionsRef.current.world = el}
        id="world"
        style={{ padding: "7rem 2rem 5rem", background: "rgba(255,255,255,0.3)" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeading
            tag="Where We Come From"
            title="A World in One Classroom"
            sub="Every seat held a different story. Every voice added a new color."
          />
          <WorldSection students={STUDENTS} onSelectCountry={setSelectedCountry} selectedCountry={selectedCountry} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginTop: "1rem" }}>
            {filteredStudents.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                style={{
                  background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(220,210,200,0.55)", borderRadius: 18,
                  padding: "1rem 1.25rem", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.25s ease",
                  animation: `fadeInUp 0.4s ease ${i * 0.05}s both`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}
              >
                <Avatar student={s} size={46} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#2a2a2a" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{s.flag} {s.country}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section
        ref={el => sectionsRef.current.gallery = el}
        id="gallery"
        style={{ padding: "7rem 2rem 5rem", maxWidth: 1280, margin: "0 auto" }}
      >
        <SectionHeading
          tag="Photo Memories"
          title="Polaroid Gallery"
          sub="Hover to relive the moment. Every photo holds a story."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 28, padding: "1rem 0 2rem" }}>
          {GALLERY_ITEMS.map((item, i) => <GalleryItem key={item.id} item={item} index={i} />)}
        </div>

        <div style={{ marginTop: "4rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#c4a882", textTransform: "uppercase", marginBottom: 12 }}>Video Memories</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 600, color: "#2a2a2a" }}>Class Films</h3>
          </div>
          <MiniVideos />
        </div>
      </section>

      {/* ── MEMORIES ── */}
      <section
        ref={el => sectionsRef.current.memories = el}
        id="memories"
        style={{ padding: "7rem 2rem 5rem", background: "rgba(255,255,255,0.3)" }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <SectionHeading tag="Memories & Moments" title="Things We'll Never Forget" />

          <div style={{ marginBottom: "5rem" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, color: "#5a5a5a", marginBottom: "1.75rem", textAlign: "center", fontWeight: 400 }}>Random Memory</h3>
            <RandomMemoryButton students={STUDENTS} />
          </div>

          <div style={{ marginBottom: "5rem" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, color: "#5a5a5a", marginBottom: "1.75rem", textAlign: "center", fontWeight: 400 }}>Class Quotes</h3>
            <div style={{ display: "grid", gap: 14 }}>
              {FUNNY_QUOTES.map((q, i) => <QuoteCard key={i} item={q} index={i} />)}
            </div>
          </div>

          <div style={{ marginBottom: "5rem" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, color: "#5a5a5a", marginBottom: 8, textAlign: "center", fontWeight: 400 }}>Anonymous Friendship Notes</h3>
            <p style={{ fontSize: 13, color: "#ccc", textAlign: "center", marginBottom: "1.75rem" }}>Leave a note without revealing who you are.</p>
            <AnonymousMessages />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, color: "#5a5a5a", marginBottom: "1.75rem", textAlign: "center", fontWeight: 400 }}>Time Capsule</h3>
            <TimeCapsule />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "5rem 2rem 4rem",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(210,195,180,0.35)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, #f2c4ce22 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(210,195,180,0.4)",
          borderRadius: 50, padding: "10px 24px", marginBottom: 28,
        }}>
          <span style={{ fontSize: 18 }}>🌸</span>
          <span style={{ fontSize: 13, color: "#8a7a6a", letterSpacing: 1 }}>{CLASS_DATA.school}</span>
        </div>

        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 5vw, 42px)", marginBottom: 6, color: "#2a2a2a", fontWeight: 600 }}>
          Class 3B · 2024–2025
        </div>
        <div style={{ fontSize: 14, color: "#b4a494", marginBottom: 32 }}>{CLASS_DATA.city}</div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 6px", maxWidth: 760, margin: "0 auto 36px" }}>
          {STUDENTS.map((s, i) => (
            <span key={s.id} style={{ fontSize: 13, color: "#9a8a7a", display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 0" }}>
              {i > 0 && <span style={{ color: "#e0d5c8", margin: "0 2px" }}>·</span>}
              {s.flag} {s.name.split(" ")[0]}
            </span>
          ))}
        </div>

        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, fontStyle: "italic", color: "#c4b4a4", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 20px" }}>
          {CLASS_DATA.timeCapsula}
        </div>
        <div style={{ fontSize: 26, marginBottom: 12 }}>🌸</div>
        <div style={{ fontSize: 11, color: "#d8ccc0", letterSpacing: 2, textTransform: "uppercase" }}>言葉は橋</div>
      </footer>

      {/* Student Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onNext={openNext}
          onPrev={openPrev}
        />
      )}
    </div>
  );
}
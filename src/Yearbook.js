import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import yadaPhoto from "./photo/yada.jpg";
import aun from "./photo/aun.jpg";
import React from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DATA ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const CLASS_DATA = {
  school: "Sakura Japanese Language Academy",
  class: "Advanced Intensive Course — Class 3B",
  year: "2024–2025",
  city: "Kyoto, Japan",
  graduationDate: "2025-03-20",
  groupQuote: "言葉は橋 — Words are bridges.",
  timeCapsula: "Open this in 10 years and remember how young we were.",
};

const PHOTO_SETS = [
  ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1529505534180-8d9b1430b21c?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=711&fit=crop&crop=top"],
  [aun, aun],
  [aun, aun],
  ["https://images.unsplash.com/photo-1546961342-ea5f62d51c85?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1509460913899-515f1df34fea?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1507152927626-84cf901b6572?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=711&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1548544149-4835e62ee5b3?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=711&fit=crop&crop=top"],
  [yadaPhoto, yadaPhoto],
  ["https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=711&fit=crop&crop=top", "https://images.unsplash.com/photo-1523006535-31aee3e7a2a3?w=400&h=711&fit=crop&crop=top"],
];

const STUDENTS = [
  { id: 1,  name: "Asyl Mamatova",       country: "Kyrgyzstan", flag: "🇰🇬", initials: "AM", color: "#f2c4a0", dream: "Become a Japanese-Kyrgyz interpreter for diplomatic missions",           quote: "Жол — жүрүүгө. — The road is for those who walk it.",                              memory: "Making traditional Kyrgyz tea for the whole class and watching everyone's eyes light up.", emoji: "🏔️", role: "Cultural Ambassador",  photoSet: PHOTO_SETS[0]  },
  { id: 2,  name: "Nursultan Bekov",      country: "Kyrgyzstan", flag: "🇰🇬", initials: "NB", color: "#a0bef2", dream: "Build a tech bridge between Central Asia and Japan",                           quote: "Сабыр түбү — сары алтын. — Patience is gold.",                                       memory: "Staying up until 3am coding a class website with Sensei's blessing.",                     emoji: "💻", role: "Tech Lead",           photoSet: PHOTO_SETS[1]  },
  { id: 3,  name: "Madara Sulaimanova",   country: "Kyrgyzstan", flag: "🇰🇬", initials: "MS", color: "#c4a0f2", dream: "Open a Kyrgyz cultural center in Osaka",                                     quote: "Эл — деңиз. — The people are an ocean.",                                             memory: "Teaching the class Kyrgyz folk dance at the cultural festival night.",                     emoji: "🎭", role: "Cultural Director",  photoSet: PHOTO_SETS[2]  },
  { id: 4,  name: "Baiel Dzhaksybekov",   country: "Kyrgyzstan", flag: "🇰🇬", initials: "BD", color: "#a0f2c4", dream: "Write a manga series set in the Tian Shan mountains",                        quote: "Ар бир адам — бир дүйнө. — Every person is a whole world.",                          memory: "Sketching manga panels in every café from Kyoto to Nara.",                                emoji: "✏️", role: "Class Manga Artist", photoSet: PHOTO_SETS[3]  },
  { id: 5,  name: "Anjery Putri",         country: "Indonesia",  flag: "🇮🇩", initials: "AP", color: "#f2a0a0", dream: "Fashion designer blending batik patterns with Japanese aesthetics",          quote: "Banyak jalan menuju Roma. — Many roads lead to Rome.",                               memory: "Finding batik fabric at a Kyoto market and making the whole class scarves.",               emoji: "🧣", role: "Style Maven",        photoSet: PHOTO_SETS[4]  },
  { id: 6,  name: "Nabira Salsabila",     country: "Indonesia",  flag: "🇮🇩", initials: "NS", color: "#f2d4a0", dream: "Culinary journalist covering Southeast Asian street food in Japan",          quote: "Siapa yang menanam, dia yang menuai. — Reap what you sow.",                         memory: "Hosting a secret rendang tasting session in the dorm kitchen at midnight.",               emoji: "🌶️", role: "Food Correspondent",photoSet: PHOTO_SETS[5]  },
  { id: 7,  name: "Chacha Maharani",      country: "Indonesia",  flag: "🇮🇩", initials: "CM", color: "#a0f2f2", dream: "Produce a documentary on Indonesian diaspora in Japan",                     quote: "Ringan sama dijinjing, berat sama dipikul. — Share burdens and joys together.",     memory: "Filming every class moment — she always had her camera ready.",                           emoji: "🎬", role: "Class Filmmaker",   photoSet: PHOTO_SETS[6]  },
  { id: 8,  name: "Hieu Nguyen",          country: "Vietnam",    flag: "🇻🇳", initials: "HN", color: "#c4f2a0", dream: "Software engineer at a Japanese robotics company",                          quote: "Có công mài sắt, có ngày nên kim. — Perseverance turns iron into a needle.",       memory: "Solving a kanji riddle that stumped the entire class in under a minute.",                 emoji: "🤖", role: "Logic Master",      photoSet: PHOTO_SETS[7]  },
  { id: 9,  name: "Aun Tran",             country: "Vietnam",    flag: "🇻🇳", initials: "AT", color: "#f2a0c4", dream: "Architect designing bamboo-inspired buildings across Asia",                  quote: "Đi một ngày đàng, học một sàng khôn. — One day of travel teaches a basketful of wisdom.", memory: "Building a tiny bamboo model of Sensei's house as a goodbye gift.",             emoji: "🏗️", role: "Class Builder",    photoSet: PHOTO_SETS[8]  },
  { id: 10, name: "Otchini Perera",       country: "Sri Lanka",  flag: "🇱🇰", initials: "OP", color: "#a0c0f2", dream: "Tea sommelier introducing Sri Lankan tea culture to Japan",                 quote: "දිනෙන් දිනෙට හොඳ. — Better day by day.",                                            memory: "Brewing Ceylon tea for Sensei and watching her say it rivaled Japanese tea.",             emoji: "🍵", role: "Tea Ceremony Host", photoSet: PHOTO_SETS[9]  },
  { id: 11, name: "Rukumaru Silva",       country: "Sri Lanka",  flag: "🇱🇰", initials: "RS", color: "#f2f0a0", dream: "Marine biologist protecting Sri Lankan and Japanese coral reefs",           quote: "දිය ගොඩ දෙකෙහිම — At home in water and on land.",                                   memory: "Leading the class snorkeling trip in Okinawa and naming every fish in Japanese.",         emoji: "🐠", role: "Ocean Guardian",   photoSet: PHOTO_SETS[10] },
  { id: 12, name: "Ko Mingzhi",           country: "China",      flag: "🇨🇳", initials: "KM", color: "#e4a0f2", dream: "Calligrapher bridging Chinese and Japanese brush art traditions",           quote: "千里之行，始於足下。 — A journey of a thousand miles begins with a single step.",      memory: "Hosting a midnight calligraphy session that lasted until sunrise.",                       emoji: "🖌️", role: "Master Calligrapher",photoSet: PHOTO_SETS[11]},
  { id: 13, name: "Sharuri Tamang",       country: "Nepal",      flag: "🇳🇵", initials: "ST", color: "#a0e4f2", dream: "Mountain guide leading treks between the Himalayas and Japanese Alps",     quote: "जहाँ चाह, त्यहाँ बाह. — Where there's a will, there's a way.",                     memory: "Teaching sunrise meditation on the roof of our dorm every Monday.",                       emoji: "🏔️", role: "Sunrise Guide",    photoSet: PHOTO_SETS[12] },
  { id: 14, name: "Sukura Shrestha",      country: "Nepal",      flag: "🇳🇵", initials: "SS", color: "#f2c0a0", dream: "Child educator building bilingual schools in rural Nepal",                  quote: "ज्ञान नै शक्ति हो। — Knowledge is power.",                                           memory: "Organizing the class tutoring circle that helped everyone pass the N3 exam.",             emoji: "📚", role: "Class Tutor",       photoSet: PHOTO_SETS[13] },
  { id: 15, name: "Unda Gantulga",        country: "Mongolia",   flag: "🇲🇳", initials: "UG", color: "#b0f2a0", dream: "Veterinarian caring for endangered wildlife across the steppe",            quote: "Эрдэм номын эх — сурах явдал. — The mother of knowledge is study.",                 memory: "Bringing traditional Mongolian airag to the cultural night and daring everyone to try it.", emoji: "🐎", role: "Wildlife Advocate", photoSet: PHOTO_SETS[14]},
  { id: 16, name: "Azjargal Batbold",     country: "Mongolia",   flag: "🇲🇳", initials: "AB", color: "#b0a0f2", dream: "Fashion designer weaving Mongolian felt art into modern collections",      quote: "Хүнд хэцүүгийн цаана аз жаргал байдаг. — Happiness lies beyond hardship.",          memory: "Sewing matching felt badges for the whole class by hand overnight.",                      emoji: "🧵", role: "Craft Queen",       photoSet: PHOTO_SETS[15] },
  { id: 17, name: "Beruguti Namsrai",     country: "Mongolia",   flag: "🇲🇳", initials: "BN", color: "#f2f0b0", dream: "Music producer blending Mongolian throat singing with J-pop",              quote: "Дуу хоолой — сэтгэлийн хэл. — Voice is the language of the soul.",                 memory: "Performing a live throat singing duet with the school's traditional music club.",         emoji: "🎶", role: "Music Soul",        photoSet: PHOTO_SETS[16] },
  { id: 18, name: "Otogo Chimeddorj",     country: "Mongolia",   flag: "🇲🇳", initials: "OC", color: "#a0f2b4", dream: "Diplomat fostering Mongolia-Japan cultural exchanges",                     quote: "Нэгдсэн нь хүчтэй. — United we are strong.",                                        memory: "Organizing the class's end-of-year talent show from scratch in three days.",              emoji: "🎪", role: "Chief Organizer",   photoSet: PHOTO_SETS[17] },
  { id: 19, name: "Yadana Kyaw",          country: "Myanmar",    flag: "🇲🇲", initials: "YK", color: "#f2c8a0", dream: "Journalist bringing Myanmar stories to a Japanese-speaking world",         quote: "ကြိုးစားမှ အောင်မြင်မည်။ — Effort brings success.",                                  memory: "Reading her own Burmese poetry translated into Japanese at the school festival.",         emoji: "📜", role: "Class Poet",        photoSet: PHOTO_SETS[18] },
  { id: 20, name: "Arai Somsak",          country: "Thailand",   flag: "🇹🇭", initials: "AS", color: "#a0d4f2", dream: "Chef opening a Thai-Japanese fusion restaurant in Kyoto",                 quote: "ทำดีได้ดี — Do good, receive good.",                                                 memory: "Cooking pad thai for 25 people in the dorm kitchen on New Year's Eve.",                   emoji: "🍜", role: "Class Chef",        photoSet: PHOTO_SETS[19] },
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
  { id: 1,  label: "First snow in Kyoto",     emoji: "❄️", bg: "linear-gradient(135deg, #e8f4fd, #d6eaf8)", note: "January morning, 6:04am",     rotate: -2   },
  { id: 2,  label: "Gion Festival night",     emoji: "🏮", bg: "linear-gradient(135deg, #fdf0e8, #fde4cc)", note: "Summer, unforgettable",        rotate: 1.5  },
  { id: 3,  label: "Sakura season window",    emoji: "🌸", bg: "linear-gradient(135deg, #fde8f4, #fbd5e8)", note: "Classroom view, March",        rotate: -1   },
  { id: 4,  label: "Konbini late-night run",  emoji: "🥟", bg: "linear-gradient(135deg, #e8fdf0, #d5f5e3)", note: "Every study night, 11pm",      rotate: 2    },
  { id: 5,  label: "Arashiyama bamboo walk",  emoji: "🎋", bg: "linear-gradient(135deg, #edfde8, #ddf5d5)", note: "October weekend trip",         rotate: -1.5 },
  { id: 6,  label: "Train station goodbyes",  emoji: "🚃", bg: "linear-gradient(135deg, #e8eefb, #d5e3f5)", note: "Too many of these",            rotate: 1    },
  { id: 7,  label: "Cultural festival day",   emoji: "🎉", bg: "linear-gradient(135deg, #fbf5e8, #f5e8cc)", note: "We danced for 3 hours",        rotate: -2.5 },
  { id: 8,  label: "Zen garden meditation",   emoji: "⛩️", bg: "linear-gradient(135deg, #f0e8fb, #e4d5f5)", note: "Ryoan-ji, 6am silence",        rotate: 1.5  },
  { id: 9,  label: "Year-end class dinner",   emoji: "🍱", bg: "linear-gradient(135deg, #fbeee8, #f5ddd0)", note: "Someone cried (everyone)",     rotate: -1   },
  { id: 10, label: "Nara deer encounter",     emoji: "🦌", bg: "linear-gradient(135deg, #eef0e8, #e0ebd5)", note: "RIP someone's snacks",         rotate: 2.5  },
  { id: 11, label: "Calligraphy class",       emoji: "🖌️", bg: "linear-gradient(135deg, #f0e8ee, #ead5e7)", note: "90-year-old sensei",           rotate: -2   },
  { id: 12, label: "Osaka aquarium trip",     emoji: "🐠", bg: "linear-gradient(135deg, #e8f7fb, #d5eef5)", note: "Zero studying happened",       rotate: 1    },
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
  { id: 1, title: "Class intro day",       duration: "2:14", emoji: "🎬", color: "linear-gradient(135deg,#f0e8f8,#e4d5f0)", note: "First day jitters, last day tears" },
  { id: 2, title: "Bon Odori dancing",     duration: "1:47", emoji: "🏮", color: "linear-gradient(135deg,#f8ece8,#f0d5c8)", note: "Everyone learned the steps" },
  { id: 3, title: "Cooking class chaos",   duration: "3:02", emoji: "🍙", color: "linear-gradient(135deg,#e8f8ee,#d5f0e0)", note: "Pasta meets onigiri" },
  { id: 4, title: "Graduation ceremony",   duration: "8:30", emoji: "🎓", color: "linear-gradient(135deg,#e8eef8,#d5e3f0)", note: "The tissues ran out" },
];

const INITIAL_MESSAGES = [
  { id: 1, text: "To whoever was always first in class — you inspired me to try harder. 🌸",              color: "#f0e8f8" },
  { id: 2, text: "Thank you for sharing your home food with everyone. It made us feel less far away. 🍱", color: "#e8f0e8" },
  { id: 3, text: "I will never forget the night we got lost in Osaka and ended up having the best adventure.", color: "#f8f0e8" },
  { id: 4, text: "Your laugh is the soundtrack of this year. I hope you never change.",                    color: "#e8e8f8" },
  { id: 5, text: "Whoever taught me to say あなたが大好き — thank you for that lesson in bravery.",          color: "#f8f4e8" },
];

const NOTE_COLORS = ["#f0e8f8", "#e8f0e8", "#f8f0e8", "#e8e8f8", "#f8e8e8", "#e8f8f0", "#f8f4e8"];

const LOAD_MSGS = [
  "思い出を読み込んでいます…",
  "Gathering sakura petals…",
  "Counting konbini memories…",
  "Almost ready…",
];

const NAV_ITEMS = [
  { id: "home",     label: "Home",       icon: "🏠" },
  { id: "students", label: "Classmates", icon: "👥" },
  { id: "world",    label: "World",      icon: "🌍" },
  { id: "gallery",  label: "Gallery",    icon: "📸" },
  { id: "memories", label: "Memories",   icon: "💌" },
];

const STATS = [
  { label: "Countries", value: 8,    emoji: "🌍", color: "#f2c4a0" },
  { label: "Students",  value: 20,   emoji: "👥", color: "#a0bef2" },
  { label: "Languages", value: "10+", emoji: "💬", color: "#c4a0f2" },
  { label: "Memories",  value: "∞",  emoji: "🌸", color: "#f2a0c4" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STYLES ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Nunito:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
  
  :root {
    --cream: #faf7f2;
    --warm: #f5efe4;
    --blush: #f9e8ee;
    --mist: #e8eef9;
    --sage: #e8f4ed;
    --text: #2d2420;
    --text-soft: #6b5c52;
    --text-muted: #b0a098;
    --accent: #d4896a;
    --accent-soft: #f0c4a8;
    --border: rgba(180, 155, 135, 0.18);
    --shadow-sm: 0 2px 12px rgba(80,50,30,0.07);
    --shadow-md: 0 8px 32px rgba(80,50,30,0.12);
    --shadow-lg: 0 24px 64px rgba(80,50,30,0.16);
    --radius-sm: 14px;
    --radius-md: 22px;
    --radius-lg: 32px;
  }
  
  body {
    font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    background-image: 
      radial-gradient(ellipse 80% 60% at 20% 0%, rgba(242,196,160,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 80% 100%, rgba(160,190,242,0.14) 0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 50% 50%, rgba(242,160,196,0.08) 0%, transparent 70%);
  }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(180,140,110,0.22); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(180,140,110,0.4); }

  @keyframes float      { 0%,100%{transform:translateY(0) rotate(0)}   50%{transform:translateY(-18px) rotate(2deg)} }
  @keyframes floatSlow  { 0%,100%{transform:translateY(0)}              50%{transform:translateY(-22px)} }
  @keyframes fadeIn     { from{opacity:0}                               to{opacity:1} }
  @keyframes fadeInUp   { from{opacity:0;transform:translateY(28px)}    to{opacity:1;transform:translateY(0)} }
  @keyframes fadeInScale{ from{opacity:0;transform:scale(0.88)}         to{opacity:1;transform:scale(1)} }
  @keyframes scaleIn    { from{opacity:0;transform:scale(0.88) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes slideIn    { from{opacity:0;transform:translateX(-20px)}   to{opacity:1;transform:translateX(0)} }
  @keyframes slideInRight{from{opacity:0;transform:translateX(20px)}    to{opacity:1;transform:translateX(0)} }
  @keyframes sakuraFall { 0%{transform:translateY(-30px) rotate(0deg) translateX(0);opacity:0} 10%{opacity:0.8} 85%{opacity:0.4} 100%{transform:translateY(110vh) rotate(800deg) translateX(80px);opacity:0} }
  @keyframes drift      { 0%,100%{transform:translateX(0) rotate(0) scale(1)} 25%{transform:translateX(18px) rotate(90deg) scale(1.05)} 50%{transform:translateX(6px) rotate(180deg) scale(0.95)} 75%{transform:translateX(-12px) rotate(270deg) scale(1.02)} }
  @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes countUp    { from{opacity:0;transform:translateY(10px)}    to{opacity:1;transform:translateY(0)} }
  @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.65} }
  @keyframes wiggle     { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
  @keyframes heartbeat  { 0%,100%{transform:scale(1)} 14%{transform:scale(1.12)} 28%{transform:scale(1)} 42%{transform:scale(1.08)} 70%{transform:scale(1)} }

  input:focus, textarea:focus { outline: none; box-shadow: 0 0 0 3px rgba(212,137,106,0.18); }
  button { font-family: 'Nunito', -apple-system, sans-serif; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  section { scroll-margin-top: 76px; }

  .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  .glass {
    background: rgba(255,255,255,0.68);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.85);
  }

  .glass-warm {
    background: rgba(250,247,242,0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(240,220,200,0.5);
  }

  .nav-pill {
    background: transparent; border: none; border-radius: 50px;
    padding: 7px 18px; font-size: 13.5px; font-weight: 500;
    color: var(--text-muted); transition: all 0.25s ease;
    font-family: 'Nunito', sans-serif; white-space: nowrap;
    letter-spacing: 0.2px;
  }
  .nav-pill:hover  { background: rgba(212,137,106,0.1); color: var(--accent); }
  .nav-pill.active { background: rgba(212,137,106,0.14); color: var(--accent); font-weight: 600; }

  /* Student card photo hover */
  .card-photo-img { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
  .student-card:hover .card-photo-img { transform: scale(1.08); }

  /* Photo toggle button */
  .photo-toggle-btn {
    transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
  }
  .photo-toggle-btn:hover {
    background: rgba(255,255,255,0.98) !important;
    transform: scale(1.08);
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .nav-label { display: none; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-title { font-size: clamp(56px, 18vw, 110px) !important; }
    .modal-inner { padding: 1.75rem !important; border-radius: 26px !important; }
    .modal-nav-arrow { width: 36px !important; height: 36px !important; }
    .student-grid { grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)) !important; gap: 14px !important; }
  }
  
  @media (max-width: 480px) {
    .modal-nav-arrow { display: none !important; }
  }

  /* Tooltip on role badge */
  .role-badge {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .role-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  /* Scrollbar for modal */
  .modal-scroll::-webkit-scrollbar { width: 4px; }
  .modal-scroll::-webkit-scrollbar-thumb { background: rgba(180,140,110,0.25); border-radius: 3px; }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── HOOKS ──────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function useReveal(ref, delay = 0) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (delay) el.style.transitionDelay = `${delay}s`;
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, delay]);
}

function useThrottledCallback(fn, ms) {
  const lastRef = useRef(0);
  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRef.current >= ms) { lastRef.current = now; fn(...args); }
  }, [fn, ms]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DECORATIVE PARTICLES ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function SakuraPetal({ style }) {
  return (
    <div aria-hidden="true" style={{
      position: "absolute", fontSize: style.size, pointerEvents: "none",
      animation: `sakuraFall ${style.duration}s ease-in infinite`,
      animationDelay: `${style.delay}s`,
      left: style.left, top: "-40px", opacity: 0, zIndex: 1,
      filter: "drop-shadow(0 2px 6px rgba(220,100,120,0.15))",
    }}>🌸</div>
  );
}

function FloatingOrb({ style }) {
  return (
    <div aria-hidden="true" style={{
      position: "absolute", borderRadius: "50%", opacity: 0.22, pointerEvents: "none",
      animation: `float ${style.duration}s ease-in-out infinite`,
      animationDelay: `${style.delay}s`,
      filter: "blur(32px)", ...style,
    }} />
  );
}

const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 6.5) % 96}%`,
  size: `${12 + (i * 2.5) % 10}px`,
  duration: 9 + (i * 1.2) % 9,
  delay: (i * 1.6) % 14,
}));

const ORBS = [
  { width: 380, height: 380, background: "#f9c4ce", top: "2%",  left: "5%",   duration: 9,  delay: 0 },
  { width: 300, height: 300, background: "#c4d6f9", top: "55%", right: "3%",  duration: 11, delay: 2 },
  { width: 240, height: 240, background: "#c4f0c8", top: "28%", right: "22%", duration: 8,  delay: 1 },
  { width: 260, height: 260, background: "#f9e8c4", bottom: "8%", left: "18%", duration: 10, delay: 3.5 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PHOTO AVATAR ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function PhotoAvatar({ student, size = 80, flippable = false }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  const flip = useCallback((e) => {
    if (!flippable || !student.photoSet) return;
    e.stopPropagation();
    setFlipping(true);
    setTimeout(() => { setPhotoIdx(i => (i + 1) % 2); setFlipping(false); }, 220);
  }, [flippable, student.photoSet]);

  const border = Math.max(2, size * 0.035);
  const shadow = `0 ${size * 0.06}px ${size * 0.35}px ${student.color}60, 0 2px 10px rgba(0,0,0,0.1)`;

  if (student.photoSet) {
    return (
      <div
        onClick={flip}
        role={flippable ? "button" : undefined}
        tabIndex={flippable ? 0 : undefined}
        onKeyDown={flippable ? (e) => { if (e.key === "Enter" || e.key === " ") flip(e); } : undefined}
        aria-label={flippable ? `${student.name} — click to switch photo` : student.name}
        style={{
          width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          border: `${border}px solid rgba(255,255,255,0.92)`, boxShadow: shadow,
          cursor: flippable ? "pointer" : "default",
        }}
      >
        <img
          src={student.photoSet[photoIdx]}
          alt={student.name}
          loading="lazy"
          style={{
            width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center",
            opacity: flipping ? 0 : 1,
            transform: flipping ? "scale(0.9)" : "scale(1)",
            transition: "opacity 0.22s ease, transform 0.22s ease",
          }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.style.background = `radial-gradient(135deg, ${student.color} 0%, ${student.color}bb 100%)`;
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, position: "relative",
      background: `radial-gradient(135deg, ${student.color} 0%, ${student.color}bb 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.28, fontWeight: 700, color: "rgba(60,40,30,0.65)",
      fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: 1,
      border: `${border}px solid rgba(255,255,255,0.88)`, boxShadow: shadow,
    }} aria-label={student.name}>
      {student.initials}
      <div style={{ position: "absolute", bottom: size * 0.02, right: size * 0.02, fontSize: size * 0.22, lineHeight: 1 }} aria-hidden="true">
        {student.flag}
      </div>
    </div>
  );
}

const Avatar = React.memo(function Avatar({ student, size = 80 }) {
  return <PhotoAvatar student={student} size={size} flippable={false} />;
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STUDENT CARD — REDESIGNED ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const StudentCard = React.memo(function StudentCard({ student, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const revealRef = useRef(null);
  useReveal(revealRef);

  const currentPhoto = student.photoSet && !imgError ? student.photoSet[photoIdx] : null;

  const switchPhoto = useCallback((e) => {
    e.stopPropagation();
    if (student.photoSet) setPhotoIdx(i => (i + 1) % 2);
  }, [student.photoSet]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(student); }
  }, [onClick, student]);

  return (
    <div
      ref={revealRef}
      className="reveal student-card"
      onClick={() => onClick(student)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`View ${student.name}'s profile`}
      style={{
        borderRadius: 24,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease",
        transform: hovered ? "translateY(-10px) scale(1.015)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 32px 64px rgba(80,50,30,0.2), 0 0 0 1.5px ${student.color}80`
          : "var(--shadow-sm)",
        background: "#fff",
      }}
    >
      {/* ── Photo area — tall and cinematic ── */}
      <div style={{
        position: "relative",
        width: "100%",
        paddingBottom: "138%", /* 3:4.14 tall portrait ratio */
        overflow: "hidden",
        background: `linear-gradient(160deg, ${student.color}e0 0%, ${student.color}70 100%)`,
      }}>
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={student.name}
            loading="lazy"
            className="card-photo-img"
            onError={() => setImgError(true)}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top center",
              display: "block",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <div style={{ fontSize: 58 }} aria-hidden="true">{student.emoji}</div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 40, fontWeight: 700,
              color: "rgba(60,40,30,0.55)",
            }}>{student.initials}</div>
          </div>
        )}

        {/* Deep cinematic gradient overlay */}
        <div aria-hidden="true" style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "65%",
          background: "linear-gradient(to top, rgba(10,6,4,0.82) 0%, rgba(10,6,4,0.35) 50%, transparent 100%)",
          transition: "opacity 0.3s ease",
          opacity: hovered ? 1 : 0.88,
        }} />

        {/* Subtle top vignette */}
        <div aria-hidden="true" style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "30%",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Country badge — top left */}
        <div style={{
          position: "absolute", top: 13, left: 13,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          borderRadius: 50, padding: "4px 12px",
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          border: "1px solid rgba(255,255,255,0.7)",
        }}>
          <span style={{ fontSize: 14 }}>{student.flag}</span>
          <span style={{ fontSize: 10, color: "#555", letterSpacing: 0.4, fontWeight: 600 }}>{student.country}</span>
        </div>

        {/* Photo switch button — top right (shows on hover) */}
        {student.photoSet && (
          <button
            onClick={switchPhoto}
            aria-label="Switch photo"
            className="photo-toggle-btn"
            style={{
              position: "absolute", top: 13, right: 13,
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.7)",
              borderRadius: 50, width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
              opacity: hovered ? 1 : 0,
              boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
            }}
          >📸</button>
        )}

        {/* Name + role overlay — bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "1.25rem 1rem 1rem",
          zIndex: 2,
        }}>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 17, fontWeight: 700, color: "#fff",
            lineHeight: 1.25, marginBottom: 7,
            textShadow: "0 1px 8px rgba(0,0,0,0.35)",
          }}>{student.name}</div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: `${student.color}cc`,
            backdropFilter: "blur(8px)",
            borderRadius: 50, padding: "4px 11px",
            fontSize: 10.5, color: "#fff",
            letterSpacing: 0.4, fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.25)",
          }} className="role-badge">
            <span aria-hidden="true" style={{ fontSize: 11 }}>{student.emoji}</span>
            {student.role}
          </div>
        </div>
      </div>

      {/* ── Info strip — bottom card section ── */}
      <div style={{
        padding: "1rem 1.1rem 1.1rem",
        background: "#fff",
        borderTop: `2.5px solid ${student.color}50`,
      }}>
        <p style={{
          fontSize: 11.5, color: "#888", fontStyle: "italic", lineHeight: 1.6,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          marginBottom: 8,
        }}>
          "{student.quote.length > 68 ? student.quote.slice(0, 68) + "…" : student.quote}"
        </p>
        <div style={{
          fontSize: 10.5,
          color: hovered ? student.color : "#ddd",
          letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700,
          transition: "color 0.3s ease",
        }}>
          {hovered ? "Open profile →" : "· · · · ·"}
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STUDENT MODAL — REDESIGNED ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function StudentModal({ student, onClose, onNext, onPrev }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => { setPhotoIdx(0); setFlipping(false); }, [student.id]);

  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft")  onPrev();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const flipPhoto = useCallback(() => {
    if (!student.photoSet) return;
    setFlipping(true);
    setTimeout(() => { setPhotoIdx(i => (i + 1) % 2); setFlipping(false); }, 220);
  }, [student.photoSet]);

  const currentPhoto = student.photoSet ? student.photoSet[photoIdx] : null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${student.name}'s profile`}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,10,8,0.6)",
        backdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px 16px",
        animation: "fadeIn 0.22s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-inner modal-scroll"
        style={{
          background: "rgba(253,251,248,0.98)",
          backdropFilter: "blur(30px)",
          borderRadius: 36,
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow: `0 56px 130px rgba(0,0,0,0.25), 0 0 0 1.5px ${student.color}50`,
          maxWidth: 540, width: "100%",
          animation: "scaleIn 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
          position: "relative", overflow: "hidden",
          maxHeight: "94vh", overflowY: "auto",
        }}
      >
        {/* Color wash top */}
        <div aria-hidden="true" style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 260,
          background: `linear-gradient(160deg, ${student.color}55 0%, ${student.color}18 60%, transparent 100%)`,
          pointerEvents: "none",
        }} />
        
        {/* Decorative blob bottom */}
        <div aria-hidden="true" style={{
          position: "absolute", bottom: -60, right: -60, width: 200, height: 200,
          borderRadius: "50%", background: student.color, opacity: 0.1,
          filter: "blur(24px)", pointerEvents: "none",
        }} />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(0,0,0,0.07)", border: "none",
            borderRadius: "50%", width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "#666", zIndex: 10,
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.13)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.07)"}
        >×</button>

        {/* Nav arrows */}
        {["left", "right"].map(side => (
          <button
            key={side}
            onClick={side === "left" ? onPrev : onNext}
            aria-label={side === "left" ? "Previous student" : "Next student"}
            className="modal-nav-arrow"
            style={{
              position: "absolute", top: "50%",
              [side]: 16, transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(200,185,170,0.35)",
              borderRadius: "50%", width: 38, height: 38,
              fontSize: 16, color: "#888",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10, transition: "all 0.2s",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.color = "#888"; }}
          >{side === "left" ? "‹" : "›"}</button>
        ))}

        {/* ── Content ── */}
        <div style={{ padding: "2rem 2.25rem 2.5rem", position: "relative", zIndex: 1 }}>
          
          {/* Header: large photo + info */}
          <div style={{ display: "flex", gap: 22, alignItems: "flex-start", marginBottom: "2rem" }}>
            
            {/* Photo — bigger and rounder */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                onClick={flipPhoto}
                role={student.photoSet ? "button" : undefined}
                aria-label={student.photoSet ? "Click to switch photo" : undefined}
                style={{
                  width: 130, aspectRatio: "3/4", borderRadius: 22, overflow: "hidden",
                  border: "3.5px solid rgba(255,255,255,0.95)",
                  boxShadow: `0 10px 40px ${student.color}80, 0 2px 14px rgba(0,0,0,0.12)`,
                  cursor: student.photoSet ? "pointer" : "default",
                  background: `linear-gradient(160deg, ${student.color}cc 0%, ${student.color}66 100%)`,
                  transition: "transform 0.25s ease",
                }}
                onMouseEnter={e => { if(student.photoSet) e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
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
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 38 }}>{student.emoji}</span>
                    <span style={{ fontSize: 30, fontWeight: 700, color: "rgba(60,40,30,0.55)", fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {student.initials}
                    </span>
                  </div>
                )}
              </div>

              {/* Photo dots */}
              {student.photoSet && (
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1].map(i => (
                    <div key={i} style={{
                      width: i === photoIdx ? 18 : 6, height: 6,
                      borderRadius: 4,
                      background: i === photoIdx ? student.color : "rgba(0,0,0,0.12)",
                      transition: "all 0.3s ease", cursor: "pointer",
                    }} onClick={() => { setPhotoIdx(i); }} />
                  ))}
                </div>
              )}
            </div>

            {/* Name, flag, role info */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{student.flag}</span>
                <span style={{ fontSize: 12, color: "#999", fontWeight: 500, letterSpacing: 0.3 }}>{student.country}</span>
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 26, fontWeight: 700, color: "#1e1410",
                lineHeight: 1.2, marginBottom: 10,
              }}>{student.name}</h2>
              
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: `${student.color}28`,
                border: `1.5px solid ${student.color}60`,
                borderRadius: 50, padding: "5px 14px",
                fontSize: 12, color: "#555", fontWeight: 600, letterSpacing: 0.3,
                marginBottom: 14,
              }}>
                <span>{student.emoji}</span>
                {student.role}
              </div>
              
              {/* Dream */}
              <div style={{
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(220,210,200,0.5)",
                borderRadius: 14, padding: "10px 14px",
              }}>
                <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: 2.5, color: "#ccc", marginBottom: 5, fontWeight: 700 }}>Dream</div>
                <p style={{ fontSize: 13.5, color: "#2a2a2a", fontWeight: 500, lineHeight: 1.55 }}>{student.dream}</p>
              </div>
            </div>
          </div>

          {/* Quote */}
          <blockquote style={{
            borderLeft: `3.5px solid ${student.color}`,
            paddingLeft: "1.2rem", marginBottom: "1.5rem",
            background: `${student.color}10`,
            borderRadius: "0 16px 16px 0",
            padding: "1rem 1rem 1rem 1.4rem",
          }}>
            <div aria-hidden="true" style={{
              fontSize: 38, color: student.color, lineHeight: 0.5, marginBottom: 8,
              fontFamily: "Georgia", opacity: 0.5,
            }}>"</div>
            <p style={{ fontSize: 15, fontStyle: "italic", color: "#4a4040", lineHeight: 1.85 }}>{student.quote}</p>
          </blockquote>

          {/* Memory */}
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2.5, color: "#c0b0a0", marginBottom: 10, fontWeight: 700 }}>Memory from Japan</div>
            <div style={{
              background: "linear-gradient(135deg, rgba(250,248,244,0.9), rgba(245,242,236,0.9))",
              borderRadius: 18, padding: "1.1rem 1.4rem",
              fontSize: 14, color: "#555", lineHeight: 1.9, fontStyle: "italic",
              border: "1px solid rgba(230,218,205,0.6)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
            }}>
              <span aria-hidden="true" style={{ fontSize: 22, marginRight: 10 }}>{student.emoji}</span>
              {student.memory}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── WORLD SECTION ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function WorldSection({ students, onSelectCountry, selectedCountry }) {
  const countryGroups = useMemo(() => {
    const g = {};
    students.forEach(s => { if (!g[s.country]) g[s.country] = []; g[s.country].push(s); });
    return g;
  }, [students]);
  const countries = useMemo(() => Object.keys(countryGroups), [countryGroups]);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: "3rem" }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: 24,
            padding: "1.75rem 1rem",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
            position: "relative", overflow: "hidden",
          }}>
            <div aria-hidden="true" style={{
              position: "absolute", top: -20, right: -20, width: 90, height: 90,
              borderRadius: "50%", background: s.color, opacity: 0.18, filter: "blur(16px)",
              pointerEvents: "none",
            }} />
            <div aria-hidden="true" style={{ fontSize: 30, marginBottom: 10 }}>{s.emoji}</div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 40, fontWeight: 700, color: "#1e1410", lineHeight: 1,
            }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: "#b0a090", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 5, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Country filter pills */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontSize: 13, color: "#c0b0a0", marginBottom: 16, textAlign: "center", letterSpacing: 0.3 }}>
          {selectedCountry
            ? `✦ Showing ${countryGroups[selectedCountry]?.length} student${countryGroups[selectedCountry]?.length !== 1 ? "s" : ""} from ${selectedCountry}`
            : "Tap a flag to spotlight classmates from that country"}
        </p>
        <div role="group" aria-label="Filter by country" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {countries.map(country => {
            const s = countryGroups[country];
            const isSel = selectedCountry === country;
            return (
              <button
                key={country}
                onClick={() => onSelectCountry(isSel ? null : country)}
                aria-pressed={isSel}
                style={{
                  background: isSel ? "rgba(212,137,106,0.15)" : "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(10px)",
                  border: isSel ? "1.5px solid rgba(212,137,106,0.55)" : "1px solid rgba(210,195,180,0.45)",
                  borderRadius: 50, padding: "8px 18px",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13.5, color: isSel ? "var(--accent)" : "var(--text-soft)",
                  fontWeight: isSel ? 700 : 500,
                  transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                  transform: isSel ? "scale(1.07)" : "scale(1)",
                  boxShadow: isSel ? "0 6px 22px rgba(212,137,106,0.2)" : "var(--shadow-sm)",
                }}
              >
                <span style={{ fontSize: 18 }}>{s[0].flag}</span>
                {country}
                <span style={{
                  background: isSel ? "rgba(212,137,106,0.2)" : "rgba(200,185,170,0.3)",
                  borderRadius: 50, padding: "2px 8px", fontSize: 11, color: isSel ? "var(--accent)" : "#999",
                  fontWeight: 700,
                }}>{s.length}</span>
              </button>
            );
          })}
          {selectedCountry && (
            <button
              onClick={() => onSelectCountry(null)}
              style={{
                background: "transparent",
                border: "1px dashed rgba(200,185,170,0.5)",
                borderRadius: 50, padding: "8px 18px",
                fontSize: 12.5, color: "#c0b0a0",
                transition: "all 0.2s", fontWeight: 500,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "rgba(200,185,170,0.8)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#c0b0a0"; e.currentTarget.style.borderColor = "rgba(200,185,170,0.5)"; }}
            >× Show everyone</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GALLERY ITEM — POLAROID STYLE ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const GalleryItem = React.memo(function GalleryItem({ item, index }) {
  const [hovered, setHovered] = useState(false);
  const revealRef = useRef(null);
  useReveal(revealRef, index * 0.06);

  return (
    <div
      ref={revealRef}
      className="reveal"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 6,
        padding: "14px 14px 42px",
        transform: `rotate(${item.rotate}deg) ${hovered ? "scale(1.08) rotate(0deg) translateY(-6px)" : ""}`,
        transition: "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.38s ease",
        boxShadow: hovered
          ? "0 28px 60px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.12)"
          : "0 4px 18px rgba(0,0,0,0.1), 0 1px 5px rgba(0,0,0,0.06)",
        border: "1px solid rgba(200,190,180,0.25)",
        cursor: "default",
        zIndex: hovered ? 10 : 1,
        position: "relative",
      }}
    >
      {/* Photo area with gradient */}
      <div style={{
        width: "100%", paddingBottom: "90%",
        position: "relative", overflow: "hidden",
        borderRadius: 3,
        background: item.bg,
        marginBottom: 0,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: 44,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.12))",
            animation: hovered ? "wiggle 0.4s ease-in-out" : "none",
            display: "block",
          }} aria-hidden="true">{item.emoji}</span>
        </div>
      </div>

      {/* Polaroid caption area */}
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#2d2420", marginBottom: 3, letterSpacing: 0.2 }}>{item.label}</div>
        <div style={{ fontSize: 10.5, color: "#b0a090", fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>{item.note}</div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── QUOTE CARD ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const QuoteCard = React.memo(function QuoteCard({ item, index }) {
  const [hovered, setHovered] = useState(false);
  const revealRef = useRef(null);
  useReveal(revealRef, index * 0.07);

  return (
    <blockquote
      ref={revealRef}
      className="reveal"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(235,222,208,0.7)",
        borderRadius: 22,
        padding: "1.8rem 2rem",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      <div aria-hidden="true" style={{
        fontSize: 60, color: "rgba(212,137,106,0.18)", fontFamily: "Georgia",
        lineHeight: 0.6, marginBottom: 12,
      }}>"</div>
      <p style={{
        fontSize: 18, color: "#3a3030", lineHeight: 1.9,
        fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif",
        marginBottom: 14,
      }}>{item.quote}</p>
      <footer style={{
        fontSize: 12, color: "#c0b0a0", letterSpacing: 0.5, fontWeight: 600,
      }}>— {item.author}</footer>
    </blockquote>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ANONYMOUS MESSAGES ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function AnonymousMessages() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  const add = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    setMessages(m => [...m, { id: Date.now(), text, color }]);
    setDraft("");
  }, [draft]);

  return (
    <section aria-label="Anonymous friendship notes">
      <div style={{ display: "grid", gap: 10, marginBottom: "1.5rem" }}>
        {messages.map((m, i) => (
          <div key={m.id} style={{
            background: m.color, borderRadius: 18, padding: "1.1rem 1.4rem",
            fontSize: 14, color: "#4a3a30", lineHeight: 1.8,
            border: "1px solid rgba(255,255,255,0.85)",
            animation: i === messages.length - 1 ? "slideIn 0.4s ease" : "none",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}>{m.text}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Leave an anonymous note for a classmate…"
          aria-label="Anonymous note"
          maxLength={280}
          style={{
            flex: 1, padding: "13px 20px", borderRadius: 50,
            border: "1.5px solid rgba(200,185,168,0.5)",
            background: "rgba(255,255,255,0.88)", fontSize: 14,
            color: "#2d2420", fontFamily: "'Nunito', sans-serif",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(212,137,106,0.55)"}
          onBlur={e => e.target.style.borderColor = "rgba(200,185,168,0.5)"}
        />
        <button
          onClick={add}
          aria-label="Send note"
          style={{
            background: "linear-gradient(135deg, #d4896a, #c47050)",
            color: "white", border: "none",
            borderRadius: 50, padding: "13px 26px",
            fontSize: 13.5, fontWeight: 700,
            transition: "all 0.25s ease",
            boxShadow: "0 4px 16px rgba(212,137,106,0.35)",
            letterSpacing: 0.3,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(212,137,106,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(212,137,106,0.35)"; }}
        >Send ✦</button>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TIME CAPSULE ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

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
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(20px)",
          border: "1.5px dashed rgba(180,155,130,0.4)",
          borderRadius: 28,
          padding: "3.5rem 2.5rem",
          transition: "transform 0.35s ease, opacity 0.35s ease",
          transform: opening ? "scale(0.96)" : "scale(1)",
          opacity: opening ? 0.6 : 1,
        }}>
          <div aria-hidden="true" style={{
            fontSize: 56, marginBottom: 20,
            animation: "float 3.5s ease-in-out infinite",
            display: "inline-block",
            filter: "drop-shadow(0 6px 16px rgba(200,100,80,0.15))",
          }}>📮</div>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 26, fontWeight: 700, color: "#1e1410",
            marginBottom: 12, lineHeight: 1.35,
          }}>A letter from your past self</h3>
          <p style={{ fontSize: 14, color: "#b0a090", marginBottom: 30, lineHeight: 1.7 }}>
            Written on graduation day.<br />Open when you're ready.
          </p>
          <button
            onClick={open}
            style={{
              background: "linear-gradient(135deg, #d4896a, #b86a48)",
              color: "white", border: "none",
              borderRadius: 50, padding: "14px 40px",
              fontSize: 14.5, fontWeight: 700, letterSpacing: 0.4,
              boxShadow: "0 10px 28px rgba(212,137,106,0.38)",
              transition: "all 0.28s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(212,137,106,0.46)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(212,137,106,0.38)"; }}
          >Open the capsule 📬</button>
        </div>
      ) : (
        <div style={{ animation: "fadeIn 0.8s ease", textAlign: "left" }}>
          {MEMORY_CAPSULE.map((msg, i) => {
            const isLast = i === MEMORY_CAPSULE.length - 1;
            return (
              <div key={i} style={{
                background: isLast ? "rgba(242,196,220,0.25)" : "rgba(255,255,255,0.75)",
                backdropFilter: "blur(10px)",
                border: isLast ? "1px solid rgba(242,180,196,0.4)" : "1px solid rgba(230,218,205,0.7)",
                borderRadius: 20, padding: "1.4rem 1.75rem", marginBottom: 12,
                fontSize: isLast ? 17 : 15,
                color: "#3a2e28", lineHeight: 1.9,
                fontStyle: isLast ? "italic" : "normal",
                fontFamily: isLast ? "'Playfair Display', Georgia, serif" : "inherit",
                animation: `fadeInUp 0.55s ease ${i * 0.18}s both`,
                boxShadow: "0 2px 14px rgba(0,0,0,0.05)",
              }}>
                {isLast && <span aria-hidden="true" style={{ marginRight: 10 }}>🌸</span>}
                {msg}
              </div>
            );
          })}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={() => setRevealed(false)}
              style={{
                background: "transparent", color: "#c0b0a0",
                border: "1px solid rgba(200,185,168,0.4)",
                borderRadius: 50, padding: "9px 24px",
                fontSize: 13, fontWeight: 500, transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "rgba(200,185,168,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#c0b0a0"; e.currentTarget.style.borderColor = "rgba(200,185,168,0.4)"; }}
            >Seal again ✦</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RANDOM MEMORY ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function RandomMemoryButton({ students }) {
  const [memory, setMemory] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const pick = useCallback(() => {
    setSpinning(true);
    setMemory(null);
    setTimeout(() => {
      const all = students.map(s => ({ student: s, memory: s.memory, emoji: s.emoji }));
      setMemory(all[Math.floor(Math.random() * all.length)]);
      setSpinning(false);
    }, 420);
  }, [students]);

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={pick}
        aria-label="Surface a random class memory"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
          border: "1.5px solid rgba(180,155,130,0.45)",
          borderRadius: 50,
          padding: "16px 40px",
          fontSize: 15, color: "#4a3a30", fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 12,
          boxShadow: "var(--shadow-sm)",
          transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.85)"; }}
      >
        <span aria-hidden="true" style={{
          fontSize: 20,
          display: "inline-block",
          animation: spinning ? "drift 0.42s linear" : "heartbeat 2.5s ease-in-out infinite",
        }}>✦</span>
        {spinning ? "Finding a memory…" : "Surface a random memory"}
      </button>

      {memory && (
        <div style={{
          marginTop: 26,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(230,218,205,0.9)",
          borderRadius: 28, padding: "2.2rem",
          animation: "scaleIn 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
          maxWidth: 540, margin: "26px auto 0",
          boxShadow: `0 20px 56px ${memory.student.color}55, var(--shadow-sm)`,
        }}>
          <div aria-hidden="true" style={{ fontSize: 40, marginBottom: 14 }}>{memory.emoji}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, justifyContent: "center" }}>
            <Avatar student={memory.student} size={38} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1e1410", fontFamily: "'Playfair Display', Georgia, serif" }}>{memory.student.name}</span>
            <span style={{ fontSize: 16 }}>{memory.student.flag}</span>
          </div>
          <p style={{ fontSize: 16.5, color: "#4a3a30", lineHeight: 1.9, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>
            "{memory.memory}"
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MINI VIDEOS ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function MiniVideos() {
  const [playing, setPlaying] = useState(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
      {MINI_VIDEOS.map((v, i) => (
        <button
          key={v.id}
          onClick={() => setPlaying(playing === v.id ? null : v.id)}
          aria-pressed={playing === v.id}
          aria-label={`${v.title} — ${v.duration}`}
          style={{
            background: v.color, borderRadius: 22,
            padding: "1.6rem 1.4rem",
            textAlign: "left",
            border: playing === v.id ? "2px solid rgba(212,137,106,0.5)" : "1px solid rgba(255,255,255,0.8)",
            transform: playing === v.id ? "scale(0.97)" : "scale(1)",
            boxShadow: playing === v.id ? "inset 0 4px 24px rgba(0,0,0,0.1)" : "var(--shadow-sm)",
            transition: "all 0.3s ease",
            animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
          }}
          onMouseEnter={e => { if (playing !== v.id) e.currentTarget.style.transform = "scale(1.035) translateY(-2px)"; }}
          onMouseLeave={e => { if (playing !== v.id) e.currentTarget.style.transform = "scale(1)"; }}
        >
          <div aria-hidden="true" style={{ fontSize: 38, marginBottom: 14, textAlign: "center" }}>
            {playing === v.id ? "⏸️" : v.emoji}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1e1410", marginBottom: 4 }}>{v.title}</div>
          <div style={{ fontSize: 12, color: "#b0a090", marginBottom: 7, fontWeight: 500 }}>{v.duration}</div>
          <div style={{ fontSize: 12, color: "#8a7a6a", fontStyle: "italic", lineHeight: 1.55 }}>{v.note}</div>
          {playing === v.id && (
            <div style={{
              marginTop: 14, background: "rgba(255,255,255,0.72)",
              borderRadius: 10, padding: "9px 14px",
              fontSize: 12.5, color: "#6a5a50", textAlign: "center", fontWeight: 500,
            }}>
              🎬 Playing…
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── COUNTDOWN ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const GRADUATION = new Date("2025-03-20T09:00:00+09:00");

function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0, past: false });

  useEffect(() => {
    const tick = () => {
      const diff = GRADUATION - Date.now();
      if (diff <= 0) {
        setTime({ days: Math.floor(Math.abs(diff) / 86400000), hours: 0, mins: 0, secs: 0, past: true });
        return;
      }
      setTime({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000) / 60000),
        secs:  Math.floor((diff % 60000) / 1000),
        past: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (time.past) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontStyle: "italic", color: "#9a8070" }}>
          Graduated {time.days} days ago 🌸
        </p>
        <p style={{ fontSize: 13, color: "#c0b0a0", marginTop: 6 }}>The memories remain forever.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 3.5, color: "#c4a882", textTransform: "uppercase", textAlign: "center", marginBottom: 18, fontWeight: 600 }}>
        Until graduation
      </div>
      <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
        {[{ label: "Days", val: time.days }, { label: "Hours", val: time.hours }, { label: "Mins", val: time.mins }, { label: "Secs", val: time.secs }].map(p => (
          <div key={p.label} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 46, fontWeight: 700, color: "#1e1410", lineHeight: 1, minWidth: 56,
              animation: "countUp 0.3s ease",
            }}>{String(p.val).padStart(2, "0")}</div>
            <div style={{ fontSize: 10.5, letterSpacing: 2.5, color: "#c0b0a0", textTransform: "uppercase", marginTop: 5, fontWeight: 600 }}>{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SECTION HEADING ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHeading({ tag, title, sub }) {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <div ref={ref} className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
      <div style={{
        fontSize: 11, letterSpacing: 4.5, color: "var(--accent)",
        textTransform: "uppercase", marginBottom: 16, fontWeight: 700,
      }}>{tag}</div>
      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "clamp(34px, 5.5vw, 52px)", fontWeight: 700,
        color: "#1e1410", margin: "0 0 14px", lineHeight: 1.15,
      }}>{title}</h2>
      {sub && <p style={{
        color: "#b0a090", fontSize: 15.5,
        maxWidth: 540, margin: "0 auto", lineHeight: 1.75, fontWeight: 400,
      }}>{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LOADING SCREEN ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingScreen({ progress, msg }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Loading yearbook" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(145deg, #faf7f2 0%, #f5efe4 50%, #ede4f0 100%)",
    }}>
      <style>{GLOBAL_CSS}</style>
      <div aria-hidden="true" style={{
        fontSize: 50, marginBottom: 24,
        animation: "float 2.2s ease-in-out infinite",
        display: "inline-block",
        filter: "drop-shadow(0 8px 20px rgba(220,100,120,0.2))",
      }}>🌸</div>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 28, color: "#3a2e28", marginBottom: 8, textAlign: "center",
        fontWeight: 700,
      }}>{CLASS_DATA.school}</div>
      <div style={{ fontSize: 12.5, color: "#c0b0a0", marginBottom: 48, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>
        {CLASS_DATA.year}
      </div>
      <div style={{ width: 240, marginBottom: 16 }}>
        <div style={{ height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #d4896a, #c4a882, #9abfc4)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.2s linear infinite",
            borderRadius: 3,
            width: `${progress}%`, transition: "width 0.12s ease",
          }} />
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#d0c0b0", letterSpacing: 0.5 }}>{msg}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN APP ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function Yearbook() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activeSection, setActiveSection]     = useState("home");
  const [loading, setLoading]                 = useState(true);
  const [loadProgress, setLoadProgress]       = useState(0);
  const [loadMsg, setLoadMsg]                 = useState(LOAD_MSGS[0]);
  const [musicOn, setMusicOn]                 = useState(false);
  const [navScrolled, setNavScrolled]         = useState(false);
  const sectionsRef = useRef({});

  // Loading progress
  useEffect(() => {
    let prog = 0;
    const timer = setInterval(() => {
      prog = Math.min(prog + 1.6, 100);
      setLoadProgress(prog);
      setLoadMsg(LOAD_MSGS[Math.min(Math.floor(prog / 25), LOAD_MSGS.length - 1)]);
      if (prog >= 100) { clearInterval(timer); setTimeout(() => setLoading(false), 500); }
    }, 28);
    return () => clearInterval(timer);
  }, []);

  // Throttled scroll
  const handleScroll = useCallback(() => {
    setNavScrolled(window.scrollY > 20);
    const entries = Object.entries(sectionsRef.current);
    for (let i = entries.length - 1; i >= 0; i--) {
      const [id, el] = entries[i];
      if (el && el.getBoundingClientRect().top <= 100) { setActiveSection(id); break; }
    }
  }, []);
  const throttledScroll = useThrottledCallback(handleScroll, 100);

  useEffect(() => {
    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [throttledScroll]);

  const scrollTo = useCallback((id) => {
    sectionsRef.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const filteredStudents = useMemo(
    () => selectedCountry ? STUDENTS.filter(s => s.country === selectedCountry) : STUDENTS,
    [selectedCountry]
  );

  const selectedIdx = useMemo(
    () => selectedStudent ? STUDENTS.findIndex(s => s.id === selectedStudent.id) : -1,
    [selectedStudent]
  );
  const openNext = useCallback(() => selectedIdx >= 0 && setSelectedStudent(STUDENTS[(selectedIdx + 1) % STUDENTS.length]), [selectedIdx]);
  const openPrev = useCallback(() => selectedIdx >= 0 && setSelectedStudent(STUDENTS[(selectedIdx - 1 + STUDENTS.length) % STUDENTS.length]), [selectedIdx]);

  if (loading) return <LoadingScreen progress={loadProgress} msg={loadMsg} />;

  return (
    <div style={{
      fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: "100vh", color: "var(--text)",
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAVIGATION ── */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: navScrolled ? "rgba(250,247,242,0.94)" : "rgba(250,247,242,0.72)",
          backdropFilter: "blur(24px)",
          borderBottom: navScrolled ? "1px solid rgba(210,195,175,0.35)" : "1px solid transparent",
          padding: "0 2rem", height: 72,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <button
          onClick={() => scrollTo("home")}
          aria-label="Go to top"
          style={{
            background: "none", border: "none", padding: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 17, fontWeight: 700, color: "#1e1410",
            display: "flex", alignItems: "center", gap: 9,
            letterSpacing: 0.2,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 20 }}>🌸</span>
          <span>Class 3B · {CLASS_DATA.year}</span>
        </button>

        <div style={{ display: "flex", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`nav-pill${activeSection === item.id ? " active" : ""}`}
              aria-current={activeSection === item.id ? "location" : undefined}
            >
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setMusicOn(v => !v)}
          aria-pressed={musicOn}
          aria-label={musicOn ? "Turn music off" : "Turn music on"}
          style={{
            background: musicOn ? "rgba(212,137,106,0.14)" : "transparent",
            border: `1px solid ${musicOn ? "rgba(212,137,106,0.4)" : "rgba(200,185,168,0.4)"}`,
            borderRadius: 50, padding: "7px 18px",
            fontSize: 12.5,
            color: musicOn ? "var(--accent)" : "#b0a090",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 6, fontWeight: 600,
          }}
        >
          <span aria-hidden="true">{musicOn ? "🎵" : "♪"}</span>
          {musicOn ? "On" : "Off"}
        </button>
      </nav>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── HERO SECTION ──                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        ref={el => { sectionsRef.current.home = el; }}
        id="home"
        aria-labelledby="hero-heading"
        style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          padding: "72px 2rem 4rem", textAlign: "center",
        }}
      >
        {PETALS.map((p, i) => <SakuraPetal key={i} style={p} />)}
        {ORBS.map((o, i) => <FloatingOrb key={i} style={o} />)}

        <div style={{ position: "relative", zIndex: 2, animation: "fadeInUp 1s ease 0.15s both", maxWidth: 720 }}>
          <div style={{
            fontSize: 11.5, letterSpacing: 5.5, color: "var(--accent)",
            textTransform: "uppercase", marginBottom: 32, fontWeight: 700,
          }}>
            {CLASS_DATA.city} · {CLASS_DATA.year}
          </div>

          <h1
            id="hero-heading"
            className="hero-title"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(68px, 12vw, 116px)",
              fontWeight: 700, color: "#1a1008", lineHeight: 0.9,
              margin: "0 0 16px", letterSpacing: -2,
            }}
          >Class 3B</h1>

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(17px, 2.8vw, 24px)",
            fontWeight: 400, fontStyle: "italic", color: "#8a7060",
            margin: "0 0 50px", lineHeight: 1.45,
          }}>{CLASS_DATA.school}</h2>

          {/* Quote pill */}
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(220,200,180,0.5)",
            borderRadius: 100, padding: "15px 38px",
            marginBottom: 60,
            boxShadow: "0 4px 28px rgba(0,0,0,0.06)",
          }}>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 18.5, fontStyle: "italic", color: "#6a5040",
            }}>
              {CLASS_DATA.groupQuote}
            </span>
          </div>

          {/* Avatar strip */}
          <div style={{ marginBottom: 22 }}>
            <div aria-label="Class members" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
              {STUDENTS.slice(0, 12).map((s, i) => (
                <div
                  key={s.id}
                  title={s.name}
                  style={{
                    marginLeft: i > 0 ? -15 : 0, zIndex: 12 - i,
                    width: 50, height: 50, borderRadius: "50%",
                    background: `radial-gradient(135deg, ${s.color} 0%, ${s.color}aa 100%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12.5, fontWeight: 700, color: "rgba(60,40,30,0.65)",
                    border: "3px solid rgba(255,255,255,0.94)",
                    boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
                    fontFamily: "'Playfair Display', Georgia, serif",
                    transition: "transform 0.2s, z-index 0s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.1)"; e.currentTarget.style.zIndex = "99"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.zIndex = 12 - i; }}
                  aria-label={s.name}
                >{s.initials}</div>
              ))}
              <div
                style={{
                  marginLeft: -15, zIndex: 0, width: 50, height: 50,
                  borderRadius: "50%",
                  background: "rgba(200,185,168,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11.5, fontWeight: 700, color: "#a09080",
                  border: "3px solid rgba(255,255,255,0.9)",
                }}
                aria-label="8 more students"
              >+8</div>
            </div>
            <p style={{ fontSize: 13.5, color: "#b0a090", letterSpacing: 0.5, fontWeight: 500 }}>
              20 students · 8 countries · 1 unforgettable year
            </p>
          </div>

          {/* Countdown */}
          <div style={{
            marginTop: 44,
            background: "rgba(255,255,255,0.68)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(220,205,185,0.5)",
            borderRadius: 28,
            padding: "2rem 3rem",
            display: "inline-block",
            boxShadow: "var(--shadow-sm)",
          }}>
            <Countdown />
          </div>
        </div>

        {/* Scroll cue */}
        <div aria-hidden="true" style={{
          position: "absolute", bottom: 38, left: "50%", transform: "translateX(-50%)",
          animation: "floatSlow 2.8s ease-in-out infinite", zIndex: 2,
        }}>
          <div style={{ fontSize: 10, color: "#d4c4b0", letterSpacing: 3.5, textTransform: "uppercase", marginBottom: 7, fontWeight: 600 }}>Scroll</div>
          <div style={{ fontSize: 16, color: "#d4c4b0", textAlign: "center" }}>↓</div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── STUDENTS SECTION ──                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        ref={el => { sectionsRef.current.students = el; }}
        id="students"
        aria-labelledby="students-heading"
        style={{ padding: "6rem 2rem 4rem", maxWidth: 1340, margin: "0 auto" }}
      >
        <SectionHeading
          tag="Our Class"
          title="Classmates"
          sub="From across Asia, brought together by Japanese and kept together by friendship. Click any card to see their story."
        />
        <div
          className="student-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 20 }}
        >
          {STUDENTS.map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <StudentCard student={s} onClick={setSelectedStudent} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── WORLD SECTION ──                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        ref={el => { sectionsRef.current.world = el; }}
        id="world"
        aria-labelledby="world-heading"
        style={{
          padding: "7rem 2rem 5rem",
          background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.25) 100%)",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <SectionHeading
            tag="Where We Come From"
            title="A World in One Classroom"
            sub="Every seat held a different story. Every voice added a new color to our shared year."
          />
          <WorldSection students={STUDENTS} onSelectCountry={setSelectedCountry} selectedCountry={selectedCountry} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginTop: "1rem" }}>
            {filteredStudents.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                aria-label={`View ${s.name}'s profile`}
                style={{
                  background: "rgba(255,255,255,0.78)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(225,210,195,0.5)",
                  borderRadius: 20,
                  padding: "1.1rem 1.3rem",
                  textAlign: "left",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.28s ease",
                  animation: `fadeInUp 0.42s ease ${i * 0.05}s both`,
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.background = "#fff";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.78)";
                }}
              >
                <Avatar student={s} size={48} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1410", fontFamily: "'Playfair Display', Georgia, serif" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#b0a090", marginTop: 2, fontWeight: 500 }}>{s.flag} {s.country}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── GALLERY SECTION ──                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        ref={el => { sectionsRef.current.gallery = el; }}
        id="gallery"
        aria-labelledby="gallery-heading"
        style={{ padding: "7rem 2rem 5rem", maxWidth: 1340, margin: "0 auto" }}
      >
        <SectionHeading
          tag="Photo Memories"
          title="Polaroid Gallery"
          sub="Hover to relive the moment. Every photo holds a story only we know."
        />
        
        {/* Polaroid grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
          gap: 32, padding: "1.5rem 1rem 2rem",
        }}>
          {GALLERY_ITEMS.map((item, i) => <GalleryItem key={item.id} item={item} index={i} />)}
        </div>

        {/* Video memories */}
        <div style={{ marginTop: "5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ fontSize: 11, letterSpacing: 4.5, color: "var(--accent)", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>Video Memories</div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 36, fontWeight: 700, color: "#1e1410",
            }}>Class Films</h3>
          </div>
          <MiniVideos />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MEMORIES SECTION ──                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        ref={el => { sectionsRef.current.memories = el; }}
        id="memories"
        aria-labelledby="memories-heading"
        style={{
          padding: "7rem 2rem 5rem",
          background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.25) 100%)",
        }}
      >
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <SectionHeading tag="Memories & Moments" title="Things We'll Never Forget" />

          {/* Random memory */}
          <div style={{ marginBottom: "5rem" }}>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26,
              color: "#2d2420", marginBottom: "2rem", textAlign: "center", fontWeight: 600,
            }}>Random Memory</h3>
            <RandomMemoryButton students={STUDENTS} />
          </div>

          {/* Class quotes */}
          <div style={{ marginBottom: "5rem" }}>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26,
              color: "#2d2420", marginBottom: "2rem", textAlign: "center", fontWeight: 600,
            }}>Class Quotes</h3>
            <div style={{ display: "grid", gap: 14 }}>
              {FUNNY_QUOTES.map((q, i) => <QuoteCard key={i} item={q} index={i} />)}
            </div>
          </div>

          {/* Anonymous notes */}
          <div style={{ marginBottom: "5rem" }}>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26,
              color: "#2d2420", marginBottom: 10, textAlign: "center", fontWeight: 600,
            }}>Anonymous Friendship Notes</h3>
            <p style={{ fontSize: 13.5, color: "#c0b0a0", textAlign: "center", marginBottom: "2rem", fontStyle: "italic" }}>
              Leave a note without revealing who you are.
            </p>
            <AnonymousMessages />
          </div>

          {/* Time Capsule */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26,
              color: "#2d2420", marginBottom: "2rem", textAlign: "center", fontWeight: 600,
            }}>Time Capsule</h3>
            <TimeCapsule />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── FOOTER ──                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <footer style={{
        padding: "5rem 2rem 4.5rem",
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(215,200,185,0.3)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(242,196,172,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(215,200,185,0.4)",
          borderRadius: 50, padding: "11px 26px", marginBottom: 30,
        }}>
          <span aria-hidden="true" style={{ fontSize: 18 }}>🌸</span>
          <span style={{ fontSize: 13, color: "#8a7060", letterSpacing: 1.5, fontWeight: 600 }}>{CLASS_DATA.school}</span>
        </div>

        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(30px, 5.5vw, 46px)",
          marginBottom: 8, color: "#1e1410", fontWeight: 700,
        }}>
          Class 3B · 2024–2025
        </div>
        <div style={{ fontSize: 14.5, color: "#b4a494", marginBottom: 36, fontWeight: 500 }}>{CLASS_DATA.city}</div>

        <div aria-label="All classmates" style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center",
          gap: "4px 8px", maxWidth: 780, margin: "0 auto 40px",
        }}>
          {STUDENTS.map((s, i) => (
            <span key={s.id} style={{
              fontSize: 13, color: "#9a8878",
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "2px 0", fontWeight: 500,
            }}>
              {i > 0 && <span aria-hidden="true" style={{ color: "#e0d5c4", margin: "0 3px" }}>·</span>}
              <span aria-hidden="true">{s.flag}</span>{s.name.split(" ")[0]}
            </span>
          ))}
        </div>

        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 20, fontStyle: "italic",
          color: "#c4b4a0", lineHeight: 1.65,
          maxWidth: 520, margin: "0 auto 24px",
        }}>{CLASS_DATA.timeCapsula}</p>

        <div aria-hidden="true" style={{ fontSize: 28, marginBottom: 14, animation: "heartbeat 2.5s ease-in-out infinite", display: "inline-block" }}>🌸</div>
        <div aria-hidden="true" style={{
          fontSize: 11.5, color: "#ddd4c8",
          letterSpacing: 3.5, textTransform: "uppercase", fontWeight: 600,
        }}>言葉は橋</div>
      </footer>

      {/* ── STUDENT MODAL ── */}
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
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import yadaPhoto  from "./photo/yada.jpg";
import yadaPhoto2 from "./photo/yada2.jpg";
import ochi       from "./photo/ochi.jpg";
import aun        from "./photo/aun.jpg";
import ruku       from "./photo/ruku.jpg";
import baiel      from "./photo/baiel.jpg";
import otogo1     from "./photo/otogo1.jpg";
import otogo      from "./photo/otogo.jpg";
import baiel1     from "./photo/baiel1.jpg";
import suman      from "./photo/suman.jpg";
import suman1     from "./photo/suman1.jpg";
import chacha     from "./photo/chacha.jpg";
import anjeri1    from "./photo/anjeri1.jpg";
import unda       from "./photo/unda.jpg";
import unda1      from "./photo/unda1.jpg";
import ko         from "./photo/ko.jpg";
import ko1        from "./photo/ko1.jpg";
import anjeri     from "./photo/anjeri.jpg";
import React      from "react";
import mada       from "./photo/mada.jpg";
import mada1      from "./photo/mada1.jpg";
import nabi       from "./photo/nabi.jpg";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CLASS_DATA = {
  school:         "Sakura Japanese Language Academy",
  class:          "Advanced Intensive Course — Class 3B",
  year:           "2024–2025",
  city:           "Kyoto, Japan",
  graduationDate: "2025-03-20",
  groupQuote:     "言葉は橋 — Words are bridges.",
  timeCapsula:    "Open this in 10 years and remember how young we were.",
};

const PHOTO_SETS = [
  ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=top","https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=top","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=top"],
  [mada1, mada],
  [baiel, baiel1],
  [anjeri1, anjeri],
  [nabi, nabi],
  [chacha, chacha],
  ["https://images.unsplash.com/photo-1529505534180-8d9b1430b21c?w=400&h=600&fit=crop&crop=top","https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=600&fit=crop&crop=top"],
  [aun, aun],
  [ochi, ochi],
  [ruku, ruku],
  [ko, ko1],
  ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop&crop=top","https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&h=600&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=top","https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=top"],
  [unda, unda1],
  ["https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=600&fit=crop&crop=top","https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop&crop=top"],
  ["https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=600&fit=crop&crop=top","https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=top"],
  [otogo1, otogo],
  [yadaPhoto, yadaPhoto2],
  [suman, suman1],
];

const STUDENTS = [
  { id:1,  name:"Asyl Mamatova",      country:"Kyrgyzstan",flag:"🇰🇬",initials:"AM",color:"#f2c4a0",dream:"Become a Japanese-Kyrgyz interpreter for diplomatic missions",          quote:"Жол — жүрүүгө. — The road is for those who walk it.",                              memory:"Making traditional Kyrgyz tea for the whole class and watching everyone's eyes light up.", emoji:"🏔️",role:"Cultural Ambassador",  photoSet:PHOTO_SETS[0]  },
  { id:2,  name:"Nursultan Bekov",     country:"Kyrgyzstan",flag:"🇰🇬",initials:"NB",color:"#a0bef2",dream:"Build a tech bridge between Central Asia and Japan",                           quote:"Сабыр түбү — сары алтын. — Patience is gold.",                                       memory:"Staying up until 3am coding a class website with Sensei's blessing.",                     emoji:"💻",role:"Tech Lead",           photoSet:PHOTO_SETS[1]  },
  { id:3,  name:"Madara Sulaimanova",  country:"Kyrgyzstan",flag:"🇰🇬",initials:"MS",color:"#c4a0f2",dream:"Open a Kyrgyz cultural center in Osaka",                                     quote:"Эл — деңиз. — The people are an ocean.",                                             memory:"Teaching the class Kyrgyz folk dance at the cultural festival night.",                     emoji:"🎭",role:"Cultural Director",  photoSet:PHOTO_SETS[2]  },
  { id:4,  name:"Baiel Dzhaksybekov",  country:"Kyrgyzstan",flag:"🇰🇬",initials:"BD",color:"#a0f2c4",dream:"Write a manga series set in the Tian Shan mountains",                        quote:"Ар бир адам — бир дүйнө. — Every person is a whole world.",                          memory:"Sketching manga panels in every café from Kyoto to Nara.",                                emoji:"✏️",role:"Class Manga Artist", photoSet:PHOTO_SETS[3]  },
  { id:5,  name:"Anjery Putri",        country:"Indonesia", flag:"🇮🇩",initials:"AP",color:"#f2a0a0",dream:"Fashion designer blending batik patterns with Japanese aesthetics",          quote:"Banyak jalan menuju Roma. — Many roads lead to Rome.",                               memory:"Finding batik fabric at a Kyoto market and making the whole class scarves.",               emoji:"🧣",role:"Style Maven",        photoSet:PHOTO_SETS[4]  },
  { id:6,  name:"Nabira Salsabila",    country:"Indonesia", flag:"🇮🇩",initials:"NS",color:"#f2d4a0",dream:"Culinary journalist covering Southeast Asian street food in Japan",          quote:"Siapa yang menanam, dia yang menuai. — Reap what you sow.",                         memory:"Hosting a secret rendang tasting session in the dorm kitchen at midnight.",               emoji:"🌶️",role:"Food Correspondent",photoSet:PHOTO_SETS[5]  },
  { id:7,  name:"Chacha Maharani",     country:"Indonesia", flag:"🇮🇩",initials:"CM",color:"#a0f2f2",dream:"Produce a documentary on Indonesian diaspora in Japan",                     quote:"Ringan sama dijinjing, berat sama dipikul. — Share burdens and joys together.",     memory:"Filming every class moment — she always had her camera ready.",                           emoji:"🎬",role:"Class Filmmaker",   photoSet:PHOTO_SETS[6]  },
  { id:8,  name:"Hieu Nguyen",         country:"Vietnam",   flag:"🇻🇳",initials:"HN",color:"#c4f2a0",dream:"Software engineer at a Japanese robotics company",                          quote:"Có công mài sắt, có ngày nên kim. — Perseverance turns iron into a needle.",       memory:"Solving a kanji riddle that stumped the entire class in under a minute.",                 emoji:"🤖",role:"Logic Master",      photoSet:PHOTO_SETS[7]  },
  { id:9,  name:"Aun Tran",            country:"Vietnam",   flag:"🇻🇳",initials:"AT",color:"#f2a0c4",dream:"Architect designing bamboo-inspired buildings across Asia",                  quote:"Đi một ngày đàng, học một sàng khôn. — One day of travel teaches a basketful of wisdom.", memory:"Building a tiny bamboo model of Sensei's house as a goodbye gift.",             emoji:"🏗️",role:"Class Builder",    photoSet:PHOTO_SETS[8]  },
  { id:10, name:"Otchini Perera",      country:"Sri Lanka", flag:"🇱🇰",initials:"OP",color:"#a0c0f2",dream:"Tea sommelier introducing Sri Lankan tea culture to Japan",                 quote:"දිනෙන් දිනෙට හොඳ. — Better day by day.",                                            memory:"Brewing Ceylon tea for Sensei and watching her say it rivaled Japanese tea.",             emoji:"🍵",role:"Tea Ceremony Host", photoSet:PHOTO_SETS[9]  },
  { id:11, name:"Rukumaru Silva",      country:"Sri Lanka", flag:"🇱🇰",initials:"RS",color:"#f2f0a0",dream:"Marine biologist protecting Sri Lankan and Japanese coral reefs",           quote:"දිය ගොඩ දෙකෙහිම — At home in water and on land.",                                   memory:"Leading the class snorkeling trip in Okinawa and naming every fish in Japanese.",         emoji:"🐠",role:"Ocean Guardian",   photoSet:PHOTO_SETS[10] },
  { id:12, name:"Ko Mingzhi",          country:"China",     flag:"🇨🇳",initials:"KM",color:"#e4a0f2",dream:"Calligrapher bridging Chinese and Japanese brush art traditions",           quote:"千里之行，始於足下。 — A journey of a thousand miles begins with a single step.",      memory:"Hosting a midnight calligraphy session that lasted until sunrise.",                       emoji:"🖌️",role:"Master Calligrapher",photoSet:PHOTO_SETS[11] },
  { id:13, name:"Sharuri Tamang",      country:"Indonesia", flag:"🇮🇩",initials:"ST",color:"#a0e4f2",dream:"Mountain guide leading treks between the Himalayas and Japanese Alps",     quote:"जहाँ चाह, त्यहाँ बाह. — Where there's a will, there's a way.",                     memory:"Teaching sunrise meditation on the roof of our dorm every Monday.",                       emoji:"🏔️",role:"Sunrise Guide",    photoSet:PHOTO_SETS[12] },
  { id:14, name:"Sukura Shrestha",     country:"Nepal",     flag:"🇳🇵",initials:"SS",color:"#f2c0a0",dream:"Child educator building bilingual schools in rural Nepal",                  quote:"ज्ञान नै शक्ति हो। — Knowledge is power.",                                           memory:"Organizing the class tutoring circle that helped everyone pass the N3 exam.",             emoji:"📚",role:"Class Tutor",       photoSet:PHOTO_SETS[13] },
  { id:15, name:"Unda Gantulga",       country:"Mongolia",  flag:"🇲🇳",initials:"UG",color:"#b0f2a0",dream:"Veterinarian caring for endangered wildlife across the steppe",            quote:"Эрдэм номын эх — сурах явдал. — The mother of knowledge is study.",                 memory:"Bringing traditional Mongolian airag to the cultural night and daring everyone to try it.",emoji:"🐎",role:"Wildlife Advocate", photoSet:PHOTO_SETS[14] },
  { id:16, name:"Azjargal Batbold",    country:"Mongolia",  flag:"🇲🇳",initials:"AB",color:"#b0a0f2",dream:"Fashion designer weaving Mongolian felt art into modern collections",      quote:"Хүнд хэцүүгийн цаана аз жаргал байдаг. — Happiness lies beyond hardship.",          memory:"Sewing matching felt badges for the whole class by hand overnight.",                      emoji:"🧵",role:"Craft Queen",       photoSet:PHOTO_SETS[15] },
  { id:17, name:"Beruguti Namsrai",    country:"Mongolia",  flag:"🇲🇳",initials:"BN",color:"#f2f0b0",dream:"Music producer blending Mongolian throat singing with J-pop",              quote:"Дуу хоолой — сэтгэлийн хэл. — Voice is the language of the soul.",                 memory:"Performing a live throat singing duet with the school's traditional music club.",         emoji:"🎶",role:"Music Soul",        photoSet:PHOTO_SETS[16] },
  { id:18, name:"Otogo Chimeddorj",    country:"Mongolia",  flag:"🇲🇳",initials:"OC",color:"#a0f2b4",dream:"Diplomat fostering Mongolia-Japan cultural exchanges",                     quote:"Нэгдсэн нь хүчтэй. — United we are strong.",                                        memory:"Organizing the class's end-of-year talent show from scratch in three days.",              emoji:"🎪",role:"Chief Organizer",   photoSet:PHOTO_SETS[17] },
  { id:19, name:"Yadana Kyaw",         country:"Myanmar",   flag:"🇲🇲",initials:"YK",color:"#f2c8a0",dream:"Journalist bringing Myanmar stories to a Japanese-speaking world",         quote:"ကြိုးစားမှ အောင်မြင်မည်။ — Effort brings success.",                                  memory:"Reading her own Burmese poetry translated into Japanese at the school festival.",         emoji:"📜",role:"Class Poet",        photoSet:PHOTO_SETS[18] },
  { id:20, name:"Suman",              country:"Nepal",      flag:"🇳🇵",initials:"SU",color:"#a0d4f2",dream:"Chef opening a Thai-Japanese fusion restaurant in Kyoto",                 quote:"ทำดีได้ดี — Do good, receive good.",                                                 memory:"Cooking pad thai for 25 people in the dorm kitchen on New Year's Eve.",                   emoji:"🍜",role:"Class Chef",        photoSet:PHOTO_SETS[19] },
];

const FUNNY_QUOTES = [
  { quote:"すみません is the most powerful word in Japanese. Also, すみません。",                                     author:"Class consensus, Week 2" },
  { quote:"Sensei asked who forgot their homework. We all said '電車が遅れました' (the train was late).",             author:"Every Monday morning"   },
  { quote:"At some point we stopped translating and started just… living here.",                                   author:"Class diary, Month 4"   },
  { quote:"The konbini near school has seen things. Things we will never speak of.",                               author:"Anonymous"              },
  { quote:"We came for the language. We stayed for the ramen, the festivals, and each other.",                     author:"Graduation speech draft #7" },
  { quote:"Our group chat went from 'what is this kanji?' to 'anyone else crying at this sunset?'",               author:"The WhatsApp group"     },
  { quote:"Level 1: ordering at a restaurant. Level 99: understanding train announcements. We did it.",           author:"Graduation ceremony"    },
];

const GALLERY_ITEMS = [
  { id:1,  label:"First snow in Kyoto",    emoji:"❄️", bg:"linear-gradient(135deg,#e8f4fd,#d6eaf8)", note:"January morning, 6:04am",     rotate:-2   },
  { id:2,  label:"Gion Festival night",    emoji:"🏮", bg:"linear-gradient(135deg,#fdf0e8,#fde4cc)", note:"Summer, unforgettable",        rotate:1.5  },
  { id:3,  label:"Sakura season window",   emoji:"🌸", bg:"linear-gradient(135deg,#fde8f4,#fbd5e8)", note:"Classroom view, March",        rotate:-1   },
  { id:4,  label:"Konbini late-night run", emoji:"🥟", bg:"linear-gradient(135deg,#e8fdf0,#d5f5e3)", note:"Every study night, 11pm",      rotate:2    },
  { id:5,  label:"Arashiyama bamboo walk", emoji:"🎋", bg:"linear-gradient(135deg,#edfde8,#ddf5d5)", note:"October weekend trip",         rotate:-1.5 },
  { id:6,  label:"Train station goodbyes", emoji:"🚃", bg:"linear-gradient(135deg,#e8eefb,#d5e3f5)", note:"Too many of these",            rotate:1    },
  { id:7,  label:"Cultural festival day",  emoji:"🎉", bg:"linear-gradient(135deg,#fbf5e8,#f5e8cc)", note:"We danced for 3 hours",        rotate:-2.5 },
  { id:8,  label:"Zen garden meditation",  emoji:"⛩️", bg:"linear-gradient(135deg,#f0e8fb,#e4d5f5)", note:"Ryoan-ji, 6am silence",        rotate:1.5  },
  { id:9,  label:"Year-end class dinner",  emoji:"🍱", bg:"linear-gradient(135deg,#fbeee8,#f5ddd0)", note:"Someone cried (everyone)",     rotate:-1   },
  { id:10, label:"Nara deer encounter",    emoji:"🦌", bg:"linear-gradient(135deg,#eef0e8,#e0ebd5)", note:"RIP someone's snacks",         rotate:2.5  },
  { id:11, label:"Calligraphy class",      emoji:"🖌️", bg:"linear-gradient(135deg,#f0e8ee,#ead5e7)", note:"90-year-old sensei",           rotate:-2   },
  { id:12, label:"Osaka aquarium trip",    emoji:"🐠", bg:"linear-gradient(135deg,#e8f7fb,#d5eef5)", note:"Zero studying happened",       rotate:1    },
];

const MEMORY_CAPSULE = [
  "By the time you read this, your Japanese is probably perfect.",
  "Remember the day it clicked — when you stopped translating and just understood.",
  "You were brave enough to leave home and build a new one, even temporarily.",
  "Keep the friends you made here. Distance cannot erase what you built.",
  "These people believed in you on your worst days. They celebrated every small victory with you.",
  "これはあなたの物語の小さな章です — This is a small chapter of your story.",
];

const INITIAL_MESSAGES = [
  { id:1, text:"To whoever was always first in class — you inspired me to try harder. 🌸",               color:"#f0e8f8" },
  { id:2, text:"Thank you for sharing your home food with everyone. It made us feel less far away. 🍱",  color:"#e8f0e8" },
  { id:3, text:"I will never forget the night we got lost in Osaka and ended up having the best adventure.", color:"#f8f0e8" },
  { id:4, text:"Your laugh is the soundtrack of this year. I hope you never change.",                     color:"#e8e8f8" },
  { id:5, text:"Whoever taught me to say あなたが大好き — thank you for that lesson in bravery.",           color:"#f8f4e8" },
];

const NOTE_COLORS = ["#f0e8f8","#e8f0e8","#f8f0e8","#e8e8f8","#f8e8e8","#e8f8f0","#f8f4e8"];

const LOAD_MSGS = [
  "思い出を読み込んでいます…",
  "Gathering sakura petals…",
  "Counting konbini memories…",
  "Almost ready…",
];

const NAV_ITEMS = [
  { id:"home",     label:"Home",       icon:"🏠" },
  { id:"students", label:"Classmates", icon:"👥" },
  { id:"world",    label:"World",      icon:"🌍" },
  { id:"gallery",  label:"Gallery",    icon:"📸" },
  { id:"memories", label:"Memories",   icon:"💌" },
];

const STATS = [
  { label:"Countries", value:8,     emoji:"🌍", color:"#f2c4a0" },
  { label:"Students",  value:20,    emoji:"👥", color:"#a0bef2" },
  { label:"Languages", value:"10+", emoji:"💬", color:"#c4a0f2" },
  { label:"Memories",  value:"∞",   emoji:"🌸", color:"#f2a0c4" },
];

// ─── GLOBAL CSS ────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

  :root {
    --cream:       #faf7f2;
    --warm:        #f5efe4;
    --text:        #1e1814;
    --text-soft:   #6b5c52;
    --text-muted:  #b0a098;
    --accent:      #c4775a;
    --accent-glow: rgba(196,119,90,0.22);
    --border:      rgba(180,155,135,0.18);
    --shadow-sm:   0 2px 16px rgba(80,50,30,0.07);
    --shadow-md:   0 8px 36px rgba(80,50,30,0.13);
    --shadow-lg:   0 24px 72px rgba(80,50,30,0.18);
    --nav-h:       64px;
    --bottom-nav-h: 0px;
  }

  @media (max-width: 640px) { :root { --bottom-nav-h: 72px; } }

  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    background-image:
      radial-gradient(ellipse 80% 60% at 18% 0%,  rgba(242,196,160,0.17) 0%, transparent 62%),
      radial-gradient(ellipse 60% 80% at 82% 100%, rgba(160,190,242,0.12) 0%, transparent 62%);
    padding-bottom: var(--bottom-nav-h);
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(180,140,110,0.2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(180,140,110,0.38); }

  @keyframes float     { 0%,100%{transform:translateY(0)}       50%{transform:translateY(-18px)} }
  @keyframes floatSlow { 0%,100%{transform:translateY(0)}       50%{transform:translateY(-22px)} }
  @keyframes fadeIn    { from{opacity:0}                         to{opacity:1} }
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(0.93) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes sakuraFall{ 0%{transform:translateY(-30px) rotate(0deg);opacity:0} 10%{opacity:0.8} 85%{opacity:0.4} 100%{transform:translateY(110vh) rotate(800deg) translateX(80px);opacity:0} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.12)} 28%{transform:scale(1)} 42%{transform:scale(1.08)} 70%{transform:scale(1)} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes imgReveal { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
  @keyframes btnPop    { 0%{transform:scale(1)} 40%{transform:scale(0.93)} 100%{transform:scale(1)} }

  input:focus, textarea:focus { outline: none; box-shadow: 0 0 0 3px var(--accent-glow); }
  button { font-family: 'DM Sans', -apple-system, sans-serif; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  section { scroll-margin-top: calc(var(--nav-h) + 8px); }

  /* ── Reveal animation ── */
  .reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.62s cubic-bezier(0.22,1,0.36,1), transform 0.62s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* ── Student card ── */
  .s-card {
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    background: #fff;
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(220,205,190,0.25);
    transition: transform 0.38s cubic-bezier(0.22,1,0.36,1), box-shadow 0.38s ease, border-color 0.3s ease;
    will-change: transform;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }
  @media (hover: hover) {
    .s-card:hover {
      transform: translateY(-7px) scale(1.012);
      box-shadow: 0 22px 50px rgba(80,50,30,0.19);
      border-color: rgba(196,119,90,0.18);
    }
    .s-card:hover .s-photo { transform: scale(1.04); }
    .s-card:hover .s-toggle { opacity: 1 !important; }
    .s-card:hover .s-cta { opacity: 1 !important; transform: translateY(0) !important; }
  }
  .s-card:active { transform: scale(0.97); }

  /* ── Photo inside card ── adapts to natural image ratio ── */
  .s-photo-wrap {
    position: relative;
    overflow: hidden;
  }
  .s-photo {
    display: block;
    width: 100%;
    height: auto;
    transition: transform 0.52s cubic-bezier(0.22,1,0.36,1);
    transform-origin: center top;
  }
  .s-photo.loaded { animation: imgReveal 0.45s ease; }

  /* Photo placeholder (shown while image loads) */
  .s-photo-placeholder {
    min-height: 200px;
    background-size: 200% 100%;
    animation: shimmer 1.8s linear infinite;
    position: absolute;
    inset: 0;
    transition: opacity 0.4s ease;
  }

  /* Overlays always sit on top of the photo */
  .s-overlay-gradient {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 68%;
    background: linear-gradient(to top, rgba(5,2,0,0.92) 0%, rgba(5,2,0,0.36) 52%, transparent 100%);
    pointer-events: none;
  }
  .s-overlay-top { position: absolute; top: 10px; left: 10px; right: 10px; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start; }
  .s-overlay-bottom { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.85rem 0.85rem 0.8rem; z-index: 2; }

  .s-toggle {
    opacity: 0;
    transition: opacity 0.22s ease, transform 0.22s ease;
    background: rgba(255,255,255,0.92) !important;
    backdrop-filter: blur(12px);
    border: none !important;
    border-radius: 50%;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.14);
    flex-shrink: 0;
  }
  .s-toggle:hover { transform: scale(1.1); }
  .s-cta {
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.28s ease, transform 0.28s ease;
    font-size: 10.5px;
    color: rgba(255,255,255,0.78);
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  /* ── Masonry grid for student cards ── */
  .masonry-grid {
    columns: 3 190px;
    column-gap: 14px;
  }
  .masonry-item {
    break-inside: avoid;
    margin-bottom: 14px;
    display: inline-block;
    width: 100%;
    vertical-align: top;
  }

  /* ── Search ── */
  .search-input {
    width: 100%; max-width: 440px;
    padding: 13px 22px; border-radius: 50px;
    border: 1.5px solid rgba(200,185,168,0.45);
    background: rgba(255,255,255,0.9);
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    color: var(--text);
    box-shadow: var(--shadow-sm);
    transition: all 0.25s ease;
    appearance: none;
  }
  .search-input:focus {
    border-color: rgba(196,119,90,0.5);
    box-shadow: 0 0 0 3px var(--accent-glow), var(--shadow-sm);
    background: #fff;
    outline: none;
  }
  .search-input::placeholder { color: var(--text-muted); }

  /* ── Nav (desktop) ── */
  .nav-pill {
    background: transparent; border: none; border-radius: 50px;
    padding: 7px 16px; font-size: 13.5px; font-weight: 500;
    color: var(--text-muted); transition: all 0.22s ease;
    font-family: 'DM Sans', sans-serif; white-space: nowrap; letter-spacing: 0.1px;
  }
  .nav-pill:hover  { background: rgba(196,119,90,0.1); color: var(--accent); }
  .nav-pill.active { background: rgba(196,119,90,0.14); color: var(--accent); font-weight: 600; }

  /* ── Bottom nav (mobile) ── */
  .bottom-nav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 72px;
    background: rgba(252,250,247,0.97);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid rgba(210,195,175,0.3);
    z-index: 200;
    padding: 0 4px;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -4px 24px rgba(80,50,30,0.08);
  }
  .bottom-nav-inner { display: flex; align-items: center; justify-content: space-around; height: 100%; }
  .bottom-nav-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; padding: 6px 12px; border: none; background: transparent;
    border-radius: 14px; min-width: 52px; transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .bottom-nav-btn .bn-icon  { font-size: 21px; line-height: 1; transition: transform 0.2s ease; }
  .bottom-nav-btn .bn-label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.3px; color: #b8a898; transition: color 0.2s; }
  .bottom-nav-btn.active .bn-icon  { transform: translateY(-2px); }
  .bottom-nav-btn.active .bn-label { color: var(--accent); }
  .bottom-nav-btn.active { background: rgba(196,119,90,0.08); }

  /* ── Scroll-to-top button ── */
  .scroll-top-btn {
    position: fixed;
    right: 20px;
    bottom: calc(var(--bottom-nav-h) + 20px);
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(210,195,175,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
    box-shadow: 0 4px 20px rgba(80,50,30,0.14);
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, opacity 0.3s ease;
    z-index: 90;
    cursor: pointer;
    color: var(--text-soft);
  }
  .scroll-top-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(80,50,30,0.2); }

  /* ── Modal ── */
  .modal-details::-webkit-scrollbar { width: 4px; }
  .modal-details::-webkit-scrollbar-thumb { background: rgba(180,140,110,0.22); border-radius: 3px; }

  /* ── Photo dots (when 2 photos) ── */
  .photo-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transition: all 0.25s ease;
    cursor: pointer;
  }
  .photo-dot.active { background: #fff; width: 18px; border-radius: 4px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .masonry-grid { columns: 2 180px; }
  }

  @media (max-width: 640px) {
    .bottom-nav { display: flex; flex-direction: column; justify-content: flex-end; }
    .desktop-nav-links { display: none !important; }
    .desktop-pill { display: none !important; }
    .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
    .hero-title { font-size: clamp(54px,17vw,96px) !important; }
    .masonry-grid { columns: 2 140px; column-gap: 10px; }
    .masonry-item { margin-bottom: 10px; }
    .world-grid { grid-template-columns: repeat(1,1fr) !important; }
    .gallery-grid { grid-template-columns: repeat(2,1fr) !important; gap: 18px !important; }
    .quote-grid { gap: 10px !important; }
    .section-pad { padding: 4.5rem 1.1rem 3rem !important; }
    .hero-pad { padding-top: 76px !important; padding-left: 1.2rem !important; padding-right: 1.2rem !important; }
    .hero-avatars { display: none !important; }
    .hero-sub-text { font-size: 12.5px !important; }
  }

  @media (hover: none) {
    .s-toggle { opacity: 0.75 !important; }
    .s-cta    { opacity: 0.8  !important; transform: none !important; }
  }
`;

// ─── HOOKS ─────────────────────────────────────────────────────────────────────

function useReveal(ref, delay = 0) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.06 }
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 640);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// ─── LAZY IMAGE (for avatar / modal) ──────────────────────────────────────────

function LazyImage({ src, alt, style, className = "", onError, objectPosition = "top center" }) {
  const imgRef  = useRef(null);
  const [loaded,  setLoaded]  = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!src) return;
    const el = imgRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "200px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [src]);

  return (
    <div ref={imgRef} style={{ ...style, position: "relative", overflow: "hidden" }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(240,232,220,0.7) 25%, rgba(248,244,238,0.9) 50%, rgba(240,232,220,0.7) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.8s linear infinite",
        }} />
      )}
      {visible && (
        <img
          src={src}
          alt={alt}
          className={`${loaded ? "" : "opacity-0"} ${className}`}
          onLoad={() => setLoaded(true)}
          onError={onError}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition,
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.45s ease",
          }}
        />
      )}
    </div>
  );
}

// ─── DECORATIVE ────────────────────────────────────────────────────────────────

const PETALS = Array.from({ length: 12 }, (_, i) => ({
  left:     `${(i * 8.5) % 96}%`,
  size:     `${12 + (i * 2.5) % 10}px`,
  duration: 9 + (i * 1.2) % 9,
  delay:    (i * 1.6) % 14,
}));

const ORBS = [
  { width:340, height:340, background:"#f9c4ce", top:"2%",   left:"5%",   duration:9,  delay:0   },
  { width:260, height:260, background:"#c4d6f9", top:"55%",  right:"3%",  duration:11, delay:2   },
  { width:200, height:200, background:"#c4f0c8", top:"28%",  right:"22%", duration:8,  delay:1   },
  { width:220, height:220, background:"#f9e8c4", bottom:"8%",left:"18%",  duration:10, delay:3.5 },
];

function SakuraPetal({ style }) {
  return (
    <div aria-hidden="true" style={{
      position:"absolute", fontSize:style.size, pointerEvents:"none",
      animation:`sakuraFall ${style.duration}s ease-in infinite`,
      animationDelay:`${style.delay}s`,
      left:style.left, top:"-40px", opacity:0, zIndex:1,
    }}>🌸</div>
  );
}

function FloatingOrb({ style }) {
  return (
    <div aria-hidden="true" style={{
      position:"absolute", borderRadius:"50%", opacity:0.18, pointerEvents:"none",
      animation:`float ${style.duration}s ease-in-out infinite`,
      animationDelay:`${style.delay}s`,
      filter:"blur(32px)", ...style,
    }} />
  );
}

// ─── AVATAR ────────────────────────────────────────────────────────────────────

function PhotoAvatar({ student, size = 80 }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const border = Math.max(2, size * 0.035);
  const shadow = `0 ${size*0.06}px ${size*0.35}px ${student.color}60, 0 2px 10px rgba(0,0,0,0.1)`;
  const bp     = `${border}px solid rgba(255,255,255,0.92)`;

  if (student.photoSet) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % 2); }}
        style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:bp, boxShadow:shadow, cursor:"pointer", position:"relative" }}
      >
        <LazyImage src={student.photoSet[photoIdx]} alt={student.name} style={{ width:"100%", height:"100%", position:"static" }} objectPosition="top center" />
      </div>
    );
  }

  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`radial-gradient(135deg, ${student.color} 0%, ${student.color}bb 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.28, fontWeight:700, color:"rgba(60,40,30,0.65)",
      fontFamily:"'Cormorant Garamond', Georgia, serif", letterSpacing:1,
      border:bp, boxShadow:shadow, position:"relative",
    }} aria-label={student.name}>
      {student.initials}
      <div style={{ position:"absolute", bottom:size*0.02, right:size*0.02, fontSize:size*0.22, lineHeight:1 }} aria-hidden="true">
        {student.flag}
      </div>
    </div>
  );
}

const Avatar = React.memo(function Avatar({ student, size = 80 }) {
  return <PhotoAvatar student={student} size={size} />;
});

// ─── STUDENT CARD — natural photo ratio ────────────────────────────────────────
// Card adapts to whatever aspect ratio the photo is (9:16, 4:5, square, etc.)

const StudentCard = React.memo(function StudentCard({ student, onClick }) {
  const [photoIdx,  setPhotoIdx]  = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const revealRef = useRef(null);
  useReveal(revealRef);

  const currentPhoto = student.photoSet ? student.photoSet[photoIdx] : null;
  const hasSecond    = student.photoSet && student.photoSet[0] !== student.photoSet[1];

  const switchPhoto = useCallback((e) => {
    e.stopPropagation();
    if (!student.photoSet) return;
    setImgLoaded(false);
    setPhotoIdx(i => (i + 1) % 2);
  }, [student.photoSet]);

  return (
    <div
      ref={revealRef}
      className="reveal s-card"
      onClick={() => onClick(student)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(student); } }}
      role="button"
      tabIndex={0}
      aria-label={`View ${student.name}'s profile`}
    >
      {/* ── Photo area: height is determined by the actual image ratio ── */}
      <div
        className="s-photo-wrap"
        style={{
          background: `linear-gradient(155deg, ${student.color}dd 0%, ${student.color}77 100%)`,
          minHeight: imgLoaded ? 0 : 220, // placeholder height while loading
        }}
      >
        {currentPhoto && (
          <img
            key={currentPhoto}            /* remount when src changes → triggers animation */
            src={currentPhoto}
            alt={student.name}
            loading="lazy"
            className={`s-photo${imgLoaded ? " loaded" : ""}`}
            onLoad={() => setImgLoaded(true)}
            style={{
              opacity:    imgLoaded ? 1 : 0,
              transition: "opacity 0.42s ease",
            }}
          />
        )}

        {/* No photo → initials fallback */}
        {!currentPhoto && (
          <div style={{
            position:"absolute", inset:0,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:10,
          }}>
            <span style={{ fontSize:52 }}>{student.emoji}</span>
            <span style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:38, fontWeight:700, color:"rgba(60,40,30,0.52)" }}>
              {student.initials}
            </span>
          </div>
        )}

        {/* Dark gradient — sits over the photo, bottom-up */}
        <div className="s-overlay-gradient" aria-hidden="true" />

        {/* ── Top row: country badge + switch button ── */}
        <div className="s-overlay-top">
          {/* Country badge */}
          <div style={{
            background:"rgba(255,255,255,0.93)", backdropFilter:"blur(12px)",
            borderRadius:50, padding:"3px 10px",
            display:"flex", alignItems:"center", gap:4,
            boxShadow:"0 2px 12px rgba(0,0,0,0.1)",
          }}>
            <span style={{ fontSize:12 }}>{student.flag}</span>
            <span style={{ fontSize:9, color:"#555", letterSpacing:0.3, fontWeight:700 }}>{student.country}</span>
          </div>

          {/* Switch-photo button */}
          {hasSecond && (
            <button onClick={switchPhoto} aria-label="Switch photo" className="s-toggle">📸</button>
          )}
        </div>

        {/* ── Bottom row: name + role + photo dots ── */}
        <div className="s-overlay-bottom">
          {/* Photo dots indicator */}
          {hasSecond && (
            <div style={{ display:"flex", gap:5, marginBottom:7 }}>
              {[0,1].map(i => (
                <div
                  key={i}
                  className={`photo-dot${photoIdx === i ? " active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setImgLoaded(false); setPhotoIdx(i); }}
                />
              ))}
            </div>
          )}

          <div style={{
            fontFamily:"'Cormorant Garamond', Georgia, serif",
            fontSize:15, fontWeight:700, color:"#fff",
            lineHeight:1.2, marginBottom:6,
            textShadow:"0 1px 8px rgba(0,0,0,0.55)",
          }}>{student.name}</div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:4,
              background:`${student.color}cc`, backdropFilter:"blur(6px)",
              borderRadius:50, padding:"3px 9px",
              fontSize:9.5, color:"#fff", letterSpacing:0.3, fontWeight:700,
              border:"1px solid rgba(255,255,255,0.2)",
            }}>
              <span style={{ fontSize:9.5 }}>{student.emoji}</span>
              {student.role}
            </div>
            <span className="s-cta">View →</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── STUDENT MODAL ─────────────────────────────────────────────────────────────

function StudentModal({ student, onClose, onNext, onPrev }) {
  const [photoIdx,     setPhotoIdx]     = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [imgLoaded,    setImgLoaded]    = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => { setPhotoIdx(0); setTransitioning(false); setImgLoaded(false); }, [student.id]);

  // Keyboard navigation
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft")  onPrev();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose, onNext, onPrev]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const switchPhoto = useCallback(() => {
    if (!student.photoSet || student.photoSet[0] === student.photoSet[1]) return;
    setTransitioning(true);
    setImgLoaded(false);
    setTimeout(() => { setPhotoIdx(i => (i + 1) % 2); setTransitioning(false); }, 200);
  }, [student.photoSet]);

  const currentPhoto   = student.photoSet ? student.photoSet[photoIdx] : null;
  const hasSecondPhoto = student.photoSet && student.photoSet[0] !== student.photoSet[1];

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${student.name}'s profile`}
      style={{
        position:"fixed", inset:0,
        background:"rgba(8,4,2,0.72)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"1rem", zIndex:1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"rgba(253,251,248,0.98)",
          backdropFilter:"blur(24px)",
          borderRadius: isMobile ? 24 : 30,
          border:"1px solid rgba(255,255,255,0.9)",
          boxShadow:`0 48px 120px rgba(0,0,0,0.28), 0 0 0 1.5px ${student.color}44`,
          width:"100%", maxWidth:740,
          animation:"scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)",
          position:"relative",
          overflow:"hidden",
          maxHeight: isMobile ? "96vh" : "92vh",
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "260px 1fr",
        }}
      >

        {/* ── Photo column: adapts to image natural ratio ── */}
        <div style={{
          position:"relative",
          background:`linear-gradient(155deg, ${student.color}cc, ${student.color}55)`,
          overflow:"hidden",
          maxHeight: isMobile ? "42vh" : "92vh",
          display:"flex", alignItems:"flex-start",
        }}>
          {currentPhoto ? (
            <img
              key={currentPhoto}
              src={currentPhoto}
              alt={student.name}
              onLoad={() => setImgLoaded(true)}
              style={{
                width:"100%",
                height: isMobile ? "100%" : "auto",
                objectFit: isMobile ? "cover" : "contain",
                objectPosition:"top center",
                display:"block",
                opacity: transitioning ? 0 : (imgLoaded ? 1 : 0),
                transition:"opacity 0.25s ease",
                maxHeight: isMobile ? "42vh" : "90vh",
              }}
            />
          ) : (
            <div style={{
              width:"100%", minHeight: isMobile ? "42vh" : 380,
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:12,
            }}>
              <span style={{ fontSize:56 }}>{student.emoji}</span>
              <span style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:40, fontWeight:700, color:"rgba(60,40,30,0.5)" }}>
                {student.initials}
              </span>
            </div>
          )}

          {/* Bottom gradient on photo */}
          <div aria-hidden="true" style={{
            position:"absolute", bottom:0, left:0, right:0, height:"30%",
            background:`linear-gradient(to top, ${student.color}88 0%, transparent 100%)`,
            pointerEvents:"none",
          }} />

          {/* Country chip */}
          <div style={{
            position:"absolute", top:14, left:14,
            background:"rgba(255,255,255,0.93)", backdropFilter:"blur(12px)",
            borderRadius:50, padding:"5px 13px",
            display:"flex", alignItems:"center", gap:6,
            boxShadow:"0 2px 14px rgba(0,0,0,0.1)",
          }}>
            <span style={{ fontSize:15 }}>{student.flag}</span>
            <span style={{ fontSize:11, color:"#555", fontWeight:700, letterSpacing:0.3 }}>{student.country}</span>
          </div>

          {/* Photo dots / switch */}
          {hasSecondPhoto && (
            <div style={{
              position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)",
              display:"flex", gap:6, cursor:"pointer",
              background:"rgba(0,0,0,0.28)", backdropFilter:"blur(6px)",
              borderRadius:20, padding:"6px 11px",
            }}>
              {[0,1].map(i => (
                <div
                  key={i}
                  className={`photo-dot${photoIdx === i ? " active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setImgLoaded(false); setPhotoIdx(i); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Details column ── */}
        <div
          className="modal-details"
          style={{ padding: isMobile ? "1.5rem 1.3rem 1.5rem" : "2rem 2rem 2rem 1.75rem", overflowY:"auto", position:"relative" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position:"absolute", top:14, right:14,
              background:"rgba(0,0,0,0.05)", border:"none",
              borderRadius:"50%", width:36, height:36,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, color:"#999", zIndex:10,
              transition:"background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
          >×</button>

          {/* Role chip + name */}
          <div style={{ marginBottom:"1.4rem", paddingRight:44 }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              background:`${student.color}20`,
              border:`1.5px solid ${student.color}50`,
              borderRadius:50, padding:"4px 13px",
              fontSize:11.5, color:"#555", fontWeight:700, letterSpacing:0.3, marginBottom:10,
            }}>
              <span>{student.emoji}</span>{student.role}
            </div>
            <h2 style={{
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize: isMobile ? 26 : 30, fontWeight:700, color:"#1a1008",
              lineHeight:1.15, margin:0,
            }}>{student.name}</h2>
          </div>

          {/* Dream */}
          <div style={{ marginBottom:"1.2rem" }}>
            <div style={{ fontSize:9.5, textTransform:"uppercase", letterSpacing:2.5, color:"#c8b8a8", marginBottom:7, fontWeight:700 }}>Dream</div>
            <p style={{
              fontSize:13.5, color:"#2a2a2a", fontWeight:400, lineHeight:1.7,
              background:"rgba(255,255,255,0.72)",
              border:"1px solid rgba(220,210,200,0.55)",
              borderRadius:14, padding:"11px 15px",
            }}>{student.dream}</p>
          </div>

          {/* Quote */}
          <blockquote style={{
            borderLeft:`3px solid ${student.color}`,
            background:`${student.color}0e`,
            borderRadius:"0 14px 14px 0",
            padding:"0.8rem 1rem 0.8rem 1.2rem",
            marginBottom:"1.2rem",
          }}>
            <div aria-hidden="true" style={{ fontSize:30, color:student.color, lineHeight:0.5, marginBottom:8, fontFamily:"Georgia", opacity:0.55 }}>"</div>
            <p style={{ fontSize:13.5, fontStyle:"italic", color:"#4a4040", lineHeight:1.8 }}>{student.quote}</p>
          </blockquote>

          {/* Memory */}
          <div style={{ marginBottom:"1.4rem" }}>
            <div style={{ fontSize:9.5, textTransform:"uppercase", letterSpacing:2.5, color:"#c8b8a8", marginBottom:7, fontWeight:700 }}>Memory from Japan</div>
            <div style={{
              background:"linear-gradient(135deg, rgba(250,248,244,0.96), rgba(245,242,236,0.96))",
              borderRadius:16, padding:"1rem 1.1rem",
              fontSize:13.5, color:"#555", lineHeight:1.9, fontStyle:"italic",
              border:"1px solid rgba(230,218,205,0.65)",
            }}>
              <span aria-hidden="true" style={{ fontSize:19, marginRight:8 }}>{student.emoji}</span>
              {student.memory}
            </div>
          </div>

          {/* Navigation prev / next */}
          <div style={{
            display:"flex", justifyContent:"space-between",
            borderTop:"1px solid rgba(220,210,200,0.4)", paddingTop:"1rem",
            gap:10,
          }}>
            {[["← Prev", onPrev], ["Next →", onNext]].map(([label, handler]) => (
              <button
                key={label}
                onClick={handler}
                style={{
                  flex:1,
                  background:"rgba(0,0,0,0.04)", border:"1px solid rgba(200,185,170,0.4)",
                  borderRadius:50, padding:"9px 22px",
                  fontSize:12.5, color:"#888", fontWeight:600,
                  transition:"all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#444"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "#888"; }}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WORLD SECTION ─────────────────────────────────────────────────────────────

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
      <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:"3rem" }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            background:"rgba(255,255,255,0.82)",
            backdropFilter:"blur(16px)",
            border:"1px solid rgba(255,255,255,0.9)",
            borderRadius:22, padding:"1.5rem 1rem",
            textAlign:"center", boxShadow:"var(--shadow-sm)",
            animation:`fadeInUp 0.5s ease ${i*0.1}s both`,
            position:"relative", overflow:"hidden",
          }}>
            <div aria-hidden="true" style={{ position:"absolute", top:-18, right:-18, width:80, height:80, borderRadius:"50%", background:s.color, opacity:0.2, filter:"blur(14px)", pointerEvents:"none" }} />
            <div aria-hidden="true" style={{ fontSize:26, marginBottom:8 }}>{s.emoji}</div>
            <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:38, fontWeight:700, color:"#1e1410", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:10.5, color:"#b0a090", letterSpacing:1.5, textTransform:"uppercase", marginTop:5, fontWeight:700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Country filter */}
      <div style={{ marginBottom:"2.5rem" }}>
        <p style={{ fontSize:13, color:"#c0b0a0", marginBottom:14, textAlign:"center" }}>
          {selectedCountry
            ? `✦ Showing ${countryGroups[selectedCountry]?.length} student${countryGroups[selectedCountry]?.length !== 1 ? "s" : ""} from ${selectedCountry}`
            : "Tap a country to spotlight your classmates"}
        </p>
        <div role="group" aria-label="Filter by country" style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
          {countries.map(country => {
            const s = countryGroups[country];
            const isSel = selectedCountry === country;
            return (
              <button
                key={country}
                onClick={() => onSelectCountry(isSel ? null : country)}
                aria-pressed={isSel}
                style={{
                  background:  isSel ? "rgba(196,119,90,0.14)" : "rgba(255,255,255,0.82)",
                  backdropFilter:"blur(10px)",
                  border:      isSel ? "1.5px solid rgba(196,119,90,0.5)" : "1px solid rgba(210,195,180,0.45)",
                  borderRadius:50, padding:"8px 16px",
                  display:"flex", alignItems:"center", gap:7,
                  fontSize:13, color: isSel ? "var(--accent)" : "var(--text-soft)",
                  fontWeight:  isSel ? 700 : 500,
                  transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)",
                  transform:   isSel ? "scale(1.06)" : "scale(1)",
                  boxShadow:   isSel ? "0 6px 22px rgba(196,119,90,0.2)" : "var(--shadow-sm)",
                }}
              >
                <span style={{ fontSize:16 }}>{s[0].flag}</span>
                {country}
                <span style={{
                  background: isSel ? "rgba(196,119,90,0.18)" : "rgba(200,185,170,0.3)",
                  borderRadius:50, padding:"2px 7px", fontSize:10.5,
                  color: isSel ? "var(--accent)" : "#999", fontWeight:700,
                }}>{s.length}</span>
              </button>
            );
          })}
          {selectedCountry && (
            <button
              onClick={() => onSelectCountry(null)}
              style={{
                background:"transparent", border:"1px dashed rgba(200,185,170,0.5)",
                borderRadius:50, padding:"8px 16px",
                fontSize:12.5, color:"#c0b0a0", fontWeight:500, transition:"all 0.2s",
              }}
            >× Show everyone</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GALLERY ITEM ──────────────────────────────────────────────────────────────

const GalleryItem = React.memo(function GalleryItem({ item, index }) {
  const revealRef = useRef(null);
  useReveal(revealRef, index * 0.04);

  return (
    <div
      ref={revealRef}
      className="reveal"
      style={{
        background:"#fff", borderRadius:6, padding:"10px 10px 34px",
        transform:`rotate(${item.rotate}deg)`,
        transition:"transform 0.38s cubic-bezier(0.22,1,0.36,1), box-shadow 0.38s ease",
        boxShadow:"0 4px 18px rgba(0,0,0,0.1), 0 1px 5px rgba(0,0,0,0.06)",
        border:"1px solid rgba(200,190,180,0.22)",
        zIndex:1, position:"relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1) rotate(0deg) translateY(-6px)"; e.currentTarget.style.boxShadow = "0 28px 56px rgba(0,0,0,0.18)"; e.currentTarget.style.zIndex = "10"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${item.rotate}deg)`; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.1)"; e.currentTarget.style.zIndex = "1"; }}
    >
      <div style={{ width:"100%", paddingBottom:"90%", position:"relative", borderRadius:3, background:item.bg, overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:40 }} aria-hidden="true">{item.emoji}</span>
        </div>
      </div>
      <div style={{ marginTop:8, textAlign:"center" }}>
        <div style={{ fontSize:11.5, fontWeight:700, color:"#2d2420", marginBottom:2 }}>{item.label}</div>
        <div style={{ fontSize:10, color:"#b0a090", fontStyle:"italic", fontFamily:"'Cormorant Garamond', Georgia, serif" }}>{item.note}</div>
      </div>
    </div>
  );
});

// ─── QUOTE CARD ────────────────────────────────────────────────────────────────

const QuoteCard = React.memo(function QuoteCard({ item, index }) {
  const revealRef = useRef(null);
  useReveal(revealRef, index * 0.06);

  return (
    <blockquote
      ref={revealRef}
      className="reveal"
      style={{
        background:"rgba(255,255,255,0.76)",
        backdropFilter:"blur(16px)",
        border:"1px solid rgba(235,222,208,0.7)",
        borderRadius:20, padding:"1.5rem 1.75rem",
        transition:"all 0.28s ease",
        boxShadow:"var(--shadow-sm)",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.background = "rgba(255,255,255,0.95)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.background = "rgba(255,255,255,0.76)"; }}
    >
      <div aria-hidden="true" style={{ fontSize:48, color:"rgba(196,119,90,0.18)", fontFamily:"Georgia", lineHeight:0.6, marginBottom:10 }}>"</div>
      <p style={{ fontSize:16.5, color:"#3a3030", lineHeight:1.85, fontStyle:"italic", fontFamily:"'Cormorant Garamond', Georgia, serif", marginBottom:12 }}>{item.quote}</p>
      <footer style={{ fontSize:11.5, color:"#c0b0a0", letterSpacing:0.5, fontWeight:600 }}>— {item.author}</footer>
    </blockquote>
  );
});

// ─── ANONYMOUS MESSAGES ────────────────────────────────────────────────────────

function AnonymousMessages() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft,    setDraft]    = useState("");

  const add = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    setMessages(m => [...m, { id:Date.now(), text, color }]);
    setDraft("");
  }, [draft]);

  return (
    <section aria-label="Anonymous friendship notes">
      <div style={{ display:"grid", gap:10, marginBottom:"1.4rem" }}>
        {messages.map((m, i) => (
          <div key={m.id} style={{
            background:m.color, borderRadius:16, padding:"1rem 1.25rem",
            fontSize:14, color:"#4a3a30", lineHeight:1.8,
            border:"1px solid rgba(255,255,255,0.85)",
            animation: i === messages.length - 1 ? "slideIn 0.4s ease" : "none",
            boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
          }}>{m.text}</div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Leave an anonymous note for a classmate…"
          aria-label="Anonymous note"
          maxLength={280}
          className="search-input"
          style={{ flex:1, borderRadius:50 }}
          onFocus={e  => e.target.style.borderColor = "rgba(196,119,90,0.5)"}
          onBlur={e   => e.target.style.borderColor = "rgba(200,185,168,0.45)"}
        />
        <button
          onClick={add}
          aria-label="Send note"
          style={{
            background:"linear-gradient(135deg, #c4775a, #b46040)",
            color:"white", border:"none", borderRadius:50,
            padding:"13px 24px", fontSize:13.5, fontWeight:700,
            boxShadow:"0 4px 16px rgba(196,119,90,0.35)",
            transition:"all 0.22s ease", flexShrink:0,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 7px 24px rgba(196,119,90,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(196,119,90,0.35)"; }}
        >Send ✦</button>
      </div>
    </section>
  );
}

// ─── TIME CAPSULE ──────────────────────────────────────────────────────────────

function TimeCapsule() {
  const [revealed, setRevealed] = useState(false);
  const [opening,  setOpening]  = useState(false);

  const open = () => {
    setOpening(true);
    setTimeout(() => { setRevealed(true); setOpening(false); }, 550);
  };

  return (
    <div style={{ textAlign:"center" }}>
      {!revealed ? (
        <div style={{
          background:"rgba(255,255,255,0.76)", backdropFilter:"blur(20px)",
          border:"1.5px dashed rgba(180,155,130,0.4)",
          borderRadius:28, padding:"3rem 2rem",
          transition:"transform 0.35s ease, opacity 0.35s ease",
          transform: opening ? "scale(0.96)" : "scale(1)",
          opacity:   opening ? 0.6 : 1,
        }}>
          <div aria-hidden="true" style={{ fontSize:50, marginBottom:16, animation:"float 3.5s ease-in-out infinite", display:"inline-block" }}>📮</div>
          <h3 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, fontWeight:700, color:"#1e1410", marginBottom:10, lineHeight:1.35 }}>
            A letter from your past self
          </h3>
          <p style={{ fontSize:14, color:"#b0a090", marginBottom:26, lineHeight:1.7 }}>
            Written on graduation day.<br />Open when you're ready.
          </p>
          <button
            onClick={open}
            style={{
              background:"linear-gradient(135deg, #c4775a, #a85a3a)",
              color:"white", border:"none", borderRadius:50,
              padding:"14px 36px", fontSize:14.5, fontWeight:700,
              boxShadow:"0 10px 28px rgba(196,119,90,0.38)", transition:"all 0.25s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(196,119,90,0.46)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(196,119,90,0.38)"; }}
          >Open the capsule 📬</button>
        </div>
      ) : (
        <div style={{ animation:"fadeIn 0.8s ease", textAlign:"left" }}>
          {MEMORY_CAPSULE.map((msg, i) => {
            const isLast = i === MEMORY_CAPSULE.length - 1;
            return (
              <div key={i} style={{
                background: isLast ? "rgba(242,196,220,0.25)" : "rgba(255,255,255,0.78)",
                backdropFilter:"blur(10px)",
                border:      isLast ? "1px solid rgba(242,180,196,0.4)" : "1px solid rgba(230,218,205,0.7)",
                borderRadius:18, padding:"1.25rem 1.5rem", marginBottom:10,
                fontSize:    isLast ? 16.5 : 14.5, color:"#3a2e28", lineHeight:1.9,
                fontStyle:   isLast ? "italic" : "normal",
                fontFamily:  isLast ? "'Cormorant Garamond', Georgia, serif" : "inherit",
                animation:  `fadeInUp 0.5s ease ${i*0.18}s both`,
              }}>
                {isLast && <span aria-hidden="true" style={{ marginRight:8 }}>🌸</span>}
                {msg}
              </div>
            );
          })}
          <div style={{ textAlign:"center", marginTop:18 }}>
            <button
              onClick={() => setRevealed(false)}
              style={{
                background:"transparent", color:"#c0b0a0",
                border:"1px solid rgba(200,185,168,0.4)", borderRadius:50,
                padding:"9px 24px", fontSize:13, fontWeight:500, transition:"all 0.2s",
              }}
            >Seal again ✦</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RANDOM MEMORY ─────────────────────────────────────────────────────────────

function RandomMemoryButton({ students }) {
  const [memory,  setMemory]  = useState(null);
  const [spinning, setSpinning] = useState(false);

  const pick = useCallback(() => {
    setSpinning(true);
    setMemory(null);
    setTimeout(() => {
      const all = students.map(s => ({ student:s, memory:s.memory, emoji:s.emoji }));
      setMemory(all[Math.floor(Math.random() * all.length)]);
      setSpinning(false);
    }, 400);
  }, [students]);

  return (
    <div style={{ textAlign:"center" }}>
      <button
        onClick={pick}
        aria-label="Surface a random class memory"
        style={{
          background:"rgba(255,255,255,0.88)", backdropFilter:"blur(10px)",
          border:"1.5px solid rgba(180,155,130,0.45)", borderRadius:50,
          padding:"15px 36px", fontSize:15, color:"#4a3a30", fontWeight:600,
          display:"inline-flex", alignItems:"center", gap:12,
          boxShadow:"var(--shadow-sm)", transition:"all 0.3s cubic-bezier(0.22,1,0.36,1)",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.88)"; }}
      >
        <span aria-hidden="true" style={{ fontSize:18, display:"inline-block", animation: spinning ? "spin 0.5s linear" : "heartbeat 2.5s ease-in-out infinite" }}>✦</span>
        {spinning ? "Finding a memory…" : "Surface a random memory"}
      </button>

      {memory && (
        <div style={{
          marginTop:24, background:"rgba(255,255,255,0.92)", backdropFilter:"blur(16px)",
          border:"1px solid rgba(230,218,205,0.9)",
          borderRadius:26, padding:"1.75rem",
          animation:"scaleIn 0.4s cubic-bezier(0.22,1,0.36,1)",
          maxWidth:520, margin:"24px auto 0",
          boxShadow:`0 20px 56px ${memory.student.color}44`,
        }}>
          <div aria-hidden="true" style={{ fontSize:36, marginBottom:12 }}>{memory.emoji}</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, justifyContent:"center" }}>
            <Avatar student={memory.student} size={36} />
            <span style={{ fontSize:15.5, fontWeight:700, color:"#1e1410", fontFamily:"'Cormorant Garamond', Georgia, serif" }}>{memory.student.name}</span>
            <span style={{ fontSize:15 }}>{memory.student.flag}</span>
          </div>
          <p style={{ fontSize:16, color:"#4a3a30", lineHeight:1.9, fontStyle:"italic", fontFamily:"'Cormorant Garamond', Georgia, serif" }}>
            "{memory.memory}"
          </p>
        </div>
      )}
    </div>
  );
}

// ─── COUNTDOWN ─────────────────────────────────────────────────────────────────

const GRADUATION = new Date("2025-03-20T09:00:00+09:00");

function Countdown() {
  const [time, setTime] = useState({ days:0, hours:0, mins:0, secs:0, past:false });

  useEffect(() => {
    const tick = () => {
      const diff = GRADUATION - Date.now();
      if (diff <= 0) {
        setTime({ days:Math.floor(Math.abs(diff)/86400000), hours:0, mins:0, secs:0, past:true });
        return;
      }
      setTime({ days:Math.floor(diff/86400000), hours:Math.floor((diff%86400000)/3600000), mins:Math.floor((diff%3600000)/60000), secs:Math.floor((diff%60000)/1000), past:false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (time.past) return (
    <div style={{ textAlign:"center" }}>
      <p style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:20, fontStyle:"italic", color:"#9a8070" }}>
        Graduated {time.days} days ago 🌸
      </p>
      <p style={{ fontSize:13, color:"#c0b0a0", marginTop:6 }}>The memories remain forever.</p>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:10, letterSpacing:3.5, color:"#c4a882", textTransform:"uppercase", textAlign:"center", marginBottom:16, fontWeight:700 }}>Until graduation</div>
      <div style={{ display:"flex", gap:16, justifyContent:"center" }}>
        {[{label:"Days",val:time.days},{label:"Hours",val:time.hours},{label:"Mins",val:time.mins},{label:"Secs",val:time.secs}].map(p => (
          <div key={p.label} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:42, fontWeight:700, color:"#1e1410", lineHeight:1, minWidth:52 }}>
              {String(p.val).padStart(2,"0")}
            </div>
            <div style={{ fontSize:9.5, letterSpacing:2.5, color:"#c0b0a0", textTransform:"uppercase", marginTop:4, fontWeight:700 }}>{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION HEADING ───────────────────────────────────────────────────────────

function SectionHeading({ tag, title, sub }) {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <div ref={ref} className="reveal" style={{ textAlign:"center", marginBottom:"3.5rem" }}>
      <div style={{ fontSize:10.5, letterSpacing:4.5, color:"var(--accent)", textTransform:"uppercase", marginBottom:14, fontWeight:700 }}>{tag}</div>
      <h2 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:"clamp(30px,5.5vw,50px)", fontWeight:700, color:"#1e1410", margin:"0 0 12px", lineHeight:1.15 }}>{title}</h2>
      {sub && <p style={{ color:"#b0a090", fontSize:14.5, maxWidth:520, margin:"0 auto", lineHeight:1.75, fontWeight:400 }}>{sub}</p>}
    </div>
  );
}

// ─── LOADING SCREEN ────────────────────────────────────────────────────────────

function LoadingScreen({ progress, msg }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Loading yearbook" style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(145deg, #faf7f2 0%, #f5efe4 50%, #ede4f0 100%)",
      padding:"2rem",
    }}>
      <style>{GLOBAL_CSS}</style>
      <div aria-hidden="true" style={{ fontSize:44, marginBottom:20, animation:"float 2.2s ease-in-out infinite", display:"inline-block" }}>🌸</div>
      <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, color:"#3a2e28", marginBottom:6, textAlign:"center", fontWeight:700 }}>
        {CLASS_DATA.school}
      </div>
      <div style={{ fontSize:11, color:"#c0b0a0", marginBottom:42, letterSpacing:4, textTransform:"uppercase", fontWeight:700 }}>{CLASS_DATA.year}</div>
      <div style={{ width:200, marginBottom:14 }}>
        <div style={{ height:3, background:"rgba(0,0,0,0.06)", borderRadius:3, overflow:"hidden" }}>
          <div style={{
            height:"100%",
            background:"linear-gradient(90deg, #c4775a, #c4a882, #9abfc4)",
            backgroundSize:"200% 100%", animation:"shimmer 2s linear infinite",
            borderRadius:3, width:`${progress}%`, transition:"width 0.1s ease",
          }} />
        </div>
      </div>
      <div style={{ fontSize:13, color:"#d0c0b0", letterSpacing:0.5 }}>{msg}</div>
    </div>
  );
}

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────────

function BottomNav({ activeSection, onNav }) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-btn${activeSection === item.id ? " active" : ""}`}
            onClick={() => onNav(item.id)}
            aria-current={activeSection === item.id ? "location" : undefined}
            aria-label={item.label}
          >
            <span className="bn-icon">{item.icon}</span>
            <span className="bn-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── SCROLL TO TOP ─────────────────────────────────────────────────────────────

function ScrollToTop({ visible }) {
  if (!visible) return null;
  return (
    <button
      className="scroll-top-btn"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}
      style={{ opacity: visible ? 1 : 0 }}
    >↑</button>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function Yearbook() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activeSection,   setActiveSection]   = useState("home");
  const [loading,         setLoading]         = useState(true);
  const [loadProgress,    setLoadProgress]    = useState(0);
  const [loadMsg,         setLoadMsg]         = useState(LOAD_MSGS[0]);
  const [navScrolled,     setNavScrolled]     = useState(false);
  const [showScrollTop,   setShowScrollTop]   = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const sectionsRef = useRef({});

  // Loading progress
  useEffect(() => {
    let prog = 0;
    const timer = setInterval(() => {
      prog = Math.min(prog + 2.5, 100);
      setLoadProgress(prog);
      setLoadMsg(LOAD_MSGS[Math.min(Math.floor(prog / 25), LOAD_MSGS.length - 1)]);
      if (prog >= 100) { clearInterval(timer); setTimeout(() => setLoading(false), 380); }
    }, 22);
    return () => clearInterval(timer);
  }, []);

  // Scroll handler
  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setNavScrolled(y > 20);
    setShowScrollTop(y > 400);
    const entries = Object.entries(sectionsRef.current);
    for (let i = entries.length - 1; i >= 0; i--) {
      const [id, el] = entries[i];
      if (el && el.getBoundingClientRect().top <= 100) { setActiveSection(id); break; }
    }
  }, []);
  const throttledScroll = useThrottledCallback(handleScroll, 80);

  useEffect(() => {
    window.addEventListener("scroll", throttledScroll, { passive:true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [throttledScroll]);

  const scrollTo = useCallback((id) => {
    sectionsRef.current[id]?.scrollIntoView({ behavior:"smooth", block:"start" });
  }, []);

  // Filtered students for World section
  const filteredStudents = useMemo(
    () => selectedCountry ? STUDENTS.filter(s => s.country === selectedCountry) : STUDENTS,
    [selectedCountry]
  );

  // Filtered students for grid (search)
  const searchedStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STUDENTS;
    return STUDENTS.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.dream.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Modal navigation
  const selectedIdx = useMemo(
    () => selectedStudent ? STUDENTS.findIndex(s => s.id === selectedStudent.id) : -1,
    [selectedStudent]
  );
  const openNext = useCallback(() => selectedIdx >= 0 && setSelectedStudent(STUDENTS[(selectedIdx + 1) % STUDENTS.length]), [selectedIdx]);
  const openPrev = useCallback(() => selectedIdx >= 0 && setSelectedStudent(STUDENTS[(selectedIdx - 1 + STUDENTS.length) % STUDENTS.length]), [selectedIdx]);

  if (loading) return <LoadingScreen progress={loadProgress} msg={loadMsg} />;

  return (
    <div style={{ fontFamily:"'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", minHeight:"100vh", color:"var(--text)" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── DESKTOP NAV ── */}
      <nav role="navigation" aria-label="Main navigation" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background: navScrolled ? "rgba(250,247,242,0.97)" : "rgba(250,247,242,0.78)",
        backdropFilter:"blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
        borderBottom: navScrolled ? "1px solid rgba(210,195,175,0.3)" : "1px solid transparent",
        padding:"0 2rem", height:"var(--nav-h)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        transition:"background 0.3s ease, border-color 0.3s ease",
      }}>
        <button
          onClick={() => scrollTo("home")}
          aria-label="Go to top"
          style={{
            background:"none", border:"none", padding:0,
            fontFamily:"'Cormorant Garamond', Georgia, serif",
            fontSize:16, fontWeight:700, color:"#1e1410",
            display:"flex", alignItems:"center", gap:8, cursor:"pointer",
          }}
        >
          <span aria-hidden="true" style={{ fontSize:18 }}>🌸</span>
          <span>Class 3B · {CLASS_DATA.year}</span>
        </button>

        <div className="desktop-nav-links" style={{ display:"flex", gap:2 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`nav-pill${activeSection === item.id ? " active" : ""}`}
              aria-current={activeSection === item.id ? "location" : undefined}
            >{item.label}</button>
          ))}
        </div>

        <div className="desktop-pill" style={{
          background:"rgba(196,119,90,0.1)",
          border:"1px solid rgba(196,119,90,0.3)",
          borderRadius:50, padding:"6px 15px",
          fontSize:11.5, color:"var(--accent)", fontWeight:700, letterSpacing:0.3,
          display:"flex", alignItems:"center", gap:5,
        }}>
          <span aria-hidden="true">🌸</span> Class of 2025
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={el => { sectionsRef.current.home = el; }}
        id="home"
        aria-labelledby="hero-heading"
        className="hero-pad"
        style={{
          minHeight:"100vh",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          position:"relative", overflow:"hidden",
          padding:"76px 2rem 4rem", textAlign:"center",
        }}
      >
        {PETALS.map((p, i) => <SakuraPetal key={i} style={p} />)}
        {ORBS.map((o, i) => <FloatingOrb key={i} style={o} />)}

        <div style={{ position:"relative", zIndex:2, animation:"fadeInUp 1s ease 0.15s both", maxWidth:680 }}>
          <div style={{ fontSize:11, letterSpacing:5.5, color:"var(--accent)", textTransform:"uppercase", marginBottom:28, fontWeight:700 }}>
            {CLASS_DATA.city} · {CLASS_DATA.year}
          </div>

          <h1
            id="hero-heading"
            className="hero-title"
            style={{
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:"clamp(64px,12vw,112px)",
              fontWeight:700, color:"#1a1008", lineHeight:0.9,
              margin:"0 0 14px", letterSpacing:-2,
            }}
          >Class 3B</h1>

          <h2 style={{
            fontFamily:"'Cormorant Garamond', Georgia, serif",
            fontSize:"clamp(15px,2.8vw,22px)",
            fontWeight:400, fontStyle:"italic", color:"#8a7060",
            margin:"0 0 44px",
          }}>{CLASS_DATA.school}</h2>

          <div style={{
            display:"inline-block",
            background:"rgba(255,255,255,0.72)", backdropFilter:"blur(16px)",
            border:"1px solid rgba(220,200,180,0.5)",
            borderRadius:100, padding:"12px 32px", marginBottom:48,
          }}>
            <p style={{
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:"clamp(15px,2.2vw,18px)", fontStyle:"italic",
              color:"#8a7060", margin:0,
            }}>{CLASS_DATA.groupQuote}</p>
          </div>

          {/* Mini avatars row */}
          <div className="hero-avatars" style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
            {STUDENTS.slice(0, 8).map((s, i) => (
              <div key={s.id} style={{ marginLeft: i > 0 ? -14 : 0, zIndex: 8 - i }}>
                <Avatar student={s} size={36} />
              </div>
            ))}
            <div style={{
              width:36, height:36, borderRadius:"50%", marginLeft:-14, zIndex:0,
              background:"rgba(255,255,255,0.9)", backdropFilter:"blur(8px)",
              border:"2px solid rgba(255,255,255,0.92)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:10, fontWeight:700, color:"#8a7060",
            }}>+12</div>
          </div>

          <p className="hero-sub-text" style={{ fontSize:13, color:"#b0a090", letterSpacing:0.5, fontWeight:500, marginBottom:36 }}>
            20 students · 8 countries · 1 unforgettable year
          </p>

          {/* Countdown */}
          <div style={{
            background:"rgba(255,255,255,0.72)", backdropFilter:"blur(16px)",
            border:"1px solid rgba(220,205,185,0.5)",
            borderRadius:24, padding:"1.5rem 2rem",
            display:"inline-block", boxShadow:"var(--shadow-sm)",
          }}>
            <Countdown />
          </div>
        </div>

        {/* Scroll hint */}
        <div aria-hidden="true" style={{
          position:"absolute", bottom:30, left:"50%", transform:"translateX(-50%)",
          animation:"floatSlow 2.8s ease-in-out infinite", zIndex:2,
        }}>
          <div style={{ fontSize:10, color:"#d4c4b0", letterSpacing:3.5, textTransform:"uppercase", marginBottom:5, fontWeight:700 }}>Scroll</div>
          <div style={{ fontSize:14, color:"#d4c4b0", textAlign:"center" }}>↓</div>
        </div>
      </section>

      {/* ── STUDENTS ── */}
      <section
        ref={el => { sectionsRef.current.students = el; }}
        id="students"
        aria-labelledby="students-heading"
        className="section-pad"
        style={{ padding:"6rem 2rem 4rem", maxWidth:1340, margin:"0 auto" }}
      >
        <SectionHeading
          tag="Our Class"
          title="Classmates"
          sub="From across Asia, brought together by Japanese and kept together by friendship. Tap any card to see their story."
        />

        {/* Search bar */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:"2.5rem" }}>
          <div style={{ position:"relative", width:"100%", maxWidth:440 }}>
            <span aria-hidden="true" style={{
              position:"absolute", left:18, top:"50%", transform:"translateY(-50%)",
              fontSize:14, color:"var(--text-muted)", pointerEvents:"none",
            }}>🔍</span>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, country, or role…"
              aria-label="Search classmates"
              className="search-input"
              style={{ paddingLeft:42 }}
            />
          </div>
        </div>

        {/* Empty state */}
        {searchedStudents.length === 0 && (
          <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--text-muted)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🌸</div>
            <p style={{ fontSize:15, fontFamily:"'Cormorant Garamond', Georgia, serif", fontStyle:"italic" }}>
              No classmates match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              style={{ marginTop:14, background:"none", border:"1px solid rgba(200,185,168,0.5)", borderRadius:50, padding:"8px 20px", fontSize:13, color:"var(--text-soft)", cursor:"pointer" }}
            >Clear search</button>
          </div>
        )}

        {/* Masonry grid — cards adapt to natural photo ratio */}
        {searchedStudents.length > 0 && (
          <div className="masonry-grid">
            {searchedStudents.map((s, i) => (
              <div key={s.id} className="masonry-item" style={{ animationDelay:`${i * 0.04}s` }}>
                <StudentCard student={s} onClick={setSelectedStudent} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── WORLD ── */}
      <section
        ref={el => { sectionsRef.current.world = el; }}
        id="world"
        aria-labelledby="world-heading"
        className="section-pad"
        style={{
          padding:"7rem 2rem 5rem",
          background:"linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.25) 100%)",
        }}
      >
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <SectionHeading
            tag="Where We Come From"
            title="A World in One Classroom"
            sub="Every seat held a different story. Every voice added a new color to our shared year."
          />

          <WorldSection students={STUDENTS} onSelectCountry={setSelectedCountry} selectedCountry={selectedCountry} />

          <div className="world-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(195px, 1fr))", gap:11 }}>
            {filteredStudents.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                aria-label={`View ${s.name}'s profile`}
                style={{
                  background:"rgba(255,255,255,0.82)", backdropFilter:"blur(12px)",
                  border:"1px solid rgba(225,210,195,0.5)",
                  borderRadius:18, padding:"0.9rem 1.1rem",
                  textAlign:"left", display:"flex", alignItems:"center", gap:11,
                  transition:"all 0.25s ease",
                  animation:`fadeInUp 0.42s ease ${i*0.04}s both`,
                  boxShadow:"var(--shadow-sm)", cursor:"pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.background = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.background = "rgba(255,255,255,0.82)"; }}
              >
                <Avatar student={s} size={44} />
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1e1410", fontFamily:"'Cormorant Garamond', Georgia, serif" }}>{s.name}</div>
                  <div style={{ fontSize:11, color:"#b0a090", marginTop:2, fontWeight:500 }}>{s.flag} {s.country}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section
        ref={el => { sectionsRef.current.gallery = el; }}
        id="gallery"
        aria-labelledby="gallery-heading"
        className="section-pad"
        style={{ padding:"7rem 2rem 5rem", maxWidth:1340, margin:"0 auto" }}
      >
        <SectionHeading
          tag="Photo Memories"
          title="Polaroid Gallery"
          sub="Hover to relive the moment. Every photo holds a story only we know."
        />

        <div
          className="gallery-grid"
          style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))",
            gap:28, padding:"1.5rem 1rem 2rem",
          }}
        >
          {GALLERY_ITEMS.map((item, i) => <GalleryItem key={item.id} item={item} index={i} />)}
        </div>
      </section>

      {/* ── MEMORIES ── */}
      <section
        ref={el => { sectionsRef.current.memories = el; }}
        id="memories"
        aria-labelledby="memories-heading"
        className="section-pad"
        style={{
          padding:"7rem 2rem 5rem",
          background:"linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.25) 100%)",
        }}
      >
        <div style={{ maxWidth:840, margin:"0 auto" }}>
          <SectionHeading tag="Memories & Moments" title="Things We'll Never Forget" />

          {/* Random memory */}
          <div style={{ marginBottom:"4.5rem" }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, color:"#2d2420", marginBottom:"1.5rem", textAlign:"center", fontWeight:600 }}>
              Random Memory
            </h3>
            <RandomMemoryButton students={STUDENTS} />
          </div>

          {/* Class quotes */}
          <div style={{ marginBottom:"4.5rem" }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, color:"#2d2420", marginBottom:"1.5rem", textAlign:"center", fontWeight:600 }}>
              Class Quotes
            </h3>
            <div className="quote-grid" style={{ display:"grid", gap:12 }}>
              {FUNNY_QUOTES.map((q, i) => <QuoteCard key={i} item={q} index={i} />)}
            </div>
          </div>

          {/* Anonymous notes */}
          <div style={{ marginBottom:"4.5rem" }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, color:"#2d2420", marginBottom:8, textAlign:"center", fontWeight:600 }}>
              Anonymous Friendship Notes
            </h3>
            <p style={{ fontSize:13, color:"#c0b0a0", textAlign:"center", marginBottom:"1.5rem", fontStyle:"italic" }}>
              Leave a note without revealing who you are.
            </p>
            <AnonymousMessages />
          </div>

          {/* Time capsule */}
          <div style={{ marginBottom:"2rem" }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:24, color:"#2d2420", marginBottom:"1.5rem", textAlign:"center", fontWeight:600 }}>
              Time Capsule
            </h3>
            <TimeCapsule />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding:"5rem 2rem 4rem",
        background:"rgba(255,255,255,0.6)", backdropFilter:"blur(10px)",
        borderTop:"1px solid rgba(215,200,185,0.3)",
        textAlign:"center", position:"relative", overflow:"hidden",
      }}>
        <div aria-hidden="true" style={{
          position:"absolute", top:-80, left:"50%", transform:"translateX(-50%)",
          width:440, height:440, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(242,196,172,0.16) 0%, transparent 70%)",
          pointerEvents:"none",
        }} />

        <div style={{
          display:"inline-flex", alignItems:"center", gap:9,
          background:"rgba(255,255,255,0.75)", backdropFilter:"blur(14px)",
          border:"1px solid rgba(215,200,185,0.4)", borderRadius:50, padding:"10px 22px", marginBottom:24,
        }}>
          <span aria-hidden="true" style={{ fontSize:16 }}>🌸</span>
          <span style={{ fontSize:12, color:"#8a7060", letterSpacing:1.5, fontWeight:700 }}>{CLASS_DATA.school}</span>
        </div>

        <div style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:"clamp(26px,5.5vw,42px)", marginBottom:6, color:"#1e1410", fontWeight:700 }}>
          Class 3B · 2024–2025
        </div>
        <div style={{ fontSize:13.5, color:"#b4a494", marginBottom:30, fontWeight:500 }}>{CLASS_DATA.city}</div>

        <div aria-label="All classmates" style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"4px 8px", maxWidth:720, margin:"0 auto 34px" }}>
          {STUDENTS.map((s, i) => (
            <span key={s.id} style={{ fontSize:12, color:"#9a8878", display:"inline-flex", alignItems:"center", gap:4, fontWeight:500 }}>
              {i > 0 && <span aria-hidden="true" style={{ color:"#e0d5c4", margin:"0 2px" }}>·</span>}
              <span aria-hidden="true">{s.flag}</span>{s.name.split(" ")[0]}
            </span>
          ))}
        </div>

        <p style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:18, fontStyle:"italic", color:"#c4b4a0", lineHeight:1.65, maxWidth:480, margin:"0 auto 20px" }}>
          {CLASS_DATA.timeCapsula}
        </p>

        <div aria-hidden="true" style={{ fontSize:24, marginBottom:10, animation:"heartbeat 2.5s ease-in-out infinite", display:"inline-block" }}>🌸</div>
        <div aria-hidden="true" style={{ fontSize:10.5, color:"#ddd4c8", letterSpacing:3.5, textTransform:"uppercase", fontWeight:700 }}>言葉は橋</div>
      </footer>

      {/* ── MOBILE BOTTOM NAV ── */}
      <BottomNav activeSection={activeSection} onNav={scrollTo} />

      {/* ── SCROLL TO TOP ── */}
      <ScrollToTop visible={showScrollTop} />

      {/* ── MODAL ── */}
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
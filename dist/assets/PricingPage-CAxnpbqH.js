import{b as E,aM as J,d as B,af as G,u as Q,aN as V,r as u,j as e,b6 as X,k as h,A as D,ap as Z,aP as P,aw as ee,ao as re,be as te,bd as ae,bf as se,aQ as L,O as ie,X as ne,an as oe,aj as le,aU as ce,aW as de,s as O,bg as pe}from"./index-CLg6oZWF.js";import{L as xe,S as me}from"./ScratchCardSection-CPqWnGk8.js";/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=E("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=E("Infinity",[["path",{d:"M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z",key:"1z0uae"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=E("Unlock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]),A="https://eojryhfwtnjyegqhiust.supabase.co/functions/v1/razorpay",ue=[{id:"ONE_WEEK",name:"1 Week",label:"Trial",price:99,floorPrice:9,originalPrice:299,priceNote:"₹99 / week",icon:Z,iconColor:"#f43f5e",featured:!1},{id:"ONE_MONTH",name:"1 Month",label:"Starter",price:249,floorPrice:99,originalPrice:499,priceNote:"₹249 / month",icon:P,iconColor:"#3b82f6",featured:!1},{id:"THREE_MONTHS",name:"3 Months",label:"Super Saver",price:399,floorPrice:249,originalPrice:799,priceNote:"₹133 / month",icon:F,iconColor:"#10b981",featured:!1},{id:"SIX_MONTHS",name:"6 Months",label:"Trending",price:499,floorPrice:349,originalPrice:1199,priceNote:"₹83 / month",icon:ee,iconColor:"#f59e0b",featured:!1,badge:{text:"Trending",color:"#f59e0b"}},{id:"ONE_YEAR",name:"1 Year",label:"Popular",price:599,floorPrice:449,originalPrice:1999,priceNote:"₹50 / month",icon:re,iconColor:"#6366f1",featured:!1,badge:{text:"Popular",color:"#3b82f6"}},{id:"LIFETIME",name:"Lifetime",label:"Best Value",price:1149,floorPrice:999,originalPrice:4999,priceNote:"₹7 / month equivalent",icon:U,iconColor:"#a855f7",featured:!0,badge:{text:"Best Value",color:"#a855f7"}}],he=[{icon:fe,label:"Unlock all mock tests & PYQs",desc:"Full access to current and upcoming exam papers",color:"#10b981"},{icon:te,label:"Mint double Kash Coins",desc:"Earn 2X rewards on correct answers to build streaks",color:"#fbbf24"},{icon:ae,label:"Master AI Mentor",desc:"Direct, premium hints & question diagnostic support",color:"#c084fc"},{icon:se,label:"Spaced Repetition (SRS)",desc:"Smart card sets focusing on your weakest areas",color:"#3b82f6"},{icon:F,label:"Advanced Analytics",desc:"Track speed index, correct ratios, and accuracy trends",color:"#22d3ee"},{icon:L,label:"Ad-Free Interface",desc:"Fully distraction-free study environment",color:"#f87171"}];function ye(){const b=J(),{user:_}=B(),{economy:t,refreshEconomy:j}=G(),{showToast:l}=Q(),{playVictory:$}=V(),C=()=>{try{const a=`mcqkash_scratch_history_${(t==null?void 0:t.username)||"default"}`;let s=JSON.parse(localStorage.getItem(a)||"[]");if(t&&t.id&&t.id!=="default_user"){let c=!1;const i=s.some(x=>x.type==="Welcome Card"),n=localStorage.getItem("mcqkash_welcome_coins_pending");t.referred_by&&!i&&!n&&(s.push({id:"welcome_restored",type:"Welcome Card",coins:150,wallet:0,date:"Welcome"}),c=!0);const d=s.filter(x=>x.type==="Referral Card").length,p=Number(t.scratched_cards_count||0);if(d<p){const x=p-d;for(let m=0;m<x;m++)s.push({id:`ref_restored_${Date.now()}_${m}`,type:"Referral Card",coins:150,wallet:25,date:"Referred"});c=!0}c&&localStorage.setItem(a,JSON.stringify(s))}return s}catch{return[]}},W=()=>{const r=C();return r.length>0?r.reduce((a,s)=>a+(s.coins||0),0):0},v=()=>C().filter(a=>a.type==="Referral Card").length,R=()=>C().filter(a=>a.type==="Welcome Card").length,[I,f]=u.useState(null),[g,S]=u.useState(!1),[o,z]=u.useState(null),[k,N]=u.useState(!1);u.useEffect(()=>{g&&(t!=null&&t.referred_by)&&(async()=>{N(!0);try{const{data:a,error:s}=await O.rpc("get_public_profile_by_username",{target_username:t.referred_by});if(!s&&a){z(a),N(!1);return}}catch{console.warn("RPC failed, falling back to local storage cache")}try{const s=localStorage.getItem("mcqkash_lb_cache_coins");if(s){const{data:c}=JSON.parse(s),i=c.find(n=>{var d,p;return((d=n.username)==null?void 0:d.toLowerCase())===t.referred_by.toLowerCase()||((p=n.full_name)==null?void 0:p.toLowerCase())===t.referred_by.toLowerCase()});if(i){z({avatar_id:i.avatar_id||1,rank:i.rank||null,full_name:i.full_name||t.referred_by,is_pro:!!i.pro_expires_at&&new Date(i.pro_expires_at)>new Date}),N(!1);return}}}catch{console.warn("Leaderboard cache search failed")}z({avatar_id:1,rank:null,full_name:t.referred_by,is_pro:!1}),N(!1)})()},[g,t==null?void 0:t.referred_by]),u.useEffect(()=>(g?(document.body.style.overflow="hidden",j&&j(!0)):document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[g]);const y=(t==null?void 0:t.premium_discount_earned)||0,K=async()=>{const r=window.location.origin+(window.location.pathname.startsWith("/mcq")?"/mcq":"")+"/signin?ref="+encodeURIComponent((t==null?void 0:t.username)||""),a=`📚 Preparing for Competitive Exams?
I'm using MCQkash for topic-wise MCQs, PYQ's, Smart Revision, and exam-focused Mock Test with AI Analysis.
Join to compete with me on Leaderboard and USE my referral code "${t==null?void 0:t.username}" when signing up and we'll both earn Jackpot KashCoins + Exclusive FREE Rewards 🎁
🚀 Click here to register directly --> ${r}`;if(navigator.share)try{await navigator.share({title:"MCQ Kash",text:a,url:r}),l("Referral shared successfully! 🚀","success")}catch(s){s.name!=="AbortError"&&(console.error("Web Share failed:",s),M(a))}else M(a)},M=r=>{navigator.clipboard.writeText(r),l("Share text copied to clipboard! 📋","success")},H=()=>new Promise(r=>{if(window.Razorpay)return r(!0);const a=document.createElement("script");a.src="https://checkout.razorpay.com/v1/checkout.js",a.onload=()=>r(!0),a.onerror=()=>r(!1),document.body.appendChild(a)}),Y=async r=>{if(!_){l("Sign In to upgrade your account!","warning"),b("/signin");return}if((t==null?void 0:t.user_tier)==="Pro"&&(t==null?void 0:t.pro_tier)===r.id){l("You are already on this plan!","info");return}f(r.id);try{if(!await H()){l("Failed to load Razorpay.","error"),f(null);return}const{data:{session:s}}=await O.auth.getSession();if(!(s!=null&&s.access_token)){l("Session expired. Sign in again.","warning"),b("/profile"),f(null);return}const c=s.access_token,i=await fetch(`${A}/create-order`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({planId:r.id})});if(!i.ok)throw new Error((await i.json()).error||"Order failed");const{orderId:n,amount:d,currency:p,keyId:x}=await i.json();new window.Razorpay({key:x,amount:d,currency:p,name:"MCQ Kash",description:`${r.name} Pro Upgrade`,order_id:n,prefill:{email:_.email},theme:{color:r.featured?"#a855f7":"#f59e0b"},modal:{ondismiss:()=>{f(null),l("Cancelled.","info")}},handler:async m=>{try{const w=await fetch(`${A}/verify-payment`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({razorpay_order_id:m.razorpay_order_id,razorpay_payment_id:m.razorpay_payment_id,razorpay_signature:m.razorpay_signature,planId:r.id})});if(!w.ok)throw new Error((await w.json()).error);const{success:q}=await w.json();q&&(pe({particleCount:180,spread:100,origin:{y:.5},colors:["#fbbf24","#a855f7","#6366f1","#10b981","#f43f5e"]}),l("Welcome to Pro! ★","success"),await j(),setTimeout(()=>b("/profile"),1600))}catch(w){l(w.message,"error")}finally{f(null)}}}).open()}catch(a){l(a.message||"Checkout failed.","error"),f(null)}},T=(t==null?void 0:t.user_tier)==="Pro";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .pricing-root {
          min-height: 100vh;
          background: #05070a;
          color: #f1f5f9;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
          padding-bottom: 60px;
        }
        .pricing-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% -10%, rgba(251,191,36,.06) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 80% 110%, rgba(168,85,247,.05) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(67,97,238,.03) 0%, transparent 60%);
          pointer-events: none;
        }

        /* ── NAV ── */
        .pricing-nav {
          position: sticky; top: 0; z-index: 50;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          background: rgba(5,7,10,.75);
          border-bottom: 1px solid rgba(255,255,255,.04);
          backdrop-filter: blur(24px);
        }
        .nav-back {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 12px;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
          color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; transition: all .2s;
        }
        .nav-back:hover { background: rgba(255,255,255,.06); color: #f1f5f9; }
        .nav-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: #f59e0b;
        }
        .nav-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        /* ── HERO ── */
        .pricing-hero {
          text-align: center; padding: 48px 24px 32px;
          max-width: 780px; margin: 0 auto;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 999px;
          background: rgba(251,191,36,.06); border: 1px solid rgba(251,191,36,.15);
          font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase;
          color: #f59e0b; margin-bottom: 18px;
        }
        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(34px, 4.5vw, 52px);
          font-weight: 900; line-height: 1.1; letter-spacing: -.03em;
          color: #f8fafc; margin-bottom: 14px;
        }
        .hero-title span {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #fb923c 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hero-sub {
          font-family: 'Outfit', sans-serif;
          font-size: 16px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase;
          display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;
        }
        .sub-gopro { color: #fbbf24; }
        .sub-gounlimited { color: #a855f7; }
        .sub-gounstoppable { color: #6366f1; }
        
        .guest-warn {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 18px;
          padding: 10px 16px; border-radius: 14px;
          background: rgba(245,158,11,.04); border: 1px solid rgba(245,158,11,.15);
          font-size: 12px; font-weight: 600; color: rgba(245,158,11,.85); cursor: pointer;
        }
        .guest-warn u { color: #f59e0b; }

        /* ── COMPACT 3-COLUMN CARD STRIP ── */
        .plans-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 980px; margin: 0 auto 40px; padding: 0 24px;
        }
        @media(max-width:860px) { .plans-strip { grid-template-columns: repeat(2, 1fr); } }
        @media(max-width:540px) { .plans-strip { grid-template-columns: 1fr; } }

        .plan-card {
          position: relative; border-radius: 18px; padding: 20px;
          background: rgba(255,255,255,.015);
          border: 1px solid rgba(255,255,255,.04);
          display: flex; flex-direction: column; justify-content: space-between;
          gap: 14px;
          transition: all .25s cubic-bezier(.23,1,.32,1);
          cursor: default;
        }
        .plan-card:hover {
          background: rgba(255,255,255,.022);
          border-color: rgba(255,255,255,.1);
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(0,0,0,.3);
        }
        .plan-card.featured {
          background: linear-gradient(145deg, rgba(168,85,247,.05), rgba(99,102,241,.03), rgba(5,7,10,0));
          border-color: rgba(168,85,247,.22);
          box-shadow: 0 0 0 1px rgba(168,85,247,.06), 0 20px 45px rgba(168,85,247,.06);
        }
        .plan-card.featured:hover {
          border-color: rgba(168,85,247,.4);
          box-shadow: 0 0 0 1px rgba(168,85,247,.15), 0 24px 55px rgba(168,85,247,.12);
        }
        .featured-glow {
          position: absolute; inset: -1px; border-radius: 18px;
          background: linear-gradient(135deg, rgba(168,85,247,.1), rgba(99,102,241,.06), transparent 50%);
          pointer-events: none;
        }

        /* Card badge */
        .plan-badge {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          padding: 2.5px 10px; border-radius: 999px;
          font-size: 8.5px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase;
          white-space: nowrap; display: flex; align-items: center; gap: 4px;
        }
        .badge-amber { background: #f59e0b; color: #05070a; box-shadow: 0 3px 10px rgba(245,158,11,.25); }
        .badge-blue { background: #3b82f6; color: #fff; box-shadow: 0 3px 10px rgba(59,130,246,.25); }
        .badge-purple {
          background: linear-gradient(90deg, #a855f7, #6366f1);
          color: #fff; box-shadow: 0 3px 10px rgba(168,85,247,.3);
        }

        /* Card Header */
        .card-header-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .plan-meta { display: flex; flex-direction: column; }
        .plan-label {
          font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em;
          color: #475569; margin-bottom: 2px;
        }
        .plan-name {
          font-family: 'Outfit', sans-serif;
          font-size: 18px; font-weight: 800; color: #f1f5f9; letter-spacing: -.02em;
        }
        .plan-card.featured .plan-name {
          background: linear-gradient(135deg, #e9d5ff, #c4b5fd);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .card-icon-wrap {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05);
        }

        .plan-divider { height: 1px; background: rgba(255,255,255,.03); }

        /* Price details */
        .price-section { display: flex; flex-direction: column; gap: 2px; }
        .price-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .price-currency { font-size: 14px; font-weight: 700; color: #64748b; margin-right: 1px; }
        .price-amount {
          font-family: 'Outfit', sans-serif;
          font-size: 34px; font-weight: 900; letter-spacing: -.04em; color: #f8fafc; line-height: 1;
        }
        .plan-card.featured .price-amount {
          background: linear-gradient(135deg, #f0abfc, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .price-strike {
          text-decoration: line-through; color: #475569; font-size: 13.5px; font-weight: 600;
        }
        .price-note {
          font-size: 10px; font-weight: 600; color: #475569; margin-top: 1px;
        }
        .plan-card.featured .price-note { color: #a78bfa; }

        /* Upgrade button */
        .upgrade-btn {
          width: 100%; padding: 9px; border-radius: 12px;
          font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          cursor: pointer; transition: all .2s;
          border: none; outline: none;
        }
        .upgrade-btn:active { transform: scale(.98); }
        .upgrade-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        .btn-default {
          background: rgba(255,255,255,.03); color: #cbd5e1;
          border: 1px solid rgba(255,255,255,.05);
        }
        .btn-default:not(:disabled):hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.12); color: #f1f5f9; }

        .btn-featured {
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 18px rgba(168,85,247,.22);
          border: 1px solid rgba(255,255,255,.08);
        }
        .btn-featured:not(:disabled):hover { box-shadow: 0 6px 22px rgba(168,85,247,.35); opacity: .95; }

        .btn-spin {
          width: 12px; height: 12px; border-radius: 50%;
          border: 2px solid currentColor; border-top-color: transparent;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── FEATURES MATRIX PANEL ── */
        .features-panel {
          max-width: 980px; margin: 0 auto 36px; padding: 0 24px;
        }
        .features-box {
          background: rgba(255,255,255,.01);
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 20px; padding: 24px 24px 20px;
          backdrop-filter: blur(12px);
        }
        .features-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
        }
        .features-header-title {
          font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 800; color: #f1f5f9; letter-spacing: -.01em;
        }
        .features-header-sub {
          font-size: 10px; color: #475569; font-weight: 600; margin-left: auto;
          text-transform: uppercase; letter-spacing: .1em;
        }
        .features-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
        }
        @media(max-width:680px) { .features-grid { grid-template-columns: 1fr; } }

        .feature-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          transition: background .2s;
        }
        .feature-item:hover { background: rgba(255,255,255,.015); }
        .feature-icon-wrap {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          shrink: 0; flex-shrink: 0;
        }
        .feature-text-block { display: flex; flex-direction: column; gap: 2px; }
        .feature-label {
          font-size: 12px; font-weight: 800; color: #cbd5e1;
        }
        .feature-desc {
          font-size: 10px; font-weight: 550; color: #57657a; line-height: 1.4;
        }

        /* ── TRUST FOOTER ── */
        .trust-footer {
          max-width: 980px; margin: 0 auto; padding: 0 24px 36px;
          display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap;
          border-top: 1px solid rgba(255,255,255,.03); padding-top: 20px;
        }
        .trust-item { display: flex; align-items: center; gap: 6px; }
        .trust-label { font-size: 10.5px; font-weight: 600; color: #475569; }
      `}),e.jsxs("div",{className:"pricing-root",children:[e.jsxs("nav",{className:"pricing-nav",children:[e.jsxs("button",{className:"nav-back",onClick:()=>b(-1),children:[e.jsx(X,{size:12,strokeWidth:2.5})," Back"]}),e.jsxs("div",{className:"nav-badge",children:[e.jsx("div",{className:"nav-dot"}),"Premium Portal"]})]}),e.jsxs("section",{className:"pricing-hero",children:[e.jsxs("div",{className:"hero-eyebrow",children:[e.jsx(h,{size:11})," Upgrade Plan"]}),e.jsxs("h1",{className:"hero-title",children:["Unlock ",e.jsx("span",{children:"MCQ Kash Pro"})]}),e.jsxs("div",{className:"hero-sub",children:[e.jsx("span",{className:"sub-gopro",children:"Go Pro."}),e.jsx("span",{className:"sub-gounlimited",children:"Go Unlimited."}),e.jsx("span",{className:"sub-gounstoppable",children:"Go Unstoppable."})]}),!_&&e.jsxs("div",{className:"guest-warn",onClick:()=>b("/signin"),children:[e.jsx(D,{size:14}),e.jsxs("span",{children:["You're offline. ",e.jsx("u",{children:"Sign In"})," to activate your plan."]})]})]}),!T&&y===0&&e.jsx("div",{className:"max-w-[980px] mx-auto px-6 mb-6",children:e.jsxs("div",{className:"bg-gradient-to-r from-cyan-950/20 via-theme-bg/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/35 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden transition-all duration-300 text-left",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 pointer-events-none"}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("h4",{className:"text-lg font-black text-theme-text tracking-tight flex items-center gap-2",children:[e.jsx(h,{size:18,className:"text-cyan-400 animate-pulse shrink-0"}),"Earn your Pro"]}),e.jsxs("p",{className:"text-xs text-theme-muted font-bold leading-relaxed max-w-[500px]",children:[e.jsx("strong",{className:"text-cyan-400 font-extrabold",children:"Every friend"})," you bring makes your ",e.jsx("strong",{className:"text-amber-400 font-extrabold",children:"Pro affordable"})," by ",e.jsx("strong",{className:"text-emerald-400 font-extrabold",children:"₹25 per invite"}),"."]})]}),e.jsxs("button",{onClick:()=>S(!0),className:"w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-500/90 hover:to-blue-600/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_14px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 flex items-center justify-center gap-1.5",children:[e.jsx(h,{size:12})," Earn Rewards"]})]})}),e.jsx("div",{className:"plans-strip",children:ue.map(r=>{const a=T&&(t==null?void 0:t.pro_tier)===r.id,s=I===r.id,c=r.icon,i=Math.max(r.floorPrice,r.price-y);let n=r.priceNote;return y>0&&(r.id==="ONE_WEEK"?n=`₹${i} / week`:r.id==="ONE_MONTH"?n=`₹${i} / month`:r.id==="THREE_MONTHS"?n=`₹${Math.round(i/3)} / month`:r.id==="SIX_MONTHS"?n=`₹${Math.round(i/6)} / month`:r.id==="ONE_YEAR"?n=`₹${Math.round(i/12)} / month`:r.id==="LIFETIME"&&(n=`₹${Math.round(i/144)} / month equivalent`)),e.jsxs("div",{className:`plan-card${r.featured?" featured":""}`,children:[r.featured&&e.jsx("div",{className:"featured-glow"}),r.badge&&e.jsxs("div",{className:`plan-badge ${r.id==="LIFETIME"?"badge-purple":r.id==="ONE_YEAR"?"badge-blue":"badge-amber"}`,children:[e.jsx(h,{size:8,fill:"currentColor"}),r.badge.text]}),e.jsxs("div",{className:"card-header-row",children:[e.jsxs("div",{className:"plan-meta",children:[e.jsx("div",{className:"plan-label",children:r.label}),e.jsx("div",{className:"plan-name",children:r.name})]}),e.jsx("div",{className:"card-icon-wrap",children:e.jsx(c,{size:16,style:{color:r.iconColor}})})]}),e.jsx("div",{className:"plan-divider"}),e.jsxs("div",{className:"price-section",children:[e.jsxs("div",{className:"price-row",children:[e.jsx("span",{className:"price-currency",children:"₹"}),e.jsx("span",{className:"price-amount",children:i}),y>0&&i<r.price?e.jsxs("span",{className:"price-strike",children:["₹",r.price]}):e.jsxs("span",{className:"price-strike",children:["₹",r.originalPrice]})]}),e.jsx("div",{className:"price-note",children:n}),y>0&&i<r.price&&e.jsxs("div",{className:"text-[10px] font-bold text-emerald-500 mt-1",children:["Referral Discount Applied: -₹",r.price-i]})]}),e.jsx("button",{className:`upgrade-btn ${r.featured?"btn-featured":"btn-default"}`,onClick:()=>Y(r),disabled:s||a||I!==null,children:s?e.jsx("div",{className:"btn-spin"}):a?"Active ✓":e.jsxs(e.Fragment,{children:[e.jsx(P,{size:10,fill:"currentColor"}),"Upgrade"]})})]},r.id)})}),e.jsx("div",{className:"features-panel",children:e.jsxs("div",{className:"features-box",children:[e.jsxs("div",{className:"features-header",children:[e.jsx(h,{size:14,style:{color:"#f59e0b"}}),e.jsx("span",{className:"features-header-title",children:"Everything included in Pro"}),e.jsx("span",{className:"features-header-sub",children:"Full access benefits"})]}),e.jsx("div",{className:"features-grid",children:he.map((r,a)=>e.jsxs("div",{className:"feature-item",children:[e.jsx("div",{className:"feature-icon-wrap",style:{background:r.color+"12"},children:e.jsx(r.icon,{size:14,style:{color:r.color}})}),e.jsxs("div",{className:"feature-text-block",children:[e.jsx("span",{className:"feature-label",children:r.label}),e.jsx("span",{className:"feature-desc",children:r.desc})]})]},a))})]})}),e.jsxs("div",{className:"trust-footer",children:[e.jsxs("div",{className:"trust-item",children:[e.jsx(L,{size:12,style:{color:"#f59e0b"}}),e.jsx("span",{className:"trust-label",children:"Razorpay secured · 128-bit SSL"})]}),e.jsxs("div",{className:"trust-item",children:[e.jsx(P,{size:12,style:{color:"#a78bfa"}}),e.jsx("span",{className:"trust-label",children:"Instant activation after payment"})]}),e.jsxs("div",{className:"trust-item",children:[e.jsx(U,{size:12,style:{color:"#34d399"}}),e.jsx("span",{className:"trust-label",children:"One-time billing · No auto-renew"})]})]}),g&&e.jsx("div",{className:"fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden custom-scrollbar flex items-start sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-theme-bg/90",onClick:r=>{r.target===r.currentTarget&&S(!1)},children:e.jsxs(ie.div,{initial:{opacity:0,scale:.9,y:30},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.9,y:30},className:"w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:max-w-md md:max-w-4xl flex flex-col bg-theme-surface border-0 ring-1 ring-theme-border/20 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative sm:overflow-hidden",onClick:r=>r.stopPropagation(),children:[e.jsxs("div",{className:"shrink-0 p-6 bg-gradient-to-b from-theme-primary/10 to-transparent flex items-start justify-between relative",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-theme-primary via-theme-accent to-theme-primary opacity-50"}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-2xl font-black flex items-center gap-2 text-theme-text italic tracking-tighter",children:[e.jsx(h,{className:"text-theme-primary fill-theme-primary animate-pulse",size:24}),"Reward Center"]}),e.jsx("p",{className:"text-[10px] font-black uppercase tracking-widest text-theme-muted mt-1 opacity-60",children:"Referral & Milestone Rewards Protocol"})]}),e.jsx("button",{onClick:()=>S(!1),className:"p-2 rounded-full bg-theme-bg/50 hover:bg-theme-bg border border-theme-border/50 transition-all",children:e.jsx(ne,{size:18,className:"text-theme-muted"})})]}),e.jsxs("div",{className:"flex-1 sm:overflow-y-auto sm:custom-scrollbar p-6 sm:p-8 pt-0 flex flex-col md:grid md:grid-cols-2 md:gap-10",children:[e.jsxs("div",{className:"flex flex-col",children:[(t==null?void 0:t.referred_by)&&e.jsxs("div",{className:"mb-6 bg-gradient-to-r from-theme-primary/5 via-theme-accent/[0.03] to-transparent border border-theme-primary/20 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-card hover:shadow-card-hover hover:border-theme-primary/35 hover:scale-[1.01] transition-all duration-350 ease-out group/inviter",children:[e.jsx("div",{className:"absolute inset-0 bg-grid-white/[0.01] pointer-events-none"}),e.jsxs("div",{className:"flex items-center gap-4 relative z-10",children:[e.jsx("div",{className:"w-12 h-12 rounded-full ring-2 ring-theme-primary/30 group-hover/inviter:ring-theme-primary/50 p-[2px] bg-theme-surface shrink-0 transition-all duration-300",children:k?e.jsx("div",{className:"w-full h-full rounded-full bg-theme-bg/50 animate-pulse flex items-center justify-center",children:e.jsx(xe,{size:16,className:"text-theme-primary animate-spin"})}):e.jsx(oe,{id:(o==null?void 0:o.avatar_id)||1,className:"w-full h-full rounded-full bg-theme-bg"})}),e.jsxs("div",{className:"flex flex-col justify-center",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-[0.2em] text-theme-primary opacity-90",children:"Invited By"}),e.jsxs("h4",{className:"font-black text-lg text-theme-text tracking-tight mt-0.5 flex items-center gap-2 leading-none",children:[k?"Loading...":(o==null?void 0:o.full_name)||t.referred_by,!k&&(o==null?void 0:o.is_pro)&&e.jsx("span",{className:"px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest uppercase animate-pulse",children:"PRO"})]})]})]}),!k&&(o==null?void 0:o.rank)&&e.jsxs("div",{className:"relative z-10 flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 font-black shadow-sm shrink-0",children:[e.jsx(le,{size:12,className:"fill-amber-500"}),e.jsxs("span",{children:["Rank #",o.rank]})]}),e.jsx("div",{className:"text-4xl font-serif text-theme-primary/10 select-none absolute right-4 top-2 font-bold pointer-events-none",children:"✨"})]}),e.jsxs("div",{className:"flex flex-col items-center justify-center py-6 mb-6 bg-gradient-to-b from-theme-bg/40 to-theme-bg/10 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.15)] border-t border-theme-border/10 ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden text-center",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"}),e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.25em] text-theme-primary/80",children:"Your Referral Code"}),e.jsx("h1",{className:"text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-theme-text tracking-tighter drop-shadow-2xl mt-3 mb-4 select-all truncate max-w-full px-4 text-center whitespace-nowrap",children:(t==null?void 0:t.username)||"---"}),e.jsxs("button",{onClick:K,className:"px-6 py-2.5 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:opacity-95 active:scale-98 flex items-center gap-2",children:[e.jsx(ce,{size:12})," Share Referral"]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted",children:"Invite Stats"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{className:"bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-blue-400",children:"Friends Joined"}),e.jsx("div",{className:"text-2xl font-black text-theme-text mt-1",children:!t||t.id==="default_user"?v():t.referral_count||0})]}),e.jsxs("div",{className:"bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 text-left flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-amber-400",children:"Earnings"}),e.jsx("div",{className:"mt-1",children:e.jsx(de,{amount:W(),className:"text-2xl font-black text-amber-500",iconClassName:"w-[0.9em] h-[0.9em]"})})]}),e.jsxs("div",{className:"bg-cyan-500/[0.03] border border-cyan-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-cyan-400",children:"Streak Freeze"}),e.jsxs("div",{className:"text-2xl font-black text-theme-text mt-1",children:["+",v()+R()," Shield"]})]}),e.jsxs("div",{className:"bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-rose-400",children:"Power Surge"}),e.jsxs("div",{className:"text-2xl font-black text-theme-text mt-1",children:["+",v()*3+R()*7," Days"]})]}),e.jsxs("div",{className:"bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 text-left col-span-2 flex items-center justify-between",children:[e.jsxs("div",{className:"flex flex-col",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-emerald-400",children:"Wallet Money"}),e.jsxs("div",{className:"text-2xl font-black text-emerald-500 mt-1",children:["₹",!t||t.id==="default_user"?v()*25:t.premium_discount_earned||0]})]}),e.jsx("span",{className:"text-[9px] text-theme-muted font-bold tracking-wide max-w-[150px] text-right",children:"Applies to premium checkout automatically"})]})]})]})]}),e.jsxs("div",{className:"flex flex-col gap-6 mt-6 md:mt-0",children:[e.jsx(me,{economy:t,refreshEconomy:j,showToast:l,playVictory:$}),e.jsxs("div",{className:"bg-theme-primary/[0.01] dark:bg-theme-primary/[0.02] backdrop-blur-md border border-theme-primary/15 rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted",children:"How Referrals Work"}),e.jsxs("div",{className:"space-y-3.5 text-xs text-left",children:[e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold shrink-0 text-[10px]",children:"1"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-theme-text block",children:"Share & Invite"}),e.jsx("span",{className:"text-theme-muted font-medium text-[11px]",children:"Give your real friends your referral code (i.e username) to sign-up."})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"2"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-theme-text block",children:"Friends Get instant benefits"}),e.jsxs("span",{className:"text-theme-muted font-medium text-[11px]",children:["Referees receive a ",e.jsx("strong",{className:"text-amber-500",children:"variable 100-250 KashCoins"})," + ",e.jsx("strong",{className:"text-cyan-400",children:"1 Streak Freeze"})," + ",e.jsx("strong",{className:"text-rose-400",children:"7-day Power Surge boost"}),"."]})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"3"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-theme-text block",children:"You Get premium rewards"}),e.jsxs("span",{className:"text-theme-muted font-medium text-[11px]",children:["Every referral awards you a ",e.jsx("strong",{className:"text-emerald-400",children:"flat ₹25 premium discount"})," and a ",e.jsx("strong",{className:"text-amber-400",children:"Scratch Card"})," loaded with ",e.jsx("strong",{className:"text-amber-500",children:"variable KashCoins"}),", ",e.jsx("strong",{className:"text-cyan-400",children:"freezes"}),", and ",e.jsx("strong",{className:"text-rose-400",children:"surges"}),"!"]})]})]}),e.jsx("div",{className:"flex items-start gap-2.5 mt-4 pt-3.5 border-t border-theme-border/10 text-[9px] text-red-500 font-extrabold uppercase tracking-widest",children:e.jsx("span",{children:"⚠️ WARNING: using fake invite emails can result in account ban."})})]})]})]})]})]})})]})]})}export{ye as default};

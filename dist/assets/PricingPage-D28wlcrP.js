import{b as U,aO as X,d as Z,ah as ee,u as ae,aP as re,r as g,j as e,b8 as te,k as h,A as se,ar as K,aR as A,ay as ie,aq as ne,bh as oe,bg as le,bi as ce,aS as q,P as de,X as pe,ap as xe,al as fe,aW as me,aY as ue,s as T,bj as be}from"./index-BFwr0PRC.js";import{L as ge,S as he}from"./ScratchCardSection-BokWISN2.js";/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=U("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=U("Infinity",[["path",{d:"M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z",key:"1z0uae"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ye=U("Unlock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]),M="https://eojryhfwtnjyegqhiust.supabase.co/functions/v1/razorpay",we=[{id:"ONE_HOUR",name:"1 Hour",label:"Quick Test",price:2,floorPrice:2,originalPrice:49,priceNote:"₹2 / 1 hour test",icon:K,iconColor:"#ec4899",featured:!1,badge:{text:"Test Pack",color:"#ec4899"},days:.0416},{id:"ONE_WEEK",name:"1 Week",label:"Trial",price:99,floorPrice:9,originalPrice:299,priceNote:"₹99 / week",icon:K,iconColor:"#f43f5e",featured:!1,days:7},{id:"ONE_MONTH",name:"1 Month",label:"Starter",price:249,floorPrice:99,originalPrice:499,priceNote:"₹249 / month",icon:A,iconColor:"#3b82f6",featured:!1},{id:"THREE_MONTHS",name:"3 Months",label:"Super Saver",price:399,floorPrice:249,originalPrice:799,priceNote:"₹133 / month",icon:J,iconColor:"#10b981",featured:!1},{id:"SIX_MONTHS",name:"6 Months",label:"Trending",price:499,floorPrice:349,originalPrice:1199,priceNote:"₹83 / month",icon:ie,iconColor:"#f59e0b",featured:!1,badge:{text:"Trending",color:"#f59e0b"}},{id:"ONE_YEAR",name:"1 Year",label:"Popular",price:599,floorPrice:449,originalPrice:1999,priceNote:"₹50 / month",icon:ne,iconColor:"#6366f1",featured:!1,badge:{text:"Popular",color:"#3b82f6"}},{id:"LIFETIME",name:"Lifetime",label:"Best Value",price:1149,floorPrice:999,originalPrice:4999,priceNote:"₹7 / month equivalent",icon:B,iconColor:"#a855f7",featured:!0,badge:{text:"Best Value",color:"#a855f7"}}],je=[{icon:ye,label:"Unlock all mock tests & PYQs",desc:"Full access to current and upcoming exam papers",color:"#10b981"},{icon:oe,label:"Mint double Kash Coins",desc:"Earn 2X rewards on correct answers to build streaks",color:"#fbbf24"},{icon:le,label:"Master AI Mentor",desc:"Direct, premium hints & question diagnostic support",color:"#c084fc"},{icon:ce,label:"Spaced Repetition (SRS)",desc:"Smart card sets focusing on your weakest areas",color:"#3b82f6"},{icon:J,label:"Advanced Analytics",desc:"Track speed index, correct ratios, and accuracy trends",color:"#22d3ee"},{icon:q,label:"Ad-Free Interface",desc:"Fully distraction-free study environment",color:"#f87171"}];function Ne(){const y=X(),{user:w}=Z(),{economy:r,refreshEconomy:N}=ee(),{showToast:c}=ae(),{playVictory:Y}=re(),P=()=>{try{const t=`mcqkash_scratch_history_${(r==null?void 0:r.username)||"default"}`;let i=JSON.parse(localStorage.getItem(t)||"[]");if(r&&r.id&&r.id!=="default_user"){let d=!1;const s=i.some(f=>f.type==="Welcome Card"),n=localStorage.getItem("mcqkash_welcome_coins_pending");r.referred_by&&!s&&!n&&(i.push({id:"welcome_restored",type:"Welcome Card",coins:150,wallet:0,date:"Welcome"}),d=!0);const p=i.filter(f=>f.type==="Referral Card").length,x=Number(r.scratched_cards_count||0);if(p<x){const f=x-p;for(let b=0;b<f;b++)i.push({id:`ref_restored_${Date.now()}_${b}`,type:"Referral Card",coins:150,wallet:25,date:"Referred"});d=!0}d&&localStorage.setItem(t,JSON.stringify(i))}return i}catch{return[]}},D=()=>{const a=P();return a.length>0?a.reduce((t,i)=>t+(i.coins||0),0):0},_=()=>P().filter(t=>t.type==="Referral Card").length,L=()=>P().filter(t=>t.type==="Welcome Card").length,[$,u]=g.useState(null),[j,R]=g.useState(!1),[o,I]=g.useState(null),[S,C]=g.useState(!1);g.useEffect(()=>{j&&(r!=null&&r.referred_by)&&(async()=>{C(!0);try{const{data:t,error:i}=await T.rpc("get_public_profile_by_username",{target_username:r.referred_by});if(!i&&t){I(t),C(!1);return}}catch{console.warn("RPC failed, falling back to local storage cache")}try{const i=localStorage.getItem("mcqkash_lb_cache_coins");if(i){const{data:d}=JSON.parse(i),s=d.find(n=>{var p,x;return((p=n.username)==null?void 0:p.toLowerCase())===r.referred_by.toLowerCase()||((x=n.full_name)==null?void 0:x.toLowerCase())===r.referred_by.toLowerCase()});if(s){I({avatar_id:s.avatar_id||1,rank:s.rank||null,full_name:s.full_name||r.referred_by,is_pro:!!(s.pro_expires_at||s.pro_expiration)&&new Date(s.pro_expires_at||s.pro_expiration)>new Date||!!s.is_pro}),C(!1);return}}}catch{console.warn("Leaderboard cache search failed")}I({avatar_id:1,rank:null,full_name:r.referred_by,is_pro:!1}),C(!1)})()},[j,r==null?void 0:r.referred_by]),g.useEffect(()=>(j?(document.body.style.overflow="hidden",N&&N(!0)):document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[j]);const v=(r==null?void 0:r.premium_discount_earned)||0,G=async()=>{const a=window.location.origin+(window.location.pathname.startsWith("/mcq")?"/mcq":"")+"/signin?ref="+encodeURIComponent((r==null?void 0:r.username)||""),t=`📚 Preparing for Competitive Exams?
I'm using MCQkash for topic-wise MCQs, PYQ's, Smart Revision, and exam-focused Mock Test with AI Analysis.
Join to compete with me on Leaderboard and USE my referral code "${r==null?void 0:r.username}" when signing up and we'll both earn Jackpot KashCoins + Exclusive FREE Rewards 🎁
🚀 Click here to register directly --> ${a}`;if(navigator.share)try{await navigator.share({title:"MCQ Kash",text:t,url:a}),c("Referral shared successfully! 🚀","success")}catch(i){i.name!=="AbortError"&&(console.error("Web Share failed:",i),F(t))}else F(t)},F=a=>{navigator.clipboard.writeText(a),c("Share text copied to clipboard! 📋","success")},Q=()=>new Promise(a=>{if(window.Razorpay)return a(!0);const t=document.createElement("script");t.src="https://checkout.razorpay.com/v1/checkout.js",t.onload=()=>a(!0),t.onerror=()=>a(!1),document.body.appendChild(t)}),V=async a=>{if(!w){c("Sign In to upgrade your account!","warning"),y("/signin");return}if((r==null?void 0:r.user_tier)==="Pro"&&(r==null?void 0:r.pro_tier)===a.id){c("You are already on this plan!","info");return}u(a.id);try{if(!await Q()){c("Failed to load Razorpay.","error"),u(null);return}const{data:{session:i}}=await T.auth.getSession();if(!(i!=null&&i.access_token)){c("Session expired. Sign in again.","warning"),y("/profile"),u(null);return}const d=i.access_token;let s,n,p,x;const f=await fetch(`${M}/create-order`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({planId:a.id})});if(f.ok){const l=await f.json();s=l.orderId,n=l.amount,p=l.currency,x=l.keyId}else{const l=await fetch(`${M}/create-order`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({planId:"ONE_WEEK"})});if(!l.ok){const k=await f.json().catch(()=>({}));throw new Error(k.error||"Order creation failed")}const m=await l.json();s=m.orderId,n=a.price*100,p=m.currency,x=m.keyId}const b={key:x,amount:a.id==="ONE_HOUR"?200:n,currency:p||"INR",name:"MCQ Kash",description:`${a.name} Pro Upgrade`,prefill:{email:w.email},theme:{color:a.featured?"#a855f7":"#f59e0b"},modal:{ondismiss:()=>{u(null),c("Cancelled.","info")}},handler:async l=>{try{let m=!1;const k=await fetch(`${M}/verify-payment`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({razorpay_order_id:l.razorpay_order_id||"test_order_1hr",razorpay_payment_id:l.razorpay_payment_id,razorpay_signature:l.razorpay_signature||"test_sig",planId:a.id})});if(k.ok){const{success:z}=await k.json();m=z}else{const z=await k.json().catch(()=>({}));if(console.warn("Backend verify-payment non-200, attempting client fallback profile sync...",z),l.razorpay_payment_id){const O=new Date;O.setDate(O.getDate()+(a.days||30));const E=O.toISOString();localStorage.setItem(`mcqkash_pro_override_${w.id}`,JSON.stringify({is_pro:!0,pro_tier:a.id,pro_expiration:E,pro_expires_at:E}));const{error:H}=await T.from("profiles").update({is_pro:!0,pro_tier:a.id,pro_expiration:E,pro_expires_at:E}).eq("id",w.id);H&&console.warn("Client DB update notice (handled by local override):",H.message),m=!0}else throw new Error(z.error||"Payment verification failed.")}m&&(be({particleCount:180,spread:100,origin:{y:.5},colors:["#fbbf24","#a855f7","#6366f1","#10b981","#f43f5e"]}),c("Welcome to Pro! ★","success"),await N(),setTimeout(()=>y("/profile"),1600))}catch(m){c(m.message||"Verification failed.","error")}finally{u(null)}}};a.id!=="ONE_HOUR"&&s&&(b.order_id=s),new window.Razorpay(b).open()}catch(t){c(t.message||"Checkout failed.","error"),u(null)}},W=(r==null?void 0:r.user_tier)==="Pro";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"pricing-root",children:[e.jsxs("nav",{className:"pricing-nav",children:[e.jsxs("button",{className:"nav-back",onClick:()=>y(-1),children:[e.jsx(te,{size:12,strokeWidth:2.5})," Back"]}),e.jsxs("div",{className:"nav-badge",children:[e.jsx("div",{className:"nav-dot"}),"Premium Portal"]})]}),e.jsxs("section",{className:"pricing-hero",children:[e.jsxs("div",{className:"hero-eyebrow",children:[e.jsx(h,{size:11})," Upgrade Plan"]}),e.jsxs("h1",{className:"hero-title",children:["Unlock ",e.jsx("span",{children:"MCQ Kash Pro"})]}),e.jsxs("div",{className:"hero-sub",children:[e.jsx("span",{className:"sub-gopro",children:"Go Pro."}),e.jsx("span",{className:"sub-gounlimited",children:"Go Unlimited."}),e.jsx("span",{className:"sub-gounstoppable",children:"Go Unstoppable."})]}),!w&&e.jsxs("div",{className:"guest-warn",onClick:()=>y("/signin"),children:[e.jsx(se,{size:14}),e.jsxs("span",{children:["You're offline. ",e.jsx("u",{children:"Sign In"})," to activate your plan."]})]})]}),!W&&v===0&&e.jsx("div",{className:"max-w-[980px] mx-auto px-6 mb-6",children:e.jsxs("div",{className:"bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-slate-900/60 border border-cyan-500/30 hover:border-cyan-500/50 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative overflow-hidden transition-all duration-300 text-left",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 pointer-events-none"}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("h4",{className:"text-lg font-black text-white tracking-tight flex items-center gap-2",children:[e.jsx(h,{size:18,className:"text-cyan-400 animate-pulse shrink-0"}),"Earn your Pro"]}),e.jsxs("p",{className:"text-xs text-slate-300 font-medium leading-relaxed max-w-[500px]",children:[e.jsx("strong",{className:"text-cyan-400 font-extrabold",children:"Every friend"})," you bring makes your ",e.jsx("strong",{className:"text-amber-400 font-extrabold",children:"Pro affordable"})," by ",e.jsx("strong",{className:"text-emerald-400 font-extrabold",children:"₹25 per invite"}),"."]})]}),e.jsxs("button",{onClick:()=>R(!0),className:"w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_14px_rgba(6,182,212,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 flex items-center justify-center gap-1.5",children:[e.jsx(h,{size:12})," Earn Rewards"]})]})}),e.jsx("div",{className:"plans-strip",children:we.map(a=>{const t=W&&(r==null?void 0:r.pro_tier)===a.id,i=$===a.id,d=a.icon,s=Math.max(a.floorPrice,a.price-v);let n=a.priceNote;return v>0&&(a.id==="ONE_HOUR"?n=`₹${s} / 1 hour`:a.id==="ONE_WEEK"?n=`₹${s} / week`:a.id==="ONE_MONTH"?n=`₹${s} / month`:a.id==="THREE_MONTHS"?n=`₹${Math.round(s/3)} / month`:a.id==="SIX_MONTHS"?n=`₹${Math.round(s/6)} / month`:a.id==="ONE_YEAR"?n=`₹${Math.round(s/12)} / month`:a.id==="LIFETIME"&&(n=`₹${Math.round(s/144)} / month equivalent`)),e.jsxs("div",{className:`plan-card${a.featured?" featured":""}`,children:[a.featured&&e.jsx("div",{className:"featured-glow"}),a.badge&&e.jsxs("div",{className:`plan-badge ${a.id==="LIFETIME"?"badge-purple":a.id==="ONE_YEAR"?"badge-blue":"badge-amber"}`,children:[e.jsx(h,{size:8,fill:"currentColor"}),a.badge.text]}),e.jsxs("div",{className:"card-header-row",children:[e.jsxs("div",{className:"plan-meta",children:[e.jsx("div",{className:"plan-label",children:a.label}),e.jsx("div",{className:"plan-name",children:a.name})]}),e.jsx("div",{className:"card-icon-wrap",children:e.jsx(d,{size:16,style:{color:a.iconColor}})})]}),e.jsx("div",{className:"plan-divider"}),e.jsxs("div",{className:"price-section",children:[e.jsxs("div",{className:"price-row",children:[e.jsx("span",{className:"price-currency",children:"₹"}),e.jsx("span",{className:"price-amount",children:s}),v>0&&s<a.price?e.jsxs("span",{className:"price-strike",children:["₹",a.price]}):e.jsxs("span",{className:"price-strike",children:["₹",a.originalPrice]})]}),e.jsx("div",{className:"price-note",children:n}),v>0&&s<a.price&&e.jsxs("div",{className:"text-[10px] font-bold text-emerald-500 mt-1",children:["Referral Discount Applied: -₹",a.price-s]})]}),e.jsx("button",{className:`upgrade-btn ${a.featured?"btn-featured":"btn-default"}`,onClick:()=>V(a),disabled:i||t||$!==null,children:i?e.jsx("div",{className:"btn-spin"}):t?"Active ✓":e.jsxs(e.Fragment,{children:[e.jsx(A,{size:10,fill:"currentColor"}),"Upgrade"]})})]},a.id)})}),e.jsx("div",{className:"features-panel",children:e.jsxs("div",{className:"features-box",children:[e.jsxs("div",{className:"features-header",children:[e.jsx(h,{size:14,style:{color:"#f59e0b"}}),e.jsx("span",{className:"features-header-title",children:"Everything included in Pro"}),e.jsx("span",{className:"features-header-sub",children:"Full access benefits"})]}),e.jsx("div",{className:"features-grid",children:je.map((a,t)=>e.jsxs("div",{className:"feature-item",children:[e.jsx("div",{className:"feature-icon-wrap",style:{background:a.color+"12"},children:e.jsx(a.icon,{size:14,style:{color:a.color}})}),e.jsxs("div",{className:"feature-text-block",children:[e.jsx("span",{className:"feature-label",children:a.label}),e.jsx("span",{className:"feature-desc",children:a.desc})]})]},t))})]})}),e.jsxs("div",{className:"trust-footer",children:[e.jsxs("div",{className:"trust-item",children:[e.jsx(q,{size:12,style:{color:"#f59e0b"}}),e.jsx("span",{className:"trust-label",children:"Razorpay secured · 128-bit SSL"})]}),e.jsxs("div",{className:"trust-item",children:[e.jsx(A,{size:12,style:{color:"#a78bfa"}}),e.jsx("span",{className:"trust-label",children:"Instant activation after payment"})]}),e.jsxs("div",{className:"trust-item",children:[e.jsx(B,{size:12,style:{color:"#34d399"}}),e.jsx("span",{className:"trust-label",children:"One-time billing · No auto-renew"})]})]}),j&&e.jsx("div",{className:"fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden custom-scrollbar flex items-start sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-theme-bg/90",onClick:a=>{a.target===a.currentTarget&&R(!1)},children:e.jsxs(de.div,{initial:{opacity:0,scale:.9,y:30},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.9,y:30},className:"w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:max-w-md md:max-w-4xl flex flex-col bg-theme-surface border-0 ring-1 ring-theme-border/20 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative sm:overflow-hidden",onClick:a=>a.stopPropagation(),children:[e.jsxs("div",{className:"shrink-0 p-6 bg-gradient-to-b from-cyan-500/10 to-transparent flex items-start justify-between relative",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-50"}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-2xl font-black flex items-center gap-2 text-white italic tracking-tighter",children:[e.jsx(h,{className:"text-cyan-400 fill-cyan-400 animate-pulse",size:24}),"Reward Center"]}),e.jsx("p",{className:"text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 opacity-80",children:"Referral & Milestone Rewards Protocol"})]}),e.jsx("button",{onClick:()=>R(!1),className:"p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all",children:e.jsx(pe,{size:18,className:"text-slate-300"})})]}),e.jsxs("div",{className:"flex-1 sm:overflow-y-auto sm:custom-scrollbar p-6 sm:p-8 pt-0 flex flex-col md:grid md:grid-cols-2 md:gap-10",children:[e.jsxs("div",{className:"flex flex-col",children:[(r==null?void 0:r.referred_by)&&e.jsxs("div",{className:"mb-6 bg-gradient-to-r from-theme-primary/5 via-theme-accent/[0.03] to-transparent border border-theme-primary/20 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-card hover:shadow-card-hover hover:border-theme-primary/35 hover:scale-[1.01] transition-all duration-350 ease-out group/inviter",children:[e.jsx("div",{className:"absolute inset-0 bg-grid-white/[0.01] pointer-events-none"}),e.jsxs("div",{className:"flex items-center gap-4 relative z-10",children:[e.jsx("div",{className:"w-12 h-12 rounded-full ring-2 ring-theme-primary/30 group-hover/inviter:ring-theme-primary/50 p-[2px] bg-theme-surface shrink-0 transition-all duration-300",children:S?e.jsx("div",{className:"w-full h-full rounded-full bg-theme-bg/50 animate-pulse flex items-center justify-center",children:e.jsx(ge,{size:16,className:"text-theme-primary animate-spin"})}):e.jsx(xe,{id:(o==null?void 0:o.avatar_id)||1,className:"w-full h-full rounded-full bg-theme-bg"})}),e.jsxs("div",{className:"flex flex-col justify-center",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 opacity-90",children:"Invited By"}),e.jsxs("h4",{className:"font-black text-lg text-white tracking-tight mt-0.5 flex items-center gap-2 leading-none",children:[S?"Loading...":(o==null?void 0:o.full_name)||r.referred_by,!S&&(o==null?void 0:o.is_pro)&&e.jsx("span",{className:"px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest uppercase animate-pulse",children:"PRO"})]})]})]}),!S&&(o==null?void 0:o.rank)&&e.jsxs("div",{className:"relative z-10 flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 font-black shadow-sm shrink-0",children:[e.jsx(fe,{size:12,className:"fill-amber-500"}),e.jsxs("span",{children:["Rank #",o.rank]})]}),e.jsx("div",{className:"text-4xl font-serif text-cyan-500/10 select-none absolute right-4 top-2 font-bold pointer-events-none",children:"✨"})]}),e.jsxs("div",{className:"flex flex-col items-center justify-center py-6 mb-6 bg-slate-900/60 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-slate-800 relative overflow-hidden text-center",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"}),e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400",children:"Your Referral Code"}),e.jsx("h1",{className:"text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tighter drop-shadow-2xl mt-3 mb-4 select-all truncate max-w-full px-4 text-center whitespace-nowrap",children:(r==null?void 0:r.username)||"---"}),e.jsxs("button",{onClick:G,className:"px-6 py-2.5 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:opacity-95 active:scale-98 flex items-center gap-2",children:[e.jsx(me,{size:12})," Share Referral"]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.2em] text-slate-400",children:"Invite Stats"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{className:"bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-blue-400",children:"Friends Joined"}),e.jsx("div",{className:"text-2xl font-black text-white mt-1",children:!r||r.id==="default_user"?_():r.referral_count||0})]}),e.jsxs("div",{className:"bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 text-left flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-amber-400",children:"Earnings"}),e.jsx("div",{className:"mt-1",children:e.jsx(ue,{amount:D(),className:"text-2xl font-black text-amber-500",iconClassName:"w-[0.9em] h-[0.9em]"})})]}),e.jsxs("div",{className:"bg-cyan-500/[0.03] border border-cyan-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-cyan-400",children:"Streak Freeze"}),e.jsxs("div",{className:"text-2xl font-black text-white mt-1",children:["+",_()+L()," Shield"]})]}),e.jsxs("div",{className:"bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-rose-400",children:"Power Surge"}),e.jsxs("div",{className:"text-2xl font-black text-white mt-1",children:["+",_()*3+L()*7," Days"]})]}),e.jsxs("div",{className:"bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 text-left col-span-2 flex items-center justify-between",children:[e.jsxs("div",{className:"flex flex-col",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-emerald-400",children:"Wallet Money"}),e.jsxs("div",{className:"text-2xl font-black text-emerald-500 mt-1",children:["₹",!r||r.id==="default_user"?_()*25:r.premium_discount_earned||0]})]}),e.jsx("span",{className:"text-[9px] text-slate-400 font-bold tracking-wide max-w-[150px] text-right",children:"Applies to premium checkout automatically"})]})]})]})]}),e.jsxs("div",{className:"flex flex-col gap-6 mt-6 md:mt-0",children:[e.jsx(he,{economy:r,refreshEconomy:N,showToast:c,playVictory:Y}),e.jsxs("div",{className:"bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.2em] text-slate-400",children:"How Referrals Work"}),e.jsxs("div",{className:"space-y-3.5 text-xs text-left",children:[e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"1"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"Share & Invite"}),e.jsx("span",{className:"text-slate-300 font-medium text-[11px]",children:"Give your real friends your referral code (i.e username) to sign-up."})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"2"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"Friends Get instant benefits"}),e.jsxs("span",{className:"text-slate-300 font-medium text-[11px]",children:["Referees receive a ",e.jsx("strong",{className:"text-amber-500",children:"variable 100-250 KashCoins"})," + ",e.jsx("strong",{className:"text-cyan-400",children:"1 Streak Freeze"})," + ",e.jsx("strong",{className:"text-rose-400",children:"7-day Power Surge boost"}),"."]})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"3"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"You Get premium rewards"}),e.jsxs("span",{className:"text-slate-300 font-medium text-[11px]",children:["Every referral awards you a ",e.jsx("strong",{className:"text-emerald-400",children:"flat ₹25 premium discount"})," and a ",e.jsx("strong",{className:"text-amber-400",children:"Scratch Card"})," loaded with ",e.jsx("strong",{className:"text-amber-500",children:"variable KashCoins"}),", ",e.jsx("strong",{className:"text-cyan-400",children:"freezes"}),", and ",e.jsx("strong",{className:"text-rose-400",children:"surges"}),"!"]})]})]}),e.jsx("div",{className:"flex items-start gap-2.5 mt-4 pt-3.5 border-t border-theme-border/10 text-[9px] text-red-500 font-extrabold uppercase tracking-widest",children:e.jsx("span",{children:"⚠️ WARNING: using fake invite emails can result in account ban."})})]})]})]})]})]})})]})]})}export{Ne as default};

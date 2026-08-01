import{b as re,aR as _e,d as Se,ah as Ce,u as Ee,aS as Ie,r as f,j as e,bc as Pe,k as v,A as ze,aT as ee,ar as Re,aU as B,aB as Te,aq as Oe,bl as ue,q as Me,a$ as pe,aZ as xe,l as Ae,bk as Fe,bm as De,aV as ae,P as te,X as Le,ap as qe,al as Ue,b0 as $e,O as We,s as z,bn as He}from"./index-CH3CcJb7.js";import{S as Be}from"./ScratchCardSection-D40eNjFj.js";/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=re("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=re("Infinity",[["path",{d:"M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z",key:"1z0uae"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=re("Unlock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]),me="https://eojryhfwtnjyegqhiust.supabase.co/functions/v1/razorpay",Ye=(h,c)=>{if(!c||c<=0)return h;const a=h*(1-c/100);return a<=9?9:Math.floor(a/10)*10+9},fe=(h,c,a)=>{const C=h.originalPrice||h.price,i=c?Number(c.discount_percent):0,y=Ye(C,i),E=typeof h.floorPrice=="number"?h.floorPrice:9;if(i>75)return{baseMrp:C,couponDiscountPercent:i,couponPrice:y,effectiveWalletDiscount:0,finalPrice:y,isHeavyCoupon:!0};const K=a>0?a:0,S=Math.max(E,y-K),D=Math.max(0,y-S);return{baseMrp:C,couponDiscountPercent:i,couponPrice:y,effectiveWalletDiscount:D,finalPrice:S,isHeavyCoupon:!1}},Je=[{id:"ONE_WEEK",name:"1 Week",label:"Trial",price:49,floorPrice:19,originalPrice:149,priceNote:"₹49 / week",icon:Re,iconColor:"#f43f5e",featured:!1,days:7},{id:"ONE_MONTH",name:"1 Month",label:"Starter",price:249,floorPrice:99,originalPrice:499,priceNote:"₹249 / month",icon:B,iconColor:"#3b82f6",featured:!1,days:30},{id:"THREE_MONTHS",name:"3 Months",label:"Super Saver",price:399,floorPrice:199,originalPrice:1199,priceNote:"₹133 / month",icon:be,iconColor:"#10b981",featured:!1,days:90},{id:"SIX_MONTHS",name:"6 Months",label:"Trending",price:499,floorPrice:299,originalPrice:1669,priceNote:"₹83 / month",icon:Te,iconColor:"#f59e0b",featured:!1,days:180,badge:{text:"Trending",color:"#f59e0b"}},{id:"ONE_YEAR",name:"1 Year",label:"Popular",price:599,floorPrice:399,originalPrice:1999,priceNote:"₹50 / month",icon:Oe,iconColor:"#6366f1",featured:!1,days:365,badge:{text:"Popular",color:"#3b82f6"}},{id:"LIFETIME",name:"Lifetime (10 Yrs)",label:"Best Value",price:1149,floorPrice:699,originalPrice:3499,priceNote:"₹4 / month equivalent",icon:he,iconColor:"#a855f7",featured:!0,days:3650,badge:{text:"Best Value",color:"#a855f7"}}],Ve=[{icon:Ke,label:"Unlock all mock tests & PYQs",desc:"Full access to current and upcoming exam papers",color:"#10b981"},{icon:ue,label:"Mint double Kash Coins",desc:"Earn 2X rewards on correct answers to build streaks",color:"#fbbf24"},{icon:Fe,label:"Master AI Mentor",desc:"Direct, premium hints & question diagnostic support",color:"#c084fc"},{icon:De,label:"Spaced Repetition (SRS)",desc:"Smart card sets focusing on your weakest areas",color:"#3b82f6"},{icon:be,label:"Advanced Analytics",desc:"Track speed index, correct ratios, and accuracy trends",color:"#22d3ee"},{icon:ae,label:"Ad-Free Interface",desc:"Fully distraction-free study environment",color:"#f87171"}];function et(){const h=_e(),{user:c}=Se(),{economy:a,refreshEconomy:C}=Ce(),{showToast:i}=Ee(),{playVictory:y}=Ie(),E=f.useMemo(()=>{try{const r=`mcqkash_scratch_history_${(a==null?void 0:a.username)||"default"}`;let s=JSON.parse(localStorage.getItem(r)||"[]");if(a&&a.id&&a.id!=="default_user"){let p=!1;const n=s.some(l=>l.type==="Welcome Card"),d=localStorage.getItem("mcqkash_welcome_coins_pending");a.referred_by&&!n&&!d&&(s.push({id:"welcome_restored",type:"Welcome Card",coins:150,wallet:0,date:"Welcome"}),p=!0);const x=s.filter(l=>l.type==="Referral Card").length,m=Number(a.scratched_cards_count||0);if(x<m){const l=m-x;for(let j=0;j<l;j++)s.push({id:`ref_restored_${Date.now()}_${j}`,type:"Referral Card",coins:150,wallet:25,date:"Referred"});p=!0}p&&localStorage.setItem(r,JSON.stringify(s))}return s}catch{return[]}},[a==null?void 0:a.username,a==null?void 0:a.id,a==null?void 0:a.referred_by,a==null?void 0:a.scratched_cards_count]),K=()=>E.length>0?E.reduce((t,r)=>t+(r.coins||0),0):0,S=()=>E.filter(t=>t.type==="Referral Card").length,D=()=>E.filter(t=>t.type==="Welcome Card").length,[Y,N]=f.useState(null),[R,J]=f.useState(!1),[ge,Ge]=f.useState(!1),[g,V]=f.useState(null),[L,q]=f.useState(!1),[U,T]=f.useState(""),[o,I]=f.useState(null),[se,$]=f.useState(!1),[O,G]=f.useState(null),[X,M]=f.useState(null);f.useEffect(()=>{try{const t=localStorage.getItem("mcqkash_applied_coupon");if(t){const r=JSON.parse(t);r!=null&&r.expires_at&&Date.now()>r.expires_at?(localStorage.removeItem("mcqkash_applied_coupon"),M({code:r.code,discount_percent:r.discount_percent}),i(`Sorry, your offer period for '${r.code}' has expired.`,"warning")):(I(r),r!=null&&r.code&&T(r.code))}}catch(t){console.warn("Failed to load saved coupon state:",t)}},[]),f.useEffect(()=>{if(!(o!=null&&o.expires_at)){G(null);return}const t=()=>{const s=o.expires_at-Date.now();if(s<=0){M({code:o.code,discount_percent:o.discount_percent}),I(null),T(""),localStorage.removeItem("mcqkash_applied_coupon"),G(null),i(`Sorry, your offer for '${o.code}' has expired!`,"warning");return}const p=Math.floor(s/(1e3*60*60*24)),n=Math.floor(s/(1e3*60*60)%24),d=Math.floor(s/(1e3*60)%60),x=Math.floor(s/1e3%60);G({days:p,hours:n,minutes:d,seconds:x})};t();const r=setInterval(t,1e3);return()=>clearInterval(r)},[o]);const Q=async t=>{const r=(t||"").trim().toUpperCase();if(!r){i("Please enter a coupon code.","warning");return}if($(!0),T(r),r==="KASH45"||r==="KASH35"||r==="WELCOME35"){const s={code:"KASH45",discount_percent:45,valid_days:9999,expires_at:null};I(s),M(null),localStorage.setItem("mcqkash_applied_coupon",JSON.stringify(s)),i("🎉 In-App 45% OFF Coupon Applied Successfully!","success"),y&&y(),$(!1);return}try{const{data:s,error:p}=await z.from("coupons").select("*").eq("code",r).eq("is_active",!0).maybeSingle();if(!p&&s){const n=Number(s.valid_days||15),d=`mcqkash_coupon_expiry_${s.code}`,x=localStorage.getItem(d);let m=null;if(x){const j=Number(x);if(Date.now()>j){I(null),M({code:s.code,discount_percent:Number(s.discount_percent)}),i(`Sorry, your ${n}-day offer for '${s.code}' has expired on this device.`,"error"),$(!1);return}m=j}else m=n<900?Date.now()+n*24*60*60*1e3:null,m&&localStorage.setItem(d,String(m));const l={code:s.code,discount_percent:Number(s.discount_percent),valid_days:n,expires_at:m};I(l),M(null),localStorage.setItem("mcqkash_applied_coupon",JSON.stringify(l)),i(`🎉 ${s.discount_percent}% OFF Coupon '${s.code}' Applied!`,"success"),y&&y()}else i("Invalid or expired coupon code. Join Telegram for today's active code!","error")}catch{i("Failed to validate coupon. Please try again.","error")}finally{$(!1)}},ye=()=>{I(null),T(""),localStorage.removeItem("mcqkash_applied_coupon"),i("Coupon removed.","info")};f.useEffect(()=>{R&&(a!=null&&a.referred_by)&&(async()=>{q(!0);try{const{data:r,error:s}=await z.rpc("get_public_profile_by_username",{target_username:a.referred_by});if(!s&&r){V(r),q(!1);return}}catch{console.warn("RPC failed, falling back to local storage cache")}try{const s=localStorage.getItem("mcqkash_lb_cache_coins");if(s){const{data:p}=JSON.parse(s),n=p.find(d=>{var x,m;return((x=d.username)==null?void 0:x.toLowerCase())===a.referred_by.toLowerCase()||((m=d.full_name)==null?void 0:m.toLowerCase())===a.referred_by.toLowerCase()});if(n){V({avatar_id:n.avatar_id||1,rank:n.rank||null,full_name:n.full_name||a.referred_by,is_pro:!!(n.pro_expires_at||n.pro_expiration)&&new Date(n.pro_expires_at||n.pro_expiration)>new Date||!!n.is_pro}),q(!1);return}}}catch{console.warn("Leaderboard cache search failed")}V({avatar_id:1,rank:null,full_name:a.referred_by,is_pro:!1}),q(!1)})()},[R,a==null?void 0:a.referred_by]),f.useEffect(()=>(R?document.body.style.overflow="hidden":document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[R]),f.useEffect(()=>{oe()},[]);const ne=(a==null?void 0:a.premium_discount_earned)||0,je=async()=>{const t=window.location.origin+(window.location.pathname.startsWith("/mcq")?"/mcq":"")+"/signin?ref="+encodeURIComponent((a==null?void 0:a.username)||""),r=`📚 Preparing for Competitive Exams?
I'm using MCQkash for topic-wise MCQs, PYQs, Smart Revision, and exam-focused Mock Test with Expert Analysis.

Join me on Leaderboard and USE my referral code "${a==null?void 0:a.username}" when signing up and we'll both earn Jackpot Money + Exclusive FREE Rewards 🎁

Join me here --> ${t}`;if(navigator.share)try{await navigator.share({title:"MCQ Kash",text:r,url:t}),i("Referral shared successfully! 🚀","success")}catch(s){s.name!=="AbortError"&&(console.error("Web Share failed:",s),ie(r))}else ie(r)},ie=t=>{navigator.clipboard.writeText(t),i("Share text copied to clipboard! 📋","success")},oe=()=>new Promise(t=>{if(window.Razorpay)return t(!0);const r=document.createElement("script");r.src="https://checkout.razorpay.com/v1/checkout.js",r.onload=()=>t(!0),r.onerror=()=>t(!1),document.body.appendChild(r)}),we=async t=>{if(!c){i("Sign In to upgrade your account!","warning"),h("/signin");return}if((a==null?void 0:a.user_tier)==="Pro"&&(a==null?void 0:a.pro_tier)===t.id){i("You are already on this plan!","info");return}N(t.id);const r=setTimeout(()=>{N(s=>s===t.id?null:s)},8e3);try{if(!await oe()){clearTimeout(r),i("Failed to load Razorpay.","error"),N(null);return}const{data:{session:p}}=await z.auth.getSession();if(!(p!=null&&p.access_token)){clearTimeout(r),i("Session expired. Sign in again.","warning"),h("/profile"),N(null);return}const n=p.access_token,d=Number((a==null?void 0:a.premium_discount_earned)??S()*25);try{await z.from("profiles").update({premium_discount_earned:d}).eq("id",c.id)}catch(u){console.warn("Pre-checkout discount sync notice:",u)}let x=null,m=null,l="INR",j="rzp_live_SxuAK5B53kL3qS";const{baseMrp:k,couponDiscountPercent:ve,couponPrice:Xe,effectiveWalletDiscount:Ne,finalPrice:ke}=fe(t,o,d),ce=ke*100;try{const u=await fetch(`${me}/create-order`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({planId:t.id,discount:Ne,couponCode:o==null?void 0:o.code,couponDiscount:ve})});if(u.ok){const b=await u.json();b.orderId&&(x=b.orderId),b.amount&&(m=Number(b.amount)),l=b.currency||"INR",b.keyId&&(j=b.keyId)}else console.warn("Remote Edge Function create-order returned non-200, using client amount calculation...")}catch(u){console.warn("Remote Edge Function create-order network error, using client amount calculation...",u)}const de={key:j,amount:ce,currency:l||"INR",name:"MCQ Kash",description:`${t.name} Pro Upgrade`,prefill:{email:c.email},theme:{color:t.featured?"#a855f7":"#f59e0b"},modal:{ondismiss:()=>{clearTimeout(r),N(null),i("Cancelled.","info")}},handler:async u=>{clearTimeout(r);try{let b=!1,_=null,A=null;try{_=await fetch(`${me}/verify-payment`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({razorpay_order_id:u.razorpay_order_id||x||"test_order_1day",razorpay_payment_id:u.razorpay_payment_id,razorpay_signature:u.razorpay_signature||"test_sig",planId:t.id})})}catch(w){A=w,console.warn("Network fetch to verify-payment failed:",w.message)}if(_&&_.ok){const{success:w}=await _.json();b=w}else{const w=_?await _.json().catch(()=>({})):{};if(console.warn("Backend verify-payment non-200 or network error, attempting client fallback profile sync...",w,A),u.razorpay_payment_id){const F=new Date,W=t.days||(t.id==="ONE_DAY"||t.id==="ONE_HOUR"?1:30);F.setTime(F.getTime()+Math.round(W*24*60*60*1e3));const P=F.toISOString();localStorage.setItem(`mcqkash_pro_override_${c.id}`,JSON.stringify({is_pro:!0,pro_tier:t.id,pro_expiration:P,pro_expires_at:P}));const Z=t.id==="ONE_DAY"||t.id==="ONE_HOUR"?"ONE_DAY":t.id,{error:H}=await z.from("profiles").update({is_pro:!0,pro_tier:Z,pro_expiration:P,pro_expires_at:P}).eq("id",c.id);H&&console.warn("Client DB update notice (handled by local override):",H.message),b=!0}else throw new Error(w.error||(A==null?void 0:A.message)||"Payment verification failed.")}if(b){if(d>0&&(c!=null&&c.id)){const P=Math.min(d,Math.max(0,t.price-(typeof t.floorPrice=="number"?t.floorPrice:9))),Z=Math.max(0,d-P);try{await z.from("profiles").update({premium_discount_earned:Z}).eq("id",c.id)}catch(H){console.warn("Wallet balance deduction notice on Pro upgrade:",H)}}const w=new Date,F=t.days||30;w.setTime(w.getTime()+Math.round(F*24*60*60*1e3));const W=w.toISOString();localStorage.setItem(`mcqkash_pro_override_${c.id}`,JSON.stringify({is_pro:!0,pro_tier:t.id,pro_expiration:W,pro_expires_at:W})),localStorage.removeItem(`mcqkash_profile_cache_${c.id}`),localStorage.removeItem(`mcqkash_ranks_cache_${c.id}`),localStorage.removeItem("mcqkash_lb_cache_coins"),localStorage.removeItem("mcqkash_lb_cache_streaks"),He({particleCount:180,spread:100,origin:{y:.5},colors:["#fbbf24","#a855f7","#6366f1","#10b981","#f43f5e"]}),i("Welcome to Pro! ★","success"),await C(!0),window.dispatchEvent(new Event("sync-profile-stats")),setTimeout(()=>h("/profile"),1200)}}catch(b){i(b.message||"Verification failed.","error")}finally{N(null)}}};x&&m===ce&&(de.order_id=x);try{const u=new window.Razorpay(de);u.on("payment.failed",function(b){var _;clearTimeout(r),N(null),i(((_=b.error)==null?void 0:_.description)||"Payment failed.","error")}),u.open()}catch{clearTimeout(r),N(null),i("Could not open Razorpay checkout popup. Please try again.","error")}}catch(s){clearTimeout(r),i(s.message||"Checkout failed.","error"),N(null)}},le=(a==null?void 0:a.user_tier)==="Pro";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"pricing-root",children:[e.jsxs("nav",{className:"pricing-nav",children:[e.jsxs("button",{className:"nav-back",onClick:()=>h(-1),children:[e.jsx(Pe,{size:12,strokeWidth:2.5})," Back"]}),e.jsxs("div",{className:"nav-badge",children:[e.jsx("div",{className:"nav-dot"}),"Premium Portal"]})]}),e.jsxs("section",{className:"pricing-hero",children:[e.jsxs("div",{className:"hero-eyebrow",children:[e.jsx(v,{size:11})," Upgrade Plan"]}),e.jsxs("h1",{className:"hero-title",children:["Unlock ",e.jsx("span",{children:"MCQ Kash Pro"})]}),e.jsxs("div",{className:"hero-sub",children:[e.jsx("span",{className:"sub-gopro",children:"Go Pro."}),e.jsx("span",{className:"sub-gounlimited",children:"Go Unlimited."}),e.jsx("span",{className:"sub-gounstoppable",children:"Go Unstoppable."})]}),!c&&e.jsxs("div",{className:"guest-warn",onClick:()=>h("/signin"),children:[e.jsx(ze,{size:14}),e.jsxs("span",{children:["You're offline. ",e.jsx("u",{children:"Sign In"})," to activate your plan."]})]})]}),o&&o.expires_at&&e.jsx("div",{className:"max-w-[980px] mx-auto px-6 mb-6",children:e.jsxs("div",{className:"bg-gradient-to-r from-slate-900/95 via-amber-950/40 to-slate-900/95 border border-amber-500/35 rounded-2xl p-4 sm:p-4.5 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-2xl shadow-[0_12px_40px_rgba(245,158,11,0.18)] relative overflow-hidden group",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none opacity-80"}),e.jsx("div",{className:"absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"}),e.jsxs("div",{className:"flex items-center gap-3.5 text-left relative z-10",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]",children:e.jsx(ee,{className:"w-5 h-5 text-amber-400 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:e.jsxs("span",{className:"text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5",children:["YOUR EXCLUSIVE"," ",e.jsxs("span",{className:"text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 font-black px-2.5 py-0.5 rounded-md shadow-[0_2px_12px_rgba(245,158,11,0.4)] tracking-wide text-xs",children:[o.discount_percent,"% OFF"]})," ","IS LIVE"]})}),e.jsxs("p",{className:"text-[12px] text-slate-300 font-medium mt-1 leading-snug",children:["Your coupon is active. ",e.jsx("span",{className:"text-amber-300 font-bold underline decoration-amber-500/40 underline-offset-2",children:"Complete your upgrade before this offer expires."})]})]})]}),O&&e.jsxs("div",{className:"flex items-center gap-3 bg-slate-950/90 border border-amber-500/30 px-4 py-2.5 rounded-xl shrink-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative z-10",children:[e.jsxs("div",{className:"flex flex-col items-center min-w-[28px]",children:[e.jsxs("span",{className:"text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]",children:[O.days,"d"]}),e.jsx("span",{className:"text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1",children:"DAYS"})]}),e.jsx("span",{className:"text-amber-500/60 font-black text-sm animate-pulse",children:":"}),e.jsxs("div",{className:"flex flex-col items-center min-w-[28px]",children:[e.jsxs("span",{className:"text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]",children:[String(O.hours).padStart(2,"0"),"h"]}),e.jsx("span",{className:"text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1",children:"HRS"})]}),e.jsx("span",{className:"text-amber-500/60 font-black text-sm animate-pulse",children:":"}),e.jsxs("div",{className:"flex flex-col items-center min-w-[28px]",children:[e.jsxs("span",{className:"text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]",children:[String(O.minutes).padStart(2,"0"),"m"]}),e.jsx("span",{className:"text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1",children:"MIN"})]}),e.jsx("span",{className:"text-amber-500/60 font-black text-sm animate-pulse",children:":"}),e.jsxs("div",{className:"flex flex-col items-center min-w-[28px]",children:[e.jsxs("span",{className:"text-base font-black text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]",children:[String(O.seconds).padStart(2,"0"),"s"]}),e.jsx("span",{className:"text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1",children:"SEC"})]})]})]})}),!o&&X&&e.jsx("div",{className:"max-w-[980px] mx-auto px-6 mb-6",children:e.jsxs("div",{className:"bg-gradient-to-r from-rose-950/60 via-slate-900/95 to-rose-950/60 border border-rose-500/35 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-2xl shadow-[0_10px_35px_rgba(244,63,94,0.15)] relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent pointer-events-none opacity-80"}),e.jsxs("div",{className:"flex items-center gap-3.5 text-left relative z-10",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.25)]",children:e.jsx(ee,{className:"w-5 h-5 text-rose-400 opacity-80"})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:e.jsxs("span",{className:"text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5",children:["SPECIAL OFFER HAS EXPIRED"," ",e.jsx("span",{className:"text-rose-200 bg-rose-500/20 font-black px-2 py-0.5 rounded-md border border-rose-500/30 text-xs",children:X.code})]})}),e.jsxs("p",{className:"text-[12px] text-slate-300 font-medium mt-1 leading-snug",children:["Sorry, your ",e.jsxs("span",{className:"text-white font-bold",children:[X.discount_percent,"% OFF"]})," offer period has ended for this device. Standard pricing applies."]})]})]}),e.jsx("a",{href:"https://t.me/+gGtCAlVgB3I5ZTBl",target:"_blank",rel:"noopener noreferrer",className:"px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-black tracking-wide transition-all flex items-center gap-2 shrink-0 relative z-10",children:e.jsx("span",{children:"Get New Code on Telegram"})})]})}),!le&&e.jsx("div",{className:"max-w-[980px] mx-auto px-6 mb-8",children:e.jsxs("div",{className:"bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-slate-900/60 border border-cyan-500/30 hover:border-cyan-500/50 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] relative overflow-hidden transition-all duration-300 text-left",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 pointer-events-none"}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("h4",{className:"text-lg font-black text-white tracking-tight flex items-center gap-2",children:[e.jsx(v,{size:18,className:"text-cyan-400 animate-pulse shrink-0"}),"Earn your Pro"]}),e.jsxs("p",{className:"text-xs text-slate-300 font-medium leading-relaxed max-w-[500px]",children:[e.jsx("strong",{className:"text-cyan-400 font-extrabold",children:"Every friend"})," you bring makes your ",e.jsx("strong",{className:"text-amber-400 font-extrabold",children:"Pro affordable"})," by ",e.jsx("strong",{className:"text-emerald-400 font-extrabold",children:"₹25 per invite"}),"."]})]}),e.jsxs("button",{onClick:()=>J(!0),className:"w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_14px_rgba(6,182,212,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer",children:[e.jsx(v,{size:12})," Earn Rewards"]})]})}),e.jsx("div",{className:"plans-strip",children:Je.map(t=>{const r=le&&(a==null?void 0:a.pro_tier)===t.id,s=Y===t.id,p=t.icon,{baseMrp:n,couponDiscountPercent:d,couponPrice:x,effectiveWalletDiscount:m,finalPrice:l,isHeavyCoupon:j}=fe(t,o,ne);let k=t.priceNote;return l<n&&(t.id==="ONE_DAY"||t.id==="ONE_HOUR"?k=`₹${l} / 1 day pass`:t.id==="ONE_WEEK"?k=`₹${l} / week`:t.id==="ONE_MONTH"?k=`₹${l} / month`:t.id==="THREE_MONTHS"?k=`₹${Math.round(l/3)} / month`:t.id==="SIX_MONTHS"?k=`₹${Math.round(l/6)} / month`:t.id==="ONE_YEAR"?k=`₹${Math.round(l/12)} / month`:t.id==="LIFETIME"&&(k="₹4 / month equivalent")),e.jsxs("div",{className:`plan-card${t.featured?" featured":""}`,children:[t.featured&&e.jsx("div",{className:"featured-glow"}),t.badge&&e.jsxs("div",{className:`plan-badge ${t.id==="LIFETIME"?"badge-purple":t.id==="ONE_YEAR"?"badge-blue":"badge-amber"}`,children:[e.jsx(v,{size:8,fill:"currentColor"}),t.badge.text]}),e.jsxs("div",{className:"card-header-row",children:[e.jsxs("div",{className:"plan-meta",children:[e.jsx("div",{className:"plan-label",children:t.label}),e.jsx("div",{className:"plan-name",children:t.name})]}),e.jsx("div",{className:"card-icon-wrap",children:e.jsx(p,{size:16,style:{color:t.iconColor}})})]}),e.jsx("div",{className:"plan-divider"}),e.jsxs("div",{className:"price-section",children:[e.jsxs("div",{className:"price-row flex items-baseline gap-1.5 flex-wrap",children:[e.jsx("span",{className:"price-currency",children:"₹"}),e.jsx("span",{className:"price-amount",children:l}),m>0&&d>0&&l<x&&x<n?e.jsxs(e.Fragment,{children:[e.jsxs("span",{className:"line-through text-amber-400/90 font-bold text-xs sm:text-sm",children:["₹",x]}),e.jsxs("span",{className:"price-strike opacity-60 text-xs",children:["₹",n]})]}):d>0&&l<n?e.jsxs("span",{className:"price-strike opacity-60 text-xs",children:["₹",n]}):m>0&&l<t.price?e.jsxs(e.Fragment,{children:[e.jsxs("span",{className:"line-through text-amber-400/90 font-bold text-xs sm:text-sm",children:["₹",t.price]}),e.jsxs("span",{className:"price-strike opacity-60 text-xs",children:["₹",n]})]}):l<n?e.jsxs("span",{className:"price-strike",children:["₹",n]}):null]}),e.jsx("div",{className:"price-note",children:k}),d>0&&e.jsxs("div",{className:"text-[10px] font-extrabold text-amber-400 mt-1 flex items-center gap-1",children:[e.jsx(v,{size:11,className:"text-amber-400 animate-pulse shrink-0"}),e.jsxs("span",{children:[d,"% Coupon Applied (",o.code,")"]})]}),ne>0&&e.jsxs("div",{className:"text-[10px] font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1",children:[e.jsx(ue,{size:11,className:"text-emerald-400 shrink-0"}),e.jsx("span",{children:j?"No wallet discount for Mega Coupons":`Wallet Discount: -₹${m}`})]})]}),e.jsx("button",{className:`upgrade-btn ${t.featured?"btn-featured":"btn-default"}`,onClick:()=>we(t),disabled:s||r||Y!==null,children:s?e.jsx("div",{className:"btn-spin"}):r?"Active ✓":e.jsxs(e.Fragment,{children:[e.jsx(B,{size:10,fill:"currentColor"}),"Upgrade"]})})]},t.id)})}),o&&o.expires_at&&e.jsx("div",{className:"max-w-[980px] mx-auto px-6 mt-4 mb-2",children:e.jsx("div",{className:"bg-gradient-to-r from-amber-950/40 via-slate-900/95 to-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 backdrop-blur-xl shadow-[0_4px_20px_rgba(245,158,11,0.1)] relative overflow-hidden",children:e.jsxs("div",{className:"flex items-center gap-2.5 text-left",children:[e.jsx("div",{className:"w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0",children:e.jsx(B,{size:14,className:"text-amber-400 fill-amber-400/30"})}),e.jsxs("p",{className:"text-[11px] text-slate-300 font-medium leading-normal",children:["Discount Code ",e.jsx("strong",{className:"text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25",children:o.code})," Active · Upgrade before the countdown timer ends to lock in these special prices before they revert to original MRP."]})]})})}),e.jsx("div",{className:"max-w-[980px] mx-auto px-6 mt-8 mb-10",children:e.jsxs("div",{className:"bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95 border border-amber-500/25 hover:border-amber-500/40 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(245,158,11,0.07)] space-y-3.5 relative overflow-hidden transition-all duration-300",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/45 to-transparent pointer-events-none"}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0",children:e.jsx(Me,{size:15,className:"text-amber-400"})}),e.jsx("h4",{className:"text-[13px] font-black text-white tracking-tight",children:"Apply Your Discount Coupon?"})]}),e.jsx("p",{className:"text-[11px] text-slate-400 font-medium sm:text-right pl-[42px] sm:pl-0",children:"Enter your Special Offer Coupon from Telegram"})]}),e.jsx("div",{className:"h-px bg-slate-800/70"}),e.jsxs("div",{className:"flex items-stretch gap-2.5",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx("input",{type:"text",value:U,onChange:t=>T(t.target.value.toUpperCase()),onKeyDown:t=>t.key==="Enter"&&Q(U),placeholder:"ENTER CODE",className:"w-full h-11 bg-slate-950/80 border border-slate-700/60 focus:border-amber-500/50 rounded-xl px-4 text-[11px] font-mono font-bold text-white uppercase tracking-widest placeholder:text-slate-600 placeholder:normal-case placeholder:tracking-normal outline-none transition-all"}),o&&e.jsx("button",{onClick:ye,className:"absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-400 hover:text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20 transition-all",children:"✕"})]}),e.jsx("button",{onClick:()=>Q(U),disabled:se||!U.trim(),className:"h-11 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)] shrink-0 flex items-center gap-1.5 cursor-pointer",children:se?e.jsx(pe,{size:12,className:"animate-spin"}):"Apply"})]}),o?e.jsxs("div",{className:"flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-emerald-400 text-[11px] font-black mx-auto w-fit",style:{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)"},children:[e.jsx(Ae,{size:13,className:"shrink-0"}),e.jsxs("span",{children:[e.jsx("strong",{children:o.code})," Applied — ",o.discount_percent,"% OFF Active"]})]}):e.jsxs("div",{className:"flex items-center justify-center gap-3 flex-wrap",children:[e.jsxs("button",{onClick:()=>Q("KASH45"),title:"Tap to apply 45% discount instantly",className:"flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black text-amber-400 hover:text-amber-300 transition-all active:scale-95 cursor-pointer",style:{background:"rgba(245,158,11,0.09)",border:"1px solid rgba(245,158,11,0.28)"},children:[e.jsx(v,{size:12,className:"animate-pulse shrink-0"}),"Use KASH45 (45% OFF)"]}),e.jsxs("a",{href:"https://t.me/+gGtCAlVgB3I5ZTBl",target:"_blank",rel:"noopener noreferrer",className:"flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black text-cyan-400 hover:text-cyan-300 transition-all active:scale-95",style:{background:"rgba(6,182,212,0.07)",border:"1px solid rgba(6,182,212,0.25)"},children:[e.jsx(xe,{size:12,className:"shrink-0"}),"Get Coupon on Telegram"]})]})]})}),e.jsx("div",{className:"features-panel",children:e.jsxs("div",{className:"features-box",children:[e.jsxs("div",{className:"features-header",children:[e.jsx(v,{size:14,style:{color:"#f59e0b"}}),e.jsx("span",{className:"features-header-title",children:"Everything included in Pro"}),e.jsx("span",{className:"features-header-sub",children:"Full access benefits"})]}),e.jsx("div",{className:"features-grid",children:Ve.map((t,r)=>e.jsxs("div",{className:"feature-item",children:[e.jsx("div",{className:"feature-icon-wrap",style:{background:t.color+"12"},children:e.jsx(t.icon,{size:14,style:{color:t.color}})}),e.jsxs("div",{className:"feature-text-block",children:[e.jsx("span",{className:"feature-label",children:t.label}),e.jsx("span",{className:"feature-desc",children:t.desc})]})]},r))})]})}),e.jsxs("div",{className:"trust-footer",children:[e.jsxs("div",{className:"trust-item",children:[e.jsx(ae,{size:12,style:{color:"#f59e0b"}}),e.jsx("span",{className:"trust-label",children:"Razorpay secured · 128-bit SSL"})]}),e.jsxs("div",{className:"trust-item",children:[e.jsx(B,{size:12,style:{color:"#a78bfa"}}),e.jsx("span",{className:"trust-label",children:"Instant activation after payment"})]}),e.jsxs("div",{className:"trust-item",children:[e.jsx(he,{size:12,style:{color:"#34d399"}}),e.jsx("span",{className:"trust-label",children:"One-time billing · No auto-renew"})]})]}),R&&e.jsx("div",{className:"fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden custom-scrollbar flex items-start sm:items-center justify-center p-0 sm:p-6 backdrop-blur-md bg-theme-bg/90",onClick:t=>{t.target===t.currentTarget&&J(!1)},children:e.jsxs(te.div,{initial:{opacity:0,scale:.9,y:30},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.9,y:30},className:"w-full min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:max-w-md md:max-w-4xl flex flex-col bg-theme-surface border-0 ring-1 ring-theme-border/20 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative sm:overflow-hidden",onClick:t=>t.stopPropagation(),children:[e.jsxs("div",{className:"shrink-0 p-6 bg-gradient-to-b from-cyan-500/10 to-transparent flex items-start justify-between relative",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-50"}),e.jsxs("div",{children:[e.jsxs("h2",{className:"text-2xl font-black flex items-center gap-2 text-white italic tracking-tighter",children:[e.jsx(v,{className:"text-cyan-400 fill-cyan-400 animate-pulse",size:24}),"Reward Center"]}),e.jsx("p",{className:"text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 opacity-80",children:"Referral & Milestone Rewards Protocol"})]}),e.jsx("button",{onClick:()=>J(!1),className:"p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all",children:e.jsx(Le,{size:18,className:"text-slate-300"})})]}),e.jsxs("div",{className:"flex-1 sm:overflow-y-auto sm:custom-scrollbar p-6 sm:p-8 pt-0 flex flex-col md:grid md:grid-cols-2 md:gap-10",children:[e.jsxs("div",{className:"flex flex-col",children:[(a==null?void 0:a.referred_by)&&e.jsxs("div",{className:"mb-6 bg-gradient-to-r from-theme-primary/5 via-theme-accent/[0.03] to-transparent border border-theme-primary/20 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-card hover:shadow-card-hover hover:border-theme-primary/35 hover:scale-[1.01] transition-all duration-350 ease-out group/inviter",children:[e.jsx("div",{className:"absolute inset-0 bg-grid-white/[0.01] pointer-events-none"}),e.jsxs("div",{className:"flex items-center gap-4 relative z-10",children:[e.jsx("div",{className:"w-12 h-12 rounded-full ring-2 ring-theme-primary/30 group-hover/inviter:ring-theme-primary/50 p-[2px] bg-theme-surface shrink-0 transition-all duration-300",children:L?e.jsx("div",{className:"w-full h-full rounded-full bg-theme-bg/50 animate-pulse flex items-center justify-center",children:e.jsx(pe,{size:16,className:"text-theme-primary animate-spin"})}):e.jsx(qe,{id:(g==null?void 0:g.avatar_id)||1,className:"w-full h-full rounded-full bg-theme-bg"})}),e.jsxs("div",{className:"flex flex-col justify-center",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 opacity-90",children:"Invited By"}),e.jsxs("h4",{className:"font-black text-lg text-white tracking-tight mt-0.5 flex items-center gap-2 leading-none",children:[L?"Loading...":(g==null?void 0:g.full_name)||a.referred_by,!L&&(g==null?void 0:g.is_pro)&&e.jsx("span",{className:"px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest uppercase animate-pulse",children:"PRO"})]})]})]}),!L&&(g==null?void 0:g.rank)&&e.jsxs("div",{className:"relative z-10 flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 font-black shadow-sm shrink-0",children:[e.jsx(Ue,{size:12,className:"fill-amber-500"}),e.jsxs("span",{children:["Rank #",g.rank]})]}),e.jsx("div",{className:"text-4xl font-serif text-cyan-500/10 select-none absolute right-4 top-2 font-bold pointer-events-none",children:"✨"})]}),e.jsxs("div",{className:"flex flex-col items-center justify-center py-6 mb-6 bg-slate-900/60 rounded-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-slate-800 relative overflow-hidden text-center",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"}),e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400",children:"Your Referral Code"}),e.jsx("h1",{className:"text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tighter drop-shadow-2xl mt-3 mb-4 select-all truncate max-w-full px-4 text-center whitespace-nowrap",children:(a==null?void 0:a.username)||"---"}),e.jsxs("button",{onClick:je,className:"px-6 py-2.5 bg-gradient-to-r from-theme-primary to-theme-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:opacity-95 active:scale-98 flex items-center gap-2",children:[e.jsx(xe,{size:12})," Share Referral"]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.2em] text-slate-400",children:"Invite Stats"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{className:"bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-4 text-left col-span-2 flex items-center justify-between",children:[e.jsxs("div",{className:"flex flex-col justify-center",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-emerald-400",children:"Wallet Money"}),e.jsxs("div",{className:"text-3xl font-black text-emerald-400 mt-1 tracking-tight",children:["₹",(()=>{if(!a||a.id==="default_user")return S()*25+25;const t=Number(a.scratched_cards_count||0),r=a.referred_by||localStorage.getItem("mcqkash_welcome_coins_pending")?25:0,s=t*25+r;return a.premium_discount_earned!==void 0&&a.premium_discount_earned!==null?Number(a.premium_discount_earned):s})()]})]}),(()=>{const s=(localStorage.getItem("mcqkash_last_referral_time")?Number(localStorage.getItem("mcqkash_last_referral_time")):Date.now())+15*24*60*60*1e3-Date.now(),p=Math.max(1,Math.ceil(s/(1e3*60*60*24)));return e.jsxs("div",{className:"flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider shrink-0",children:[e.jsx(ee,{size:12,className:"text-rose-400 shrink-0"}),e.jsxs("span",{children:[p," Days Left"]})]})})()]}),e.jsxs("div",{className:"bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-blue-400",children:"Friends Joined"}),e.jsx("div",{className:"text-2xl font-black text-white mt-1",children:!a||a.id==="default_user"?S():a.referral_count||0})]}),e.jsxs("div",{className:"bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 text-left flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-amber-400",children:"Earnings"}),e.jsx("div",{className:"mt-1",children:e.jsx($e,{amount:K(),className:"text-2xl font-black text-amber-500",iconClassName:"w-[0.9em] h-[0.9em]"})})]}),e.jsxs("div",{className:"bg-cyan-500/[0.03] border border-cyan-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-cyan-400",children:"Streak Freeze"}),e.jsxs("div",{className:"text-2xl font-black text-white mt-1",children:["+",S()+D()," Shield"]})]}),e.jsxs("div",{className:"bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-4 text-left",children:[e.jsx("span",{className:"text-[9px] font-black uppercase tracking-widest text-rose-400",children:"Power Surge"}),e.jsxs("div",{className:"text-2xl font-black text-white mt-1",children:["+",S()*3+D()*7," Days"]})]})]})]})]}),e.jsxs("div",{className:"flex flex-col gap-6 mt-6 md:mt-0",children:[e.jsx(Be,{economy:a,refreshEconomy:C,showToast:i,playVictory:y}),e.jsxs("div",{className:"bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",children:[e.jsx("span",{className:"text-[10px] font-black uppercase tracking-[0.2em] text-slate-400",children:"How Referrals Work"}),e.jsxs("div",{className:"space-y-3.5 text-xs text-left",children:[e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"1"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"Share & Invite"}),e.jsx("span",{className:"text-slate-300 font-medium text-[11px]",children:"Give your real friends your referral code (i.e username) to sign-up."})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"2"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"Friends Get instant benefits"}),e.jsxs("span",{className:"text-slate-300 font-medium text-[11px]",children:["Referees receive ",e.jsx("strong",{className:"text-amber-500",children:"150 KashCoins"})," + ",e.jsx("strong",{className:"text-emerald-400",children:"₹25 Wallet Money"})," + ",e.jsx("strong",{className:"text-cyan-400",children:"1 Freeze"})," + ",e.jsx("strong",{className:"text-rose-400",children:"7-day Surge"}),"."]})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"3"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"You Get premium rewards"}),e.jsxs("span",{className:"text-slate-300 font-medium text-[11px]",children:["Every referral awards you a ",e.jsx("strong",{className:"text-emerald-400",children:"flat ₹25 premium discount"})," and a ",e.jsx("strong",{className:"text-amber-400",children:"Scratch Card"})," loaded with rewards!"]})]})]}),e.jsx("div",{className:"flex items-start gap-2.5 mt-4 pt-3.5 border-t border-theme-border/10 text-[9px] text-red-500 font-extrabold uppercase tracking-widest",children:e.jsx("span",{children:"⚠️ WARNING: using fake invite emails can result in account ban."})})]})]}),e.jsxs("div",{className:"bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-3xl p-5 space-y-3.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-left",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1.5",children:[e.jsx(v,{size:12,className:"text-emerald-400"}),"How Wallet Works"]}),e.jsx("span",{className:"px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider",children:"Use It Or Lose It"})]}),e.jsxs("div",{className:"space-y-3 text-xs",children:[e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"1"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"Earn ₹25 Per Invite & Joining"}),e.jsxs("span",{className:"text-slate-300 font-medium text-[11px]",children:["Inviting a friend adds ",e.jsx("strong",{className:"text-emerald-400",children:"₹25 to your Wallet"}),", and the invited friend also gets ",e.jsx("strong",{className:"text-emerald-400",children:"₹25 Wallet Money"})," on joining!"]})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"2"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"Reduces Pro Price & Buys KashCoins"}),e.jsxs("span",{className:"text-slate-300 font-medium text-[11px]",children:["Wallet money automatically reduces your ",e.jsx("strong",{className:"text-cyan-400",children:"Pro membership price"})," at checkout, and can buy ",e.jsx("strong",{className:"text-amber-400",children:"KashCoins"})," in the Coins Vault!"]})]})]}),e.jsxs("div",{className:"flex items-start gap-2.5",children:[e.jsx("div",{className:"w-5 h-5 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold shrink-0 text-[10px]",children:"3"}),e.jsxs("div",{children:[e.jsx("span",{className:"font-extrabold text-white block",children:"15-Day Expiry (Resets On Each Invite)"}),e.jsxs("span",{className:"text-slate-300 font-medium text-[11px]",children:["Wallet balance has a ",e.jsx("strong",{className:"text-rose-400",children:'15-day "Use It or Lose It" timer'}),". Every new invite ",e.jsx("strong",{className:"text-amber-400",children:"resets your 15-day timer"})," back to full to keep adding money!"]})]})]})]})]})]})]})]})}),e.jsx(We,{children:(Y!==null||ge)&&e.jsx(te.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md",children:e.jsxs(te.div,{initial:{scale:.85,y:10},animate:{scale:1,y:0},exit:{scale:.85,y:10},className:"bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 max-w-xs w-full shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-center flex flex-col items-center gap-5 relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 animate-pulse"}),e.jsxs("div",{className:"relative w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]",children:[e.jsx(ae,{className:"w-10 h-10 text-amber-400 animate-pulse"}),e.jsx("div",{className:"absolute inset-0 rounded-3xl border-2 border-amber-400/50 border-t-transparent animate-spin"})]}),e.jsxs("div",{className:"flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/25 shadow-sm",children:[e.jsx(v,{size:13,className:"animate-spin text-amber-400 shrink-0"}),e.jsx("span",{children:"256-bit SSL Protected Checkout"})]})]})})})]})]})}export{et as default};

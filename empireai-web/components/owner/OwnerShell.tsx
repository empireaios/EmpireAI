'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Home,Dog,Package,PanelsTopLeft,ShoppingBag,Landmark,ChartNoAxesCombined,ScanEye,ShieldCheck,CalendarDays,Settings,ClipboardCheck,Menu,X,Crown,Search,MessageCircle,Bell} from 'lucide-react';
import {useAuth} from '@/lib/auth/context';
import {CockpitAuthGuard} from '@/components/cockpit/shell/CockpitAuthGuard';
import s from './work7/shell.module.css';
import {ownerNavigationParent} from '@/lib/owner/presentation';
const destinations=[['Home','/cockpit',Home],['Pillow (CEO)','/cockpit/ceo',Dog],['Products','/cockpit/products',Package],['Listings','/cockpit/listings',PanelsTopLeft],['Orders','/cockpit/orders',ShoppingBag],['Finance','/cockpit/finance',Landmark],['Live Cost Centre','/cockpit/cost-centre',ChartNoAxesCombined],['Intelligence','/cockpit/eyes',ScanEye],['Assurance','/cockpit/assurance',ShieldCheck],['Approvals','/cockpit/approvals',ClipboardCheck],['Calendar','/cockpit/calendar',CalendarDays],['System','/cockpit/system',Settings]] as const;
export function OwnerShell({children}:{children:React.ReactNode}){
 const path=usePathname(),{logout}=useAuth();const [open,setOpen]=useState(false),[search,setSearch]=useState('');const home=path==='/cockpit';const chat=path==='/cockpit/development/pillow';const parent=ownerNavigationParent(path);const section=destinations.find(([,href])=>parent===href||(href!=='/cockpit'&&parent.startsWith(href+'/')));
 const shellRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!chat) return;
  const viewport=window.visualViewport;
  const update=()=>{
   const shell=shellRef.current;
   if(!shell) return;
   // Pin the phone chat to the visible area above the software keyboard.
   const mobile=window.innerWidth<=700;
   const height=viewport?.height??window.innerHeight;
   shell.style.setProperty('--chat-visible-height',`${height}px`);
   shell.style.setProperty('--chat-visible-top',`${viewport?.offsetTop??0}px`);
   shell.dataset.chatKeyboard=String(mobile && window.innerHeight-height>150);
  };
  update();
  viewport?.addEventListener('resize',update);
  viewport?.addEventListener('scroll',update);
  window.addEventListener('resize',update);
  return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
 },[chat]);
 return <CockpitAuthGuard><div ref={shellRef} className={`${s.shell} ${home?s.homeShell:''} ${chat?s.chatShell:''}`} data-owner-theme="pastel"><a href="#owner-main" className={s.skip}>Skip to content</a>
 <aside className={s.sidebar}><Link href="/cockpit" className={s.brand}><Crown aria-hidden="true"/><strong>EmpireAI</strong><span>A Bigger Tomorrow, Together</span></Link><nav aria-label="Owner navigation">{destinations.map(([label,href,Icon])=><Link key={href} href={href} aria-current={parent===href||(href!=='/cockpit'&&parent.startsWith(href+'/'))?'page':undefined}><Icon size={21} aria-hidden="true"/>{label}</Link>)}</nav><div className={s.sidebarArt} aria-hidden="true"/><button className={s.signout} onClick={()=>void logout()}>Sign out</button></aside>
 <div className={s.workspace}><header className={`${s.topbar} ${home?s.homeTopbar:''}`}><button className={s.menuButton} aria-label={open?'Close owner menu':'Open owner menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><Link href="/cockpit" className={s.mobileBrand}>♛ EmpireAI</Link><div className={s.search}><Search size={17}/><input aria-label="Find an owner page" placeholder="Find a page…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<div className={s.searchResults}>{destinations.filter(([label])=>label.toLowerCase().includes(search.toLowerCase())).map(([label,href])=><Link href={href} key={href} onClick={()=>setSearch('')}>{label}</Link>)}{!destinations.some(([label])=>label.toLowerCase().includes(search.toLowerCase()))&&<p>No matching page</p>}</div>}</div>{home&&<Link className={`${s.message} ${s.attention}`} href="/cockpit/ceo#recommendations" aria-label="Owner attention and recommendations"><Bell size={21}/></Link>}<Link className={s.message} href="/cockpit/advisor" aria-label="King’s Advisor communications"><MessageCircle size={23}/></Link><Clock/></header>
 {open&&<nav className={s.mobileMenu} aria-label="Cockpit mobile menu">{destinations.map(([label,href,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={parent===href||(href!=='/cockpit'&&parent.startsWith(href+'/'))?'page':undefined}><Icon size={20}/>{label}</Link>)}<button onClick={()=>void logout()}>Sign out</button></nav>}
 <main id="owner-main" className={home?s.homeMain:s.main}>{!home&&<nav aria-label="Breadcrumb" className={s.breadcrumb}><Link href="/cockpit">Home</Link><span aria-hidden="true"> / </span>{section&&<Link href={section[1]}>{section[0]}</Link>}{path==='/cockpit/development/pillow'&&<><span aria-hidden="true"> / </span><span>Chat</span></>}{path.startsWith('/cockpit/assurance')&&<><span aria-hidden="true"> / </span><span>Governance &amp; monitoring</span></>}</nav>}{children}</main><footer className={s.footer}>Private owner workspace · NOT_BORN · Commerce LOCKED <Link href="/cockpit/assurance">Inspect authority and evidence →</Link></footer></div>
 <nav className={s.bottomNav} aria-label="Mobile quick navigation">{[destinations[0],destinations[1],destinations[2],destinations[5]].map(([label,href,Icon])=><Link href={href} key={href} aria-current={parent===href||(href!=='/cockpit'&&parent.startsWith(href+'/'))?'page':undefined}><Icon size={20}/>{label==='Pillow (CEO)'?'CEO':label}</Link>)}</nav></div></CockpitAuthGuard>;
}
function Clock(){const [now,setNow]=useState<Date|null>(null);useEffect(()=>{const initial=setTimeout(()=>setNow(new Date()),0);const t=setInterval(()=>setNow(new Date()),1000);return()=>{clearTimeout(initial);clearInterval(t);};},[]);return <time className={s.clock} dateTime={now?.toISOString()}>{now?<><span>{now.toLocaleDateString('en-SG',{timeZone:'Asia/Singapore',weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span><strong>{now.toLocaleTimeString('en-SG',{timeZone:'Asia/Singapore',hour:'2-digit',minute:'2-digit',second:'2-digit'})} SGT</strong></>:<span>Singapore time</span>}</time>;}

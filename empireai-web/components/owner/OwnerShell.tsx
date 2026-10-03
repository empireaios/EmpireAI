'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useAuth} from '@/lib/auth/context';
import {CockpitAuthGuard} from '@/components/cockpit/shell/CockpitAuthGuard';
export function OwnerShell({children}:{children:React.ReactNode}){
 const path=usePathname();const {logout}=useAuth();
 return <CockpitAuthGuard><div className="min-h-screen bg-[#071014] text-slate-100">
  <a href="#owner-main" className="sr-only focus:not-sr-only">Skip to content</a>
  <header className="border-b border-white/10 bg-[#0b181d] px-4 py-4"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4"><Link href="/cockpit" className="text-lg font-semibold tracking-wide">EmpireAI <span className="text-amber-300">/ King</span></Link><button className="min-h-11 px-3 text-sm text-slate-300" onClick={()=>void logout()}>Sign out</button></div></header>
  <nav aria-label="Owner navigation" className="border-b border-white/10 bg-[#0b181d] px-2"><div className="mx-auto grid max-w-5xl grid-cols-3 sm:grid-cols-5">{[['Home','/cockpit'],['Commerce','/cockpit/products'],['Orders','/cockpit/commerce/transactions'],['Pillow','/cockpit/development/pillow'],['Assurance','/cockpit/assurance']].map(([label,href])=><Link key={label} href={href} aria-current={path===href?'page':undefined} className={'min-h-12 px-2 py-4 text-center text-sm font-medium '+(path===href?'border-b-2 border-amber-300 text-amber-200':'text-slate-300')}>{label}</Link>)}</div></nav>
  <main id="owner-main" className="mx-auto max-w-5xl px-4 py-6 pb-12">{children}</main>
  <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-400">Private owner workspace · Trading controls remain locked until qualification, certification and your authorisation.</footer>
 </div></CockpitAuthGuard>;
}

import {siteFetch as fetch,currentSite,apiOrigin,localLink,startGoogle,clearSession,saveSession} from './site-context.js?v=20261010-mono';
const link=document.createElement('a');link.href='/addons/admin';link.textContent='Open Page Builder & Studio ↗';link.style.cssText='position:fixed;bottom:18px;right:18px;z-index:15;background:#c4c4c4;color:#131313;padding:12px 18px;border-radius:10px;font:600 14px system-ui;text-decoration:none;box-shadow:0 3px 20px #00000088';document.body.append(link);


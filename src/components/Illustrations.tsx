import type { LessonId } from '../types';
import {useId} from 'react';
export function Star({className=''}:{className?:string}){
 const id=useId();
 return <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true"><defs><linearGradient id={id} x1="8" y1="4" x2="65" y2="74"><stop stopColor="#f2e4c8"/><stop offset=".45" stopColor="#b29c77"/><stop offset=".7" stopColor="#ece0c6"/><stop offset="1" stopColor="#857152"/></linearGradient></defs><circle cx="40" cy="40" r="33" fill="#263e4b" stroke={`url(#${id})`} strokeWidth="2"/><circle cx="40" cy="40" r="27" stroke="#8a9da55c"/><path d="m40 14 7 19 19 7-19 7-7 19-7-19-19-7 19-7z" fill={`url(#${id})`}/><path d="m40 25 5 15-5 15-5-15z" fill="#405b69"/><circle cx="40" cy="40" r="3" fill="#e8ddc4"/></svg>;
}
export function Illustration({id}:{id:LessonId}){
 return <img className="lesson-illustration" src={`${import.meta.env.BASE_URL}previews/${id}.png`} alt="" loading="lazy" decoding="async"/>;
}

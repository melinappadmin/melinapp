"use client";
import dynamic from "next/dynamic";
import {useEffect,useMemo,useState} from "react";
const MapView=dynamic(()=>import("../components/MapView"),{ssr:false});
type Point={id:string;name:string;address:string;neighborhood:string;city:string;state:string;latitude:number;longitude:number;available:boolean};
function distance(a:[number,number],b:Point){return Math.hypot(a[0]-b.latitude,a[1]-b.longitude)}
export default function OndeComprar(){
 const [points,setPoints]=useState<Point[]>([]),[user,setUser]=useState<[number,number]|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{fetch("/api/public-points").then(r=>r.json()).then(setPoints).catch(()=>setError("Não foi possível carregar os pontos de venda.")).finally(()=>setLoading(false))},[]);
 const list=useMemo(()=>[...points].sort((a,b)=>user?distance(user,a)-distance(user,b):0),[points,user]);
 function locate(){navigator.geolocation.getCurrentPosition(p=>{setUser([p.coords.latitude,p.coords.longitude]);setError("")},()=>setError("Autorize o acesso à localização e tente novamente."),{enableHighAccuracy:true})}
 return <main className="public-page"><header><img src="/logo.jpeg" alt="Paieiro Melin"/><div><strong>MELIN</strong><span>ONDE COMPRAR</span></div><a href="/">Acesso administrativo</a></header><section className="public-hero"><span>PAIEIRO MELIN EM POÇOS DE CALDAS</span><h1>Encontre o ponto de venda<br/>mais perto de você.</h1><p>Localize nossos parceiros e abra a melhor rota para chegar até eles.</p><button className="primary" onClick={locate}>⌖ {user?"Localização encontrada":"Usar minha localização"}</button>{error&&<small>{error}</small>}</section><section className="public-results"><div className="public-list"><span>PONTOS DE VENDA</span><h2>{loading?"Buscando pontos…":`${list.length} locais encontrados`}</h2>{!loading&&list.length===0&&<div className="public-empty"><strong>Novos pontos em breve</strong><p>Estamos atualizando os endereços dos nossos parceiros. Volte novamente em breve.</p></div>}{list.map((p,i)=><article key={p.id}><i>{i+1}</i><div><strong>{p.name}</strong><p>{p.address} · {p.neighborhood}</p><small>{p.available?"● Produto disponível":"Consulte a disponibilidade"}</small></div><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}>Como chegar ↗</a></article>)}</div><div className="public-map"><MapView points={list.map((p,i)=>({...p,order:i+1}))} user={user}/></div></section></main>
}

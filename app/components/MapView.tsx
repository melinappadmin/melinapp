"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";

export type MapPoint = { id:string; name:string; latitude:number; longitude:number; order?:number };

export default function MapView({ points, user, route=false }:{ points:MapPoint[]; user?:[number,number]|null; route?:boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const pointsKey = points.map((p)=>`${p.id}:${p.latitude}:${p.longitude}:${p.order??""}`).join("|");
  const userKey = user?.join(",") ?? "";
  useEffect(() => {
    if (!el.current) return;
    const center:[number,number] = user || (points[0] ? [points[0].latitude,points[0].longitude] : [-21.7878,-46.5614]);
    const map=L.map(el.current,{zoomControl:true,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView(center,13,{animate:false});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; OpenStreetMap'}).addTo(map);
    const all:[number,number][]=[];
    if(user){ L.circleMarker(user,{radius:9,color:"#fff",weight:3,fillColor:"#d86a1e",fillOpacity:1}).bindPopup("Sua localização").addTo(map); all.push(user); }
    points.forEach((p,i)=>{ const pos:[number,number]=[p.latitude,p.longitude]; all.push(pos); L.marker(pos,{icon:L.divIcon({className:"melin-marker",html:`<span>${p.order??i+1}</span>`,iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(`<strong>${p.name}</strong>`).addTo(map); });
    if(route && all.length>1) L.polyline(all,{color:"#d86a1e",weight:5,opacity:.85}).addTo(map);
    if(all.length>1) map.fitBounds(all,{padding:[35,35],animate:false});
    const resizeTimer=setTimeout(()=>{if(map.getContainer())map.invalidateSize({animate:false})},100);
    return ()=>{
      clearTimeout(resizeTimer);
      map.stop();
      map.off();
      map.remove();
    };
  },[pointsKey,userKey,route]);
  return <div ref={el} className="leaflet-map" aria-label="Mapa de pontos de venda"/>;
}

"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styles from "./onde-comprar.module.css";

const MapView = dynamic(() => import("../components/MapView"), { ssr: false });

type Point = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  available: boolean;
};

function distance(a: [number, number], b: Point) {
  return Math.hypot(a[0] - b.latitude, a[1] - b.longitude);
}

export default function OndeComprar() {
  const [points, setPoints] = useState<Point[]>([]);
  const [user, setUser] = useState<[number, number] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public-points", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => setPoints(Array.isArray(data) ? data : []))
      .catch(() => setError("Não foi possível carregar os pontos de venda agora."))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(
    () => [...points].sort((a, b) => (user ? distance(user, a) - distance(user, b) : 0)),
    [points, user],
  );

  function locate() {
    if (!navigator.geolocation) {
      setError("A localização não está disponível neste navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUser([position.coords.latitude, position.coords.longitude]);
        setError("");
      },
      () => setError("Autorize o acesso à localização e tente novamente."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/onde-comprar" aria-label="Paieiro Melin — Onde comprar">
          <Image src="/logo.jpeg" alt="Paieiro Melin" width={52} height={52} priority />
          <div><strong>MELIN</strong><span>ONDE COMPRAR</span></div>
        </a>
        <a className={styles.admin} href="/">Acesso administrativo</a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span>PAIEIRO MELIN · POÇOS DE CALDAS</span>
          <h1>Encontre o Paieiro Melin mais perto de você.</h1>
          <p>Veja nossos parceiros, confira a disponibilidade e abra a melhor rota para chegar.</p>
          <button onClick={locate}>⌖ {user ? "Localização encontrada" : "Usar minha localização"}</button>
          {error && <small role="alert">{error}</small>}
        </div>
        <div className={styles.heroMark} aria-hidden="true">M</div>
      </section>

      <section className={styles.results}>
        <div className={styles.list}>
          <div className={styles.listHeading}>
            <div><span>PONTOS DE VENDA</span><h2>{loading ? "Buscando pontos…" : `${list.length} ${list.length === 1 ? "local encontrado" : "locais encontrados"}`}</h2></div>
            {user && <b>Mais próximos primeiro</b>}
          </div>

          {loading && <div className={styles.loading}><i/><i/><i/></div>}
          {!loading && list.length === 0 && (
            <div className={styles.empty}>
              <span>⌖</span>
              <strong>Pontos sendo atualizados</strong>
              <p>Estamos cadastrando os endereços dos nossos parceiros. Volte em breve para encontrar o mais próximo.</p>
            </div>
          )}
          {list.map((point, index) => (
            <article className={styles.point} key={point.id}>
              <i>{index + 1}</i>
              <div><strong>{point.name}</strong><p>{point.address} · {point.neighborhood}</p><small className={point.available ? styles.available : ""}>{point.available ? "● Produto disponível" : "Consulte a disponibilidade"}</small></div>
              <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`}>Como chegar ↗</a>
            </article>
          ))}
        </div>

        <div className={styles.map}>
          {list.length > 0 ? (
            <MapView points={list.map((point, index) => ({ ...point, order: index + 1 }))} user={user} />
          ) : (
            <div className={styles.mapEmpty}><span>⌖</span><strong>O mapa aparecerá aqui</strong><p>Assim que os endereços dos parceiros forem cadastrados.</p></div>
          )}
        </div>
      </section>

      <footer className={styles.footer}><span>PAIEIRO MELIN</span><small>Produto destinado a maiores de 18 anos.</small></footer>
    </main>
  );
}

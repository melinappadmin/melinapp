"use client";

import { FormEvent, useState } from "react";

export default function Login({ success }: { success: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setError(
          payload?.error ??
            "O servidor não conseguiu concluir o login. Verifique a configuração da hospedagem.",
        );
        return;
      }

      success();
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === "AbortError"
          ? "O servidor demorou para responder. Verifique as variáveis de ambiente e reinicie a aplicação na Hostinger."
          : "Não foi possível conectar ao servidor. Tente novamente em instantes.",
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <img src="/logo.jpeg" alt="Paieiro Melin" />
        <span>GESTÃO INTELIGENTE</span>
        <h1>Melin APP</h1>
        <p>Estoque, clientes e reposições em um só lugar.</p>
      </section>
      <form className="login-card" onSubmit={submit}>
        <span>ACESSO RESTRITO</span>
        <h2>Entrar no painel</h2>
        <p>Use suas credenciais administrativas.</p>
        <label>
          E-mail
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Senha
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button className="primary" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

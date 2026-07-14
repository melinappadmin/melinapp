import { compare } from "bcryptjs";
import { cookie, makeSession } from "../../../../lib/server-auth";
import { serverSupabase } from "../../../../lib/server-supabase";

const attempts = new Map<string, { count: number; until: number }>();

export async function POST(request: Request) {
  try {
    const requiredVariables = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "ADMIN_PASSWORD",
      "PASSWORD",
    ].filter((name) => !process.env[name]);

    if (requiredVariables.length) {
      console.error("Melin APP: missing server environment variables", requiredVariables);
      return Response.json(
        { error: "A hospedagem ainda não está configurada. Revise as variáveis de ambiente e reinicie a aplicação." },
        { status: 503 },
      );
    }

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "local";
    const now = Date.now();
    const state = attempts.get(ip);

    if (state && state.count >= 5 && state.until > now) {
      return Response.json(
        { error: "Muitas tentativas. Aguarde 15 minutos." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const supabase = serverSupabase();
    const { data: user, error: databaseError } = await supabase
      .from("app_users")
      .select("email,password_hash,role,active")
      .eq("email", String(body.email).toLowerCase())
      .maybeSingle();

    if (databaseError) {
      console.error("Melin APP: login database error", databaseError.message);
      return Response.json(
        { error: "Não foi possível acessar o banco de dados. Confira a configuração do Supabase na Hostinger." },
        { status: 503 },
      );
    }

    if (!user || !user.active || !(await compare(String(body.password), user.password_hash))) {
      attempts.set(ip, {
        count: (state?.until || 0) > now ? (state?.count || 0) + 1 : 1,
        until: now + 15 * 60 * 1000,
      });
      return Response.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }

    attempts.delete(ip);
    return Response.json(
      { ok: true, role: user.role },
      { headers: { "Set-Cookie": cookie(await makeSession(user.email, user.role)) } },
    );
  } catch (error) {
    console.error("Melin APP: unexpected login error", error);
    return Response.json(
      { error: "Ocorreu uma falha no servidor durante o login. Reinicie a aplicação e tente novamente." },
      { status: 500 },
    );
  }
}

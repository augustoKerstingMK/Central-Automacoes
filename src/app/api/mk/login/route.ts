import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, senha, domain, todas } = body;

    if (!user || !senha || !domain) {
      return NextResponse.json(
        { error: "Credenciais e domínio são obrigatórios." },
        { status: 400 }
      );
    }

    if (!domain.startsWith("https://") || !domain.endsWith("/mk")) {
      return NextResponse.json(
        {
          error:
            "A URL do sistema precisa iniciar com https:// e finalizar com /mk.",
        },
        { status: 400 }
      );
    }

    const host = domain.replace(/https:\/\/|\/mk/g, "");
    const apiURL = `${domain}/logon.do`;

    const payload = new URLSearchParams();
    payload.append("host", host);
    payload.append("password", senha);
    payload.append("sys", "MK0");
    payload.append("user", user);

    if (todas === "Sim" || todas === true) {
      payload.append("dataConnection", "TODAS");
    }

    const response = await fetch(apiURL, {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Pretend to be a browser to avoid rejection blocks if the server is strict
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      // Important to catch the cookie before redirect/following it if needed. 
      redirect: "manual",
    });

    const setCookieHeader = response.headers.get("set-cookie");

    if (!setCookieHeader) {
      return NextResponse.json(
        { error: "Falha ao realizar login. Cookie não retornado." },
        { status: 401 }
      );
    }

    // Extract jsessionId
    const cookies = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9]+=)/);
    const sessionCookieStr = cookies.find((c) => c.includes("JSESSIONID"));

    if (!sessionCookieStr) {
      return NextResponse.json(
        { error: "JSESSIONID não encontrado no cookie." },
        { status: 401 }
      );
    }

    const jsessionId = sessionCookieStr.split(";")[0].trim();

    return NextResponse.json({ jsessionId });
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Erro interno no proxy de login.", details: error.message },
      { status: 500 }
    );
  }
}

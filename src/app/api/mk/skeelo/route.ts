import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, domain, contrato } = body;

    if (!token || !domain || !contrato) {
      return NextResponse.json(
        {
          error: "Token de sessão, domínio e ID do contrato são obrigatórios.",
        },
        { status: 400 },
      );
    }

    const apiURL = `${domain}/executeRule.do`;

    const payload = new URLSearchParams();
    payload.append("P_0", contrato.toString());
    payload.append("P_1", "ATIVAR_CLIENTE");
    payload.append("action", "executeRule");
    payload.append("pType", "2");
    payload.append("ruleName", "SKEELO - Inativa/Ativa Contrato");
    payload.append("sys", "MK0");
    payload.append("formID", "464570447");

    const response = await fetch(apiURL, {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: token,
      },
    });

    const responseText = await response.text();

    if (responseText.toLowerCase().includes("sucesso")) {
      return NextResponse.json({
        success: true,
        message: "Contrato ativado com sucesso.",
        raw: responseText,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: responseText || "Resposta inconsistente da API MK.",
        raw: responseText,
      });
    }
  } catch (error: any) {
    console.error("Erro na API de Sincronização Skeelo:", error);
    return NextResponse.json(
      { error: "Falha de conexão com MK", details: error.message },
      { status: 500 },
    );
  }
}

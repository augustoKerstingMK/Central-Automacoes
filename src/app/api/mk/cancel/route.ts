import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, domain, nota } = body;

    if (!token || !domain || !nota) {
      return NextResponse.json(
        { error: "Token, domínio e número da nota são obrigatórios." },
        { status: 400 }
      );
    }

    const syncUrl = `${domain}/executeRule.do`;

    // Passo 1: Subir nota para a sessão
    const payloadSubir = new URLSearchParams();
    payloadSubir.append("action", "executeRule");
    payloadSubir.append("sys", "MK0");
    payloadSubir.append("pType", "2");
    payloadSubir.append("ruleName", "invoices_nfse_cancelar");
    payloadSubir.append("formID", "464570144");
    payloadSubir.append("P_0", `{"codigo":"${nota}","codigoIn":[${nota}]}`);

    const resSubir = await fetch(syncUrl, {
      method: "POST",
      body: payloadSubir,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: token,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!resSubir.ok) {
      throw new Error(`Erro ao preparar nota ${nota}: HTTP ${resSubir.status}`);
    }

    // O script original não lê a resposta de subirNotaSessao de forma impeditiva, 
    // apenas executa o passo 2 em seguida. Vamos checar o texto só por debug se necessário.
    await resSubir.text();

    // Passo 2: Efetivar cancelamento
    const payloadCancelar = new URLSearchParams();
    payloadCancelar.append("iframeId", "RULE3065927");
    payloadCancelar.append("sys", "MK0");
    payloadCancelar.append("formID", "464570144");
    payloadCancelar.append("action", "executeRule");
    payloadCancelar.append("ruleName", "nfse_cancelar");
    payloadCancelar.append("P_0", "Cancelado pois haviam erros no documento.");
    payloadCancelar.append("P_1", "1");
    payloadCancelar.append("P_2", "S");
    payloadCancelar.append("P_3", "");

    const resCancelar = await fetch(syncUrl, {
      method: "POST",
      body: payloadCancelar,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: token,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!resCancelar.ok) {
      throw new Error(`Erro ao cancelar nota ${nota}: HTTP ${resCancelar.status}`);
    }

    const resultadoTexto = await resCancelar.text();

    if (
      resultadoTexto.includes("sucesso") ||
      resultadoTexto.toLowerCase().includes("sucesso")
    ) {
      return NextResponse.json({ success: true, message: resultadoTexto });
    } else {
      // Pode não ser erro fatal, mas não teve a palavra 'sucesso' (status 'yellow' na planilha original)
      return NextResponse.json({ success: false, message: resultadoTexto });
    }
  } catch (error: any) {
    console.error("Cancel route error:", error);
    return NextResponse.json(
      { error: "Erro na comunicação com MK Solutions.", details: error.message },
      { status: 500 }
    );
  }
}

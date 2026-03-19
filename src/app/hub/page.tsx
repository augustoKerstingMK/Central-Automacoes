"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Receipt, Blocks, ArrowLeft, FileText, XCircle, Building2, Zap, Radio, Tv } from "lucide-react";

export default function HubPage() {
  const router = useRouter();
  const [domain, setDomain] = useState<string | null>(null);
  
  // States to control the menus
  const [activeMenu, setActiveMenu] = useState<"main" | "notas" | "integracoes">("main");

  useEffect(() => {
    const storedToken = sessionStorage.getItem("mk_token");
    const storedDomain = sessionStorage.getItem("mk_domain");

    if (!storedToken || !storedDomain) {
      toast.error("Sessão inválida. Faça login novamente.");
      router.push("/");
    } else {
      setDomain(storedDomain);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  if (!domain) return null; // Wait for session check

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 font-inter text-[#414040]">
      <div className="max-w-5xl mx-auto space-y-8 mt-10">
        
        {/* Header Corporation */}
        <header className="flex justify-between items-center bg-white p-5 rounded-lg border border-gray-200/60 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-[#414040] tracking-tight">Central de Automações</h1>
            <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">
              {domain?.replace('https://', '').split('/')[0].toLocaleLowerCase()}
            </p>
          </div>
          <Button variant="outline" className="border-gray-300 text-[#414040] hover:bg-[#f3f3f3]" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair do Sistema
          </Button>
        </header>

        {/* Dynamic Content Area */}
        <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm p-8 min-h-[400px]">
          
          {/* Main Menu State */}
          {activeMenu === "main" && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="text-center mb-10">
                <h2 className="text-xl font-semibold text-[#414040]">Selecione um Módulo</h2>
                <p className="text-gray-500 mt-2">Escolha a categoria de automação que deseja acessar.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Notas Fiscais Module */}
                <Card 
                  className="cursor-pointer hover:border-[#15864d] hover:shadow-md transition-all group border-gray-200"
                  onClick={() => setActiveMenu("notas")}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 mx-auto bg-[#f0f7fa] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Receipt className="w-8 h-8 text-[#15864d]" />
                    </div>
                    <CardTitle className="text-lg">Notas Fiscais</CardTitle>
                    <CardDescription>
                      Gerenciamento e cancelamento em lote
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Integrations Module */}
                <Card 
                  className="cursor-pointer hover:border-[#febb22] hover:shadow-md transition-all group border-gray-200"
                  onClick={() => setActiveMenu("integracoes")}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 mx-auto bg-[#fff9ea] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Blocks className="w-8 h-8 text-[#febb22]" />
                    </div>
                    <CardTitle className="text-lg">Integrações</CardTitle>
                    <CardDescription>
                      Comunicação com sistemas de terceiros
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          )}

          {/* Notas Fiscais Submenu State */}
          {activeMenu === "notas" && (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
              
              <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                <Button 
                  variant="ghost" 
                  className="mr-4 text-gray-500 hover:text-[#15864d] hover:bg-gray-100"
                  onClick={() => setActiveMenu("main")}
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Voltar
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-[#414040] flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-[#15864d]" />
                    Automações de Notas Fiscais
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Tool: Cancelamento NFSE (MK) */}
                <Card 
                  className="cursor-pointer border-[#15864d]/30 hover:border-[#15864d] hover:shadow-md transition-all relative overflow-hidden"
                  onClick={() => router.push("/automations/notas-fiscais/mk-nfse")}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#15864d]/10 rounded-bl-full -mr-8 -mt-8" />
                  <CardContent className="pt-6">
                    <div className="flex items-start flex-col gap-4">
                      <div className="w-12 h-12 bg-[#e8f5ed] rounded-lg flex items-center justify-center shrink-0">
                        <XCircle className="w-6 h-6 text-[#15864d]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#414040] text-lg">Cancelamento NFSE</h3>
                        <p className="text-xs font-semibold text-[#15864d] mb-2 uppercase tracking-wide">Sistema MK</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Cancela Notas Fiscais de Serviço diretamente na base do MK Solutions em lote.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inactive Tool: Cancelamento NFE (MK) */}
                <Card className="border-dashed border-gray-200 opacity-60 cursor-not-allowed">
                  <CardContent className="pt-6">
                    <div className="flex items-start flex-col gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 grayscale opacity-50">
                        <FileText className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-500 text-lg">Cancelamento NFE</h3>
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Sistema MK</p>
                        <p className="text-sm text-gray-400 mt-1">
                          (Em desenvolvimento)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inactive Tool: Cancelamento NFSE (Prefeitura) */}
                <Card className="border-dashed border-gray-200 opacity-60 cursor-not-allowed">
                  <CardContent className="pt-6">
                    <div className="flex items-start flex-col gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 grayscale opacity-50">
                        <Building2 className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-500 text-lg">Cancelamento NFSE</h3>
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Prefeitura</p>
                        <p className="text-sm text-gray-400 mt-1">
                          (Em desenvolvimento)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}

          {/* Integrações Submenu State */}
          {activeMenu === "integracoes" && (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
              
              <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                <Button 
                  variant="ghost" 
                  className="mr-4 text-gray-500 hover:text-[#febb22] hover:bg-[#fff9ea]"
                  onClick={() => setActiveMenu("main")}
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Voltar
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-[#414040] flex items-center">
                    <Blocks className="w-5 h-5 mr-2 text-[#febb22]" />
                    Módulo de Integrações
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Tool: Sincronizador Skeelo */}
                <Card 
                  className="cursor-pointer border-[#febb22]/30 hover:border-[#febb22] hover:shadow-md transition-all relative overflow-hidden"
                  onClick={() => router.push("/automations/integracoes/skeelo")}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#febb22]/10 rounded-bl-full -mr-8 -mt-8" />
                  <CardContent className="pt-6">
                    <div className="flex items-start flex-col gap-4">
                      <div className="w-12 h-12 bg-[#fff9ea] rounded-lg flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6 text-[#febb22]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#414040] text-lg">Sincronizador Skeelo</h3>
                        <p className="text-xs font-semibold text-[#e0a41d] mb-2 uppercase tracking-wide">Plataforma de Leitura</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Sincroniza e ativa contratos Skeelo no painel MK Solutions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Tool: Sincronizador Playhub */}
                <Card 
                  className="cursor-pointer border-[#15864d]/30 hover:border-[#15864d] hover:shadow-md transition-all relative overflow-hidden"
                  onClick={() => router.push("/automations/integracoes/playhub")}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#15864d]/10 rounded-bl-full -mr-8 -mt-8" />
                  <CardContent className="pt-6">
                    <div className="flex items-start flex-col gap-4">
                      <div className="w-12 h-12 bg-[#eefbf2] rounded-lg flex items-center justify-center shrink-0">
                        <Tv className="w-6 h-6 text-[#15864d]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#414040] text-lg">Sincronizador Playhub</h3>
                        <p className="text-xs font-semibold text-[#127040] mb-2 uppercase tracking-wide">Conteúdo Multimídia</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Sincroniza e ativa contratos Playhub (SVAs).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Tool: Sincronizador WatchTV */}
                <Card 
                  className="cursor-pointer border-[#15864d]/30 hover:border-[#15864d] hover:shadow-md transition-all relative overflow-hidden"
                  onClick={() => router.push("/automations/integracoes/watch")}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#15864d]/10 rounded-bl-full -mr-8 -mt-8" />
                  <CardContent className="pt-6">
                    <div className="flex items-start flex-col gap-4">
                      <div className="w-12 h-12 bg-[#eefbf2] rounded-lg flex items-center justify-center shrink-0">
                        <Tv className="w-6 h-6 text-[#15864d]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#414040] text-lg">Sincronizador WatchTV</h3>
                        <p className="text-xs font-semibold text-[#127040] mb-2 uppercase tracking-wide">Streaming & TV</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Sincroniza e ativa contratos WatchTV no painel MK Solutions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Play, Square, Pause, LogOut, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Info, FileText, FileSpreadsheet, Trash2, BarChart2, ArrowLeft } from "lucide-react";

type NotaStatus = "pending" | "running" | "success" | "warning" | "error" | "stopped";

interface NotaTask {
  id: string;
  status: NotaStatus;
  message: string;
}

interface LogEntry {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  notaId?: string;
}

export default function MkNfseCancelPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);

  const [rawInput, setRawInput] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const [tasks, setTasks] = useState<NotaTask[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState("fila");
  
  const isPausedRef = useRef(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("mk_token");
    const storedDomain = sessionStorage.getItem("mk_domain");

    if (!storedToken || !storedDomain) {
      toast.error("Sessão inválida. Faça login novamente.");
      router.push("/");
    } else {
      setToken(storedToken);
      setDomain(storedDomain);
      addLog("info", `Sessão iniciada no domínio: ${storedDomain}`);
    }
  }, [router]);

  const addLog = (type: LogEntry["type"], message: string, notaId?: string) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString(),
        type,
        message,
        notaId,
      },
      ...prev,
    ]);
  };

  const loadIdsIntoFila = (ids: string[]) => {
    if (ids.length === 0) {
      toast.warning("Nenhum código válido encontrado.");
      return;
    }
    
    // Filtra IDs válidos (apenas números para garantir que são notas reais) e remove duplicados
    const validIds = Array.from(new Set(ids.filter(id => /^\d+$/.test(id))));
    
    if (validIds.length === 0) {
      toast.error("O formato dos dados parece inválido. Certifique-se de usar apenas números.");
      return;
    }

    const newTasks = validIds.map((id) => ({
      id,
      status: "pending" as NotaStatus,
      message: "",
    }));

    setTasks(newTasks);
    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    
    // Limpar estados de input
    setRawInput("");
    setCsvFile(null);
    let fileInput = document.getElementById("csv-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    addLog("info", `${newTasks.length} notas carregadas na fila para processamento.`);
    toast.success(`${newTasks.length} notas carregadas na fila.`);
  };

  const handleTextImport = () => {
    const lines = rawInput.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean);
    loadIdsIntoFila(lines);
  };

  const handleCsvImport = () => {
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        // Divide o texto do CSV por linhas
        const rows = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        
        let extractedIds: string[] = [];
        
        rows.forEach(row => {
          // Assume-se que o código da nota está sempre na 1ª coluna de cada linha (separado por vírgula ou ponto-e-vírgula)
          const columns = row.split(/[,;]/);
          if (columns.length > 0) {
            // Remove aspas e espaços
            const firstCol = columns[0].replace(/['"]/g, '').trim(); 
            if (firstCol) extractedIds.push(firstCol);
          }
        });
        
        // Se a primeira linha for cabeçalho não-numérico, será ignorado no regex do loadIdsIntoFila
        loadIdsIntoFila(extractedIds);
      }
    };
    reader.readAsText(csvFile);
  };

  const updateTask = (id: string, updates: Partial<NotaTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const processQueue = async () => {
    if (!token || !domain) return;
    
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    
    addLog("info", "Iniciando processamento em lote da fila...");
    let processedAny = false;

    for (let i = 0; i < tasks.length; i++) {
      if (isPausedRef.current) {
        addLog("warning", "Processamento pausado pelo usuário.");
        toast.info("Processamento pausado.");
        break;
      }

      const task = tasks[i];
      if (task.status === "success" || task.status === "error" || task.status === "warning") {
        continue;
      }

      processedAny = true;
      updateTask(task.id, { status: "running", message: "Acessando API..." });

      try {
        const res = await fetch("/api/mk/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, domain, nota: task.id }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          updateTask(task.id, { status: "success", message: data.message });
          addLog("success", `Operação concluída. Resposta: ${data.message}`, task.id);
        } else if (res.ok && !data.success) {
          updateTask(task.id, { status: "warning", message: data.message });
          addLog("warning", `Aviso recebido: ${data.message}`, task.id);
        } else {
          updateTask(task.id, { status: "error", message: data.error || data.message || "Erro desconhecido" });
          addLog("error", `Erro retornado: ${data.error || data.message || "Sem detalhes."}`, task.id);
        }
      } catch (err: any) {
        updateTask(task.id, { status: "error", message: err.message || "Falha de rede" });
        addLog("error", `Falha de conexão ou timeout: ${err.message}`, task.id);
      }
      
      await new Promise((r) => setTimeout(r, 600)); // Pequena margem para folga do backend
    }

    setIsRunning(false);
    if (!isPausedRef.current && processedAny) {
      addLog("info", "Fila rotulada foi finalizada por completo.");
      toast.success("Processamento finalizado!");
    }
  };

  const handleStart = () => {
    if (tasks.length === 0) return;
    processQueue();
  };

  const handleStop = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    addLog("warning", "Pausa solicitada. Parando após a requisição atual...");
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };
  
  const clearQueue = () => {
    setTasks([]);
    setIsRunning(false);
    toast.info("A fila de processamento foi esvaziada.");
    addLog("info", "Fila limpa pelo usuário.");
  };

  const getProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => ["success", "warning", "error"].includes(t.status)).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const renderStatusBadge = (status: NotaStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex w-[100px] justify-center text-[#414040] bg-[#f3f3f3] hover:bg-[#eaeaea] shadow-none"><Clock className="w-3 h-3 mr-1"/> Pendente</Badge>;
      case "running":
        return <Badge className="flex w-[100px] justify-center bg-blue-600 hover:bg-blue-700 shadow-none"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> Rodando</Badge>;
      case "success":
        return <Badge className="flex w-[100px] justify-center bg-[#15864d] hover:bg-[#127040] shadow-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Sucesso</Badge>;
      case "warning":
        return <Badge variant="outline" className="flex w-[100px] justify-center text-yellow-700 border-yellow-400 bg-yellow-50 shadow-none"><AlertTriangle className="w-3 h-3 mr-1"/> Aviso</Badge>;
      case "error":
        return <Badge variant="destructive" className="flex w-[100px] justify-center shadow-none"><XCircle className="w-3 h-3 mr-1"/> Erro</Badge>;
      case "stopped":
        return <Badge variant="secondary" className="flex w-[100px] justify-center text-[#414040] bg-[#f3f3f3] shadow-none"><Square className="w-3 h-3 mr-1"/> Parado</Badge>;
    }
  };

  const renderLogIcon = (type: LogEntry["type"]) => {
    switch(type) {
      case "info": return <Info className="w-4 h-4 text-blue-500 mt-0.5" />;
      case "success": return <CheckCircle2 className="w-4 h-4 text-[#15864d] mt-0.5" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />;
      case "error": return <XCircle className="w-4 h-4 text-red-600 mt-0.5" />;
    }
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 font-inter text-[#414040]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Corporation */}
        <header className="flex justify-between items-center bg-white p-5 rounded border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-gray-500 hover:text-[#205266] hover:bg-gray-100 p-2 h-auto" onClick={() => router.push("/hub")}>
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span className="font-medium">Voltar</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#414040] tracking-tight">Painel de Cancelamento</h1>
              <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">{domain?.replace('https://', '').split('/')[0].toLocaleLowerCase()}</p>
            </div>
          </div>
          <Button variant="outline" className="border-gray-300 text-[#414040] hover:bg-[#f3f3f3]" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair do Sistema
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Esquerda: Entrada de Dados e Ações */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Bloco Importações */}
            <div className="bg-white p-5 rounded border border-gray-200/60 shadow-sm">
              <h2 className="text-lg font-semibold text-[#414040] mb-3">Fonte dos Dados</h2>
              
              <Tabs defaultValue="texto" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-[#f3f3f3]">
                  <TabsTrigger value="texto" className="data-[state=active]:bg-white data-[state=active]:text-[#205266] data-[state=active]:shadow-sm">Texto</TabsTrigger>
                  <TabsTrigger value="csv" className="data-[state=active]:bg-white data-[state=active]:text-[#205266] data-[state=active]:shadow-sm">Planilha/CSV</TabsTrigger>
                </TabsList>
                
                <TabsContent value="texto" className="space-y-4">
                  <p className="text-sm text-gray-500">Cole os códigos separados por linha ou vírgula.</p>
                  <Textarea 
                    placeholder="Exemplo:&#10;85210&#10;85211&#10;85212" 
                    className="h-[180px] resize-none font-mono text-sm border-gray-300 focus-visible:ring-[#205266] bg-white text-[#414040]"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    disabled={isRunning}
                  />
                  <Button 
                    className="w-full bg-[#f3f3f3] hover:bg-[#e6e6e6] text-[#205266] border border-gray-200 shadow-none font-medium text-sm transition-colors rounded" 
                    onClick={handleTextImport} 
                    disabled={isRunning || !rawInput.trim()}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Enviar p/ Fila
                  </Button>
                </TabsContent>
                
                <TabsContent value="csv" className="space-y-4">
                  <p className="text-sm text-gray-500">
                    O ID da nota deve estar na <b>primeira coluna</b> do CSV (.csv). Ignoraremos letras.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Input 
                      id="csv-upload"
                      type="file" 
                      accept=".csv, .txt" 
                      className="cursor-pointer file:text-[#414040] file:bg-[#f3f3f3] file:mr-4 file:border-none file:px-4 file:rounded h-14 pt-3.5 border-gray-300 focus-visible:ring-[#205266]"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      disabled={isRunning}
                    />
                  </div>
                  <Button 
                    className="w-full bg-[#f3f3f3] hover:bg-[#e6e6e6] text-[#205266] border border-gray-200 shadow-none font-medium text-sm transition-colors rounded" 
                    onClick={handleCsvImport} 
                    disabled={isRunning || !csvFile}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Extrair Coluna p/ Fila
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Bloco Controles do Lote */}
            <div className="bg-white p-5 rounded border border-gray-200/60 shadow-sm">
              <h2 className="text-sm font-semibold text-[#414040] mb-3 uppercase tracking-wider">Ações de Lote</h2>
              
              <div className="pb-4">
                <div className="flex justify-between text-xs font-semibold text-[#414040] mb-1.5">
                  <span>Progresso da Fila Atual</span>
                  <span>{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2 bg-[#f3f3f3]" />
              </div>

              {!isRunning ? (
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleStart} 
                    disabled={tasks.length === 0 || getProgress() === 100} 
                    className="w-full bg-[#205266] hover:bg-[#163c4a] text-white shadow-none font-medium h-10 rounded"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Lote
                  </Button>
                  
                  {tasks.length > 0 && (
                    <Button 
                      onClick={clearQueue} 
                      variant="ghost" 
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 shadow-none font-medium h-10 rounded border border-transparent"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Fila Atual
                    </Button>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={handleStop} 
                  variant="destructive" 
                  className="w-full shadow-none font-medium h-10 rounded bg-red-600 hover:bg-red-700"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Interromper
                </Button>
              )}
            </div>
          </div>

          {/* Direita: Visão Larga (Fila vs Logs) */}
          <div className="md:col-span-3 bg-white border border-gray-200/60 rounded flex flex-col shadow-sm overflow-hidden h-[750px] relative">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full h-full relative">
              
              <div className="px-5 pt-4 border-b border-gray-200 bg-white shadow-[0_4px_15px_-5px_rgba(0,0,0,0.03)] z-20">
                <TabsList className="bg-transparent p-0 pl-1 h-auto flex justify-start space-x-6">
                  <TabsTrigger 
                    value="fila" 
                    className="!data-active:bg-transparent !data-active:shadow-none data-active:border-b-[3px] data-active:border-b-[#15864d] data-active:font-bold  
                              not-data-active:border-b-transparent not-data-active:text-gray-400 bg-transparent rounded-none px-2 py-3 text-[15px] shadow-none transition-all flex items-center focus:ring-0 focus-visible:ring-0 -mb-[1px]"
                  >
                    Lista de Execução
                    <Badge variant="secondary" className="ml-2 bg-[#f3f3f3] text-[#414040] border-none font-semibold tabular-nums px-2 py-0">
                      {tasks.length}
                    </Badge>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="logs" 
                    className="!data-active:bg-transparent !data-active:shadow-none data-active:border-b-[3px] data-active:border-b-[#15864d] data-active:font-bold 
                              not-data-active:border-b-transparent not-data-active:text-gray-400 bg-transparent rounded-none px-2 py-3 text-[15px] shadow-none transition-all flex items-center focus:ring-0 focus-visible:ring-0 -mb-[1px]"
                  >
                    Acompanhar Logs
                    {logs.length > 0 && (
                      <Badge variant="secondary" className={`ml-2 border-none font-semibold tabular-nums px-2 py-0 ${
                        logs.some(l => l.type === 'error') ? 'bg-red-100 text-red-700' : 'bg-[#f3f3f3] text-[#414040]'
                      }`}>
                        {logs.length}
                      </Badge>
                    )}
                  </TabsTrigger>

                  <TabsTrigger 
                    value="metricas" 
                    className="!data-active:bg-transparent !data-active:shadow-none data-active:border-b-[3px] data-active:border-b-[#15864d] data-active:font-bold 
                              not-data-active:border-b-transparent not-data-active:text-gray-400 bg-transparent rounded-none px-2 py-3 text-[15px] shadow-none transition-all flex items-center focus:ring-0 focus-visible:ring-0 -mb-[1px]"
                  >
                    Métricas e Erros
                    {tasks.filter(t => t.status === "error").length > 0 && (
                      <Badge variant="destructive" className="ml-2 border-none font-semibold tabular-nums px-2 py-0">
                        {tasks.filter(t => t.status === "error").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden bg-white z-10 relative">
                {/* TAB FILA */}
                <TabsContent value="fila" className="h-full w-full m-0 border-none p-0 data-[state=inactive]:hidden data-[state=active]:flex flex-col">
                  <div className="flex-1 h-full overflow-y-auto custom-scrollbar w-full relative">
                    <Table className="w-full border-b-0">
                      <TableHeader className="bg-white sticky top-0 z-10 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                        <TableRow className="hover:bg-transparent border-gray-200">
                          <TableHead className="w-[150px] font-semibold text-[#414040] py-4 px-6 bg-white">Identificador</TableHead>
                          <TableHead className="w-[150px] font-semibold text-[#414040] py-4 text-center bg-white">Situação Ativa</TableHead>
                          <TableHead className="font-semibold text-[#414040] py-4 px-6 bg-white">Diagnóstico MK</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.length === 0 ? (
                          <TableRow className="hover:bg-transparent border-0">
                            <TableCell colSpan={3} className="h-64 text-center text-gray-400 font-medium">
                              Lista vazia. Adicione IDs na aba lateral e clique em Enviar.
                            </TableCell>
                          </TableRow>
                        ) : (
                          tasks.map((task, index) => (
                            <TableRow key={`${task.id}-${index}`} className="transition-all hover:bg-gray-50 border-gray-100/80 group">
                              <TableCell className="font-medium text-[#414040] px-6 py-3.5 tabular-nums transition-colors group-hover:text-[#205266]">{task.id}</TableCell>
                              <TableCell className="flex justify-center py-3.5">{renderStatusBadge(task.status)}</TableCell>
                              <TableCell className="text-sm text-gray-500 py-3.5 px-6 leading-relaxed break-words max-w-[400px]">
                                {task.message || <span className="text-gray-300 italic">Aguardando...</span>}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* TAB LOGS */}
                <TabsContent value="logs" className="h-full w-full m-0 border-none p-0 data-[state=inactive]:hidden data-[state=active]:flex flex-col bg-gray-50/30">
                  <div className="flex-1 h-full w-full overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-3">
                      {logs.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 font-medium">
                          Nenhum evento registrado na sessão corrente.
                        </div>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="flex gap-4 text-sm p-4 bg-white border border-gray-100 rounded-md shadow-sm transition-all hover:border-gray-200 hover:shadow">
                            <div className="shrink-0">{renderLogIcon(log.type)}</div>
                            <div className="flex-1 flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <span className={`font-semibold tracking-tight ${
                                  log.type === 'error' ? 'text-red-700' :
                                  log.type === 'warning' ? 'text-yellow-700' :
                                  log.type === 'success' ? 'text-[#15864d]' : 'text-[#205266]'
                                }`}>
                                  {log.notaId ? `Requisição ${log.notaId}` : 'Aviso do Sistema'}
                                </span>
                                <span className="text-xs font-medium text-gray-400 tabular-nums">{log.time}</span>
                              </div>
                              <span className="text-[#414040]/90 leading-relaxed font-normal">{log.message}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB MÉTRICAS / DASHBOARD */}
                <TabsContent value="metricas" className="h-full w-full m-0 border-none p-0 data-[state=inactive]:hidden data-[state=active]:flex flex-col bg-gray-50/30">
                  <div className="flex-1 h-full w-full overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-6">
                      
                      {/* Grid de Cards Resumo */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="shadow-sm border-gray-200/60 bg-white hover:border-gray-300 transition-colors">
                          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Total na Fila</CardTitle>
                            <FileText className="h-4 w-4 text-gray-400" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-[#414040]">{tasks.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Notas alocadas</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="shadow-sm border-gray-200/60 bg-white hover:border-[#15864d]/30 transition-colors">
                          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Concluídas</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-[#15864d]" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-[#15864d]">
                              {tasks.filter(t => t.status === "success").length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Faltam {tasks.filter(t => t.status === "pending" || t.status === "running").length}
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="shadow-sm border-gray-200/60 bg-white hover:border-yellow-300 transition-colors">
                          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Avisos Gerados</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                              {tasks.filter(t => t.status === "warning").length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Processadas com ressalvas</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="shadow-sm border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors">
                          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-red-600">Falhas Totais</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                              {tasks.filter(t => t.status === "error").length}
                            </div>
                            <p className="text-xs text-red-500/80 mt-1">Requerem atenção manual</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Lista Focal de Erros */}
                      <Card className="shadow-sm border-gray-200/60 bg-white mt-6">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                          <CardTitle className="text-base text-[#414040] flex items-center">
                            <XCircle className="h-4 w-4 text-red-600 mr-2" />
                            Relatório Detalhado de Falhas
                          </CardTitle>
                          <CardDescription>
                            Abaixo estão as notas que retornaram erro e não puderam ser processadas pela API do MK.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table className="w-full">
                            <TableHeader className="bg-[#fafafa]">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[120px] font-medium text-[#414040] px-6">Nota com Falha</TableHead>
                                <TableHead className="font-medium text-[#414040]">Motivo Registrado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tasks.filter(t => t.status === "error").length === 0 ? (
                                <TableRow className="hover:bg-transparent border-0">
                                  <TableCell colSpan={2} className="h-32 text-center text-gray-400 font-medium">
                                    Nenhum erro registrado até o momento. Excelente!
                                  </TableCell>
                                </TableRow>
                              ) : (
                                tasks.filter(t => t.status === "error").map((task, index) => (
                                  <TableRow key={`err-${task.id}-${index}`} className="hover:bg-red-50/50 transition-colors">
                                    <TableCell className="font-bold text-red-700 py-4 px-6">{task.id}</TableCell>
                                    <TableCell className="text-sm text-[#414040] py-4 break-words max-w-[600px]">
                                      {task.message}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                    </div>
                  </div>
                </TabsContent>
              </div>
              
            </Tabs>
          </div>

        </div>
      </div>
    </div>
  );
}

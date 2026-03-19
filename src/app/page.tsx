"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    domain: "",
    user: "",
    password: "",
    todas: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/mk/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: formData.domain,
          user: formData.user,
          senha: formData.password,
          todas: formData.todas ? "Sim" : "Nao",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar login");
      }

      sessionStorage.setItem("mk_token", data.jsessionId);
      sessionStorage.setItem("mk_domain", formData.domain);
      toast.success("Conexão estabelecida com sucesso!");
      router.push("/hub");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4 font-inter text-[#414040]">
      <Card className="w-full max-w-md shadow-lg border-gray-200/60 bg-white">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-[#414040]">
            MK Solutions
          </CardTitle>
          <CardDescription className="text-gray-500 text-[15px]">
            Insira suas credenciais para gerenciar o cancelamento de notas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-[#414040] font-medium">URL do Sistema (Domínio)</Label>
              <Input
                id="domain"
                name="domain"
                placeholder="https://demo.mksolutions.com.br/mk"
                required
                value={formData.domain}
                onChange={handleChange}
                disabled={loading}
                className="border-gray-300 focus-visible:ring-[#205266] bg-white text-[#414040] h-11"
              />
              <p className="text-xs text-muted-foreground">
                Iniciando com <span className="font-mono">https://</span> e finalizando com <span className="font-mono">/mk</span>
              </p>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="user" className="text-[#414040] font-medium">Usuário</Label>
              <Input
                id="user"
                name="user"
                placeholder="seu.usuario"
                required
                value={formData.user}
                onChange={handleChange}
                disabled={loading}
                className="border-gray-300 focus-visible:ring-[#205266] bg-white text-[#414040] h-11"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="password" className="text-[#414040] font-medium">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="border-gray-300 focus-visible:ring-[#205266] bg-white text-[#414040] h-11"
              />
            </div>

            <div className="flex items-center space-x-2 pt-4 pb-2">
              <Checkbox
                id="todas"
                checked={formData.todas}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    todas: checked as boolean,
                  }))
                }
                disabled={loading}
                className="data-[state=checked]:bg-[#15864d] data-[state=checked]:border-[#15864d]"
              />
              <Label
                htmlFor="todas"
                className="text-[14px] text-gray-600 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Conectar a TODAS (Data Connection)
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-[#15864d] hover:bg-[#127040] text-white shadow-none font-medium h-11 text-base transition-colors rounded"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Acessar Sistema"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Upload, Loader2, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import * as XLSX from "xlsx";

type Msg = { role: "user" | "assistant"; content: string; fileName?: string };
type SaveAction = {
  action: string;
  building: string;
  category: string;
  subcategory?: string;
  issued_at?: string;
  expires_at?: string;
  responsible_company?: string;
  status?: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portfolio-ai-chat`;
const SAVE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-document`;

function parseSaveAction(text: string): SaveAction | null {
  const match = text.match(/```json_save_action\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed.action === "save_document") return parsed;
  } catch { /* ignore */ }
  return null;
}

function stripSaveAction(text: string): string {
  return text.replace(/```json_save_action\s*[\s\S]*?```/g, "").trim();
}

async function streamChat({
  messages, fileBase64, fileName, onDelta, onDone, onError,
}: {
  messages: Msg[]; fileBase64?: string; fileName?: string;
  onDelta: (text: string) => void; onDone: () => void; onError: (err: string) => void;
}) {
  try {
    const body: any = { messages: messages.map((m) => ({ role: m.role, content: m.content })) };
    if (fileBase64 && fileName) { body.fileBase64 = fileBase64; body.fileName = fileName; }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
      onError(errorData.error || `Erro ${resp.status}`);
      return;
    }
    if (!resp.body) { onError("Stream não disponível"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Erro de conexão");
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function parseExcelToText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  let text = "";
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    text += `## Planilha: ${sheetName}\n` + XLSX.utils.sheet_to_csv(sheet) + "\n\n";
  }
  return text;
}

function SaveConfirmationCard({ action, onConfirm, onDismiss, saving }: {
  action: SaveAction; onConfirm: () => void; onDismiss: () => void; saving: boolean;
}) {
  return (
    <div className="bg-accent/50 border border-border rounded-lg p-3 space-y-2 my-2">
      <p className="text-sm font-medium">📁 Salvar documento automaticamente?</p>
      <div className="text-xs space-y-1 text-muted-foreground">
        <p><strong>Ativo:</strong> {action.building}</p>
        <p><strong>Categoria:</strong> {action.category}</p>
        {action.subcategory && <p><strong>Subcategoria:</strong> {action.subcategory}</p>}
        {action.responsible_company && <p><strong>Empresa:</strong> {action.responsible_company}</p>}
        {action.issued_at && <p><strong>Emissão:</strong> {new Date(action.issued_at).toLocaleDateString("pt-BR")}</p>}
        {action.expires_at && <p><strong>Vencimento:</strong> {new Date(action.expires_at).toLocaleDateString("pt-BR")}</p>}
        {action.status && <p><strong>Status:</strong> {action.status}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm} disabled={saving} className="h-7 text-xs">
          {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : <Check size={12} className="mr-1" />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={saving} className="h-7 text-xs">
          <X size={12} className="mr-1" /> Ignorar
        </Button>
      </div>
    </div>
  );
}

export default function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{ action: SaveAction; fileBase64: string; fileName: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<{ base64: string; name: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingSave]);

  const send = async (text: string, fileBase64?: string, fileName?: string) => {
    if ((!text.trim() && !fileBase64) || isLoading) return;
    if (fileBase64 && fileName) {
      lastFileRef.current = { base64: fileBase64, name: fileName };
    }
    const userMsg: Msg = { role: "user", content: text, fileName };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsLoading(true);
    setPendingSave(null);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: allMsgs, fileBase64, fileName,
      onDelta: upsert,
      onDone: () => {
        setIsLoading(false);
        const saveAction = parseSaveAction(assistantSoFar);
        if (saveAction && lastFileRef.current) {
          setPendingSave({ action: saveAction, fileBase64: lastFileRef.current.base64, fileName: lastFileRef.current.name });
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 && m.role === "assistant" ? { ...m, content: stripSaveAction(m.content) } : m
          ));
        }
      },
      onError: (err) => { toast.error(err); setIsLoading(false); },
    });
  };

  const handleSaveDocument = async () => {
    if (!pendingSave) return;
    setSaving(true);
    try {
      const { action, fileBase64, fileName } = pendingSave;
      const resp = await fetch(SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          fileBase64, fileName,
          buildingId: action.building,
          category: action.category,
          subcategory: action.subcategory,
          issuedAt: action.issued_at,
          expiresAt: action.expires_at,
          responsibleCompany: action.responsible_company,
          status: action.status,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro ao salvar");
      toast.success(`✅ ${data.message}`);
      setPendingSave(null);
      setMessages(prev => [...prev, { role: "assistant", content: `✅ Documento **${fileName}** salvo com sucesso em **${action.building} > ${action.category}${action.subcategory ? ` > ${action.subcategory}` : ""}**.` }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar documento");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("Arquivo muito grande (máx. 15MB)"); return; }
    setProcessingFile(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext)) {
        const base64 = await readFileAsBase64(file);
        setProcessingFile(null);
        await send(`📎 Analise este documento: **${file.name}**`, base64, file.name);
      } else if (["xlsx", "xls"].includes(ext)) {
        const text = await parseExcelToText(file);
        const base64 = await readFileAsBase64(file);
        lastFileRef.current = { base64, name: file.name };
        setProcessingFile(null);
        await send(`📎 Analise esta planilha: **${file.name}**\n\n${text}`, undefined, file.name);
      } else if (ext === "csv") {
        const text = await readFileAsText(file);
        const base64 = await readFileAsBase64(file);
        lastFileRef.current = { base64, name: file.name };
        setProcessingFile(null);
        await send(`📎 Analise este CSV: **${file.name}**\n\n${text}`, undefined, file.name);
      } else {
        toast.error("Formato não suportado. Use PDF, imagem, Excel ou CSV.");
        setProcessingFile(null);
      }
    } catch (err) {
      console.error("File processing error:", err);
      toast.error("Erro ao processar arquivo");
      setProcessingFile(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-105">
          <Bot size={24} />
        </button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-[400px] flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot size={18} className="text-primary" /> Assistente IA
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">Olá! Sou o assistente do portfólio.</p>
                <p className="text-xs mt-1">Pergunte sobre contratos, ativos, financeiro ou envie documentos para análise e arquivamento automático.</p>
                <div className="mt-4 space-y-1.5">
                  {["Quantos contratos vencem neste mês?", "Qual a vacância atual do portfólio?", "Resumo financeiro do Chucri Zaidan"].map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-muted transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
                  <FileText size={16} className="mx-auto mb-1 text-muted-foreground/70" />
                  <p className="text-xs text-muted-foreground">
                    Envie PDFs, imagens, planilhas ou CSVs — eu analiso e salvo na pasta correta automaticamente.
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : <p>{msg.content}</p>}
                </div>
              </div>
            ))}
            {pendingSave && (
              <SaveConfirmationCard
                action={pendingSave.action}
                onConfirm={handleSaveDocument}
                onDismiss={() => setPendingSave(null)}
                saving={saving}
              />
            )}
            {processingFile && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Processando {processingFile}...
                </div>
              </div>
            )}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t px-3 py-3 flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !!processingFile} title="Enviar documento (PDF, imagem, Excel, CSV)">
              <Upload size={16} />
            </Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Pergunte ou envie um documento..." className="h-9 text-sm" disabled={isLoading || !!processingFile} />
            <Button size="icon" className="shrink-0 h-9 w-9" onClick={() => send(input)}
              disabled={!input.trim() || isLoading || !!processingFile}>
              <Send size={16} />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

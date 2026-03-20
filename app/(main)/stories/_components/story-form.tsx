"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useForm,
  useFieldArray,
  useFormContext,
  FormProvider,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { createStory, updateStory } from "@/lib/actions/story";
import {
  storyFormSchema,
  type StoryFormValues,
} from "@/lib/validations/story";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Upload,
  X,
  Loader2,
  Save,
  Send,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Step indicator ── */

const STEPS = [
  { num: 1, label: "기본 정보" },
  { num: 2, label: "여정 (Journey)" },
  { num: 3, label: "기술 구현 요소" },
  { num: 4, label: "참고 이미지" },
] as const;

function StepIndicator({ current, onStepClick }: { current: number; onStepClick: (s: number) => void }) {
  return (
    <nav className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((s, idx) => (
        <button key={s.num} type="button" onClick={() => onStepClick(s.num)} className="flex items-center gap-1.5 sm:gap-2 group">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors", current === s.num ? "bg-primary text-primary-foreground" : current > s.num ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{s.num}</span>
          <span className={cn("hidden text-sm font-medium sm:inline", current === s.num ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
          {idx < STEPS.length - 1 && <Separator className="hidden w-6 sm:block" />}
        </button>
      ))}
    </nav>
  );
}

/* ── Step 1 ── */

function BasicInfoStep() {
  const { register, formState: { errors } } = useFormContext<StoryFormValues>();
  return (
    <Card>
      <CardHeader><CardTitle>기본 정보</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">경험 아이디어 제목 <span className="text-destructive">*</span></Label>
          <Input id="title" placeholder="예: 커넥티드카 쇼핑 경험" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposer_name">제안자 이름</Label>
          <Input id="proposer_name" placeholder="자동 입력됨" {...register("proposer_name")} />
          {errors.proposer_name && <p className="text-sm text-destructive">{errors.proposer_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">메모 (선택)</Label>
          <textarea id="note" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="추가 메모사항을 입력하세요" {...register("note")} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Nested user-story texts ── */

function UserStoryTexts({ stageIndex }: { stageIndex: number }) {
  const { register, control, formState: { errors } } = useFormContext<StoryFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: `stages.${stageIndex}.user_story_texts` });
  const stageErrors = errors.stages?.[stageIndex];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">User Story 항목</Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => append({ value: "" })} className="h-7 gap-1 text-xs"><Plus className="h-3 w-3" />항목 추가</Button>
      </div>
      {fields.map((field, textIdx) => (
        <div key={field.id} className="flex items-start gap-2">
          <span className="mt-2.5 text-xs text-muted-foreground shrink-0">{textIdx + 1}.</span>
          <div className="flex-1">
            <Input placeholder="사용자가 ~를 한다" {...register(`stages.${stageIndex}.user_story_texts.${textIdx}.value`)} className="h-9 text-sm" />
            {(stageErrors?.user_story_texts as Record<string, { value?: { message?: string } }> | undefined)?.[textIdx]?.value && (
              <p className="mt-1 text-xs text-destructive">{(stageErrors?.user_story_texts as Record<string, { value?: { message?: string } }>)?.[textIdx]?.value?.message}</p>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => fields.length > 1 && remove(textIdx)} disabled={fields.length <= 1}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
      {stageErrors?.user_story_texts?.message && <p className="text-xs text-destructive">{stageErrors.user_story_texts.message}</p>}
    </div>
  );
}

/* ── Step 2 ── */

function StagesStep() {
  const { control, register, formState: { errors } } = useFormContext<StoryFormValues>();
  const { fields, append, remove, swap } = useFieldArray({ control, name: "stages" });
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const toggleCollapse = (i: number) => setCollapsed((p) => ({ ...p, [i]: !p[i] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">여정 (Journey)</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => fields.length < 6 && append({ stage_name: "", user_story_texts: [{ value: "" }] })} disabled={fields.length >= 6} className="gap-1"><Plus className="h-4 w-4" />여정 추가 ({fields.length}/6)</Button>
      </div>
      {errors.stages?.message && <p className="text-sm text-destructive">{errors.stages.message}</p>}
      {fields.length === 0 && (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground"><p className="text-sm">아직 추가된 여정이 없습니다.</p><Button type="button" variant="outline" size="sm" className="mt-3 gap-1" onClick={() => append({ stage_name: "", user_story_texts: [{ value: "" }] })}><Plus className="h-4 w-4" />첫 번째 여정 추가</Button></CardContent></Card>
      )}
      {fields.map((field, idx) => (
        <Card key={field.id}>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => swap(idx, idx - 1)}><ChevronUp className="h-3 w-3" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" disabled={idx === fields.length - 1} onClick={() => swap(idx, idx + 1)}><ChevronDown className="h-3 w-3" /></Button>
              </div>
              <Badge variant="secondary" className="shrink-0">여정 {idx + 1}</Badge>
              <Input placeholder="여정명을 입력하세요" {...register(`stages.${idx}.stage_name`)} className="h-8 text-sm font-medium" />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => toggleCollapse(idx)}>{collapsed[idx] ? <ChevronRight className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}</Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(idx)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {errors.stages?.[idx]?.stage_name && <p className="mt-1 ml-12 text-xs text-destructive">{errors.stages[idx]?.stage_name?.message}</p>}
          </CardHeader>
          {!collapsed[idx] && <CardContent className="pt-0 px-4 pb-4"><Separator className="mb-3" /><UserStoryTexts stageIndex={idx} /></CardContent>}
        </Card>
      ))}
    </div>
  );
}

/* ── Step 3 ── */

const TAG_CATEGORIES = [
  { value: "기능" as const, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "사양" as const, color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "서비스" as const, color: "bg-green-100 text-green-800 border-green-200" },
  { value: "사업요소" as const, color: "bg-orange-100 text-orange-800 border-orange-200" },
] as const;

type ExistingTag = { category: string; tag_name: string; count: number };

function TechTagsStep() {
  const { control, getValues, watch } = useFormContext<StoryFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "tech_tags" });
  const [inputs, setInputs] = useState<Record<string, string>>({ 기능: "", 사양: "", 서비스: "", 사업요소: "" });
  const [existingTags, setExistingTags] = useState<ExistingTag[]>([]);
  const tagsWatch = watch("tech_tags");

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data: ExistingTag[]) => setExistingTags(data))
      .catch(() => {});
  }, []);

  const addTag = (cat: "기능" | "사양" | "서비스" | "사업요소", tagName?: string) => {
    const v = (tagName ?? inputs[cat]).trim();
    if (!v) return;
    const tags = getValues("tech_tags");
    if (fields.some((_, i) => tags[i].category === cat && tags[i].tag_name === v)) return;
    append({ category: cat, tag_name: v });
    if (!tagName) setInputs((p) => ({ ...p, [cat]: "" }));
  };

  const handleDrop = (cat: "기능" | "사양" | "서비스" | "사업요소", e: React.DragEvent) => {
    e.preventDefault();
    const tagName = e.dataTransfer.getData("text/plain");
    if (tagName) addTag(cat, tagName);
  };

  return (
    <Card>
      <CardHeader><CardTitle>기술 구현 요소</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="기능">
          <TabsList className="grid w-full grid-cols-4">
            {TAG_CATEGORIES.map((c) => {
              const cnt = tagsWatch?.filter((t) => t.category === c.value).length ?? 0;
              return <TabsTrigger key={c.value} value={c.value}>{c.value}{cnt > 0 && <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1 text-[10px]">{cnt}</Badge>}</TabsTrigger>;
            })}
          </TabsList>
          {TAG_CATEGORIES.map((cat) => {
            const inputVal = inputs[cat.value];
            const currentTags = tagsWatch ?? [];
            const suggestions = existingTags.filter(
              (et) =>
                et.category === cat.value &&
                (!inputVal || et.tag_name.toLowerCase().includes(inputVal.toLowerCase())) &&
                !currentTags.some((ct) => ct.category === cat.value && ct.tag_name === et.tag_name)
            );

            return (
              <TabsContent key={cat.value} value={cat.value} className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder={`${cat.value} 태그를 입력하세요`} value={inputVal} onChange={(e) => setInputs((p) => ({ ...p, [cat.value]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(cat.value); } }} className="h-9" />
                  <Button type="button" variant="outline" size="sm" onClick={() => addTag(cat.value)} className="shrink-0"><Plus className="mr-1 h-3.5 w-3.5" />추가</Button>
                </div>

                {suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/30 p-2 bg-muted/20">
                      <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">유형예시 :</span>
                      {suggestions.slice(0, 15).map((et) => (
                        <span
                          key={`${et.category}::${et.tag_name}`}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", et.tag_name)}
                          onClick={() => addTag(cat.value, et.tag_name)}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 px-2.5 py-0.5 text-xs font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors select-none"
                        >
                          {et.tag_name}
                          <span className="text-[10px] opacity-50">({et.count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="flex flex-wrap gap-2 min-h-[40px] rounded-md border border-transparent transition-colors"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary", "bg-primary/5"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-primary", "bg-primary/5"); }}
                  onDrop={(e) => { e.currentTarget.classList.remove("border-primary", "bg-primary/5"); handleDrop(cat.value, e); }}
                >
                  {fields.map((field, idx) => { const tag = tagsWatch?.[idx]; if (!tag || tag.category !== cat.value) return null; return (<span key={field.id} className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium", cat.color)}>{tag.tag_name}<button type="button" onClick={() => remove(idx)} className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"><X className="h-3 w-3" /></button></span>); })}
                  {currentTags.filter((t) => t.category === cat.value).length === 0 && <p className="text-xs text-muted-foreground py-2">아직 추가된 {cat.value} 태그가 없습니다. 위에서 클릭하거나 드래그하여 추가하세요.</p>}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ── Step 4 ── */

function ImageUploadStep() {
  const { setValue, watch } = useFormContext<StoryFormValues>();
  const supabase = createClient();
  const imageUrl = watch("reference_image_url");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("story-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("story-images").getPublicUrl(path);
      setValue("reference_image_url", publicUrl);
    } catch (err) { console.error("Upload error:", err); } finally { setUploading(false); }
  }, [supabase, setValue]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }, [uploadFile]);

  const removeImage = async () => {
    if (imageUrl) { try { const url = new URL(imageUrl); const m = url.pathname.match(/story-images\/(.+)/); if (m) await supabase.storage.from("story-images").remove([m[1]]); } catch { /* best-effort */ } }
    setValue("reference_image_url", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />참고 이미지</CardTitle></CardHeader>
      <CardContent>
        {imageUrl ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-lg border bg-muted aspect-video"><Image src={imageUrl} alt="참고 이미지" fill className="object-contain" unoptimized /></div>
            <Button type="button" variant="destructive" size="sm" onClick={removeImage} className="gap-1"><Trash2 className="h-4 w-4" />이미지 삭제</Button>
          </div>
        ) : (
          <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={cn("flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 transition-colors cursor-pointer", dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50")} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /> : <Upload className="h-10 w-10 text-muted-foreground" />}
            <p className="mt-3 text-sm font-medium">{uploading ? "업로드 중..." : "클릭하거나 이미지를 드래그하세요"}</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, GIF (최대 5MB)</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main exported form ── */

export type StoryFormMode = "create" | "edit";

export function StoryForm({
  mode,
  defaultValues,
  storyId,
}: {
  mode: StoryFormMode;
  defaultValues: StoryFormValues;
  storyId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === "create") {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
          const team = user.user_metadata?.team;
          const proposerLabel = team ? `${displayName} (${team})` : displayName;
          form.setValue("proposer_name", proposerLabel);
        }
      });
    }
  }, [supabase, form, mode]);

  const validateCurrentStep = async (): Promise<boolean> => {
    let fields: (keyof StoryFormValues)[] = [];
    if (step === 1) fields = ["title", "proposer_name"];
    else if (step === 2) fields = ["stages"];
    if (fields.length === 0) return true;
    return form.trigger(fields);
  };

  const goNext = async () => { if (await validateCurrentStep() && step < 4) setStep(step + 1); };
  const goPrev = () => { if (step > 1) setStep(step - 1); };

  const handleSave = async (status: "draft" | "submitted") => {
    if (status === "submitted") {
      if (!(await form.trigger())) {
        toast({ title: "입력 오류", description: "필수 항목을 확인해주세요.", variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    try {
      const values = form.getValues();
      const result = mode === "edit" && storyId
        ? await updateStory(storyId, { ...values, status })
        : await createStory({ ...values, status });

      if (result.error) {
        toast({ title: "저장 실패", description: result.error, variant: "destructive" });
        return;
      }
      toast({
        title: status === "draft" ? "임시 저장 완료" : "제출 완료",
        description: status === "draft" ? "스토리가 임시 저장되었습니다." : "스토리가 성공적으로 제출되었습니다.",
      });
      router.push("/stories");
    } catch {
      toast({ title: "오류 발생", description: "저장 중 문제가 발생했습니다.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{mode === "edit" ? "스토리 수정" : "새 User Story 작성"}</h2>
        </div>
        <StepIndicator current={step} onStepClick={setStep} />
        <div className="min-h-[400px]">
          {step === 1 && <BasicInfoStep />}
          {step === 2 && <StagesStep />}
          {step === 3 && <TechTagsStep />}
          {step === 4 && <ImageUploadStep />}
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <Button type="button" variant="outline" onClick={goPrev} disabled={step === 1}>이전</Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => handleSave("draft")} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}임시저장
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={goNext}>다음</Button>
            ) : (
              <Button type="button" onClick={() => handleSave("submitted")} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}제출
              </Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lightbulb, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { submitSuggestion } from "@/lib/suggestions";

export function SuggestionForm() {
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: submitSuggestion,
    onSuccess: () => {
      setMessage("");
      toast.success("شكرًا لك، تم إرسال اقتراحك.");
    },
    onError: () => toast.error("تعذر إرسال الاقتراح. حاول مرة أخرى."),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      toast.error("اكتب اقتراحًا من ٥ أحرف على الأقل.");
      return;
    }
    mutation.mutate(trimmed);
  }

  return (
    <Card className="gap-4 border border-border p-5 shadow-none ring-0">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lightbulb className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-bold text-card-foreground">شاركنا اقتراحك</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            اقتراحاتك تساعدنا على تطوير المنصة. لا يطلع عليها إلا فريق الإدارة.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          aria-label="اقتراحك"
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="اكتب اقتراحك هنا..."
          disabled={mutation.isPending}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {message.length}/2000
          </span>
          <Button
            type="submit"
            disabled={mutation.isPending || message.trim().length < 5}
          >
            <Send className="size-4" aria-hidden="true" />
            {mutation.isPending ? "جارٍ الإرسال..." : "إرسال الاقتراح"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

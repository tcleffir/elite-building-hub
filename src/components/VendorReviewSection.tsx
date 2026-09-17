import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Ticket } from "@/lib/mock-data";

interface VendorReviewSectionProps {
  ticket: Ticket;
}

const starLabels = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

const VendorReviewSection = ({ ticket }: VendorReviewSectionProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState(false);
  const [submitted, setSubmitted] = useState(!!ticket.satisfaction_rating);

  // Only show for completed tickets
  if (ticket.status !== 'completed') return null;

  // Already rated via satisfaction_rating
  if (submitted || ticket.satisfaction_rating) {
    const displayRating = ticket.satisfaction_rating || rating;
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={16} className="text-success" />
          <span className="text-sm font-semibold text-success">Avaliação enviada</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={18}
              className={star <= displayRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}
            />
          ))}
          <span className="text-sm font-semibold ml-2">{starLabels[displayRating]}</span>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="bg-amber-50/50 dark:bg-amber-900/5 border border-amber-200/50 dark:border-amber-800/20 rounded-xl p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Star size={16} className="text-amber-500 fill-amber-500" />
        <span className="text-sm font-semibold text-foreground">✅ Chamado concluído! Avalie o atendimento.</span>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`transition-colors ${
                star <= activeRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
        {activeRating > 0 && (
          <span className="text-sm font-medium text-muted-foreground ml-2">
            {starLabels[activeRating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Descreva sua experiência... (opcional, max 500 caracteres)"
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        className="min-h-[60px] text-sm"
      />
      <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>

      {/* Recommend */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="recommend"
          checked={recommend}
          onCheckedChange={(v) => setRecommend(!!v)}
        />
        <label htmlFor="recommend" className="text-sm text-foreground cursor-pointer">
          Recomendaria este fornecedor?
        </label>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="w-full premium-gradient gap-2"
      >
        <Star size={14} />
        Enviar Avaliação
      </Button>
    </div>
  );
};

export default VendorReviewSection;

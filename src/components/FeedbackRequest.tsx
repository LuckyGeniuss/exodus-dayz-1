import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Star, MessageSquare, ThumbsUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

const FEEDBACK_DELAY = 60000; // 60 seconds after order
const FEEDBACK_STORAGE_KEY = 'exodus_feedback_requested';

interface FeedbackRequestProps {
  orderId: string;
  orderAmount: number;
}

const FeedbackRequest = ({ orderId, orderAmount }: FeedbackRequestProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if we should show feedback request
    const checkFeedback = () => {
      const requested = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (requested) {
        const requestedOrders = JSON.parse(requested);
        if (requestedOrders.includes(orderId)) {
          return; // Already requested for this order
        }
      }

      // Show after delay
      const timer = setTimeout(() => {
        setOpen(true);
        // Mark as requested
        const existing = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify([...existing, orderId]));
      }, FEEDBACK_DELAY);

      return () => clearTimeout(timer);
    };

    if (orderId) {
      checkFeedback();
    }
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Оберіть оцінку');
      return;
    }

    setSubmitting(true);
    try {
      // Save feedback to notifications or a separate table
      await supabase.from('notifications').insert({
        user_id: user?.id,
        type: 'feedback_given',
        title: 'Дякуємо за відгук!',
        message: `Ви оцінили замовлення на ${rating} зірок`,
        data: {
          order_id: orderId,
          rating,
          feedback,
          amount: orderAmount
        }
      });

      toast.success('Дякуємо за ваш відгук!');
      setOpen(false);
    } catch (error) {
      toast.error('Помилка надсилання відгуку');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Як вам покупка?
          </DialogTitle>
          <DialogDescription>
            Допоможіть нам стати краще — оцініть ваш досвід
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Замовлення:</span>
            <Badge variant="secondary">#{orderId.slice(0, 8)}</Badge>
          </div>

          {/* Star Rating */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Ваша оцінка</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 ? '🎉 Чудово!' : 
                 rating === 4 ? '👍 Добре!' :
                 rating === 3 ? '😐 Нормально' :
                 rating === 2 ? '😕 Можна краще' :
                 '😔 Що пішло не так?'}
              </p>
            )}
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Textarea
              placeholder="Розкажіть детальніше про ваш досвід (необов'язково)..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {submitting ? 'Надсилання...' : 'Надіслати'}
            </Button>
            <Button variant="ghost" onClick={handleSkip}>
              <X className="h-4 w-4 mr-2" />
              Пропустити
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ваш відгук допоможе нам покращити сервіс
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackRequest;

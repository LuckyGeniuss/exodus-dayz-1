import { X, Scale, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CompareFloatingPanel = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">
            Порівняння ({compareItems.length}/4)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {compareItems.map((item) => (
            <div
              key={item.id}
              className="relative group"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover border border-border"
              />
              <button
                onClick={() => removeFromCompare(item.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - compareItems.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/30"
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCompare}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/compare')}
            disabled={compareItems.length < 2}
            className={cn(
              "gap-1",
              compareItems.length < 2 && "opacity-50"
            )}
          >
            Порівняти
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompareFloatingPanel;

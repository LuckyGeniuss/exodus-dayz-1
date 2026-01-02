import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, ImageIcon, GripVertical, Star } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface ProductImageManagerProps {
  productId: string;
  productName: string;
}

const ProductImageManager = ({ productId, productName }: ProductImageManagerProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: images, isLoading } = useQuery({
    queryKey: ['product-images-admin', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Get next display order
      const maxOrder = images?.reduce((max, img) => Math.max(max, img.display_order), 0) || 0;

      // Save to database
      const { error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          display_order: maxOrder + 1,
          is_primary: !images || images.length === 0,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images-admin', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      toast.success('Зображення завантажено');
    },
    onError: (error) => {
      toast.error('Помилка завантаження: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (image: ProductImage) => {
      // Extract file path from URL
      const urlParts = image.image_url.split('/product-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('product-images').remove([filePath]);
      }

      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images-admin', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      toast.success('Зображення видалено');
    },
    onError: (error) => {
      toast.error('Помилка видалення: ' + error.message);
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: string) => {
      // Remove primary from all
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Set new primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images-admin', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      toast.success('Головне зображення змінено');
    },
    onError: (error) => {
      toast.error('Помилка: ' + error.message);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Зображення">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Зображення товару</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          <div className="border-2 border-dashed rounded-lg p-4">
            <Label htmlFor={`upload-${productId}`} className="cursor-pointer">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Plus className="h-8 w-8" />
                )}
                <span>
                  {uploading ? 'Завантаження...' : 'Натисніть для додавання зображень'}
                </span>
              </div>
            </Label>
            <Input
              id={`upload-${productId}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {/* Images grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : images && images.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group rounded-lg overflow-hidden border"
                >
                  <img
                    src={image.image_url}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  
                  {image.is_primary && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Головне
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.is_primary && (
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setPrimaryMutation.mutate(image.id)}
                        disabled={setPrimaryMutation.isPending}
                        title="Зробити головним"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm('Видалити це зображення?')) {
                          deleteMutation.mutate(image);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Немає додаткових зображень
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImageManager;

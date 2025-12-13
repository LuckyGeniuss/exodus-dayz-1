import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/components/ProductCard';
import { productImages } from '@/data/productImages';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database products to Product type
      const transformedProducts: Product[] = (data || []).map((p) => ({
        id: String(p.id),
        name: p.name,
        price: Number(p.price),
        description: p.description || '',
        // Use local image if available, otherwise fallback to database URL
        image: productImages[p.id] || p.image || '/placeholder.svg',
        category: p.category,
      }));

      setProducts(transformedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Не вдалося завантажити товари');
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: fetchProducts };
};

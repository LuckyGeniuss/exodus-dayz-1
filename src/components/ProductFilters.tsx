import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest" | "popular" | "rating";
export type Category = "all" | "vip" | "clothing" | "transport" | "cosmetic" | "cassettes" | "custom" | "workshop";

interface ProductFiltersProps {
  onSortChange: (sort: SortOption) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  onCategoriesChange: (categories: Category[]) => void;
  maxPrice: number;
  currentSort: SortOption;
  currentPriceRange: [number, number];
  currentCategories: Category[];
  resultsCount: number;
}

const categories: { id: Category; label: string }[] = [
  { id: "vip", label: "VIP" },
  { id: "clothing", label: "Одяг" },
  { id: "transport", label: "Транспорт" },
  { id: "cosmetic", label: "Косметика" },
  { id: "cassettes", label: "Музичні кассети" },
  { id: "workshop", label: "Воркшоп" },
  { id: "custom", label: "Кастомні предмети" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Найновіші" },
  { value: "popular", label: "Популярні" },
  { value: "rating", label: "За рейтингом" },
  { value: "price-asc", label: "Ціна: від низької" },
  { value: "price-desc", label: "Ціна: від високої" },
  { value: "name-asc", label: "Назва: А-Я" },
  { value: "name-desc", label: "Назва: Я-А" },
];

const ProductFilters = ({
  onSortChange,
  onPriceRangeChange,
  onCategoriesChange,
  maxPrice,
  currentSort,
  currentPriceRange,
  currentCategories,
  resultsCount,
}: ProductFiltersProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>(currentPriceRange);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(currentCategories);

  useEffect(() => {
    setPriceRange(currentPriceRange);
  }, [currentPriceRange]);

  const handlePriceChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setPriceRange(newRange);
    onPriceRangeChange(newRange[0], newRange[1]);
  };

  const handleCategoryToggle = (categoryId: Category) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((c) => c !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newCategories);
    onCategoriesChange(newCategories);
  };

  const handleReset = () => {
    setPriceRange([0, maxPrice]);
    setSelectedCategories([]);
    onPriceRangeChange(0, maxPrice);
    onCategoriesChange([]);
    onSortChange("newest");
  };

  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    priceRange[0] > 0 || 
    priceRange[1] < maxPrice ||
    currentSort !== "newest";

  const FiltersContent = () => (
    <>
      {/* Sort */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Сортування</h3>
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentSort === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onSortChange(option.value)}
              className="w-full justify-start"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Діапазон цін</h3>
        <div className="px-2">
          <Slider
            value={[priceRange[0], priceRange[1]]}
            onValueChange={handlePriceChange}
            max={maxPrice}
            step={10}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{priceRange[0]} ₴</span>
            <span>{priceRange[1]} ₴</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Категорії</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label
                htmlFor={category.id}
                className="text-sm font-normal cursor-pointer"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={handleReset}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Скинути фільтри
        </Button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Фільтри
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {resultsCount} товарів
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FiltersContent />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Фільтри та сортування
              {hasActiveFilters && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Фільтри</SheetTitle>
              <SheetDescription>
                Знайдено {resultsCount} товарів
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default ProductFilters;

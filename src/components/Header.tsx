import { useState } from "react";
import { ShoppingCart, User, LogOut, Wallet, Package, Shield, Heart, Disc3, Headphones } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { useWishlist } from "@/hooks/useWishlist";
import NotificationCenter from "./NotificationCenter";
import FortuneWheel from "./FortuneWheel";
import MobileMenu from "./MobileMenu";
import ThemeSwitcher from "./ThemeSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onCartOpen?: () => void;
  cartItemCount?: number;
}

const Header = ({ onCartOpen, cartItemCount = 0 }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [fortuneWheelOpen, setFortuneWheelOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Menu */}
          <MobileMenu onFortuneWheelOpen={() => setFortuneWheelOpen(true)} />
          
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-primary">EXODUS</span>
              <span className="text-foreground"> DayZ</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Головна
            </Link>
            <a href="/#shop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Магазин
            </a>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Про сервер
            </Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Контакти
            </Link>
            <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {user && <NotificationCenter />}
            
            {/* Fortune Wheel Button */}
            {user && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFortuneWheelOpen(true)}
                className="relative animate-pulse hover:animate-none"
                title="Колесо фортуни"
              >
                <Disc3 className="h-5 w-5 text-primary" />
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/wishlist')}
              className="relative"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {wishlist.length > 9 ? '9+' : wishlist.length}
                </span>
              )}
            </Button>
            
            {onCartOpen && (
              <Button 
                variant="outline" 
                size="icon" 
                className="relative"
                onClick={onCartOpen}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Профіль
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Адмін панель
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/balance')}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Баланс
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Package className="mr-2 h-4 w-4" />
                    Мої замовлення
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Збережені товари
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/support')}>
                    <Headphones className="mr-2 h-4 w-4" />
                    Підтримка
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Вийти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => navigate('/auth')}>
                Увійти
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Fortune Wheel Modal */}
      <FortuneWheel open={fortuneWheelOpen} onOpenChange={setFortuneWheelOpen} />
    </header>
  );
};

export default Header;

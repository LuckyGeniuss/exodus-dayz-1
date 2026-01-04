import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Home, ShoppingBag, Info, Phone, User, LogOut, Wallet, Package, Heart, Headphones, Shield, Disc3 } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";

interface MobileMenuProps {
  onFortuneWheelOpen?: () => void;
}

const MobileMenu = ({ onFortuneWheelOpen }: MobileMenuProps) => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left">
            <span className="text-primary">EXODUS</span> DayZ
          </SheetTitle>
        </SheetHeader>
        
        <nav className="mt-8 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            className="justify-start gap-3 h-12"
            onClick={() => handleNavigate('/')}
          >
            <Home className="h-5 w-5" />
            Головна
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start gap-3 h-12"
            onClick={() => {
              setOpen(false);
              window.location.href = '/#shop';
            }}
          >
            <ShoppingBag className="h-5 w-5" />
            Магазин
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start gap-3 h-12"
            onClick={() => handleNavigate('/about')}
          >
            <Info className="h-5 w-5" />
            Про сервер
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start gap-3 h-12"
            onClick={() => handleNavigate('/contact')}
          >
            <Phone className="h-5 w-5" />
            Контакти
          </Button>

          <Separator className="my-4" />

          {user ? (
            <>
              <Button 
                variant="ghost" 
                className="justify-start gap-3 h-12"
                onClick={() => handleNavigate('/profile')}
              >
                <User className="h-5 w-5" />
                Профіль
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start gap-3 h-12"
                onClick={() => handleNavigate('/balance')}
              >
                <Wallet className="h-5 w-5" />
                Баланс
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start gap-3 h-12"
                onClick={() => handleNavigate('/orders')}
              >
                <Package className="h-5 w-5" />
                Мої замовлення
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start gap-3 h-12"
                onClick={() => handleNavigate('/wishlist')}
              >
                <Heart className="h-5 w-5" />
                Збережені товари
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start gap-3 h-12"
                onClick={() => handleNavigate('/support')}
              >
                <Headphones className="h-5 w-5" />
                Підтримка
              </Button>

              {onFortuneWheelOpen && (
                <Button 
                  variant="ghost" 
                  className="justify-start gap-3 h-12 text-primary"
                  onClick={() => {
                    setOpen(false);
                    onFortuneWheelOpen();
                  }}
                >
                  <Disc3 className="h-5 w-5" />
                  Колесо фортуни
                </Button>
              )}

              {isAdmin && (
                <>
                  <Separator className="my-4" />
                  <Button 
                    variant="ghost" 
                    className="justify-start gap-3 h-12 text-amber-500"
                    onClick={() => handleNavigate('/admin')}
                  >
                    <Shield className="h-5 w-5" />
                    Адмін панель
                  </Button>
                </>
              )}

              <Separator className="my-4" />
              
              <Button 
                variant="ghost" 
                className="justify-start gap-3 h-12 text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Вийти
              </Button>
            </>
          ) : (
            <Button 
              className="justify-start gap-3 h-12"
              onClick={() => handleNavigate('/auth')}
            >
              <User className="h-5 w-5" />
              Увійти
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;

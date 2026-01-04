import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-primary">EXODUS</span> DayZ
            </h3>
            <p className="text-sm text-muted-foreground">
              Приватні DayZ PVE/PVP сервери з кастомними модами та VIP-опціями для гравців.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Навігація</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Головна</Link></li>
              <li><a href="/#shop" className="hover:text-foreground transition-colors">Магазин</a></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">Про сервер</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Контакти</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Категорії</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#shop?categories=vip" className="hover:text-foreground transition-colors">VIP Пакети</a></li>
              <li><a href="/#shop?categories=transport" className="hover:text-foreground transition-colors">Транспорт</a></li>
              <li><a href="/#shop?categories=kits" className="hover:text-foreground transition-colors">Набори</a></li>
              <li><a href="/#shop?categories=materials" className="hover:text-foreground transition-colors">Будматеріали</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Підтримка</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-foreground transition-colors">Підтримка</Link></li>
              <li><a href="https://discord.gg/exodus" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">Правила сервера</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Exodus DayZ. Всі права захищені. Відповідає правилам монетизації Bohemia Interactive.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

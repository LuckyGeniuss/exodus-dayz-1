import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, HelpCircle, CreditCard, Package, Shield, Users, Settings } from "lucide-react";

const faqData = [
  {
    category: "Загальні питання",
    icon: HelpCircle,
    items: [
      {
        question: "Що таке Exodus DayZ?",
        answer: "Exodus DayZ — це приватні PVE/PVP сервери DayZ з унікальними кастомними модами, створені для справжніх фанатів постапокаліптичного виживання. Ми надаємо високоякісний ігровий досвід з VIP-опціями та ексклюзивними косметичними предметами."
      },
      {
        question: "Чи відповідає магазин правилам Bohemia Interactive?",
        answer: "Так, всі товари в нашому магазині є виключно косметичними та не впливають на баланс гри. Ми суворо дотримуємося правил монетизації Bohemia Interactive — жодного pay-to-win!"
      },
      {
        question: "Як підключитися до серверів?",
        answer: "Для підключення до серверів вам потрібно: 1) Встановити DayZ через Steam; 2) Підписатися на наші моди у Steam Workshop; 3) Знайти сервер 'Exodus' у списку серверів або підключитися через наш Discord."
      }
    ]
  },
  {
    category: "Оплата та баланс",
    icon: CreditCard,
    items: [
      {
        question: "Які методи оплати доступні?",
        answer: "Ми приймаємо оплату карткою (Visa/Mastercard через WayForPay), криптовалютою (USDT TRC-20 через NOWPayments), а також оплату з внутрішнього балансу акаунта."
      },
      {
        question: "Як поповнити баланс?",
        answer: "Перейдіть у розділ 'Баланс' у вашому профілі, введіть суму поповнення та оберіть зручний спосіб оплати. Кошти зараховуються автоматично після підтвердження платежу."
      },
      {
        question: "Чи можна повернути кошти?",
        answer: "Повернення можливе протягом 14 днів з моменту покупки, якщо товар ще не був активований на сервері. Для повернення зверніться до служби підтримки."
      },
      {
        question: "Що таке кешбек?",
        answer: "Кешбек — це повернення частини витрачених коштів на ваш баланс. Розмір кешбеку залежить від вашого рівня лояльності та збільшується з кожною покупкою."
      }
    ]
  },
  {
    category: "Доставка товарів",
    icon: Package,
    items: [
      {
        question: "Як швидко я отримаю товар?",
        answer: "Всі товари доставляються миттєво після підтвердження оплати. Для автоматичної доставки підключіть Steam ID у вашому профілі."
      },
      {
        question: "Що робити, якщо товар не доставлено?",
        answer: "Якщо протягом 15 хвилин після оплати товар не з'явився, перевірте статус замовлення у розділі 'Мої замовлення'. Якщо проблема залишається — зверніться до підтримки."
      },
      {
        question: "Чи можна передати товар іншому гравцю?",
        answer: "Деякі товари можна передавати іншим гравцям. Ця опція доступна для косметичних предметів, але недоступна для VIP-статусів та пріоритетів."
      }
    ]
  },
  {
    category: "Акаунт та безпека",
    icon: Shield,
    items: [
      {
        question: "Як змінити пароль?",
        answer: "Для зміни пароля перейдіть на сторінку авторизації та натисніть 'Забули пароль?'. На вашу email буде надіслано посилання для скидання пароля."
      },
      {
        question: "Як підключити Steam?",
        answer: "У вашому профілі натисніть 'Підключити Steam' та авторизуйтесь через Steam. Після цього система автоматично прив'яже ваш Steam ID для доставки товарів."
      },
      {
        question: "Чи можна видалити акаунт?",
        answer: "Так, для видалення акаунта зверніться до служби підтримки. Зверніть увагу, що всі ваші покупки та баланс будуть втрачені безповоротно."
      }
    ]
  },
  {
    category: "Програма лояльності",
    icon: Users,
    items: [
      {
        question: "Як працює програма лояльності?",
        answer: "За кожну покупку ви отримуєте кешбек на баланс. Чим більше ви витрачаєте, тим вищий ваш рівень лояльності та більший відсоток кешбеку (від 1% до 10%)."
      },
      {
        question: "Що таке реферальна програма?",
        answer: "Запрошуйте друзів за вашим реферальним посиланням. Коли друг зробить першу покупку, ви обидва отримаєте бонус 50₴ на баланс."
      },
      {
        question: "Як отримати знижку для ветеранів?",
        answer: "Ветерани АТО/ООС отримують постійну знижку 10% на всі товари. Для підтвердження статусу зверніться до підтримки з документами."
      }
    ]
  },
  {
    category: "Технічні питання",
    icon: Settings,
    items: [
      {
        question: "Сайт не працює, що робити?",
        answer: "Спробуйте оновити сторінку (Ctrl+F5), очистити кеш браузера або використати інший браузер. Якщо проблема залишається — зверніться до підтримки."
      },
      {
        question: "Чи є мобільний додаток?",
        answer: "Наш сайт є PWA (Progressive Web App) — ви можете встановити його на телефон як додаток прямо з браузера для швидкого доступу."
      },
      {
        question: "Як включити сповіщення?",
        answer: "У вашому профілі є розділ 'Push-сповіщення'. Увімкніть їх, щоб отримувати інформацію про акції, статус замовлень та відповіді підтримки."
      }
    ]
  }
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return faqData;

    const query = searchQuery.toLowerCase();
    return faqData
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchQuery]);

  const totalQuestions = faqData.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Часті <span className="text-primary">питання</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Знайдіть відповіді на найпоширеніші питання про наш магазин та сервери
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Пошук по FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <Badge variant="secondary">{totalQuestions} питань</Badge>
              <Badge variant="secondary">{faqData.length} категорій</Badge>
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {filteredData.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Нічого не знайдено</p>
                  <p className="text-muted-foreground">
                    Спробуйте змінити пошуковий запит або{" "}
                    <a href="/support" className="text-primary hover:underline">
                      зверніться до підтримки
                    </a>
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredData.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        {category.category}
                        <Badge variant="outline" className="ml-auto">
                          {category.items.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.items.map((item, index) => (
                          <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="border-b last:border-0"
                          >
                            <AccordionTrigger className="text-left hover:text-primary">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Still need help */}
          <Card className="mt-12 border-primary/50">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-bold mb-2">Не знайшли відповідь?</h3>
              <p className="text-muted-foreground mb-4">
                Наша команда підтримки завжди готова допомогти
              </p>
              <div className="flex justify-center gap-4">
                <a href="/support">
                  <Badge className="text-sm py-2 px-4 cursor-pointer hover:bg-primary/90">
                    Створити тікет
                  </Badge>
                </a>
                <a href="/contact">
                  <Badge variant="outline" className="text-sm py-2 px-4 cursor-pointer">
                    Контакти
                  </Badge>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;

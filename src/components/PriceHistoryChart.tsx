import { useState } from "react";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Bell, BellOff, LineChart, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number;
  productName: string;
}

const PriceHistoryChart = ({ productId, currentPrice, productName }: PriceHistoryChartProps) => {
  const { user } = useAuth();
  const { 
    priceHistory, 
    historyLoading, 
    priceAlert, 
    priceTrend,
    lowestPrice,
    highestPrice,
    createAlert,
    removeAlert,
    isCreatingAlert 
  } = usePriceHistory(productId);

  const [targetPrice, setTargetPrice] = useState<string>((currentPrice * 0.9).toFixed(0));
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const chartData = priceHistory.map(entry => ({
    date: new Date(entry.changed_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
    price: entry.new_price
  }));

  // Add current price if no history
  if (chartData.length === 0) {
    chartData.push({
      date: new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
      price: currentPrice
    });
  }

  const handleCreateAlert = async () => {
    await createAlert(parseFloat(targetPrice));
    setShowAlertDialog(false);
  };

  if (historyLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LineChart className="h-5 w-5 text-primary" />
            Історія ціни
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {priceTrend !== 0 && (
              <Badge variant={priceTrend < 0 ? "default" : "destructive"} className="flex items-center gap-1">
                {priceTrend < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                {Math.abs(priceTrend).toFixed(0)} ₴
              </Badge>
            )}
            
            {user && (
              <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
                <DialogTrigger asChild>
                  {priceAlert ? (
                    <Button variant="outline" size="sm" onClick={() => removeAlert()}>
                      <BellOff className="h-4 w-4 mr-1" />
                      Відписатись
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Bell className="h-4 w-4 mr-1" />
                      Слідкувати за ціною
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Підписка на зниження ціни</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Ви отримаєте сповіщення коли ціна на "{productName}" знизиться до вказаного рівня.
                    </p>
                    <div className="space-y-2">
                      <Label>Бажана ціна (₴)</Label>
                      <Input
                        type="number"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Введіть ціну"
                      />
                      <p className="text-xs text-muted-foreground">
                        Поточна ціна: {currentPrice.toFixed(0)} ₴
                      </p>
                    </div>
                    <Button onClick={handleCreateAlert} disabled={isCreatingAlert} className="w-full">
                      {isCreatingAlert ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Bell className="h-4 w-4 mr-2" />
                      )}
                      Підписатись
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {priceAlert && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Ви отримаєте сповіщення при ціні {priceAlert.target_price.toFixed(0)} ₴
            </p>
          </div>
        )}

        {chartData.length > 1 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}₴`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(0)} ₴`, 'Ціна']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Немає даних про зміну ціни</p>
          </div>
        )}

        {(lowestPrice || highestPrice) && priceHistory.length > 1 && (
          <div className="mt-4 flex gap-4 text-sm">
            {lowestPrice && (
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Мін:</span>
                <span className="font-medium text-green-500">{lowestPrice.toFixed(0)} ₴</span>
              </div>
            )}
            {highestPrice && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">Макс:</span>
                <span className="font-medium text-red-500">{highestPrice.toFixed(0)} ₴</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;

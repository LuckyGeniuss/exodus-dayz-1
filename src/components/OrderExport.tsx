import { Button } from "./ui/button";
import { Download, FileText, Table } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  order_items?: Array<{
    product_name: string;
    product_price: number;
    quantity: number;
  }>;
}

interface OrderExportProps {
  orders: Order[];
}

const OrderExport = ({ orders }: OrderExportProps) => {
  const exportToCSV = () => {
    const headers = ['ID', 'Дата', 'Товари', 'Сума', 'Знижка', 'До сплати', 'Метод оплати', 'Статус'];
    
    const rows = orders.map((order) => [
      order.id.slice(0, 8),
      format(new Date(order.created_at), 'dd.MM.yyyy HH:mm'),
      order.order_items?.map(item => `${item.product_name} x${item.quantity}`).join('; ') || '',
      order.total_amount.toFixed(2),
      order.discount_amount?.toFixed(2) || '0.00',
      order.final_amount.toFixed(2),
      order.payment_method,
      order.payment_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const data = orders.map((order) => ({
      id: order.id,
      date: order.created_at,
      items: order.order_items?.map(item => ({
        name: item.product_name,
        price: item.product_price,
        quantity: item.quantity
      })),
      total: order.total_amount,
      discount: order.discount_amount,
      finalAmount: order.final_amount,
      paymentMethod: order.payment_method,
      status: order.payment_status
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

  const printOrders = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Мої замовлення - Exodus DayZ</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #ea580c; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .status-completed { color: green; }
          .status-pending { color: orange; }
          .status-failed { color: red; }
        </style>
      </head>
      <body>
        <h1>Exodus DayZ - Мої замовлення</h1>
        <p>Експортовано: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: uk })}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Товари</th>
              <th>Сума</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${order.id.slice(0, 8)}</td>
                <td>${format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}</td>
                <td>${order.order_items?.map(item => `${item.product_name} x${item.quantity}`).join(', ') || '-'}</td>
                <td>${order.final_amount.toFixed(2)} ₴</td>
                <td class="status-${order.payment_status}">${order.payment_status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          © 2025 Exodus DayZ. Всі права захищені.
        </p>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (orders.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Експорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="h-4 w-4 mr-2" />
          Експорт CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Експорт JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={printOrders}>
          <FileText className="h-4 w-4 mr-2" />
          Друк
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrderExport;

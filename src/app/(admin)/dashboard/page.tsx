import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
  description: "InvoiceGen admin dashboard for managing your application",
};

export default async function DashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "Rp 45,231,000",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Users",
      value: "2,350",
      change: "+180",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Orders",
      value: "12,234",
      change: "+19%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-purple-600",
    },
    {
      title: "Conversion Rate",
      value: "3.2%",
      change: "-0.4%",
      trend: "down",
      icon: Activity,
      color: "text-orange-600",
    },
  ];

  const recentActivities = [
    { id: 1, user: "John Doe", action: "membuat pesanan baru", time: "2 menit yang lalu" },
    { id: 2, user: "Jane Smith", action: "mengupdate profil", time: "5 menit yang lalu" },
    { id: 3, user: "Bob Johnson", action: "menyelesaikan pembayaran", time: "10 menit yang lalu" },
    {
      id: 4,
      user: "Alice Brown",
      action: "mendaftar sebagai user baru",
      time: "15 menit yang lalu",
    },
    { id: 5, user: "Charlie Wilson", action: "mengajukan refund", time: "20 menit yang lalu" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Selamat datang kembali! Berikut ringkasan aktivitas hari ini.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>
            <Eye className="h-4 w-4 mr-2" />
            Lihat Laporan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span
                  className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground ml-1">dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Grafik pendapatan dalam 12 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chart akan ditampilkan di sini</p>
                <p className="text-sm text-muted-foreground">
                  Integrasi dengan library chart seperti Recharts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Aktivitas pengguna dalam 30 menit terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Aksi cepat yang sering digunakan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Users className="h-6 w-6 mb-2" />
              Kelola User
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <ShoppingCart className="h-6 w-6 mb-2" />
              Lihat Pesanan
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <BarChart3 className="h-6 w-6 mb-2" />
              Analytics
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Activity className="h-6 w-6 mb-2" />
              Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
